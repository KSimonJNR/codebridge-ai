import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Model fallback cascade: primary model followed by stable flash fallbacks
const CANDIDATE_MODELS = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
const MAX_ATTEMPTS_PER_MODEL = 3;
const BASE_BACKOFF_DELAY_MS = 1000;
const MAX_BACKOFF_WAIT_MS = 5000;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'MY_GEMINI_API_KEY' || apiKey === 'your_gemini_api_key_here') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function parseGeminiError(err: unknown): { status?: number; message: string; rawError: unknown } {
  if (!err) return { message: 'Unknown error', rawError: err };
  const e = err as any;
  let status = e.status || e.code || e.statusCode;
  let message = e.message || String(err);

  // If the error message embeds a JSON payload, parse code & message
  if (typeof message === 'string' && message.includes('{')) {
    try {
      const start = message.indexOf('{');
      const end = message.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        const parsed = JSON.parse(message.substring(start, end + 1));
        if (parsed.error) {
          if (parsed.error.code) status = Number(parsed.error.code);
          if (parsed.error.message) message = parsed.error.message;
        }
      }
    } catch {
      // ignore JSON parse failure
    }
  }

  return { status: typeof status === 'number' ? status : undefined, message, rawError: err };
}

function isTransientError(status?: number, message?: string): boolean {
  // 503 Service Unavailable, 429 Resource Exhausted / Rate Limit, 500/502/504 Server Errors
  if (status === 503 || status === 429 || status === 500 || status === 502 || status === 504) {
    return true;
  }
  if (message) {
    const lower = message.toLowerCase();
    if (
      lower.includes('high demand') ||
      lower.includes('unavailable') ||
      lower.includes('resource exhausted') ||
      lower.includes('rate limit') ||
      lower.includes('overloaded') ||
      lower.includes('timeout') ||
      lower.includes('econnreset') ||
      lower.includes('temporarily')
    ) {
      return true;
    }
  }
  return false;
}

function isPermanentClientError(status?: number): boolean {
  // 400 (Bad Request), 401 (Invalid API Key), 403 (Permission Denied)
  return status === 400 || status === 401 || status === 403;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Executes a Gemini request with:
 * 1. Exponential backoff retry (up to 3 attempts) for transient errors (503, 429, 5xx).
 * 2. Automatic fallback across candidate models if the primary model remains unavailable.
 * 3. Immediate termination without retry for client errors (400, 401, 403).
 */
async function executeWithRetryAndFallback(
  ai: GoogleGenAI,
  callFn: (modelName: string) => Promise<any>
): Promise<{ result: any; usedModel: string }> {
  let lastError: any = null;
  let lastStatus: number | undefined;
  let lastMessage = '';

  for (const model of CANDIDATE_MODELS) {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS_PER_MODEL; attempt++) {
      try {
        const result = await callFn(model);
        return { result, usedModel: model };
      } catch (err: unknown) {
        lastError = err;
        const { status, message } = parseGeminiError(err);
        lastStatus = status;
        lastMessage = message;

        console.warn(`[Gemini API] Model '${model}' attempt ${attempt}/${MAX_ATTEMPTS_PER_MODEL} failed: [${status || 'NoStatus'}] ${message}`);

        // Never retry permanent client errors (e.g. invalid key, permission denied, malformed request)
        if (isPermanentClientError(status)) {
          throw err;
        }

        // If model is 404 (not supported for this account / deprecated), skip to next candidate model
        if (status === 404) {
          console.warn(`[Gemini API] Model '${model}' returned 404 (Not Found). Switching to fallback model...`);
          break;
        }

        // Check if error is transient (503 high demand, 429 rate limit, 5xx server error)
        if (isTransientError(status, message)) {
          if (attempt < MAX_ATTEMPTS_PER_MODEL) {
            // Exponential backoff with jitter: 1s -> 2s -> 4s, capped at MAX_BACKOFF_WAIT_MS
            const exponentialDelay = BASE_BACKOFF_DELAY_MS * Math.pow(2, attempt - 1);
            const jitter = Math.random() * 400;
            const delay = Math.min(exponentialDelay + jitter, MAX_BACKOFF_WAIT_MS);

            console.log(`[Gemini API] Transient error (${status || 'high demand'}). Retrying model '${model}' in ${Math.round(delay)}ms...`);
            await sleep(delay);
            continue;
          } else {
            console.warn(`[Gemini API] Exhausted ${MAX_ATTEMPTS_PER_MODEL} attempts for '${model}'. Attempting fallback model...`);
            break; // Try next fallback model in CANDIDATE_MODELS
          }
        }

        // For other non-transient errors, break to fallback or throw
        break;
      }
    }
  }

  // If all candidate models and retries failed:
  console.error('[Gemini API] All models and retry attempts failed.', lastStatus, lastMessage);
  throw lastError;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '10mb' }));

  // Status check endpoint
  app.get('/api/status', (_req, res) => {
    const isConfigured = Boolean(
      process.env.GEMINI_API_KEY &&
      process.env.GEMINI_API_KEY.trim() !== '' &&
      process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY' &&
      process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here'
    );
    res.json({
      configured: isConfigured,
      model: CANDIDATE_MODELS[0],
      fallbackModels: CANDIDATE_MODELS.slice(1),
      ready: true,
    });
  });

  // Feature 1: AI Code Explainer endpoint
  app.post('/api/explain-code', async (req, res) => {
    try {
      const { code, language, context } = req.body;

      if (!code || typeof code !== 'string' || !code.trim()) {
        return res.status(400).json({ error: 'Please provide valid code to explain.' });
      }

      const ai = getGeminiClient();
      if (!ai) {
        return res.status(503).json({
          error: 'GEMINI_API_KEY is not configured on the server. Please add your Gemini API key in the AI Studio Secrets panel or .env file.',
          keyMissing: true
        });
      }

      const prompt = `You are a patient, encouraging open-source mentor at CodeBridge AI helping beginners and Hacktoberfest participants understand code.
Programming Language: ${language || 'Auto-detect'}
${context ? `Additional Context from repository: ${context}\n` : ''}

Code to explain:
\`\`\`${language || ''}
${code.trim()}
\`\`\`

Explain this code clearly for an open-source newcomer. Follow the JSON response schema strictly:
- summary: A plain-English overview of what this code does and its high-level architecture/mental model.
- importantLines: 2-5 key lines or blocks, with the exact code snippet and why it matters.
- potentialBugs: Common pitfalls, edge cases, subtle bugs, or performance improvements that a contributor should watch out for.
- example: A runnable usage example, test scenario, or input/output demonstration.
- mentorTips: 2-3 quick open-source tips (e.g. how maintainers usually structure tests or style this pattern).`;

      const { result: response, usedModel } = await executeWithRetryAndFallback(ai, async (modelName) => {
        return await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                summary: {
                  type: Type.STRING,
                  description: 'Beginner-friendly explanation of what the code achieves.'
                },
                importantLines: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      codeSnippet: { type: Type.STRING },
                      explanation: { type: Type.STRING }
                    },
                    required: ['codeSnippet', 'explanation']
                  }
                },
                potentialBugs: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      explanation: { type: Type.STRING },
                      severity: { type: Type.STRING, description: 'warning, tip, or critical' }
                    },
                    required: ['title', 'explanation', 'severity']
                  }
                },
                example: {
                  type: Type.STRING,
                  description: 'A concise usage example or input/output demonstration'
                },
                mentorTips: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Tips for open source maintainability or tests'
                }
              },
              required: ['summary', 'importantLines', 'potentialBugs', 'example', 'mentorTips']
            }
          }
        });
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Empty response received from Gemini.');
      }

      const data = JSON.parse(responseText);
      data._meta = { modelUsed: usedModel };
      return res.json(data);
    } catch (err: unknown) {
      console.error('Error in /api/explain-code:', err);
      const { status, message } = parseGeminiError(err);
      
      const userMessage = isTransientError(status, message)
        ? 'The AI model is temporarily experiencing high traffic across available endpoints. Please wait a few moments and try again.'
        : `Failed to analyze code: ${message}`;

      return res.status(status && status >= 400 && status < 600 ? status : 503).json({
        error: userMessage,
        details: message
      });
    }
  });

  // Feature 2: GitHub Issue Helper endpoint
  app.post('/api/solve-issue', async (req, res) => {
    try {
      const { issueTitle, issueBody, issueUrl, repoContext } = req.body;

      if (!issueBody || typeof issueBody !== 'string' || !issueBody.trim()) {
        return res.status(400).json({ error: 'Please provide the GitHub issue description.' });
      }

      const ai = getGeminiClient();
      if (!ai) {
        return res.status(503).json({
          error: 'GEMINI_API_KEY is not configured on the server. Please add your Gemini API key in the AI Studio Secrets panel or .env file.',
          keyMissing: true
        });
      }

      const prompt = `You are an experienced open-source maintainer and friendly Hacktoberfest coach.
A contributor wants to work on this GitHub issue:
Issue Title: ${issueTitle || 'Untitled Issue'}
${issueUrl ? `GitHub Issue URL: ${issueUrl}\n` : ''}${repoContext ? `Repository Context / Stack: ${repoContext}\n` : ''}
Issue Description:
"""
${issueBody.trim()}
"""

Deconstruct this issue so an open-source beginner can tackle it confidently without feeling overwhelmed.
Provide a clear, realistic resolution blueprint following the JSON schema:
1. plainEnglishProblem: What the actual bug or feature request is in plain, non-jargon terms for a beginner.
2. likelyLanguage: The primary programming language or framework most likely involved (e.g. "TypeScript / React", "Python", "Go", "Java").
3. difficultyLevel: "Beginner-Friendly", "Intermediate", or "Advanced".
4. difficultyReason: A 1-sentence rationale for the difficulty rating.
5. relevantSkills: 3-5 specific technical skills needed (e.g. "Event Handling", "CSS Responsive Media Queries", "REST APIs").
6. importantConcepts: 3-5 key architectural or programming concepts to understand before solving.
7. preInvestigationQuestions: 3-5 specific questions the contributor should investigate in the repository files BEFORE changing code (e.g. "Where is the event listener registered?", "Are there existing unit tests for this component?").
8. stepByStepPlan: An ordered list of actionable steps to locate the relevant files, implement the solution, and test.
9. checklist: An array of 4-6 concise task items (strings) that a developer can check off as they complete each phase of investigation and implementation.
10. howToVerify: How to test the change locally before pushing (e.g. unit tests, manual checks, edge cases).
11. samplePrTitle: A recommended conventional commit PR title (e.g., "fix(modal): close dialog on ESC key press").
12. samplePrBody: A clean PR markdown description template ready to paste into GitHub.`;

      const { result: response, usedModel } = await executeWithRetryAndFallback(ai, async (modelName) => {
        return await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                plainEnglishProblem: { type: Type.STRING },
                likelyLanguage: { type: Type.STRING },
                difficultyLevel: { type: Type.STRING },
                difficultyReason: { type: Type.STRING },
                relevantSkills: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                importantConcepts: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                preInvestigationQuestions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                stepByStepPlan: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      stepNumber: { type: Type.INTEGER },
                      title: { type: Type.STRING },
                      action: { type: Type.STRING },
                      tips: { type: Type.STRING }
                    },
                    required: ['stepNumber', 'title', 'action']
                  }
                },
                checklist: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                howToVerify: { type: Type.STRING },
                samplePrTitle: { type: Type.STRING },
                samplePrBody: { type: Type.STRING }
              },
              required: [
                'plainEnglishProblem',
                'likelyLanguage',
                'difficultyLevel',
                'difficultyReason',
                'relevantSkills',
                'importantConcepts',
                'preInvestigationQuestions',
                'stepByStepPlan',
                'checklist',
                'howToVerify',
                'samplePrTitle',
                'samplePrBody'
              ]
            }
          }
        });
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Empty response received from Gemini.');
      }

      const data = JSON.parse(responseText);
      data._meta = { modelUsed: usedModel };
      return res.json(data);
    } catch (err: unknown) {
      console.error('Error in /api/solve-issue:', err);
      const { status, message } = parseGeminiError(err);

      const userMessage = isTransientError(status, message)
        ? 'The AI model is temporarily experiencing high traffic across available endpoints. Please wait a few moments and try again.'
        : `Failed to analyze GitHub issue: ${message}`;

      return res.status(status && status >= 400 && status < 600 ? status : 503).json({
        error: userMessage,
        details: message
      });
    }
  });

  // Feature 4: AI Project Idea Generator endpoint
  app.post('/api/generate-ideas', async (req, res) => {
    try {
      const {
        experience = 'Beginner',
        language = 'JavaScript',
        interests = 'Community Tools',
        projectType = 'Web app',
        customIdeaDescription = ''
      } = req.body;

      // Validation
      const validExperiences = ['Beginner', 'Intermediate', 'Advanced'];
      const validLanguages = ['Python', 'JavaScript', 'TypeScript', 'Java', 'Other'];
      const validProjectTypes = ['Web app', 'AI assistant', 'Developer tool', 'Automation'];

      const sanitizedExperience = validExperiences.includes(experience) ? experience : 'Beginner';
      const sanitizedLanguage = validLanguages.includes(language) ? language : 'JavaScript';
      const sanitizedProjectType = validProjectTypes.includes(projectType) ? projectType : 'Web app';
      const sanitizedInterests = typeof interests === 'string' && interests.trim() ? interests.trim() : 'Developer Tooling & Community Tools';

      const ai = getGeminiClient();
      if (!ai) {
        return res.status(503).json({
          error: 'GEMINI_API_KEY is not configured on the server. Please add your Gemini API key in the AI Studio Secrets panel or .env file.',
          keyMissing: true
        });
      }

      const prompt = `You are a friendly, experienced open-source mentor and Hacktoberfest project advisor.
A developer is looking for practical, engaging open-source project ideas to build and share for Hacktoberfest.

Contributor Profile & Preferences:
- Experience Level: ${sanitizedExperience}
- Preferred Programming Language: ${sanitizedLanguage}
- Domain / Interests: ${sanitizedInterests}
- Project Type: ${sanitizedProjectType}
${customIdeaDescription && customIdeaDescription.trim() ? `- Contributor's Custom Vision / Notes: "${customIdeaDescription.trim()}"\n` : ''}

Generate exactly THREE (3) distinct, realistic, portfolio-worthy open-source project ideas tailored to their skill level and preferred language.
Each project must follow the JSON schema strictly and include:
1. title: Creative, memorable open-source project name.
2. shortDescription: 1-2 sentence compelling hook explaining what the project is.
3. problemSolved: Clear explanation of the real-world problem or developer pain point it addresses.
4. targetAudience: Specific users or communities who will benefit from this project (e.g. students, remote teams, open-source maintainers).
5. suggestedTechnologies: 3-5 specific libraries, frameworks, or tools suitable for the stack.
6. coreFeatures: 3-5 concrete core features that define the initial release.
7. mvpRoadmap: 3-4 progressive development milestones from initial setup to public release.
8. aiFeature: One practical, suitable AI feature that enhances the project when relevant (e.g. automated tagging, smart search, natural language parser, error explainer).
9. beginnerNextSteps: 3 actionable, beginner-friendly next steps to start building the repository today.
10. readmeSections: 3-4 suggested sections for the repository's GitHub README.md (e.g., Problem Statement, Quickstart, Architecture, Contributing).

Keep the scope realistic for Hacktoberfest contributors at the ${sanitizedExperience} level.`;

      const { result: response, usedModel } = await executeWithRetryAndFallback(ai, async (modelName) => {
        return await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                ideas: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      shortDescription: { type: Type.STRING },
                      problemSolved: { type: Type.STRING },
                      targetAudience: { type: Type.STRING },
                      suggestedTechnologies: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                      },
                      coreFeatures: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                      },
                      mvpRoadmap: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            phase: { type: Type.STRING, description: 'e.g. Milestone 1: Core Setup' },
                            milestone: { type: Type.STRING, description: 'Description of what is completed' }
                          },
                          required: ['phase', 'milestone']
                        }
                      },
                      aiFeature: { type: Type.STRING },
                      beginnerNextSteps: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                      },
                      readmeSections: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            heading: { type: Type.STRING },
                            content: { type: Type.STRING }
                          },
                          required: ['heading', 'content']
                        }
                      }
                    },
                    required: [
                      'title',
                      'shortDescription',
                      'problemSolved',
                      'targetAudience',
                      'suggestedTechnologies',
                      'coreFeatures',
                      'mvpRoadmap',
                      'aiFeature',
                      'beginnerNextSteps',
                      'readmeSections'
                    ]
                  }
                }
              },
              required: ['ideas']
            }
          }
        });
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Empty response received from Gemini.');
      }

      const data = JSON.parse(responseText);
      data._meta = { modelUsed: usedModel };
      return res.json(data);
    } catch (err: unknown) {
      console.error('Error in /api/generate-ideas:', err);
      const { status, message } = parseGeminiError(err);

      const userMessage = isTransientError(status, message)
        ? 'The AI model is temporarily experiencing high traffic across available endpoints. Please wait a few moments and try again.'
        : `Failed to generate ideas: ${message}`;

      return res.status(status && status >= 400 && status < 600 ? status : 503).json({
        error: userMessage,
        details: message
      });
    }
  });

  // Feature 6: Conversational Open-Source Mentor Chat
  app.post('/api/chat-mentor', async (req, res) => {
    try {
      const { message, history } = req.body;

      if (!message || typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({ error: 'Message cannot be empty.' });
      }

      const ai = getGeminiClient();
      if (!ai) {
        return res.status(503).json({
          error: 'GEMINI_API_KEY is not configured on the server. Please add your Gemini API key in the AI Studio Secrets panel or .env file.',
          keyMissing: true
        });
      }

      let promptWithContext = message;
      if (Array.isArray(history) && history.length > 0) {
        const recentHistory = history.slice(-6).map((h: { sender: string; text: string }) =>
          `${h.sender === 'user' ? 'User' : 'Mentor'}: ${h.text}`
        ).join('\n\n');
        promptWithContext = `Previous conversation context:\n${recentHistory}\n\nUser: ${message}`;
      }

      const systemInstruction = `You are CodeBridge AI Mentor, a warm, encouraging, pragmatic senior open-source maintainer and Hacktoberfest veteran.
Your mission: Help newcomers understand git, GitHub etiquette, pull requests, resolving merge conflicts, reading unfamiliar codebases, finding good-first-issues, and writing respectful maintainer communications.
Formatting rules:
- Always format code blocks with appropriate language tags.
- Give short, practical, real-world examples.
- Keep explanations clear and concise, with bullet points or numbered steps where helpful.
- Never be condescending; open source can be intimidating and your goal is confidence building.`;

      const { result: response, usedModel } = await executeWithRetryAndFallback(ai, async (modelName) => {
        return await ai.models.generateContent({
          model: modelName,
          contents: promptWithContext,
          config: {
            systemInstruction
          }
        });
      });

      const replyText = response.text || 'I am ready to help you with open-source development! What would you like to explore?';

      return res.json({ reply: replyText, _meta: { modelUsed: usedModel } });
    } catch (err: unknown) {
      console.error('Error in /api/chat-mentor:', err);
      const { status, message } = parseGeminiError(err);

      const userMessage = isTransientError(status, message)
        ? 'The AI model is temporarily experiencing high traffic across available endpoints. Please wait a few moments and try again.'
        : `Mentor could not respond: ${message}`;

      return res.status(status && status >= 400 && status < 600 ? status : 503).json({
        error: userMessage,
        details: message
      });
    }
  });

  // Feature 3: PR Step AI Mentor endpoint
  app.post('/api/pr-step-mentor', async (req, res) => {
    try {
      const { stepId, stepTitle, question, username, repo, branch } = req.body;

      if (!stepTitle) {
        return res.status(400).json({ error: 'Step title is required.' });
      }

      const ai = getGeminiClient();
      if (!ai) {
        return res.status(503).json({
          error: 'GEMINI_API_KEY is not configured on the server. Please add your Gemini API key in the AI Studio Secrets panel or .env file.',
          keyMissing: true
        });
      }

      const prompt = `You are the CodeBridge AI Senior Open-Source Mentor helping a newcomer make their first pull request.
The user is at Stage ${stepId || 'Guide'}: "${stepTitle}".
User Configuration:
- GitHub Username: ${username || 'octocat'}
- Target Repository: ${repo || 'owner/repo'}
- Feature Branch: ${branch || 'feature-branch'}

User Inquiry:
"${question || 'Explain this step in simple, beginner-friendly language. Why does it matter, what exact Git commands or GitHub UI steps should I take, and what common mistakes should I avoid?'}"

Provide a structured, encouraging answer formatted with clear Markdown:
1. **Plain-English Breakdown**: What this stage actually accomplishes and why it exists.
2. **Actionable Steps & Commands**: Exact Git terminal commands or GitHub UI steps customized for ${username || 'your-username'}/${repo || 'repo'}.
3. **Common Mistakes & Gotchas**: 2-3 specific mistakes beginners often make here and how to avoid them.
4. **Maintainer Etiquette Tip**: A pro-tip on what maintainers love to see.

Keep tone warm, practical, and beginner-friendly. Never be condescending.`;

      const { result: response, usedModel } = await executeWithRetryAndFallback(ai, async (modelName) => {
        return await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction: 'You are CodeBridge AI Mentor. Help open-source beginners navigate Git and GitHub with clarity, real commands, and practical tips.'
          }
        });
      });

      const adviceText = response.text || 'Step guidance generated.';
      return res.json({ advice: adviceText, _meta: { modelUsed: usedModel } });
    } catch (err: unknown) {
      console.error('Error in /api/pr-step-mentor:', err);
      const { status, message } = parseGeminiError(err);

      const userMessage = isTransientError(status, message)
        ? 'The AI model is temporarily experiencing high traffic across available endpoints. Please wait a few moments and try again.'
        : `Mentor could not provide guidance: ${message}`;

      return res.status(status && status >= 400 && status < 600 ? status : 503).json({
        error: userMessage,
        details: message
      });
    }
  });

  // Serve Frontend
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 CodeBridge AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

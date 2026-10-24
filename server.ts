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

function sanitizeSecret(text: string): string {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/key=[a-zA-Z0-9_\-]+/gi, 'key=[REDACTED]')
    .replace(/AIza[0-9A-Za-z\-_]{35}/g, '[REDACTED_API_KEY]')
    .replace(/Bearer\s+[a-zA-Z0-9_\-\.]+/gi, 'Bearer [REDACTED]')
    .replace(/ghp_[a-zA-Z0-9]{36}/g, '[REDACTED_GH_TOKEN]');
}

function normalizeSupabaseUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  let cleaned = rawUrl.trim().replace(/^['"]|['"]$/g, '');
  if (!cleaned) return '';
  try {
    if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
      cleaned = 'https://' + cleaned;
    }
    const parsed = new URL(cleaned);
    return parsed.origin;
  } catch {
    return cleaned.replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
  }
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

  return { status: typeof status === 'number' ? status : undefined, message: sanitizeSecret(message), rawError: err };
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

  // Supabase Auth & Provider status check endpoint
  app.get('/api/supabase/provider-status', async (req, res) => {
    try {
      const provider = String(req.query.provider || '').toLowerCase();
      const rawUrl = process.env.VITE_SUPABASE_URL || '';
      const rawKey = process.env.VITE_SUPABASE_ANON_KEY || '';

      const cleanUrl = normalizeSupabaseUrl(rawUrl);
      const cleanKey = rawKey.trim().replace(/^['"]|['"]$/g, '');

      if (!cleanUrl || !cleanKey) {
        return res.json({ configured: false, enabled: false, reason: 'missing_credentials' });
      }

      const settingsRes = await fetch(`${cleanUrl}/auth/v1/settings`, {
        headers: { apikey: cleanKey }
      });

      if (!settingsRes.ok) {
        return res.json({
          configured: true,
          enabled: true,
          warn: `Supabase returned status ${settingsRes.status}`
        });
      }

      const settings = (await settingsRes.json()) as any;
      const externalProviders = settings.external || {};

      if (provider && provider in externalProviders) {
        return res.json({
          configured: true,
          provider,
          enabled: Boolean(externalProviders[provider]),
          providers: externalProviders
        });
      }

      return res.json({
        configured: true,
        providers: externalProviders
      });
    } catch (err: unknown) {
      console.warn('Could not verify Supabase provider status', err);
      return res.json({ configured: true, enabled: true });
    }
  });

  // Feature 1: AI Code Explainer endpoint
  app.post('/api/explain-code', async (req, res) => {
    try {
      const { code, language, context } = req.body;

      if (!code || typeof code !== 'string' || !code.trim()) {
        return res.status(400).json({ error: 'Please provide valid code to explain.' });
      }

      if (code.length > 50000) {
        return res.status(400).json({ error: 'Code input exceeds maximum limit of 50,000 characters.' });
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

      if (issueBody.length > 50000) {
        return res.status(400).json({ error: 'Issue description exceeds maximum limit of 50,000 characters.' });
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
        interest = 'Web Development',
        interests,
        customIdeaDescription = ''
      } = req.body;

      // Normalize inputs
      const chosenInterest = interest || interests || 'Web Development';
      const chosenLanguage = language || 'JavaScript';
      const chosenExperience = experience || 'Beginner';

      const ai = getGeminiClient();
      if (!ai) {
        return res.status(503).json({
          error: 'GEMINI_API_KEY is not configured on the server. Please add your Gemini API key in the AI Studio Secrets panel or .env file.',
          keyMissing: true
        });
      }

      const prompt = `You are a friendly, experienced open-source mentor and project advisor for beginners learning to code.
A developer is looking for 3 realistic open-source project ideas to practice coding and contribute to open source.

Contributor Profile:
- Programming Language: ${chosenLanguage}
- Experience Level: ${chosenExperience}
- Domain / Interest: ${chosenInterest}
${customIdeaDescription ? `- Extra Context: ${customIdeaDescription}\n` : ''}

Generate exactly THREE (3) distinct, practical, realistic open-source project ideas tailored to someone learning to code.
Follow the JSON schema strictly. For each idea include:
1. title: Creative, memorable project name.
2. shortDescription: A clear 1-2 sentence overview of what the project does.
3. skillsToPractice: 3-5 specific technical skills or concepts to practice (e.g. "DOM Manipulation", "REST APIs", "Error Handling", "Async/Await").
4. suggestedFeatures: 3-5 beginner-friendly, modular features to implement.
5. clearFirstStep: A concrete, actionable first step to get started immediately (e.g. "Initialize the repository with a README and create a basic index.html file with a form").
6. problemSolved: A 1-sentence description of the problem it solves.
7. suggestedTechnologies: 2-4 recommended libraries, tools, or frameworks.`;

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
                      skillsToPractice: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                      },
                      suggestedFeatures: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                      },
                      clearFirstStep: { type: Type.STRING },
                      problemSolved: { type: Type.STRING },
                      suggestedTechnologies: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                      }
                    },
                    required: [
                      'title',
                      'shortDescription',
                      'skillsToPractice',
                      'suggestedFeatures',
                      'clearFirstStep',
                      'problemSolved',
                      'suggestedTechnologies'
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

  // Feature 5: Open-Source Repository Finder (Live GitHub API)
  app.post('/api/find-repositories', async (req, res) => {
    try {
      const { language, topic, experience, keyword } = req.body;

      // Construct GitHub search query
      const queryParts: string[] = ['is:public', 'archived:false'];

      // Language filter
      if (language && language !== 'Any' && language !== 'Any language') {
        const langClean = language.toLowerCase() === 'c++' ? 'cpp' : language.toLowerCase();
        queryParts.push(`language:${langClean}`);
      }

      // Topic mapping (use clean GitHub search qualifiers without parentheses)
      const topicKeywords: Record<string, string> = {
        'Web Development': 'topic:web',
        'AI and Machine Learning': 'topic:machine-learning',
        'Developer Tools': 'topic:developer-tools',
        'Education': 'topic:education',
        'Productivity': 'topic:productivity',
        'Climate': 'topic:climate',
        'Community Tools': 'topic:hacktoberfest'
      };

      if (topic && topic !== 'Any' && topic !== 'All Topics') {
        const mapped = topicKeywords[topic] || `topic:${topic.toLowerCase().replace(/\s+/g, '-')}`;
        queryParts.push(mapped);
      }

      // Keyword filter with sanitization
      if (keyword && typeof keyword === 'string' && keyword.trim()) {
        const cleanKw = keyword.trim().substring(0, 100).replace(/[^\w\s\-\.\/]/g, '').trim();
        if (cleanKw) {
          queryParts.push(cleanKw);
        }
      }

      // Experience weighting: for beginners, prioritize good-first-issues or approachable star count
      if (experience === 'Beginner') {
        queryParts.push('good-first-issues:>0');
      } else if (experience === 'Intermediate') {
        queryParts.push('help-wanted-issues:>0');
      }

      const q = queryParts.join(' ');
      const sort = experience === 'Beginner' ? 'help-wanted-issues' : 'stars';
      const searchUrl = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=${sort}&order=desc&per_page=12`;

      const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'CodeBridge-AI-Applet/1.0',
      };

      if (process.env.GITHUB_TOKEN && process.env.GITHUB_TOKEN.trim()) {
        headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN.trim()}`;
      }

      const ghResponse = await fetch(searchUrl, { headers });

      if (!ghResponse.ok) {
        if (ghResponse.status === 403 || ghResponse.status === 429) {
          return res.status(429).json({
            error: 'GitHub API search rate limit reached (GitHub limits unauthenticated searches to 10 queries per minute). Please wait 30 seconds and try again.',
            isRateLimited: true,
          });
        }
        return res.status(ghResponse.status).json({
          error: `GitHub API returned ${ghResponse.status}: ${ghResponse.statusText}`,
        });
      }

      const ghData = (await ghResponse.json()) as any;
      let items = ghData.items || [];

      // Fallback search if 0 items found for high-constraint queries
      if (items.length === 0 && (experience === 'Beginner' || experience === 'Intermediate')) {
        const fallbackParts = queryParts.filter(
          (p) => !p.includes('good-first-issues') && !p.includes('help-wanted-issues')
        );
        fallbackParts.push('topic:good-first-issue');
        const fallbackUrl = `https://api.github.com/search/repositories?q=${encodeURIComponent(
          fallbackParts.join(' ')
        )}&sort=stars&order=desc&per_page=12`;

        const fbRes = await fetch(fallbackUrl, { headers });
        if (fbRes.ok) {
          const fbData = (await fbRes.json()) as any;
          items = fbData.items || [];
        }
      }

      const repositories = items.map((item: any) => ({
        id: item.id,
        name: item.name,
        fullName: item.full_name,
        description: item.description || 'No description provided by repository.',
        htmlUrl: item.html_url,
        language: item.language,
        stars: item.stargazers_count,
        forks: item.forks_count,
        openIssuesCount: item.open_issues_count,
        topics: item.topics || [],
        hasGoodFirstIssues: Boolean(
          item.topics?.some((t: string) => t.includes('good-first') || t.includes('help-wanted')) ||
          item.open_issues_count > 0
        ),
        goodFirstIssuesUrl: `https://github.com/${item.full_name}/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22`,
        updatedAt: item.updated_at,
        ownerAvatarUrl: item.owner?.avatar_url,
        licenseName: item.license?.spdx_id || item.license?.name,
      }));

      return res.json({
        repositories,
        totalCount: ghData.total_count || repositories.length,
        query: q,
      });
    } catch (err: unknown) {
      console.error('Error in /api/find-repositories:', err);
      return res.status(502).json({
        error: 'Unable to connect to the GitHub API. Please check your internet connection or try again later.',
      });
    }
  });

  // Feature 6: AI Contribution Roadmap
  app.post('/api/create-roadmap', async (req, res) => {
    try {
      const { repoUrl, issueInput } = req.body;

      if (!repoUrl || typeof repoUrl !== 'string' || !repoUrl.trim()) {
        return res.status(400).json({ error: 'Please enter a GitHub repository URL or owner/repo identifier.' });
      }

      if (repoUrl.length > 500) {
        return res.status(400).json({ error: 'Repository URL exceeds maximum limit of 500 characters.' });
      }

      if (!issueInput || typeof issueInput !== 'string' || !issueInput.trim()) {
        return res.status(400).json({ error: 'Please provide a GitHub issue URL or issue description.' });
      }

      if (issueInput.length > 50000) {
        return res.status(400).json({ error: 'Issue description exceeds maximum limit of 50,000 characters.' });
      }

      const ai = getGeminiClient();
      if (!ai) {
        return res.status(503).json({
          error: 'GEMINI_API_KEY is not configured on the server. Please add your Gemini API key in the AI Studio Secrets panel or .env file.',
          keyMissing: true
        });
      }

      const isValidSegment = (s: string) => /^[a-zA-Z0-9_\-\.]+$/.test(s);

      // Step 1: Parse and attempt to verify repository on GitHub
      let owner = '';
      let repo = '';
      const cleanRepoInput = repoUrl.trim().replace(/^https?:\/\/github\.com\//i, '').replace(/\.git$/i, '');
      const slashParts = cleanRepoInput.split('/').filter(Boolean);
      if (slashParts.length >= 2) {
        owner = slashParts[0];
        repo = slashParts[1];
      }

      const ghHeaders: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'CodeBridge-AI-Applet/1.0',
      };
      if (process.env.GITHUB_TOKEN && process.env.GITHUB_TOKEN.trim()) {
        ghHeaders['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN.trim()}`;
      }

      let verifiedRepo = {
        verified: false,
        fullName: cleanRepoInput || 'Repository',
        description: 'Repository could not be directly verified on GitHub API. Recommendations are based on standard open-source conventions.',
        defaultBranch: 'main',
        language: null as string | null,
        stars: 0,
        openIssuesCount: 0,
        htmlUrl: repoUrl.startsWith('http') ? repoUrl.trim() : `https://github.com/${cleanRepoInput}`,
        licenseName: undefined as string | undefined,
      };

      if (owner && repo && isValidSegment(owner) && isValidSegment(repo)) {
        try {
          const ghRepoRes = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`, {
            headers: ghHeaders,
          });
          if (ghRepoRes.ok) {
            const repoData = (await ghRepoRes.json()) as any;
            verifiedRepo = {
              verified: true,
              fullName: repoData.full_name,
              description: repoData.description || 'Public GitHub repository.',
              defaultBranch: repoData.default_branch || 'main',
              language: repoData.language,
              stars: repoData.stargazers_count,
              openIssuesCount: repoData.open_issues_count,
              htmlUrl: repoData.html_url,
              licenseName: repoData.license?.spdx_id || repoData.license?.name,
            };
          }
        } catch {
          // If GitHub API unreachable, verified remains false
        }
      }

      // Step 2: Parse and attempt to verify issue on GitHub
      const cleanIssueInput = issueInput.trim();
      let verifiedIssue = {
        verified: false,
        number: undefined as number | undefined,
        title: cleanIssueInput.split('\n')[0].substring(0, 100) || 'Contribution Task',
        body: cleanIssueInput,
        state: undefined as string | undefined,
        htmlUrl: undefined as string | undefined,
      };

      const issueUrlMatch = cleanIssueInput.match(/github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)/i);
      if (issueUrlMatch) {
        const issueOwner = issueUrlMatch[1];
        const issueRepo = issueUrlMatch[2];
        const issueNumber = parseInt(issueUrlMatch[3], 10);

        if (isValidSegment(issueOwner) && isValidSegment(issueRepo) && !isNaN(issueNumber)) {
          try {
            const ghIssueRes = await fetch(
              `https://api.github.com/repos/${encodeURIComponent(issueOwner)}/${encodeURIComponent(issueRepo)}/issues/${issueNumber}`,
              { headers: ghHeaders }
            );
            if (ghIssueRes.ok) {
              const issueData = (await ghIssueRes.json()) as any;
              verifiedIssue = {
                verified: true,
                number: issueData.number,
                title: issueData.title,
                body: issueData.body || 'No description body provided in the GitHub issue ticket.',
                state: issueData.state,
                htmlUrl: issueData.html_url,
              };
            }
          } catch {
            // Fallback to unverified user text
          }
        }
      }

      // Step 3: Prompt Gemini with clear grounding boundaries
      const prompt = `You are CodeBridge AI Senior Open-Source Mentor.
Create a personalized, beginner-friendly Contribution Roadmap to help a contributor go from discovering this repository to submitting their first pull request.

Repository Information:
- Full Name: ${verifiedRepo.fullName} (${verifiedRepo.verified ? 'VERIFIED via official GitHub API' : 'Unverified URL / Custom Input'})
- Primary Language / Stack: ${verifiedRepo.language || 'General Open Source'}
- Default Branch: ${verifiedRepo.defaultBranch}
- Description: ${verifiedRepo.description}

Issue Information:
- Issue Title: ${verifiedIssue.title} (${verifiedIssue.verified ? `VERIFIED via GitHub Issue #${verifiedIssue.number}` : 'User-Provided Issue Text'})
- Issue Description:
"""
${verifiedIssue.body}
"""

GROUNDING & INTEGRITY DIRECTIVES:
- Do NOT pretend to know exact file paths or internal lines of code that have not been retrieved or verified above.
- In "areasToInvestigate", recommend 2 to 4 likely directories, files, or architectural areas based on standard ${verifiedRepo.language || 'software'} conventions, and explicitly include a disclaimer that the contributor must verify internal file structures in their local checkout.
- Break down the work into 4 to 6 approachable, bite-sized tasks.
- Provide clear testing instructions (e.g. npm test, pytest, or manual checks).
- Provide clean, exact Git commands for forking, branching, committing, and opening a PR.

Follow the JSON schema strictly.`;

      const { result: response, usedModel } = await executeWithRetryAndFallback(ai, async (modelName) => {
        return await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                overview: { type: Type.STRING },
                stages: {
                  type: Type.OBJECT,
                  properties: {
                    projectAndGuidelines: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        explanation: { type: Type.STRING },
                        contributingUrl: { type: Type.STRING },
                        keyRules: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING }
                        }
                      },
                      required: ['title', 'explanation', 'keyRules']
                    },
                    understandIssue: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        plainEnglishSummary: { type: Type.STRING },
                        expectedBehavior: { type: Type.STRING },
                        potentialTraps: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING }
                        }
                      },
                      required: ['title', 'plainEnglishSummary', 'expectedBehavior', 'potentialTraps']
                    },
                    areasToInvestigate: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        disclaimer: { type: Type.STRING },
                        recommendedAreas: {
                          type: Type.ARRAY,
                          items: {
                            type: Type.OBJECT,
                            properties: {
                              area: { type: Type.STRING },
                              why: { type: Type.STRING }
                            },
                            required: ['area', 'why']
                          }
                        }
                      },
                      required: ['title', 'disclaimer', 'recommendedAreas']
                    },
                    taskBreakdown: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        tasks: {
                          type: Type.ARRAY,
                          items: {
                            type: Type.OBJECT,
                            properties: {
                              id: { type: Type.STRING },
                              task: { type: Type.STRING },
                              details: { type: Type.STRING }
                            },
                            required: ['id', 'task', 'details']
                          }
                        }
                      },
                      required: ['title', 'tasks']
                    },
                    testingStrategy: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        testCommands: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING }
                        },
                        manualSteps: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING }
                        },
                        howToAvoidRegression: { type: Type.STRING }
                      },
                      required: ['title', 'testCommands', 'manualSteps', 'howToAvoidRegression']
                    },
                    gitAndPrWorkflow: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        branchName: { type: Type.STRING },
                        commands: {
                          type: Type.ARRAY,
                          items: {
                            type: Type.OBJECT,
                            properties: {
                              cmd: { type: Type.STRING },
                              purpose: { type: Type.STRING }
                            },
                            required: ['cmd', 'purpose']
                          }
                        },
                        suggestedPrTitle: { type: Type.STRING },
                        suggestedPrBody: { type: Type.STRING }
                      },
                      required: ['title', 'branchName', 'commands', 'suggestedPrTitle', 'suggestedPrBody']
                    }
                  },
                  required: [
                    'projectAndGuidelines',
                    'understandIssue',
                    'areasToInvestigate',
                    'taskBreakdown',
                    'testingStrategy',
                    'gitAndPrWorkflow'
                  ]
                },
                interactiveChecklist: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      stage: { type: Type.STRING },
                      text: { type: Type.STRING }
                    },
                    required: ['id', 'stage', 'text']
                  }
                }
              },
              required: ['overview', 'stages', 'interactiveChecklist']
            }
          }
        });
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Empty response received from Gemini.');
      }

      const data = JSON.parse(responseText);
      data.verifiedRepo = verifiedRepo;
      data.verifiedIssue = verifiedIssue;
      data._meta = { modelUsed: usedModel };
      return res.json(data);
    } catch (err: unknown) {
      console.error('Error in /api/create-roadmap:', err);
      const { status, message } = parseGeminiError(err);

      const userMessage = isTransientError(status, message)
        ? 'The AI model is temporarily experiencing high traffic across available endpoints. Please wait a few moments and try again.'
        : `Failed to create contribution roadmap: ${message}`;

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

import React from 'react';
import { X, Key, ShieldCheck, ExternalLink, Terminal, CheckCircle2 } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecheck: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onRecheck,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-purple-500/30 p-6 sm:p-7 shadow-2xl space-y-5">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Server-Side Gemini API Key</h3>
            <p className="text-xs text-slate-400">Secure configuration notice</p>
          </div>
        </div>

        <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            CodeBridge AI connects to Google's <strong>Gemini 3.8 Flash</strong> via the backend server to ensure API keys are never exposed in browser network requests or client JavaScript bundles.
          </p>

          <div className="rounded-xl bg-[#080d1a] border border-white/10 p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-cyan-300 font-semibold text-xs">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              How to configure:
            </div>
            <ol className="list-decimal list-inside space-y-1 text-xs text-slate-300">
              <li>
                In Google AI Studio, open the <strong>Settings &gt; Secrets</strong> panel.
              </li>
              <li>
                Add a secret named <code className="text-cyan-300 font-mono">GEMINI_API_KEY</code> with your Gemini key.
              </li>
              <li>
                For local development, add <code className="text-cyan-300 font-mono">GEMINI_API_KEY=your_key</code> in your <code className="text-purple-300 font-mono">.env</code> file.
              </li>
            </ol>
          </div>

          <p className="text-xs text-slate-400">
            Once configured, the live status indicator in the top navbar turns green (<span className="text-emerald-400 font-semibold">Gemini AI Active</span>) and all AI features unlock automatically.
          </p>
        </div>

        <div className="pt-2 flex items-center justify-end gap-3 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              onRecheck();
              onClose();
            }}
            className="px-5 py-2 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/30 transition-all"
          >
            Check Status Again
          </button>
        </div>
      </div>
    </div>
  );
};

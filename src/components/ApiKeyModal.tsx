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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-lg card-71 p-6 sm:p-7 space-y-4 text-ink rounded-[16px]">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-ink-subtle hover:text-ink p-1 rounded-[8px] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[10px] bg-surface-2 border border-hairline flex items-center justify-center text-accent">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-medium text-ink-strong">Server-Side Gemini API Key</h3>
            <p className="text-[12px] text-ink-subtle">Secure configuration notice</p>
          </div>
        </div>

        <div className="space-y-3 text-[13px] text-ink leading-relaxed">
          <p>
            CodeBridge AI connects to Google's <strong>Gemini 2.5 Flash</strong> via the backend server proxy to ensure API keys are never exposed in browser network requests or client JavaScript bundles.
          </p>

          <div className="rounded-[10px] bg-surface-2 border border-hairline p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-ink font-medium text-[12px]">
              <ShieldCheck className="w-4 h-4 text-accent" />
              <span>How to configure:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-[12px] text-ink-subtle">
              <li>
                In Google AI Studio, open the <strong>Settings &gt; Secrets</strong> panel.
              </li>
              <li>
                Add a secret named <code className="text-ink font-mono bg-surface px-1.5 py-0.5 rounded-[4px] border border-hairline">GEMINI_API_KEY</code> with your Gemini key.
              </li>
              <li>
                For local development, add <code className="text-ink font-mono bg-surface px-1.5 py-0.5 rounded-[4px] border border-hairline">GEMINI_API_KEY=your_key</code> in your <code className="text-ink font-mono bg-surface px-1.5 py-0.5 rounded-[4px] border border-hairline">.env</code> file.
              </li>
            </ol>
          </div>

          <p className="text-[12px] text-ink-subtle">
            Once configured, the live status indicator in the top navbar turns green (<span className="text-emerald-500 font-medium">Gemini AI Active</span>) and all AI features unlock automatically.
          </p>
        </div>

        <div className="pt-3 flex items-center justify-end gap-2 border-t border-hairline">
          <button
            type="button"
            onClick={onClose}
            className="h-8 px-3 rounded-[10px] text-[12px] font-medium bg-surface-2 hover:bg-surface text-ink border border-hairline transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              onRecheck();
              onClose();
            }}
            className="h-8 px-4 rounded-[10px] bg-accent hover:bg-accent-hover text-white text-[13px] font-medium transition-colors cursor-pointer shadow-xs"
          >
            Check Status Again
          </button>
        </div>
      </div>
    </div>
  );
};

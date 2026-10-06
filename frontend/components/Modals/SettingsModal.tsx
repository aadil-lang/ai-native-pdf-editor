'use client';

import React from 'react';
import { X, Cpu, Cloud, Slash, Check, ShieldCheck, Lock } from 'lucide-react';
import { useAiStore } from '@/stores/useAiStore';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    provider,
    setProvider,
    geminiApiKey,
    setGeminiApiKey,
    ollamaUrl,
    setOllamaUrl,
    modelName,
    setModelName,
  } = useAiStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-xl w-full max-w-md shadow-2xl p-6 text-gray-900">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
          <h3 className="font-bold text-base text-gray-900 tracking-tight">AI & Privacy Settings</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5 text-xs">
          {/* AI Provider Switch */}
          <div>
            <label className="block text-gray-600 font-semibold mb-2">AI Provider Mode</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setProvider('ollama')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition ${
                  provider === 'ollama'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-semibold'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <Cpu className="w-5 h-5 text-emerald-600" />
                <span>Local (Ollama)</span>
              </button>

              <button
                onClick={() => setProvider('gemini')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition ${
                  provider === 'gemini'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-semibold'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <Cloud className="w-5 h-5 text-indigo-600" />
                <span>Cloud (Gemini)</span>
              </button>

              <button
                onClick={() => setProvider('none' as any)}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition ${
                  (provider as string) === 'none'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-semibold'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <Lock className="w-5 h-5 text-gray-500" />
                <span>None (Disabled)</span>
              </button>
            </div>
          </div>

          {/* Privacy Notice Banner */}
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 text-[11px] leading-relaxed flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              {provider === 'ollama' && (
                <span>
                  <strong>100% Local AI Enabled.</strong> Your document data never leaves your computer.
                </span>
              )}
              {provider === 'gemini' && (
                <span>
                  <strong>Cloud AI Enabled.</strong> Selected document content may be sent to Google Gemini when you explicitly issue AI queries.
                </span>
              )}
              {(provider as string) === 'none' && (
                <span>
                  <strong>AI Disabled.</strong> Core document editing, annotations, and conversion operate entirely local-first without AI.
                </span>
              )}
            </div>
          </div>

          {/* Gemini Settings */}
          {provider === 'gemini' && (
            <div className="space-y-3 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Gemini API Key</label>
                <input
                  type="password"
                  placeholder="Paste GEMINI_API_KEY (optional if set in env)"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Model Name</label>
                <input
                  type="text"
                  placeholder="gemini-2.5-flash"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Ollama Settings */}
          {provider === 'ollama' && (
            <div className="space-y-3 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Ollama Base URL</label>
                <input
                  type="text"
                  placeholder="http://localhost:11434"
                  value={ollamaUrl}
                  onChange={(e) => setOllamaUrl(e.target.value)}
                  className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Local Model Name</label>
                <input
                  type="text"
                  placeholder="qwen2.5-coder:7b-instruct"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs transition"
          >
            <Check className="w-4 h-4" />
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};

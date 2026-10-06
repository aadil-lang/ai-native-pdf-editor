'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, CheckCircle, XCircle, Bot, User, ChevronUp, ChevronDown, Check, Undo, RefreshCw, Wand2 } from 'lucide-react';
import { useAiStore } from '@/stores/useAiStore';
import { usePdfStore } from '@/stores/usePdfStore';

export const AIChatBar: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [editableOps, setEditableOps] = useState<Record<string, string>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isThinking,
    provider,
    sendQuery,
    applyProposal,
    rejectProposal,
  } = useAiStore();

  const { undo, currentHistoryPointer, selectedObject, activePage } = usePdfStore();

  useEffect(() => {
    if (isExpanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isThinking, isExpanded]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isThinking || provider === 'none') return;

    const currentPrompt = prompt;
    setPrompt('');
    setIsExpanded(true);
    await sendQuery(currentPrompt);
  };

  const handleTransformPreset = async (presetText: string) => {
    setIsExpanded(true);
    let fullPrompt = presetText;
    if (selectedObject && selectedObject.type === 'span') {
      fullPrompt = `${presetText} for selected text: "${selectedObject.data.text}"`;
    }
    await sendQuery(fullPrompt);
  };

  const handleApplyWithEdits = (msgId: string, originalProposal: any) => {
    // If user edited any replacement_text fields, apply those overrides
    const updatedOps = originalProposal.operations.map((op: any, idx: number) => {
      const key = `${msgId}_${idx}`;
      if (editableOps[key] !== undefined) {
        return { ...op, replacement_text: editableOps[key] };
      }
      return op;
    });

    // Update proposal ops & apply
    originalProposal.operations = updatedOps;
    applyProposal(msgId);
  };

  const getProviderBadge = () => {
    if (provider === 'ollama') return { label: 'Local — Ollama', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    if (provider === 'gemini') return { label: 'Cloud — Gemini', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' };
    return { label: 'AI Disabled', color: 'bg-gray-100 text-gray-600 border-gray-300' };
  };

  const badge = getProviderBadge();

  return (
    <div className="bg-white border-t border-gray-200 z-20 shadow-xl flex flex-col transition-all duration-300">
      {/* Header bar to expand/collapse AI history & provider badge */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-4 py-1.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between text-xs text-gray-600 cursor-pointer hover:bg-gray-100/80"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span className="font-semibold text-gray-900">Ask PaperForge AI</span>
          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${badge.color}`}>
            ● {badge.label}
          </span>
          {messages.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-gray-200 text-[10px] text-gray-600 font-mono">
              {messages.length} msgs
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-gray-400">
            {isExpanded ? 'Collapse panel' : 'Expand conversation'}
          </span>
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </div>
      </div>

      {/* Preset Content Transformation Buttons */}
      <div className="px-4 py-1.5 bg-white border-b border-gray-100 flex items-center gap-2 overflow-x-auto text-xs">
        <span className="text-[11px] font-semibold text-gray-400 flex items-center gap-1 flex-shrink-0">
          <Wand2 className="w-3 h-3 text-indigo-500" /> Quick Actions:
        </span>
        {[
          'Rewrite Professionally',
          'Fix Grammar',
          'Simplify Text',
          'Shorten Section',
          'Summarize Document',
          'Translate to Spanish',
        ].map((action, idx) => (
          <button
            key={idx}
            onClick={() => handleTransformPreset(action)}
            disabled={provider === 'none'}
            className="px-2.5 py-1 bg-gray-100 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-40 text-gray-700 border border-gray-200 rounded-lg text-[11px] font-medium flex-shrink-0 transition"
          >
            {action}
          </button>
        ))}
      </div>

      {/* Expanded Conversation History & Proposal Review Cards */}
      {isExpanded && (
        <div className="max-h-80 min-h-[160px] overflow-y-auto p-4 space-y-4 bg-gray-50/50 border-b border-gray-200 text-xs">
          {messages.length === 0 ? (
            <div className="text-center py-6 text-gray-400">
              <Bot className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="font-medium text-gray-600">No AI conversation yet.</p>
              <p className="text-[11px] text-gray-400">
                Ask AI to replace text, rewrite sections, rotate pages, or summarize content.
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                )}

                <div
                  className={`max-w-xl rounded-2xl p-3.5 shadow-xs ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>

                  {/* AI Proposal Review Card */}
                  {msg.proposal && (
                    <div className="mt-3 p-3.5 bg-gray-50 border border-indigo-200 rounded-xl space-y-2.5">
                      <div className="flex items-center justify-between text-[11px] text-indigo-900 font-bold border-b border-gray-200 pb-1.5">
                        <span>Proposed Edits ({msg.proposal.operations.length})</span>
                        <span className="text-[10px] text-gray-500 font-mono">Requires Approval</span>
                      </div>

                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        {msg.proposal.operations.map((op, idx) => {
                          const opKey = `${msg.id}_${idx}`;
                          const currentVal = editableOps[opKey] !== undefined ? editableOps[opKey] : (op.replacement_text || op.text || '');

                          return (
                            <div
                              key={idx}
                              className="p-2 bg-white border border-gray-200 rounded-lg text-[11px] space-y-1 shadow-2xs"
                            >
                              <div className="flex items-center justify-between font-mono text-gray-700">
                                <span className="text-indigo-600 font-bold uppercase">
                                  {op.operation_type}
                                </span>
                                {op.page_number && (
                                  <span className="text-gray-400">Page {op.page_number}</span>
                                )}
                              </div>

                              {op.target_text && (
                                <div className="text-red-600 font-sans text-[11px]">
                                  <span className="font-semibold text-gray-500">Original:</span> "{op.target_text}"
                                </div>
                              )}

                              {(op.replacement_text !== undefined || op.text !== undefined) && (
                                <div className="space-y-1">
                                  <label className="text-[10px] font-semibold text-emerald-700 block">
                                    Suggested Replacement (Editable):
                                  </label>
                                  <input
                                    type="text"
                                    value={currentVal}
                                    onChange={(e) =>
                                      setEditableOps((prev) => ({ ...prev, [opKey]: e.target.value }))
                                    }
                                    className="w-full p-1.5 bg-emerald-50/50 border border-emerald-300 rounded text-xs text-gray-900 focus:outline-none focus:border-emerald-600 font-sans"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {msg.status === 'pending' && (
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => handleApplyWithEdits(msg.id, msg.proposal)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs transition shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Apply Changes
                          </button>
                          <button
                            onClick={() => rejectProposal(msg.id)}
                            className="px-3.5 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg text-xs transition"
                          >
                            Reject
                          </button>
                        </div>
                      )}

                      {msg.status === 'applied' && (
                        <div className="flex items-center justify-between text-emerald-600 text-[11px] font-semibold pt-1">
                          <span className="flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> Applied to document
                          </span>
                          <button
                            onClick={undo}
                            disabled={currentHistoryPointer <= 0}
                            className="flex items-center gap-1 text-gray-500 hover:text-gray-900 underline text-[10px]"
                          >
                            <Undo className="w-3 h-3" /> Undo Edit
                          </button>
                        </div>
                      )}

                      {msg.status === 'rejected' && (
                        <div className="text-gray-400 text-[11px] font-medium pt-1 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> Proposal rejected
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {msg.sender === 'user' && (
                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5 border border-gray-300">
                    <User className="w-3.5 h-3.5 text-gray-600" />
                  </div>
                )}
              </div>
            ))
          )}

          {isThinking && (
            <div className="flex gap-3 justify-start">
              <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-white animate-spin" />
              </div>
              <div className="bg-white border border-gray-200 text-gray-600 rounded-2xl p-3 flex items-center gap-2 text-xs shadow-xs">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                <span>Analyzing document & generating structured proposal...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Main Command Input Bar */}
      <form onSubmit={handleSubmit} className="p-3 bg-white flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder={
              provider === 'none'
                ? 'AI is disabled in Settings. Switch to Ollama or Gemini to use AI.'
                : "Ask PaperForge... (e.g., 'Change 2025 to 2026', 'Fix spelling', 'Remove page 2')"
            }
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isThinking || provider === 'none'}
            className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 shadow-inner"
          />
          <Sparkles className="w-4 h-4 text-indigo-600 absolute right-3 top-2.5 pointer-events-none" />
        </div>

        <button
          type="submit"
          disabled={!prompt.trim() || isThinking || provider === 'none'}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold text-xs rounded-xl shadow-md transition"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};

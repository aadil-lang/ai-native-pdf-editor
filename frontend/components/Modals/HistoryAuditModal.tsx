'use client';

import React from 'react';
import { X, History, Sparkles, User, ArrowRight } from 'lucide-react';
import { usePdfStore } from '@/stores/usePdfStore';

interface HistoryAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HistoryAuditModal: React.FC<HistoryAuditModalProps> = ({ isOpen, onClose }) => {
  const { history, currentHistoryPointer, document } = usePdfStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-xl w-full max-w-lg shadow-2xl p-6 text-gray-900 flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
          <div className="flex items-center gap-2 font-bold text-base text-gray-900">
            <History className="w-5 h-5 text-indigo-600" />
            <span>Document Revision History</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {history.map((revIdx, idx) => {
            const isCurrent = idx === currentHistoryPointer;
            return (
              <div
                key={idx}
                className={`p-3 rounded-lg border text-xs flex items-center justify-between transition ${
                  isCurrent
                    ? 'border-indigo-600 bg-indigo-50/60 shadow-sm'
                    : 'border-gray-200 bg-gray-50/50 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold font-mono text-[11px] ${
                      isCurrent ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    r{revIdx}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {idx === 0 ? 'Original PDF Upload' : `Revision Step #${revIdx}`}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      {idx === 0
                        ? 'Base uploaded document'
                        : `Executed deterministic PDF operations`}
                    </div>
                  </div>
                </div>

                {isCurrent && (
                  <span className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[10px] font-medium">
                    Active State
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs transition"
          >
            Close History
          </button>
        </div>
      </div>
    </div>
  );
};

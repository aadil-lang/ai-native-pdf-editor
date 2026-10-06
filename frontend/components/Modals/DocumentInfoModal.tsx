'use client';

import React from 'react';
import { X, FileText, Info } from 'lucide-react';
import { usePdfStore } from '@/stores/usePdfStore';

interface DocumentInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentInfoModal: React.FC<DocumentInfoModalProps> = ({ isOpen, onClose }) => {
  const { document } = usePdfStore();

  if (!isOpen || !document) return null;

  const firstPage = document.pages[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-xl w-full max-w-sm shadow-2xl p-6 text-gray-900">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
          <div className="flex items-center gap-2 font-bold text-base text-gray-900">
            <Info className="w-5 h-5 text-indigo-600" />
            <span>Document Info</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <span className="text-gray-500 block font-medium">Filename</span>
            <span className="font-semibold text-gray-800 break-all">{document.filename}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <span className="text-gray-500 block font-medium">Page Count</span>
              <span className="font-semibold text-gray-800">{document.page_count} pages</span>
            </div>

            <div>
              <span className="text-gray-500 block font-medium">Current Revision</span>
              <span className="font-semibold text-gray-800">Rev #{document.current_revision_index}</span>
            </div>
          </div>

          {firstPage && (
            <div className="pt-2">
              <span className="text-gray-500 block font-medium">Page Dimensions (Pt)</span>
              <span className="font-mono text-gray-800">
                {Math.round(firstPage.width)} × {Math.round(firstPage.height)} pt
              </span>
            </div>
          )}

          <div className="pt-2">
            <span className="text-gray-500 block font-medium">Document ID</span>
            <span className="font-mono text-[10px] text-gray-400 break-all">{document.id}</span>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

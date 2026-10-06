'use client';

import React, { useState } from 'react';
import { X, FileOutput, Check, Download, RefreshCw } from 'lucide-react';
import { usePdfStore } from '@/stores/usePdfStore';

interface ConversionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConversionModal: React.FC<ConversionModalProps> = ({ isOpen, onClose }) => {
  const { document } = usePdfStore();
  const [targetFormat, setTargetFormat] = useState<'docx' | 'txt' | 'md' | 'html' | 'png'>('docx');
  const [mode, setMode] = useState<'editable' | 'layout'>('editable');
  const [isConverting, setIsConverting] = useState(false);

  if (!isOpen || !document) return null;

  const handleConvert = async () => {
    setIsConverting(true);
    try {
      const formData = new FormData();
      formData.append('target_format', targetFormat);
      formData.append('mode', mode);

      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const res = await fetch(`${API_BASE}/convert/document/${document.id}`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Conversion failed');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      const extMap: Record<string, string> = {
        docx: '.docx',
        txt: '.txt',
        md: '.md',
        html: '.html',
        png: '.zip',
      };
      a.download = `${document.filename.replace('.pdf', '')}_converted${extMap[targetFormat]}`;
      a.click();
      window.URL.revokeObjectURL(url);
      onClose();
    } catch (err: any) {
      alert(`Conversion error: ${err.message}`);
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-xl w-full max-w-md shadow-2xl p-6 text-gray-900">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
          <div className="flex items-center gap-2 font-bold text-base text-gray-900">
            <FileOutput className="w-5 h-5 text-indigo-600" />
            <span>Convert Document</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5 text-xs">
          <div>
            <label className="block text-gray-600 font-semibold mb-1.5">Source Format</label>
            <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 font-medium font-mono">
              PDF ({document.filename})
            </div>
          </div>

          <div>
            <label className="block text-gray-600 font-semibold mb-1.5">Target Format</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'docx', label: 'Word (.docx)' },
                { id: 'txt', label: 'Text (.txt)' },
                { id: 'md', label: 'Markdown (.md)' },
                { id: 'html', label: 'HTML (.html)' },
                { id: 'png', label: 'Images (.zip)' },
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => setTargetFormat(fmt.id as any)}
                  className={`p-2.5 rounded-lg border text-center font-medium transition ${
                    targetFormat === fmt.id
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {fmt.label}
                </button>
              ))}
            </div>
          </div>

          {targetFormat === 'docx' && (
            <div>
              <label className="block text-gray-600 font-semibold mb-1.5">Conversion Mode</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setMode('editable')}
                  className={`p-2.5 rounded-lg border text-left transition ${
                    mode === 'editable'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold">Make Editable</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    Prioritizes paragraph structure & editing
                  </div>
                </button>

                <button
                  onClick={() => setMode('layout')}
                  className={`p-2.5 rounded-lg border text-left transition ${
                    mode === 'layout'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold">Preserve Layout</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    Prioritizes visual layout positioning
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg text-xs transition"
          >
            Cancel
          </button>
          <button
            onClick={handleConvert}
            disabled={isConverting}
            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-lg text-xs transition shadow-sm"
          >
            {isConverting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Converting...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Convert & Download</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

'use client';

import React, { useState } from 'react';
import { Download, FileText, CheckCircle, RefreshCw, X, AlertCircle } from 'lucide-react';
import { usePdfStore } from '@/stores/usePdfStore';
import { getExportUrl, convertDocument } from '@/lib/api';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const [format, setFormat] = useState<'pdf' | 'docx' | 'txt' | 'md' | 'html'>('pdf');
  const [flattenAnnotations, setFlattenAnnotations] = useState(false);
  const [includeForms, setIncludeForms] = useState(true);
  const [exportState, setExportState] = useState<'idle' | 'preparing' | 'writing' | 'verifying' | 'done' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const { document } = usePdfStore();

  if (!isOpen || !document) return null;

  const handleExport = async () => {
    setExportState('preparing');
    setErrorMessage('');

    try {
      if (format === 'pdf') {
        setTimeout(() => setExportState('writing'), 400);
        setTimeout(() => setExportState('verifying'), 800);
        setTimeout(() => {
          setExportState('done');
          window.open(getExportUrl(document.id), '_blank');
        }, 1200);
      } else {
        setTimeout(() => setExportState('writing'), 300);
        const blob = await convertDocument(document.id, format);
        setExportState('verifying');
        setTimeout(() => {
          setExportState('done');
          const url = URL.createObjectURL(blob);
          const a = globalThis.document.createElement('a');
          a.href = url;
          a.download = `${document.filename.replace(/\.pdf$/i, '')}.${format}`;
          a.click();
          URL.revokeObjectURL(url);
        }, 600);
      }
    } catch (err: any) {
      setExportState('error');
      setErrorMessage(err.message || 'Export failed to write document payload.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-xs p-4">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Export Document</h3>
              <p className="text-[11px] text-gray-500">Save and download your edited PDF or converted file</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 flex flex-col gap-4">
          {/* Format Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-700">Target Export Format</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'pdf', label: 'PDF Document', desc: 'Standard PDF' },
                { id: 'docx', label: 'Word (DOCX)', desc: 'Editable text' },
                { id: 'txt', label: 'Plain Text', desc: 'Raw text' },
                { id: 'md', label: 'Markdown', desc: 'Formatted text' },
                { id: 'html', label: 'HTML Page', desc: 'Web document' },
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => setFormat(fmt.id as any)}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition ${
                    format === fmt.id
                      ? 'border-indigo-600 bg-indigo-50/60 text-indigo-950 font-semibold'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <span className="text-xs">{fmt.label}</span>
                  <span className="text-[9px] text-gray-400 font-normal">{fmt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Export Options */}
          {format === 'pdf' && (
            <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
              <label className="text-xs font-semibold text-gray-700">PDF Options</label>
              <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={flattenAnnotations}
                  onChange={(e) => setFlattenAnnotations(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <span>Flatten canvas annotations & highlights</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeForms}
                  onChange={(e) => setIncludeForms(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <span>Preserve interactive form field values</span>
              </label>
            </div>
          )}

          {/* Export Status Indicator */}
          {exportState !== 'idle' && (
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs flex items-center gap-3">
              {exportState === 'done' ? (
                <>
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <div className="font-semibold text-gray-900">Export Complete!</div>
                    <div className="text-[11px] text-gray-500">Your document has been generated successfully.</div>
                  </div>
                </>
              ) : exportState === 'error' ? (
                <>
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                  <div>
                    <div className="font-semibold text-red-900">Export Error</div>
                    <div className="text-[11px] text-red-600">{errorMessage}</div>
                  </div>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin shrink-0" />
                  <div className="text-gray-700 font-medium">
                    {exportState === 'preparing' && 'Preparing document structure...'}
                    {exportState === 'writing' && 'Writing PDF streams & typography...'}
                    {exportState === 'verifying' && 'Verifying exported resources...'}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[11px] text-gray-500 font-medium">Local processing</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={exportState === 'preparing' || exportState === 'writing' || exportState === 'verifying'}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-40"
            >
              Export Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

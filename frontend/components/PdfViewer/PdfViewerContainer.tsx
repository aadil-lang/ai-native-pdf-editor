'use client';

import React, { useRef, useState } from 'react';
import { Upload, FileText, ShieldCheck, Sparkles, RefreshCw, Cpu } from 'lucide-react';
import { usePdfStore } from '@/stores/usePdfStore';
import { uploadPdf } from '@/lib/api';
import { PdfCanvasPage } from './PdfCanvasPage';

interface PdfViewerContainerProps {
  onOpenSignature: () => void;
}

export const PdfViewerContainer: React.FC<PdfViewerContainerProps> = ({ onOpenSignature }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loadingStep, setLoadingStep] = useState<string | null>(null);

  const { document, setDocument, zoom, activePage, setActivePage } = usePdfStore();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === 'application/pdf') {
      await processFile(file);
    }
  };

  const processFile = async (file: File) => {
    try {
      setLoadingStep('Opening document...');
      setTimeout(() => setLoadingStep('Reading PDF structure & resources...'), 200);
      setTimeout(() => setLoadingStep('Extracting document fonts & pages...'), 400);

      const doc = await uploadPdf(file);
      setLoadingStep('Preparing canvas renderer...');
      setTimeout(() => {
        setDocument(doc);
        setLoadingStep(null);
      }, 600);
    } catch (err: any) {
      setLoadingStep(null);
      alert(`Could not open this PDF document: ${err.message}`);
    }
  };

  if (loadingStep) {
    return (
      <main className="flex-1 bg-[#F7F7F8] flex flex-col items-center justify-center p-8 text-center">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-xl p-8 flex flex-col items-center gap-4 max-w-sm">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl animate-spin">
            <RefreshCw className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Opening Document</h3>
            <p className="text-xs text-gray-500 mt-1 font-mono">{loadingStep}</p>
          </div>
        </div>
      </main>
    );
  }

  if (!document) {
    return (
      <main
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="flex-1 bg-[#F7F7F8] flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-gray-200 m-6 rounded-2xl relative overflow-hidden"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".pdf"
          className="hidden"
        />

        <div className="w-16 h-16 bg-white border border-gray-200 rounded-2xl flex items-center justify-center mb-5 shadow-2xs text-indigo-600">
          <FileText className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-2">
          PaperForge Document Workspace
        </h2>
        <p className="text-gray-500 text-sm max-w-md mb-6 leading-relaxed">
          Edit typography, format text, redact sensitive content, stamp signatures, and transform PDFs with preserved document fidelity.
        </p>

        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md transition"
          >
            <Upload className="w-4 h-4" />
            Open PDF File
          </button>
        </div>

        <div className="flex items-center gap-6 pt-6 border-t border-gray-200/80 text-xs text-gray-500">
          <div className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Files stay on your device by default</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <Cpu className="w-4 h-4 text-indigo-600" />
            <span>100% Offline Capable</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>AI is optional</span>
          </div>
        </div>

        <p className="text-gray-400 text-xs mt-4">Or drag and drop a PDF file anywhere on this window</p>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-[#F7F7F8] overflow-auto p-8 relative flex flex-col items-center">
      {document.pages.map((page) => (
        <div key={`page_wrapper_${page.page_number}`} onClick={() => setActivePage(page.page_number)}>
          <PdfCanvasPage
            documentId={document.id}
            page={page}
            zoom={zoom}
            isActive={activePage === page.page_number}
            onOpenSignature={onOpenSignature}
          />
        </div>
      ))}
    </main>
  );
};

'use client';

import React from 'react';
import { PDFPage } from '@/types/pdf';
import { getPageImageUrl } from '@/lib/api';
import { EditingOverlay } from './EditingOverlay';

import { usePdfStore } from '@/stores/usePdfStore';

interface PdfCanvasPageProps {
  documentId: string;
  page: PDFPage;
  zoom: number;
  isActive: boolean;
  onOpenSignature: () => void;
}

export const PdfCanvasPage: React.FC<PdfCanvasPageProps> = ({
  documentId,
  page,
  zoom,
  isActive,
  onOpenSignature,
}) => {
  const { document } = usePdfStore();
  const scaledWidth = page.width * zoom;
  const scaledHeight = page.height * zoom;

  const imageUrl = getPageImageUrl(documentId, page.page_number, zoom * 1.5, document?.current_revision_index);

  return (
    <div
      id={`page_${page.page_number}`}
      style={{
        width: `${scaledWidth}px`,
        height: `${scaledHeight}px`,
      }}
      className={`relative bg-white shadow-xl rounded-lg border transition-all my-6 mx-auto ${
        isActive ? 'ring-2 ring-indigo-600/80 shadow-2xl' : 'border-gray-200'
      }`}
    >
      {/* Backend Rendered Page Image Layer */}
      <img
        src={imageUrl}
        alt={`Page ${page.page_number}`}
        className="w-full h-full object-contain pointer-events-none select-none rounded-lg"
        loading="lazy"
      />

      {/* Interactive Editing & Annotation Overlay */}
      <EditingOverlay page={page} scale={zoom} onOpenSignature={onOpenSignature} />

      {/* Page Number Label in Margin */}
      <div className="absolute -bottom-6 left-0 right-0 text-center text-[11px] font-mono text-gray-400">
        Page {page.page_number}
      </div>
    </div>
  );
};

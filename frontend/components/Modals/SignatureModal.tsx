'use client';

import React, { useRef, useState } from 'react';
import { X, Check, Trash2, PenTool } from 'lucide-react';
import { usePdfStore } from '@/stores/usePdfStore';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SignatureModal: React.FC<SignatureModalProps> = ({ isOpen, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasStrokes, setHasStrokes] = useState(false);
  const { applyOps, activePage } = usePdfStore();

  if (!isOpen) return null;

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setIsDrawing(true);
    setHasStrokes(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasStrokes(false);
  };

  const handleSaveSignature = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasStrokes) return;

    const dataUrl = canvas.toDataURL('image/png');

    await applyOps([
      {
        operation_type: 'add_signature',
        page_number: activePage,
        image_base64: dataUrl,
        x: 100,
        y: 200,
        width: 160,
        height: 60,
      },
    ]);

    handleClear();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-xl w-full max-w-md shadow-2xl p-6 text-gray-900">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
          <div className="flex items-center gap-2 font-bold text-base text-gray-900">
            <PenTool className="w-5 h-5 text-indigo-600" />
            <span>Add Digital Signature</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <p className="text-xs text-gray-500">
            Draw your signature below using mouse or touch. It will be stamped onto Page {activePage}.
          </p>

          <div className="border border-gray-300 rounded-xl bg-gray-50/50 overflow-hidden relative shadow-inner">
            <canvas
              ref={canvasRef}
              width={400}
              height={160}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              className="w-full h-40 cursor-crosshair touch-none"
            />
            {!hasStrokes && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-400 text-xs italic font-serif">
                Sign here...
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <button
            onClick={handleClear}
            disabled={!hasStrokes}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg text-xs transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveSignature}
              disabled={!hasStrokes}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold rounded-lg text-xs transition shadow-xs"
            >
              <Check className="w-4 h-4" />
              Stamp Signature
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

'use client';

import React, { useState, useEffect } from 'react';
import { Sliders, Check, Highlighter, EyeOff, Trash2, AlignLeft, AlignCenter, AlignRight, Move, Layers, AlertCircle } from 'lucide-react';
import { usePdfStore } from '@/stores/usePdfStore';
import { PDFTextSpan } from '@/types/pdf';

export const PropertiesBar: React.FC = () => {
  const { selectedObject, applyOps, setSelectedObject, document } = usePdfStore();
  const [textValue, setTextValue] = useState('');
  const [fontSize, setFontSize] = useState(12);
  const [colorHex, setColorHex] = useState('#000000');
  const [posX, setPosX] = useState(0);
  const [posY, setPosY] = useState(0);

  useEffect(() => {
    if (selectedObject && selectedObject.type === 'span') {
      const span = selectedObject.data as PDFTextSpan;
      setTextValue(span.text || '');
      setFontSize(span.font_size || 12);
      setColorHex(span.color || '#000000');
      setPosX(Math.round(span.bbox.x0));
      setPosY(Math.round(span.bbox.y0));
    }
  }, [selectedObject]);

  if (!selectedObject) {
    return (
      <aside className="w-64 bg-white border-l border-gray-200 p-4 text-gray-400 text-xs flex flex-col justify-between h-full">
        <div className="flex flex-col items-center justify-center text-center my-auto">
          <Sliders className="w-8 h-8 mb-2 text-gray-300" />
          <p className="font-semibold text-gray-600">No Selection</p>
          <p className="mt-1 text-gray-400 text-[11px] leading-relaxed">
            Click on any text span or object on the canvas to inspect typography, edit properties, or align objects.
          </p>
        </div>

        {document?.document_fonts && document.document_fonts.length > 0 && (
          <div className="pt-3 border-t border-gray-200 text-left">
            <span className="font-bold text-gray-500 uppercase text-[10px] block mb-2">
              Document Fonts ({document.document_fonts.length})
            </span>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 text-[11px] font-mono">
              {document.document_fonts.map((f, idx) => (
                <div key={idx} className="p-1.5 bg-gray-50 border border-gray-200 rounded flex justify-between items-center text-gray-700">
                  <span className="truncate max-w-[130px] font-semibold">{f.family}</span>
                  <span className="text-[9px] px-1 py-0.2 bg-gray-200 text-gray-600 rounded">
                    {f.is_subset ? 'Subset' : 'Std'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>
    );
  }

  const span = selectedObject.type === 'span' ? (selectedObject.data as PDFTextSpan) : null;

  const handleSaveTextChange = async () => {
    if (!span) return;

    await applyOps([
      {
        operation_type: 'replace_text',
        page_number: selectedObject.pageNumber,
        target_text: span.text,
        replacement_text: textValue,
        bbox: span.bbox,
        font_size: fontSize,
        color_hex: colorHex,
        is_bold: span.is_bold,
        is_italic: span.is_italic,
        font_family: span.font_family,
      },
    ]);
  };

  const handleMoveObject = async () => {
    if (!span) return;
    await applyOps([
      {
        operation_type: 'move_object',
        page_number: selectedObject.pageNumber,
        object_id: span.id,
        object_type: 'text',
        new_x: posX,
        new_y: posY,
        text: textValue,
        original_bbox: span.bbox,
      },
    ]);
  };

  const handleHighlightSelected = async () => {
    if (!span) return;

    await applyOps([
      {
        operation_type: 'highlight_text',
        page_number: selectedObject.pageNumber,
        bbox: span.bbox,
        color_hex: '#ffff00',
      },
    ]);
  };

  const handleRedactSelected = async () => {
    if (!span) return;

    await applyOps([
      {
        operation_type: 'redact_region',
        page_number: selectedObject.pageNumber,
        bbox: span.bbox,
        fill_color_hex: '#000000',
      },
    ]);
  };

  const handleDeleteSelected = async () => {
    if (!span) return;

    await applyOps([
      {
        operation_type: 'delete_text',
        page_number: selectedObject.pageNumber,
        bbox: span.bbox,
      },
    ]);
  };

  return (
    <aside className="w-64 bg-white border-l border-gray-200 p-4 text-gray-800 text-xs flex flex-col h-full z-10 overflow-y-auto">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
        <span className="font-bold tracking-wider text-gray-400 uppercase text-[11px]">
          Properties ({selectedObject.type})
        </span>
        <button
          onClick={() => setSelectedObject(null)}
          className="text-gray-400 hover:text-gray-700 font-bold"
        >
          ✕
        </button>
      </div>

      {span && (
        <div className="space-y-4">
          {/* Text Content Editor */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
              Text Content
            </label>
            <textarea
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              rows={3}
              className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:border-indigo-500 font-sans"
            />
          </div>

          {/* Typography Details */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                Font Size (pt)
              </label>
              <input
                type="number"
                value={fontSize}
                onChange={(e) => setFontSize(parseFloat(e.target.value) || 12)}
                className="w-full p-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={colorHex}
                  onChange={(e) => setColorHex(e.target.value)}
                  className="w-8 h-7 bg-white border border-gray-200 rounded cursor-pointer"
                />
                <span className="font-mono text-[10px] text-gray-500">{colorHex}</span>
              </div>
            </div>
          </div>

          {/* PDF Font Resource Info */}
          <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[10px] font-mono text-gray-600 space-y-1">
            <div className="text-gray-800 font-sans font-bold mb-1 flex items-center justify-between">
              <span>PDF Font Resource:</span>
              {span.is_subset_font && (
                <span className="text-[9px] bg-amber-100 text-amber-800 px-1 rounded">
                  Subset
                </span>
              )}
            </div>
            <div className="truncate text-indigo-700 font-semibold">{span.pdf_font_resource || span.font_name}</div>
            <div>Family: {span.font_family} ({span.font_variant || 'Regular'})</div>
          </div>

          {/* Precise Numeric Positioning (X, Y) */}
          <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg space-y-2">
            <span className="text-[11px] font-bold text-gray-700 block">Positioning (Points):</span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-gray-500 block">X Pos</label>
                <input
                  type="number"
                  value={posX}
                  onChange={(e) => setPosX(parseFloat(e.target.value) || 0)}
                  className="w-full p-1 bg-white border border-gray-200 rounded text-xs text-gray-900 font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-500 block">Y Pos</label>
                <input
                  type="number"
                  value={posY}
                  onChange={(e) => setPosY(parseFloat(e.target.value) || 0)}
                  className="w-full p-1 bg-white border border-gray-200 rounded text-xs text-gray-900 font-mono"
                />
              </div>
            </div>

            <button
              onClick={handleMoveObject}
              className="w-full flex items-center justify-center gap-1.5 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded font-semibold text-[11px] transition"
            >
              <Move className="w-3.5 h-3.5" /> Move Position
            </button>
          </div>

          {/* Actions */}
          <div className="pt-2 space-y-2">
            <button
              onClick={handleSaveTextChange}
              className="w-full flex items-center justify-center gap-2 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold transition shadow-xs"
            >
              <Check className="w-4 h-4" />
              Apply Text Edit
            </button>

            <button
              onClick={handleHighlightSelected}
              className="w-full flex items-center justify-center gap-2 py-1.5 bg-yellow-50 hover:bg-yellow-100 text-yellow-800 border border-yellow-200 rounded-lg font-semibold transition"
            >
              <Highlighter className="w-4 h-4 text-yellow-600" />
              Highlight Text
            </button>

            <button
              onClick={handleRedactSelected}
              className="w-full flex items-center justify-center gap-2 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200 rounded-lg font-semibold transition"
            >
              <EyeOff className="w-4 h-4 text-gray-500" />
              Redact Region
            </button>

            <button
              onClick={handleDeleteSelected}
              className="w-full flex items-center justify-center gap-2 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg font-semibold transition"
            >
              <Trash2 className="w-4 h-4" />
              Delete Text
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};

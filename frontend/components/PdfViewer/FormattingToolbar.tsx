'use client';

import React from 'react';
import { Bold, Italic, AlignLeft, AlignCenter, AlignRight, Trash2, AlertCircle } from 'lucide-react';
import { PDFTextSpan } from '@/types/pdf';
import { usePdfStore } from '@/stores/usePdfStore';

interface FormattingToolbarProps {
  span: PDFTextSpan;
  pageNumber: number;
  screenPos: { left: number; top: number; width: number; height: number };
}

export const FormattingToolbar: React.FC<FormattingToolbarProps> = ({ span, pageNumber, screenPos }) => {
  const { applyOps, document } = usePdfStore();

  const handleUpdateFont = async (updates: Partial<{
    font_family: string;
    font_size: number;
    color_hex: string;
    is_bold: boolean;
    is_italic: boolean;
  }>) => {
    await applyOps([
      {
        operation_type: 'replace_text',
        page_number: pageNumber,
        target_text: span.text,
        replacement_text: span.text,
        bbox: span.bbox,
        font_family: updates.font_family !== undefined ? updates.font_family : (span.font_family || 'Helvetica'),
        font_size: updates.font_size !== undefined ? updates.font_size : span.font_size,
        color_hex: updates.color_hex !== undefined ? updates.color_hex : span.color,
        is_bold: updates.is_bold !== undefined ? updates.is_bold : span.is_bold,
        is_italic: updates.is_italic !== undefined ? updates.is_italic : span.is_italic,
      },
    ]);
  };

  const handleDelete = async () => {
    await applyOps([
      {
        operation_type: 'delete_text',
        page_number: pageNumber,
        bbox: span.bbox,
        target_text: span.text,
      },
    ]);
  };

  // Extract unique document font families
  const documentFontFamilies = Array.from(
    new Set((document?.document_fonts || []).map((f) => f.family))
  );

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        left: `${Math.max(10, screenPos.left)}px`,
        top: `${Math.max(10, screenPos.top - 52)}px`,
      }}
      className="absolute z-40 bg-white border border-gray-200 rounded-xl shadow-xl p-1.5 flex items-center gap-1.5 text-xs text-gray-800 animate-in fade-in duration-150 select-none"
    >
      {/* Font Family Categorized Dropdown */}
      <select
        value={span.font_family || 'Helvetica'}
        onChange={(e) => handleUpdateFont({ font_family: e.target.value })}
        className="px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 focus:outline-none focus:border-indigo-500"
      >
        <optgroup label="Fonts in this Document">
          {documentFontFamilies.map((fam) => (
            <option key={`doc_${fam}`} value={fam}>
              {fam}
            </option>
          ))}
        </optgroup>
        <optgroup label="Standard System Fonts">
          <option value="Helvetica">Helvetica / Arial</option>
          <option value="Times-Roman">Times New Roman</option>
          <option value="Courier">Courier Code</option>
        </optgroup>
      </select>

      {/* Font Size Stepper */}
      <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg px-1">
        <button
          onClick={() => handleUpdateFont({ font_size: Math.max(6, span.font_size - 1) })}
          className="px-1.5 py-0.5 text-gray-600 hover:text-gray-900 font-bold"
        >
          -
        </button>
        <span className="px-1 font-mono font-semibold text-[11px] min-w-[24px] text-center">
          {Math.round(span.font_size)}
        </span>
        <button
          onClick={() => handleUpdateFont({ font_size: span.font_size + 1 })}
          className="px-1.5 py-0.5 text-gray-600 hover:text-gray-900 font-bold"
        >
          +
        </button>
      </div>

      <div className="h-4 w-px bg-gray-200" />

      {/* Bold Toggle */}
      <button
        onClick={() => handleUpdateFont({ is_bold: !span.is_bold })}
        className={`p-1.5 rounded-lg transition ${
          span.is_bold ? 'bg-indigo-100 text-indigo-700 font-bold' : 'hover:bg-gray-100 text-gray-600'
        }`}
        title="Toggle Bold"
      >
        <Bold className="w-3.5 h-3.5" />
      </button>

      {/* Italic Toggle */}
      <button
        onClick={() => handleUpdateFont({ is_italic: !span.is_italic })}
        className={`p-1.5 rounded-lg transition ${
          span.is_italic ? 'bg-indigo-100 text-indigo-700 italic font-bold' : 'hover:bg-gray-100 text-gray-600'
        }`}
        title="Toggle Italic"
      >
        <Italic className="w-3.5 h-3.5" />
      </button>

      {/* Color Picker */}
      <div className="relative flex items-center p-0.5">
        <input
          type="color"
          value={span.color || '#000000'}
          onChange={(e) => handleUpdateFont({ color_hex: e.target.value })}
          className="w-6 h-6 border-none bg-transparent cursor-pointer rounded"
          title="Change Text Color"
        />
      </div>

      <div className="h-4 w-px bg-gray-200" />

      {/* Subset Font Indicator */}
      {span.is_subset_font && (
        <span
          title={`Subset font (${span.pdf_font_resource}). Reusing base family '${span.font_family}'`}
          className="flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-mono"
        >
          <AlertCircle className="w-3 h-3 text-amber-600" /> Subset
        </span>
      )}

      {/* Delete Text */}
      <button
        onClick={handleDelete}
        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
        title="Delete Text Span"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

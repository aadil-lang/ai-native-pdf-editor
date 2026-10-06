'use client';

import React, { useState, useRef } from 'react';
import { PDFPage, PDFTextSpan } from '@/types/pdf';
import { pdfToScreenRect, screenToPdfRect, screenToPdfPoint } from '@/lib/pdfCoordinates';
import { usePdfStore } from '@/stores/usePdfStore';
import { FormattingToolbar } from './FormattingToolbar';

interface EditingOverlayProps {
  page: PDFPage;
  scale: number;
  onOpenSignature: () => void;
}

export const EditingOverlay: React.FC<EditingOverlayProps> = ({ page, scale, onOpenSignature }) => {
  const {
    activeTool,
    selectedObject,
    setSelectedObject,
    applyOps,
    searchResults,
    searchQuery,
  } = usePdfStore();

  const [editingSpanId, setEditingSpanId] = useState<string | null>(null);
  const [inlineText, setInlineText] = useState('');

  // Drag state for moving selected object
  const [moveStart, setMoveStart] = useState<{ x: number; y: number } | null>(null);
  const isMovingRef = useRef(false);

  // Mouse drag selection state for Redact / Shapes / New Text
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);

  // Freehand drawing state
  const [currentPath, setCurrentPath] = useState<Array<[number, number]>>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  const handleSpanClick = (span: PDFTextSpan, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedObject({
      id: span.id,
      type: 'span',
      pageNumber: page.page_number,
      data: span,
    });
  };

  const handleSpanDoubleClick = (span: PDFTextSpan, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSpanId(span.id);
    setInlineText(span.text);
  };

  const handleInlineSubmit = async (span: PDFTextSpan) => {
    if (inlineText !== span.text) {
      await applyOps([
        {
          operation_type: 'replace_text',
          page_number: page.page_number,
          target_text: span.text,
          replacement_text: inlineText,
          bbox: span.bbox,
          font_size: span.font_size,
          color_hex: span.color,
          is_bold: span.is_bold,
          is_italic: span.is_italic,
          font_family: span.font_family,
        },
      ]);
    }
    setEditingSpanId(null);
  };

  const handleFormFieldChange = async (fName: string, newValue: string) => {
    await applyOps([
      {
        operation_type: 'update_form_field',
        page_number: page.page_number,
        field_name: fName,
        field_value: newValue,
      },
    ]);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === 'signature') {
      onOpenSignature();
      return;
    }

    if (activeTool === 'draw') {
      setIsDrawing(true);
      setCurrentPath([[x, y]]);
      return;
    }

    if (['redact', 'shape', 'highlight', 'text'].includes(activeTool)) {
      isDraggingRef.current = true;
      setDragStart({ x, y });
      setDragCurrent({ x, y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isDrawing && activeTool === 'draw') {
      setCurrentPath((prev) => [...prev, [x, y]]);
      return;
    }

    if (isDraggingRef.current && dragStart) {
      setDragCurrent({ x, y });
    }
  };

  const handleMouseUp = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDrawing && activeTool === 'draw') {
      setIsDrawing(false);
      if (currentPath.length > 2) {
        const pdfPoints = currentPath.map(([px, py]) => {
          const pt = screenToPdfPoint(px, py, scale);
          return [pt.x, pt.y];
        });

        const startPt = pdfPoints[0];
        const endPt = pdfPoints[pdfPoints.length - 1];

        await applyOps([
          {
            operation_type: 'add_shape',
            page_number: page.page_number,
            shape_type: 'line',
            start_point: [startPt[0], startPt[1]],
            end_point: [endPt[0], endPt[1]],
            stroke_color_hex: '#ef4444',
            stroke_width: 2.0,
          },
        ]);
      }
      setCurrentPath([]);
      return;
    }

    if (isDraggingRef.current && dragStart && dragCurrent) {
      isDraggingRef.current = false;

      const left = Math.min(dragStart.x, dragCurrent.x);
      const top = Math.min(dragStart.y, dragCurrent.y);
      const width = Math.abs(dragCurrent.x - dragStart.x);
      const height = Math.abs(dragCurrent.y - dragStart.y);

      setDragStart(null);
      setDragCurrent(null);

      if (width < 5 && height < 5 && activeTool !== 'text') return;

      const pdfBox = screenToPdfRect(left, top, width, height, scale);

      if (activeTool === 'redact') {
        await applyOps([
          {
            operation_type: 'redact_region',
            page_number: page.page_number,
            bbox: pdfBox,
            fill_color_hex: '#000000',
          },
        ]);
      } else if (activeTool === 'highlight') {
        await applyOps([
          {
            operation_type: 'highlight_text',
            page_number: page.page_number,
            bbox: pdfBox,
            color_hex: '#ffff00',
          },
        ]);
      } else if (activeTool === 'shape') {
        await applyOps([
          {
            operation_type: 'add_shape',
            page_number: page.page_number,
            shape_type: 'rectangle',
            bbox: pdfBox,
            stroke_color_hex: '#4f46e5',
            fill_color_hex: '#6366f120',
            stroke_width: 2.0,
          },
        ]);
      } else if (activeTool === 'text') {
        const textToInsert = prompt('Enter text to insert:', 'Sample Text');
        if (textToInsert) {
          const pt = screenToPdfPoint(left, top, scale);
          await applyOps([
            {
              operation_type: 'insert_text',
              page_number: page.page_number,
              text: textToInsert,
              x: pt.x,
              y: pt.y,
              font_size: 12,
              color_hex: '#000000',
            },
          ]);
        }
      }
    }
  };

  const isSearchHit = (spanId: string) => {
    if (!searchQuery) return false;
    return searchResults.some(
      (r) => r.pageNumber === page.page_number && r.span.id === spanId
    );
  };

  const selectedSpan = selectedObject?.type === 'span' && selectedObject.pageNumber === page.page_number ? (selectedObject.data as PDFTextSpan) : null;
  const selectedSpanScreenRect = selectedSpan ? pdfToScreenRect(selectedSpan.bbox, scale) : null;

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className={`absolute inset-0 select-none ${
        activeTool === 'select'
          ? 'cursor-default'
          : activeTool === 'text'
          ? 'cursor-text'
          : activeTool === 'draw'
          ? 'cursor-crosshair'
          : 'cursor-crosshair'
      }`}
    >
      {/* Interactive Floating Formatting Toolbar for Selected Text */}
      {selectedSpan && selectedSpanScreenRect && (
        <FormattingToolbar
          span={selectedSpan}
          pageNumber={page.page_number}
          screenPos={selectedSpanScreenRect}
        />
      )}

      {/* Existing Text Spans Layer */}
      {page.spans.map((span) => {
        const sRect = pdfToScreenRect(span.bbox, scale);
        const isSelected = selectedObject?.id === span.id;
        const isEditing = editingSpanId === span.id;
        const searchHit = isSearchHit(span.id);

        return (
          <div
            key={span.id}
            onClick={(e) => handleSpanClick(span, e)}
            onDoubleClick={(e) => handleSpanDoubleClick(span, e)}
            style={{
              left: `${sRect.left}px`,
              top: `${sRect.top}px`,
              width: `${sRect.width}px`,
              height: `${sRect.height}px`,
            }}
            title={`Text: "${span.text}" (Double click to edit / Click to inspect)`}
            className={`absolute transition-all border ${
              isEditing
                ? 'z-30 ring-2 ring-indigo-600 bg-white'
                : isSelected
                ? 'border-indigo-600 bg-indigo-500/10 z-20 shadow-xs'
                : searchHit
                ? 'border-yellow-500 bg-yellow-400/40 z-10 animate-pulse'
                : 'border-transparent hover:border-indigo-400/60 hover:bg-indigo-500/5'
            }`}
          >
            {/* Selection Bounding Handles */}
            {isSelected && !isEditing && (
              <>
                <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-indigo-600 border border-white rounded-full z-30" />
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-indigo-600 border border-white rounded-full z-30" />
                <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-indigo-600 border border-white rounded-full z-30" />
                <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-indigo-600 border border-white rounded-full z-30" />
              </>
            )}

            {isEditing ? (
              <input
                type="text"
                autoFocus
                value={inlineText}
                onChange={(e) => setInlineText(e.target.value)}
                onBlur={() => handleInlineSubmit(span)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleInlineSubmit(span);
                  if (e.key === 'Escape') setEditingSpanId(null);
                }}
                className="w-full h-full text-xs font-sans px-1 py-0 bg-white text-gray-900 focus:outline-none border-none"
              />
            ) : null}
          </div>
        );
      })}

      {/* Interactive Form Fields Layer */}
      {page.form_fields?.map((field) => {
        const fRect = pdfToScreenRect(field.bbox, scale);
        return (
          <div
            key={field.id}
            style={{
              left: `${fRect.left}px`,
              top: `${fRect.top}px`,
              width: `${fRect.width}px`,
              height: `${fRect.height}px`,
            }}
            className="absolute z-20 border border-indigo-400 bg-indigo-50/80 rounded px-1 flex items-center"
          >
            {field.type === 'checkbox' ? (
              <input
                type="checkbox"
                checked={field.value === 'Yes' || field.value === 'true'}
                onChange={(e) => handleFormFieldChange(field.name, e.target.checked ? 'Yes' : 'Off')}
                className="w-4 h-4 cursor-pointer text-indigo-600"
              />
            ) : (
              <input
                type="text"
                value={field.value || ''}
                onChange={(e) => handleFormFieldChange(field.name, e.target.value)}
                placeholder={field.name}
                className="w-full h-full bg-transparent text-xs text-gray-900 focus:outline-none border-none"
              />
            )}
          </div>
        );
      })}

      {/* Freehand Draw Polyline SVG Preview */}
      {currentPath.length > 1 && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-30">
          <polyline
            fill="none"
            stroke="#ef4444"
            strokeWidth="3"
            points={currentPath.map(([x, y]) => `${x},${y}`).join(' ')}
          />
        </svg>
      )}

      {/* Drag Selection Box Preview */}
      {dragStart && dragCurrent && (
        <div
          style={{
            left: `${Math.min(dragStart.x, dragCurrent.x)}px`,
            top: `${Math.min(dragStart.y, dragCurrent.y)}px`,
            width: `${Math.abs(dragCurrent.x - dragStart.x)}px`,
            height: `${Math.abs(dragCurrent.y - dragStart.y)}px`,
          }}
          className={`absolute border-2 pointer-events-none z-30 ${
            activeTool === 'redact'
              ? 'border-red-500 bg-red-500/30'
              : activeTool === 'highlight'
              ? 'border-yellow-500 bg-yellow-400/40'
              : 'border-indigo-500 bg-indigo-500/20'
          }`}
        />
      )}
    </div>
  );
};

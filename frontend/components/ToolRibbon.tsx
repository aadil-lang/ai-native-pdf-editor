'use client';

import React from 'react';
import {
  MousePointer,
  Edit3,
  Type,
  Image as ImageIcon,
  Highlighter,
  Pencil,
  Square,
  EyeOff,
  FilePlus,
  PenTool,
} from 'lucide-react';
import { usePdfStore, ToolType } from '@/stores/usePdfStore';

export const ToolRibbon: React.FC = () => {
  const { activeTool, setActiveTool, document, applyOps, activePage } = usePdfStore();

  const tools: Array<{ id: ToolType; label: string; shortcut: string; icon: React.ReactNode }> = [
    { id: 'select', label: 'Select Object', shortcut: 'V', icon: <MousePointer className="w-3.5 h-3.5" /> },
    { id: 'edit_text', label: 'Edit Text', shortcut: 'E', icon: <Edit3 className="w-3.5 h-3.5" /> },
    { id: 'text', label: 'Add Text Box', shortcut: 'T', icon: <Type className="w-3.5 h-3.5" /> },
    { id: 'image', label: 'Insert Image', shortcut: '', icon: <ImageIcon className="w-3.5 h-3.5" /> },
    { id: 'highlight', label: 'Highlight Text', shortcut: 'H', icon: <Highlighter className="w-3.5 h-3.5" /> },
    { id: 'draw', label: 'Freehand Draw', shortcut: 'D', icon: <Pencil className="w-3.5 h-3.5" /> },
    { id: 'shape', label: 'Shapes', shortcut: 'R', icon: <Square className="w-3.5 h-3.5" /> },
    { id: 'signature', label: 'Signature Stamp', shortcut: '', icon: <PenTool className="w-3.5 h-3.5" /> },
    { id: 'redact', label: 'Redact Region', shortcut: '', icon: <EyeOff className="w-3.5 h-3.5" /> },
  ];

  const handleAddBlankPage = async () => {
    if (!document) return;
    await applyOps([
      {
        operation_type: 'add_blank_page',
        page_number: activePage,
        width: 612,
        height: 792,
      },
    ]);
  };

  return (
    <div className="h-10 bg-white border-b border-gray-200 text-gray-700 flex items-center justify-between px-4 z-10 shadow-2xs">
      <div className="flex items-center gap-1">
        {tools.map((t) => {
          const isActive = activeTool === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTool(t.id)}
              title={`${t.label} ${t.shortcut ? `(${t.shortcut})` : ''}`}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
              {t.shortcut && (
                <kbd
                  className={`text-[9px] font-mono px-1 rounded ${
                    isActive ? 'bg-indigo-700 text-indigo-100' : 'bg-gray-100 text-gray-400 border border-gray-200'
                  }`}
                >
                  {t.shortcut}
                </kbd>
              )}
            </button>
          );
        })}
      </div>

      {document && (
        <div className="flex items-center gap-2">
          <button
            onClick={handleAddBlankPage}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200 rounded-md transition"
          >
            <FilePlus className="w-3.5 h-3.5 text-indigo-600" />
            Add Blank Page
          </button>
        </div>
      )}
    </div>
  );
};

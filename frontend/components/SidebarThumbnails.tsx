'use client';

import React from 'react';
import { RotateCw, Trash2, Copy, ArrowUp, ArrowDown, Layout } from 'lucide-react';
import { usePdfStore } from '@/stores/usePdfStore';
import { getPageImageUrl } from '@/lib/api';

export const SidebarThumbnails: React.FC = () => {
  const { document, activePage, setActivePage, applyOps } = usePdfStore();

  if (!document) {
    return (
      <aside className="w-56 bg-white border-r border-gray-200 p-4 text-gray-400 text-xs flex flex-col items-center justify-center text-center">
        <Layout className="w-8 h-8 mb-2 text-gray-300" />
        <p className="font-semibold text-gray-500">No Document</p>
      </aside>
    );
  }

  const handleRotatePage = async (pNum: number, e: React.MouseEvent) => {
    e.stopPropagation();
    await applyOps([
      {
        operation_type: 'rotate_page',
        page_number: pNum,
        angle: 90,
      },
    ]);
  };

  const handleDeletePage = async (pNum: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (document.page_count <= 1) {
      alert('Cannot delete the last remaining page.');
      return;
    }
    if (confirm(`Delete page ${pNum}?`)) {
      await applyOps([
        {
          operation_type: 'delete_page',
          page_number: pNum,
        },
      ]);
    }
  };

  const handleDuplicatePage = async (pNum: number, e: React.MouseEvent) => {
    e.stopPropagation();
    await applyOps([
      {
        operation_type: 'duplicate_page',
        page_number: pNum,
      },
    ]);
  };

  const handleMovePage = async (pNum: number, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    const targetIdx = direction === 'up' ? pNum - 1 : pNum + 1;
    if (targetIdx < 1 || targetIdx > document.page_count) return;

    const pageOrder = Array.from({ length: document.page_count }, (_, i) => i + 1);
    const temp = pageOrder[pNum - 1];
    pageOrder[pNum - 1] = pageOrder[targetIdx - 1];
    pageOrder[targetIdx - 1] = temp;

    await applyOps([
      {
        operation_type: 'reorder_pages',
        new_page_order: pageOrder,
      },
    ]);
  };

  return (
    <aside className="w-60 bg-white border-r border-gray-200 flex flex-col h-full z-10 overflow-hidden">
      <div className="p-3 border-b border-gray-200 text-gray-500 font-bold text-[11px] tracking-wider uppercase flex justify-between items-center">
        <span>Pages ({document.page_count})</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {document.pages.map((page) => {
          const pNum = page.page_number;
          const isActive = activePage === pNum;
          const imgUrl = getPageImageUrl(document.id, pNum, 0.35, document.current_revision_index);

          return (
            <div
              key={`thumb_${pNum}`}
              onClick={() => setActivePage(pNum)}
              className={`group relative rounded-xl border-2 p-2 cursor-pointer transition flex flex-col items-center bg-gray-50/50 ${
                isActive
                  ? 'border-indigo-600 bg-indigo-50/40 shadow-sm ring-1 ring-indigo-600'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Page Number Label */}
              <div className="w-full flex justify-between items-center mb-1 text-[11px] text-gray-600 font-mono">
                <span className="font-bold text-gray-900">Page {pNum}</span>
                <span className="text-[10px] text-gray-400">
                  {Math.round(page.width)}×{Math.round(page.height)} pt
                </span>
              </div>

              {/* Page Image */}
              <div className="w-full aspect-[1/1.3] bg-white rounded-lg flex items-center justify-center overflow-hidden border border-gray-200 shadow-xs">
                <img
                  src={imgUrl}
                  alt={`Page ${pNum}`}
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              </div>

              {/* Hover Actions */}
              <div className="absolute inset-x-2 bottom-2 bg-white/95 backdrop-blur border border-gray-200 rounded-lg p-1 opacity-0 group-hover:opacity-100 transition flex items-center justify-around text-gray-700 shadow-md">
                <button
                  onClick={(e) => handleMovePage(pNum, 'up', e)}
                  disabled={pNum === 1}
                  title="Move Page Up"
                  className="p-1 hover:text-gray-900 disabled:opacity-30 hover:bg-gray-100 rounded"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => handleMovePage(pNum, 'down', e)}
                  disabled={pNum === document.page_count}
                  title="Move Page Down"
                  className="p-1 hover:text-gray-900 disabled:opacity-30 hover:bg-gray-100 rounded"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => handleRotatePage(pNum, e)}
                  title="Rotate Page"
                  className="p-1 hover:text-gray-900 hover:bg-gray-100 rounded"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => handleDuplicatePage(pNum, e)}
                  title="Duplicate Page"
                  className="p-1 hover:text-gray-900 hover:bg-gray-100 rounded"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => handleDeletePage(pNum, e)}
                  title="Delete Page"
                  className="p-1 hover:text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};

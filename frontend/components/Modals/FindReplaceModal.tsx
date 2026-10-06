'use client';

import React, { useState } from 'react';
import { Search, ChevronDown, ChevronUp, RefreshCw, X } from 'lucide-react';
import { usePdfStore } from '@/stores/usePdfStore';

interface FindReplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FindReplaceModal: React.FC<FindReplaceModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [replacementText, setReplacementText] = useState('');
  const [isReplacing, setIsReplacing] = useState(false);

  const {
    document,
    searchQuery,
    setSearchQuery,
    searchResults,
    currentSearchIndex,
    nextSearchResult,
    prevSearchResult,
    applyOps,
    activePage,
  } = usePdfStore();

  if (!isOpen) return null;

  const matchCount = searchResults.length;
  const currentMatch = matchCount > 0 ? searchResults[currentSearchIndex] : null;

  const handleReplaceCurrent = async () => {
    if (!document || !currentMatch || !replacementText) return;
    setIsReplacing(true);
    await applyOps([
      {
        operation_type: 'replace_text',
        page_number: currentMatch.pageNumber,
        target_text: currentMatch.span.text,
        replacement_text: replacementText,
        bbox: currentMatch.span.bbox,
        font_family: currentMatch.span.font_family,
        font_size: currentMatch.span.font_size,
        color_hex: currentMatch.span.color,
        is_bold: currentMatch.span.is_bold,
        is_italic: currentMatch.span.is_italic,
      },
    ]);
    setIsReplacing(false);
    // Refresh search matches
    setSearchQuery(searchQuery);
  };

  const handleReplaceAll = async () => {
    if (!document || matchCount === 0 || !replacementText) return;
    setIsReplacing(true);

    const ops = searchResults.map((m) => ({
      operation_type: 'replace_text' as const,
      page_number: m.pageNumber,
      target_text: m.span.text,
      replacement_text: replacementText,
      bbox: m.span.bbox,
      font_family: m.span.font_family,
      font_size: m.span.font_size,
      color_hex: m.span.color,
      is_bold: m.span.is_bold,
      is_italic: m.span.is_italic,
    }));

    await applyOps(ops);
    setIsReplacing(false);
    setSearchQuery(searchQuery);
  };

  return (
    <div className="fixed top-16 right-6 z-40 bg-white border border-gray-200 rounded-2xl shadow-2xl p-4 w-96 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
          <Search className="w-4 h-4 text-indigo-600" />
          <span>Find & Replace Text</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Find input */}
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-semibold text-gray-600">Find Text</label>
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder="Type text to search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-16"
          />
          {searchQuery && (
            <span className="absolute right-2 text-[10px] font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
              {matchCount > 0 ? `${currentSearchIndex + 1}/${matchCount}` : '0 matches'}
            </span>
          )}
        </div>
      </div>

      {/* Match Navigation buttons */}
      {matchCount > 0 && (
        <div className="flex items-center justify-between text-xs text-gray-600 bg-indigo-50/50 p-2 rounded-lg border border-indigo-100">
          <span>Found on Page {currentMatch?.pageNumber}</span>
          <div className="flex items-center gap-1">
            <button
              onClick={prevSearchResult}
              title="Previous Match"
              className="p-1 bg-white border border-gray-200 rounded hover:bg-gray-100"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={nextSearchResult}
              title="Next Match"
              className="p-1 bg-white border border-gray-200 rounded hover:bg-gray-100"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Replacement input */}
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-semibold text-gray-600">Replace With</label>
        <input
          type="text"
          placeholder="New replacement text..."
          value={replacementText}
          onChange={(e) => setReplacementText(e.target.value)}
          className="w-full text-xs border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          onClick={handleReplaceCurrent}
          disabled={!currentMatch || !replacementText || isReplacing}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition shadow-2xs flex items-center gap-1"
        >
          {isReplacing && <RefreshCw className="w-3 h-3 animate-spin" />}
          Replace
        </button>
        <button
          onClick={handleReplaceAll}
          disabled={matchCount === 0 || !replacementText || isReplacing}
          className="px-3 py-1.5 bg-gray-800 hover:bg-gray-900 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition shadow-2xs"
        >
          Replace All ({matchCount})
        </button>
      </div>
    </div>
  );
};

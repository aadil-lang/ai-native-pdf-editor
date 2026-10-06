'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  FileUp,
  Download,
  Undo2,
  Redo2,
  FileText,
  Sparkles,
  Settings,
  History,
  Info,
  Layers,
  Type,
  Maximize2,
  Minimize2,
  Eye,
  Scissors,
  Wand2,
} from 'lucide-react';
import { usePdfStore } from '@/stores/usePdfStore';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  onOpenConvert: () => void;
  onOpenDocInfo: () => void;
  onOpenHistory: () => void;
  onTriggerFileUpload: () => void;
}

interface CommandItem {
  id: string;
  category: 'File' | 'Edit' | 'View' | 'Document' | 'AI';
  title: string;
  description: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onOpenSettings,
  onOpenConvert,
  onOpenDocInfo,
  onOpenHistory,
  onTriggerFileUpload,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    document,
    undo,
    redo,
    setActiveTool,
    setZoom,
    zoom,
    setIsFindReplaceOpen,
    setIsExportModalOpen,
    setIsShortcutsOpen,
    toggleSidebar,
    toggleProperties,
  } = usePdfStore();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const commands: CommandItem[] = [
    {
      id: 'open_file',
      category: 'File',
      title: 'Open PDF File',
      description: 'Import a local PDF document into PaperForge workspace',
      icon: <FileUp className="w-4 h-4 text-indigo-600" />,
      shortcut: 'Ctrl+O',
      action: () => {
        onClose();
        onTriggerFileUpload();
      },
    },
    {
      id: 'export_doc',
      category: 'File',
      title: 'Export Document',
      description: 'Export PDF or convert to DOCX, TXT, MD, HTML',
      icon: <Download className="w-4 h-4 text-emerald-600" />,
      shortcut: 'Ctrl+Shift+S',
      action: () => {
        onClose();
        setIsExportModalOpen(true);
      },
    },
    {
      id: 'find_replace',
      category: 'Edit',
      title: 'Find & Replace',
      description: 'Search for text matches and perform structured replacement',
      icon: <Search className="w-4 h-4 text-amber-600" />,
      shortcut: 'Ctrl+F',
      action: () => {
        onClose();
        setIsFindReplaceOpen(true);
      },
    },
    {
      id: 'undo',
      category: 'Edit',
      title: 'Undo Revision',
      description: 'Revert the last document operation',
      icon: <Undo2 className="w-4 h-4 text-gray-600" />,
      shortcut: 'Ctrl+Z',
      action: () => {
        onClose();
        undo();
      },
    },
    {
      id: 'redo',
      category: 'Edit',
      title: 'Redo Revision',
      description: 'Re-apply the previously undone operation',
      icon: <Redo2 className="w-4 h-4 text-gray-600" />,
      shortcut: 'Ctrl+Y',
      action: () => {
        onClose();
        redo();
      },
    },
    {
      id: 'tool_text',
      category: 'Document',
      title: 'Add Text Box',
      description: 'Insert new editable typography text box',
      icon: <Type className="w-4 h-4 text-blue-600" />,
      shortcut: 'T',
      action: () => {
        onClose();
        setActiveTool('text');
      },
    },
    {
      id: 'tool_highlight',
      category: 'Document',
      title: 'Highlight Text',
      description: 'Apply text highlight markup to canvas text',
      icon: <Eye className="w-4 h-4 text-yellow-600" />,
      shortcut: 'H',
      action: () => {
        onClose();
        setActiveTool('highlight');
      },
    },
    {
      id: 'tool_redact',
      category: 'Document',
      title: 'Redact Region',
      description: 'Permanently remove sensitive vector and text content',
      icon: <Scissors className="w-4 h-4 text-red-600" />,
      action: () => {
        onClose();
        setActiveTool('redact');
      },
    },
    {
      id: 'view_fit_width',
      category: 'View',
      title: 'Zoom: Fit Width',
      description: 'Adjust zoom level to fit canvas width',
      icon: <Maximize2 className="w-4 h-4 text-purple-600" />,
      action: () => {
        onClose();
        setZoom(1.2);
      },
    },
    {
      id: 'toggle_thumbnails',
      category: 'View',
      title: 'Toggle Pages Thumbnail Panel',
      description: 'Show or hide the page navigation sidebar',
      icon: <Layers className="w-4 h-4 text-gray-600" />,
      action: () => {
        onClose();
        toggleSidebar();
      },
    },
    {
      id: 'history_audit',
      category: 'Document',
      title: 'Revision History Audit',
      description: 'Inspect full audit stack of document edits',
      icon: <History className="w-4 h-4 text-indigo-600" />,
      action: () => {
        onClose();
        onOpenHistory();
      },
    },
    {
      id: 'doc_info',
      category: 'Document',
      title: 'Document Properties & Fonts',
      description: 'Inspect metadata, page specs, and extracted fonts',
      icon: <Info className="w-4 h-4 text-blue-600" />,
      action: () => {
        onClose();
        onOpenDocInfo();
      },
    },
    {
      id: 'ai_settings',
      category: 'AI',
      title: 'AI Provider Settings',
      description: 'Configure Ollama (Local) or Gemini (Cloud)',
      icon: <Wand2 className="w-4 h-4 text-indigo-600" />,
      action: () => {
        onClose();
        onOpenSettings();
      },
    },
    {
      id: 'keyboard_shortcuts',
      category: 'View',
      title: 'Keyboard Shortcuts',
      description: 'View list of all available keyboard shortcuts',
      icon: <FileText className="w-4 h-4 text-emerald-600" />,
      action: () => {
        onClose();
        setIsShortcutsOpen(true);
      },
    },
  ];

  const filteredCommands = commands.filter(
    (cmd) =>
      cmd.title.toLowerCase().includes(query.toLowerCase()) ||
      cmd.description.toLowerCase().includes(query.toLowerCase()) ||
      cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredCommands.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev === 0 ? (filteredCommands.length || 1) - 1 : prev - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-gray-900/40 backdrop-blur-xs p-4">
      <div
        className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col transition-all duration-200"
        onKeyDown={handleKeyDown}
      >
        {/* Search Header Input */}
        <div className="flex items-center px-4 py-3 border-b border-gray-100 gap-3">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search actions... (e.g., Export, Find, Text)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="w-full text-sm outline-none bg-transparent placeholder-gray-400 text-gray-900 font-medium"
          />
          <kbd className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-gray-100 text-gray-500 rounded border border-gray-200">
            ESC
          </kbd>
        </div>

        {/* Command Options List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-gray-50">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-500">
              No matching commands found. Try searching for "Export" or "Text".
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => (
              <div
                key={cmd.id}
                onClick={() => cmd.action()}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition ${
                  idx === selectedIndex ? 'bg-indigo-50/80 text-indigo-950' : 'hover:bg-gray-50 text-gray-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg border border-gray-200 shadow-2xs">
                    {cmd.icon}
                  </div>
                  <div>
                    <div className="text-xs font-semibold flex items-center gap-2">
                      <span>{cmd.title}</span>
                      <span className="px-1.5 py-0.2 text-[9px] rounded font-mono uppercase bg-gray-100 text-gray-500 border border-gray-200">
                        {cmd.category}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-500 truncate max-w-sm">
                      {cmd.description}
                    </div>
                  </div>
                </div>

                {cmd.shortcut && (
                  <kbd className="px-2 py-0.5 text-[10px] font-mono font-medium bg-gray-100 text-gray-500 rounded border border-gray-200">
                    {cmd.shortcut}
                  </kbd>
                )}
              </div>
            ))
          )}
        </div>

        {/* Command Palette Footer */}
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="font-mono font-semibold">↑</kbd> <kbd className="font-mono font-semibold">↓</kbd> Navigate
            </span>
            <span>
              <kbd className="font-mono font-semibold">↵</kbd> Execute
            </span>
          </div>
          <span>PaperForge Command Bar</span>
        </div>
      </div>
    </div>
  );
};

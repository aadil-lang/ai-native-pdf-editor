'use client';

import React from 'react';
import { Keyboard, X } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcutGroups = [
    {
      title: 'File & Workflow',
      items: [
        { keys: ['Ctrl', 'O'], label: 'Open PDF File' },
        { keys: ['Ctrl', 'S'], label: 'Save Revision' },
        { keys: ['Ctrl', 'Shift', 'S'], label: 'Export Document' },
        { keys: ['Ctrl', 'K'], label: 'Open Command Palette' },
      ],
    },
    {
      title: 'Editing & Revisions',
      items: [
        { keys: ['Ctrl', 'Z'], label: 'Undo Revision' },
        { keys: ['Ctrl', 'Y'], label: 'Redo Revision' },
        { keys: ['Ctrl', 'F'], label: 'Find & Replace' },
        { keys: ['Esc'], label: 'Clear Active Selection' },
      ],
    },
    {
      title: 'Canvas Tools',
      items: [
        { keys: ['V'], label: 'Select Object Tool' },
        { keys: ['T'], label: 'Add Text Box Tool' },
        { keys: ['H'], label: 'Text Highlight Tool' },
        { keys: ['D'], label: 'Freehand Draw Tool' },
        { keys: ['R'], label: 'Shape Tool' },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-xs p-4">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Keyboard Shortcuts</h3>
              <p className="text-[11px] text-gray-500">Fast keyboard controls for PaperForge workspace</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="p-6 flex flex-col gap-6 max-h-[70vh] overflow-y-auto">
          {shortcutGroups.map((group) => (
            <div key={group.title} className="flex flex-col gap-2">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                {group.title}
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {group.items.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between p-2 rounded-xl bg-gray-50 border border-gray-100 text-xs"
                  >
                    <span className="text-gray-700 font-medium">{item.label}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((k) => (
                        <kbd
                          key={k}
                          className="px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-white border border-gray-200 rounded shadow-2xs text-gray-600"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

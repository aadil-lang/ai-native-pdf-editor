'use client';

import React, { useRef, useState, useEffect } from 'react';
import {
  FileUp,
  Download,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Search,
  Settings,
  Sparkles,
  Maximize2,
  AlignLeft,
  FileOutput,
  Info,
  History,
  DownloadCloud,
  FileText,
  Keyboard,
  Wand2,
  Eye,
  Layers,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { usePdfStore } from '@/stores/usePdfStore';
import { uploadPdf } from '@/lib/api';

interface NavbarProps {
  onOpenSettings: () => void;
  onOpenConvert: () => void;
  onOpenDocInfo: () => void;
  onOpenHistory: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSettings,
  onOpenConvert,
  onOpenDocInfo,
  onOpenHistory,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [deferredPwaPrompt, setDeferredPwaPrompt] = useState<any>(null);

  const {
    document,
    setDocument,
    zoom,
    setZoom,
    history,
    currentHistoryPointer,
    undo,
    redo,
    isSaving,
    isDirty,
    recentDocs,
    setIsCommandPaletteOpen,
    setIsFindReplaceOpen,
    setIsExportModalOpen,
    setIsShortcutsOpen,
    setActiveTool,
    toggleSidebar,
    toggleProperties,
  } = usePdfStore();

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPwaPrompt(e);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveMenu(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const doc = await uploadPdf(file);
      setDocument(doc);
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
    }
  };

  const handleInstallPwa = () => {
    if (deferredPwaPrompt) {
      deferredPwaPrompt.prompt();
      deferredPwaPrompt.userChoice.then(() => setDeferredPwaPrompt(null));
    }
  };

  const canUndo = currentHistoryPointer > 0;
  const canRedo = currentHistoryPointer < history.length - 1;

  const toggleMenu = (e: React.MouseEvent, menuName: string) => {
    e.stopPropagation();
    setActiveMenu(activeMenu === menuName ? null : menuName);
  };

  return (
    <header className="h-14 bg-white border-b border-gray-200 text-gray-900 flex items-center justify-between px-3 z-30 shadow-2xs font-sans">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".pdf"
        className="hidden"
      />

      {/* Left Brand & Compact App Menu Bar */}
      <div className="flex items-center gap-3">
        {/* Brand */}
        <div className="flex items-center gap-2 font-bold text-sm tracking-tight text-gray-900">
          <div className="p-1.5 bg-indigo-600 rounded-lg shadow-2xs">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold text-gray-900">PaperForge</span>
        </div>

        <div className="h-4 w-px bg-gray-200" />

        {/* Professional App Dropdown Menus */}
        <nav className="flex items-center gap-1 text-xs font-medium text-gray-700">
          {/* File Menu */}
          <div className="relative">
            <button
              onClick={(e) => toggleMenu(e, 'file')}
              className={`px-2.5 py-1 rounded-md transition ${
                activeMenu === 'file' ? 'bg-gray-100 text-gray-900 font-semibold' : 'hover:bg-gray-100'
              }`}
            >
              File
            </button>
            {activeMenu === 'file' && (
              <div className="absolute left-0 top-7 w-52 bg-white border border-gray-200 rounded-xl shadow-xl z-40 p-1 text-xs text-gray-700 flex flex-col gap-0.5">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full text-left px-3 py-1.5 hover:bg-indigo-50 hover:text-indigo-900 rounded-lg flex items-center justify-between"
                >
                  <span className="flex items-center gap-2"><FileUp className="w-3.5 h-3.5 text-indigo-600" /> Open PDF...</span>
                  <span className="text-[10px] font-mono text-gray-400">Ctrl+O</span>
                </button>

                {recentDocs.length > 0 && (
                  <div className="relative group">
                    <div className="px-3 py-1.5 text-gray-500 font-semibold text-[10px] uppercase tracking-wider flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Recent Documents
                    </div>
                    {recentDocs.slice(0, 3).map((r) => (
                      <div
                        key={r.id}
                        className="px-3 py-1 hover:bg-gray-50 text-[11px] truncate text-gray-700 cursor-default"
                      >
                        {r.filename}
                      </div>
                    ))}
                  </div>
                )}

                <div className="my-1 border-t border-gray-100" />
                <button
                  onClick={() => setIsExportModalOpen(true)}
                  disabled={!document}
                  className="w-full text-left px-3 py-1.5 hover:bg-gray-50 disabled:opacity-40 rounded-lg flex items-center justify-between"
                >
                  <span className="flex items-center gap-2"><Download className="w-3.5 h-3.5 text-emerald-600" /> Export Document...</span>
                  <span className="text-[10px] font-mono text-gray-400">Ctrl+Shift+S</span>
                </button>

                <button
                  onClick={onOpenConvert}
                  disabled={!document}
                  className="w-full text-left px-3 py-1.5 hover:bg-gray-50 disabled:opacity-40 rounded-lg flex items-center gap-2"
                >
                  <FileOutput className="w-3.5 h-3.5 text-indigo-600" /> Convert Format...
                </button>

                <div className="my-1 border-t border-gray-100" />
                <button
                  onClick={onOpenDocInfo}
                  disabled={!document}
                  className="w-full text-left px-3 py-1.5 hover:bg-gray-50 disabled:opacity-40 rounded-lg flex items-center gap-2"
                >
                  <Info className="w-3.5 h-3.5 text-blue-600" /> Document Info
                </button>

                {document && (
                  <button
                    onClick={() => setDocument(null)}
                    className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-600 rounded-lg"
                  >
                    Close Document
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Edit Menu */}
          <div className="relative">
            <button
              onClick={(e) => toggleMenu(e, 'edit')}
              className={`px-2.5 py-1 rounded-md transition ${
                activeMenu === 'edit' ? 'bg-gray-100 text-gray-900 font-semibold' : 'hover:bg-gray-100'
              }`}
            >
              Edit
            </button>
            {activeMenu === 'edit' && (
              <div className="absolute left-0 top-7 w-52 bg-white border border-gray-200 rounded-xl shadow-xl z-40 p-1 text-xs text-gray-700 flex flex-col gap-0.5">
                <button
                  onClick={undo}
                  disabled={!canUndo}
                  className="w-full text-left px-3 py-1.5 hover:bg-gray-50 disabled:opacity-40 rounded-lg flex items-center justify-between"
                >
                  <span className="flex items-center gap-2"><Undo2 className="w-3.5 h-3.5 text-gray-600" /> Undo</span>
                  <span className="text-[10px] font-mono text-gray-400">Ctrl+Z</span>
                </button>
                <button
                  onClick={redo}
                  disabled={!canRedo}
                  className="w-full text-left px-3 py-1.5 hover:bg-gray-50 disabled:opacity-40 rounded-lg flex items-center justify-between"
                >
                  <span className="flex items-center gap-2"><Redo2 className="w-3.5 h-3.5 text-gray-600" /> Redo</span>
                  <span className="text-[10px] font-mono text-gray-400">Ctrl+Y</span>
                </button>
                <div className="my-1 border-t border-gray-100" />
                <button
                  onClick={() => setIsFindReplaceOpen(true)}
                  disabled={!document}
                  className="w-full text-left px-3 py-1.5 hover:bg-gray-50 disabled:opacity-40 rounded-lg flex items-center justify-between"
                >
                  <span className="flex items-center gap-2"><Search className="w-3.5 h-3.5 text-amber-600" /> Find & Replace...</span>
                  <span className="text-[10px] font-mono text-gray-400">Ctrl+F</span>
                </button>
              </div>
            )}
          </div>

          {/* View Menu */}
          <div className="relative">
            <button
              onClick={(e) => toggleMenu(e, 'view')}
              className={`px-2.5 py-1 rounded-md transition ${
                activeMenu === 'view' ? 'bg-gray-100 text-gray-900 font-semibold' : 'hover:bg-gray-100'
              }`}
            >
              View
            </button>
            {activeMenu === 'view' && (
              <div className="absolute left-0 top-7 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-40 p-1 text-xs text-gray-700 flex flex-col gap-0.5">
                <button
                  onClick={() => setZoom(zoom + 0.15)}
                  className="w-full text-left px-3 py-1.5 hover:bg-gray-50 rounded-lg flex items-center gap-2"
                >
                  <ZoomIn className="w-3.5 h-3.5 text-gray-600" /> Zoom In
                </button>
                <button
                  onClick={() => setZoom(zoom - 0.15)}
                  className="w-full text-left px-3 py-1.5 hover:bg-gray-50 rounded-lg flex items-center gap-2"
                >
                  <ZoomOut className="w-3.5 h-3.5 text-gray-600" /> Zoom Out
                </button>
                <button
                  onClick={() => setZoom(1.0)}
                  className="w-full text-left px-3 py-1.5 hover:bg-gray-50 rounded-lg flex items-center gap-2"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-gray-600" /> Fit Page (100%)
                </button>
                <button
                  onClick={() => setZoom(1.4)}
                  className="w-full text-left px-3 py-1.5 hover:bg-gray-50 rounded-lg flex items-center gap-2"
                >
                  <AlignLeft className="w-3.5 h-3.5 text-gray-600" /> Fit Width
                </button>
                <div className="my-1 border-t border-gray-100" />
                <button
                  onClick={toggleSidebar}
                  className="w-full text-left px-3 py-1.5 hover:bg-gray-50 rounded-lg flex items-center gap-2"
                >
                  <Layers className="w-3.5 h-3.5 text-gray-600" /> Toggle Pages Panel
                </button>
                <button
                  onClick={toggleProperties}
                  className="w-full text-left px-3 py-1.5 hover:bg-gray-50 rounded-lg flex items-center gap-2"
                >
                  <Eye className="w-3.5 h-3.5 text-gray-600" /> Toggle Properties Panel
                </button>
              </div>
            )}
          </div>

          {/* Document Menu */}
          <div className="relative">
            <button
              onClick={(e) => toggleMenu(e, 'document')}
              className={`px-2.5 py-1 rounded-md transition ${
                activeMenu === 'document' ? 'bg-gray-100 text-gray-900 font-semibold' : 'hover:bg-gray-100'
              }`}
            >
              Document
            </button>
            {activeMenu === 'document' && (
              <div className="absolute left-0 top-7 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-40 p-1 text-xs text-gray-700 flex flex-col gap-0.5">
                <button
                  onClick={onOpenDocInfo}
                  disabled={!document}
                  className="w-full text-left px-3 py-1.5 hover:bg-gray-50 disabled:opacity-40 rounded-lg flex items-center gap-2"
                >
                  <Info className="w-3.5 h-3.5 text-blue-600" /> Extracted Fonts & Info
                </button>
                <button
                  onClick={onOpenHistory}
                  disabled={!document}
                  className="w-full text-left px-3 py-1.5 hover:bg-gray-50 disabled:opacity-40 rounded-lg flex items-center gap-2"
                >
                  <History className="w-3.5 h-3.5 text-indigo-600" /> Revision History Audit
                </button>
              </div>
            )}
          </div>

          {/* AI Menu */}
          <div className="relative">
            <button
              onClick={(e) => toggleMenu(e, 'ai')}
              className={`px-2.5 py-1 rounded-md transition ${
                activeMenu === 'ai' ? 'bg-indigo-50 text-indigo-900 font-semibold' : 'hover:bg-gray-100 text-indigo-700'
              }`}
            >
              <span className="flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-indigo-600" /> AI</span>
            </button>
            {activeMenu === 'ai' && (
              <div className="absolute left-0 top-7 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-40 p-1 text-xs text-gray-700 flex flex-col gap-0.5">
                <button
                  onClick={onOpenSettings}
                  className="w-full text-left px-3 py-1.5 hover:bg-gray-50 rounded-lg flex items-center gap-2"
                >
                  <Settings className="w-3.5 h-3.5 text-gray-600" /> AI Provider & Privacy
                </button>
              </div>
            )}
          </div>

          {/* Help Menu */}
          <div className="relative">
            <button
              onClick={(e) => toggleMenu(e, 'help')}
              className={`px-2.5 py-1 rounded-md transition ${
                activeMenu === 'help' ? 'bg-gray-100 text-gray-900 font-semibold' : 'hover:bg-gray-100'
              }`}
            >
              Help
            </button>
            {activeMenu === 'help' && (
              <div className="absolute left-0 top-7 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-40 p-1 text-xs text-gray-700 flex flex-col gap-0.5">
                <button
                  onClick={() => setIsShortcutsOpen(true)}
                  className="w-full text-left px-3 py-1.5 hover:bg-gray-50 rounded-lg flex items-center gap-2"
                >
                  <Keyboard className="w-3.5 h-3.5 text-emerald-600" /> Keyboard Shortcuts
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Center Document Title & Status Indicator */}
      {document && (
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1 rounded-lg text-xs font-semibold text-gray-800">
          <span className="truncate max-w-[200px]">{document.filename}</span>
          {isDirty && <span className="text-amber-600 font-bold" title="Unsaved edits present">*</span>}
          <div className="h-3 w-px bg-gray-300" />
          {isSaving ? (
            <span className="text-[10px] text-indigo-600 font-mono animate-pulse">Saving...</span>
          ) : (
            <span className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-emerald-500" /> Saved
            </span>
          )}
        </div>
      )}

      {/* Right Controls: Command Bar Trigger, Export & Settings */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="flex items-center gap-2 px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-medium rounded-lg transition border border-gray-200"
        >
          <Search className="w-3.5 h-3.5 text-gray-500" />
          <span className="hidden sm:inline">Commands</span>
          <kbd className="text-[9px] font-mono bg-white px-1.5 py-0.2 rounded border border-gray-200 text-gray-500">
            Ctrl+K
          </kbd>
        </button>

        {deferredPwaPrompt && (
          <button
            onClick={handleInstallPwa}
            className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold rounded-lg transition"
          >
            <DownloadCloud className="w-3.5 h-3.5" />
            Install PWA
          </button>
        )}

        <button
          onClick={() => setIsExportModalOpen(true)}
          disabled={!document}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-semibold rounded-lg shadow-2xs transition"
        >
          <Download className="w-3.5 h-3.5" />
          Export
        </button>

        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 border border-gray-200 text-[10px] font-semibold text-gray-600">
          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          <span>{isOnline ? 'Local' : 'Offline'}</span>
        </div>
      </div>
    </header>
  );
};

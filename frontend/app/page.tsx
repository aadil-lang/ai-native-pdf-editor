'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from '@/components/Navbar';
import { ToolRibbon } from '@/components/ToolRibbon';
import { SidebarThumbnails } from '@/components/SidebarThumbnails';
import { PdfViewerContainer } from '@/components/PdfViewer/PdfViewerContainer';
import { PropertiesBar } from '@/components/PropertiesBar';
import { AIChatBar } from '@/components/AIChatBar';
import { SettingsModal } from '@/components/Modals/SettingsModal';
import { ConversionModal } from '@/components/Modals/ConversionModal';
import { DocumentInfoModal } from '@/components/Modals/DocumentInfoModal';
import { HistoryAuditModal } from '@/components/Modals/HistoryAuditModal';
import { SignatureModal } from '@/components/Modals/SignatureModal';
import { CommandPaletteModal } from '@/components/Modals/CommandPaletteModal';
import { FindReplaceModal } from '@/components/Modals/FindReplaceModal';
import { ExportModal } from '@/components/Modals/ExportModal';
import { ShortcutsModal } from '@/components/Modals/ShortcutsModal';
import { PwaRegister } from '@/components/PwaRegister';
import { usePdfStore } from '@/stores/usePdfStore';
import { uploadPdf } from '@/lib/api';
import { FileUp } from 'lucide-react';

export default function Home() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [isDocInfoOpen, setIsDocInfoOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSignatureOpen, setIsSignatureOpen] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    document,
    setDocument,
    undo,
    redo,
    activeTool,
    setActiveTool,
    setSelectedObject,
    isDirty,
    showSidebar,
    showProperties,
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    isFindReplaceOpen,
    setIsFindReplaceOpen,
    isExportModalOpen,
    setIsExportModalOpen,
    isShortcutsOpen,
    setIsShortcutsOpen,
  } = usePdfStore();

  useEffect(() => {
    if (activeTool === 'signature') {
      setIsSignatureOpen(true);
    }
  }, [activeTool]);

  // Handle Unsaved Changes Before Unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes in PaperForge. Are you sure you want to leave?';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (['input', 'textarea'].includes(targetTag)) return;

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (cmdOrCtrl && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      } else if (cmdOrCtrl && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsFindReplaceOpen(true);
      } else if (cmdOrCtrl && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        fileInputRef.current?.click();
      } else if (cmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        setIsExportModalOpen(true);
      } else if (cmdOrCtrl && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (cmdOrCtrl && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      } else if (e.key === 'Escape') {
        setSelectedObject(null);
        setIsCommandPaletteOpen(false);
        setIsFindReplaceOpen(false);
      } else if (e.key === 'v' || e.key === 'V') {
        setActiveTool('select');
      } else if (e.key === 't' || e.key === 'T') {
        setActiveTool('text');
      } else if (e.key === 'h' || e.key === 'H') {
        setActiveTool('highlight');
      } else if (e.key === 'd' || e.key === 'D') {
        setActiveTool('draw');
      } else if (e.key === 'r' || e.key === 'R') {
        setActiveTool('shape');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, setActiveTool, setSelectedObject, setIsCommandPaletteOpen, setIsFindReplaceOpen, setIsExportModalOpen]);

  // Drag & Drop PDF File Import
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === 'application/pdf') {
      try {
        const doc = await uploadPdf(file);
        setDocument(doc);
      } catch (err: any) {
        alert(`Failed to open PDF: ${err.message}`);
      }
    }
  };

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

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="flex flex-col h-screen w-screen bg-[#F7F7F8] text-gray-900 overflow-hidden select-none font-sans relative"
    >
      <PwaRegister />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".pdf"
        className="hidden"
      />

      {/* Drag & Drop Visual Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-50 bg-indigo-900/80 backdrop-blur-xs flex flex-col items-center justify-center text-white border-4 border-dashed border-indigo-400 m-4 rounded-3xl animate-fade-in">
          <FileUp className="w-16 h-16 text-indigo-200 animate-bounce mb-4" />
          <h2 className="text-2xl font-bold tracking-tight">Drop to open in PaperForge</h2>
          <p className="text-sm text-indigo-200 mt-1">Local processing — your file stays on your device</p>
        </div>
      )}

      {/* Top Professional Navbar */}
      <Navbar
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenConvert={() => setIsConvertOpen(true)}
        onOpenDocInfo={() => setIsDocInfoOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
      />

      {/* Editing Tool Ribbon */}
      <ToolRibbon />

      {/* Main Workspace (Thumbnails + Canvas + Properties Inspector) */}
      <div className="flex-1 flex overflow-hidden relative">
        {showSidebar && <SidebarThumbnails />}
        <PdfViewerContainer onOpenSignature={() => setIsSignatureOpen(true)} />
        {showProperties && <PropertiesBar />}
      </div>

      {/* Bottom AI Command Bar */}
      <AIChatBar />

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
      <ConversionModal
        isOpen={isConvertOpen}
        onClose={() => setIsConvertOpen(false)}
      />
      <DocumentInfoModal
        isOpen={isDocInfoOpen}
        onClose={() => setIsDocInfoOpen(false)}
      />
      <HistoryAuditModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />
      <SignatureModal
        isOpen={isSignatureOpen}
        onClose={() => {
          setIsSignatureOpen(false);
          setActiveTool('select');
        }}
      />
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenConvert={() => setIsConvertOpen(true)}
        onOpenDocInfo={() => setIsDocInfoOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onTriggerFileUpload={() => fileInputRef.current?.click()}
      />
      <FindReplaceModal
        isOpen={isFindReplaceOpen}
        onClose={() => setIsFindReplaceOpen(false)}
      />
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}

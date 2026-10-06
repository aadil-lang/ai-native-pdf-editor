import { create } from 'zustand';
import { PDFDocumentModel, PDFTextSpan, PDFImageObject } from '@/types/pdf';
import { EditOperation } from '@/types/operations';
import { executeOperations, restoreRevision } from '@/lib/api';

export type ToolType = 'select' | 'edit_text' | 'text' | 'image' | 'highlight' | 'draw' | 'shape' | 'signature' | 'redact';

export interface SelectedObject {
  id: string;
  type: 'span' | 'image' | 'annotation' | 'shape';
  pageNumber: number;
  data: any;
}

export interface RecentDoc {
  id: string;
  filename: string;
  timestamp: number;
}

interface PdfStoreState {
  document: PDFDocumentModel | null;
  activePage: number;
  zoom: number; // 1.0 = 100%
  activeTool: ToolType;
  selectedObject: SelectedObject | null;
  searchQuery: string;
  searchResults: Array<{ pageNumber: number; span: PDFTextSpan }>;
  currentSearchIndex: number;
  isSaving: boolean;
  isDirty: boolean;
  history: number[]; // Revision indices
  currentHistoryPointer: number;
  recentDocs: RecentDoc[];
  showSidebar: boolean;
  showProperties: boolean;
  isCommandPaletteOpen: boolean;
  isFindReplaceOpen: boolean;
  isExportModalOpen: boolean;
  isShortcutsOpen: boolean;

  // Actions
  setDocument: (doc: PDFDocumentModel | null) => void;
  setActivePage: (page: number) => void;
  setZoom: (zoom: number) => void;
  setActiveTool: (tool: ToolType) => void;
  setSelectedObject: (obj: SelectedObject | null) => void;
  setSearchQuery: (query: string) => void;
  nextSearchResult: () => void;
  prevSearchResult: () => void;
  setIsDirty: (dirty: boolean) => void;
  addRecentDoc: (doc: { id: string; filename: string }) => void;
  toggleSidebar: () => void;
  toggleProperties: () => void;
  setIsCommandPaletteOpen: (open: boolean) => void;
  setIsFindReplaceOpen: (open: boolean) => void;
  setIsExportModalOpen: (open: boolean) => void;
  setIsShortcutsOpen: (open: boolean) => void;
  applyOps: (ops: EditOperation[]) => Promise<boolean>;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
}

export const usePdfStore = create<PdfStoreState>((set, get) => ({
  document: null,
  activePage: 1,
  zoom: 1.25,
  activeTool: 'select',
  selectedObject: null,
  searchQuery: '',
  searchResults: [],
  currentSearchIndex: 0,
  isSaving: false,
  isDirty: false,
  history: [0],
  currentHistoryPointer: 0,
  recentDocs: typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('paperforge_recent_docs') || '[]')
    : [],
  showSidebar: true,
  showProperties: true,
  isCommandPaletteOpen: false,
  isFindReplaceOpen: false,
  isExportModalOpen: false,
  isShortcutsOpen: false,

  setDocument: (doc) => {
    set({
      document: doc,
      activePage: 1,
      selectedObject: null,
      isDirty: false,
      history: doc ? [doc.current_revision_index] : [0],
      currentHistoryPointer: 0,
    });
    if (doc) {
      get().addRecentDoc({ id: doc.id, filename: doc.filename });
    }
  },

  setIsDirty: (dirty) => set({ isDirty: dirty }),

  addRecentDoc: (item) => {
    const current = get().recentDocs;
    const filtered = current.filter((d) => d.id !== item.id);
    const updated = [{ ...item, timestamp: Date.now() }, ...filtered].slice(0, 10);
    set({ recentDocs: updated });
    if (typeof window !== 'undefined') {
      localStorage.setItem('paperforge_recent_docs', JSON.stringify(updated));
    }
  },

  toggleSidebar: () => set((state) => ({ showSidebar: !state.showSidebar })),
  toggleProperties: () => set((state) => ({ showProperties: !state.showProperties })),
  setIsCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
  setIsFindReplaceOpen: (open) => set({ isFindReplaceOpen: open }),
  setIsExportModalOpen: (open) => set({ isExportModalOpen: open }),
  setIsShortcutsOpen: (open) => set({ isShortcutsOpen: open }),

  setActivePage: (page) => {
    const doc = get().document;
    if (doc && page >= 1 && page <= doc.page_count) {
      set({ activePage: page });
    }
  },

  setZoom: (zoom) => set({ zoom: Math.max(0.5, Math.min(3.0, zoom)) }),

  setActiveTool: (tool) => set({ activeTool: tool, selectedObject: null }),

  setSelectedObject: (obj) => set({ selectedObject: obj }),

  setSearchQuery: (query) => {
    const doc = get().document;
    if (!query.trim() || !doc) {
      set({ searchQuery: query, searchResults: [], currentSearchIndex: 0 });
      return;
    }

    const qLower = query.toLowerCase();
    const results: Array<{ pageNumber: number; span: PDFTextSpan }> = [];

    doc.pages.forEach((page) => {
      page.spans.forEach((span) => {
        if (span.text.toLowerCase().includes(qLower)) {
          results.push({ pageNumber: page.page_number, span });
        }
      });
    });

    set({
      searchQuery: query,
      searchResults: results,
      currentSearchIndex: 0,
      activePage: results.length > 0 ? results[0].pageNumber : get().activePage,
    });
  },

  nextSearchResult: () => {
    const { searchResults, currentSearchIndex } = get();
    if (searchResults.length === 0) return;
    const nextIdx = (currentSearchIndex + 1) % searchResults.length;
    set({
      currentSearchIndex: nextIdx,
      activePage: searchResults[nextIdx].pageNumber,
    });
  },

  prevSearchResult: () => {
    const { searchResults, currentSearchIndex } = get();
    if (searchResults.length === 0) return;
    const prevIdx = (currentSearchIndex - 1 + searchResults.length) % searchResults.length;
    set({
      currentSearchIndex: prevIdx,
      activePage: searchResults[prevIdx].pageNumber,
    });
  },

  applyOps: async (ops) => {
    const { document, history, currentHistoryPointer } = get();
    if (!document) return false;

    set({ isSaving: true });
    try {
      const res = await executeOperations(document.id, ops);
      const newPointer = currentHistoryPointer + 1;
      const newHistory = [...history.slice(0, newPointer), res.revision_index];

      set({
        document: res.document,
        history: newHistory,
        currentHistoryPointer: newPointer,
        selectedObject: null,
        isSaving: false,
        isDirty: true,
      });
      return true;
    } catch (e) {
      console.error(e);
      set({ isSaving: false });
      return false;
    }
  },

  undo: async () => {
    const { document, history, currentHistoryPointer } = get();
    if (!document || currentHistoryPointer <= 0) return;

    const targetPointer = currentHistoryPointer - 1;
    const targetRev = history[targetPointer];

    set({ isSaving: true });
    try {
      const restoredDoc = await restoreRevision(document.id, targetRev);
      set({
        document: restoredDoc,
        currentHistoryPointer: targetPointer,
        selectedObject: null,
        isSaving: false,
      });
    } catch (e) {
      console.error(e);
      set({ isSaving: false });
    }
  },

  redo: async () => {
    const { document, history, currentHistoryPointer } = get();
    if (!document || currentHistoryPointer >= history.length - 1) return;

    const targetPointer = currentHistoryPointer + 1;
    const targetRev = history[targetPointer];

    set({ isSaving: true });
    try {
      const restoredDoc = await restoreRevision(document.id, targetRev);
      set({
        document: restoredDoc,
        currentHistoryPointer: targetPointer,
        selectedObject: null,
        isSaving: false,
      });
    } catch (e) {
      console.error(e);
      set({ isSaving: false });
    }
  },
}));

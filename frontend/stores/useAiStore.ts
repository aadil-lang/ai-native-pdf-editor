import { create } from 'zustand';
import { AIProposal, EditOperation } from '@/types/operations';
import { queryAi } from '@/lib/api';
import { usePdfStore } from './usePdfStore';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  proposal?: AIProposal;
  status?: 'pending' | 'applied' | 'rejected';
}

interface AiStoreState {
  messages: ChatMessage[];
  isThinking: boolean;
  provider: 'gemini' | 'ollama' | 'none';
  geminiApiKey: string;
  ollamaUrl: string;
  modelName: string;
  activeProposal: { msgId: string; proposal: AIProposal } | null;

  setProvider: (provider: 'gemini' | 'ollama' | 'none') => void;
  setGeminiApiKey: (key: string) => void;
  setOllamaUrl: (url: string) => void;
  setModelName: (name: string) => void;
  sendQuery: (prompt: string) => Promise<void>;
  applyProposal: (msgId: string) => Promise<void>;
  rejectProposal: (msgId: string) => void;
}

export const useAiStore = create<AiStoreState>((set, get) => ({
  messages: [],
  isThinking: false,
  provider: 'gemini',
  geminiApiKey: '',
  ollamaUrl: 'http://localhost:11434',
  modelName: '',
  activeProposal: null,

  setProvider: (provider) => set({ provider }),
  setGeminiApiKey: (key) => set({ geminiApiKey: key }),
  setOllamaUrl: (url) => set({ ollamaUrl: url }),
  setModelName: (name) => set({ modelName: name }),

  sendQuery: async (prompt) => {
    const pdfState = usePdfStore.getState();
    const doc = pdfState.document;

    if (!doc) {
      set((state) => ({
        messages: [
          ...state.messages,
          { id: Date.now().toString(), sender: 'ai', text: 'Please open or upload a PDF document first.' },
        ],
      }));
      return;
    }

    const userMsgId = Date.now().toString();
    const userMsg: ChatMessage = { id: userMsgId, sender: 'user', text: prompt };

    set((state) => ({
      messages: [...state.messages, userMsg],
      isThinking: true,
    }));

    try {
      const { provider, geminiApiKey, ollamaUrl, modelName } = get();
      const proposal = await queryAi(doc.id, prompt, {
        provider,
        api_key: geminiApiKey,
        ollama_url: ollamaUrl,
        model_name: modelName,
      });

      const aiMsgId = (Date.now() + 1).toString();
      const aiMsg: ChatMessage = {
        id: aiMsgId,
        sender: 'ai',
        text: proposal.summary,
        proposal: proposal.operations.length > 0 ? proposal : undefined,
        status: proposal.operations.length > 0 ? 'pending' : undefined,
      };

      set((state) => ({
        messages: [...state.messages, aiMsg],
        isThinking: false,
        activeProposal: proposal.operations.length > 0 ? { msgId: aiMsgId, proposal } : state.activeProposal,
      }));
    } catch (e: any) {
      set((state) => ({
        messages: [
          ...state.messages,
          { id: Date.now().toString(), sender: 'ai', text: `Error processing AI query: ${e.message}` },
        ],
        isThinking: false,
      }));
    }
  },

  applyProposal: async (msgId) => {
    const state = get();
    const msg = state.messages.find((m) => m.id === msgId);
    if (!msg || !msg.proposal || msg.proposal.operations.length === 0) return;

    const pdfState = usePdfStore.getState();
    const success = await pdfState.applyOps(msg.proposal.operations);

    if (success) {
      set((s) => ({
        messages: s.messages.map((m) => (m.id === msgId ? { ...m, status: 'applied' } : m)),
        activeProposal: null,
      }));
    }
  },

  rejectProposal: (msgId) => {
    set((s) => ({
      messages: s.messages.map((m) => (m.id === msgId ? { ...m, status: 'rejected' } : m)),
      activeProposal: null,
    }));
  },
}));

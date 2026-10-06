import { PDFDocumentModel } from '@/types/pdf';
import { EditOperation, AIProposal } from '@/types/operations';

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const customUrl = localStorage.getItem('paperforge_api_url');
    if (customUrl) return customUrl.replace(/\/$/, '');

    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
      return envUrl.replace(/\/$/, '');
    }

    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1') {
      return 'https://ai-native-pdf-editor.onrender.com/api';
    }
  }

  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
}

export async function uploadPdf(file: File): Promise<PDFDocumentModel> {
  const baseUrl = getApiBaseUrl();
  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch(`${baseUrl}/documents/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to upload PDF');
    }

    return res.json();
  } catch (err: any) {
    if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
      throw new Error(
        `Cannot connect to PaperForge Backend API at (${baseUrl}). Please deploy your backend container (Koyeb/Render) and set NEXT_PUBLIC_API_URL in Cloudflare environment variables.`
      );
    }
    throw err;
  }
}

export async function getDocument(docId: string, revision?: number): Promise<PDFDocumentModel> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/documents/${docId}${revision !== undefined ? `?revision=${revision}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch document');
  }
  return res.json();
}

export function getPageImageUrl(docId: string, pageNumber: number, zoom: number = 1.5): string {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}/documents/${docId}/pages/${pageNumber}/image?zoom=${zoom}&t=${Date.now()}`;
}

export async function getPageText(docId: string, pageNumber: number) {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/documents/${docId}/pages/${pageNumber}/text`);
  if (!res.ok) {
    throw new Error('Failed to fetch page text');
  }
  return res.json();
}

export async function executeOperations(docId: string, operations: EditOperation[]): Promise<{ success: boolean; document: PDFDocumentModel; revision_index: number }> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/documents/${docId}/operations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      document_id: docId,
      operations,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to execute operations');
  }

  return res.json();
}

export async function restoreRevision(docId: string, revisionIndex: number): Promise<PDFDocumentModel> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/documents/${docId}/restore?revision_index=${revisionIndex}`, {
    method: 'POST',
  });

  if (!res.ok) {
    throw new Error('Failed to restore revision');
  }

  return res.json();
}

export async function queryAi(
  docId: string,
  prompt: string,
  settings: { provider?: string; api_key?: string; ollama_url?: string; model_name?: string }
): Promise<AIProposal> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/documents/${docId}/ai/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      provider: settings.provider || 'gemini',
      api_key: settings.api_key || '',
      ollama_url: settings.ollama_url || '',
      model_name: settings.model_name || '',
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'AI query failed');
  }

  return res.json();
}

export function getExportUrl(docId: string): string {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}/documents/${docId}/export`;
}

export async function convertDocument(docId: string, targetFormat: string, mode: string = 'editable'): Promise<Blob> {
  const baseUrl = getApiBaseUrl();
  const formData = new FormData();
  formData.append('target_format', targetFormat);
  formData.append('mode', mode);

  const res = await fetch(`${baseUrl}/convert/document/${docId}`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Conversion failed');
  }

  return res.blob();
}

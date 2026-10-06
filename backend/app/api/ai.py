from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.services.document_service import DocumentService
from app.services.ai_service import AIService

router = APIRouter(prefix="/api/documents", tags=["ai"])

class AIQueryRequest(BaseModel):
    prompt: str
    provider: Optional[str] = "gemini"  # "gemini", "ollama", or "none"
    api_key: Optional[str] = None
    ollama_url: Optional[str] = None
    model_name: Optional[str] = None
    selected_text: Optional[str] = None
    active_page: Optional[int] = None

@router.post("/{doc_id}/ai/query")
async def ai_query(doc_id: str, payload: AIQueryRequest, db: Session = Depends(get_db)):
    if payload.provider == "none":
        return {
            "summary": "AI processing is currently disabled.",
            "requires_approval": False,
            "operations": []
        }

    doc = DocumentService.get_document(db, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    doc_context = doc.dict()

    proposal = await AIService.process_prompt(
        user_query=payload.prompt,
        doc_context=doc_context,
        provider_name=payload.provider,
        api_key=payload.api_key,
        ollama_url=payload.ollama_url,
        model_name=payload.model_name
    )

    return proposal

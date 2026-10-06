from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.services.document_service import DocumentService
from app.schemas.operations import EditOperationList

router = APIRouter(prefix="/api/documents", tags=["operations"])

@router.post("/{doc_id}/operations")
def execute_operations(doc_id: str, payload: EditOperationList, db: Session = Depends(get_db)):
    result = DocumentService.apply_operations(
        db=db,
        doc_id=doc_id,
        operations=payload.operations,
        description="Manual/Direct UI Edit"
    )

    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("errors", ["Failed to execute operations"]))

    return result

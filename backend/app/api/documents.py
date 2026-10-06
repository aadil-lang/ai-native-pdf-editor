from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Response
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.services.document_service import DocumentService
from app.pdf.extractor import PDFExtractor
from app.schemas.document import PDFDocumentModel
from app.models.document import Document, Revision

router = APIRouter(prefix="/api/documents", tags=["documents"])

@router.post("/upload", response_model=PDFDocumentModel)
async def upload_document(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    file_bytes = await file.read()
    return DocumentService.create_document(db, file_bytes, file.filename)

@router.get("/{doc_id}", response_model=PDFDocumentModel)
def get_document(doc_id: str, revision: int = None, db: Session = Depends(get_db)):
    doc = DocumentService.get_document(db, doc_id, revision_index=revision)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    return doc

@router.get("/{doc_id}/pages/{page_number}/image")
def get_page_image(doc_id: str, page_number: int, zoom: float = 1.5, db: Session = Depends(get_db)):
    db_doc = db.query(Document).filter(Document.id == doc_id).first()
    if not db_doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    rev = db.query(Revision).filter(
        Revision.document_id == doc_id,
        Revision.revision_index == db_doc.current_revision_index
    ).first()

    if not rev:
        raise HTTPException(status_code=404, detail="Revision not found.")

    try:
        img_bytes = PDFExtractor.render_page_image(rev.filepath, page_number, zoom=zoom)
        return Response(content=img_bytes, media_type="image/png")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to render page: {str(e)}")

@router.get("/{doc_id}/pages/{page_number}/text")
def get_page_text(doc_id: str, page_number: int, db: Session = Depends(get_db)):
    """
    Section 8 REST API: GET /api/documents/{id}/pages/{page}/text
    Returns text, bounding boxes, font info, line & span objects for page.
    """
    doc = DocumentService.get_document(db, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    matching_page = next((p for p in doc.pages if p.page_number == page_number), None)
    if not matching_page:
        raise HTTPException(status_code=404, detail="Page not found.")

    return {
        "page_number": page_number,
        "width": matching_page.width,
        "height": matching_page.height,
        "spans": [span.dict() for span in matching_page.spans]
    }

@router.get("/{doc_id}/export")
def export_document(doc_id: str, db: Session = Depends(get_db)):
    db_doc = db.query(Document).filter(Document.id == doc_id).first()
    if not db_doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    rev = db.query(Revision).filter(
        Revision.document_id == doc_id,
        Revision.revision_index == db_doc.current_revision_index
    ).first()

    if not rev or not os.path.exists(rev.filepath):
        raise HTTPException(status_code=404, detail="Revision file not found.")

    import os
    return FileResponse(
        path=rev.filepath,
        filename=db_doc.filename,
        media_type="application/pdf"
    )

@router.post("/{doc_id}/restore")
def restore_revision(doc_id: str, revision_index: int, db: Session = Depends(get_db)):
    doc = DocumentService.restore_revision(db, doc_id, revision_index)
    if not doc:
        raise HTTPException(status_code=404, detail="Revision could not be restored.")
    return doc

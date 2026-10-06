import os
import tempfile
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.models.document import Document, Revision
from app.pdf.converter import DocumentConverter
from app.config import settings

router = APIRouter(prefix="/api/convert", tags=["convert"])

@router.post("/document/{doc_id}")
def convert_existing_document(
    doc_id: str,
    target_format: str = Form(...),
    mode: Optional[str] = Form("editable"),
    db: Session = Depends(get_db)
):
    db_doc = db.query(Document).filter(Document.id == doc_id).first()
    if not db_doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    rev = db.query(Revision).filter(
        Revision.document_id == doc_id,
        Revision.revision_index == db_doc.current_revision_index
    ).first()

    if not rev or not os.path.exists(rev.filepath):
        raise HTTPException(status_code=404, detail="Revision file not found.")

    ext_map = {
        "docx": ".docx",
        "txt": ".txt",
        "md": ".md",
        "markdown": ".md",
        "html": ".html",
        "png": ".zip",
        "jpg": ".zip",
        "images": ".zip",
        "pdf": ".pdf"
    }

    tgt = target_format.lower()
    if tgt not in ext_map:
        raise HTTPException(status_code=400, detail=f"Target format '{target_format}' is not supported.")

    output_filename = f"{os.path.splitext(db_doc.filename)[0]}_converted{ext_map[tgt]}"
    output_filepath = str(settings.DATA_DIR / doc_id / output_filename)

    try:
        res_path = DocumentConverter.convert_document(
            source_filepath=rev.filepath,
            source_format="pdf",
            target_format=tgt,
            output_filepath=output_filepath,
            mode=mode or "editable"
        )
        return FileResponse(
            path=res_path,
            filename=output_filename,
            media_type="application/octet-stream"
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Conversion failed: {str(e)}")

@router.post("/file")
async def convert_file_upload(
    file: UploadFile = File(...),
    target_format: str = Form(...),
    mode: Optional[str] = Form("editable")
):
    file_ext = os.path.splitext(file.filename)[1].lstrip('.').lower()
    tgt = target_format.lower()

    tmp_dir = tempfile.mkdtemp()
    source_path = os.path.join(tmp_dir, file.filename)
    file_bytes = await file.read()

    with open(source_path, "wb") as f:
        f.write(file_bytes)

    ext_map = {
        "docx": ".docx",
        "txt": ".txt",
        "md": ".md",
        "html": ".html",
        "png": ".zip",
        "pdf": ".pdf"
    }

    if tgt not in ext_map:
        raise HTTPException(status_code=400, detail=f"Target format '{target_format}' is not supported.")

    out_filename = f"{os.path.splitext(file.filename)[0]}_converted{ext_map[tgt]}"
    out_path = os.path.join(tmp_dir, out_filename)

    try:
        res_path = DocumentConverter.convert_document(
            source_filepath=source_path,
            source_format=file_ext,
            target_format=tgt,
            output_filepath=out_path,
            mode=mode or "editable"
        )
        return FileResponse(
            path=res_path,
            filename=out_filename,
            media_type="application/octet-stream"
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Conversion failed: {str(e)}")

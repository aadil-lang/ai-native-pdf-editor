import os
import shutil
import uuid
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.document import Document, Revision
from app.schemas.document import PDFDocumentModel
from app.pdf.extractor import PDFExtractor
from app.pdf.modifier import PDFModifier
from app.validation.operation_validator import OperationValidator
from app.services.storage_service import StorageService
from app.config import settings

class DocumentService:
    @staticmethod
    def create_document(db: Session, file_bytes: bytes, filename: str) -> PDFDocumentModel:
        clean_filename = os.path.basename(filename).replace("..", "").strip() or "document.pdf"
        doc_id = str(uuid.uuid4())
        doc_dir = settings.DATA_DIR / doc_id
        doc_dir.mkdir(parents=True, exist_ok=True)

        original_path = str(doc_dir / "revision_0.pdf")
        with open(original_path, "wb") as f:
            f.write(file_bytes)

        # Sync to Cloudflare R2 if configured
        StorageService.upload_file(original_path, f"{doc_id}/revision_0.pdf")

        # Extract initial state
        extracted_doc = PDFExtractor.extract_document(original_path, doc_id, clean_filename, current_revision=0)

        db_doc = Document(
            id=doc_id,
            filename=clean_filename,
            original_filepath=original_path,
            current_revision_index=0,
            page_count=extracted_doc.page_count
        )
        db.add(db_doc)

        rev = Revision(
            document_id=doc_id,
            revision_index=0,
            filepath=original_path,
            description="Original PDF Upload"
        )
        db.add(rev)
        db.commit()
        db.refresh(db_doc)

        return extracted_doc

    @staticmethod
    def get_document(db: Session, doc_id: str, revision_index: Optional[int] = None) -> Optional[PDFDocumentModel]:
        db_doc = db.query(Document).filter(Document.id == doc_id).first()
        if not db_doc:
            return None

        target_rev_idx = revision_index if revision_index is not None else db_doc.current_revision_index

        rev = db.query(Revision).filter(
            Revision.document_id == doc_id,
            Revision.revision_index == target_rev_idx
        ).first()

        if not rev or not os.path.exists(rev.filepath):
            return None

        return PDFExtractor.extract_document(rev.filepath, db_doc.id, db_doc.filename, current_revision=target_rev_idx)

    @staticmethod
    def apply_operations(db: Session, doc_id: str, operations: List[Dict[str, Any]], description: str = "User edits") -> Dict[str, Any]:
        db_doc = db.query(Document).filter(Document.id == doc_id).first()
        if not db_doc:
            return {"success": False, "errors": ["Document not found"]}

        # Fetch current revision file
        curr_rev = db.query(Revision).filter(
            Revision.document_id == doc_id,
            Revision.revision_index == db_doc.current_revision_index
        ).first()

        if not curr_rev:
            return {"success": False, "errors": ["Revision file not found"]}

        # Validate operations
        is_valid, errors, validated_ops = OperationValidator.validate_operations(operations, db_doc.page_count)
        if not is_valid:
            return {"success": False, "errors": errors}

        new_rev_index = db_doc.current_revision_index + 1
        new_filepath = str(settings.DATA_DIR / doc_id / f"revision_{new_rev_index}.pdf")

        # Execute operations deterministically
        success = PDFModifier.apply_operations(curr_rev.filepath, new_filepath, validated_ops)
        if not success:
            return {"success": False, "errors": ["Failed to apply PDF modifications"]}

        # Re-extract document to update page_count & current revision
        new_extracted = PDFExtractor.extract_document(new_filepath, doc_id, db_doc.filename, current_revision=new_rev_index)

        # Update database record
        db_doc.current_revision_index = new_rev_index
        db_doc.page_count = new_extracted.page_count

        new_rev = Revision(
            document_id=doc_id,
            revision_index=new_rev_index,
            filepath=new_filepath,
            description=description,
            operation=validated_ops
        )
        db.add(new_rev)
        db.commit()

        return {
            "success": True,
            "document": new_extracted,
            "revision_index": new_rev_index
        }

    @staticmethod
    def restore_revision(db: Session, doc_id: str, revision_index: int) -> Optional[PDFDocumentModel]:
        db_doc = db.query(Document).filter(Document.id == doc_id).first()
        if not db_doc:
            return None

        rev = db.query(Revision).filter(
            Revision.document_id == doc_id,
            Revision.revision_index == revision_index
        ).first()

        if not rev:
            return None

        db_doc.current_revision_index = revision_index
        extracted = PDFExtractor.extract_document(rev.filepath, doc_id, db_doc.filename, current_revision=revision_index)
        db_doc.page_count = extracted.page_count
        db.commit()
        return extracted

import datetime
import uuid
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, JSON, Text, Float
from sqlalchemy.orm import relationship
from app.core.db import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    filename = Column(String, nullable=False)
    original_filepath = Column(String, nullable=False)
    current_revision_index = Column(Integer, default=0)
    page_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    revisions = relationship("Revision", back_populates="document", cascade="all, delete-orphan", order_by="Revision.revision_index")

class Revision(Base):
    __tablename__ = "revisions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String, ForeignKey("documents.id"), nullable=False)
    revision_index = Column(Integer, nullable=False)
    filepath = Column(String, nullable=False)
    description = Column(String, default="Initial upload")
    operation = Column(JSON, nullable=True)  # The EditOperation JSON executed to reach this revision
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    document = relationship("Document", back_populates="revisions")

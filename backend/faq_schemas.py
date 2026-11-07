import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class FaqDocumentRead(BaseModel):
    id: uuid.UUID
    title: str
    file_url: str

    class Config:
        from_attributes = True


class FaqItemRead(BaseModel):
    id: uuid.UUID
    code: str
    category: str
    question: str
    answer: str
    alternative_questions: list[str]
    source_url: Optional[str] = None
    source_name: Optional[str] = None
    validity_note: Optional[str] = None
    status: str
    documents: list[FaqDocumentRead] = []

    class Config:
        from_attributes = True


class ChatRequest(BaseModel):
    question: str


class ChatResponse(BaseModel):
    answer: str
    matched_question: Optional[str] = None
    documents: list[FaqDocumentRead] = []
    suggestions: list[str] = []
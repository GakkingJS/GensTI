from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from models import FaqItem, FaqDocument

from faq_schemas import (
    ChatRequest,
    ChatResponse,
    FaqItemRead,
)

from chatbot_service import (
    ask_ollama,
    build_context,
    find_best_faq,
)


router = APIRouter(
    prefix="/faq",
    tags=["FAQ y Chat"],
)


@router.get("/", response_model=list[FaqItemRead])
def list_faqs(
    category: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = (
        select(FaqItem)
        .where(FaqItem.status == "approved")
        .order_by(
            FaqItem.category.asc(),
            FaqItem.question.asc(),
        )
    )

    if category:
        query = query.where(FaqItem.category == category)

    return db.execute(query).scalars().all()


@router.get("/categories")
def list_categories(db: Session = Depends(get_db)):
    result = db.execute(
        select(FaqItem.category)
        .where(FaqItem.status == "approved")
        .distinct()
        .order_by(FaqItem.category.asc())
    )

    return {
        "categories": [
            row[0]
            for row in result.all()
        ]
    }


@router.post("/chat", response_model=ChatResponse)
async def chat(
    payload: ChatRequest,
    db: Session = Depends(get_db),
):
    question = payload.question.strip()

    if len(question) < 3:
        raise HTTPException(
            status_code=400,
            detail="Escribe una consulta más específica.",
        )

    matched = find_best_faq(db, question)

    # FAQ encontrada: devolver el texto aprobado.
    # Esta rama no utiliza Ollama.
    if matched:
        documents = db.execute(
            select(FaqDocument)
            .where(FaqDocument.faq_id == matched.id)
        ).scalars().all()

        return {
            "answer": matched.answer,
            "matched_question": matched.question,
            "documents": documents,
            "suggestions": [],
        }

    # Sin coincidencia: consultar a Ollama.
    context = build_context(db)
    answer = await ask_ollama(question, context)

    return {
        "answer": answer,
        "matched_question": None,
        "documents": [],
        "suggestions": [
            "¿Cuáles son los horarios del Parche GensTI?",
            "¿Cómo realizo mi matrícula?",
            "¿Dónde y cómo puedo pagar mi matrícula?",
        ],
    }
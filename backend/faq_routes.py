
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db

from models import (
    FaqItem,
    FaqDocument,
)

from faq_schemas import (
    ChatRequest,
    ChatResponse,
    FaqItemRead,
)

from chatbot_service import (
    ask_ollama,
    build_context,
    find_best_faq,
    NO_KNOWLEDGE_ANSWER,
)

from knowledge.service import get_context_for_model


router = APIRouter(
    prefix="/faq",
    tags=["FAQ y Chat"],
)


# =========================================================
# LISTAR PREGUNTAS FRECUENTES
# =========================================================

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
        query = query.where(
            FaqItem.category == category
        )

    return db.execute(query).scalars().all()


# =========================================================
# LISTAR CATEGORÍAS
# =========================================================

@router.get("/categories")
def list_categories(
    db: Session = Depends(get_db),
):

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


# =========================================================
# CHAT DE GENSTI
# =========================================================

@router.post("/chat", response_model=ChatResponse)
async def chat(
    payload: ChatRequest,
    db: Session = Depends(get_db),
):

    question = payload.question.strip()

    # -----------------------------------------------------
    # VALIDAR PREGUNTA
    # -----------------------------------------------------

    if len(question) < 3:

        raise HTTPException(
            status_code=400,
            detail="Escribe una consulta más específica.",
        )

    # -----------------------------------------------------
    # PRIMER NIVEL: PREGUNTAS FRECUENTES APROBADAS
    # -----------------------------------------------------

    matched, score = find_best_faq(db, question)

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

    # -----------------------------------------------------
    # SEGUNDO NIVEL: BASE DE CONOCIMIENTO MARKDOWN
    # -----------------------------------------------------

    context = build_context(db, question)

    # Si no hay fuentes institucionales, no llamar a Ollama.
    if not context:

        return {
            "answer": NO_KNOWLEDGE_ANSWER,
            "matched_question": None,
            "documents": [],
            "suggestions": [
                "¿Cuáles son los horarios del Parche GENSTI?",
                "¿Cómo realizo mi matrícula?",
                "¿Dónde y cómo puedo pagar mi matrícula?",
            ],
        }

    # -----------------------------------------------------
    # TERCER NIVEL: GENERACIÓN CON OLLAMA
    # -----------------------------------------------------

    answer = await ask_ollama(
        question,
        context,
    )

    return {
        "answer": answer,
        "matched_question": None,
        "documents": [],
        "suggestions": [
            "¿Cuáles son los horarios del Parche GENSTI?",
            "¿Cómo realizo mi matrícula?",
            "¿Dónde y cómo puedo pagar mi matrícula?",
        ],
    }


# =========================================================
# PRUEBA DE LA BASE DE CONOCIMIENTO
# =========================================================

@router.get("/knowledge-test")
def knowledge_test(
    question: str,
):

    return get_context_for_model(question)

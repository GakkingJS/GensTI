import os
from datetime import date


import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session


from models import (
    FaqItem,
    FaqDocument,
    CommunityPost,
    AcademicCalendarEvent,
)



OLLAMA_BASE_URL = os.getenv(
    "OLLAMA_BASE_URL",
    "http://host.docker.internal:11434",
)


OLLAMA_MODEL = os.getenv(
    "OLLAMA_MODEL",
    "qwen3:1.7b",
)



def normalize(text: str) -> str:
    return (
        text.lower()
        .strip()
        .replace("¿", "")
        .replace("?", "")
        .replace("á", "a")
        .replace("é", "e")
        .replace("í", "i")
        .replace("ó", "o")
        .replace("ú", "u")
    )



def find_best_faq(db: Session, question: str):
    user_question = normalize(question)

    faqs = db.execute(
        select(FaqItem)
        .where(FaqItem.status == "approved")
    ).scalars().all()

    # Primero: coincidencia exacta.
    for faq in faqs:
        candidates = [faq.question] + list(
            faq.alternative_questions or []
        )

        for candidate in candidates:
            if normalize(candidate) == user_question:
                return faq

    best_score = 0
    best_faq = None




def get_calendar_context(db: Session) -> str:
    events = db.execute(
        select(AcademicCalendarEvent)
        .where(AcademicCalendarEvent.status == "published")
        .order_by(AcademicCalendarEvent.starts_at.asc())
        .limit(20)
    ).scalars().all()


    if not events:
        return "No hay fechas académicas publicadas."


    lines = []


    for event in events:
        end_date = event.ends_at or event.starts_at


        lines.append(
            f"- {event.title}: del {event.starts_at.date()} "
            f"al {end_date.date()}."
        )


    return "\n".join(lines)



def get_community_context(db: Session) -> str:
    posts = db.execute(
        select(CommunityPost)
        .where(CommunityPost.status == "published")
        .order_by(CommunityPost.created_at.desc())
        .limit(10)
    ).scalars().all()


    if not posts:
        return "No hay publicaciones de comunidad publicadas."


    lines = []


    for post in posts:
        lines.append(
            f"- {post.title} [{post.category}]: {post.content[:200]}"
        )


    return "\n".join(lines)



def build_context(db: Session) -> str:
    return f"""
Fecha actual: {date.today().isoformat()}


FECHAS ACADÉMICAS:
{get_calendar_context(db)}


PUBLICACIONES DE COMUNIDAD:
{get_community_context(db)}
""".strip()



async def ask_ollama(question: str, context: str) -> str:
    payload = {
        "model": OLLAMA_MODEL,
        "stream": False,
        "keep_alive": "30m",
        "messages": [
            {
                "role": "system",
                "content": f"""
Eres el asistente de gensTI, plataforma de la comunidad de Ingeniería
de Sistemas de la Universidad Cooperativa de Colombia, sede Ibagué.


Responde en español, breve, claro y útil.
No inventes procedimientos, fechas, documentos ni políticas.
Usa solamente la información entregada en el contexto.


Si la información no es suficiente, dilo claramente y sugiere al usuario
consultar la sección correspondiente de gensTI o contactar a la coordinación.
""".strip(),
            },
            {
                "role": "user",
                "content": f"""
Pregunta del estudiante:
{question}


CONTEXTO DISPONIBLE:
{context}
""".strip(),
            },
        ],
        "options": {
            "temperature": 0.2,
            "num_predict": 300,
        },
    }


    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.post(
            f"{OLLAMA_BASE_URL}/api/chat",
            json=payload,
        )


        response.raise_for_status()


        data = response.json()


    return data["message"]["content"].strip()
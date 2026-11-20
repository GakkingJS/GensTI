
import os
import logging
import re
import unicodedata
from datetime import date

import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session

from models import (
    FaqItem,
    CommunityPost,
    AcademicCalendarEvent,
)

from knowledge.service import (
    SYSTEM_PROMPT,
    get_context_for_model,
)


logger = logging.getLogger(__name__)


# =========================================================
# CONFIGURACIÓN DE OLLAMA
# =========================================================

OLLAMA_BASE_URL = os.getenv(
    "OLLAMA_BASE_URL",
    "http://host.docker.internal:11434",
).rstrip("/")

OLLAMA_MODEL = os.getenv(
    "OLLAMA_MODEL",
    "qwen3:1.7b",
)

FAQ_MATCH_THRESHOLD = 3

NO_KNOWLEDGE_ANSWER = (
    "No encontré información sobre ese tema en la base "
    "de conocimiento de GENSTI. Te recomiendo consultar "
    "con la dependencia correspondiente."
)


# =========================================================
# NORMALIZACIÓN DE TEXTO
# =========================================================

STOPWORDS = {
    "a", "al", "algo", "algunos", "ante", "como", "con",
    "cual", "cuando", "de", "del", "desde", "donde",
    "el", "ella", "en", "entre", "era", "es", "esa",
    "ese", "eso", "esta", "este", "esto", "fue", "ha",
    "hay", "la", "las", "le", "les", "lo", "los",
    "me", "mi", "mis", "muy", "no", "o", "para",
    "pero", "por", "porque", "que", "se", "sin",
    "sobre", "su", "sus", "te", "tu", "tus", "un",
    "una", "uno", "unos", "unas", "y", "ya",
    "quiero", "puedo", "puede", "hacer", "realizar",
}


def normalize(text: str) -> str:

    text = text.lower().strip()

    text = unicodedata.normalize("NFD", text)

    text = "".join(
        char for char in text
        if unicodedata.category(char) != "Mn"
    )

    return text


def tokenize(text: str) -> set:

    words = set(re.findall(r"\w+", normalize(text)))

    return {
        word for word in words
        if word not in STOPWORDS and len(word) > 2
    }


# =========================================================
# BÚSQUEDA DE PREGUNTAS FRECUENTES
# =========================================================

def find_best_faq(db: Session, question: str):

    user_question = normalize(question)

    faqs = db.execute(
        select(FaqItem)
        .where(FaqItem.status == "approved")
    ).scalars().all()

    # 1. Coincidencia exacta.
    for faq in faqs:

        candidates = (
            [faq.question]
            + list(faq.alternative_questions or [])
        )

        for candidate in candidates:

            if normalize(candidate) == user_question:
                return faq, 100

    # 2. Coincidencia por palabras relevantes.
    user_words = tokenize(question)

    if not user_words:
        return None, 0

    best_score = 0
    best_faq = None

    for faq in faqs:

        candidates = (
            [faq.question]
            + list(faq.alternative_questions or [])
        )

        for candidate in candidates:

            candidate_words = tokenize(candidate)

            score = len(user_words & candidate_words)

            if score > best_score:
                best_score = score
                best_faq = faq

    if best_faq and best_score >= FAQ_MATCH_THRESHOLD:
        return best_faq, best_score

    return None, 0


# =========================================================
# CONTEXTO DEL CALENDARIO ACADÉMICO
# =========================================================

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

        if not event.starts_at:
            continue

        end_date = event.ends_at or event.starts_at

        lines.append(
            f"- {event.title}: del {event.starts_at.date()} "
            f"al {end_date.date()}."
        )

    return "\n".join(lines)


# =========================================================
# CONTEXTO DE LA COMUNIDAD
# =========================================================

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
            f"- {post.title} [{post.category}]: "
            f"{(post.content or '')[:200]}"
        )

    return "\n".join(lines)


# =========================================================
# CONSTRUCCIÓN DEL CONTEXTO GENERAL
# =========================================================

def build_context(db: Session, question: str) -> str:

    # Buscar información en los archivos Markdown.
    knowledge_data = get_context_for_model(question)

    sources = knowledge_data.get("sources", [])

    # Si no hay fuentes relevantes, no se genera contexto.
    # Esto permite bloquear la consulta antes de llamar a Ollama.
    if not sources:

        logger.info(
            "Consulta sin fuentes institucionales. "
            "No se consultará Ollama. Pregunta=%s",
            question[:150],
        )

        return ""

    knowledge_context = knowledge_data.get("context", "")

    if not knowledge_context.strip():

        logger.warning(
            "Se encontraron fuentes, pero el contexto está vacío."
        )

        return ""

    calendar_context = get_calendar_context(db)

    community_context = get_community_context(db)

    context = f"""
FECHA ACTUAL:
{date.today().isoformat()}

BASE DE CONOCIMIENTO INSTITUCIONAL:
{knowledge_context}

FECHAS ACADÉMICAS:
{calendar_context}

PUBLICACIONES DE COMUNIDAD:
{community_context}
""".strip()

    return context


# =========================================================
# CONSULTA A OLLAMA
# =========================================================

async def ask_ollama(question: str, context: str) -> str:

    # Protección adicional: nunca consultar Ollama sin contexto.
    if not context or not context.strip():

        logger.info(
            "Consulta bloqueada por ausencia de contexto institucional."
        )

        return NO_KNOWLEDGE_ANSWER

    user_content = f"""
PREGUNTA DEL ESTUDIANTE:
{question}

CONTEXTO DISPONIBLE:
{context}

INSTRUCCIONES OBLIGATORIAS:

1. Responde exclusivamente con información contenida
   en el contexto institucional proporcionado.

2. No utilices conocimientos generales del modelo.

3. No inventes datos, procedimientos, fechas,
   requisitos, valores económicos, nombres ni enlaces.

4. Si el contexto no contiene información suficiente
   para responder, indica que no encontraste información
   en la base de conocimiento de GENSTI.

5. No proporciones tutoriales, recetas, explicaciones
   generales ni respuestas externas a la institución.

6. Si existe información suficiente, responde de forma
   clara, organizada y en español.

7. Si la información es parcial, responde únicamente
   la parte respaldada por el contexto.
""".strip()

    payload = {
        "model": OLLAMA_MODEL,
        "stream": False,
        "keep_alive": "30m",
        "think": False,

        "messages": [
            {
                "role": "system",
                "content": SYSTEM_PROMPT,
            },
            {
                "role": "user",
                "content": user_content,
            },
        ],

        "options": {
            "temperature": 0.2,
            "num_predict": 800,
            "num_ctx": 4096,
        },
    }

    timeout = httpx.Timeout(
        connect=10.0,
        read=180.0,
        write=30.0,
        pool=10.0,
    )

    try:

        logger.info(
            "Iniciando consulta a Ollama. Modelo=%s",
            OLLAMA_MODEL,
        )

        async with httpx.AsyncClient(
            timeout=timeout
        ) as client:

            response = await client.post(
                f"{OLLAMA_BASE_URL}/api/chat",
                json=payload,
            )

            response.raise_for_status()

            data = response.json()

        message = data.get("message") or {}

        answer = (
            message.get("content") or ""
        ).strip()

        logger.info(
            "Ollama finalizó. Modelo=%s, done=%s, "
            "done_reason=%s, prompt_eval_count=%s, "
            "eval_count=%s, prompt_eval_duration=%s, "
            "eval_duration=%s, total_duration=%s",
            OLLAMA_MODEL,
            data.get("done"),
            data.get("done_reason"),
            data.get("prompt_eval_count"),
            data.get("eval_count"),
            data.get("prompt_eval_duration"),
            data.get("eval_duration"),
            data.get("total_duration"),
        )

        if not answer:

            logger.warning(
                "Ollama devolvió una respuesta vacía."
            )

            return (
                "No pude generar una respuesta en este momento. "
                "Intenta nuevamente."
            )

        if data.get("done_reason") == "length":

            logger.warning(
                "Ollama alcanzó el límite de generación."
            )

        return answer

    except httpx.TimeoutException:

        logger.exception(
            "Tiempo de espera agotado al consultar Ollama."
        )

        return (
            "La consulta está tardando más de lo esperado. "
            "Por favor, intenta nuevamente."
        )

    except httpx.HTTPStatusError:

        logger.exception(
            "Ollama respondió con un error HTTP."
        )

        return (
            "El servicio de inteligencia artificial presentó "
            "un problema. Intenta nuevamente más tarde."
        )

    except httpx.RequestError:

        logger.exception(
            "No fue posible conectar con Ollama."
        )

        return (
            "No fue posible conectar con el servicio de "
            "inteligencia artificial. Intenta nuevamente más tarde."
        )

    except (ValueError, KeyError):

        logger.exception(
            "La respuesta de Ollama tiene un formato inesperado."
        )

        return (
            "No pude interpretar la respuesta del servicio. "
            "Intenta nuevamente."
        )

    except Exception:

        logger.exception(
            "Error inesperado durante la consulta a Ollama."
        )

        return (
            "Ocurrió un problema al procesar tu consulta. "
            "Intenta nuevamente."
        )


from typing import Dict

from .search import search_knowledge


NO_KNOWLEDGE_ANSWER = (
    "No encontré información sobre ese tema en la base "
    "de conocimiento de GENSTI. Te recomiendo consultar "
    "con la dependencia correspondiente."
)


SYSTEM_PROMPT = """
Eres GENSTI, el asistente virtual de la comunidad de
Ingeniería de Sistemas de la Universidad Cooperativa
de Colombia, campus Ibagué.

REGLA PRINCIPAL:
Responde exclusivamente utilizando la información
institucional proporcionada en el contexto.

REGLAS OBLIGATORIAS:

1. No utilices conocimientos generales del modelo.
2. No inventes procedimientos, requisitos, fechas,
   valores económicos, nombres, correos ni enlaces.
3. No respondas preguntas ajenas a GENSTI o a la
   información institucional disponible.
4. Si el contexto no contiene información suficiente,
   reconoce que no tienes esa información.
5. No proporciones recetas, tutoriales generales ni
   explicaciones externas.
6. Si la información es parcial, responde únicamente
   la parte respaldada por las fuentes.
7. Responde siempre en español, de forma clara,
   respetuosa y sencilla.
8. No inventes información para completar una respuesta.

Es preferible reconocer que no existe información
disponible antes que proporcionar una respuesta inventada.
"""


def get_context_for_model(question: str) -> Dict:

    results = search_knowledge(question, limit=5)

    # No existe información relevante.
    if not results:
        return {
            "system_prompt": SYSTEM_PROMPT,
            "context": "",
            "sources": [],
        }

    context_parts = []

    for index, result in enumerate(results, start=1):

        context_parts.append(
            f"FUENTE {index}: {result['title']}\n"
            f"Documento: {result['document_id']}\n"
            f"Contenido:\n{result['content']}"
        )

    context = "\n\n".join(context_parts)

    return {
        "system_prompt": SYSTEM_PROMPT,
        "context": context,
        "sources": results,
    }

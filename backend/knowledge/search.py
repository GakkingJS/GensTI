import re
import unicodedata
from typing import List, Dict

from .loader import load_knowledge_chunks

MIN_COVERAGE = 0.5


STOPWORDS = {
    "de", "la", "el", "los", "las", "un", "una",
    "unos", "unas", "y", "o", "que", "como", "para",
    "por", "en", "con", "es", "son", "del", "al",
    "mi", "me", "puedo", "puede", "quiero", "necesito",
    "cual", "cuales", "cuando", "donde", "hay",
    "se", "su", "sus", "lo", "le", "les", "a",
    "sobre", "hacer", "realizar", "obtener",
    "preparo", "preparar", "cocinar", "cocina",
    "quisiera", "deseo", "dime",
    "explica", "explicame", "indica", "indicame",
    "podria", "favor",
    "dame", "receta", "recetas", "dar", "tutorial", "paso",
}


def normalize(text: str) -> str:
    text = text.lower()

    text = unicodedata.normalize("NFD", text)

    text = "".join(
        char for char in text
        if unicodedata.category(char) != "Mn"
    )

    return text


def tokenize(text: str) -> List[str]:
    normalized = normalize(text)

    words = re.findall(r"[a-z0-9]+", normalized)

    return [
        word for word in words
        if word not in STOPWORDS and len(word) > 2
    ]


def search_knowledge(
    question: str,
    limit: int = 5,
) -> List[Dict]:

    chunks = load_knowledge_chunks()

    question_words = set(tokenize(question))

    if not question_words:
        return []

    normalized_question = normalize(question).strip()

    results = []

    for chunk in chunks:

        content = normalize(chunk["content"])
        title = normalize(chunk["title"])

        content_words = set(tokenize(content))
        title_words = set(tokenize(title))

        content_matches = question_words & content_words
        title_matches = question_words & title_words

        score = (
            len(content_matches)
            + len(title_matches) * 3
        )

        # Bonificación por coincidencia de frase.
        if len(normalized_question) >= 8:
            if normalized_question in content:
                score += 5

        # FILTRO DE RELEVANCIA POR COBERTURA:
        # los términos distintos que coinciden (en título o contenido)
        # deben cubrir una fracción mínima de la pregunta.
        all_matches = content_matches | title_matches

        coverage = len(all_matches) / len(question_words)

        # Con una sola palabra en la pregunta basta 1 coincidencia;
        # con más palabras se exigen al menos 2 distintas.
        min_terms = 1 if len(question_words) == 1 else 2

        if len(all_matches) < min_terms:
            continue

        if coverage < MIN_COVERAGE:
            continue

        if score < 3:
            continue

        results.append({
            **chunk,
            "score": score,
            "matched_terms": sorted(all_matches),
        })

    results.sort(
        key=lambda item: item["score"],
        reverse=True,
    )

    # Evitar que un documento ocupe todos los resultados.
    selected = []
    document_counts = {}

    for item in results:

        document_id = item["document_id"]

        if document_counts.get(document_id, 0) >= 2:
            continue

        selected.append(item)

        document_counts[document_id] = (
            document_counts.get(document_id, 0) + 1
        )

        if len(selected) >= limit:
            break

    return selected
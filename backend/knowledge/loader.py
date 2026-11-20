from pathlib import Path
from functools import lru_cache
from typing import List, Dict

SOURCES_DIR = Path(__file__).resolve().parent / "sources"

CHUNK_SIZE = 850
CHUNK_OVERLAP = 120


def read_markdown_files() -> List[Dict]:
    documents = []

    if not SOURCES_DIR.exists():
        return documents

    for file_path in sorted(SOURCES_DIR.rglob("*.md")):
        text = file_path.read_text(encoding="utf-8").strip()

        if not text:
            continue

        documents.append({
            "id": file_path.stem,
            "title": (
                file_path.stem
                .replace("-", " ")
                .replace("_", " ")
                .title()
            ),
            "path": str(file_path),
            "content": text,
        })

    return documents


def split_into_chunks(
    text: str,
    chunk_size: int = CHUNK_SIZE,
    overlap: int = CHUNK_OVERLAP,
) -> List[str]:

    if chunk_size <= 0 or overlap < 0 or overlap >= chunk_size:
        raise ValueError("Configuración de fragmentación inválida.")

    text = " ".join(text.split())

    if not text:
        return []

    chunks = []
    start = 0

    while start < len(text):
        end = min(start + chunk_size, len(text))

        # Intentar no cortar una palabra.
        if end < len(text):
            space_position = text.rfind(" ", start, end)

            if space_position > start:
                end = space_position

        piece = text[start:end].strip()

        if piece:
            chunks.append(piece)

        if end >= len(text):
            break

        start = max(end - overlap, start + 1)

    return chunks


@lru_cache(maxsize=1)
def load_knowledge_chunks() -> List[Dict]:
    chunks = []

    for document in read_markdown_files():
        pieces = split_into_chunks(document["content"])

        for index, piece in enumerate(pieces):
            chunks.append({
                "id": f"{document['id']}_{index}",
                "document_id": document["id"],
                "title": document["title"],
                "content": piece,
            })

    return chunks

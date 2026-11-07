import re
from datetime import datetime, timezone
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from authorization import require_permission
from database import get_db
from models import News, User
from news_schemas import NewsCreate, NewsRead, NewsUpdate
from sessions import get_current_user

router = APIRouter(prefix="/news", tags=["News"])


def create_slug(title: str) -> str:
    slug = title.lower().strip()
    slug = re.sub(r"[^a-z0-9\s-]", "", slug)
    slug = re.sub(r"[\s_-]+", "-", slug)
    return slug[:200]


def get_news_or_404(
    news_id: UUID,
    db: Session,
) -> News:
    news = db.scalar(
        select(News).where(News.id == news_id)
    )

    if news is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Noticia no encontrada",
        )

    return news


@router.get("", response_model=list[NewsRead])
def list_news(
    db: Session = Depends(get_db),
):
    news = db.scalars(
        select(News)
        .where(News.status == "published")
        .order_by(News.published_at.desc().nullslast())
    ).all()

    return news


@router.get("/{news_id}", response_model=NewsRead)
def get_news(
    news_id: UUID,
    db: Session = Depends(get_db),
):
    return get_news_or_404(news_id, db)


@router.post(
    "",
    response_model=NewsRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("news.create"))],
)
def create_news(
    payload: NewsCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    slug = create_slug(payload.title)

    existing_news = db.scalar(
        select(News).where(News.slug == slug)
    )

    if existing_news:
        slug = f"{slug}-{uuid4().hex[:8]}"

    news = News(
        **payload.model_dump(),
        slug=slug,
        author_id=current_user.id,
        published_at=(
            datetime.now(timezone.utc)
            if payload.status == "published"
            else None
        ),
    )

    db.add(news)
    db.commit()
    db.refresh(news)

    return news


@router.patch(
    "/{news_id}",
    response_model=NewsRead,
    dependencies=[Depends(require_permission("news.edit"))],
)
def update_news(
    news_id: UUID,
    payload: NewsUpdate,
    db: Session = Depends(get_db),
):
    news = get_news_or_404(news_id, db)

    update_data = payload.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(news, field, value)

    if update_data.get("status") == "published":
        news.published_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(news)

    return news


@router.delete(
    "/{news_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_permission("news.delete"))],
)
def delete_news(
    news_id: UUID,
    db: Session = Depends(get_db),
):
    news = get_news_or_404(news_id, db)

    db.delete(news)
    db.commit()
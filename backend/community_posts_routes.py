from datetime import datetime
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from models import CommunityPost, User
from community_posts_schemas import (
    CommunityPostAdmin,
    CommunityPostCreate,
    CommunityPostPublic,
    CommunityPostReview,
)
from sessions import get_current_user
from authorization import get_user_permissions, require_permission


router = APIRouter(
    prefix="/community-posts",
    tags=["Community Posts"],
)


@router.post(
    "/",
    response_model=CommunityPostPublic,
    status_code=status.HTTP_201_CREATED,
)
def create_community_post(
    payload: CommunityPostCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    post = CommunityPost(
        author_id=current_user.id,
        title=payload.title.strip(),
        content=payload.content.strip(),
        category=payload.category.strip() or "General",
        status="pending",
    )

    db.add(post)
    db.commit()
    db.refresh(post)

    return post


@router.get("/mine", response_model=list[CommunityPostPublic])
def list_my_community_posts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    result = db.execute(
        select(CommunityPost)
        .where(CommunityPost.author_id == current_user.id)
        .order_by(CommunityPost.created_at.desc())
    )

    return result.scalars().all()


@router.get(
    "/",
    response_model=list[CommunityPostAdmin],
    dependencies=[Depends(require_permission("community_posts.moderate"))],
)
def list_all_community_posts(
    status_filter: str | None = None,
    db: Session = Depends(get_db),
):
    query = select(CommunityPost).order_by(
        CommunityPost.created_at.desc()
    )

    if status_filter:
        query = query.where(CommunityPost.status == status_filter)

    result = db.execute(query)

    return result.scalars().all()


@router.patch(
    "/{post_id}/review",
    response_model=CommunityPostAdmin,
    dependencies=[Depends(require_permission("community_posts.moderate"))],
)
def review_community_post(
    post_id: uuid.UUID,
    payload: CommunityPostReview,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    post = db.get(CommunityPost, post_id)

    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="La publicación no existe.",
        )

    if post.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Esta publicación ya fue revisada.",
        )

    post.status = payload.status
    post.admin_note = payload.admin_note
    post.reviewed_at = datetime.utcnow()
    post.reviewed_by = current_user.id

    db.commit()
    db.refresh(post)

    return post


@router.delete(
    "/{post_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_community_post(
    post_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    post = db.get(CommunityPost, post_id)

    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="La publicación no existe.",
        )

    user_permissions = get_user_permissions(
        db=db,
        user_id=current_user.id,
    )

    is_owner = post.author_id == current_user.id
    can_moderate = "community_posts.moderate" in user_permissions

    if not is_owner and not can_moderate:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para eliminar esta publicación.",
        )

    if is_owner and post.status == "published" and not can_moderate:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes eliminar una publicación ya publicada.",
        )

    db.delete(post)
    db.commit()

def delete_community_post(
    post_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    post = db.get(CommunityPost, post_id)

    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="La publicación no existe.",
        )

    user_permissions = get_user_permissions(
    db=db,
    user_id=current_user.id,
)

    is_owner = post.author_id == current_user.id
    can_moderate = "community_posts.moderate" in user_permissions

    if not is_owner and not can_moderate:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para eliminar esta publicación.",
        )

    if is_owner and post.status == "published" and not can_moderate:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes eliminar una publicación ya publicada.",
        )

    db.delete(post)
    db.commit()


@router.get("/feed", response_model=list[CommunityPostPublic])
def list_published_community_posts(
    db: Session = Depends(get_db),
):
    result = db.execute(
        select(CommunityPost)
        .where(CommunityPost.status == "published")
        .order_by(CommunityPost.created_at.desc())
    )

    return result.scalars().all()
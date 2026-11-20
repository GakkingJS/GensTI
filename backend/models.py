from datetime import datetime, timezone, date
from uuid import UUID, uuid4
import uuid

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    String,
    UniqueConstraint,
    func,
    Index,
    Integer,
    Text,
    Column,
)
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint(
            "email = lower(email)",
            name="ck_users_email_lowercase",
        ),
        CheckConstraint
        (
            "email ~ '^[^@[:space:]]+@campusucc[.]edu[.]co$'",
            name="ck_users_institutional_email",
        ),
    )   

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    email: Mapped[str] = mapped_column(
        String(254),
        nullable=False,
        unique=True,
    )
    password_hash: Mapped[str | None] = mapped_column(String(255))
    email_verified_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True)
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default="false",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    community_posts = relationship(
    "CommunityPost",
    foreign_keys="CommunityPost.author_id",
    back_populates="author",
    cascade="all, delete-orphan",
)


class EmailVerificationToken(Base):
    __tablename__ = "email_verification_tokens"
    __table_args__ = (
        Index(
            "ix_email_verification_tokens_user_id",
            "user_id",
        ),
    )

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    token_hash: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        unique=True,
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    used_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
    )
    attempts: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        server_default="0",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )



class EmailOutbox(Base):
    __tablename__ = "email_outbox"
    __table_args__ = (
        CheckConstraint(
            "status IN ('pending', 'processing', 'sent', 'failed')",
            name="ck_email_outbox_status",
        ),
        CheckConstraint(
            "message_type = 'email_verification'",
            name="ck_email_outbox_message_type",
        ),
        CheckConstraint(
            "attempts >= 0",
            name="ck_email_outbox_attempts_nonnegative",
        ),
        CheckConstraint(
            "status NOT IN ('pending', 'processing') "
            "OR token_ciphertext IS NOT NULL",
            name="ck_email_outbox_active_ciphertext",
        ),
        Index(
            "ix_email_outbox_status_available_at",
            "status",
            "available_at",
        ),
    )

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    verification_token_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("email_verification_tokens.id", ondelete="CASCADE"),
        nullable=False,
    )
    recipient: Mapped[str] = mapped_column(
        String(254),
        nullable=False,
    )
    message_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        server_default="email_verification",
    )
    token_ciphertext: Mapped[str | None] = mapped_column(
    Text,
    nullable=True,
    )
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        server_default="pending",
    )
    attempts: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        server_default="0",
    )
    available_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    sent_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
    )
    locked_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
    )
    last_error: Mapped[str | None] = mapped_column(
        String(200),
    )


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"
    __table_args__ = (
        Index(
            "ix_password_reset_tokens_user_id",
            "user_id",
        ),
        Index(
            "ix_password_reset_tokens_token_hash",
            "token_hash",
        ),
    )

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    token_hash: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        unique=True,
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    used_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )


class PasswordResetOutbox(Base):
    __tablename__ = "password_reset_outbox"
    __table_args__ = (
        CheckConstraint(
            "status IN ('pending', 'processing', 'sent', 'failed')",
            name="ck_password_reset_outbox_status",
        ),
        CheckConstraint(
            "attempts >= 0",
            name="ck_password_reset_outbox_attempts_nonnegative",
        ),
        CheckConstraint(
            "status NOT IN ('pending', 'processing') "
            "OR token_ciphertext IS NOT NULL",
            name="ck_password_reset_outbox_active_ciphertext",
        ),
        Index(
            "ix_password_reset_outbox_status_available_at",
            "status",
            "available_at",
        ),
    )

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    password_reset_token_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("password_reset_tokens.id", ondelete="CASCADE"),
        nullable=False,
    )
    recipient: Mapped[str] = mapped_column(
        String(254),
        nullable=False,
    )
    token_ciphertext: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        server_default="pending",
    )
    attempts: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        server_default="0",
    )
    available_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    sent_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
    )
    locked_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
    )
    last_error: Mapped[str | None] = mapped_column(
        String(200),
    )


class Role(Base):
    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        unique=True,
    )


class Permission(Base):
    __tablename__ = "permissions"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        unique=True,
    )


class UserRole(Base):
    __tablename__ = "user_roles"

    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    role_id: Mapped[int] = mapped_column(
        ForeignKey("roles.id", ondelete="CASCADE"),
        primary_key=True,
    )


class UserSession(Base):
    __tablename__ = "user_sessions"
    __table_args__ = (
        Index(
            "ix_user_sessions_user_id",
            "user_id",
        ),
        Index(
            "ix_user_sessions_expires_at",
            "expires_at",
        ),
    )

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )

    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    session_id_hash: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        unique=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    revoked_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
    )

class RolePermission(Base):
    __tablename__ = "role_permissions"

    role_id: Mapped[int] = mapped_column(
        ForeignKey("roles.id", ondelete="CASCADE"),
        primary_key=True,
    )
    permission_id: Mapped[int] = mapped_column(
        ForeignKey("permissions.id", ondelete="CASCADE"),
        primary_key=True,
    )


class UserPermissionOverride(Base):
    __tablename__ = "user_permission_overrides"
    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "permission_id",
            name="uq_user_permission_overrides_user_permission",
        ),
        CheckConstraint(
            "decision IN ('allow', 'deny')",
            name="ck_user_permission_overrides_decision",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    permission_id: Mapped[int] = mapped_column(
        ForeignKey("permissions.id", ondelete="CASCADE"),
        nullable=False,
    )
    decision: Mapped[str] = mapped_column(String(5), nullable=False)


class OutboxKeyCheck(Base):
    __tablename__ = "outbox_key_check"
    __table_args__ = (
        CheckConstraint(
            "id = 1",
            name="ck_outbox_key_check_single_row",
        ),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )
    check_ciphertext: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )


class News(Base):
    __tablename__ = "news"
    __table_args__ = (
        CheckConstraint(
            "status IN ('draft', 'published')",
            name="ck_news_status",
        ),
        Index(
            "ix_news_status_published_at",
            "status",
            "published_at",
        ),
        Index(
            "ix_news_category",
            "category",
        ),
    )

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )

    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    slug: Mapped[str] = mapped_column(
        String(220),
        nullable=False,
        unique=True,
    )

    excerpt: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )

    content: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        server_default="",
    )

    category: Mapped[str] = mapped_column(
        String(80),
        nullable=False,
        server_default="Anuncios",
    )

    author_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
    )

    author_name: Mapped[str | None] = mapped_column(
        String(120),
    )

    image_url: Mapped[str | None] = mapped_column(
        String(500),
    )

    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        server_default="draft",
    )

    is_featured: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default="false",
    )

    published_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )


class AcademicPeriod(Base):
    __tablename__ = "academic_periods"
    __table_args__ = (
        UniqueConstraint(
            "code",
            name="uq_academic_periods_code",
        ),
        CheckConstraint(
            "ends_at IS NULL OR ends_at >= starts_at",
            name="ck_academic_periods_date_range",
        ),
    )

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    code: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(
        String(120),
        nullable=False,
    )
    campus: Mapped[str] = mapped_column(
        String(80),
        nullable=False,
        server_default="Ibagué",
    )
    starts_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    ends_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )


class AcademicCalendarEvent(Base):
    __tablename__ = "academic_calendar_events"
    __table_args__ = (
        CheckConstraint(
            "status IN ('draft', 'published', 'archived')",
            name="ck_academic_calendar_events_status",
        ),
        CheckConstraint(
            "ends_at IS NULL OR ends_at >= starts_at",
            name="ck_academic_calendar_events_date_range",
        ),
        Index(
            "ix_academic_calendar_events_period_status",
            "period_id",
            "status",
        ),
        Index(
            "ix_academic_calendar_events_starts_at",
            "starts_at",
        ),
    )

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    period_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("academic_periods.id", ondelete="CASCADE"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )
    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    starts_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    ends_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    campus: Mapped[str] = mapped_column(
        String(80),
        nullable=False,
        server_default="Ibagué",
    )
    audience: Mapped[str] = mapped_column(
        String(120),
        nullable=False,
        server_default="Estudiantes de Ingeniería de Sistemas",
    )
    source_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )
    source_label: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        server_default="draft",
    )
    created_by_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    published_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )





def utcnow():
    return datetime.now(timezone.utc)


class Pqrs(Base):
    __tablename__ = "pqrs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
    )

    subject: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="open",
        nullable=False,
    )

    admin_response: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        onupdate=utcnow,
        nullable=False,
    )



def utcnow():
    return datetime.now(timezone.utc)


class CommunityEvent(Base):
    __tablename__ = "community_events"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    short_description: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    start_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    end_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    time: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    location: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )

    image_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    external_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    featured: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="draft",
        nullable=False,
    )

    created_by_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        onupdate=utcnow,
        nullable=False,
    )


class CommunityPost(Base):
    __tablename__ = "community_posts"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )

    author_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    title = Column(String(180), nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String(60), nullable=False, default="General")

    section = Column(
        String(20),
        nullable=False,
        server_default="community",
    )

    image_key = Column(
        String(100),
        nullable=True,
    )

    image_alt = Column(
        String(300),
        nullable=False,
        server_default="",
    )

    image_authorized = Column(
        Boolean,
        nullable=False,
        server_default="false",
    )

    status = Column(String(20), nullable=False, default="pending", index=True)
    admin_note = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    reviewed_at = Column(DateTime, nullable=True)

    reviewed_by = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    author = relationship(
        "User",
        foreign_keys=[author_id],
        back_populates="community_posts",
    )

    reviewer = relationship(
        "User",
        foreign_keys=[reviewed_by],
    )

import uuid

from sqlalchemy.dialects.postgresql import UUID, JSONB


class FaqItem(Base):
    __tablename__ = "faq_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(120), unique=True, nullable=False)
    category = Column(String(80), nullable=False, index=True)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    alternative_questions = Column(JSONB, nullable=False, default=list)
    source_url = Column(Text, nullable=True)
    source_name = Column(String(180), nullable=True)
    validity_note = Column(Text, nullable=True)
    status = Column(String(20), nullable=False, default="approved")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    documents = relationship(
        "FaqDocument",
        back_populates="faq",
        cascade="all, delete-orphan",
    )


class FaqDocument(Base):
    __tablename__ = "faq_documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    faq_id = Column(
        UUID(as_uuid=True),
        ForeignKey("faq_items.id", ondelete="CASCADE"),
        nullable=False,
    )
    title = Column(String(200), nullable=False)
    file_url = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    faq = relationship("FaqItem", back_populates="documents")


class TbogEntry(Base):
    __tablename__ = "tbog_entries"

    __table_args__ = (
        CheckConstraint(
            "content_type IN ('recognition', 'gallery')",
            name="ck_tbog_entries_content_type",
        ),
        CheckConstraint(
            "status IN ('draft', 'published', 'archived')",
            name="ck_tbog_entries_status",
        ),
        CheckConstraint(
            "category IN "
            "('semilleros', 'saber-pro', 'proyectos', 'excelencia')",
            name="ck_tbog_entries_category",
        ),
        CheckConstraint(
            "status != 'published' OR "
            "(publication_authorized = true AND image_key IS NOT NULL)",
            name="ck_tbog_entries_published",
        ),
        Index(
            "ix_tbog_entries_status_type",
            "status",
            "content_type",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    content_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        server_default="recognition",
    )

    student_name: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )

    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    category: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        server_default="excelencia",
    )

    period: Mapped[str] = mapped_column(
        String(120),
        nullable=False,
        server_default="",
    )

    image_key: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    image_alt: Mapped[str] = mapped_column(
        String(300),
        nullable=False,
        server_default="",
    )

    image_position: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        server_default="center",
    )

    featured: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default="false",
    )

    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        server_default="draft",
    )

    publication_authorized: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default="false",
    )

    verified_by_id: Mapped[uuid.UUID | None] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    verified_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_by_id: Mapped[uuid.UUID | None] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    updated_by_id: Mapped[uuid.UUID | None] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

class CommunityHighlight(Base):
    __tablename__ = "community_highlights"

    __table_args__ = (
        CheckConstraint(
            "status IN ('draft', 'published', 'archived')",
            name="ck_community_highlights_status",
        ),
        CheckConstraint(
            "sort_order >= 0",
            name="ck_community_highlights_sort_order",
        ),
        CheckConstraint(
            "status != 'published' OR "
            "(publication_authorized = true "
            "AND image_key IS NOT NULL)",
            name="ck_community_highlights_published",
        ),
        Index(
            "ix_community_highlights_status_order",
            "status",
            "sort_order",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    category: Mapped[str] = mapped_column(
        String(80),
        nullable=False,
    )

    sort_order: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        server_default="0",
    )

    image_key: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    image_alt: Mapped[str] = mapped_column(
        String(300),
        nullable=False,
        server_default="",
    )

    image_position: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        server_default="center",
    )

    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        server_default="draft",
    )

    publication_authorized: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default="false",
    )

    verified_by_id: Mapped[uuid.UUID | None] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    verified_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_by_id: Mapped[uuid.UUID | None] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    updated_by_id: Mapped[uuid.UUID | None] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
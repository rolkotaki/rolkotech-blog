from datetime import datetime, UTC
from pydantic import EmailStr
from sqlmodel import SQLModel, Field, Relationship, Column, ForeignKey
import uuid


class User(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(max_length=255, nullable=False)
    email: EmailStr = Field(max_length=255, index=True, unique=True)
    password: str
    is_active: bool = Field(default=True, nullable=False)
    is_superuser: bool = Field(default=False, nullable=False)
    creation_date: datetime = Field(default_factory=lambda: datetime.now(UTC))
    comments: list["Comment"] = Relationship(
        back_populates="user", sa_relationship_kwargs={"passive_deletes": True}
    )


class BlogPostTagLink(SQLModel, table=True):
    blog_post_id: int = Field(foreign_key="blogpost.id", primary_key=True)
    tag_id: int = Field(foreign_key="tag.id", primary_key=True)


class Tag(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    name: str = Field(max_length=50, unique=True, nullable=False)
    blog_posts: list["BlogPost"] | None = Relationship(
        back_populates="tags", link_model=BlogPostTagLink
    )


class BlogPost(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    title: str = Field(max_length=255, nullable=False, index=True)
    url: str = Field(max_length=255, nullable=False, unique=True)
    content: str = Field(nullable=False)
    image_path: str | None = Field(nullable=True)
    publication_date: datetime = Field(default_factory=lambda: datetime.now(UTC))
    featured: bool = Field(default=False, nullable=False)
    comments: list["Comment"] | None = Relationship(
        back_populates="blog_post", sa_relationship_kwargs={"passive_deletes": True}
    )
    tags: list["Tag"] | None = Relationship(
        back_populates="blog_posts", link_model=BlogPostTagLink
    )


class Comment(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    content: str = Field(max_length=1000, nullable=False)
    comment_date: datetime = Field(default_factory=lambda: datetime.now(UTC))
    # Foreign keys
    user_id: uuid.UUID | None = Field(
        default=None, sa_column=Column(ForeignKey("user.id", ondelete="SET NULL"))
    )
    blog_post_id: int = Field(
        sa_column=Column(ForeignKey("blogpost.id", ondelete="CASCADE"))
    )
    reply_to: int | None = Field(
        default=None, sa_column=Column(ForeignKey("comment.id", ondelete="CASCADE"))
    )
    # Relationships
    user: "User" = Relationship(back_populates="comments")
    blog_post: "BlogPost" = Relationship(back_populates="comments")

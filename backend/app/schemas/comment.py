from datetime import datetime
from datetime import UTC
from pydantic import BaseModel, Field
import uuid


class CommentBase(BaseModel):
    content: str = Field(max_length=1000)
    comment_date: datetime = Field(default_factory=lambda: datetime.now(UTC))
    # user_id: uuid.UUID
    blog_post_id: int


class CommentCreate(BaseModel):
    content: str = Field(min_length=1, max_length=1000)
    comment_date: datetime = Field(default_factory=lambda: datetime.now(UTC))


class CommentPublic(CommentBase):
    id: int


class CommentPrivate(CommentBase):
    id: int
    user_id: uuid.UUID


class CommentPublicWithUsername(CommentPublic):
    username: str


class CommentsPublic(BaseModel):
    data: list[CommentPublic | CommentPublicWithUsername]
    count: int


class CommentsPrivate(BaseModel):
    data: list[CommentPrivate]
    count: int


class CommentUpdate(BaseModel):
    content: str | None = Field(min_length=1, max_length=1000, default=None)
    comment_date: datetime = Field(default_factory=lambda: datetime.now(UTC))

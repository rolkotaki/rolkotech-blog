from datetime import datetime, UTC
from pydantic import BaseModel, Field
import uuid


class CommentBase(BaseModel):
    content: str = Field(max_length=1000)
    comment_date: datetime = Field(default_factory=lambda: datetime.now(UTC))
    blog_post_id: int


class CommentCreate(BaseModel):
    content: str = Field(min_length=1, max_length=1000)
    comment_date: datetime = Field(default_factory=lambda: datetime.now(UTC))
    reply_to: int | None = Field(default=None)


class CommentPublic(CommentBase):
    id: int
    reply_to: int | None


class CommentPublicWithUsername(CommentPublic):
    username: str | None


class CommentPublicWithReplies(CommentPublicWithUsername):
    replies: list[CommentPublicWithUsername] = Field(default_factory=list)


class CommentsPublic(BaseModel):
    data: list[CommentPublicWithReplies | CommentPublicWithUsername | CommentPublic]
    count: int


class CommentPrivate(CommentBase):
    id: int
    user_id: uuid.UUID | None
    reply_to: int | None


class CommentsPrivate(BaseModel):
    data: list[CommentPrivate]
    count: int


class CommentUpdate(BaseModel):
    content: str | None = Field(min_length=1, max_length=1000, default=None)
    comment_date: datetime = Field(default_factory=lambda: datetime.now(UTC))

from datetime import datetime, timezone
from pydantic import BaseModel, Field

from app.schemas.comment import CommentPublicWithUsername
from app.schemas.tag import TagPublic


class BlogPostBase(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    url: str = Field(min_length=1, max_length=255)
    content: str = Field()
    image_path: str | None = Field(default=None)
    publication_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class BlogPostCreate(BlogPostBase):
    tags: list[int] = Field(default_factory=list)


class BlogPostPublic(BlogPostBase):
    id: int
    tags: list["TagPublic"]


class BlogPostsByTag(TagPublic):
    blog_posts: list[BlogPostPublic]


class BlogPostPublicWithComments(BlogPostPublic):
    comments: list["CommentPublicWithUsername"]


class BlogPostsPublic(BaseModel):
    data: list[BlogPostPublic]
    count: int


class BlogPostUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=255)
    url: str | None = Field(default=None, max_length=255)
    content: str | None = Field(default=None)
    image_path: str | None = Field(default=None)
    publication_date: datetime | None = Field(default=None)
    tags: list[int] | None = Field(default=None)

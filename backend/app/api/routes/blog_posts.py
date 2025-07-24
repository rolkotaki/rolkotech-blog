from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import SessionDep, get_current_active_superuser
from app.db.crud import BlogPostCRUD
from app.models.models import BlogPost
from app.schemas.blog_post import (
    BlogPostPublic,
    BlogPostCreate,
    BlogPostUpdate,
    BlogPostsPublic,
    BlogPostPublicWithComments,
)
from app.schemas.comment import CommentPublicWithUsername
from app.schemas.message import Message
from app.schemas.tag import TagPublic


router = APIRouter(prefix="/blogposts", tags=["blogposts"])


@router.get("/", response_model=BlogPostsPublic)
def read_blog_posts(
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
    search_by: str | None = None,
    search_value: str | None = None,
) -> BlogPostsPublic:
    """
    Retrieve blog posts with optional filtering.
    """
    count, blog_posts = BlogPostCRUD(session).read_blog_posts(
        skip=skip, limit=limit, search_by=search_by, search_value=search_value
    )
    # Convert BlogPost models to BlogPostPublic models
    blog_posts = [
        BlogPostPublic.model_validate(blog_post, from_attributes=True)
        for blog_post in blog_posts
    ]
    return BlogPostsPublic(data=blog_posts, count=count)


@router.get("/{url}", response_model=BlogPostPublicWithComments)
def read_blog_post(session: SessionDep, url: str) -> BlogPostPublicWithComments:
    """
    Get blog post by ID with its tags and comments.
    """
    blog_post = BlogPostCRUD(session).read_blog_post_with_comments_and_tags(
        blog_post_url=url
    )
    if not blog_post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Blog post not found"
        )

    comments = [
        CommentPublicWithUsername(
            id=comment.id,
            content=comment.content,
            comment_date=comment.comment_date,
            user_id=comment.user_id,
            blog_post_id=comment.blog_post_id,
            username=comment.user.name,
        )
        for comment in blog_post.comments
    ]
    tags = [
        TagPublic.model_validate(tag, from_attributes=True) for tag in blog_post.tags
    ]

    return BlogPostPublicWithComments(
        id=blog_post.id,
        title=blog_post.title,
        url=blog_post.url,
        content=blog_post.content,
        image_path=blog_post.image_path,
        publication_date=blog_post.publication_date,
        comments=comments,
        tags=tags,
    )


@router.post(
    "/",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=BlogPostPublic,
)
def create_blog_post(
    session: SessionDep, blog_post_in: BlogPostCreate
) -> BlogPostPublic:
    """
    Create new blog post.
    """
    blog_post_crud = BlogPostCRUD(session)
    blog_post = blog_post_crud.get_blog_post_by_title(blog_title=blog_post_in.title)
    if blog_post:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A blog post with this title already exists",
        )
    blog_post = blog_post_crud.get_blog_post_by_url(blog_url=blog_post_in.url)
    if blog_post:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A blog post with this url already exists",
        )

    blog_post = BlogPostCRUD(session).create_blog_post(blog_post=blog_post_in)
    return blog_post


@router.patch(
    "/{id}",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=BlogPostPublic,
)
def update_blog_post(
    session: SessionDep, id: int, blog_post_in: BlogPostUpdate
) -> BlogPostPublic:
    """
    Update a blog post.
    """
    blog_post = session.get(BlogPost, id)
    if not blog_post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Blog post not found"
        )

    blog_post_crud = BlogPostCRUD(session)
    if blog_post.title != blog_post_in.title and blog_post_crud.get_blog_post_by_title(
        blog_title=blog_post_in.title
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A blog post with this title already exists",
        )
    if blog_post.url != blog_post_in.url and blog_post_crud.get_blog_post_by_url(
        blog_url=blog_post_in.url
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A blog post with this url already exists",
        )

    db_blog_post = BlogPostCRUD(session).update_blog_post(
        blog_post_db=blog_post, blog_post_in=blog_post_in
    )
    return db_blog_post


@router.delete(
    "/{id}",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=Message,
)
def delete_blog_post(session: SessionDep, id: int) -> Message:
    """
    Delete a blog post.
    """
    blog_post = session.get(BlogPost, id)
    if not blog_post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Blog post not found"
        )

    BlogPostCRUD(session).delete_blog_post(blog_post_db=blog_post)
    return Message(message="Blog post deleted successfully")

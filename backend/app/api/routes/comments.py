from fastapi import APIRouter, Depends, HTTPException, status
import uuid

from app.api.deps import SessionDep, CurrentUser, get_current_active_superuser
from app.db.crud import CommentCRUD
from app.models.models import Comment, BlogPost, User
from app.schemas.comment import (
    CommentCreate,
    CommentUpdate,
    CommentPublic,
    CommentsPublic,
    CommentPublicWithUsername,
    CommentPrivate,
    CommentsPrivate,
)
from app.schemas.message import Message


router = APIRouter(tags=["comments"])


@router.get(
    "/comments",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=CommentsPrivate,
)
def read_comments(
    session: SessionDep, skip: int = 0, limit: int = 100
) -> CommentsPrivate:
    """
    Retrieve comments.
    """
    count, comments = CommentCRUD(session).read_comments(skip=skip, limit=limit)
    # Convert Comment models to CommentPrivate models
    comments = [
        CommentPrivate.model_validate(comment, from_attributes=True)
        for comment in comments
    ]
    return CommentsPrivate(data=comments, count=count)


@router.get("/blogpost/{blog_post_id}/comments", response_model=CommentsPublic)
def read_comments_for_blog_post(
    session: SessionDep, blog_post_id: int, skip: int = 0, limit: int = 100
) -> CommentsPublic:
    """
    Retrieve comments for a specific blog post.
    """
    blog_post = session.get(BlogPost, blog_post_id)
    if not blog_post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Blog post not found"
        )

    count, comments = CommentCRUD(session).read_comments_for_blog_post(
        blog_post_id=blog_post_id, skip=skip, limit=limit
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
        for comment in comments
    ]
    return CommentsPublic(data=comments, count=count)


@router.get("/user/{user_id}/comments", response_model=CommentsPublic)
def read_comments_for_user(
    session: SessionDep,
    user_id: uuid.UUID,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
) -> CommentsPublic:
    """
    Retrieve comments made by a specific user.
    """
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    if user.id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No permission to view this user's comments",
        )

    count, comments = CommentCRUD(session).read_comments_for_user(
        user_id=user_id, skip=skip, limit=limit
    )
    comments = [
        CommentPublic.model_validate(comment, from_attributes=True)
        for comment in comments
    ]
    return CommentsPublic(data=comments, count=count)


@router.get("/me/comments", response_model=CommentsPrivate)
def read_my_comments(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> CommentsPrivate:
    """
    Retrieve own comments.
    """
    count, comments = CommentCRUD(session).read_comments_for_user(
        user_id=current_user.id, skip=skip, limit=limit
    )
    comments = [
        CommentPrivate.model_validate(comment, from_attributes=True)
        for comment in comments
    ]
    return CommentsPrivate(data=comments, count=count)


@router.get("/comments/{id}", response_model=CommentPublicWithUsername)
def read_comment(session: SessionDep, id: int) -> CommentPublicWithUsername:
    """
    Get comment by ID.
    """
    comment = session.get(Comment, id)
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found"
        )
    return CommentPublicWithUsername(
        id=comment.id,
        content=comment.content,
        comment_date=comment.comment_date,
        user_id=comment.user_id,
        blog_post_id=comment.blog_post_id,
        username=comment.user.name,
    )


@router.post(
    "/blogpost/{blog_post_id}/comments", response_model=CommentPublicWithUsername
)
def create_comment(
    session: SessionDep,
    blog_post_id: int,
    comment_in: CommentCreate,
    current_user: CurrentUser,
) -> CommentPublicWithUsername:
    """
    Create new comment on a blog post.
    """
    blog_post = session.get(BlogPost, blog_post_id)
    if not blog_post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Blog post not found"
        )

    comment = CommentCRUD(session).create_comment(
        comment=comment_in, user_id=current_user.id, blog_post_id=blog_post_id
    )
    return CommentPublicWithUsername(
        id=comment.id,
        content=comment.content,
        comment_date=comment.comment_date,
        user_id=comment.user_id,
        blog_post_id=comment.blog_post_id,
        username=comment.user.name,
    )


@router.patch("/blogpost/{blog_post_id}/comments/{id}", response_model=CommentPrivate)
def update_comment_on_blog_post(
    session: SessionDep,
    blog_post_id: int,
    id: int,
    comment_in: CommentUpdate,
    current_user: CurrentUser,
) -> CommentPrivate:
    """
    Update a comment.
    """
    blog_post = session.get(BlogPost, blog_post_id)
    if not blog_post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Blog post not found"
        )
    comment = session.get(Comment, id)
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found"
        )
    if comment.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No permission to update this comment",
        )
    if comment.blog_post_id != blog_post_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Comment does not belong to this blog post",
        )

    db_comment = CommentCRUD(session).update_comment(
        comment_db=comment, comment_in=comment_in
    )
    return db_comment


@router.delete("/blogpost/{blog_post_id}/comments/{id}", response_model=Message)
def delete_comment_on_blog_post(
    session: SessionDep, blog_post_id: int, id: int, current_user: CurrentUser
) -> Message:
    """
    Delete a comment.
    """
    blog_post = session.get(BlogPost, blog_post_id)
    if not blog_post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Blog post not found"
        )
    comment = session.get(Comment, id)
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found"
        )
    if comment.user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No permission to delete this comment",
        )
    if comment.blog_post_id != blog_post_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Comment does not belong to this blog post",
        )

    CommentCRUD(session).delete_comment(comment=comment)
    return Message(message="Comment deleted successfully")


@router.delete("/comments/{id}", response_model=Message)
def delete_comment(session: SessionDep, id: int, current_user: CurrentUser) -> Message:
    """
    Delete a comment.
    """
    comment = session.get(Comment, id)
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found"
        )
    if comment.user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No permission to delete this comment",
        )

    CommentCRUD(session).delete_comment(comment=comment)
    return Message(message="Comment deleted successfully")

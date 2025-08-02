from datetime import datetime, timedelta, UTC
import pytest
from sqlmodel import Session, select, func, delete
from uuid import UUID

from app.db.crud import CommentCRUD, BlogPostCRUD, UserCRUD
from app.models.models import Comment, BlogPost, User
from app.schemas.blog_post import BlogPostCreate
from app.schemas.comment import CommentCreate, CommentUpdate
from app.schemas.user import UserCreate


@pytest.fixture(scope="function")
def setup_user_and_blog_post(db: Session) -> tuple[UUID, int]:
    user = UserCRUD(db).create_user(
        user=UserCreate(name="user1", email="user1@email.com", password="password")
    )
    blog_post = BlogPostCRUD(db).create_blog_post(
        blog_post=BlogPostCreate(
            title="Blog Post 1",
            url="blog-post-1",
            content="Content of Blog Post 1",
            image_path="image.png",
            tags=[],
        )
    )
    return user.id, blog_post.id


@pytest.fixture(scope="function", autouse=True)
def delete_data(db: Session) -> None:
    db.exec(delete(Comment))
    db.exec(delete(BlogPost))
    db.exec(delete(User))
    db.commit()


def test_01_create_comment(db: Session, setup_user_and_blog_post) -> None:
    user_id, blog_post_id = setup_user_and_blog_post
    comment_create = CommentCreate(content="This is a comment")
    comment = CommentCRUD(db).create_comment(
        comment=comment_create, user_id=user_id, blog_post_id=blog_post_id
    )

    assert comment.id is not None and type(comment.id) is int
    assert comment.content == comment_create.content
    assert comment.user_id == user_id
    assert comment.blog_post_id == blog_post_id
    assert comment.comment_date is not None and type(comment.comment_date) is datetime


def test_02_read_comments(db: Session, setup_user_and_blog_post) -> None:
    user_id, blog_post_id = setup_user_and_blog_post
    comment_crud = CommentCRUD(db)
    comment_crud.create_comment(
        comment=CommentCreate(content="Comment 1"),
        user_id=user_id,
        blog_post_id=blog_post_id,
    )
    comment_crud.create_comment(
        comment=CommentCreate(content="Comment 2"),
        user_id=user_id,
        blog_post_id=blog_post_id,
    )

    count, comments = comment_crud.read_comments(skip=0, limit=10)
    assert count == 2
    assert len(comments) == 2

    count, comments = comment_crud.read_comments(skip=0, limit=1)
    assert count == 2
    assert len(comments) == 1

    count, comments = comment_crud.read_comments(skip=1, limit=2)
    assert count == 2
    assert len(comments) == 1


def test_03_read_comments_with_username(db: Session, setup_user_and_blog_post) -> None:
    user_id, blog_post_id = setup_user_and_blog_post
    comment_crud = CommentCRUD(db)
    comment_crud.create_comment(
        comment=CommentCreate(content="Comment 1"),
        user_id=user_id,
        blog_post_id=blog_post_id,
    )

    count, comments = comment_crud.read_comments_with_username(skip=0, limit=10)
    print(comments)
    assert count == 1
    assert len(comments) == 1
    assert comments[0].user.name == "user1"
    assert comments[0].user.email == "user1@email.com"


def test_04_read_comments_for_blog_post(db: Session, setup_user_and_blog_post) -> None:
    user_id, blog_post_id = setup_user_and_blog_post
    comment_crud = CommentCRUD(db)
    comment_1 = comment_crud.create_comment(
        comment=CommentCreate(
            content="Comment 1", comment_date=datetime.now(UTC) - timedelta(days=1)
        ),
        user_id=user_id,
        blog_post_id=blog_post_id,
    )
    comment_crud.create_comment(
        comment=CommentCreate(content="Comment 2", comment_date=datetime.now(UTC)),
        user_id=user_id,
        blog_post_id=blog_post_id,
    )
    comment_crud.create_comment(
        comment=CommentCreate(content="Comment 3", reply_to=comment_1.id),
        user_id=user_id,
        blog_post_id=blog_post_id,
    )

    count, comments = comment_crud.read_comments_for_blog_post(
        blog_post_id=blog_post_id, skip=0, limit=10
    )
    assert count == 3
    assert len(comments) == 2

    assert comments[0].content == "Comment 2"
    assert comments[1].content == "Comment 1"

    count, comments = comment_crud.read_comments_for_blog_post(
        blog_post_id=blog_post_id, skip=0, limit=1
    )
    assert count == 3
    assert len(comments) == 1

    count, comments = comment_crud.read_comments_for_blog_post(
        blog_post_id=blog_post_id, skip=1, limit=2
    )
    assert count == 3
    assert len(comments) == 1


def test_05_read_comment_replies(db: Session, setup_user_and_blog_post) -> None:
    user_id, blog_post_id = setup_user_and_blog_post
    comment_crud = CommentCRUD(db)
    comment_1 = comment_crud.create_comment(
        comment=CommentCreate(content="Comment 1"),
        user_id=user_id,
        blog_post_id=blog_post_id,
    )
    comment_2 = comment_crud.create_comment(
        comment=CommentCreate(content="Comment 2"),
        user_id=user_id,
        blog_post_id=blog_post_id,
    )
    comment_crud.create_comment(
        comment=CommentCreate(content="Comment 1 reply", reply_to=comment_1.id),
        user_id=user_id,
        blog_post_id=blog_post_id,
    )
    comment_crud.create_comment(
        comment=CommentCreate(content="Comment 2 reply", reply_to=comment_2.id),
        user_id=user_id,
        blog_post_id=blog_post_id,
    )

    count, comments = comment_crud.read_comment_replies(comment_id=comment_1.id)
    assert count == 1
    assert len(comments) == 1

    assert comments[0].content == "Comment 1 reply"


def test_06_read_comments_for_user(db: Session, setup_user_and_blog_post) -> None:
    user_id, blog_post_id = setup_user_and_blog_post
    comment_crud = CommentCRUD(db)
    comment_crud.create_comment(
        comment=CommentCreate(content="Comment 1"),
        user_id=user_id,
        blog_post_id=blog_post_id,
    )
    comment_crud.create_comment(
        comment=CommentCreate(content="Comment 2"),
        user_id=user_id,
        blog_post_id=blog_post_id,
    )

    count, comments = comment_crud.read_comments_for_user(
        user_id=user_id, skip=0, limit=10
    )
    assert count == 2
    assert len(comments) == 2

    count, comments = comment_crud.read_comments_for_user(
        user_id=user_id, skip=0, limit=1
    )
    assert count == 2
    assert len(comments) == 1

    count, comments = comment_crud.read_comments_for_user(
        user_id=user_id, skip=1, limit=2
    )
    assert count == 2
    assert len(comments) == 1


def test_07_update_comment(db: Session, setup_user_and_blog_post) -> None:
    user_id, blog_post_id = setup_user_and_blog_post
    comment_crud = CommentCRUD(db)
    comment = comment_crud.create_comment(
        comment=CommentCreate(content="Comment 1"),
        user_id=user_id,
        blog_post_id=blog_post_id,
    )

    comment_update = CommentUpdate(content="Updated Comment")
    comment_updated = comment_crud.update_comment(
        comment_db=comment, comment_in=comment_update
    )

    assert comment_updated.content == comment_update.content
    assert comment_updated.id == comment.id
    assert comment_updated.comment_date.replace(
        tzinfo=None
    ) == comment.comment_date.replace(tzinfo=None)  # remains unchanged
    assert comment_updated.user_id == user_id
    assert comment_updated.blog_post_id == blog_post_id


def test_08_delete_comment(db: Session, setup_user_and_blog_post) -> None:
    user_id, blog_post_id = setup_user_and_blog_post
    comment_crud = CommentCRUD(db)
    comment = comment_crud.create_comment(
        comment=CommentCreate(content="Comment 1"),
        user_id=user_id,
        blog_post_id=blog_post_id,
    )
    count = db.exec(select(func.count()).select_from(Comment)).one()
    assert count == 1
    comment_crud.delete_comment(comment=comment)
    count = db.exec(select(func.count()).select_from(Comment)).one()
    assert count == 0

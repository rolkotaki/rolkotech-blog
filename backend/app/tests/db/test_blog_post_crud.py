from datetime import datetime
from datetime import UTC
from fastapi import HTTPException
import pytest
from sqlmodel import Session, select, func, delete
from uuid import UUID

from app.db.crud import TagCRUD, BlogPostCRUD, CommentCRUD, UserCRUD
from app.models.models import Comment, BlogPost, User, Tag, BlogPostTagLink
from app.schemas.blog_post import BlogPostCreate, BlogPostUpdate
from app.schemas.comment import CommentCreate
from app.schemas.tag import TagCreate
from app.schemas.user import UserCreate


@pytest.fixture(scope="function")
def setup_tags(db: Session) -> tuple[int, int]:
    tag_crud = TagCRUD(db)
    tag_1 = tag_crud.create_tag(tag=TagCreate(name="tag1"))
    tag_2 = tag_crud.create_tag(tag=TagCreate(name="tag2"))
    return tag_1.id, tag_2.id


@pytest.fixture(scope="function")
def setup_user(db: Session) -> UUID:
    user = UserCRUD(db).create_user(
        user=UserCreate(name="user1", email="user1@email.com", password="password")
    )
    return user.id


@pytest.fixture(scope="function", autouse=True)
def delete_data(db: Session) -> None:
    db.exec(delete(Comment))
    db.exec(delete(BlogPostTagLink))
    db.exec(delete(BlogPost))
    db.exec(delete(Tag))
    db.exec(delete(User))
    db.commit()


def test_01_create_blog_post_with_no_tags(db: Session) -> None:
    blog_post_crud = BlogPostCRUD(db)
    blog_post_create = BlogPostCreate(
        title="Blog Post 1", url="blog-post-1", content="Content of Blog Post 1"
    )

    blog_post = blog_post_crud.create_blog_post(blog_post=blog_post_create)

    assert blog_post.id is not None and type(blog_post.id) is int
    assert blog_post.title == blog_post_create.title
    assert blog_post.url == blog_post_create.url
    assert blog_post.content == blog_post_create.content
    assert blog_post.image_path is None
    assert (
        blog_post.publication_date is not None
        and type(blog_post.publication_date) is datetime
    )
    assert len(blog_post.tags) == 0

    blog_post_create = BlogPostCreate(
        title="Blog Post 2",
        url="blog-post-2",
        content="Content of Blog Post 2",
        image_path="image.png",
        tags=[],
    )
    blog_post = blog_post_crud.create_blog_post(blog_post=blog_post_create)

    assert blog_post.id is not None and type(blog_post.id) is int
    assert blog_post.title == blog_post_create.title
    assert blog_post.url == blog_post_create.url
    assert blog_post.content == blog_post_create.content
    assert blog_post.image_path == blog_post_create.image_path
    assert blog_post.publication_date.replace(
        tzinfo=None
    ) == blog_post_create.publication_date.replace(tzinfo=None)
    assert len(blog_post.tags) == 0


def test_02_create_blog_post_with_tags(db: Session, setup_tags) -> None:
    tag_1, tag_2 = setup_tags
    blog_post_crud = BlogPostCRUD(db)
    blog_post_create = BlogPostCreate(
        title="Blog Post 1",
        url="blog-post-1",
        content="Content of Blog Post 1",
        tags=[tag_1],
    )
    blog_post = blog_post_crud.create_blog_post(blog_post=blog_post_create)

    assert len(blog_post.tags) == 1

    blog_post_create = BlogPostCreate(
        title="Blog Post 2",
        url="blog-post-2",
        content="Content of Blog Post 2",
        tags=[tag_1, tag_2],
    )
    blog_post = blog_post_crud.create_blog_post(blog_post=blog_post_create)

    assert len(blog_post.tags) == 2


def test_03_create_blog_post_with_invalid_tags(db: Session) -> None:
    blog_post_create = BlogPostCreate(
        title="Blog Post 1",
        url="blog-post-1",
        content="Content of Blog Post 1",
        tags=[9999],
    )
    with pytest.raises(HTTPException) as ex:
        BlogPostCRUD(db).create_blog_post(blog_post=blog_post_create)
    assert ex.value.status_code == 404
    assert ex.value.detail == "Tag with ID 9999 not found"


def test_04_read_blog_posts(db: Session, setup_tags) -> None:
    tag_1, tag_2 = setup_tags
    blog_post_crud = BlogPostCRUD(db)
    blog_post_create = BlogPostCreate(
        title="Blog Post 1",
        url="blog-post-1",
        content="Content of Blog Post 1",
        tags=[],
    )
    blog_post_crud.create_blog_post(blog_post=blog_post_create)

    blog_post_create = BlogPostCreate(
        title="Blog Post 2",
        url="blog-post-2",
        content="Content of Blog Post 2",
        tags=[tag_1, tag_2],
    )
    blog_post_crud.create_blog_post(blog_post=blog_post_create)

    count, blog_posts = blog_post_crud.read_blog_posts(skip=0, limit=10)
    assert count == 2
    assert len(blog_posts) == 2

    count, blog_posts = blog_post_crud.read_blog_posts(skip=0, limit=1)
    assert count == 2
    assert len(blog_posts) == 1

    count, blog_posts = blog_post_crud.read_blog_posts(skip=1, limit=10)
    assert count == 2
    assert len(blog_posts) == 1

    count, blog_posts = blog_post_crud.read_blog_posts(skip=2, limit=10)
    assert count == 2
    assert len(blog_posts) == 0


def test_05_read_blog_post_with_comments_and_tags(
    db: Session, setup_user, setup_tags
) -> None:
    user_id = setup_user
    tag_1, tag_2 = setup_tags
    blog_post_crud = BlogPostCRUD(db)
    blog_post_create = BlogPostCreate(
        title="Blog Post 1",
        url="blog-post-1",
        content="Content of Blog Post 1",
        tags=[],
    )
    blog_post = blog_post_crud.create_blog_post(blog_post=blog_post_create)

    blog_post_with_comments_and_tags = (
        blog_post_crud.read_blog_post_with_comments_and_tags(blog_post.url)
    )
    assert blog_post_with_comments_and_tags.id == blog_post.id
    assert len(blog_post_with_comments_and_tags.comments) == 0
    assert len(blog_post_with_comments_and_tags.tags) == 0

    blog_post_create = BlogPostCreate(
        title="Blog Post 2",
        url="blog-post-2",
        content="Content of Blog Post 2",
        tags=[tag_1],
    )
    blog_post = blog_post_crud.create_blog_post(blog_post=blog_post_create)

    blog_post_with_comments_and_tags = (
        blog_post_crud.read_blog_post_with_comments_and_tags(blog_post.url)
    )
    assert blog_post_with_comments_and_tags.id == blog_post.id
    assert len(blog_post_with_comments_and_tags.comments) == 0
    assert len(blog_post_with_comments_and_tags.tags) == 1

    blog_post_create = BlogPostCreate(
        title="Blog Post 3",
        url="blog-post-3",
        content="Content of Blog Post 3",
        tags=[tag_1, tag_2],
    )
    blog_post = blog_post_crud.create_blog_post(blog_post=blog_post_create)

    comment_crud = CommentCRUD(db)
    comment_crud.create_comment(
        comment=CommentCreate(content="Comment 1"),
        user_id=user_id,
        blog_post_id=blog_post.id,
    )
    comment_crud.create_comment(
        comment=CommentCreate(content="Comment 2"),
        user_id=user_id,
        blog_post_id=blog_post.id,
    )

    blog_post_with_comments_and_tags = (
        blog_post_crud.read_blog_post_with_comments_and_tags(blog_post.url)
    )

    assert blog_post_with_comments_and_tags.id == blog_post.id
    assert len(blog_post_with_comments_and_tags.comments) == 2
    assert len(blog_post_with_comments_and_tags.tags) == 2
    assert blog_post_with_comments_and_tags.title == blog_post.title
    assert blog_post_with_comments_and_tags.url == blog_post.url
    assert blog_post_with_comments_and_tags.content == blog_post.content


def test_06_read_blog_post_by_title(db: Session) -> None:
    blog_post_crud = BlogPostCRUD(db)
    blog_post_create = BlogPostCreate(
        title="Blog Post 1", url="blog-post-1", content="Content of Blog Post 1"
    )

    blog_post_from_db = blog_post_crud.get_blog_post_by_title(
        blog_title=blog_post_create.title
    )
    assert blog_post_from_db is None

    blog_post = blog_post_crud.create_blog_post(blog_post=blog_post_create)

    blog_post_from_db = blog_post_crud.get_blog_post_by_title(
        blog_title=blog_post.title
    )
    assert blog_post_from_db.id == blog_post.id
    assert blog_post_from_db.title == blog_post.title
    assert blog_post_from_db.url == blog_post.url
    assert blog_post_from_db.content == blog_post.content


def test_07_read_blog_post_by_url(db: Session) -> None:
    blog_post_crud = BlogPostCRUD(db)
    blog_post_create = BlogPostCreate(
        title="Blog Post 1", url="blog-post-1", content="Content of Blog Post 1"
    )

    blog_post_from_db = blog_post_crud.get_blog_post_by_url(
        blog_url=blog_post_create.url
    )
    assert blog_post_from_db is None

    blog_post = blog_post_crud.create_blog_post(blog_post=blog_post_create)

    blog_post_from_db = blog_post_crud.get_blog_post_by_url(blog_url=blog_post.url)
    assert blog_post_from_db.id == blog_post.id
    assert blog_post_from_db.title == blog_post.title
    assert blog_post_from_db.url == blog_post.url
    assert blog_post_from_db.content == blog_post.content


def test_08_update_blog_post(db: Session, setup_tags) -> None:
    tag_1, tag_2 = setup_tags
    blog_post_crud = BlogPostCRUD(db)
    blog_post_create = BlogPostCreate(
        title="Blog Post 1",
        url="blog-post-1",
        content="Content of Blog Post 1",
        tags=[tag_1],
    )
    blog_post = blog_post_crud.create_blog_post(blog_post=blog_post_create)

    assert blog_post.title == "Blog Post 1"
    assert len(blog_post.tags) == 1

    blog_post_update = BlogPostUpdate(title="Blog Post 1 Updated", tags=[])
    blog_post_updated = blog_post_crud.update_blog_post(
        blog_post_db=blog_post, blog_post_in=blog_post_update
    )

    assert blog_post_updated.id == blog_post.id
    assert blog_post_updated.title == "Blog Post 1 Updated"
    assert len(blog_post_updated.tags) == 0

    blog_post_update = BlogPostUpdate(
        title="Blog Post 1 Updated Again",
        url="blog-post-1-updated-again",
        content="Content of Blog Post 1 Updated Again",
        image_path="image.png",
        publication_date=datetime.now(UTC),
        tags=[tag_1, tag_2],
    )
    blog_post_updated_again = blog_post_crud.update_blog_post(
        blog_post_db=blog_post, blog_post_in=blog_post_update
    )

    assert blog_post_updated_again.id == blog_post.id
    assert blog_post_updated_again.title == blog_post_update.title
    assert blog_post_updated_again.url == blog_post_update.url
    assert blog_post_updated_again.content == blog_post_update.content
    assert blog_post_updated_again.image_path == blog_post_update.image_path
    assert blog_post_updated_again.publication_date.replace(
        tzinfo=None
    ) == blog_post_update.publication_date.replace(tzinfo=None)
    assert len(blog_post_updated_again.tags) == 2


def test_09_update_blog_post_with_invalid_tags(db: Session) -> None:
    blog_post_crud = BlogPostCRUD(db)
    blog_post_create = BlogPostCreate(
        title="Blog Post 1", url="blog-post-1", content="Content of Blog Post 1"
    )
    blog_post = blog_post_crud.create_blog_post(blog_post=blog_post_create)

    blog_post_update = BlogPostUpdate(title="Blog Post 1 Updated", tags=[9999])
    with pytest.raises(HTTPException) as ex:
        blog_post_crud.update_blog_post(
            blog_post_db=blog_post, blog_post_in=blog_post_update
        )
    assert ex.value.status_code == 404
    assert ex.value.detail == "Tag with ID 9999 not found"


def test_10_delete_blog_post(db: Session) -> None:
    blog_post_crud = BlogPostCRUD(db)
    blog_post_create = BlogPostCreate(
        title="Blog Post 1", url="blog-post-1", content="Content of Blog Post 1"
    )
    blog_post = blog_post_crud.create_blog_post(blog_post=blog_post_create)

    count = db.exec(select(func.count()).select_from(BlogPost)).one()
    assert count == 1

    blog_post_crud.delete_blog_post(blog_post_db=blog_post)

    count = db.exec(select(func.count()).select_from(BlogPost)).one()
    assert count == 0

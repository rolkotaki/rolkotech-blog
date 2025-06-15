import pytest
from sqlmodel import Session, select, func, delete

from app.db.crud import TagCRUD, BlogPostCRUD
from app.models.models import Tag, BlogPost, BlogPostTagLink
from app.schemas.blog_post import BlogPostCreate
from app.schemas.tag import TagCreate, TagUpdate


@pytest.fixture(scope="function", autouse=True)
def delete_data(db: Session) -> None:
    db.exec(delete(BlogPostTagLink))
    db.exec(delete(BlogPost))
    db.exec(delete(Tag))
    db.commit()


def test_01_create_tag(db: Session) -> None:
    tag_name = "tag1"
    tag_create = TagCreate(name=tag_name)
    tag = TagCRUD(db).create_tag(tag=tag_create)

    assert tag.id is not None and type(tag.id) is int
    assert tag.name == tag_name


def test_02_read_tags(db: Session) -> None:
    tag_crud = TagCRUD(db)
    count, tags = tag_crud.read_tags(skip=0, limit=10)
    assert count == 0
    assert len(tags) == 0

    tag_crud.create_tag(TagCreate(name="tag1"))
    tag_crud.create_tag(TagCreate(name="tag2"))

    count, tags = tag_crud.read_tags(skip=0, limit=10)
    assert count == 2
    assert len(tags) == 2

    count, tags = tag_crud.read_tags(skip=0, limit=1)
    assert count == 2
    assert len(tags) == 1

    count, tags = tag_crud.read_tags(skip=0, limit=1)
    assert count == 2
    assert len(tags) == 1

    count, tags = tag_crud.read_tags(skip=1, limit=2)
    assert count == 2
    assert len(tags) == 1


def test_03_read_tag_with_blog_posts(db: Session) -> None:
    tag_crud = TagCRUD(db)
    tag_1 = tag_crud.create_tag(TagCreate(name="tag1"))

    tag = tag_crud.read_tag_with_blog_posts(tag_id=tag_1.id)
    assert len(tag.blog_posts) == 0

    BlogPostCRUD(db).create_blog_post(
        blog_post=BlogPostCreate(
            title="Blog Post 1",
            url="blog-post-1",
            content="Content of Blog Post 1",
            image_path="image.png",
            tags=[tag_1.id],
        )
    )
    BlogPostCRUD(db).create_blog_post(
        blog_post=BlogPostCreate(
            title="Blog Post 2",
            url="blog-post-2",
            content="Content of Blog Post 2",
            image_path="image.png",
            tags=[],
        )
    )
    tag = tag_crud.read_tag_with_blog_posts(tag_id=tag_1.id)
    assert len(tag.blog_posts) == 1


def test_04_get_tag_by_name(db: Session) -> None:
    tag_name = "tag1"

    tag_crud = TagCRUD(db)
    tag = tag_crud.get_tag_by_name(tag_name=tag_name)
    assert tag is None

    tag_crud.create_tag(TagCreate(name=tag_name))
    tag_crud.create_tag(TagCreate(name="tag2"))

    tag = tag_crud.get_tag_by_name(tag_name=tag_name)
    assert tag is not None
    assert tag.name == tag_name


def test_05_update_tag(db: Session) -> None:
    tag_crud = TagCRUD(db)
    tag = tag_crud.create_tag(TagCreate(name="tag1"))
    tag_update = TagUpdate(name="tag1_updated")
    tag_updated = tag_crud.update_tag(tag_db=tag, tag_in=tag_update)

    assert tag_updated.name == tag_update.name
    assert tag_updated.id == tag.id


def test_06_delete_tag(db: Session) -> None:
    tag_crud = TagCRUD(db)
    tag = tag_crud.create_tag(TagCreate(name="tag1"))
    count = db.exec(select(func.count()).select_from(Tag)).one()
    assert count == 1
    tag_crud.delete_tag(tag_db=tag)
    count = db.exec(select(func.count()).select_from(Tag)).one()
    assert count == 0

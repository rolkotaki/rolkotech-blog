from fastapi.testclient import TestClient
import pytest
from sqlmodel import Session, delete

from app.core.config import settings
from app.db.crud import TagCRUD, BlogPostCRUD
from app.models.models import Tag, BlogPost, BlogPostTagLink
from app.schemas.blog_post import BlogPostCreate
from app.schemas.tag import TagCreate


@pytest.fixture(scope="function")
def setup_tag(db: Session) -> Tag:
    tag = TagCRUD(db).create_tag(tag=TagCreate(name="test_tag"))
    return tag


@pytest.fixture(scope="function", autouse=True)
def delete_data(db: Session) -> None:
    db.exec(delete(BlogPostTagLink))
    db.exec(delete(BlogPost))
    db.exec(delete(Tag))
    db.commit()


def test_01_read_tags_none(client: TestClient) -> None:
    response = client.get(f"{settings.API_VERSION_STR}/tags/")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 0
    assert len(data["data"]) == 0


def test_02_read_tags(client: TestClient, setup_tag: Tag) -> None:
    response = client.get(f"{settings.API_VERSION_STR}/tags/")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 1
    assert len(data["data"]) == 1
    assert "id" in data["data"][0]
    assert data["data"][0]["id"] == setup_tag.id
    assert "name" in data["data"][0]
    assert data["data"][0]["name"] == setup_tag.name


def test_03_read_tags_with_skip_and_limit(client: TestClient, db: Session) -> None:
    TagCRUD(db).create_tag(tag=TagCreate(name="test_tag_1"))
    tag_2 = TagCRUD(db).create_tag(tag=TagCreate(name="test_tag_2"))
    TagCRUD(db).create_tag(tag=TagCreate(name="test_tag_3"))
    response = client.get(f"{settings.API_VERSION_STR}/tags/?skip=1&limit=1")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 3
    assert len(data["data"]) == 1
    assert "id" in data["data"][0]
    assert data["data"][0]["id"] == tag_2.id
    assert "name" in data["data"][0]
    assert data["data"][0]["name"] == tag_2.name


def test_04_read_tag(client: TestClient, setup_tag: Tag) -> None:
    response = client.get(f"{settings.API_VERSION_STR}/tags/{setup_tag.id}")
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert data["id"] == setup_tag.id
    assert "name" in data
    assert data["name"] == setup_tag.name


def test_05_read_tag_not_found(client: TestClient) -> None:
    response = client.get(f"{settings.API_VERSION_STR}/tags/999")
    assert response.status_code == 404
    data = response.json()
    assert data["detail"] == "Tag not found"


def test_06_read_tag_with_blog_posts(
    client: TestClient, db: Session, setup_tag: Tag
) -> None:
    # No blog posts associated with the tag
    response = client.get(f"{settings.API_VERSION_STR}/tags/{setup_tag.id}/blogposts")
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert data["id"] == setup_tag.id
    assert "name" in data
    assert data["name"] == setup_tag.name
    assert "blog_posts" in data
    assert len(data["blog_posts"]) == 0

    # One blog post associated with the tag
    blog_post = BlogPostCRUD(db).create_blog_post(
        blog_post=BlogPostCreate(
            title="Blog Post 1",
            url="blog-post-1",
            content="Content of Blog Post 1",
            image_path="image.png",
            tags=[setup_tag.id],
        )
    )
    response = client.get(f"{settings.API_VERSION_STR}/tags/{setup_tag.id}/blogposts")
    assert response.status_code == 200
    data = response.json()
    assert len(data["blog_posts"]) == 1
    assert data["blog_posts"][0]["title"] == blog_post.title
    assert data["blog_posts"][0]["url"] == blog_post.url
    assert data["blog_posts"][0]["content"] == blog_post.content
    assert data["blog_posts"][0]["image_path"] == blog_post.image_path

    # Two blog posts associated with the tag
    BlogPostCRUD(db).create_blog_post(
        blog_post=BlogPostCreate(
            title="Blog Post 2",
            url="blog-post-2",
            content="Content of Blog Post 2",
            image_path="image.png",
            tags=[setup_tag.id],
        )
    )
    response = client.get(f"{settings.API_VERSION_STR}/tags/{setup_tag.id}/blogposts")
    assert response.status_code == 200
    data = response.json()
    assert len(data["blog_posts"]) == 2


def test_07_read_tag_with_blog_posts_not_found(client: TestClient) -> None:
    response = client.get(f"{settings.API_VERSION_STR}/tags/999/blogposts")
    assert response.status_code == 404
    data = response.json()
    assert data["detail"] == "Tag not found"


def test_08_create_tag(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    tag_data = {"name": "new_tag"}
    response = client.post(
        f"{settings.API_VERSION_STR}/tags/",
        headers=superuser_token_headers,
        json=tag_data,
    )
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert "name" in data
    assert data["name"] == tag_data["name"]


def test_09_create_tag_with_existing_name(
    client: TestClient, setup_tag: Tag, superuser_token_headers: dict[str, str]
) -> None:
    tag_data = {"name": setup_tag.name}
    response = client.post(
        f"{settings.API_VERSION_STR}/tags/",
        headers=superuser_token_headers,
        json=tag_data,
    )
    assert response.status_code == 400
    data = response.json()
    assert data["detail"] == "A tag with this name already exists"


def test_10_create_tag_unauthorized(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    tag_data = {"name": "new_tag"}
    response = client.post(
        f"{settings.API_VERSION_STR}/tags/",
        headers=normal_user_token_headers,
        json=tag_data,
    )
    assert response.status_code == 403
    data = response.json()
    assert data["detail"] == "The user does not have admin privileges"


def test_11_create_tag_invalid_data(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    tag_data = {"name": ""}
    response = client.post(
        f"{settings.API_VERSION_STR}/tags/",
        headers=superuser_token_headers,
        json=tag_data,
    )
    assert response.status_code == 422
    data = response.json()
    assert "detail" in data
    assert data["detail"][0]["msg"] == "String should have at least 1 character"
    assert data["detail"][0]["type"] == "string_too_short"


def test_12_update_tag(
    client: TestClient, setup_tag: Tag, superuser_token_headers: dict[str, str]
) -> None:
    tag_data = {"name": "updated_tag"}
    response = client.patch(
        f"{settings.API_VERSION_STR}/tags/{setup_tag.id}",
        headers=superuser_token_headers,
        json=tag_data,
    )
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert "name" in data
    assert data["name"] == tag_data["name"]


def test_13_update_tag_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    tag_data = {"name": "updated_tag"}
    response = client.patch(
        f"{settings.API_VERSION_STR}/tags/999",
        headers=superuser_token_headers,
        json=tag_data,
    )
    assert response.status_code == 404
    data = response.json()
    assert data["detail"] == "Tag not found"


def test_14_update_tag_name_already_exists(
    client: TestClient,
    db: Session,
    setup_tag: Tag,
    superuser_token_headers: dict[str, str],
) -> None:
    tag = TagCRUD(db).create_tag(tag=TagCreate(name="test_tag_2"))
    tag_data = {"name": tag.name}
    response = client.patch(
        f"{settings.API_VERSION_STR}/tags/{setup_tag.id}",
        headers=superuser_token_headers,
        json=tag_data,
    )
    assert response.status_code == 400
    data = response.json()
    assert data["detail"] == "A tag with this name already exists"


def test_15_update_tag_unauthorized(
    client: TestClient, setup_tag: Tag, normal_user_token_headers: dict[str, str]
) -> None:
    tag_data = {"name": "updated_tag"}
    response = client.patch(
        f"{settings.API_VERSION_STR}/tags/{setup_tag.id}",
        headers=normal_user_token_headers,
        json=tag_data,
    )
    assert response.status_code == 403
    data = response.json()
    assert data["detail"] == "The user does not have admin privileges"


def test_16_delete_tag(
    client: TestClient, setup_tag: Tag, superuser_token_headers: dict[str, str]
) -> None:
    response = client.delete(
        f"{settings.API_VERSION_STR}/tags/{setup_tag.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Tag deleted successfully"


def test_17_delete_tag_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    response = client.delete(
        f"{settings.API_VERSION_STR}/tags/999", headers=superuser_token_headers
    )
    assert response.status_code == 404
    data = response.json()
    assert data["detail"] == "Tag not found"


def test_18_delete_tag_unauthorized(
    client: TestClient, setup_tag: Tag, normal_user_token_headers: dict[str, str]
) -> None:
    response = client.delete(
        f"{settings.API_VERSION_STR}/tags/{setup_tag.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 403
    data = response.json()
    assert data["detail"] == "The user does not have admin privileges"


def test_19_delete_tag_with_blog_posts(
    client: TestClient,
    db: Session,
    setup_tag: Tag,
    superuser_token_headers: dict[str, str],
) -> None:
    blog_post = BlogPostCRUD(db).create_blog_post(
        blog_post=BlogPostCreate(
            title="Blog Post 1",
            url="blog-post-1",
            content="Content of Blog Post 1",
            image_path="image.png",
            tags=[setup_tag.id],
        )
    )
    response = client.delete(
        f"{settings.API_VERSION_STR}/tags/{setup_tag.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Tag deleted successfully"
    # Check if the blog post has no tag
    db.refresh(blog_post)
    assert blog_post.tags == []

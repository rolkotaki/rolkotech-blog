from fastapi.testclient import TestClient
import pytest
from sqlmodel import Session, delete

from app.core.config import settings
from app.db.crud import TagCRUD, BlogPostCRUD, UserCRUD, CommentCRUD
from app.models.models import Tag, BlogPost, BlogPostTagLink, Comment, User
from app.schemas.blog_post import BlogPostCreate
from app.schemas.comment import CommentCreate
from app.schemas.tag import TagCreate
from app.schemas.user import UserCreate


@pytest.fixture(scope="function")
def setup_tag(db: Session) -> Tag:
    tag = TagCRUD(db).create_tag(tag=TagCreate(name="test_tag"))
    return tag


@pytest.fixture(scope="function")
def setup_blog_post(db: Session) -> BlogPost:
    blog_post = BlogPostCRUD(db).create_blog_post(
        blog_post=BlogPostCreate(
            title="Blog Post 1",
            url="blog-post-1",
            content="Content of Blog Post 1",
            image_path="image.png",
            tags=[],
        )
    )
    return blog_post


@pytest.fixture(scope="function")
def setup_blog_post_with_tag_and_comment(db: Session) -> tuple[BlogPost, Tag, Comment]:
    tag = TagCRUD(db).create_tag(tag=TagCreate(name="test_tag"))
    user = UserCRUD(db).create_user(
        user=UserCreate(name="user1", email="user1@email.com", password="password")
    )
    blog_post = BlogPostCRUD(db).create_blog_post(
        blog_post=BlogPostCreate(
            title="Blog Post 1",
            url="blog-post-1",
            content="Content of Blog Post 1",
            image_path="image.png",
            tags=[tag.id],
        )
    )
    comment = CommentCRUD(db).create_comment(
        comment=CommentCreate(content="This is a comment"),
        blog_post_id=blog_post.id,
        user_id=user.id,
    )
    return blog_post, tag, comment


@pytest.fixture(scope="function", autouse=True)
def delete_data(db: Session) -> None:
    db.exec(delete(Comment))
    db.exec(delete(BlogPostTagLink))
    db.exec(delete(BlogPost))
    db.exec(delete(Tag))
    db.exec(
        delete(User).where(
            (User.email != settings.FIRST_SUPERUSER_EMAIL)
            & (User.email != settings.TEST_USER_EMAIL)
        )
    )
    db.commit()


def test_01_read_blog_posts_none(client: TestClient) -> None:
    response = client.get(f"{settings.API_VERSION_STR}/blogposts/")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 0
    assert len(data["data"]) == 0


def test_02_read_blog_posts(client: TestClient, setup_blog_post: BlogPost) -> None:
    response = client.get(f"{settings.API_VERSION_STR}/blogposts/")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 1
    assert len(data["data"]) == 1
    assert data["data"][0]["id"] == setup_blog_post.id
    assert data["data"][0]["title"] == setup_blog_post.title
    assert data["data"][0]["url"] == setup_blog_post.url
    assert data["data"][0]["content"] == setup_blog_post.content
    assert data["data"][0]["image_path"] == setup_blog_post.image_path
    assert data["data"][0]["tags"] == []


def test_03_read_blog_posts_with_skip_and_limit(
    client: TestClient, db: Session
) -> None:
    BlogPostCRUD(db).create_blog_post(
        blog_post=BlogPostCreate(
            title="Blog Post 1",
            url="blog-post-1",
            content="Content of Blog Post 1",
            image_path="image.png",
            tags=[],
        )
    )
    blog_post_2 = BlogPostCRUD(db).create_blog_post(
        blog_post=BlogPostCreate(
            title="Blog Post 2",
            url="blog-post-2",
            content="Content of Blog Post 2",
            image_path="image.png",
            tags=[],
        )
    )
    BlogPostCRUD(db).create_blog_post(
        blog_post=BlogPostCreate(
            title="Blog Post 3",
            url="blog-post-3",
            content="Content of Blog Post 3",
            image_path="image.png",
            tags=[],
        )
    )
    response = client.get(f"{settings.API_VERSION_STR}/blogposts/?skip=1&limit=1")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 3
    assert len(data["data"]) == 1
    assert data["data"][0]["id"] == blog_post_2.id
    assert data["data"][0]["title"] == blog_post_2.title
    assert data["data"][0]["url"] == blog_post_2.url
    assert data["data"][0]["content"] == blog_post_2.content
    assert data["data"][0]["image_path"] == blog_post_2.image_path
    assert data["data"][0]["tags"] == []


def test_04_read_blog_post(client: TestClient, setup_blog_post: BlogPost) -> None:
    response = client.get(f"{settings.API_VERSION_STR}/blogposts/{setup_blog_post.url}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == setup_blog_post.id
    assert data["title"] == setup_blog_post.title
    assert data["url"] == setup_blog_post.url
    assert data["content"] == setup_blog_post.content
    assert data["image_path"] == setup_blog_post.image_path
    assert data["publication_date"] == setup_blog_post.publication_date.isoformat()
    assert data["tags"] == []
    assert data["comments"] == []


def test_05_read_blog_post_with_tags_and_comments(
    client: TestClient, setup_blog_post_with_tag_and_comment: BlogPost
) -> None:
    blog_post, tag, comment = setup_blog_post_with_tag_and_comment
    response = client.get(f"{settings.API_VERSION_STR}/blogposts/{blog_post.url}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == blog_post.id
    assert data["title"] == blog_post.title
    assert data["url"] == blog_post.url
    assert data["content"] == blog_post.content
    assert data["image_path"] == blog_post.image_path
    assert data["publication_date"] == blog_post.publication_date.isoformat()
    assert len(data["tags"]) == 1
    assert data["tags"][0]["id"] == tag.id
    assert data["tags"][0]["name"] == tag.name
    assert len(data["comments"]) == 1
    assert data["comments"][0]["id"] == comment.id
    assert data["comments"][0]["content"] == comment.content
    assert data["comments"][0]["comment_date"] == comment.comment_date.isoformat()
    assert "user_id" not in data["comments"][0]
    assert data["comments"][0]["blog_post_id"] == comment.blog_post_id
    assert data["comments"][0]["username"] == comment.user.name


def test_06_read_blog_post_not_found(client: TestClient) -> None:
    response = client.get(f"{settings.API_VERSION_STR}/blogposts/not-existing-url")
    assert response.status_code == 404
    data = response.json()
    assert data["detail"] == "Blog post not found"


def test_07_create_blog_post(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    blog_post_data = {
        "title": "Blog Post 1",
        "url": "blog-post-1",
        "content": "Content of Blog Post 1",
    }
    response = client.post(
        f"{settings.API_VERSION_STR}/blogposts/",
        headers=superuser_token_headers,
        json=blog_post_data,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] is not None
    assert data["title"] == "Blog Post 1"
    assert data["url"] == "blog-post-1"
    assert data["content"] == "Content of Blog Post 1"
    assert data["image_path"] is None
    assert data["publication_date"] is not None
    assert data["tags"] == []


def test_08_create_blog_post_with_tags(
    client: TestClient, setup_tag: Tag, superuser_token_headers: dict[str, str]
) -> None:
    blog_post_data = {
        "title": "Blog Post 1",
        "url": "blog-post-1",
        "content": "Content of Blog Post 1",
        "tags": [setup_tag.id],
    }
    response = client.post(
        f"{settings.API_VERSION_STR}/blogposts/",
        headers=superuser_token_headers,
        json=blog_post_data,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] is not None
    assert data["title"] == "Blog Post 1"
    assert data["url"] == "blog-post-1"
    assert data["content"] == "Content of Blog Post 1"
    assert data["image_path"] is None
    assert data["publication_date"] is not None
    assert len(data["tags"]) == 1
    assert data["tags"][0]["id"] == setup_tag.id
    assert data["tags"][0]["name"] == setup_tag.name


def test_09_create_blog_post_with_existing_title(
    client: TestClient,
    setup_blog_post: BlogPost,
    superuser_token_headers: dict[str, str],
) -> None:
    blog_post_data = {
        "title": setup_blog_post.title,
        "url": "blog-post-999",
        "content": "Content of Blog Post 1",
    }
    response = client.post(
        f"{settings.API_VERSION_STR}/blogposts/",
        headers=superuser_token_headers,
        json=blog_post_data,
    )
    assert response.status_code == 400
    data = response.json()
    assert data["detail"] == "A blog post with this title already exists"


def test_10_create_blog_post_with_existing_url(
    client: TestClient,
    setup_blog_post: BlogPost,
    superuser_token_headers: dict[str, str],
) -> None:
    blog_post_data = {
        "title": "Blog Post 999",
        "url": setup_blog_post.url,
        "content": "Content of Blog Post 1",
    }
    response = client.post(
        f"{settings.API_VERSION_STR}/blogposts/",
        headers=superuser_token_headers,
        json=blog_post_data,
    )
    assert response.status_code == 400
    data = response.json()
    assert data["detail"] == "A blog post with this url already exists"


def test_11_create_blog_post_unauthorized(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    blog_post_data = {
        "title": "Blog Post 1",
        "url": "blog-post-1",
        "content": "Content of Blog Post 1",
    }
    response = client.post(
        f"{settings.API_VERSION_STR}/blogposts/",
        headers=normal_user_token_headers,
        json=blog_post_data,
    )
    assert response.status_code == 403
    data = response.json()
    assert data["detail"] == "The user does not have admin privileges"


def test_12_create_blog_post_invalid_title(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    blog_post_data = {
        "title": "",
        "url": "blog-post-1",
        "content": "Content of Blog Post 1",
    }
    response = client.post(
        f"{settings.API_VERSION_STR}/blogposts/",
        headers=superuser_token_headers,
        json=blog_post_data,
    )
    assert response.status_code == 422
    data = response.json()
    assert "message" in data
    assert data["message"] == "Title: String should have at least 1 character"


def test_13_create_blog_post_invalid_url(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    blog_post_data = {
        "title": "Blog Post 1",
        "url": "",
        "content": "Content of Blog Post 1",
    }
    response = client.post(
        f"{settings.API_VERSION_STR}/blogposts/",
        headers=superuser_token_headers,
        json=blog_post_data,
    )
    assert response.status_code == 422
    data = response.json()
    assert "message" in data
    assert data["message"] == "Url: String should have at least 1 character"


def test_14_update_blog_post(
    client: TestClient,
    setup_blog_post: BlogPost,
    superuser_token_headers: dict[str, str],
) -> None:
    blog_post_data = {
        "title": "Updated Blog Post",
        "url": "updated-blog-post",
        "content": "Updated content of Blog Post",
    }
    response = client.patch(
        f"{settings.API_VERSION_STR}/blogposts/{setup_blog_post.id}",
        headers=superuser_token_headers,
        json=blog_post_data,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == setup_blog_post.id
    assert data["title"] == blog_post_data["title"]
    assert data["url"] == blog_post_data["url"]
    assert data["content"] == blog_post_data["content"]
    assert data["image_path"] == setup_blog_post.image_path
    assert data["publication_date"] == setup_blog_post.publication_date.isoformat()
    assert data["tags"] == []


def test_15_update_blog_post_everything(
    client: TestClient,
    setup_blog_post: BlogPost,
    setup_tag: Tag,
    superuser_token_headers: dict[str, str],
) -> None:
    blog_post_data = {
        "title": "Updated Blog Post",
        "url": "updated-blog-post",
        "content": "Updated content of Blog Post",
        "image_path": "updated_image.png",
        "publication_date": "2023-10-01T00:00:00",
        "tags": [setup_tag.id],
    }
    response = client.patch(
        f"{settings.API_VERSION_STR}/blogposts/{setup_blog_post.id}",
        headers=superuser_token_headers,
        json=blog_post_data,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == setup_blog_post.id
    assert data["title"] == blog_post_data["title"]
    assert data["url"] == blog_post_data["url"]
    assert data["content"] == blog_post_data["content"]
    assert data["image_path"] == blog_post_data["image_path"]
    assert data["publication_date"] == blog_post_data["publication_date"]
    assert len(data["tags"]) == 1
    assert data["tags"][0]["id"] == setup_tag.id
    assert data["tags"][0]["name"] == setup_tag.name


def test_16_update_blog_post_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    blog_post_data = {
        "title": "Updated Blog Post",
        "url": "updated-blog-post",
        "content": "Updated content of Blog Post",
    }
    response = client.patch(
        f"{settings.API_VERSION_STR}/blogposts/999",
        headers=superuser_token_headers,
        json=blog_post_data,
    )
    assert response.status_code == 404
    data = response.json()
    assert data["detail"] == "Blog post not found"


def test_17_update_blog_post_with_existing_title(
    client: TestClient,
    db: Session,
    setup_blog_post: BlogPost,
    superuser_token_headers: dict[str, str],
) -> None:
    blog_post = BlogPostCRUD(db).create_blog_post(
        blog_post=BlogPostCreate(
            title="Blog Post 2",
            url="blog-post-2",
            content="Content of Blog Post 2",
            image_path="image.png",
            tags=[],
        )
    )
    blog_post_data = {
        "title": setup_blog_post.title,
        "url": "blog-post-999",
        "content": "Content of Blog Post 1",
    }
    response = client.patch(
        f"{settings.API_VERSION_STR}/blogposts/{blog_post.id}",
        headers=superuser_token_headers,
        json=blog_post_data,
    )
    assert response.status_code == 400
    data = response.json()
    assert data["detail"] == "A blog post with this title already exists"


def test_18_update_blog_post_with_existing_title(
    client: TestClient,
    db: Session,
    setup_blog_post: BlogPost,
    superuser_token_headers: dict[str, str],
) -> None:
    blog_post = BlogPostCRUD(db).create_blog_post(
        blog_post=BlogPostCreate(
            title="Blog Post 2",
            url="blog-post-2",
            content="Content of Blog Post 2",
            image_path="image.png",
            tags=[],
        )
    )
    blog_post_data = {
        "title": "Blog Post 999",
        "url": setup_blog_post.url,
        "content": "Content of Blog Post 1",
    }
    response = client.patch(
        f"{settings.API_VERSION_STR}/blogposts/{blog_post.id}",
        headers=superuser_token_headers,
        json=blog_post_data,
    )
    assert response.status_code == 400
    data = response.json()
    assert data["detail"] == "A blog post with this url already exists"


def test_19_update_blog_post_unauthorized(
    client: TestClient,
    setup_blog_post: BlogPost,
    normal_user_token_headers: dict[str, str],
) -> None:
    blog_post_data = {
        "title": "Updated Blog Post",
        "url": "updated-blog-post",
        "content": "Updated content of Blog Post",
    }
    response = client.patch(
        f"{settings.API_VERSION_STR}/blogposts/{setup_blog_post.id}",
        headers=normal_user_token_headers,
        json=blog_post_data,
    )
    assert response.status_code == 403
    data = response.json()
    assert data["detail"] == "The user does not have admin privileges"


def test_20_delete_blog_post(
    client: TestClient,
    setup_blog_post: BlogPost,
    superuser_token_headers: dict[str, str],
) -> None:
    response = client.delete(
        f"{settings.API_VERSION_STR}/blogposts/{setup_blog_post.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Blog post deleted successfully"
    # Check if the blog post is actually deleted
    response = client.get(f"{settings.API_VERSION_STR}/blogposts/{setup_blog_post.id}")
    assert response.status_code == 404
    data = response.json()
    assert data["detail"] == "Blog post not found"


def test_21_delete_blog_post_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    response = client.delete(
        f"{settings.API_VERSION_STR}/blogposts/999", headers=superuser_token_headers
    )
    assert response.status_code == 404
    data = response.json()
    assert data["detail"] == "Blog post not found"


def test_22_delete_blog_post_unauthorized(
    client: TestClient,
    setup_blog_post: BlogPost,
    normal_user_token_headers: dict[str, str],
) -> None:
    response = client.delete(
        f"{settings.API_VERSION_STR}/blogposts/{setup_blog_post.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 403
    data = response.json()
    assert data["detail"] == "The user does not have admin privileges"


def test_23_delete_blog_post_with_comments(
    client: TestClient,
    setup_blog_post_with_tag_and_comment: BlogPost,
    superuser_token_headers: dict[str, str],
) -> None:
    blog_post, tag, comment = setup_blog_post_with_tag_and_comment
    response = client.delete(
        f"{settings.API_VERSION_STR}/blogposts/{blog_post.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Blog post deleted successfully"
    # Check that the blog post is actually deleted
    response = client.get(f"{settings.API_VERSION_STR}/blogposts/{blog_post.id}")
    assert response.status_code == 404
    data = response.json()
    assert data["detail"] == "Blog post not found"
    # Check that the comment is also deleted
    response = client.get(f"{settings.API_VERSION_STR}/comments/{comment.id}")
    assert response.status_code == 404
    data = response.json()
    assert data["detail"] == "Comment not found"
    # Check that the tag is not deleted
    response = client.get(f"{settings.API_VERSION_STR}/tags/{tag.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == tag.id

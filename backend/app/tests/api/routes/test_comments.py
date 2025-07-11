from fastapi.testclient import TestClient
import pytest
from sqlmodel import Session, delete
from uuid import UUID

from app.core.config import settings
from app.db.crud import BlogPostCRUD, UserCRUD, CommentCRUD
from app.models.models import BlogPost, Comment, User
from app.schemas.blog_post import BlogPostCreate
from app.schemas.comment import CommentCreate
from app.schemas.user import UserCreate


@pytest.fixture(scope="function")
def test_user(db: Session, normal_user_token_headers: dict[str, str]) -> User:
    return UserCRUD(db).get_user_by_email(email=settings.TEST_USER_EMAIL)


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
def setup_comment(db: Session, test_user: User, setup_blog_post: BlogPost) -> Comment:
    comment = CommentCRUD(db).create_comment(
        comment=CommentCreate(content="Test comment"),
        blog_post_id=setup_blog_post.id,
        user_id=test_user.id,
    )
    return comment


@pytest.fixture(scope="function")
def other_user_auth_headers(client: TestClient, db: Session) -> dict[str, str]:
    other_user = UserCRUD(db).create_user(
        user=UserCreate(name="user1", email="user1@email.com", password="password")
    )
    login_data = {
        "username": other_user.email,
        "password": "password",
    }
    response = client.post(
        f"{settings.API_VERSION_STR}/login/access-token", data=login_data
    )
    tokens = response.json()
    access_token = tokens["access_token"]
    return {"Authorization": f"Bearer {access_token}"}


@pytest.fixture(scope="function", autouse=True)
def delete_data(db: Session) -> None:
    db.exec(delete(Comment))
    db.exec(delete(BlogPost))
    db.exec(
        delete(User).where(
            (User.email != settings.FIRST_SUPERUSER_EMAIL)
            & (User.email != settings.TEST_USER_EMAIL)
        )
    )
    db.commit()


def test_01_read_comments_none(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    response = client.get(
        f"{settings.API_VERSION_STR}/comments", headers=superuser_token_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 0
    assert len(data["data"]) == 0


def test_02_read_comments(
    client: TestClient, setup_comment: Comment, superuser_token_headers: dict[str, str]
) -> None:
    response = client.get(
        f"{settings.API_VERSION_STR}/comments", headers=superuser_token_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 1
    assert len(data["data"]) == 1
    assert data["data"][0]["id"] == setup_comment.id
    assert data["data"][0]["content"] == setup_comment.content
    assert data["data"][0]["comment_date"] is not None
    assert data["data"][0]["blog_post_id"] == setup_comment.blog_post_id
    assert data["data"][0]["user_id"] == str(setup_comment.user_id)


def test_03_read_comments_with_skip_and_limit(
    client: TestClient,
    db: Session,
    test_user: User,
    setup_blog_post: BlogPost,
    superuser_token_headers: dict[str, str],
) -> None:
    CommentCRUD(db).create_comment(
        comment=CommentCreate(content="Test comment 1"),
        blog_post_id=setup_blog_post.id,
        user_id=test_user.id,
    )
    comment_2 = CommentCRUD(db).create_comment(
        comment=CommentCreate(content="Test comment 2"),
        blog_post_id=setup_blog_post.id,
        user_id=test_user.id,
    )
    CommentCRUD(db).create_comment(
        comment=CommentCreate(content="Test comment 3"),
        blog_post_id=setup_blog_post.id,
        user_id=test_user.id,
    )
    response = client.get(
        f"{settings.API_VERSION_STR}/comments?skip=1&limit=1",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 3
    assert len(data["data"]) == 1
    assert data["data"][0]["id"] == comment_2.id
    assert data["data"][0]["content"] == comment_2.content
    assert data["data"][0]["comment_date"] is not None
    assert data["data"][0]["blog_post_id"] == comment_2.blog_post_id


def test_04_read_comments_unauthorized(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    response = client.get(
        f"{settings.API_VERSION_STR}/comments", headers=normal_user_token_headers
    )
    assert response.status_code == 403
    data = response.json()
    assert data["detail"] == "The user does not have admin privileges"


def test_05_read_comments_for_blog_post_none(
    client: TestClient, setup_blog_post: BlogPost
) -> None:
    response = client.get(
        f"{settings.API_VERSION_STR}/blogpost/{setup_blog_post.id}/comments"
    )
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 0
    assert len(data["data"]) == 0


def test_06_read_comments_for_blog_post(
    client: TestClient, db: Session, test_user: User, setup_blog_post: BlogPost
) -> None:
    comment_1 = CommentCRUD(db).create_comment(
        comment=CommentCreate(content="Test comment 1"),
        blog_post_id=setup_blog_post.id,
        user_id=test_user.id,
    )
    comment_2 = CommentCRUD(db).create_comment(
        comment=CommentCreate(content="Test comment 2"),
        blog_post_id=setup_blog_post.id,
        user_id=test_user.id,
    )
    response = client.get(
        f"{settings.API_VERSION_STR}/blogpost/{setup_blog_post.id}/comments"
    )
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 2
    assert len(data["data"]) == 2
    assert data["data"][0]["id"] == comment_1.id
    assert data["data"][0]["content"] == comment_1.content
    assert data["data"][0]["comment_date"] is not None
    assert data["data"][0]["blog_post_id"] == comment_1.blog_post_id
    assert data["data"][1]["id"] == comment_2.id
    assert data["data"][1]["content"] == comment_2.content
    assert data["data"][1]["comment_date"] is not None
    assert data["data"][1]["blog_post_id"] == comment_2.blog_post_id
    assert "user_id" not in data["data"][0]
    assert "user_id" not in data["data"][1]


def test_07_read_comments_for_blog_post_not_found(client: TestClient) -> None:
    response = client.get(f"{settings.API_VERSION_STR}/blogpost/999/comments")
    assert response.status_code == 404
    data = response.json()
    assert data["detail"] == "Blog post not found"


def test_08_read_comments_for_user_none(
    client: TestClient, test_user: User, normal_user_token_headers: dict[str, str]
) -> None:
    response = client.get(
        f"{settings.API_VERSION_STR}/user/{test_user.id}/comments",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 0
    assert len(data["data"]) == 0


def test_09_read_comments_for_user(
    client: TestClient,
    db: Session,
    test_user: User,
    setup_blog_post: BlogPost,
    normal_user_token_headers: dict[str, str],
) -> None:
    comment_1 = CommentCRUD(db).create_comment(
        comment=CommentCreate(content="Test comment 1"),
        blog_post_id=setup_blog_post.id,
        user_id=test_user.id,
    )
    comment_2 = CommentCRUD(db).create_comment(
        comment=CommentCreate(content="Test comment 2"),
        blog_post_id=setup_blog_post.id,
        user_id=test_user.id,
    )
    response = client.get(
        f"{settings.API_VERSION_STR}/user/{test_user.id}/comments",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 2
    assert len(data["data"]) == 2
    assert data["data"][0]["id"] == comment_1.id
    assert data["data"][0]["content"] == comment_1.content
    assert data["data"][0]["comment_date"] is not None
    assert data["data"][0]["blog_post_id"] == comment_1.blog_post_id
    assert data["data"][1]["id"] == comment_2.id
    assert data["data"][1]["content"] == comment_2.content
    assert data["data"][1]["comment_date"] is not None
    assert data["data"][1]["blog_post_id"] == comment_2.blog_post_id
    assert "user_id" not in data["data"][0]
    assert "user_id" not in data["data"][1]


def test_10_read_comments_for_user_not_found(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    invalid_user_id = str(UUID(int=0))
    response = client.get(
        f"{settings.API_VERSION_STR}/user/{invalid_user_id}/comments",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 404
    data = response.json()
    assert data["detail"] == "User not found"


def test_11_read_comments_for_user_unauthorized(
    client: TestClient, db: Session, normal_user_token_headers: dict[str, str]
) -> None:
    user = UserCRUD(db).create_user(
        user=UserCreate(name="user1", email="user1@email.com", password="password")
    )
    response = client.get(
        f"{settings.API_VERSION_STR}/user/{user.id}/comments",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 403
    data = response.json()
    assert data["detail"] == "No permission to view this user's comments"


def test_12_read_comments_for_user_with_superuser(
    client: TestClient,
    test_user: User,
    setup_comment: Comment,
    superuser_token_headers: dict[str, str],
) -> None:
    response = client.get(
        f"{settings.API_VERSION_STR}/user/{test_user.id}/comments",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 1
    assert len(data["data"]) == 1


def test_13_read_my_comments(
    client: TestClient,
    test_user: User,
    setup_comment: Comment,
    normal_user_token_headers: dict[str, str],
) -> None:
    response = client.get(
        f"{settings.API_VERSION_STR}/me/comments", headers=normal_user_token_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 1
    assert len(data["data"]) == 1
    assert data["data"][0]["id"] == setup_comment.id
    assert data["data"][0]["content"] == setup_comment.content
    assert data["data"][0]["comment_date"] is not None
    assert data["data"][0]["blog_post_id"] == setup_comment.blog_post_id
    assert data["data"][0]["user_id"] == str(test_user.id)


def test_14_read_my_comments_unauthorized(client: TestClient) -> None:
    response = client.get(
        f"{settings.API_VERSION_STR}/me/comments",
        headers={"Authorization": "Bearer invalid_token"},
    )
    assert response.status_code == 401
    data = response.json()
    assert data["detail"] == "Could not validate credentials"


def test_15_read_comment(client: TestClient, setup_comment: Comment) -> None:
    response = client.get(f"{settings.API_VERSION_STR}/comments/{setup_comment.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == setup_comment.id
    assert data["content"] == setup_comment.content
    assert data["comment_date"] is not None
    assert data["blog_post_id"] == setup_comment.blog_post_id
    assert data["username"] == setup_comment.user.name
    assert "user_id" not in data


def test_16_read_comment_not_found(client: TestClient) -> None:
    response = client.get(f"{settings.API_VERSION_STR}/comments/999")
    assert response.status_code == 404
    data = response.json()
    assert data["detail"] == "Comment not found"


def test_17_create_comment(
    client: TestClient,
    test_user: User,
    setup_blog_post: BlogPost,
    normal_user_token_headers: dict[str, str],
) -> None:
    comment_data = {"content": "Test comment"}
    response = client.post(
        f"{settings.API_VERSION_STR}/blogpost/{setup_blog_post.id}/comments",
        headers=normal_user_token_headers,
        json=comment_data,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["content"] == "Test comment"
    assert data["comment_date"] is not None
    assert data["blog_post_id"] == setup_blog_post.id
    assert data["username"] == test_user.name
    assert data["id"] is not None
    assert "user_id" not in data


def test_18_create_comment_blogpost_not_found(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    comment_data = {"content": "Test comment"}
    response = client.post(
        f"{settings.API_VERSION_STR}/blogpost/999/comments",
        headers=normal_user_token_headers,
        json=comment_data,
    )
    assert response.status_code == 404
    data = response.json()
    assert data["detail"] == "Blog post not found"


def test_19_create_comment_unauthorized(
    client: TestClient, setup_blog_post: BlogPost
) -> None:
    comment_data = {"content": "Test comment"}
    response = client.post(
        f"{settings.API_VERSION_STR}/blogpost/{setup_blog_post.id}/comments",
        headers={"Authorization": "Bearer invalid_token"},
        json=comment_data,
    )
    assert response.status_code == 401
    data = response.json()
    assert data["detail"] == "Could not validate credentials"


def test_20_create_comment_invalid_data(
    client: TestClient,
    setup_blog_post: BlogPost,
    normal_user_token_headers: dict[str, str],
) -> None:
    comment_data = {"content": ""}
    response = client.post(
        f"{settings.API_VERSION_STR}/blogpost/{setup_blog_post.id}/comments",
        headers=normal_user_token_headers,
        json=comment_data,
    )
    assert response.status_code == 422
    data = response.json()
    assert "message" in data
    assert data["message"] == "Content: String should have at least 1 character"


def test_21_update_comment_on_blog_post(
    client: TestClient,
    setup_comment: Comment,
    normal_user_token_headers: dict[str, str],
) -> None:
    updated_comment_data = {"content": "Updated comment"}
    response = client.patch(
        f"{settings.API_VERSION_STR}/blogpost/{setup_comment.blog_post_id}/comments/{setup_comment.id}",
        headers=normal_user_token_headers,
        json=updated_comment_data,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == setup_comment.id
    assert data["content"] == updated_comment_data["content"]
    assert data["comment_date"] is not None
    assert data["blog_post_id"] == setup_comment.blog_post_id
    assert data["user_id"] == str(setup_comment.user.id)


def test_22_update_comment_on_blog_post_blogpost_not_found(
    client: TestClient,
    setup_comment: Comment,
    normal_user_token_headers: dict[str, str],
) -> None:
    updated_comment_data = {"content": "Updated comment"}
    response = client.patch(
        f"{settings.API_VERSION_STR}/blogpost/999/comments/{setup_comment.id}",
        headers=normal_user_token_headers,
        json=updated_comment_data,
    )
    assert response.status_code == 404
    data = response.json()
    assert data["detail"] == "Blog post not found"


def test_23_update_comment_on_blog_post_comment_not_found(
    client: TestClient,
    setup_comment: Comment,
    normal_user_token_headers: dict[str, str],
) -> None:
    updated_comment_data = {"content": "Updated comment"}
    response = client.patch(
        f"{settings.API_VERSION_STR}/blogpost/{setup_comment.blog_post_id}/comments/999",
        headers=normal_user_token_headers,
        json=updated_comment_data,
    )
    assert response.status_code == 404
    data = response.json()
    assert data["detail"] == "Comment not found"


def test_24_update_comment_on_blog_post_unauthorized(
    client: TestClient, setup_comment: Comment
) -> None:
    updated_comment_data = {"content": "Updated comment"}
    response = client.patch(
        f"{settings.API_VERSION_STR}/blogpost/{setup_comment.blog_post_id}/comments/{setup_comment.id}",
        headers={"Authorization": "Bearer invalid_token"},
        json=updated_comment_data,
    )
    assert response.status_code == 401
    data = response.json()
    assert data["detail"] == "Could not validate credentials"


def test_25_update_comment_on_blog_post_not_owner(
    client: TestClient, setup_comment: Comment, other_user_auth_headers: dict[str, str]
) -> None:
    updated_comment_data = {"content": "Updated comment"}
    response = client.patch(
        f"{settings.API_VERSION_STR}/blogpost/{setup_comment.blog_post_id}/comments/{setup_comment.id}",
        headers=other_user_auth_headers,
        json=updated_comment_data,
    )
    assert response.status_code == 403
    data = response.json()
    assert data["detail"] == "No permission to update this comment"


def test_26_update_comment_on_blog_post_different_blog_post(
    client: TestClient,
    db: Session,
    setup_comment: Comment,
    normal_user_token_headers: dict[str, str],
) -> None:
    other_blog_post = BlogPostCRUD(db).create_blog_post(
        blog_post=BlogPostCreate(
            title="Blog Post Other",
            url="blog-post-other",
            content="Content of Blog Post Other",
            image_path="image.png",
            tags=[],
        )
    )
    updated_comment_data = {"content": "Updated comment"}
    response = client.patch(
        f"{settings.API_VERSION_STR}/blogpost/{other_blog_post.id}/comments/{setup_comment.id}",
        headers=normal_user_token_headers,
        json=updated_comment_data,
    )
    assert response.status_code == 400
    data = response.json()
    assert data["detail"] == "Comment does not belong to this blog post"


def test_27_update_comment_on_blog_post_invalid_data(
    client: TestClient,
    setup_comment: Comment,
    normal_user_token_headers: dict[str, str],
) -> None:
    updated_comment_data = {"content": ""}
    response = client.patch(
        f"{settings.API_VERSION_STR}/blogpost/{setup_comment.blog_post_id}/comments/{setup_comment.id}",
        headers=normal_user_token_headers,
        json=updated_comment_data,
    )
    assert response.status_code == 422
    data = response.json()
    assert "message" in data
    assert data["message"] == "Content: String should have at least 1 character"


def test_28_delete_comment_on_blog_post(
    client: TestClient,
    setup_comment: Comment,
    normal_user_token_headers: dict[str, str],
) -> None:
    response = client.delete(
        f"{settings.API_VERSION_STR}/blogpost/{setup_comment.blog_post_id}/comments/{setup_comment.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Comment deleted successfully"


def test_29_delete_comment_on_blog_post_blogpost_not_found(
    client: TestClient,
    setup_comment: Comment,
    normal_user_token_headers: dict[str, str],
) -> None:
    response = client.delete(
        f"{settings.API_VERSION_STR}/blogpost/999/comments/{setup_comment.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 404
    data = response.json()
    assert data["detail"] == "Blog post not found"


def test_30_delete_comment_on_blog_post_comment_not_found(
    client: TestClient,
    setup_comment: Comment,
    normal_user_token_headers: dict[str, str],
) -> None:
    response = client.delete(
        f"{settings.API_VERSION_STR}/blogpost/{setup_comment.blog_post_id}/comments/999",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 404
    data = response.json()
    assert data["detail"] == "Comment not found"


def test_31_delete_comment_on_blog_post_unauthorized(
    client: TestClient, setup_comment: Comment
) -> None:
    response = client.delete(
        f"{settings.API_VERSION_STR}/blogpost/{setup_comment.blog_post_id}/comments/{setup_comment.id}",
        headers={"Authorization": "Bearer invalid_token"},
    )
    assert response.status_code == 401
    data = response.json()
    assert data["detail"] == "Could not validate credentials"


def test_32_delete_comment_on_blog_post_not_owner(
    client: TestClient, setup_comment: Comment, other_user_auth_headers: dict[str, str]
) -> None:
    response = client.delete(
        f"{settings.API_VERSION_STR}/blogpost/{setup_comment.blog_post_id}/comments/{setup_comment.id}",
        headers=other_user_auth_headers,
    )
    assert response.status_code == 403
    data = response.json()
    assert data["detail"] == "No permission to delete this comment"


def test_33_delete_comment_on_blog_post_different_blog_post(
    client: TestClient,
    db: Session,
    setup_comment: Comment,
    normal_user_token_headers: dict[str, str],
) -> None:
    other_blog_post = BlogPostCRUD(db).create_blog_post(
        blog_post=BlogPostCreate(
            title="Blog Post Other",
            url="blog-post-other",
            content="Content of Blog Post Other",
            image_path="image.png",
            tags=[],
        )
    )
    response = client.delete(
        f"{settings.API_VERSION_STR}/blogpost/{other_blog_post.id}/comments/{setup_comment.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 400
    data = response.json()
    assert data["detail"] == "Comment does not belong to this blog post"


def test_34_delete_comment_on_blog_post_superuser(
    client: TestClient, setup_comment: Comment, superuser_token_headers: dict[str, str]
) -> None:
    response = client.delete(
        f"{settings.API_VERSION_STR}/blogpost/{setup_comment.blog_post_id}/comments/{setup_comment.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Comment deleted successfully"


def test_35_delete_comment(
    client: TestClient,
    setup_comment: Comment,
    normal_user_token_headers: dict[str, str],
) -> None:
    response = client.delete(
        f"{settings.API_VERSION_STR}/comments/{setup_comment.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Comment deleted successfully"


def test_36_delete_comment_not_found(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    response = client.delete(
        f"{settings.API_VERSION_STR}/comments/999", headers=normal_user_token_headers
    )
    assert response.status_code == 404
    data = response.json()
    assert data["detail"] == "Comment not found"


def test_37_delete_comment_unauthorized(
    client: TestClient, setup_comment: Comment
) -> None:
    response = client.delete(
        f"{settings.API_VERSION_STR}/comments/{setup_comment.id}",
        headers={"Authorization": "Bearer invalid_token"},
    )
    assert response.status_code == 401
    data = response.json()
    assert data["detail"] == "Could not validate credentials"


def test_38_delete_comment_not_owner(
    client: TestClient, setup_comment: Comment, other_user_auth_headers: dict[str, str]
) -> None:
    response = client.delete(
        f"{settings.API_VERSION_STR}/comments/{setup_comment.id}",
        headers=other_user_auth_headers,
    )
    assert response.status_code == 403
    data = response.json()
    assert data["detail"] == "No permission to delete this comment"


def test_39_delete_comment_superuser(
    client: TestClient, setup_comment: Comment, superuser_token_headers: dict[str, str]
) -> None:
    response = client.delete(
        f"{settings.API_VERSION_STR}/comments/{setup_comment.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Comment deleted successfully"

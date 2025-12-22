from fastapi.testclient import TestClient
import pytest
from sqlmodel import Session, delete

from app.core.config import settings
from app.db.crud import BlogPostCRUD
from app.models.models import BlogPost
from app.schemas.blog_post import BlogPostCreate


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


@pytest.fixture(scope="function", autouse=True)
def delete_data(db: Session) -> None:
    db.exec(delete(BlogPost))
    db.commit()


def test_01_get_sitemap_xml(client: TestClient, setup_blog_post: BlogPost) -> None:
    response = client.get(f"{settings.API_VERSION_STR}/sitemap.xml")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/xml"
    xml_content = response.text
    assert '<?xml version="1.0" encoding="UTF-8"?>' in xml_content
    assert "<urlset" in xml_content
    assert f"<loc>{settings.FRONTEND_HOST}/</loc>" in xml_content
    assert f"<loc>{settings.FRONTEND_HOST}/articles</loc>" in xml_content
    assert f"<loc>{settings.FRONTEND_HOST}/about</loc>" in xml_content
    assert f"<loc>{settings.FRONTEND_HOST}/signup</loc>" in xml_content
    assert f"<loc>{settings.FRONTEND_HOST}/login</loc>" in xml_content
    assert f"<loc>{settings.FRONTEND_HOST}/articles/blog-post-1</loc>" in xml_content
    assert "</urlset>" in xml_content


def test_02_get_sitemap_xml_no_blog_posts(client: TestClient) -> None:
    response = client.get(f"{settings.API_VERSION_STR}/sitemap.xml")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/xml"
    xml_content = response.text
    assert '<?xml version="1.0" encoding="UTF-8"?>' in xml_content
    assert "<urlset" in xml_content
    assert f"<loc>{settings.FRONTEND_HOST}/</loc>" in xml_content
    assert f"<loc>{settings.FRONTEND_HOST}/articles</loc>" in xml_content
    assert f"<loc>{settings.FRONTEND_HOST}/about</loc>" in xml_content
    assert f"<loc>{settings.FRONTEND_HOST}/signup</loc>" in xml_content
    assert f"<loc>{settings.FRONTEND_HOST}/login</loc>" in xml_content
    # No blog post URLs should be present
    assert f"<loc>{settings.FRONTEND_HOST}/articles/" not in xml_content
    assert "</urlset>" in xml_content

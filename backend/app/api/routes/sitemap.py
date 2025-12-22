from fastapi import APIRouter, Response

from app.api.deps import SessionDep
from app.core.config import settings
from app.db.crud import BlogPostCRUD


router = APIRouter(tags=["sitemap"])


@router.get("/sitemap.xml", response_class=Response)
def get_sitemap(session: SessionDep) -> Response:
    """
    Generate dynamic sitemap.xml with all published blog posts.
    """
    # Get all blog posts
    _, blog_posts = BlogPostCRUD(session).read_blog_posts(skip=0, limit=10000)

    # Build sitemap XML
    xml_content = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml_content += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'

    # Homepage
    xml_content += "  <url>\n"
    xml_content += f"    <loc>{settings.FRONTEND_HOST}/</loc>\n"
    xml_content += "    <changefreq>monthly</changefreq>\n"
    xml_content += "    <priority>1.0</priority>\n"
    xml_content += "  </url>\n"

    # Articles page
    xml_content += "  <url>\n"
    xml_content += f"    <loc>{settings.FRONTEND_HOST}/articles</loc>\n"
    xml_content += "    <changefreq>monthly</changefreq>\n"
    xml_content += "    <priority>0.9</priority>\n"
    xml_content += "  </url>\n"

    # About page
    xml_content += "  <url>\n"
    xml_content += f"    <loc>{settings.FRONTEND_HOST}/about</loc>\n"
    xml_content += "    <changefreq>yearly</changefreq>\n"
    xml_content += "    <priority>0.8</priority>\n"
    xml_content += "  </url>\n"

    # Signup page
    xml_content += "  <url>\n"
    xml_content += f"    <loc>{settings.FRONTEND_HOST}/signup</loc>\n"
    xml_content += "    <changefreq>yearly</changefreq>\n"
    xml_content += "    <priority>0.2</priority>\n"
    xml_content += "  </url>\n"

    # Login page
    xml_content += "  <url>\n"
    xml_content += f"    <loc>{settings.FRONTEND_HOST}/login</loc>\n"
    xml_content += "    <changefreq>yearly</changefreq>\n"
    xml_content += "    <priority>0.2</priority>\n"
    xml_content += "  </url>\n"

    # Blog post URLs
    for post in blog_posts:
        xml_content += "  <url>\n"
        xml_content += f"    <loc>{settings.FRONTEND_HOST}/articles/{post.url}</loc>\n"
        xml_content += (
            f"    <lastmod>{post.publication_date.strftime('%Y-%m-%d')}</lastmod>\n"
        )
        xml_content += "    <changefreq>monthly</changefreq>\n"
        xml_content += "    <priority>0.9</priority>\n"
        xml_content += "  </url>\n"

    xml_content += "</urlset>"

    return Response(content=xml_content, media_type="application/xml")

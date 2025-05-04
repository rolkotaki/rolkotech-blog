from fastapi import APIRouter

from app.api.routes import blog_posts
from app.api.routes import comments
from app.api.routes import login
from app.api.routes import tags
from app.api.routes import users


api_router = APIRouter()
api_router.include_router(blog_posts.router)
api_router.include_router(comments.router)
api_router.include_router(login.router)
api_router.include_router(tags.router)
api_router.include_router(users.router)

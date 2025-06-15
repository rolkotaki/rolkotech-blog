from fastapi import HTTPException, status
from sqlalchemy.orm import joinedload, selectinload
from sqlmodel import Session, select, func
from typing import Any
import uuid

from app.core.security import get_password_hash
from app.models.models import User, Tag, BlogPost, Comment
from app.schemas.blog_post import BlogPostCreate, BlogPostUpdate
from app.schemas.comment import CommentCreate, CommentUpdate
from app.schemas.tag import TagCreate, TagUpdate
from app.schemas.user import UserCreate, UserUpdate, UserUpdateMe, UserRegister


class BaseCRUD:
    MODEL_CLASS = None

    def __init__(self, db: Session):
        self.session = db

    def _create(self, object: Any) -> Any:
        object = self.MODEL_CLASS.model_validate(object, from_attributes=True)
        self.session.add(object)
        self.session.commit()
        self.session.refresh(object)
        return object

    def _read(self, skip: int, limit: int) -> tuple[int, list[Any]]:
        count_statement = select(func.count()).select_from(self.MODEL_CLASS)
        count = self.session.exec(count_statement).one()

        statement = select(self.MODEL_CLASS).offset(skip).limit(limit)
        objects = self.session.exec(statement).all()

        return count, objects

    def _update(
        self, object_db: Any, object_in: Any, force_update_of_cols: list[str] = ()
    ) -> Any:
        object_data = object_in.model_dump(exclude_unset=True)
        object_db.sqlmodel_update(object_data)
        # Force update of specific columns
        for col in force_update_of_cols:
            setattr(object_db, col, getattr(object_in, col, None))
        self.session.add(object_db)
        self.session.commit()
        self.session.refresh(object_db)
        return object_db

    def _delete(self, object_db: Any) -> None:
        self.session.delete(object_db)
        self.session.commit()


class UserCRUD(BaseCRUD):
    MODEL_CLASS = User

    def create_user(self, user: UserCreate | UserRegister) -> User:
        user = self.MODEL_CLASS.model_validate(
            user,
            update={"password": get_password_hash(user.password.get_secret_value())},
        )
        self.session.add(user)
        self.session.commit()
        self.session.refresh(user)
        return user

    def read_users(self, skip: int, limit: int) -> tuple[int, list[User]]:
        return self._read(skip, limit)

    def get_user_by_email(self, email: str) -> User | None:
        statement = select(self.MODEL_CLASS).where(self.MODEL_CLASS.email == email)
        user = self.session.exec(statement).first()
        return user

    def get_user_by_name(self, username: str) -> User | None:
        statement = select(self.MODEL_CLASS).where(self.MODEL_CLASS.name == username)
        user = self.session.exec(statement).first()
        return user

    def update_user(self, user_db: User, user_in: UserUpdate | UserUpdateMe) -> User:
        user_data = user_in.model_dump(exclude_unset=True)
        if "password" in user_data:
            hashed_password = get_password_hash(
                user_data["password"].get_secret_value()
            )
            user_data["password"] = hashed_password
        user_db.sqlmodel_update(user_data)
        self.session.add(user_db)
        self.session.commit()
        self.session.refresh(user_db)
        return user_db

    def delete_user(self, user_db: User) -> None:
        self._delete(user_db)


class TagCRUD(BaseCRUD):
    MODEL_CLASS = Tag

    def create_tag(self, tag: TagCreate) -> Tag:
        return self._create(tag)

    def read_tags(self, skip: int, limit: int) -> tuple[int, list[Tag]]:
        return self._read(skip, limit)

    def read_tag_with_blog_posts(self, tag_id: int) -> Tag:
        statement = (
            select(self.MODEL_CLASS)
            .options(joinedload(self.MODEL_CLASS.blog_posts))
            .where(self.MODEL_CLASS.id == tag_id)
        )
        tag = self.session.exec(statement).first()
        return tag

    def get_tag_by_name(self, tag_name: str) -> Tag | None:
        statement = select(self.MODEL_CLASS).where(self.MODEL_CLASS.name == tag_name)
        tag = self.session.exec(statement).first()
        return tag

    def update_tag(self, tag_db: Tag, tag_in: TagUpdate) -> Tag:
        return self._update(tag_db, tag_in)

    def delete_tag(self, tag_db: Tag) -> None:
        self._delete(tag_db)


class BlogPostCRUD(BaseCRUD):
    MODEL_CLASS = BlogPost

    def create_blog_post(self, blog_post: BlogPostCreate) -> BlogPost:
        tags = []
        if blog_post.tags:
            for tag_id in blog_post.tags:
                tag = self.session.get(Tag, tag_id)
                if not tag:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Tag with ID {tag_id} not found",
                    )
                tags.append(tag)
        blog_post.tags = tags
        return self._create(blog_post)

    def read_blog_posts(self, skip: int, limit: int) -> tuple[int, list[BlogPost]]:
        count_statement = select(func.count()).select_from(self.MODEL_CLASS)
        count = self.session.exec(count_statement).one()

        statement = (
            select(self.MODEL_CLASS)
            .options(selectinload(self.MODEL_CLASS.tags))
            .offset(skip)
            .limit(limit)
        )
        blog_posts = self.session.exec(statement).all()

        return count, blog_posts

    def read_blog_post_with_comments_and_tags(self, blog_post_id: int) -> BlogPost:
        statement = (
            select(self.MODEL_CLASS)
            .options(
                joinedload(self.MODEL_CLASS.comments), joinedload(self.MODEL_CLASS.tags)
            )
            .where(self.MODEL_CLASS.id == blog_post_id)
        )
        blog_post = self.session.exec(statement).first()
        return blog_post

    def get_blog_post_by_title(self, blog_title: str) -> BlogPost | None:
        statement = select(self.MODEL_CLASS).where(self.MODEL_CLASS.title == blog_title)
        blog_post = self.session.exec(statement).first()
        return blog_post

    def get_blog_post_by_url(self, blog_url: str) -> BlogPost | None:
        statement = select(self.MODEL_CLASS).where(self.MODEL_CLASS.url == blog_url)
        blog_post = self.session.exec(statement).first()
        return blog_post

    def update_blog_post(
        self, blog_post_db: BlogPost, blog_post_in: BlogPostUpdate
    ) -> BlogPost:
        if blog_post_in.tags is not None:
            tags = []
            if blog_post_in.tags:
                for tag_id in blog_post_in.tags:
                    tag = self.session.get(Tag, tag_id)
                    if not tag:
                        raise HTTPException(
                            status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Tag with ID {tag_id} not found",
                        )
                    tags.append(tag)
            blog_post_in.tags = tags

        blog_post_data = blog_post_in.model_dump(exclude_unset=True, exclude=["tags"])
        blog_post_db.sqlmodel_update(blog_post_data)
        if blog_post_in.tags is not None:
            blog_post_db.tags = blog_post_in.tags
        self.session.add(blog_post_db)
        self.session.commit()
        self.session.refresh(blog_post_db)
        return blog_post_db

    def delete_blog_post(self, blog_post_db: BlogPost) -> None:
        self._delete(blog_post_db)


class CommentCRUD(BaseCRUD):
    MODEL_CLASS = Comment

    def create_comment(
        self, comment: CommentCreate, user_id: uuid.UUID, blog_post_id: int
    ) -> Comment:
        comment = Comment.model_validate(
            comment, update={"user_id": user_id, "blog_post_id": blog_post_id}
        )
        self.session.add(comment)
        self.session.commit()
        self.session.refresh(comment)
        return comment

    def read_comments(self, skip: int, limit: int) -> tuple[int, list[Comment]]:
        return self._read(skip, limit)

    def read_comments_with_username(
        self, skip: int, limit: int
    ) -> tuple[int, list[Comment]]:
        count_statement = select(func.count()).select_from(self.MODEL_CLASS)
        count = self.session.exec(count_statement).one()

        statement = (
            select(self.MODEL_CLASS)
            .options(joinedload(self.MODEL_CLASS.user))
            .offset(skip)
            .limit(limit)
        )
        comments = self.session.exec(statement).all()

        return count, comments

    def read_comments_for_blog_post(
        self, blog_post_id: int, skip: int, limit: int
    ) -> tuple[int, list[Comment]]:
        count_statement = select(func.count()).select_from(self.MODEL_CLASS)
        count = self.session.exec(count_statement).one()

        statement = (
            select(self.MODEL_CLASS)
            .where(self.MODEL_CLASS.blog_post_id == blog_post_id)
            .offset(skip)
            .limit(limit)
        )
        objects = self.session.exec(statement).all()

        return count, objects

    def read_comments_for_user(
        self, user_id: uuid.UUID, skip: int, limit: int
    ) -> tuple[int, list[Comment]]:
        count_statement = select(func.count()).select_from(self.MODEL_CLASS)
        count = self.session.exec(count_statement).one()

        statement = (
            select(self.MODEL_CLASS)
            .where(self.MODEL_CLASS.user_id == user_id)
            .offset(skip)
            .limit(limit)
        )
        objects = self.session.exec(statement).all()

        return count, objects

    def update_comment(self, comment_db: Comment, comment_in: CommentUpdate) -> Comment:
        return self._update(
            comment_db, comment_in, force_update_of_cols=["comment_date"]
        )

    def delete_comment(self, comment: Comment) -> None:
        self._delete(comment)

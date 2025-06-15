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
    """
    Base CRUD class that provides common CRUD operations for SQLModel models.
    Subclasses should define the `MODEL_CLASS` attribute to specify the model they operate on.
    """

    MODEL_CLASS = None

    def __init__(self, db: Session):
        self.session = db

    def _create(self, object: Any) -> Any:
        """
        Create a new object in the database.
        """
        object = self.MODEL_CLASS.model_validate(object, from_attributes=True)
        self.session.add(object)
        self.session.commit()
        self.session.refresh(object)
        return object

    def _read(self, skip: int, limit: int) -> tuple[int, list[Any]]:
        """
        Read objects from the database with pagination.
        """
        count_statement = select(func.count()).select_from(self.MODEL_CLASS)
        count = self.session.exec(count_statement).one()

        statement = select(self.MODEL_CLASS).offset(skip).limit(limit)
        objects = self.session.exec(statement).all()

        return count, objects

    def _update(
        self, object_db: Any, object_in: Any, force_update_of_cols: list[str] = ()
    ) -> Any:
        """
        Update an existing object in the database.
        If `force_update_of_cols` is provided, those columns will be updated regardless of whether they are set in `object_in`.
        """
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
        """
        Delete an object from the database.
        """
        self.session.delete(object_db)
        self.session.commit()


class UserCRUD(BaseCRUD):
    MODEL_CLASS = User

    def create_user(self, user: UserCreate | UserRegister) -> User:
        """
        Create a new user and saved it to the database.
        """
        user = self.MODEL_CLASS.model_validate(
            user,
            update={"password": get_password_hash(user.password.get_secret_value())},
        )
        self.session.add(user)
        self.session.commit()
        self.session.refresh(user)
        return user

    def read_users(self, skip: int, limit: int) -> tuple[int, list[User]]:
        """
        Read users from the database with pagination.
        """
        return self._read(skip, limit)

    def get_user_by_email(self, email: str) -> User | None:
        """
        Get a user by their email address.
        """
        statement = select(self.MODEL_CLASS).where(self.MODEL_CLASS.email == email)
        user = self.session.exec(statement).first()
        return user

    def get_user_by_name(self, username: str) -> User | None:
        """
        Get a user by their username.
        """
        statement = select(self.MODEL_CLASS).where(self.MODEL_CLASS.name == username)
        user = self.session.exec(statement).first()
        return user

    def update_user(self, user_db: User, user_in: UserUpdate | UserUpdateMe) -> User:
        """
        Update an existing user in the database.
        If the user is updating their own profile, they can only change their name and email.
        """
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
        """
        Delete a user from the database.
        """
        self._delete(user_db)


class TagCRUD(BaseCRUD):
    MODEL_CLASS = Tag

    def create_tag(self, tag: TagCreate) -> Tag:
        """
        Create a new tag and save it to the database.
        """
        return self._create(tag)

    def read_tags(self, skip: int, limit: int) -> tuple[int, list[Tag]]:
        """
        Read tags from the database with pagination.
        """
        return self._read(skip, limit)

    def read_tag_with_blog_posts(self, tag_id: int) -> Tag:
        """
        Read a tag by its ID and include its associated blog posts.
        """
        statement = (
            select(self.MODEL_CLASS)
            .options(joinedload(self.MODEL_CLASS.blog_posts))
            .where(self.MODEL_CLASS.id == tag_id)
        )
        tag = self.session.exec(statement).first()
        return tag

    def get_tag_by_name(self, tag_name: str) -> Tag | None:
        """
        Get a tag by its name.
        """
        statement = select(self.MODEL_CLASS).where(self.MODEL_CLASS.name == tag_name)
        tag = self.session.exec(statement).first()
        return tag

    def update_tag(self, tag_db: Tag, tag_in: TagUpdate) -> Tag:
        """
        Update an existing tag in the database.
        """
        return self._update(tag_db, tag_in)

    def delete_tag(self, tag_db: Tag) -> None:
        """
        Delete a tag from the database.
        """
        self._delete(tag_db)


class BlogPostCRUD(BaseCRUD):
    MODEL_CLASS = BlogPost

    def create_blog_post(self, blog_post: BlogPostCreate) -> BlogPost:
        """
        Create a new blog post and save it to the database.
        """
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
        """
        Read blog posts from the database with pagination.
        """
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
        """
        Read a blog post by its ID and include its associated comments and tags.
        """
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
        """
        Get a blog post by its title.
        """
        statement = select(self.MODEL_CLASS).where(self.MODEL_CLASS.title == blog_title)
        blog_post = self.session.exec(statement).first()
        return blog_post

    def get_blog_post_by_url(self, blog_url: str) -> BlogPost | None:
        """
        Get a blog post by its URL.
        """
        statement = select(self.MODEL_CLASS).where(self.MODEL_CLASS.url == blog_url)
        blog_post = self.session.exec(statement).first()
        return blog_post

    def update_blog_post(
        self, blog_post_db: BlogPost, blog_post_in: BlogPostUpdate
    ) -> BlogPost:
        """
        Update an existing blog post in the database.
        """
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
        """
        Delete a blog post from the database.
        """
        self._delete(blog_post_db)


class CommentCRUD(BaseCRUD):
    MODEL_CLASS = Comment

    def create_comment(
        self, comment: CommentCreate, user_id: uuid.UUID, blog_post_id: int
    ) -> Comment:
        """
        Create a new comment on a blog post and save it to the database.
        """
        comment = Comment.model_validate(
            comment, update={"user_id": user_id, "blog_post_id": blog_post_id}
        )
        self.session.add(comment)
        self.session.commit()
        self.session.refresh(comment)
        return comment

    def read_comments(self, skip: int, limit: int) -> tuple[int, list[Comment]]:
        """
        Read comments from the database with pagination.
        """
        return self._read(skip, limit)

    def read_comments_with_username(
        self, skip: int, limit: int
    ) -> tuple[int, list[Comment]]:
        """
        Read comments from the database with pagination and include the username of the user who wrote the comment.
        """
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
        """
        Read comments for a specific blog post with pagination.
        """
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
        """
        Read comments made by a specific user with pagination.
        """
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
        """
        Update an existing comment in the database.
        """
        return self._update(
            comment_db, comment_in, force_update_of_cols=["comment_date"]
        )

    def delete_comment(self, comment: Comment) -> None:
        """
        Delete a comment from the database.
        """
        self._delete(comment)

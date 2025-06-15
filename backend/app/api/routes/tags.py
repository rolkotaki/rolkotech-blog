from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import SessionDep, get_current_active_superuser
from app.db.crud import TagCRUD
from app.models.models import Tag
from app.schemas.blog_post import BlogPostPublic, BlogPostsByTag
from app.schemas.message import Message
from app.schemas.tag import TagPublic, TagCreate, TagUpdate, TagsPublic


router = APIRouter(prefix="/tags", tags=["tags"])


@router.get("/", response_model=TagsPublic)
def read_tags(session: SessionDep, skip: int = 0, limit: int = 100) -> TagsPublic:
    """
    Retrieve tags.
    """
    count, tags = TagCRUD(session).read_tags(skip=skip, limit=limit)
    # Convert Tag models to TagPublic models
    tags = [TagPublic.model_validate(tag, from_attributes=True) for tag in tags]
    return TagsPublic(data=tags, count=count)


@router.get("/{id}", response_model=TagPublic)
def read_tag(session: SessionDep, id: int) -> TagPublic:
    """
    Get tag by ID.
    """
    tag = session.get(Tag, id)
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found"
        )
    return tag


@router.get("/{id}/blogposts", response_model=BlogPostsByTag)
def read_tag_with_blog_posts(session: SessionDep, id: int) -> BlogPostsByTag:
    """
    Get tag by ID with its blog posts.
    """
    tag = TagCRUD(session).read_tag_with_blog_posts(tag_id=id)
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found"
        )

    blog_posts = [
        BlogPostPublic.model_validate(blog_post, from_attributes=True)
        for blog_post in tag.blog_posts
    ]

    return BlogPostsByTag(id=tag.id, name=tag.name, blog_posts=blog_posts)


@router.post(
    "/", dependencies=[Depends(get_current_active_superuser)], response_model=TagPublic
)
def create_tag(session: SessionDep, tag_in: TagCreate) -> TagPublic:
    """
    Create new tag.
    """
    tag_crud = TagCRUD(session)
    tag = tag_crud.get_tag_by_name(tag_name=tag_in.name)
    if tag:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A tag with this name already exists",
        )
    tag = tag_crud.create_tag(tag=tag_in)
    return tag


@router.patch(
    "/{id}",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=TagPublic,
)
def update_tag(session: SessionDep, id: int, tag_in: TagUpdate) -> TagPublic:
    """
    Update a tag.
    """
    tag = session.get(Tag, id)
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found"
        )
    tag_crud = TagCRUD(session)
    if tag.name != tag_in.name and tag_crud.get_tag_by_name(tag_name=tag_in.name):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A tag with this name already exists",
        )
    db_tag = tag_crud.update_tag(tag_db=tag, tag_in=tag_in)
    return db_tag


@router.delete(
    "/{id}",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=Message,
)
def delete_tag(session: SessionDep, id: int) -> Message:
    """
    Delete a tag.
    """
    tag = session.get(Tag, id)
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found"
        )
    TagCRUD(session).delete_tag(tag_db=tag)
    return Message(message="Tag deleted successfully")

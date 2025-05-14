from pydantic import BaseModel, Field


class TagBase(BaseModel):
    name: str = Field(min_length=1, max_length=50)


class TagCreate(TagBase):
    pass


class TagPublic(TagBase):
    id: int


class TagsPublic(BaseModel):
    data: list[TagPublic]
    count: int


class TagUpdate(TagBase):
    pass

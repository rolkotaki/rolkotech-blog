from datetime import datetime
from pydantic import BaseModel


class ImageBase(BaseModel):
    filename: str
    size: int
    url: str


class ImageResponse(ImageBase):
    pass


class Image(ImageBase):
    upload_date: datetime


class Images(BaseModel):
    data: list[Image]
    count: int

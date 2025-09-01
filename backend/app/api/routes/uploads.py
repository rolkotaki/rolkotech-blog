from datetime import datetime
from fastapi import APIRouter, File, UploadFile, HTTPException, Depends, status
from pathlib import Path

from app.api.deps import get_current_active_superuser
from app.core.config import settings
from app.schemas.image import ImageResponse, Image, Images
from app.schemas.message import Message


router = APIRouter(prefix="/uploads", tags=["uploads"])

# Create uploads directory if it doesn't exist
(settings.STATIC_UPLOAD_DIR / settings.BLOGPOST_IMAGE_UPLOAD_DIR).mkdir(
    parents=True, exist_ok=True
)


@router.post(
    "/images",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=ImageResponse,
)
async def upload_image(file: UploadFile = File(...)) -> ImageResponse:
    """
    Upload an image with admin privilege.
    """
    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="File must be an image"
        )

    # Validate file extension
    file_extension = Path(file.filename).suffix.lower()
    if file_extension not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File extension {file_extension} not allowed. Allowed: {', '.join(sorted(settings.ALLOWED_EXTENSIONS))}",
        )

    # Read file content and validate size
    content = await file.read()
    if len(content) > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size is {settings.MAX_FILE_SIZE / (1024 * 1024)}MB",
        )

    file_path = (
        settings.STATIC_UPLOAD_DIR / settings.BLOGPOST_IMAGE_UPLOAD_DIR / file.filename
    )
    try:
        if file_path.exists():
            file_path = file_path.with_stem(
                f"{file_path.stem}_{int(datetime.now().timestamp())}"
            )

        with open(file_path, "wb") as buffer:
            buffer.write(content)

        return ImageResponse(
            filename=file_path.name,
            size=len(content),
            url=f"/{settings.STATIC_UPLOAD_DIR.name / settings.BLOGPOST_IMAGE_UPLOAD_DIR / file.filename}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}",
        )


@router.get(
    "/images",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=Images,
)
async def get_images() -> Images:
    """
    List uploaded images with admin privilege.
    """
    images = []
    if (settings.STATIC_UPLOAD_DIR / settings.BLOGPOST_IMAGE_UPLOAD_DIR).exists():
        for image in (
            settings.STATIC_UPLOAD_DIR / settings.BLOGPOST_IMAGE_UPLOAD_DIR
        ).iterdir():
            if image.is_file() and image.suffix in settings.ALLOWED_EXTENSIONS:
                file_stats = image.stat()
                images.append(
                    Image(
                        filename=image.name,
                        size=file_stats.st_size,
                        url=f"/{settings.STATIC_UPLOAD_DIR.name / settings.BLOGPOST_IMAGE_UPLOAD_DIR / image.name}",
                        upload_date=datetime.fromtimestamp(file_stats.st_ctime),
                    )
                )

    # Sort by creation time, newest first
    images.sort(key=lambda x: x.upload_date, reverse=True)

    return Images(data=images, count=len(images))


@router.delete(
    "/images/{filename}",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=Message,
)
async def delete_image(
    filename: str,
):
    """
    Delete an image with admin privilege.
    """
    file_path = (
        settings.STATIC_UPLOAD_DIR / settings.BLOGPOST_IMAGE_UPLOAD_DIR / filename
    )

    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Image not found"
        )

    file_path.unlink()
    return Message(message=f"Image {filename} deleted successfully")

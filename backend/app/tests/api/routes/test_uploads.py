from fastapi.testclient import TestClient
from pathlib import Path

from app.core.config import settings


TEST_IMAGE_FILENAME = "test_image.jpeg"
TEST_IMAGE_DIR = Path(__file__).parent.parent.parent / "files"


def test_01_upload_image(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    response = client.post(
        f"{settings.API_VERSION_STR}/uploads/images/",
        files={
            "file": (
                TEST_IMAGE_FILENAME,
                open(TEST_IMAGE_DIR / TEST_IMAGE_FILENAME, "rb"),
            )
        },
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["filename"] == TEST_IMAGE_FILENAME
    assert data["size"] > 0
    assert data["url"] == f"/uploads/images/blogposts/{TEST_IMAGE_FILENAME}"
    (
        settings.STATIC_UPLOAD_DIR
        / settings.BLOGPOST_IMAGE_UPLOAD_DIR
        / TEST_IMAGE_FILENAME
    ).unlink()

    # If the image already exists, it should be uploaded with the timestamp in the name
    response = client.post(
        f"{settings.API_VERSION_STR}/uploads/images/",
        files={
            "file": (
                TEST_IMAGE_FILENAME,
                open(TEST_IMAGE_DIR / TEST_IMAGE_FILENAME, "rb"),
            )
        },
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["filename"] == TEST_IMAGE_FILENAME
    response = client.post(
        f"{settings.API_VERSION_STR}/uploads/images/",
        files={
            "file": (
                TEST_IMAGE_FILENAME,
                open(TEST_IMAGE_DIR / TEST_IMAGE_FILENAME, "rb"),
            )
        },
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["filename"].startswith(TEST_IMAGE_FILENAME.split(".")[0])
    assert data["filename"].endswith(TEST_IMAGE_FILENAME.split(".")[1])
    (
        settings.STATIC_UPLOAD_DIR
        / settings.BLOGPOST_IMAGE_UPLOAD_DIR
        / TEST_IMAGE_FILENAME
    ).unlink()
    (
        settings.STATIC_UPLOAD_DIR
        / settings.BLOGPOST_IMAGE_UPLOAD_DIR
        / data["filename"]
    ).unlink()


def test_02_upload_image_unauthorized(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    response = client.post(
        f"{settings.API_VERSION_STR}/uploads/images/",
        files={
            "file": (
                TEST_IMAGE_FILENAME,
                open(TEST_IMAGE_DIR / TEST_IMAGE_FILENAME, "rb"),
            )
        },
        headers=normal_user_token_headers,
    )
    assert response.status_code == 403
    data = response.json()
    assert data["detail"] == "The user does not have admin privileges"


def test_03_upload_image_not_an_image(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    response = client.post(
        f"{settings.API_VERSION_STR}/uploads/images/",
        files={"file": ("test_file.txt", open(TEST_IMAGE_DIR / "test_file.txt", "rb"))},
        headers=superuser_token_headers,
    )
    assert response.status_code == 400
    data = response.json()
    assert data["detail"] == "File must be an image"


def test_04_upload_image_not_allowed_extension(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    response = client.post(
        f"{settings.API_VERSION_STR}/uploads/images/",
        files={
            "file": ("test_image.psd", open(TEST_IMAGE_DIR / "test_image.psd", "rb"))
        },
        headers=superuser_token_headers,
    )
    assert response.status_code == 400
    data = response.json()
    assert (
        data["detail"]
        == "File extension .psd not allowed. Allowed: .gif, .jpeg, .jpg, .png, .webp"
    )


def test_05_upload_image_too_large(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    response = client.post(
        f"{settings.API_VERSION_STR}/uploads/images/",
        files={
            "file": (
                "test_image_large.JPG",
                open(TEST_IMAGE_DIR / "test_image_large.JPG", "rb"),
            )
        },
        headers=superuser_token_headers,
    )
    assert response.status_code == 400
    data = response.json()
    assert data["detail"] == "File too large. Maximum size is 5.0MB"


def test_06_upload_image_error(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    original_upload_dir = settings.STATIC_UPLOAD_DIR
    settings.STATIC_UPLOAD_DIR = "notexists"

    response = client.post(
        f"{settings.API_VERSION_STR}/uploads/images/",
        files={
            "file": (
                TEST_IMAGE_FILENAME,
                open(TEST_IMAGE_DIR / TEST_IMAGE_FILENAME, "rb"),
            )
        },
        headers=superuser_token_headers,
    )
    assert response.status_code == 500
    data = response.json()
    assert (
        f"No such file or directory: 'notexists/images/blogposts/{TEST_IMAGE_FILENAME}'"
        in data["detail"]
    )

    settings.STATIC_UPLOAD_DIR = original_upload_dir


def test_07_get_images(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    # Get previous image count
    response = client.get(
        f"{settings.API_VERSION_STR}/uploads/images/", headers=superuser_token_headers
    )
    assert response.status_code == 200
    data = response.json()
    prev_count = data["count"]

    # Upload the image
    response = client.post(
        f"{settings.API_VERSION_STR}/uploads/images/",
        files={
            "file": (
                TEST_IMAGE_FILENAME,
                open(TEST_IMAGE_DIR / TEST_IMAGE_FILENAME, "rb"),
            )
        },
        headers=superuser_token_headers,
    )
    assert response.status_code == 200

    # Get image count again and check if the test image is in the list
    response = client.get(
        f"{settings.API_VERSION_STR}/uploads/images/", headers=superuser_token_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == prev_count + 1
    assert (
        len(list(filter(lambda x: x["filename"] == TEST_IMAGE_FILENAME, data["data"])))
        == 1
    )
    (
        settings.STATIC_UPLOAD_DIR
        / settings.BLOGPOST_IMAGE_UPLOAD_DIR
        / TEST_IMAGE_FILENAME
    ).unlink()


def test_08_get_images_not_authorized(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    # Get previous image count
    response = client.get(
        f"{settings.API_VERSION_STR}/uploads/images/", headers=normal_user_token_headers
    )
    assert response.status_code == 403
    data = response.json()
    assert data["detail"] == "The user does not have admin privileges"


def test_09_delete_image(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    # Upload the image
    response = client.post(
        f"{settings.API_VERSION_STR}/uploads/images/",
        files={
            "file": (
                TEST_IMAGE_FILENAME,
                open(TEST_IMAGE_DIR / TEST_IMAGE_FILENAME, "rb"),
            )
        },
        headers=superuser_token_headers,
    )
    assert response.status_code == 200

    # Delete the image
    response = client.delete(
        f"{settings.API_VERSION_STR}/uploads/images/{TEST_IMAGE_FILENAME}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == f"Image {TEST_IMAGE_FILENAME} deleted successfully"


def test_10_delete_image_not_authorized(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    response = client.delete(
        f"{settings.API_VERSION_STR}/uploads/images/{TEST_IMAGE_FILENAME}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 403
    data = response.json()
    assert data["detail"] == "The user does not have admin privileges"


def test_11_delete_image_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    response = client.delete(
        f"{settings.API_VERSION_STR}/uploads/images/notexists.jpg",
        headers=superuser_token_headers,
    )
    assert response.status_code == 404
    data = response.json()
    assert data["detail"] == "Image not found"

from fastapi.testclient import TestClient
from unittest.mock import patch

from app.core.config import settings
from app.db.crud import TagCRUD


def test_01_global_exception_handler(client: TestClient):
    with patch.object(TagCRUD, "read_tags") as mock_read_tags:
        mock_read_tags.side_effect = Exception("Test exception")
        with patch("app.main.logger.error") as mock_logger:
            try:
                client.get(f"{settings.API_VERSION_STR}/tags/")
            except Exception:
                pass
            mock_logger.assert_called_once_with(
                "Unhandled error: Test exception", exc_info=True
            )

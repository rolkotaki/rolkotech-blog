from slowapi import Limiter
from slowapi.util import get_remote_address
from app.core.config import settings


# Disable rate limiting during tests
limiter = Limiter(key_func=get_remote_address, enabled=not settings.TEST_MODE)

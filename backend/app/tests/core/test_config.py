import pytest

from app.core.config import parse_cors


def test_01_test_parse_cors():
    # Test with a single URL
    assert parse_cors("https://example.com") == ["https://example.com"]

    # Test with multiple URLs
    assert parse_cors("https://example.com, https://another-example.com ") == [
        "https://example.com",
        "https://another-example.com",
    ]

    # Test with a list of URLs
    assert parse_cors(["https://example.com", "https://another-example.com"]) == [
        "https://example.com",
        "https://another-example.com",
    ]

    # Test with an empty string
    assert parse_cors("") == []

    # Test with an empty list
    assert parse_cors([]) == []

    with pytest.raises(ValueError):
        parse_cors(123)

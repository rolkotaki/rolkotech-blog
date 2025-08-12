from mailersend.exceptions import MailerSendError
import pytest
from unittest.mock import Mock, patch, MagicMock

from app.core.config import settings
from app.rolkotech_email.RolkoTechEmail import RolkoTechEmail


@pytest.fixture()
def test_mode_on():
    original_test_mode = settings.TEST_MODE
    settings.TEST_MODE = True
    yield
    settings.TEST_MODE = original_test_mode


@pytest.fixture()
def test_mode_off():
    original_test_mode = settings.TEST_MODE
    settings.TEST_MODE = False
    yield
    settings.TEST_MODE = original_test_mode


def test_01_email_when_not_testing(test_mode_off):
    RolkoTechEmail._msc = Mock()
    RolkoTechEmail._msc.emails.send = Mock(return_value="response")
    mail = RolkoTechEmail(
        to="test@mail.com", subject="Test Subject", message="Test Message"
    )
    response = mail.send()
    assert response == "response"


def test_02_email_when_testing(test_mode_on):
    RolkoTechEmail._msc = Mock()
    RolkoTechEmail._msc.emails.send = Mock(return_value="response")
    mail = RolkoTechEmail(
        to="test@mail.com", subject="Test Subject", message="Test Message"
    )
    ret = mail.send()
    assert ret is None
    RolkoTechEmail._msc.send.assert_not_called()


def test_03_email_when_mailersend_exception(test_mode_off):
    RolkoTechEmail._msc = Mock()
    RolkoTechEmail._msc.emails.send = Mock(side_effect=MailerSendError("Test error"))
    mail = RolkoTechEmail(
        to="test@mail.com", subject="Test Subject", message="Test Message"
    )
    response = mail.send()
    assert response is None


def test_04_email_when_exception(test_mode_off):
    RolkoTechEmail._msc = Mock()
    RolkoTechEmail._msc.emails.send = Mock(side_effect=Exception())
    mail = RolkoTechEmail(
        to="test@mail.com", subject="Test Subject", message="Test Message"
    )
    response = mail.send()
    assert response is None


def test_05_get_client():
    RolkoTechEmail._msc = None
    assert RolkoTechEmail._msc is None

    with patch(
        "app.rolkotech_email.RolkoTechEmail.MailerSendClient"
    ) as mock_mailersend_client:
        mock_instance = MagicMock()
        mock_mailersend_client.return_value = mock_instance

        # First call should create the client
        client = RolkoTechEmail._get_client()
        # Second call should return the same client without creating a new one
        client_2 = RolkoTechEmail._get_client()

        # Verify the client was created only once with correct API key
        mock_mailersend_client.assert_called_once_with(
            api_key=settings.MAILERSEND_API_KEY
        )
        assert client == client_2 == mock_instance
        assert RolkoTechEmail._msc == mock_instance

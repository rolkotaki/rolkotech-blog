import pytest
from sendgrid.helpers.mail.exceptions import SendGridException
from unittest.mock import Mock

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


@pytest.fixture()
def set_local_environment():
    original_environment = settings.ENVIRONMENT
    settings.ENVIRONMENT = "local"
    yield
    settings.ENVIRONMENT = original_environment


@pytest.fixture()
def set_non_local_environment():
    original_environment = settings.ENVIRONMENT
    settings.ENVIRONMENT = "non_local"
    yield
    settings.ENVIRONMENT = original_environment


def test_01_email_when_not_testing_not_local(test_mode_off, set_non_local_environment):
    RolkoTechEmail._sg = Mock()
    RolkoTechEmail._sg.send = Mock(return_value="response")
    mail = RolkoTechEmail(
        to="test@mail.com", subject="Test Subject", message="Test Message"
    )
    response = mail.send()
    import ssl

    assert ssl._create_default_https_context is not ssl._create_unverified_context
    assert response == "response"


def test_02_email_when_not_testing_local(test_mode_off, set_local_environment):
    RolkoTechEmail._sg = Mock()
    RolkoTechEmail._sg.send = Mock(return_value="response")
    mail = RolkoTechEmail(
        to="test@mail.com", subject="Test Subject", message="Test Message"
    )
    response = mail.send()
    import ssl

    assert ssl._create_default_https_context is ssl._create_unverified_context
    assert response == "response"


def test_03_email_when_testing(test_mode_on):
    RolkoTechEmail._sg = Mock()
    RolkoTechEmail._sg.send = Mock(return_value="response")
    mail = RolkoTechEmail(
        to="test@mail.com", subject="Test Subject", message="Test Message"
    )
    mail.send()
    RolkoTechEmail._sg.send.assert_not_called()


def test_04_email_when_sendgrid_exception(test_mode_off):
    RolkoTechEmail._sg = Mock()
    RolkoTechEmail._sg.send = Mock(side_effect=SendGridException())
    mail = RolkoTechEmail(
        to="test@mail.com", subject="Test Subject", message="Test Message"
    )
    response = mail.send()
    assert response is None


def test_05_email_when_exception(test_mode_off):
    RolkoTechEmail._sg = Mock()
    RolkoTechEmail._sg.send = Mock(side_effect=Exception())
    mail = RolkoTechEmail(
        to="test@mail.com", subject="Test Subject", message="Test Message"
    )
    response = mail.send()
    assert response is None

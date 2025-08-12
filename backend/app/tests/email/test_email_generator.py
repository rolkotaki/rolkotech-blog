from app.core.config import settings
from app.rolkotech_email.EmailGenerator import (
    EMAIL_GENERATOR,
    USER_ACTIVATION_SUBJECT,
    PASSWORD_RESET_SUBJECT,
)


def test_01_create_user_activation_email():
    email_to = "test@email.com"
    username = "testuser"
    activation_link = "http://example.com/activate?token=testtoken"
    email = EMAIL_GENERATOR.create_user_activation_email(
        email=email_to, username=username, activation_link=activation_link
    )

    assert email.email.subject == USER_ACTIVATION_SUBJECT
    assert email.email.to[0].email == email_to
    assert email.email.from_email.email == settings.EMAIL_FROM
    assert username in email.email.html
    assert activation_link in email.email.html


def test_02_create_password_reset_email():
    email_to = "test@email.com"
    username = "testuser"
    reset_link = "http://example.com/password-reset"
    email = EMAIL_GENERATOR.create_password_reset_email(
        email=email_to, username=username, reset_link=reset_link
    )

    assert email.email.subject == PASSWORD_RESET_SUBJECT
    assert email.email.to[0].email == email_to
    assert email.email.from_email.email == settings.EMAIL_FROM
    assert username in email.email.html
    assert reset_link in email.email.html

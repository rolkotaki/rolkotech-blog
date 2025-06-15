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

    assert str(email.mail.subject) == USER_ACTIVATION_SUBJECT
    assert email.mail.personalizations[0].tos[0].get("email") == email_to
    assert email.mail.from_email._email == settings.EMAIL_FROM
    assert username in email.mail.contents[0].content
    assert activation_link in email.mail.contents[0].content


def test_02_create_password_reset_email():
    email_to = "test@email.com"
    username = "testuser"
    reset_link = "http://example.com/password-reset"
    email = EMAIL_GENERATOR.create_password_reset_email(
        email=email_to, username=username, reset_link=reset_link
    )

    assert str(email.mail.subject) == PASSWORD_RESET_SUBJECT
    assert email.mail.personalizations[0].tos[0].get("email") == email_to
    assert email.mail.from_email._email == settings.EMAIL_FROM
    assert username in email.mail.contents[0].content
    assert reset_link in email.mail.contents[0].content

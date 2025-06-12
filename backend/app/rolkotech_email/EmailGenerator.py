from jinja2 import Environment, FileSystemLoader, select_autoescape
import os

from app.rolkotech_email.RolkoTechEmail import RolkoTechEmail


__all__ = ["EMAIL_GENERATOR", "USER_ACTIVATION_SUBJECT", "PASSWORD_RESET_SUBJECT",]


EMAIL_TEMPLATES_DIR = os.path.join(os.path.dirname(__file__), "email_templates")
USER_ACTIVATION_TEMPLATE = "user_activation.html"
USER_ACTIVATION_SUBJECT = "Please activate your account at RolkoTech Blog"
PASSWORD_RESET_TEMPLATE = "password_reset.html"
PASSWORD_RESET_SUBJECT = "Reset your password at RolkoTech Blog"


class EmailGenerator:
    """
    Generate emails using Jinja2 templates.
    """

    jinja_env = Environment(
        loader=FileSystemLoader(EMAIL_TEMPLATES_DIR),
        autoescape=select_autoescape(['html', 'xml'])
    )
    
    @staticmethod
    def create_user_activation_email(email: str, username: str, activation_link: str, **kwargs) -> str:
        email_body = EmailGenerator.jinja_env.get_template(USER_ACTIVATION_TEMPLATE).render(
            name=username, activation_link=activation_link, **kwargs)
        return RolkoTechEmail(to=email, subject=USER_ACTIVATION_SUBJECT, message=email_body)

    @staticmethod
    def create_password_reset_email(email: str, username: str, reset_link: str, **kwargs) -> str:
        email_body = EmailGenerator.jinja_env.get_template(PASSWORD_RESET_TEMPLATE).render(
            name=username, reset_link=reset_link, **kwargs)
        return RolkoTechEmail(to=email, subject=PASSWORD_RESET_SUBJECT, message=email_body)


EMAIL_GENERATOR = EmailGenerator()

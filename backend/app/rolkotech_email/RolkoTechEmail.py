from python_http_client.client import Response
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Email, To, Subject, HtmlContent, Mail
from sendgrid.helpers.mail.exceptions import SendGridException
from threading import RLock

from app.core.config import settings
from app.logger import logger


class RolkoTechEmail:
    """
    Represents an email to be sent via SendGrid. Use the `send()` method to send the message.
    """

    _sg: SendGridAPIClient = None
    _sg_lock: RLock = RLock()

    def __init__(self, to: str, subject: str, message: str):
        self.to: str = to
        self.subject: str = subject
        email_from: Email = Email(settings.EMAIL_FROM)
        email_to: To = To(self.to)
        subject: Subject = Subject(self.subject)
        content: HtmlContent = HtmlContent(message)
        self.mail: Mail = Mail(email_from, email_to, subject, content)
        type(self)._create_api_client()

    @classmethod
    def _create_api_client(cls) -> None:
        """
        Create the Sendgrid API client using the API key.
        """
        if cls._sg is None:
            with cls._sg_lock:
                if cls._sg is None:
                    cls._sg = SendGridAPIClient(api_key=settings.SENDGRID_API_KEY)

    def send(self) -> Response | None:
        """
        Send the email.
        """
        if settings.ENVIRONMENT == "local":
            # In local development, we might not want to verify SSL certificates
            import ssl

            ssl._create_default_https_context = ssl._create_unverified_context

        try:
            if settings.TEST_MODE:
                # Do not send emails in test mode
                return None
            response = type(self)._sg.send(self.mail)
            return response
        except SendGridException as se:
            logger.error(
                f"Failed to send email to {self.to} with subject {self.subject} due to SendGridException: {str(se)}",
                exc_info=True,
            )
            return None
        except Exception as e:
            logger.error(
                f"Failed to send email to {self.to} with subject {self.subject}: {str(e)}",
                exc_info=True,
            )
            return None

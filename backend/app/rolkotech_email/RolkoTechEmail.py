from mailersend import MailerSendClient, EmailBuilder
from mailersend.exceptions import MailerSendError
from mailersend.resources.email import EmailRequest, APIResponse
from threading import RLock

from app.core.config import settings
from app.logger import logger


class RolkoTechEmail:
    """
    Represents an email to be sent via MailerSend.
    """

    _msc: MailerSendClient = None
    _msc_lock: RLock = RLock()

    def __init__(self, to: str, subject: str, message: str):
        self.to: str = to
        self.subject: str = subject
        self.message: str = message
        self.email: EmailRequest = (
            EmailBuilder()
            .from_email(settings.EMAIL_FROM, settings.EMAIL_FROM_NAME)
            .to(self.to)
            .subject(self.subject)
            .html(self.message)
            .build()
        )

    @classmethod
    def _get_client(cls) -> MailerSendClient:
        """Get or create the MailerSend client."""
        if cls._msc is None:
            with cls._msc_lock:
                if cls._msc is None:
                    cls._msc = MailerSendClient(api_key=settings.MAILERSEND_API_KEY)
        return cls._msc

    def send(self) -> APIResponse | None:
        """
        Send the email.
        """
        try:
            if settings.TEST_MODE:
                # Do not send emails in test mode
                return None
            response = self._get_client().emails.send(self.email)
            return response
        except MailerSendError as se:
            logger.error(
                f"Failed to send email to {self.to} with subject {self.subject} due to MailerSendError: {str(se)}",
                exc_info=True,
            )
            return None
        except Exception as e:
            logger.error(
                f"Failed to send email to {self.to} with subject {self.subject}: {str(e)}",
                exc_info=True,
            )
            return None

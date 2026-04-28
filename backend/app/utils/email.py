import logging

from app.core.config import settings


logger = logging.getLogger(__name__)


def send_password_reset_email(*, to: str, reset_url: str) -> None:
    if not settings.RESEND_API_KEY:
        logger.info("RESEND_API_KEY not set; reset link for %s: %s", to, reset_url)
        return

    try:
        import resend

        resend.api_key = settings.RESEND_API_KEY
        resend.Emails.send(
            {
                "from": settings.EMAIL_FROM,
                "to": [to],
                "subject": "Cybrella Time — Password Reset",
                "html": (
                    "<p>You requested a password reset for Cybrella Time.</p>"
                    f'<p><a href="{reset_url}">Click here to reset your password</a></p>'
                    "<p>This link expires in 60 minutes. If you did not request this, ignore this email.</p>"
                ),
            }
        )
    except Exception as exc:
        logger.exception("failed to send password reset email: %s", exc)

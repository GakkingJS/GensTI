from uuid import uuid4

from verification_mail import (
    FakeVerificationEmailSender,
    VerificationEmail,
)


def test_fake_sender_captures_recipient_and_token():
    sender = FakeVerificationEmailSender()
    message = VerificationEmail(
        recipient="estudiante@campusucc.edu.co",
        token="token-de-prueba",
        message_id=uuid4(),
    )

    sender.send_verification(message)

    assert sender.sent == [message]
    assert sender.sent[0].message_id == message.message_id
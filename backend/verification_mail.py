from dataclasses import dataclass
from typing import Protocol
from uuid import UUID


@dataclass(frozen=True)
class VerificationEmail:
    recipient: str
    token: str
    message_id: UUID


class VerificationEmailSender(Protocol):
    def send_verification(self, message: VerificationEmail) -> None:
        """Entrega el token al destinatario; nunca lo registra en logs."""


class FakeVerificationEmailSender:
    def __init__(self) -> None:
        self.sent: list[VerificationEmail] = []

    def send_verification(self, message: VerificationEmail) -> None:
        self.sent.append(message)
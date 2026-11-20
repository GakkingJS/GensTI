from dataclasses import dataclass
from typing import Protocol
from uuid import UUID


@dataclass(frozen=True)
class PasswordResetEmail:
    recipient: str
    token: str
    message_id: UUID


class PasswordResetEmailSender(Protocol):
    def send_password_reset(self, message: PasswordResetEmail) -> None:
        """Entrega el enlace de recuperación; nunca registra el token."""


class FakePasswordResetEmailSender:
    def __init__(self) -> None:
        self.sent: list[PasswordResetEmail] = []

    def send_password_reset(
        self,
        message: PasswordResetEmail,
    ) -> None:
        self.sent.append(message)
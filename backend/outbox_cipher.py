from cryptography.fernet import Fernet


class OutboxCipher:
    def __init__(self, key: bytes) -> None:
        self._fernet = Fernet(key)

    def encrypt_token(self, token: str) -> str:
        if not isinstance(token, str) or not token:
            raise ValueError("El token debe ser un texto no vacío")

        return self._fernet.encrypt(
            token.encode("utf-8")
        ).decode("ascii")

    def decrypt_token(self, ciphertext: str) -> str:
        if not isinstance(ciphertext, str):
            raise ValueError("El texto cifrado debe ser una cadena")

        return self._fernet.decrypt(
            ciphertext.encode("ascii")
        ).decode("utf-8")
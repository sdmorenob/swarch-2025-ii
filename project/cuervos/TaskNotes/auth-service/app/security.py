import os
import base64
from datetime import datetime, timedelta
from typing import Optional

from jose import jwt, JWTError
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.asymmetric import rsa

# HS256 fallback configuration
SECRET_KEY = os.getenv("SECRET_KEY", "change-me-in-prod")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

# Optional RS256 configuration
JWT_PRIVATE_KEY: Optional[str] = os.getenv("JWT_PRIVATE_KEY")
JWT_PUBLIC_KEY: Optional[str] = os.getenv("JWT_PUBLIC_KEY")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "RS256")
JWT_ISSUER = os.getenv("JWT_ISSUER", "tasknotes-auth")
JWT_AUDIENCE = os.getenv("JWT_AUDIENCE", "tasknotes-api")
JWT_KID = os.getenv("JWT_KID", "auth-service-key")

ph = PasswordHasher()


def _sanitize_pem(pem_str: str) -> str:
    s = pem_str.strip().replace("\r", "")
    # Remove any accidental double quotes that may have been introduced
    s = s.replace('"', '')
    # Ensure newline at end for parsers
    if not s.endswith("\n"):
        s += "\n"
    return s


def _maybe_decode_b64_to_pem(value: Optional[str]) -> Optional[str]:
    """If the provided value is base64-encoded, decode to text PEM; otherwise return as-is.
    Detects PEM by the BEGIN/END header. Returns None if input is None.
    """
    if not value:
        return None
    v = value.strip()
    if v.startswith("-----BEGIN"):
        return _sanitize_pem(v)
    # Try base64 decode; if fails, return original
    try:
        decoded = base64.b64decode(v).decode("utf-8")
        decoded = _sanitize_pem(decoded)
        if decoded.startswith("-----BEGIN"):
            return decoded
        return v
    except Exception:
        return v

# Normalize keys to PEM text if they come base64-encoded
JWT_PRIVATE_KEY_PEM = _maybe_decode_b64_to_pem(JWT_PRIVATE_KEY)
JWT_PUBLIC_KEY_PEM = _maybe_decode_b64_to_pem(JWT_PUBLIC_KEY)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return ph.verify(hashed_password, plain_password)
    except VerifyMismatchError:
        return False


def hash_password(password: str) -> str:
    return ph.hash(password)


def _b64url_uint(val: int) -> str:
    # Convert integer to base64url without padding
    b = val.to_bytes((val.bit_length() + 7) // 8, byteorder="big")
    return base64.urlsafe_b64encode(b).decode("ascii").rstrip("=")


def is_rs256_enabled() -> bool:
    return bool(JWT_PRIVATE_KEY_PEM and JWT_PUBLIC_KEY_PEM and JWT_ALGORITHM.upper() == "RS256")


def get_jwks() -> dict:
    """Return JWKS with the configured RS256 public key, or empty if not set."""
    if not is_rs256_enabled():
        return {"keys": []}
    try:
        pub_key = serialization.load_pem_public_key(
            JWT_PUBLIC_KEY_PEM.encode("utf-8"), backend=default_backend()
        )
        if isinstance(pub_key, rsa.RSAPublicKey):
            numbers = pub_key.public_numbers()
            jwk = {
                "kty": "RSA",
                "n": _b64url_uint(numbers.n),
                "e": _b64url_uint(numbers.e),
                "alg": "RS256",
                "use": "sig",
                "kid": JWT_KID,
            }
            return {"keys": [jwk]}
        else:
            return {"keys": []}
    except Exception:
        return {"keys": []}


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    now = datetime.utcnow()
    expire = now + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "iat": now})
    if is_rs256_enabled():
        # Add issuer and audience only for RS256 setup
        to_encode.update({"iss": JWT_ISSUER, "aud": JWT_AUDIENCE})
        # Add KID header for RS256
        return jwt.encode(to_encode, JWT_PRIVATE_KEY_PEM, algorithm="RS256", headers={"kid": JWT_KID})
    else:
        return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict | None:
    try:
        if is_rs256_enabled():
            return jwt.decode(
                token,
                JWT_PUBLIC_KEY_PEM,
                algorithms=["RS256"],
                audience=JWT_AUDIENCE,
                issuer=JWT_ISSUER,
                options={"verify_aud": False}  # keep flexible for now
            )
        else:
            return jwt.decode(
                token,
                SECRET_KEY,
                algorithms=[ALGORITHM],
                options={"verify_aud": False}
            )
    except JWTError:
        return None
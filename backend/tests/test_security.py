"""
Tests for app/core/security.py

Covers:
- Password hashing and verification
- JWT token encoding/decoding
"""

import pytest
from jose import jwt, JWTError
from app.core.security import hash_password, verify_password, create_access_token, decode_token
from app.core.config import settings


# ============================================================================
# Test: Password hashing
# ============================================================================


def test_hash_password_returns_non_plaintext():
    """Hash does not equal plaintext password."""
    password = "mySecretPassword123"
    hashed = hash_password(password)

    assert hashed != password
    assert len(hashed) > len(password)


def test_hash_password_deterministic_is_false():
    """Two hashes of the same password are different (bcrypt uses salt)."""
    password = "mySecretPassword123"
    hash1 = hash_password(password)
    hash2 = hash_password(password)

    # Due to random salt, hashes should be different
    assert hash1 != hash2


def test_verify_password_correct():
    """verify_password returns True for correct password."""
    password = "mySecretPassword123"
    hashed = hash_password(password)

    assert verify_password(password, hashed) is True


def test_verify_password_incorrect():
    """verify_password returns False for wrong password."""
    password = "mySecretPassword123"
    wrong_password = "wrongPassword"
    hashed = hash_password(password)

    assert verify_password(wrong_password, hashed) is False


def test_verify_password_empty_password():
    """verify_password handles empty password correctly."""
    password = ""
    hashed = hash_password(password)

    assert verify_password(password, hashed) is True
    assert verify_password("nonempty", hashed) is False


def test_verify_password_unicode():
    """verify_password works with unicode characters."""
    password = "contraseña123"
    hashed = hash_password(password)

    assert verify_password(password, hashed) is True
    assert verify_password("contraseña124", hashed) is False


# ============================================================================
# Test: Token encoding and decoding
# ============================================================================


def test_create_access_token_basic():
    """create_access_token generates a valid JWT."""
    subject = "user123"
    token = create_access_token(subject)

    assert isinstance(token, str)
    assert len(token) > 0


def test_create_access_token_decode_contains_sub():
    """Encoded token can be decoded and contains sub."""
    subject = "user456"
    token = create_access_token(subject)
    decoded = decode_token(token)

    assert "sub" in decoded
    assert decoded["sub"] == subject


def test_create_access_token_with_extra_data():
    """create_access_token includes extra_data in payload."""
    subject = "user789"
    extra = {"username": "alice", "email": "alice@example.com"}
    token = create_access_token(subject, extra_data=extra)
    decoded = decode_token(token)

    assert decoded["sub"] == subject
    assert decoded["username"] == "alice"
    assert decoded["email"] == "alice@example.com"


def test_decode_token_basic():
    """decode_token returns payload as dict."""
    subject = "user123"
    token = create_access_token(subject)
    decoded = decode_token(token)

    assert isinstance(decoded, dict)
    assert decoded["sub"] == subject


def test_decode_token_has_exp():
    """Decoded token includes exp claim."""
    subject = "user123"
    token = create_access_token(subject)
    decoded = decode_token(token)

    assert "exp" in decoded


def test_decode_token_invalid_raises_jwterror():
    """Decoding an invalid token raises JWTError."""
    with pytest.raises(JWTError):
        decode_token("invalid.token.here")


def test_decode_token_tampered_raises_jwterror():
    """Decoding a tampered token raises JWTError."""
    subject = "user123"
    token = create_access_token(subject)

    # Tamper with the token by appending a character
    tampered = token + "x"

    with pytest.raises(JWTError):
        decode_token(tampered)


def test_decode_token_wrong_algorithm_raises_jwterror():
    """Token signed with wrong algorithm is rejected."""
    subject = "user123"

    # Sign with a different algorithm
    token = jwt.encode(
        {"sub": subject},
        settings.JWT_SECRET_KEY,
        algorithm="HS512"  # Different from HS256
    )

    with pytest.raises(JWTError):
        decode_token(token)


def test_decode_token_wrong_secret_raises_jwterror():
    """Token signed with wrong secret is rejected."""
    subject = "user123"

    # Sign with a different secret
    token = jwt.encode(
        {"sub": subject},
        "wrong_secret_key",
        algorithm=settings.JWT_ALGORITHM
    )

    with pytest.raises(JWTError):
        decode_token(token)


def test_token_roundtrip_with_username():
    """Token with username in extra_data round-trips correctly."""
    subject = "user123"
    username = "alice"
    token = create_access_token(subject, extra_data={"username": username})
    decoded = decode_token(token)

    assert decoded["sub"] == subject
    assert decoded["username"] == username


def test_token_roundtrip_complex_payload():
    """Token with complex extra_data round-trips correctly."""
    subject = "user123"
    extra = {
        "username": "bob",
        "email": "bob@example.com",
        "roles": ["admin", "user"],
        "metadata": {"lang": "es", "theme": "dark"}
    }
    token = create_access_token(subject, extra_data=extra)
    decoded = decode_token(token)

    assert decoded["sub"] == subject
    assert decoded["username"] == extra["username"]
    assert decoded["email"] == extra["email"]
    assert decoded["roles"] == extra["roles"]
    assert decoded["metadata"] == extra["metadata"]

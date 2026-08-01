from __future__ import annotations

import pytest

from app.modules.files.models import FileCategory
from app.modules.files.service import ALLOWED_BY_CATEGORY, detect_type


@pytest.mark.parametrize(
    ("payload", "mime_type"),
    [
        (b"\xff\xd8\xffpayload", "image/jpeg"),
        (b"\x89PNG\r\n\x1a\npayload", "image/png"),
        (b"GIF89apayload", "image/gif"),
        (b"RIFF0000WEBPpayload", "image/webp"),
        (b"%PDF-1.7\npayload", "application/pdf"),
    ],
)
def test_content_type_is_derived_from_magic_bytes(payload: bytes, mime_type: str) -> None:
    detected = detect_type(payload)
    assert detected is not None
    assert detected.mime_type == mime_type


def test_unknown_content_is_not_accepted_from_a_declared_type() -> None:
    assert detect_type(b"text pretending to be an image") is None


def test_unsupported_categories_are_closed() -> None:
    assert ALLOWED_BY_CATEGORY[FileCategory.VIDEO] == set()
    assert ALLOWED_BY_CATEGORY[FileCategory.AUDIO] == set()
    assert ALLOWED_BY_CATEGORY[FileCategory.OTHER] == set()

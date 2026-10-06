import pytest
from app.services.storage_service import StorageService

def test_storage_service_fallback(tmp_path):
    """
    Tests StorageService graceful fallback to local storage when R2 environment variables are not set.
    """
    test_file = str(tmp_path / "test.pdf")
    with open(test_file, "wb") as f:
        f.write(b"%PDF-1.4 test payload")

    # In local mode (no R2 creds), upload_file returns False (stored locally)
    res = StorageService.upload_file(test_file, "test.pdf")
    assert res is False
    assert StorageService.get_client() is None

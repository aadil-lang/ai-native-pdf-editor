import os
import logging
from pathlib import Path
from typing import Optional
from app.config import settings

logger = logging.getLogger("paperforge.storage")

class StorageService:
    _s3_client = None

    @classmethod
    def get_client(cls):
        if cls._s3_client is None:
            if settings.R2_ACCOUNT_ID and settings.R2_ACCESS_KEY_ID and settings.R2_SECRET_ACCESS_KEY:
                try:
                    import boto3
                    endpoint_url = f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
                    cls._s3_client = boto3.client(
                        "s3",
                        endpoint_url=endpoint_url,
                        aws_access_key_id=settings.R2_ACCESS_KEY_ID,
                        aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
                        region_name="auto"
                    )
                    logger.info(f"Initialized Cloudflare R2 Client for bucket '{settings.R2_BUCKET_NAME}'")
                except Exception as e:
                    logger.warning(f"Failed to initialize Cloudflare R2 client: {e}. Falling back to local storage.")
                    cls._s3_client = False
            else:
                cls._s3_client = False
        return cls._s3_client if cls._s3_client is not False else None

    @classmethod
    def upload_file(cls, local_path: str, object_name: Optional[str] = None) -> bool:
        """
        Uploads a local PDF file to Cloudflare R2 bucket if R2 is configured.
        Returns True if uploaded to R2, False if stored locally.
        """
        client = cls.get_client()
        if not client:
            return False

        file_path = Path(local_path)
        if not file_path.exists():
            return False

        key = object_name or file_path.name
        try:
            client.upload_file(str(file_path), settings.R2_BUCKET_NAME, key)
            logger.info(f"Successfully uploaded '{key}' to Cloudflare R2 bucket '{settings.R2_BUCKET_NAME}'")
            return True
        except Exception as e:
            logger.error(f"Error uploading '{key}' to Cloudflare R2: {e}")
            return False

    @classmethod
    def download_file(cls, object_name: str, target_local_path: str) -> bool:
        """
        Downloads a file from Cloudflare R2 bucket to a local target path.
        """
        client = cls.get_client()
        if not client:
            return False

        try:
            client.download_file(settings.R2_BUCKET_NAME, object_name, target_local_path)
            logger.info(f"Successfully downloaded '{object_name}' from Cloudflare R2")
            return True
        except Exception as e:
            logger.error(f"Error downloading '{object_name}' from Cloudflare R2: {e}")
            return False

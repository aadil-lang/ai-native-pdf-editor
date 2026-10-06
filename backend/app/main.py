from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import logging
from app.config import settings
from app.core.db import engine, Base
from app.api.documents import router as documents_router
from app.api.operations import router as operations_router
from app.api.ai import router as ai_router
from app.api.conversion import router as conversion_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("paperforge")

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME)

# Enable CORS for Next.js frontend & PWA
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Internal Error processing {request.method} {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "detail": f"PaperForge encountered an issue processing this request: {str(exc)}",
            "user_message": "PaperForge could not complete this document operation. Please verify the document parameters and try again."
        }
    )

app.include_router(documents_router)
app.include_router(operations_router)
app.include_router(ai_router)
app.include_router(conversion_router)

@app.get("/health")
def health_check():
    return {"status": "ok", "app": settings.PROJECT_NAME}


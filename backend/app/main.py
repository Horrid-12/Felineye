import logging
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from .config import settings
from .routes import health, identify, species, observations, collection

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("felidlens")

app = FastAPI(
    title="FelidLens — AI Feline Identification & Discovery Engine",
    description="Provider-independent AI identification, curated Felidae taxonomy, and responsible wildlife observations.",
    version="1.0.0"
)

# CORS Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global safe error handler: prevents leaking internal tracebacks or system paths
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception on %s %s: %s", request.method, request.url.path, exc, exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An internal server error occurred while processing the wildlife request.",
            "status_code": 500
        }
    )

# Register route controllers
app.include_router(health.router)
app.include_router(identify.router)
app.include_router(species.router)
app.include_router(observations.router)
app.include_router(collection.router)

@app.get("/", tags=["Root"])
async def root_index():
    return {
        "service": "FelidLens API",
        "documentation": "/docs",
        "health": "/api/health",
        "species_catalog": "/api/species"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host=settings.host, port=settings.port, reload=True)

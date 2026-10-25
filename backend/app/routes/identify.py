import hashlib

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from ..models.identification import IdentificationResult
from ..services.identification.pipeline import pipeline
from ..services.image_validator import validate_and_process_image

router = APIRouter(prefix="/api", tags=["Identification"])


@router.post("/identify", response_model=IdentificationResult)
async def identify_feline_image(file: UploadFile = File(...)):
    """Validate an upload and run the real, replaceable identification pipeline.

    MIME validation is only a first filter. Decodability, dimensions, image
    quality, feline content, taxonomy, and uncertainty are all checked before a
    species can be returned. The response is a model estimate, never a human
    verification.
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Uploaded file content-type '{file.content_type}' is not a recognized image format.",
        )

    try:
        content = await file.read()
        image, metadata = validate_and_process_image(content)
        metadata["filename"] = file.filename
        metadata["content_type"] = file.content_type
        metadata["image_fingerprint"] = hashlib.sha256(content).hexdigest()

        # Provider failures are represented as an explicit processing_error or
        # model_unavailable result rather than a fabricated prediction.
        return await pipeline.identify(image, metadata)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred during image processing: {exc}",
        )

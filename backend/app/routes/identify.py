from fastapi import APIRouter, UploadFile, File, HTTPException, status
from ..services.image_validator import validate_and_process_image
from ..services.identification.pipeline import pipeline
from ..models.identification import IdentificationResult

router = APIRouter(prefix="/api", tags=["Identification"])

@router.post("/identify", response_model=IdentificationResult)
async def identify_feline_image(file: UploadFile = File(...)):
    """
    Analyzes an uploaded photograph, validates image decodability and MIME standards,
    runs the provider-independent feline classifier pipeline, and computes
    ranked candidates with transparent confidence and uncertainty reporting.
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Uploaded file content-type '{file.content_type}' is not a recognized image format."
        )

    try:
        content = await file.read()
        image, metadata = validate_and_process_image(content)
        metadata["filename"] = file.filename
        metadata["content_type"] = file.content_type

        result = await pipeline.identify(image, metadata)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred during image processing: {str(e)}"
        )

from typing import List, Optional
from pydantic import BaseModel, Field

class ObservationItem(BaseModel):
    id: str
    species_name: str
    scientific_name: str
    observed_on: Optional[str] = None
    broad_location: str
    image_url: Optional[str] = None
    quality_grade: str
    source: str
    source_url: str
    coordinates_obscured: bool = Field(
        default=True,
        description="Indicates whether raw GPS coordinates have been generalized for wildlife protection."
    )

class ObservationListResponse(BaseModel):
    total: int
    observations: List[ObservationItem]
    disclaimer: str = (
        "Observation coordinates are generalized to prevent the disturbance or illegal poaching of vulnerable wildlife. Historical sightings do not imply current animal presence."
    )

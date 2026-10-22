import logging
from typing import Dict, Any, Optional
import httpx
from ..config import settings

logger = logging.getLogger(__name__)

class GbifService:
    def __init__(self):
        self.api_base = settings.gbif_api_base

    async def get_species_backbone(self, scientific_name: str) -> Optional[Dict[str, Any]]:
        """
        Resolves a scientific name against the GBIF Taxonomic Backbone.
        """
        try:
            async with httpx.AsyncClient(timeout=settings.request_timeout_seconds) as client:
                resp = await client.get(
                    f"{self.api_base}/species/match",
                    params={"name": scientific_name, "strict": "false"}
                )
                if resp.status_code == 200:
                    data = resp.json()
                    return {
                        "usageKey": data.get("usageKey"),
                        "scientificName": data.get("scientificName"),
                        "canonicalName": data.get("canonicalName"),
                        "rank": data.get("rank"),
                        "status": data.get("status"),
                        "confidence": data.get("confidence"),
                        "matchType": data.get("matchType")
                    }
        except Exception as e:
            logger.warning("GBIF API query for %s failed: %s", scientific_name, e)
        return None

gbif_service = GbifService()

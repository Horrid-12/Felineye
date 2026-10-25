"""Taxonomy-aware acceptance policy for identification results.

The thresholds below are *abstention* thresholds for a cosine-similarity ranker,
not probabilities. They were selected against the 41 reference images in the
curated catalog plus dog, crocodile, and object negatives. See
Documentation/Identification-Model.md for the validation table and limitations.
"""

from __future__ import annotations

from typing import Optional

from ...config import settings
from ...models.identification import CandidatePrediction, IdentificationStatus

DOMESTIC_SPECIES_ID = "felis-catus"

#: Small wildcats that can visually resemble a domestic cat. If one of these is
#: a close second to a domestic-cat result, the pipeline returns an abstention
#: rather than declaring a domestic cat.
DOMESTIC_CONFUSABLE_WILD_IDS = {
    "felis-silvestris",
    "felis-lybica",
    "felis-chaus",
    "felis-margarita",
    "felis-nigripes",
    "felis-bieti",
    "leopardus-pardalis",
    "leopardus-wiedii",
    "leopardus-jacobita",
    "leopardus-guigna",
    "leopardus-geoffroyi",
    "leopardus-tigrinus",
    "leopardus-guttulus",
    "leopardus-colocolo",
    "prionailurus-bengalensis",
    "prionailurus-viverrinus",
    "prionailurus-planiceps",
    "prionailurus-rubiginosus",
    "prionailurus-javanensis",
    "otocolobus-manul",
}

#: ImageNet/BioCLIP classes cannot separate these species reliably. A top-1
#: lynx result is therefore reported as a candidate list, never as a single
#: confirmed lynx species.
LYNX_SPECIES_IDS = {
    "lynx-lynx",
    "lynx-canadensis",
    "lynx-rufus",
    "lynx-pardinus",
}


def _margin(top: CandidatePrediction, second: Optional[CandidatePrediction]) -> float:
    if second is None:
        return top.confidence_score
    return top.confidence_score - second.confidence_score


def decide_status(
    top: CandidatePrediction,
    second: Optional[CandidatePrediction],
    *,
    is_mock: bool,
) -> tuple[IdentificationStatus, Optional[str]]:
    """Return the taxonomy-aware status and an optional explanation.

    The caller has already established that the provider detected a feline and
    that at least one catalog candidate exists.
    """

    if is_mock:
        return (
            IdentificationStatus.DEVELOPMENT_SIMULATION,
            "Development simulation provider is active. These ranks are not real "
            "model predictions and cannot award discovery XP.",
        )

    margin = _margin(top, second)

    if top.category == "domestic_breed":
        # A single photograph cannot establish breed ancestry with this model.
        return (
            IdentificationStatus.UNABLE_TO_IDENTIFY,
            "Breed-level evidence is not sufficient. Report the domestic cat at "
            "species level instead of asserting a breed.",
        )

    if top.category == "domestic_species":
        if top.confidence_score < settings.bioclip_min_domestic_similarity:
            return (
                IdentificationStatus.UNABLE_TO_IDENTIFY,
                "A domestic-cat candidate was found, but its similarity score is "
                "below the conservative domestic-cat acceptance threshold.",
            )
        if second is not None and second.category == "wild_species":
            if (
                second.species_id in DOMESTIC_CONFUSABLE_WILD_IDS
                and margin < settings.bioclip_min_domestic_margin + 0.015
            ):
                return (
                    IdentificationStatus.UNABLE_TO_IDENTIFY,
                    "The image is consistent with a domestic cat or a small wildcat "
                    f"({second.common_name}). A single photograph cannot separate them "
                    "reliably, so the result is abstained.",
                )
        if margin < settings.bioclip_min_domestic_margin:
            return (
                IdentificationStatus.UNABLE_TO_IDENTIFY,
                "The domestic-cat candidate is not sufficiently separated from the "
                "next candidate. The result is abstained.",
            )
        return (
            IdentificationStatus.IDENTIFIED_DOMESTIC_CAT,
            "Domestic cat (Felis catus) identified at species level. Breed or "
            "mixed-breed ancestry is not asserted from a single photograph.",
        )

    # Wild species
    if top.species_id in LYNX_SPECIES_IDS and second is not None:
        if second.species_id in LYNX_SPECIES_IDS:
            return (
                IdentificationStatus.UNABLE_TO_IDENTIFY,
                "The image is a lynx-like feline, but the model cannot separate lynx "
                "species. The closest candidates are listed instead of forcing one.",
            )

    if top.confidence_score < settings.bioclip_min_wild_similarity:
        return (
            IdentificationStatus.UNABLE_TO_IDENTIFY,
            "Feline features were detected, but the best wild-species similarity "
            "is below the conservative acceptance threshold.",
        )
    if margin < settings.bioclip_min_wild_margin:
        return (
            IdentificationStatus.UNABLE_TO_IDENTIFY,
            "The top wild-species candidates are too close to separate reliably. "
            "The result is abstained rather than forced.",
        )

    return (
        IdentificationStatus.IDENTIFIED_WILD_SPECIES,
        None,
    )

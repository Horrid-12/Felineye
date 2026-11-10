"""Collection-gap planning for the breed-v1 dataset (round 2).

Answers one question per breed: how many *training-eligible* photographs do we
already have, how many more until the round-2 target, and how many fresh
candidates are likely needed to get there?

Read-only. Nothing here collects, reviews, promotes or trains. Eligibility is
derived from ``training_eligibility(asset_type, review_status)`` — never from
``label_confidence`` — so rejected/ambiguous/pending rows and non-photographic
assets can never inflate the count.
"""
from __future__ import annotations

import math
import os
import time
from pathlib import Path
from typing import Any, Dict, Iterable, List

from .breed_dataset import CATEGORY_BY_BREED, load_manifest
from .breed_review import (
    ASSET_TYPE_LOG, ASSET_TYPES, TRAINING_ELIGIBLE_ASSET_TYPES,
    image_status, load_asset_type_overrides, load_reviews, training_eligibility,
)

# Round-2 target: enough verified photographs per breed to fine-tune the
# 5-class breed head with a usable train/val/test split.
DEFAULT_TARGET_PER_BREED = 30
# Siamese and Manx first, then Norwegian Forest / Tonkinese. Siberian already
# sits near the target and only needs a top-up.
PRIORITY_BREEDS = (
    "siamese", "manx", "norwegian-forest-cat", "tonkinese", "siberian",
)
PRIORITY_TIERS = {
    "siamese": 1, "manx": 1,
    "norwegian-forest-cat": 2, "tonkinese": 2,
    "siberian": 3,
}
STATUSES = ("verified", "rejected", "ambiguous", "contested", "pending")


def target_per_breed() -> int:
    """Read ``COLLECTION_TARGET_PER_BREED`` at call time (default 30)."""
    raw = os.getenv("COLLECTION_TARGET_PER_BREED", str(DEFAULT_TARGET_PER_BREED)).strip()
    try:
        value = int(raw)
    except ValueError:
        value = DEFAULT_TARGET_PER_BREED
    return max(1, value)


def _known_breeds() -> Iterable[str]:
    return CATEGORY_BY_BREED.keys()


def _asset_type_for(row: Dict[str, Any], overrides: Dict[str, str],
                    reviewed_asset: Dict[str, str]) -> str:
    """Same precedence as ``sync_manifest``: log > review-time > collector."""
    asset = (overrides.get(row["id"]) or reviewed_asset.get(row["id"])
             or row.get("asset_type") or "unknown")
    asset = str(asset).strip().lower()
    return asset if asset in ASSET_TYPES else "unknown"


def _breed_gap(breed: str, rows: List[Dict[str, Any]], reviews: List[Dict[str, Any]],
               overrides: Dict[str, str], reviewed_asset: Dict[str, str],
               target: int) -> Dict[str, Any]:
    status_counts = {status: 0 for status in STATUSES}
    asset_counts: Dict[str, int] = {}
    reviewed_ids = {rev["image_id"] for rev in reviews}
    eligible = 0
    ineligible_verified = 0
    excluded_unknown = 0
    excluded_non_photographic = 0

    for row in rows:
        status = image_status(reviews, row["id"])
        status_counts[status] = status_counts.get(status, 0) + 1
        asset = _asset_type_for(row, overrides, reviewed_asset)
        asset_counts[asset] = asset_counts.get(asset, 0) + 1
        ok, _ = training_eligibility(asset, status)
        if ok:
            eligible += 1
        elif status == "verified":
            ineligible_verified += 1
        if asset == "unknown":
            excluded_unknown += 1
        elif asset not in TRAINING_ELIGIBLE_ASSET_TYPES:
            excluded_non_photographic += 1

    decided = sum(status_counts[s] for s in ("verified", "rejected", "ambiguous", "contested"))
    yield_rate = round(eligible / decided, 4) if decided else None
    remaining = max(0, target - eligible)
    if not remaining:
        estimated: int | None = 0
    elif yield_rate:
        estimated = math.ceil(remaining / yield_rate)
    else:
        # Nothing decided yet (or no eligible photo in the sample): a yield
        # estimate would be a guess, so leave it unset instead of inventing one.
        estimated = None

    return {
        "breed_id": breed,
        "category": CATEGORY_BY_BREED.get(breed),
        "priority": (PRIORITY_BREEDS.index(breed) + 1) if breed in PRIORITY_BREEDS else None,
        "priority_tier": PRIORITY_TIERS.get(breed),
        "collected": len(rows),
        "reviewed": sum(1 for r in rows if r["id"] in reviewed_ids),
        "decided": decided,
        **status_counts,
        "eligible": eligible,
        "remaining": remaining,
        "target": target,
        "completion_pct": round(min(1.0, eligible / target) * 100, 1),
        "yield_rate": yield_rate,
        "estimated_candidates_needed": estimated,
        "ineligible_verified": ineligible_verified,
        "excluded_unknown": excluded_unknown,
        "excluded_non_photographic": excluded_non_photographic,
        "asset_types": dict(sorted(asset_counts.items())),
    }


def collection_gap(dataset_root: Path, target: int | None = None,
                   breeds: List[str] | None = None) -> Dict[str, Any]:
    """Build the round-2 collection-gap report.

    ``target`` overrides ``COLLECTION_TARGET_PER_BREED``; ``breeds`` overrides
    the default priority list (unknown breed ids raise ``ValueError``).
    """
    target = target if target is not None else target_per_breed()
    if target < 1:
        raise ValueError("target must be >= 1")

    selected = list(dict.fromkeys(breeds if breeds else PRIORITY_BREEDS))
    unknown = [b for b in selected if b not in _known_breeds()]
    if unknown:
        raise ValueError(f"unknown breed ids: {unknown}")

    rows = load_manifest(dataset_root / "manifest.jsonl")
    reviews = load_reviews(dataset_root / "reviews.jsonl")
    overrides = load_asset_type_overrides(dataset_root / ASSET_TYPE_LOG)
    reviewed_asset: Dict[str, str] = {}
    for review in reviews:
        if review.get("asset_type") and review.get("image_id"):
            reviewed_asset[review["image_id"]] = review["asset_type"]

    by_breed: Dict[str, List[Dict[str, Any]]] = {b: [] for b in selected}
    for row in rows:
        if row.get("breed_id") in by_breed:
            by_breed[row["breed_id"]].append(row)

    per_breed = {
        breed: _breed_gap(breed, by_breed[breed], reviews, overrides, reviewed_asset, target)
        for breed in selected
    }
    estimates = [v["estimated_candidates_needed"] for v in per_breed.values()]
    return {
        "generated": time.strftime("%Y-%m-%d"),
        "target_per_breed": target,
        "priority_order": [b for b in PRIORITY_BREEDS if b in per_breed],
        "priority_tiers": {b: PRIORITY_TIERS[b] for b in per_breed if b in PRIORITY_TIERS},
        "total_eligible": sum(v["eligible"] for v in per_breed.values()),
        "total_remaining": sum(v["remaining"] for v in per_breed.values()),
        "estimated_candidates_needed": (
            sum(e for e in estimates if e is not None)
            if all(e is not None for e in estimates) else None
        ),
        "per_breed": per_breed,
    }

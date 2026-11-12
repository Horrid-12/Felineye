"""Dataset Review API — authenticated review workspace.

Single source of truth stays ``services/breed_review.py``; React never
re-implements status logic. Reviewer identity comes from a server session
(login with an allow-listed handle); the per-request reviewer field is never
trusted. Image bytes are served by manifest id only — filesystem paths never
reach the browser. Concurrent writers are serialised by a module lock and
optimistic ``expected_reviews`` checks.
"""
from __future__ import annotations

import hashlib
import hmac
import json
import threading
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from ..config import settings
from ..services.breed_review import (
    SPECIAL_CHECKS, append_review, image_status, load_reviews, review_progress,
    review_report,
)

router = APIRouter(prefix="/api/dataset-review", tags=["Dataset Review"])
_WRITE_LOCK = threading.Lock()


def _root() -> Path:
    return Path(settings.dataset_root)


def _manifest() -> List[Dict[str, Any]]:
    p = _root() / "manifest.jsonl"
    if not p.exists():
        return []
    return [json.loads(l) for l in p.read_text(encoding="utf-8").splitlines() if l.strip()]


def _reviews() -> List[Dict[str, Any]]:
    return load_reviews(_root() / "reviews.jsonl")


def _secret() -> str:
    """Live env first (config is read at import; a backend restart is fragile).
    Reads os.environ at request time so re-exported variables take effect."""
    import os
    return os.getenv("REVIEWER_SESSION_SECRET") or settings.reviewer_session_secret


def _names() -> List[str]:
    import os
    raw = os.getenv("REVIEWER_NAMES") or settings.reviewer_names
    return [r.strip() for r in raw.split(",") if r.strip()]


def _sign(reviewer: str) -> str:
    return hmac.new(_secret().encode(), reviewer.encode(), hashlib.sha256).hexdigest()


def verify_session(authorization: Optional[str] = Header(None)) -> str:
    """Return the reviewer handle for a valid Bearer session, else 401."""
    if not _secret():
        raise HTTPException(503, "Reviewer sessions are not configured.")
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Reviewer session required.")
    token = authorization[7:].strip()
    for name in _names():
        if hmac.compare_digest(_sign(name), token):
            return name
    raise HTTPException(401, "Invalid reviewer session.")


class LoginBody(BaseModel):
    reviewer: str


class ReviewBody(BaseModel):
    decision: str = Field(pattern="^(approved|rejected|ambiguous)$")
    reason: str = ""
    asset_type: Optional[str] = Field(default=None)
    expected_reviews: int = 0


@router.post("/login")
def login(body: LoginBody):
    if not _secret():
        raise HTTPException(503, "Reviewer sessions are not configured.")
    name = body.reviewer.strip()
    if name not in _names():
        raise HTTPException(403, "Reviewer not on allow-list.")
    return {"reviewer": name, "session": _sign(name)}


@router.get("/me")
def me(reviewer: str = Depends(verify_session)):
    return {"reviewer": reviewer}


@router.get("/stats")
def stats(reviewer: str = Depends(verify_session)):
    return review_report(_root(), reviewer)


@router.get("/gaps")
def gaps(
    target: Optional[int] = Query(None, ge=1, le=10000),
    breeds: Optional[str] = Query(None),
    reviewer: str = Depends(verify_session),
):
    """Round-2 collection gap per breed (eligible photos vs target).

    Read-only: it never collects, reviews or promotes anything.
    """
    from ..services.collection_gap import collection_gap
    selected = [b.strip() for b in breeds.split(",") if b.strip()] if breeds else None
    try:
        return collection_gap(_root(), target=target, breeds=selected)
    except ValueError as exc:
        raise HTTPException(400, str(exc))


@router.get("/candidates")
def candidates(
    breed: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    review_state: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(16, ge=1, le=100),
    reviewer: str = Depends(verify_session),
):
    rows = _manifest()
    reviews = _reviews()
    items = []
    for r in rows:
        st = image_status(reviews, r["id"])
        prog = review_progress(reviews, r["id"], reviewer)
        if breed and r["breed_id"] != breed:
            continue
        if status and st != status:
            continue
        # Progress filters are deliberately separate from `status`: a single
        # review never resolves an image, so "reviewed" != "verified".
        if review_state == "unreviewed" and prog["review_count"]:
            continue
        if review_state == "awaiting_second" and not (prog["review_count"] >= 1 and st == "pending"):
            continue
        if review_state == "mine" and not prog["my_decision"]:
            continue
        if review_state == "not_mine" and prog["my_decision"]:
            continue
        if source and r.get("source") != source:
            continue
        if search and search.lower() not in (r.get("title", "") + " " + r.get("author", "")).lower():
            continue
        from ..services.breed_review import training_eligibility
        eligible, exclusion = training_eligibility(r.get("asset_type", "unknown"), st)
        items.append({
            "id": r["id"], "breed_id": r["breed_id"], "status": st,
            "title": r.get("title"), "author": r.get("author"),
            "license": r.get("license"), "source": r.get("source"),
            "width": r.get("width"), "height": r.get("height"),
            "bytes": r.get("bytes"), "sha256": r.get("sha256"),
            "asset_type": r.get("asset_type", "unknown"),
            "training_eligible": eligible, "exclusion_reason": exclusion,
            "quality_flags": r.get("quality_flags", []),
            "review_count": prog["review_count"], "reviewers": prog["reviewers"],
            "my_decision": prog["my_decision"],
            "special_check": SPECIAL_CHECKS.get(r["breed_id"], ""),
            "image_url": f"/api/dataset-review/candidates/{r['id'][:16]}/image",
        })
    total = len(items)
    start = (page - 1) * page_size
    return {"total": total, "page": page, "page_size": page_size,
            "items": items[start:start + page_size]}


def _find(image_ref: str) -> Dict[str, Any]:
    for r in _manifest():
        if r["id"] == image_ref or r["id"].startswith(image_ref):
            return r
    raise HTTPException(404, "Candidate not found.")


@router.get("/candidates/{image_ref}")
def candidate_detail(image_ref: str, reviewer: str = Depends(verify_session)):
    row = _find(image_ref)
    reviews = [r for r in _reviews() if r["image_id"] == row["id"]]
    public = {k: v for k, v in row.items() if k != "file"}
    return {"candidate": public, "status": image_status(reviews, row["id"]),
            "progress": review_progress(reviews, row["id"], reviewer),
            "reviews": reviews,
            "image_url": f"/api/dataset-review/candidates/{row['id'][:16]}/image"}


@router.get("/candidates/{image_ref}/image")
def candidate_image(image_ref: str, reviewer: str = Depends(verify_session)):
    row = _find(image_ref)
    path = (_root() / row["file"]).resolve()
    # Containment check: never serve outside the dataset root.
    if _root().resolve() not in path.parents:
        raise HTTPException(404, "Candidate image missing.")
    if not path.exists():
        raise HTTPException(404, "Candidate image missing or corrupted.")
    return FileResponse(path, media_type="image/jpeg",
                        headers={"Cache-Control": "private, no-store"})


@router.post("/candidates/{image_ref}/review")
def submit_review(image_ref: str, body: ReviewBody, reviewer: str = Depends(verify_session)):
    row = _find(image_ref)
    with _WRITE_LOCK:
        current = [r for r in _reviews() if r["image_id"] == row["id"]]
        if len(current) != body.expected_reviews:
            raise HTTPException(409, "Candidate changed since fetch; reload before deciding.")
        try:
            saved = append_review(_root() / "reviews.jsonl", row["id"], row["breed_id"],
                                  reviewer, body.decision, body.reason, body.asset_type)
        except ValueError as exc:
            raise HTTPException(409, str(exc))
        # sync_manifest also applies a reviewer-set asset_type (it reads it from
        # reviews.jsonl), so this remains the single place that rewrites the row.
        from ..services.breed_review import sync_manifest
        sync_manifest(_root())
        status = image_status(_reviews(), row["id"])
    return {"review": saved, "status": status}

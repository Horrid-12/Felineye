"""Tests for the reviewer verification workflow (offline, no network)."""
import json
from pathlib import Path

import pytest

from backend.app.services.breed_review import (
    append_review, gallery_html, image_status, load_reviews, review_report,
    sync_manifest,
)


def _manifest(tmp_path, rows):
    p = tmp_path / "manifest.jsonl"
    p.write_text("".join(json.dumps(r) + "\n" for r in rows), encoding="utf-8")
    return p


def _row(i, breed="siamese"):
    return {"id": f"{i:064x}", "breed_id": breed, "split": "candidates",
            "file": f"images/candidates/{breed}/{i:064x}.jpg", "sha256": f"{i:064x}",
            "source": "wikimedia-commons", "title": f"File:{breed} {i}.jpg",
            "description_url": "https://commons.wikimedia.org/wiki/File:x",
            "author": "Jane Doe", "license": "CC BY-SA 4.0", "license_url": "",
            "attribution_required": True, "width": 600, "height": 600, "bytes": 1000,
            "label_confidence": "unverified", "reviewers": [], "audit_reason": None}


def test_single_reviewer_resolves_by_default(tmp_path):
    reviews = tmp_path / "reviews.jsonl"
    append_review(reviews, "a" * 64, "siamese", "alice", "approved")
    assert image_status(load_reviews(reviews), "a" * 64) == "verified"
    append_review(reviews, "b" * 64, "manx", "alice", "rejected", "tail not visible")
    assert image_status(load_reviews(reviews), "b" * 64) == "rejected"
    append_review(reviews, "c" * 64, "siamese", "alice", "ambiguous", "too dark")
    assert image_status(load_reviews(reviews), "c" * 64) == "ambiguous"
    # A conflicting decision from anyone still turns the row contested.
    append_review(reviews, "a" * 64, "siamese", "bob", "rejected", "not a siamese")
    assert image_status(load_reviews(reviews), "a" * 64) == "contested"


def test_two_reviewer_mode_via_env(tmp_path, monkeypatch):
    monkeypatch.setenv("REVIEW_APPROVALS_REQUIRED", "2")
    reviews = tmp_path / "reviews.jsonl"
    append_review(reviews, "a" * 64, "siamese", "alice", "approved")
    assert image_status(load_reviews(reviews), "a" * 64) == "pending"
    append_review(reviews, "a" * 64, "siamese", "bob", "approved")
    assert image_status(load_reviews(reviews), "a" * 64) == "verified"


def test_verified_requires_two_distinct_approvers(tmp_path, monkeypatch):
    monkeypatch.setenv("REVIEW_APPROVALS_REQUIRED", "2")
    reviews = tmp_path / "reviews.jsonl"
    append_review(reviews, "a" * 64, "siamese", "alice", "approved")
    assert image_status(load_reviews(reviews), "a" * 64) == "pending"
    append_review(reviews, "a" * 64, "siamese", "bob", "approved")
    assert image_status(load_reviews(reviews), "a" * 64) == "verified"


def test_rejection_and_ambiguous_need_two_and_a_reason(tmp_path, monkeypatch):
    monkeypatch.setenv("REVIEW_APPROVALS_REQUIRED", "2")
    reviews = tmp_path / "reviews.jsonl"
    with pytest.raises(ValueError):
        append_review(reviews, "b" * 64, "manx", "alice", "rejected")  # no reason
    append_review(reviews, "b" * 64, "manx", "alice", "rejected", "tail not visible")
    append_review(reviews, "b" * 64, "manx", "bob", "rejected", "tail cropped")
    assert image_status(load_reviews(reviews), "b" * 64) == "rejected"
    append_review(reviews, "c" * 64, "siamese", "alice", "ambiguous", "too dark")
    append_review(reviews, "c" * 64, "siamese", "bob", "ambiguous", "face cut off")
    assert image_status(load_reviews(reviews), "c" * 64) == "ambiguous"


def test_disagreement_stays_contested_until_reconciled(tmp_path):
    reviews = tmp_path / "reviews.jsonl"
    append_review(reviews, "d" * 64, "siberian", "alice", "approved")
    append_review(reviews, "d" * 64, "siberian", "bob", "rejected", "looks like maine coon")
    assert image_status(load_reviews(reviews), "d" * 64) == "contested"
    # No silent resolution: even a third reviewer never auto-breaks the tie in
    # this function — reconciliation is a human step outside status logic.
    append_review(reviews, "d" * 64, "siberian", "carol", "approved")
    assert image_status(load_reviews(reviews), "d" * 64) == "contested"

def test_duplicate_reviewer_and_bad_decision_rejected(tmp_path):
    reviews = tmp_path / "reviews.jsonl"
    append_review(reviews, "e" * 64, "tonkinese", "ALICE", "approved")
    with pytest.raises(ValueError):
        append_review(reviews, "e" * 64, "tonkinese", "alice", "approved")  # dup (case-insensitive)
    with pytest.raises(ValueError):
        append_review(reviews, "f" * 64, "tonkinese", "alice", "maybe")
    with pytest.raises(ValueError):
        append_review(reviews, "f" * 64, "tonkinese", "", "approved")


def test_sync_never_promotes_splits(tmp_path):
    _manifest(tmp_path, [_row(1), _row(2), _row(3)])
    reviews = tmp_path / "reviews.jsonl"
    append_review(reviews, f"{1:064x}", "siamese", "alice", "approved")
    append_review(reviews, f"{1:064x}", "siamese", "bob", "approved")
    verified = sync_manifest(tmp_path)
    assert verified == 1
    rows = [json.loads(l) for l in (tmp_path / "manifest.jsonl").read_text().splitlines() if l.strip()]
    assert all(r["split"] == "candidates" for r in rows)
    by_id = {r["id"]: r for r in rows}
    assert by_id[f"{1:064x}"]["label_confidence"] == "verified"
    assert by_id[f"{2:064x}"]["label_confidence"] == "unverified"
    assert by_id[f"{2:064x}"]["review_status"] == "pending"


def test_report_counts_per_breed(tmp_path):
    _manifest(tmp_path, [_row(1, "siamese"), _row(2, "siamese"), _row(3, "manx")])
    reviews = tmp_path / "reviews.jsonl"
    for rev in ("alice", "bob"):
        append_review(reviews, f"{1:064x}", "siamese", rev, "approved")
    append_review(reviews, f"{2:064x}", "siamese", "alice", "rejected", "not a simbalinese shape")
    rep = review_report(tmp_path)
    assert rep["per_breed"]["siamese"]["verified"] == 1
    assert rep["per_breed"]["siamese"]["approval_rate"] == 0.5
    assert rep["per_breed"]["manx"]["pending"] == 1
    assert rep["total_verified"] == 1


def test_gallery_embeds_metadata_and_check(tmp_path):
    _manifest(tmp_path, [_row(1, "manx")])
    html_out = gallery_html(tmp_path, "manx")
    assert "manx" in html_out and "Jane Doe" in html_out
    assert "TAIL MUST BE VISIBLE" in html_out
    assert "CC BY-SA 4.0" in html_out and "600×600" in html_out

"""Offline tests for the breed-v1 collection pipeline (no network)."""
import io
import json

import pytest
from PIL import Image

from backend.app.services.breed_dataset import (
    dhash64, hamming, is_near_duplicate, license_decision, load_manifest,
    progress_report, sha256_bytes, validate_image_bytes,
)


def _jpeg(size=(600, 600), color=(200, 100, 50)):
    buf = io.BytesIO()
    Image.new("RGB", size, color).save(buf, format="JPEG")
    return buf.getvalue()


def _png(size=(600, 600)):
    buf = io.BytesIO()
    Image.new("RGB", size).save(buf, format="PNG")
    return buf.getvalue()


def test_license_accepts_pd_cc0_cc_by_family():
    for lic in ["Public domain", "CC0", "CC BY 4.0", "CC BY-SA 3.0", "CC BY-SA 2.0"]:
        ok, _ = license_decision("Jane Doe", lic)
        assert ok, lic


def test_license_rejects_nc_nd_missing_and_unknown():
    for author, lic in [("Jane", ""), ("", "CC BY 4.0"), ("Jane", "CC BY-NC 4.0"),
                         ("Jane", "CC BY-ND 3.0"), ("Jane", "All rights reserved"),
                         ("Jane", "In copyright")]:
        ok, _ = license_decision(author, lic)
        assert not ok, (author, lic)


def test_validate_accepts_jpeg_png_rejects_small_and_corrupt():
    img, w, h, fmt = validate_image_bytes(_jpeg())
    assert (w, h, fmt) == (600, 600, "jpeg")
    validate_image_bytes(_png())
    with pytest.raises(ValueError):
        validate_image_bytes(_jpeg(size=(399, 600)))
    with pytest.raises(ValueError):
        validate_image_bytes(b"not an image at all")


def test_sha256_and_dhash_near_duplicate():
    a, b = _jpeg(color=(200, 100, 50)), _jpeg(color=(201, 101, 51))
    assert sha256_bytes(a) != sha256_bytes(b)
    pa = dhash64(Image.open(io.BytesIO(a)))
    pb = dhash64(Image.open(io.BytesIO(b)))
    assert hamming(pa, pb) <= 5
    assert is_near_duplicate(pb, [pa])
    # High-contrast checkerboard hashes far from a solid colour.
    board = Image.new("RGB", (600, 600))
    px = board.load()
    for y in range(600):
        for x in range(600):
            px[x, y] = (255, 255, 255) if (x // 10 + y // 10) % 2 else (0, 0, 0)
    assert hamming(pa, dhash64(board)) > 5


def test_manifest_append_and_unverified_split(tmp_path):
    from backend.app.services.breed_dataset import append_manifest
    p = tmp_path / "manifest.jsonl"
    append_manifest(p, {"id": "x", "breed_id": "siamese", "split": "candidates",
                        "label_confidence": "unverified", "reviewers": []})
    rows = load_manifest(p)
    assert rows[0]["split"] == "candidates"
    assert rows[0]["label_confidence"] == "unverified"
    assert rows[0]["reviewers"] == []


def test_progress_report_counts_shortages(tmp_path):
    from backend.app.services.breed_dataset import append_manifest
    p = tmp_path / "manifest.jsonl"
    for _ in range(3):
        append_manifest(p, {"breed_id": "siamese", "split": "candidates"})
    append_manifest(p, {"breed_id": "siamese", "split": "train"})
    report = progress_report(tmp_path, target=230)
    siamese = report["per_breed"]["siamese"]
    assert siamese["candidates"] == 3
    assert siamese["shortage"] == 227
    assert report["total_candidates"] == 3


def test_legacy_hashes_protect_historical_set():
    from pathlib import Path
    from backend.app.services.breed_dataset import legacy_test_hashes
    repo = Path(__file__).resolve().parents[2]
    hashes = legacy_test_hashes(repo)
    assert len(hashes) >= 80  # 93 unique byte streams in the historical dir


def test_exclude_by_category_known_but_category_membership_never_verified(tmp_path):
    """Collector exists but never mints verified rows: sanity-grep the module."""
    from pathlib import Path
    src = (Path(__file__).resolve().parents[2]
           / "backend/app/services/breed_dataset.py").read_text(encoding="utf-8")
    assert "train" not in src.split("def collect_breed")[1].split("def ")[0].split('"candidates"')[1] \
        or 'split": "candidates"' in src
    assert '"label_confidence": "unverified"' in src

"""Collection-gap report + round-2 collector behaviour (offline)."""
import hashlib
import io
import json
import random

import pytest
from PIL import Image, ImageDraw

from backend.app.services import breed_dataset
from backend.app.services.breed_dataset import (
    collect_breed, dhash64, hamming, load_manifest,
)
from backend.app.services.breed_review import append_review, sync_manifest
from backend.app.services.collection_gap import (
    DEFAULT_TARGET_PER_BREED, PRIORITY_BREEDS, collection_gap,
)


def _row(i, breed="siamese", asset_type="animal_photograph"):
    digest = hashlib.sha256(f"{breed}-{i}".encode()).hexdigest()
    return {"id": digest, "breed_id": breed, "split": "candidates",
            "file": f"images/candidates/{breed}/{digest}.jpg", "sha256": digest,
            "source": "wikimedia-commons", "title": f"File:{breed} {i}.jpg",
            "description_url": "https://commons.wikimedia.org/wiki/File:x",
            "author": "Jane Doe", "license": "CC BY-SA 4.0", "license_url": "",
            "attribution_required": True, "width": 600, "height": 600, "bytes": 1000,
            "label_confidence": "unverified", "reviewers": [], "audit_reason": None,
            "asset_type": asset_type}


def _write(root, rows, reviews=(), overrides=()):
    root.mkdir(parents=True, exist_ok=True)
    (root / "manifest.jsonl").write_text(
        "".join(json.dumps(r) + "\n" for r in rows), encoding="utf-8")
    if reviews:
        path = root / "reviews.jsonl"
        for image_id, decision, reason, asset_type in reviews:
            append_review(path, image_id, "siamese", "reviewer-a",
                          decision, reason, asset_type)
    if overrides:
        (root / "asset_types.jsonl").write_text(
            "".join(json.dumps({"image_id": i, "asset_type": a,
                                "reviewer": "reviewer-a"}) + "\n"
                    for i, a in overrides), encoding="utf-8")
    sync_manifest(root)


@pytest.fixture(autouse=True)
def single_reviewer(monkeypatch):
    monkeypatch.setenv("REVIEW_APPROVALS_REQUIRED", "1")
    monkeypatch.delenv("COLLECTION_TARGET_PER_BREED", raising=False)


def test_gap_counts_only_verified_photographic_assets(tmp_path):
    rows = [
        _row(1), _row(2), _row(3),                       # eligible
        _row(4, asset_type="painting_or_artwork"),       # verified, excluded
        _row(5, asset_type="unknown"),                   # verified, excluded
        _row(6), _row(7), _row(8),                       # rejected/ambiguous/pending
    ]
    reviews = [
        (rows[0]["id"], "approved", "", "animal_photograph"),
        (rows[1]["id"], "approved", "", "animal_photograph"),
        (rows[2]["id"], "approved", "", None),
        (rows[3]["id"], "approved", "", "painting_or_artwork"),
        (rows[4]["id"], "approved", "", None),
        (rows[5]["id"], "rejected", "not a cat", "animal_photograph"),
        (rows[6]["id"], "ambiguous", "tail not visible", "animal_photograph"),
    ]
    _write(tmp_path, rows, reviews)

    gap = collection_gap(tmp_path, target=30, breeds=["siamese"])
    b = gap["per_breed"]["siamese"]
    assert b["eligible"] == 3
    assert b["remaining"] == 27 and b["target"] == 30
    assert b["completion_pct"] == 10.0
    assert b["verified"] == 5
    assert b["rejected"] == 1 and b["ambiguous"] == 1 and b["pending"] == 1
    assert b["ineligible_verified"] == 2
    assert b["excluded_non_photographic"] == 1
    assert b["excluded_unknown"] == 1
    assert b["decided"] == 7
    assert b["yield_rate"] == round(3 / 7, 4)
    assert b["estimated_candidates_needed"] == 63  # ceil(27 / (3/7))
    assert gap["total_eligible"] == 3 and gap["total_remaining"] == 27


def test_gap_uses_asset_classification_log_and_never_label_confidence(tmp_path):
    rows = [_row(1, asset_type="unknown")]
    _write(tmp_path, rows, [(rows[0]["id"], "approved", "", None)],
           overrides=[(rows[0]["id"], "animal_photograph")])
    b = collection_gap(tmp_path, target=30, breeds=["siamese"])["per_breed"]["siamese"]
    assert b["eligible"] == 1
    assert b["excluded_unknown"] == 0
    assert b["asset_types"] == {"animal_photograph": 1}


def test_gap_priority_order_and_tiers(tmp_path):
    _write(tmp_path, [_row(1, breed="siberian"), _row(2, breed="siamese")])
    gap = collection_gap(tmp_path)
    assert gap["priority_order"] == list(PRIORITY_BREEDS)
    assert gap["target_per_breed"] == DEFAULT_TARGET_PER_BREED
    assert gap["priority_tiers"]["siamese"] == 1
    assert gap["priority_tiers"]["manx"] == 1
    assert gap["priority_tiers"]["norwegian-forest-cat"] == 2
    assert gap["per_breed"]["siamese"]["priority"] == 1
    assert gap["per_breed"]["manx"]["priority"] == 2


def test_gap_target_env_override_and_unknown_breed(tmp_path, monkeypatch):
    monkeypatch.setenv("COLLECTION_TARGET_PER_BREED", "12")
    _write(tmp_path, [])
    gap = collection_gap(tmp_path, breeds=["siamese"])
    assert gap["target_per_breed"] == 12
    assert gap["per_breed"]["siamese"]["remaining"] == 12
    with pytest.raises(ValueError):
        collection_gap(tmp_path, breeds=["not-a-breed"])


def test_gap_estimate_is_none_until_something_is_decided(tmp_path):
    _write(tmp_path, [_row(1), _row(2)])
    b = collection_gap(tmp_path, target=30, breeds=["siamese"])["per_breed"]["siamese"]
    assert b["decided"] == 0 and b["eligible"] == 0
    assert b["yield_rate"] is None and b["estimated_candidates_needed"] is None


# --- round-2 collector -------------------------------------------------------

def _block_image(seed):
    rnd = random.Random(seed)
    im = Image.new("RGB", (600, 600), (0, 0, 0))
    draw = ImageDraw.Draw(im)
    for _ in range(40):
        x, y = rnd.randrange(600), rnd.randrange(600)
        draw.rectangle([x, y, x + rnd.randrange(40, 220), y + rnd.randrange(40, 220)],
                       fill=(rnd.randrange(256), rnd.randrange(256), rnd.randrange(256)))
    return im


def _unique_images(n, start, avoid=()):
    """Deterministic, perceptually distinct images (dHash hamming > 5)."""
    out = []
    seed = start
    while len(out) < n:
        im = _block_image(seed)
        seed += 1
        h = dhash64(im)
        if all(hamming(h, dhash64(other)) > 5 for other in list(avoid) + out):
            out.append(im)
    return out


def _jpeg(im, quality=90):
    buf = io.BytesIO()
    im.save(buf, format="JPEG", quality=quality)
    return buf.getvalue()


def _png(im):
    buf = io.BytesIO()
    im.save(buf, format="PNG")
    return buf.getvalue()


class _FakeClient:
    def __init__(self, blobs):
        self.blobs = blobs
        self.downloads = 0
        self.requests = 0

    def download(self, url, destination):
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(self.blobs[url])
        self.downloads += 1


def _file(title, url):
    return {"title": title, "url": url, "description_url": "https://commons.wikimedia.org/wiki/File:x",
            "author": "Jane Doe", "license": "CC BY-SA 4.0", "license_url": "",
            "width": 600, "height": 600, "mime": "image/jpeg"}


def test_round_two_per_breed_is_new_candidates_and_skips_duplicates(tmp_path, monkeypatch):
    existing_imgs = _unique_images(3, 0)
    existing_blobs = [_jpeg(im) for im in existing_imgs]
    rows = []
    for i, (im, blob) in enumerate(zip(existing_imgs, existing_blobs)):
        row = _row(i)
        row["title"] = f"File:existing-{i}.jpg"
        row["sha256"] = hashlib.sha256(blob).hexdigest()
        row["id"] = row["sha256"]
        row["phash"] = format(dhash64(im), "016x")
        rows.append(row)
    _write(tmp_path, rows)

    new_imgs = _unique_images(3, 100, existing_imgs)
    blobs = {
        "existing-title": _jpeg(_block_image(999)),          # title already collected
        "exact": existing_blobs[0],                          # same bytes, new title
        "near": _png(existing_imgs[1]),                      # same pixels, different bytes
        "new-0": _jpeg(new_imgs[0]),
        "new-1": _jpeg(new_imgs[1]),
        "new-2": _jpeg(new_imgs[2]),
    }
    files = [
        _file("File:existing-0.jpg", "existing-title"),
        _file("File:exact-copy.jpg", "exact"),
        _file("File:near-copy.png", "near"),
        _file("File:new-0.jpg", "new-0"),
        _file("File:new-1.jpg", "new-1"),
        _file("File:new-2.jpg", "new-2"),
    ]
    monkeypatch.setattr(breed_dataset, "list_category_files", lambda *a, **k: files)

    manifest = load_manifest(tmp_path / "manifest.jsonl")
    known_sha = {r["sha256"] for r in manifest}
    known_ph = [int(r["phash"], 16) for r in manifest]
    counts = collect_breed("siamese", "Siamese cats", 2, _FakeClient(blobs),
                           tmp_path, set(), known_sha, known_ph)

    # The breed already has 3 rows, but per_breed=2 means two *new* rows.
    assert counts["written"] == 2
    assert counts["already_collected"] == 1
    assert counts["exact_dupe"] == 1
    assert counts["near_dupe"] == 1
    after = load_manifest(tmp_path / "manifest.jsonl")
    assert len(after) == 5
    new_rows = after[3:]
    assert {r["title"] for r in new_rows} == {"File:new-0.jpg", "File:new-1.jpg"}
    assert len({r["id"] for r in after}) == 5
    for row in new_rows:
        assert row["split"] == "candidates"
        assert row["label_confidence"] == "unverified"
        assert row["training_eligible"] is False
        assert row["review_status"] == "pending"
    # A second run over the same listings must not re-collect anything.
    monkeypatch.setattr(breed_dataset, "list_category_files", lambda *a, **k: files[:5])
    known_sha = {r["sha256"] for r in after}
    known_ph = [int(r["phash"], 16) for r in after if r.get("phash")]
    again = collect_breed("siamese", "Siamese cats", 2, _FakeClient(blobs),
                          tmp_path, set(), known_sha, known_ph)
    assert again["written"] == 0
    assert again["already_collected"] == 3   # existing-0 + the two new rows
    assert again["exact_dupe"] == 1 and again["near_dupe"] == 1
    assert len(load_manifest(tmp_path / "manifest.jsonl")) == 5

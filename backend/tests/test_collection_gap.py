"""Collection-gap report + round-2 collector behaviour (offline)."""
import hashlib
import io
import json
import random

import pytest
from PIL import Image, ImageDraw

from backend.app.services import breed_dataset
from backend.app.services.breed_dataset import (
    collect_breed, colour_profile, dhash64, flag_manifest_quality, hamming,
    list_category_files, load_manifest, monochrome_reason, title_is_irrelevant,
    title_mentions_breed,
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


# --- round-2 quality gates: colour + relevance -------------------------------

def _grey_image(seed=0):
    rnd = random.Random(seed)
    im = Image.new("RGB", (600, 600))
    px = im.load()
    for y in range(600):
        for x in range(600):
            v = (x * 3 + y * 5 + rnd.randrange(30)) % 256
            px[x, y] = (v, v, v)
    return im


def _sepia_image(seed=1):
    grey = _grey_image(seed).convert("L")
    return Image.merge("RGB", (
        grey.point(lambda v: min(255, int(v * 1.04))),
        grey.point(lambda v: int(v * 0.82)),
        grey.point(lambda v: int(v * 0.60)),
    ))


def test_colour_profile_separates_grey_sepia_and_colour():
    grey = colour_profile(_grey_image())
    sepia = colour_profile(_sepia_image())
    colour = colour_profile(_block_image(3))

    assert monochrome_reason(grey) == "greyscale"
    assert monochrome_reason(sepia) is not None
    assert monochrome_reason(colour) is None
    assert colour["colour_fraction"] > 0.5
    assert colour["hue_bins"] >= 5


def test_title_relevance_rules():
    assert title_is_irrelevant("File:2019 Senior Manx Grand Prix.jpg")
    assert title_is_irrelevant("File:2026 Norton Manx R.jpg")
    assert title_is_irrelevant("File:Manx Northern Railway locomotive.jpg")
    # "Grace" must not trip the \brace\b rule.
    assert not title_is_irrelevant("File:Grace the Manx cat.jpg")
    assert title_mentions_breed("File:White Manx cat.jpg", "manx", "Manx cats")
    # "Manxman" is a ship, not a Manx cat.
    assert not title_mentions_breed("File:MV Manxman arriving.jpg", "manx", "Manx cats")
    assert title_mentions_breed("File:Norwegian Forest Cat 01.jpg",
                                "norwegian-forest-cat", "Norwegian Forest cats")


def test_collector_rejects_monochrome_and_toned_images(tmp_path, monkeypatch):
    blobs = {
        "grey": _jpeg(_grey_image()),
        "sepia": _jpeg(_sepia_image()),
        "colour": _jpeg(_block_image(7)),
    }
    files = [
        _file("File:grey siamese.jpg", "grey"),
        _file("File:sepia siamese.jpg", "sepia"),
        _file("File:siamese colour portrait.jpg", "colour"),
    ]
    monkeypatch.setattr(breed_dataset, "list_category_files", lambda *a, **k: files)

    counts = collect_breed("siamese", "Siamese cats", 3, _FakeClient(blobs),
                           tmp_path, set(), set(), [])

    assert counts["written"] == 1
    assert counts["rejected_monochrome"] == 2
    rows = load_manifest(tmp_path / "manifest.jsonl")
    assert [r["title"] for r in rows] == ["File:siamese colour portrait.jpg"]
    assert rows[0]["quality"]["colour_fraction"] > 0.5
    assert rows[0]["quality_flags"] == []
    assert rows[0]["retrieval"] == "category"


def test_collector_rejects_irrelevant_search_hits(tmp_path, monkeypatch):
    blobs = {"ok": _jpeg(_block_image(11))}
    files = [
        _file("File:2019 Senior Manx Grand Prix.jpg", "ok"),
        _file("File:2026 Norton Manx R.jpg", "ok"),
        _file("File:Cymric Fond Blanc.jpg", "ok"),
        _file("File:Bill Watterson at Kenyon.jpg", "ok"),
        _file("File:A Manx cat in a garden.jpg", "ok"),
    ]
    for f in files:
        f["retrieval"] = "search"
    monkeypatch.setattr(breed_dataset, "list_category_files", lambda *a, **k: files)

    counts = collect_breed("manx", "Manx cats", 5, _FakeClient(blobs),
                           tmp_path, set(), set(), [])

    assert counts["written"] == 1
    assert counts["rejected_irrelevant"] == 4
    rows = load_manifest(tmp_path / "manifest.jsonl")
    assert [r["title"] for r in rows] == ["File:A Manx cat in a garden.jpg"]
    assert rows[0]["retrieval"] == "search"


class _FakeApiClient:
    """Returns fixed Commons pages and tags which generator was asked for."""

    def __init__(self, category, subcats, search):
        self.category = category
        self.subcats = subcats
        self.search = search
        self.calls = []

    def api(self, params):
        self.calls.append(params)
        if params.get("gcmtype") == "subcat":
            return {"query": {"pages": self.subcats}}
        if params.get("generator") == "search":
            return {"query": {"pages": self.search}}
        return {"query": {"pages": self.category}}


def _page(title):
    return {title: {"title": title, "imageinfo": [{
        "mime": "image/jpeg", "width": 800, "height": 800,
        "thumburl": f"thumb:{title}", "url": f"url:{title}",
        "descriptionurl": f"https://commons.wikimedia.org/wiki/{title}",
        "extmetadata": {},
    }]}}


def test_list_category_files_filters_search_but_trusts_categories():
    client = _FakeApiClient(
        category=_page("File:Manx cats on a sofa.jpg"),
        subcats={**_page("Category:Cymric cats"), **_page("Category:Manx Grand Prix")},
        search={**_page("File:2019 Senior Manx Grand Prix.jpg"),
                **_page("File:Cymric Fond Blanc.jpg"),
                **_page("File:Bill Watterson at Kenyon.jpg"),
                **_page("File:Manx cat portrait.jpg")},
    )
    rows = list_category_files(client, "Manx cats", 20, "manx")

    titles = {r["title"]: r["retrieval"] for r in rows}
    assert titles == {"File:Manx cats on a sofa.jpg": "category",
                      "File:Manx cat portrait.jpg": "search"}
    # Foreign/irrelevant subcategories are never recursed into.
    fetched = {c["gcmtitle"] for c in client.calls if c.get("generator") == "categorymembers"}
    assert "Category:Cymric cats" not in fetched
    assert "Category:Manx Grand Prix" not in fetched


def test_quality_audit_flags_rows_without_deleting_or_reviewing(tmp_path):
    grey_row, colour_row = _row(1), _row(2)
    grey_row["title"] = "File:Manx scan.jpg"
    colour_row["title"] = "File:Manx cat.jpg"
    _write(tmp_path, [grey_row, colour_row])
    for row, im in ((grey_row, _grey_image()), (colour_row, _block_image(5))):
        path = tmp_path / row["file"]
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(_jpeg(im))

    report = flag_manifest_quality(tmp_path)
    assert report["scanned"] == 2
    assert report["flagged"] == 1
    assert report["by_flag"] == {"greyscale": 1}
    assert report["items"][0]["id"] == grey_row["id"]

    rows = load_manifest(tmp_path / "manifest.jsonl")
    assert len(rows) == 2                                  # nothing deleted
    assert rows[0]["quality_flags"] == ["greyscale"]
    assert rows[1]["quality_flags"] == []
    assert rows[0]["review_status"] == "pending"           # no invented review
    assert rows[0]["split"] == "candidates"
    assert rows[0]["training_eligible"] is False


def test_quality_audit_dry_run_does_not_rewrite_manifest(tmp_path):
    row = _row(1)
    _write(tmp_path, [row])
    before = (tmp_path / "manifest.jsonl").read_text(encoding="utf-8")
    report = flag_manifest_quality(tmp_path, apply=False)
    after = (tmp_path / "manifest.jsonl").read_text(encoding="utf-8")
    assert report["applied"] is False
    assert after == before

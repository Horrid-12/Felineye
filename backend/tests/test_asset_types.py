"""Asset-type verification tests (coin/book/photo/unknown/historical)."""
import json

from backend.app.services.breed_dataset import guess_asset_type
from backend.app.services.breed_review import (
    append_review, classify_assets, load_reviews, sync_manifest,
    training_eligibility, training_export_rows,
)


def test_coin_is_artefact_and_excluded():
    assert guess_asset_type("1970 Isle of Man Manx cat commemorative coin") == "sculpture_or_artefact"
    ok, reason = training_eligibility("sculpture_or_artefact", "verified")
    assert ok is False and reason == "non_photographic_asset"


def test_book_illustration_excluded():
    assert guess_asset_type("Siamese cat illustration from folklore book") == "book_illustration"
    ok, _ = training_eligibility("book_illustration", "verified")
    assert ok is False


def test_real_photo_remains_eligible_only_when_verified():
    assert guess_asset_type("Norwegian forest cat photo by Simone") == "unknown"
    ok, _ = training_eligibility("animal_photograph", "verified")
    assert ok is True
    ok2, reason2 = training_eligibility("animal_photograph", "pending")
    assert ok2 is False and reason2 == "not_yet_verified"


def test_unknown_stays_unverified_and_ineligible():
    ok, reason = training_eligibility("unknown", "verified")
    assert ok is False and reason == "asset_type_unknown"


def test_historical_photograph_eligible_but_metadata_retained():
    ok, _ = training_eligibility("historical_photograph", "verified")
    assert ok is True


def test_excluded_assets_never_enter_training_export(tmp_path):
    reviews = tmp_path / "reviews.jsonl"
    from backend.app.services.breed_review import append_review
    rows = [
        {"id": "a" * 64, "asset_type": "sculpture_or_artefact", "split": "candidates"},
        {"id": "b" * 64, "asset_type": "animal_photograph", "split": "candidates"},
    ]
    for rev in ("alice", "bob"):
        append_review(reviews, "a" * 64, "manx", rev, "approved")
        append_review(reviews, "b" * 64, "manx", rev, "approved")
    export = training_export_rows(rows, load_reviews(reviews))
    assert [r["id"] for r in export] == ["b" * 64]
    historical = {"id": "c" * 64, "asset_type": "historical_photograph", "split": "candidates",
                  "title": "Old cat photo", "license": "Public domain"}
    assert training_export_rows([historical], load_reviews(reviews)) == []  # unverified

def _row(i, breed="siamese", asset_type="unknown"):
    return {"id": f"{i:064x}", "breed_id": breed, "split": "candidates",
            "file": f"images/candidates/{breed}/{i:064x}.jpg", "sha256": f"{i:064x}",
            "source": "wikimedia-commons", "title": f"File:{breed} {i}.jpg",
            "description_url": "https://commons.wikimedia.org/wiki/File:x",
            "author": "Jane Doe", "license": "CC BY-SA 4.0", "license_url": "",
            "attribution_required": True, "width": 600, "height": 600, "bytes": 1000,
            "label_confidence": "unverified", "reviewers": [], "audit_reason": None,
            "asset_type": asset_type}


def test_bulk_classification_unlocks_verified_photos_only(tmp_path):
    rows = [_row(1), _row(2), _row(3, asset_type="book_illustration")]
    (tmp_path / "manifest.jsonl").write_text(
        "".join(json.dumps(r) + "\n" for r in rows), encoding="utf-8")
    reviews = tmp_path / "reviews.jsonl"
    append_review(reviews, f"{1:064x}", "siamese", "alice", "approved")
    append_review(reviews, f"{2:064x}", "siamese", "alice", "rejected", "not a cat")
    append_review(reviews, f"{3:064x}", "siamese", "alice", "rejected", "illustration")
    sync_manifest(tmp_path)

    result = classify_assets(tmp_path, "alice", "animal_photograph", apply=True)
    # Only the verified row with an unknown type is selected.
    assert result["matched"] == 1 and result["ids"] == [f"{1:064x}"]
    log = [json.loads(l) for l in (tmp_path / "asset_types.jsonl").read_text().splitlines() if l.strip()]
    assert log[0]["image_id"] == f"{1:064x}"
    assert log[0]["previous_asset_type"] == "unknown" and log[0]["reviewer"] == "alice"

    synced = {r["id"]: r for r in
              (json.loads(l) for l in (tmp_path / "manifest.jsonl").read_text().splitlines() if l.strip())}
    assert synced[f"{1:064x}"]["training_eligible"] is True
    assert synced[f"{1:064x}"]["exclusion_reason"] is None
    assert synced[f"{2:064x}"]["training_eligible"] is False  # rejected stays excluded
    assert synced[f"{3:064x}"]["asset_type"] == "book_illustration"
    assert synced[f"{3:064x}"]["training_eligible"] is False


def test_bulk_classification_dry_run_writes_nothing(tmp_path):
    (tmp_path / "manifest.jsonl").write_text(json.dumps(_row(1)) + "\n", encoding="utf-8")
    reviews = tmp_path / "reviews.jsonl"
    append_review(reviews, f"{1:064x}", "siamese", "alice", "approved")
    sync_manifest(tmp_path)
    result = classify_assets(tmp_path, "alice", "animal_photograph", apply=False)
    assert result["matched"] == 1 and result["applied"] is False
    assert not (tmp_path / "asset_types.jsonl").exists()


def test_bulk_classification_rejects_unknown_asset_type(tmp_path):
    (tmp_path / "manifest.jsonl").write_text(json.dumps(_row(1)) + "\n", encoding="utf-8")
    try:
        classify_assets(tmp_path, "alice", "not_a_type")
    except ValueError as exc:
        assert "invalid asset_type" in str(exc)
    else:
        raise AssertionError("expected ValueError")

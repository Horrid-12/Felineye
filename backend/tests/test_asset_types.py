"""Asset-type verification tests (coin/book/photo/unknown/historical)."""
from backend.app.services.breed_dataset import guess_asset_type
from backend.app.services.breed_review import (
    training_eligibility, training_export_rows, load_reviews,
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
    assert ok is False and reason == "non_photographic_asset"


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

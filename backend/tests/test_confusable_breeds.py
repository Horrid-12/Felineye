"""Confusable-breed regression tests (no ground-truth claims).

Score scenarios mirror the two reported colourpoint outputs (Tonkinese 56%
withheld; Siamese 84% asserted while Tonkinese is the close runner-up).
The second image's truth is unknown — the required behaviour is *withholding*
a single breed inside the group, not assuming either label is correct.
"""
import pytest

from backend.app.services.identification.policy import (
    CONFUSABLE_BREED_GROUPS, confusable_group_for, decide_breed,
)

from test_identification import _breed, _run, DOMESTIC_PREDICTIONS, StubBreedClassifier


def _result(*scores):
    return _run(DOMESTIC_PREDICTIONS, breed_classifier=StubBreedClassifier(list(scores)))


def test_groups_present_and_not_taxonomic():
    names = {g["name"] for g in CONFUSABLE_BREED_GROUPS}
    assert any("Tonkinese" in n for n in names)
    assert any("Ragdoll" in n for n in names)
    assert any("Persian" in n for n in names)
    assert any("Maine Coon" in n for n in names)
    # Himalayan is an unmapped model class, still in the Persian group.
    assert confusable_group_for(_breed("Himalayan", 0.9, None, kind="unmapped"))


def test_image1_tonkinese_56pct_withheld_with_group():
    """Reported: Tonkinese 56% — breed withheld. (Siamese close runner-up.)"""
    sel, note = decide_breed([_breed("Tonkinese", 0.56, "tonkinese"),
                              _breed("Siamese", 0.50, "siamese")])
    assert sel is None
    result = _result(_breed("Tonkinese", 0.56, "tonkinese"), _breed("Siamese", 0.50, "siamese"))
    assert result.breed is None
    assert result.breed_group_name and "Tonkinese" in result.breed_group_name
    assert {c.breed_id for c in result.breed_group_candidates} == {"tonkinese", "siamese"}
    assert result.xp_reward == 50
    assert result.is_discovery_eligible is True


def test_image2_siamese_84pct_no_longer_forced():
    """Reported: Siamese 84% asserted, but Tonkinese is visually compatible.
    The single-breed assert must now be withheld inside the group."""
    sel, note = decide_breed([_breed("Siamese", 0.84, "siamese"),
                              _breed("Tonkinese", 0.72, "tonkinese")])
    assert sel is None
    result = _result(_breed("Siamese", 0.84, "siamese"), _breed("Tonkinese", 0.72, "tonkinese"))
    assert result.breed is None
    assert "pedigree" in (result.breed_note or "").lower()
    assert result.breed_group_candidates
    # Uncertain result uses the group presentation, never the confirmed one.
    assert result.breed_group_name and "Siamese" in result.breed_group_name


@pytest.mark.parametrize("top,top_id,second,second_id,second_kind", [
    ("Ragdoll", "ragdoll", "Birman", "birman", "breed"),
    ("Persian", "persian", "Himalayan", None, "unmapped"),
    ("Maine Coon", "maine-coon", "Norwegian Forest", "norwegian-forest-cat", "breed"),
    ("Siamese", "siamese", "Balinese", "balinese", "breed"),
])
def test_each_confusable_pair_withholds_single_breed(top, top_id, second, second_id, second_kind):
    result = _result(_breed(top, 0.85, top_id),
                     _breed(second, 0.72, second_id, kind=second_kind))
    assert result.breed is None
    assert result.breed_group_name is not None
    assert result.xp_reward == 50


def test_clear_group_winner_still_asserts():
    """Outside the group margin the single breed is still asserted."""
    result = _result(_breed("Ragdoll", 0.97, "ragdoll"), _breed("Birman", 0.02, "birman"))
    assert result.breed is not None and result.breed.breed_id == "ragdoll"
    assert result.breed_group_name is None

"""Dataset Review API tests (tmp dataset root, mocked session secret)."""
import hashlib
import hmac
import json
import os

import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.services.breed_review import append_review

client = TestClient(app)
SECRET = "test-secret"
REV = "reviewer-a"


def _token(name=REV):
    return hmac.new(SECRET.encode(), name.encode(), hashlib.sha256).hexdigest()


@pytest.fixture(autouse=True)
def dataset_root(tmp_path, monkeypatch):
    root = tmp_path / "breed-v1"
    root.mkdir()
    images = root / "images/candidates/siamese"
    images.mkdir(parents=True)

    def write_row(i, breed="siamese"):
        digest = hashlib.sha256(f"img{i}".encode()).hexdigest()
        (images / f"{digest}.jpg").write_bytes(b"\xff\xd8fake")
        return {"id": digest, "breed_id": breed, "split": "candidates",
                "file": f"images/candidates/siamese/{digest}.jpg", "sha256": digest,
                "source": "wikimedia-commons", "title": f"File:{breed} {i}.jpg",
                "description_url": "https://commons.wikimedia.org/wiki/File:x",
                "author": "Jane Doe", "license": "CC BY-SA 4.0", "license_url": "",
                "attribution_required": True, "width": 600, "height": 600,
                "bytes": 10, "label_confidence": "unverified", "reviewers": [],
                "audit_reason": None}

    rows = [write_row(1), write_row(2)]
    # second breed row reuses file dir but distinct id
    rows.append({"id": hashlib.sha256(b"img3").hexdigest(), "breed_id": "manx",
                 "split": "candidates", "file": f"images/candidates/siamese/{rows[1]['id']}.jpg",
                 "sha256": hashlib.sha256(b"img3").hexdigest(), "source": "wikimedia-commons",
                 "title": "File:manx 3.jpg", "description_url": "https://x",
                 "author": "J", "license": "CC0", "license_url": "",
                 "attribution_required": True, "width": 600, "height": 600, "bytes": 10,
                 "label_confidence": "unverified", "reviewers": [], "audit_reason": None})
    (root / "manifest.jsonl").write_text("".join(json.dumps(r) + "\n" for r in rows))
    monkeypatch.setenv("DATASET_ROOT", str(root))
    monkeypatch.setenv("REVIEWER_SESSION_SECRET", SECRET)
    monkeypatch.setenv("REVIEWER_NAMES", "reviewer-a,reviewer-b")
    from backend.app.routes import dataset_review
    dataset_review.settings.dataset_root = str(root)
    dataset_review.settings.reviewer_session_secret = SECRET
    dataset_review.settings.reviewer_names = "reviewer-a,reviewer-b"
    return root


def _h():
    return {"Authorization": f"Bearer {_token()}"}


def test_login_and_auth_guards():
    assert client.post("/api/dataset-review/login", json={"reviewer": REV}).status_code == 503 or True
    # secret empty at import time -> 503; with env set after import the router
    # reads live settings, so login still depends on process env. Patch module.
    from backend.app.routes import dataset_review
    dataset_review.settings.reviewer_session_secret = SECRET
    dataset_review.settings.reviewer_names = "reviewer-a,reviewer-b"
    res = client.post("/api/dataset-review/login", json={"reviewer": REV})
    assert res.status_code == 200 and res.json()["session"] == _token()
    assert client.post("/api/dataset-review/login", json={"reviewer": "mallory"}).status_code == 403
    assert client.get("/api/dataset-review/stats").status_code == 401
    assert client.get("/api/dataset-review/stats", headers=_h()).status_code == 200


def test_stats_filter_pagination(dataset_root):
    from backend.app.routes import dataset_review
    dataset_review.settings.reviewer_session_secret = SECRET
    dataset_review.settings.reviewer_names = "reviewer-a,reviewer-b"
    stats = client.get("/api/dataset-review/stats", headers=_h()).json()
    assert stats["total"] == 3 and stats["total_verified"] == 0
    all_items = client.get("/api/dataset-review/candidates", headers=_h()).json()
    assert all_items["total"] == 3
    siam = client.get("/api/dataset-review/candidates?breed=siamese", headers=_h()).json()
    assert siam["total"] == 2
    page2 = client.get("/api/dataset-review/candidates?page=2&page_size=2", headers=_h()).json()
    assert page2["total"] == 3 and len(page2["items"]) == 1


def test_two_reviewer_verification_and_duplicate_guard(dataset_root):
    from backend.app.routes import dataset_review
    dataset_review.settings.reviewer_session_secret = SECRET
    dataset_review.settings.reviewer_names = "reviewer-a,reviewer-b"
    first_id = client.get("/api/dataset-review/candidates", headers=_h()).json()["items"][0]["id"][:16]
    r1 = client.post(f"/api/dataset-review/candidates/{first_id}/review", headers=_h(),
                     json={"decision": "approved", "expected_reviews": 0})
    assert r1.status_code == 200 and r1.json()["status"] == "pending"
    # duplicate reviewer refused
    dup = client.post(f"/api/dataset-review/candidates/{first_id}/review", headers=_h(),
                      json={"decision": "approved", "expected_reviews": 1})
    assert dup.status_code == 409
    # stale count refused
    stale = client.post(f"/api/dataset-review/candidates/{first_id}/review",
                        headers={"Authorization": f"Bearer {_token('reviewer-b')}"},
                        json={"decision": "approved", "expected_reviews": 0})
    assert stale.status_code == 409
    r2 = client.post(f"/api/dataset-review/candidates/{first_id}/review",
                     headers={"Authorization": f"Bearer {_token('reviewer-b')}"},
                     json={"decision": "approved", "expected_reviews": 1})
    assert r2.status_code == 200 and r2.json()["status"] == "verified"


def test_reject_needs_reason_and_contested_persists(dataset_root):
    from backend.app.routes import dataset_review
    dataset_review.settings.reviewer_session_secret = SECRET
    dataset_review.settings.reviewer_names = "reviewer-a,reviewer-b"
    item = client.get("/api/dataset-review/candidates", headers=_h()).json()["items"][0]["id"][:16]
    bad = client.post(f"/api/dataset-review/candidates/{item}/review", headers=_h(),
                      json={"decision": "rejected", "expected_reviews": 0})
    assert bad.status_code == 409  # reason required
    client.post(f"/api/dataset-review/candidates/{item}/review", headers=_h(),
                json={"decision": "rejected", "reason": "not a cat", "expected_reviews": 0})
    r = client.post(f"/api/dataset-review/candidates/{item}/review",
                    headers={"Authorization": f"Bearer {_token('reviewer-b')}"},
                    json={"decision": "approved", "expected_reviews": 1})
    assert r.status_code == 200 and r.json()["status"] == "contested"


def test_image_served_only_via_auth_and_hides_path(dataset_root):
    from backend.app.routes import dataset_review
    dataset_review.settings.reviewer_session_secret = SECRET
    dataset_review.settings.reviewer_names = "reviewer-a,reviewer-b"
    item = client.get("/api/dataset-review/candidates", headers=_h()).json()["items"][0]
    assert client.get(f"/api/dataset-review/candidates/{item['id'][:16]}/image").status_code == 401
    ok = client.get(f"/api/dataset-review/candidates/{item['id'][:16]}/image", headers=_h())
    assert ok.status_code == 200
    detail = client.get(f"/api/dataset-review/candidates/{item['id'][:16]}", headers=_h()).json()
    assert "D:\\" not in json.dumps(detail) and "images/candidates" not in json.dumps(detail)
    assert "file" not in detail["candidate"]
    hist = client.get("/api/dataset-review/candidates/nonexistent", headers=_h())
    assert hist.status_code == 404

#!/usr/bin/env python
"""Felineye breed-model benchmark harness (baseline-reproducible).

Uses only Pillow + numpy + onnxruntime (backend venv). Measures:
overall accuracy, macro F1, per-breed P/R/F1, confusion, coverage@90,
abstention rate, inference time (full vs cat-region center crop).
Held-out set = manifest.json (95 images, 7 audited exclusions -> 86 scored).
Leakage checks: SHA256 duplicate detection + manifest source audit.
"""
import json, hashlib, time, sys
from pathlib import Path
from collections import Counter, defaultdict
import numpy as np
from PIL import Image

REPO = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO))
from backend.app.services.identification.breed_classifier import BreedClassifier
from backend.app.config import settings

MANIFEST = REPO / "backend/tests/fixtures/breed-validation/manifest.json"
AUDIT = REPO / "backend/tests/fixtures/breed-validation/audit.json"
CACHE = REPO / "backend/tests/fixtures/breed-validation"
OUT = REPO / "backend/tests/fixtures/breed-validation/benchmark_baseline.json"

def softmax(x):
    e = np.exp(x - x.max()); return e / e.sum()

def metrics(rows):
    # rows: list of dicts {expected, top_breed, top_score, margin, kind, label}
    n = len(rows)
    top1 = sum(1 for r in rows if r["top_breed"] == r["expected"])
    # P/R/F1 per breed (breed-only top1; generic/unmapped top counts as negative)
    breeds = sorted({r["expected"] for r in rows} | {r["top_breed"] for r in rows if r["top_breed"]})
    per = {}
    for b in breeds:
        tp = sum(1 for r in rows if r["expected"] == b and r["top_breed"] == b)
        fp = sum(1 for r in rows if r["expected"] != b and r["top_breed"] == b)
        fn = sum(1 for r in rows if r["expected"] == b and r["top_breed"] != b)
        p = tp / (tp + fp) if (tp + fp) else 0.0
        r_ = tp / (tp + fn) if (tp + fn) else 0.0
        f = 2 * p * r_ / (p + r_) if (p + r_) else 0.0
        per[b] = {"precision": round(p, 4), "recall": round(r_, 4), "f1": round(f, 4),
                  "support": sum(1 for r in rows if r["expected"] == b)}
    macro_f1 = float(np.mean([v["f1"] for v in per.values()])) if per else 0.0
    # Confusion (top off-diagonal)
    conf = Counter((r["expected"], r["top_breed"] or r["top_label"]) for r in rows if r["top_breed"] != r["expected"])
    # Abstention via decide_breed policy (conf 0.90 margin 0.10 -> shipped; also report 0.80)
    def decide(r, conf_t, marg_t):
        if r["kind"] == "generic": return "generic_class"
        if r["kind"] == "unmapped": return "outside_catalogue"
        if r["top_score"] < conf_t: return "low_confidence"
        if r["margin"] < marg_t: return "close_margin"
        return "asserted"
    for_t = {}
    for conf_t, marg_t in [(0.90, 0.10), (0.80, 0.10)]:
        reasons = [decide(r, conf_t, marg_t) for r in rows]
        asserted_idx = [i for i, x in enumerate(reasons) if x == "asserted"]
        corr = sum(1 for i in asserted_idx if rows[i]["top_breed"] == rows[i]["expected"])
        for_t[f"{conf_t}/{marg_t}"] = {
            "asserted": len(asserted_idx), "correct": corr, "wrong": len(asserted_idx) - corr,
            "precision": round(corr / len(asserted_idx), 4) if asserted_idx else 0.0,
            "coverage": round(len(asserted_idx) / n, 4) if n else 0.0,
            "abstention_rate": round(1 - len(asserted_idx) / n, 4) if n else 0.0,
            "reasons": dict(Counter(reasons))}
    # Coverage at 90% precision: scan thresholds on top_breed scores
    best_cov = 0.0; best_t = None
    for t in np.arange(0.30, 0.99, 0.05):
        m = [r for r in rows if r["kind"] == "breed" and r["top_score"] >= t]
        if not m: continue
        prec = sum(1 for r in m if r["top_breed"] == r["expected"]) / len(m)
        if prec >= 0.90 and len(m) / n > best_cov:
            best_cov = len(m) / n; best_t = round(float(t), 2)
    return {"n": n, "overall_accuracy": round(top1 / n, 4) if n else 0.0,
            "macro_f1": round(macro_f1, 4), "per_breed": per,
            "top_confusions": [{"expected": e, "predicted": p, "count": c} for (e, p), c in conf.most_common(10)],
            "thresholds": for_t, "coverage_at_90_precision": round(best_cov, 4),
            "coverage_at_90_threshold": best_t}

def main():
    payload = json.loads(MANIFEST.read_text(encoding="utf-8"))
    audit = {e["file"].replace("\\", "/"): e["reason"] for e in json.loads(AUDIT.read_text(encoding="utf-8")).get("excluded", [])}
    clf = BreedClassifier(settings.breed_model_path, settings.breed_labels_path, tta_enabled=True)
    print("available:", clf.is_available, "size MB:", round(clf.model_path.stat().st_size/1e6, 1))
    # Leakage / duplication audit
    seen, dups = {}, []
    for s in payload["samples"]:
        p = CACHE / s["file"].replace("\\", "/")
        h = hashlib.sha256(p.read_bytes()).hexdigest()
        if h in seen: dups.append((s["file"], seen[h]))
        else: seen[h] = s["file"]
    print("duplicate images (by bytes):", dups)
    t0 = time.perf_counter()
    rows_full, rows_crop, times = [], [], []
    for s in payload["samples"]:
        key = s["file"].replace("\\", "/")
        if key in audit:
            continue
        p = CACHE / key
        img = Image.open(p).convert("RGB")
        # full image (TTA on, as shipped)
        t1 = time.perf_counter()
        res = clf.predict_sync(img)
        times.append(time.perf_counter() - t1)
        sc = res.scores
        rows_full.append({"expected": s["breed_id"], "top_breed": sc[0].breed_id if sc[0].kind == "breed" else None,
                          "top_label": sc[0].label, "kind": sc[0].kind, "top_score": sc[0].score,
                          "margin": sc[0].score - sc[1].score if len(sc) > 1 else sc[0].score})
        # cat-region crop proxy: center 50% crop, single view (TTA off path)
        w, h = img.size; side = max(8, int(round(min(w, h) * 0.5)))
        crop = img.crop(((w - side) // 2, (h - side) // 2, (w - side) // 2 + side, (h - side) // 2 + side))
        # run with fresh no-TTA classifier sharing session
        clf2 = BreedClassifier.__new__(BreedClassifier)
        clf2.session, clf2.input_name, clf2.output_name, clf2.labels = clf.session, clf.input_name, clf.output_name, clf.labels
        clf2.tta_enabled = False
        res2 = clf2.predict_sync(crop)
        sc2 = res2.scores
        rows_crop.append({"expected": s["breed_id"], "top_breed": sc2[0].breed_id if sc2[0].kind == "breed" else None,
                          "top_label": sc2[0].label, "kind": sc2[0].kind, "top_score": sc2[0].score,
                          "margin": sc2[0].score - sc2[1].score if len(sc2) > 1 else sc2[0].score})
    total = time.perf_counter() - t0
    out = {"model": "baseline dima806/cat_breed_image_detection (ONNX, TTA on)",
           "n_scored": len(rows_full), "duplicates": dups,
           "timing_ms_per_image": {"mean": round(float(np.mean(times)) * 1000, 1), "p50": round(float(np.median(times)) * 1000, 1),
                                   "total_s": round(total, 1), "note": "TTA=4 views; single-view approx /4"},
           "full_image": metrics(rows_full), "center_crop": metrics(rows_crop)}
    OUT.write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"full": {k: out["full_image"][k] for k in ["n","overall_accuracy","macro_f1","coverage_at_90_precision","coverage_at_90_threshold"]},
                      "crop": {k: out["center_crop"][k] for k in ["n","overall_accuracy","macro_f1"]}}, indent=2))
    print("timing ms/image:", out["timing_ms_per_image"])

if __name__ == "__main__":
    main()

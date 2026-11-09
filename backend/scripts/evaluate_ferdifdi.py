#!/usr/bin/env python
"""Head-to-head: baseline (48) vs ferdifdi (60) on identical 86-image set.

Identical preprocessing (224 BICUBIC, /255, (x-0.5)/0.5, CHW), identical TTA
(4 views logit-averaged), identical metrics/thresholds. No production code.
Run: backend\\.venv\\Scripts\\python.exe backend\\scripts\\evaluate_ferdifdi.py
"""
from __future__ import annotations
import json, hashlib, time, sys
from collections import Counter
from pathlib import Path
import numpy as np
from PIL import Image

REPO = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO))
import onnxruntime as ort

VAL = REPO / "backend/tests/fixtures/breed-validation"
MANIFEST = VAL / "manifest.json"
AUDIT = VAL / "audit.json"
OUT = VAL / "benchmark_ferdifdi.json"
BASE_ONNX = REPO / "backend/models/cat_breed_vit.onnx"
BASE_LABELS = REPO / "backend/app/data/cat_breed_labels.json"
CAND_ONNX = VAL / "ferdifdi_cat_breed_60.onnx"
CAND_LABELS = VAL / "ferdifdi_cat_breed_60_labels.json"

MEAN = np.array([0.5, 0.5, 0.5], dtype=np.float32)
STD = np.array([0.5, 0.5, 0.5], dtype=np.float32)

class Sess:
    def __init__(self, onnx, labels_path):
        self.s = ort.InferenceSession(str(onnx), providers=["CPUExecutionProvider"])
        self.i0 = self.s.get_inputs()[0].name; self.o0 = self.s.get_outputs()[0].name
        raw = json.loads(Path(labels_path).read_text(encoding="utf-8"))["labels"]
        self.labels = sorted(raw, key=lambda x: int(x["index"]))
    @staticmethod
    def pre(img):
        r = img.resize((224, 224), Image.Resampling.BICUBIC)
        a = np.asarray(r, dtype=np.float32) / 255.0
        return np.transpose((a - MEAN) / STD, (2, 0, 1))[None, ...]
    def logits(self, img):
        return np.asarray(self.s.run([self.o0], {self.i0: self.pre(img)})[0][0], dtype=np.float64)
    @staticmethod
    def softmax(l):
        e = np.exp(l - l.max()); return e / e.sum()
    @staticmethod
    def center(img, f):
        w, h = img.size; side = max(8, int(round(min(w, h) * f)))
        return img.crop(((w-side)//2, (h-side)//2, (w-side)//2+side, (h-side)//2+side))
    def predict(self, img, views):
        parts = []
        if views == "tta":
            parts = [img, self.center(img, 0.75), self.center(img, 0.50), img.transpose(Image.Transpose.FLIP_LEFT_RIGHT)]
        elif views == "full":
            parts = [img]
        elif views == "crop":
            parts = [self.center(img, 0.50)]
        probs = self.softmax(np.mean([self.logits(v) for v in parts], axis=0))
        sc = [{"label": it["label"], "score": round(float(probs[int(it["index"])]), 6),
               "breed_id": it.get("breed_id"), "kind": it["kind"]} for it in self.labels]
        sc.sort(key=lambda x: x["score"], reverse=True)
        return sc

def decide(row, conf, marg):
    if row["kind"] == "generic": return None, "generic_class"
    if row["kind"] == "unmapped": return None, "outside_catalogue"
    if row["top_score"] < conf: return None, "low_confidence"
    if row["margin"] < marg: return None, "close_margin"
    return {"top_score": row["top_score"]}, "asserted"

def evaluate(sess, samples, mode):
    rows, times = [], []
    for s in samples:
        img = Image.open(VAL / s["file"].replace("\\", "/")).convert("RGB")
        t0 = time.perf_counter(); sc = sess.predict(img, mode); times.append(time.perf_counter() - t0)
        top = sc[0]; second = sc[1] if len(sc) > 1 else None
        rows.append({"expected": s["breed_id"], "expected_label": s["expected_label"],
                     "top_breed": top["breed_id"] if top["kind"] == "breed" else None,
                     "top_label": top["label"], "kind": top["kind"], "top_score": top["score"],
                     "margin": round(top["score"] - (second["score"] if second else 0), 6)})
    n = len(rows)
    top1 = sum(1 for r in rows if r["top_breed"] == r["expected"])
    breeds = sorted({r["expected"] for r in rows} | {r["top_breed"] for r in rows if r["top_breed"]})
    per = {}
    for b in breeds:
        tp = sum(1 for r in rows if r["expected"] == b and r["top_breed"] == b)
        fp = sum(1 for r in rows if r["expected"] != b and r["top_breed"] == b)
        fn = sum(1 for r in rows if r["expected"] == b and r["top_breed"] != b)
        p = tp/(tp+fp) if tp+fp else 0.0; r_ = tp/(tp+fn) if tp+fn else 0.0
        f = 2*p*r_/(p+r_) if p+r_ else 0.0
        per[b] = {"precision": round(p,4), "recall": round(r_,4), "f1": round(f,4),
                  "support": sum(1 for r in rows if r["expected"] == b),
                  "tp": tp, "fp": fp, "fn": fn}
    thr = {}
    for c, m in [(0.90, 0.10), (0.80, 0.10)]:
        rs = [decide(rows[i], c, m) for i in range(n)]
        a = [i for i, (t, _) in enumerate(rs) if t]
        corr = sum(1 for i in a if rows[i]["top_breed"] == rows[i]["expected"])
        thr[f"{c}/{m}"] = {"asserted": len(a), "correct": corr, "wrong": len(a)-corr,
                           "precision": round(corr/len(a),4) if a else 0.0,
                           "coverage": round(len(a)/n,4), "abstention_rate": round(1-len(a)/n,4),
                           "reasons": dict(Counter(v for _, v in rs))}
    best_cov, best_t = 0.0, None
    for t in np.arange(0.30, 0.99, 0.01):
        m = [r for r in rows if r["kind"] == "breed" and r["top_score"] >= t]
        if not m: continue
        prec = sum(1 for r in m if r["top_breed"] == r["expected"]) / len(m)
        if prec >= 0.90 and len(m)/n > best_cov: best_cov, best_t = len(m)/n, round(float(t), 2)
    conf = Counter((r["expected"], r["top_label"] if r["top_breed"] is None else r["top_breed"]) for r in rows if r["top_breed"] != r["expected"])
    return {"mode": mode, "n": n, "overall_accuracy": round(top1/n,4), "macro_f1": round(float(np.mean([v["f1"] for v in per.values()])),4),
            "per_breed": per, "top_confusions": [{"expected": e, "predicted": p, "count": c} for (e,p),c in conf.most_common(10)],
            "thresholds": thr, "coverage_at_90_precision": round(best_cov,4), "coverage_at_90_threshold": best_t,
            "timing_ms": {"mean": round(float(np.mean(times))*1000,1), "p50": round(float(np.median(times))*1000,1)}}

def main():
    payload = json.loads(MANIFEST.read_text(encoding="utf-8"))
    audit = {e["file"].replace("\\","/") for e in json.loads(AUDIT.read_text(encoding="utf-8"))["excluded"]}
    # dedupe by bytes, drop audited
    seen, samples = set(), []
    for s in payload["samples"]:
        key = s["file"].replace("\\","/")
        if key in audit: continue
        h = hashlib.sha256((VAL/key).read_bytes()).hexdigest()
        if h in seen: continue
        seen.add(h); samples.append(s)
    print("samples:", len(samples))
    assert len(samples) == 86, len(samples)
    # overlap audit vs training data cannot be proven from metadata; record test hashes for future cross-check
    test_hashes = sorted(hashlib.sha256((VAL/s["file"].replace("\\","/")).read_bytes()).hexdigest() for s in samples)
    base = Sess(BASE_ONNX, BASE_LABELS); cand = Sess(CAND_ONNX, CAND_LABELS)
    out = {"n": len(samples), "test_set_sha256": test_hashes,
           "export_meta": json.loads((VAL/"ferdifdi_export_meta.json").read_text(encoding="utf-8")),
           "models": {
             "baseline": {"onnx_sha256": hashlib.sha256(BASE_ONNX.read_bytes()).hexdigest(), "size_bytes": BASE_ONNX.stat().st_size},
             "ferdifdi": {"onnx_sha256": hashlib.sha256(CAND_ONNX.read_bytes()).hexdigest(), "size_bytes": CAND_ONNX.stat().st_size}},
           "results": {
             "baseline_full": evaluate(base, samples, "full"),
             "baseline_tta": evaluate(base, samples, "tta"),
             "baseline_crop": evaluate(base, samples, "crop"),
             "ferdifdi_full": evaluate(cand, samples, "full"),
             "ferdifdi_tta": evaluate(cand, samples, "tta"),
             "ferdifdi_crop": evaluate(cand, samples, "crop")}}
    OUT.write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
    for k, v in out["results"].items():
        print(f"{k}: acc={v['overall_accuracy']} macroF1={v['macro_f1']} "
              f"@90cov={v['coverage_at_90_precision']} (t={v['coverage_at_90_threshold']}) "
              f"shipped {v['thresholds']['0.9/0.1']['precision']}/{v['thresholds']['0.9/0.1']['coverage']} "
              f"time={v['timing_ms']['mean']}ms")

if __name__ == "__main__":
    main()

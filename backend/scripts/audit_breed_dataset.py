#!/usr/bin/env python
"""Audit breed-validation fixtures: counts, dupes, resolution, licenses."""
import json, hashlib, collections
from pathlib import Path
from PIL import Image
REPO = Path(__file__).resolve().parents[2]
VAL = REPO / "backend/tests/fixtures/breed-validation"
m = json.loads((VAL / "manifest.json").read_text(encoding="utf-8"))
a = json.loads((VAL / "audit.json").read_text(encoding="utf-8"))
aud = {e["file"].replace("\\", "/"): e["reason"] for e in a.get("excluded", [])}
cat = json.loads((REPO / "backend/app/data/species_catalog.json").read_text(encoding="utf-8"))
cfa = {b["id"]: b["common_name"] for b in cat["breeds"]}
labels = json.loads((REPO / "backend/app/data/cat_breed_labels.json").read_text(encoding="utf-8"))["labels"]
model_breeds = {it["breed_id"]: it["label"] for it in labels if it["kind"] == "breed"}
rows = []
for s in m["samples"]:
    key = s["file"].replace("\\", "/")
    p = VAL / key
    raw = p.read_bytes()
    h = hashlib.sha256(raw).hexdigest()
    try:
        with Image.open(p) as im: w, hh = im.size
    except Exception: w = hh = 0
    rows.append({**s, "key": key, "sha256": h, "bytes": len(raw), "w": w, "h": hh,
                 "audited": key in aud, "audit_reason": aud.get(key, "")})
def bucket(w, h):
    if w >= 1000 and h >= 1000: return ">=1000x>=1000"
    if w >= 800 and h >= 600: return "800px-class"
    if w >= 400: return "400-799px"
    return "<400px"
out = {"per_breed": {}, "global": {}}
seen = {}
for b in sorted(cfa):
    rs = [r for r in rows if r["breed_id"] == b]
    uniq = {r["sha256"] for r in rs}
    aud_n = sum(1 for r in rs if r["audited"])
    usable = [r for r in rs if not r["audited"]]
    useen = {r["sha256"] for r in usable}
    out["per_breed"][b] = {
        "common_name": cfa[b], "raw": len(rs), "unique": len(uniq),
        "audited_out": aud_n, "usable_raw": len(usable), "usable_unique": len(useen),
        "duplicates": len(rs) - len(uniq),
        "resolution_buckets_usable": dict(collections.Counter(bucket(r["w"], r["h"]) for r in usable)),
        "bytes_usable_min_med_max": [min(r["bytes"] for r in usable) // 1024, sorted(r["bytes"] for r in usable)[len(usable)//2] // 1024, max(r["bytes"] for r in usable) // 1024] if usable else [],
        "sources": dict(collections.Counter(r["source"] for r in usable)),
        "licenses_usable": dict(collections.Counter(r.get("license", "") or "(catalog blank)" for r in usable)),
        "supported_by_model": b in model_breeds}
vals = [v["usable_unique"] for v in out["per_breed"].values()]
out["global"] = {"raw": len(rows), "unique": len({r['sha256'] for r in rows}),
    "audited": len(aud), "duplicate_files": sum(v["duplicates"] for v in out["per_breed"].values()),
    "usable_unique_total": sum(vals), "min_per_breed": min(vals), "max_per_breed": max(vals),
    "imbalance_ratio": round(max(vals) / min(vals), 1) if min(vals) else None,
    "resolution_buckets_usable": dict(collections.Counter(bucket(r["w"], r["h"]) for r in rows if not r["audited"])),
    "licenses_all": dict(collections.Counter(r.get("license", "") or "(catalog blank)" for r in rows)),
    "weak_performance_from_report": {}}
rep = json.loads((VAL / "report.json").read_text(encoding="utf-8")) if (VAL / "report.json").exists() else None
if rep:
    for x in rep.get("per_breed", []):
        out["global"]["weak_performance_from_report"][x["breed_id"]] = x
print(json.dumps(out, indent=2))
(VAL / "dataset_audit.json").write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")

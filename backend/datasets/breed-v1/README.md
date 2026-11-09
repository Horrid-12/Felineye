# breed-v1 (candidate pool)

Provenance + licensing + labels for the reproducible domestic-cat breed
dataset. Images are gitignored; `manifest.jsonl` + `splits.json` are tracked.

**Current:** pilot candidates only — every row is
`split=candidates`, `label_confidence=unverified`, `reviewers=[]`.
Category membership is a weak retrieval hint, never a label. Nothing here is
in a training split.

**Re-run:** `backend\.venv\Scripts\python.exe backend\scripts\collect_breed_dataset.py --offline-report`

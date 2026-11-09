#!/usr/bin/env python
"""Export ferdifdi/cat-breed-60-classes to ONNX (isolated .model-export venv).

Mirrors backend/scripts/setup_identification_models.py --breed :
input pixel_values [N,3,224,224], output logits, opset 17, do_constant_folding.
Writes benchmark-only ONNX + labels map (never touches backend/models).

Run: .model-export\Scripts\python.exe backend\scripts\export_ferdifdi.py
"""
from __future__ import annotations
import hashlib, json, sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
OUT_DIR = REPO / "backend/tests/fixtures/breed-validation"
ONNX_PATH = OUT_DIR / "ferdifdi_cat_breed_60.onnx"
LABELS_PATH = OUT_DIR / "ferdifdi_cat_breed_60_labels.json"
META_PATH = OUT_DIR / "ferdifdi_export_meta.json"
MODEL_ID = "ferdifdi/cat-breed-60-classes"
REVISION = "86c96206014d40aff7dd3351258bff941d6e9963"

# First 48 identical to production cat_breed_labels.json; 12 new are unmapped.
BASE = json.loads((REPO / "backend/app/data/cat_breed_labels.json").read_text(encoding="utf-8"))["labels"]
NEW = ["Chartreux","Chausie","Khao Manee","Kurilian Bobtail","LaPerm","Neva Masquerade",
       "Ocicat","Peterbald","Savannah","Selkirk Rex","Serengeti","Singapura"]

def sha256(p: Path) -> str:
    h = hashlib.sha256()
    with p.open("rb") as f:
        for c in iter(lambda: f.read(1 << 20), b""):
            h.update(c)
    return h.hexdigest()

def main() -> int:
    import torch
    from transformers import AutoModelForImageClassification
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"torch={torch.__version__} loading {MODEL_ID}@{REVISION}")
    model = AutoModelForImageClassification.from_pretrained(MODEL_ID, revision=REVISION)
    model.eval()
    id2label = {int(k): v for k, v in model.config.id2label.items()}
    # Verify indices 0-47 match production labels
    for item in BASE:
        assert id2label[item["index"]] == item["label"], (item, id2label[item["index"]])
    for i, label in enumerate(NEW, start=48):
        assert id2label[i] == label, (i, id2label[i])
    print("label check OK:", len(id2label), "classes")
    labels = list(BASE) + [{"index": i, "label": label, "breed_id": None, "kind": "unmapped"}
                           for i, label in enumerate(NEW, start=48)]
    LABELS_PATH.write_text(json.dumps({"model": MODEL_ID, "revision": REVISION, "license": "MIT",
        "score_semantics": "breed_classifier_softmax", "input_size": 224, "labels": labels}, indent=2) + "\n",
        encoding="utf-8")

    class Enc(torch.nn.Module):
        def __init__(self, w): super().__init__(); self.wrapped = w
        def forward(self, pixel_values): return self.wrapped(pixel_values=pixel_values).logits

    enc = Enc(model).eval()
    dummy = torch.randn(1, 3, 224, 224)
    kw = dict(input_names=["pixel_values"], output_names=["logits"],
              dynamic_axes={"pixel_values": {0: "batch"}, "logits": {0: "batch"}},
              opset_version=17, do_constant_folding=True)
    try:
        torch.onnx.export(enc, dummy, str(ONNX_PATH), dynamo=False, **kw)
    except TypeError:
        torch.onnx.export(enc, dummy, str(ONNX_PATH), **kw)
    print(f"wrote {ONNX_PATH.name} {ONNX_PATH.stat().st_size/1e6:.1f} MB sha256 {sha256(ONNX_PATH)}")
    # Numeric verification
    import numpy as np, onnxruntime as ort
    sess = ort.InferenceSession(str(ONNX_PATH), providers=["CPUExecutionProvider"])
    with torch.no_grad():
        exp = enc(dummy).numpy()
    act = sess.run(None, {"pixel_values": dummy.numpy()})[0]
    diff = float(np.abs(exp - act).max())
    print(f"onnx max abs diff {diff:.2e} (tol 1e-3)")
    assert diff <= 1e-3
    import transformers, onnx, onnxruntime, huggingface_hub, safetensors
    meta = {"model_id": MODEL_ID, "revision": REVISION, "license": "MIT",
            "onnx_sha256": sha256(ONNX_PATH), "onnx_size_bytes": ONNX_PATH.stat().st_size,
            "onnx_opset": 17, "input": "pixel_values [batch,3,224,224] mean/std 0.5",
            "output": "logits [batch,60]", "max_abs_diff": diff,
            "versions": {"torch": torch.__version__, "transformers": transformers.__version__,
                         "onnx": onnx.__version__, "onnxruntime": onnxruntime.__version__,
                         "safetensors": safetensors.__version__, "huggingface_hub": huggingface_hub.__version__},
            "preprocessing": "224x224 BICUBIC resize, /255, (x-0.5)/0.5, CHW (matches production)"}
    META_PATH.write_text(json.dumps(meta, indent=2) + "\n", encoding="utf-8")
    print("OK", META_PATH.name)
    return 0

if __name__ == "__main__":
    raise SystemExit(main())

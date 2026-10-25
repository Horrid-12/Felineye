#!/usr/bin/env python
"""Download or regenerate the real FelidLens identification weights.

Two artefacts are needed for the default ``CLASSIFIER_PROVIDER=auto`` path:

1. ``backend/models/mobilenetv2-12.onnx`` + ``backend/app/data/imagenet_classes.txt``
   - MobileNetV2-12 (ONNX Model Zoo, Apache-2.0), used as the independent
     feline/non-feline content gate.
   - Downloaded directly by this script.

2. ``backend/models/bioclip_vit_b16_vision.onnx`` +
   ``backend/app/data/bioclip_text_embeddings.npz``
   - BioCLIP ViT-B/16 (imageomics/bioclip, MIT), used as the species ranker.
   - The vision encoder is exported from PyTorch and the 49 species/non-feline
     text prompts are encoded ahead of time.
   - Exporting requires the optional development dependencies in
     ``backend/requirements-models.txt`` (torch + open_clip_torch). The FastAPI
     runtime itself only needs onnxruntime, numpy, and pillow.

Weights are intentionally gitignored. Run this script after cloning:

    # Runtime gate only (works in backend/.venv)
    backend\\.venv\\Scripts\\python.exe backend\\scripts\\setup_identification_models.py --imagenet

    # Everything (run from a throwaway export venv that has torch + open_clip)
    python backend/scripts/setup_identification_models.py --all

The script never downloads the mock provider and never fabricates weights.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import sys
import urllib.request
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
BACKEND_DIR = REPO_ROOT / "backend"
MODELS_DIR = BACKEND_DIR / "models"
DATA_DIR = BACKEND_DIR / "app" / "data"
CATALOG_PATH = DATA_DIR / "species_catalog.json"

IMAGENET_URL = (
    "https://github.com/onnx/models/raw/main/validated/vision/classification/"
    "mobilenet/model/mobilenetv2-12.onnx"
)
IMAGENET_LABELS_URL = "https://raw.githubusercontent.com/pytorch/hub/master/imagenet_classes.txt"

IMAGENET_MODEL = MODELS_DIR / "mobilenetv2-12.onnx"
IMAGENET_LABELS = DATA_DIR / "imagenet_classes.txt"
BIOCLIP_ONNX = MODELS_DIR / "bioclip_vit_b16_vision.onnx"
BIOCLIP_EMBEDDINGS = DATA_DIR / "bioclip_text_embeddings.npz"

#: Downloaded artefacts have stable bytes, so their digests are pinned.
EXPECTED_SHA256 = {
    IMAGENET_MODEL.name: "c0c3f76d93fa3fd6580652a45618618a220fced18babf65774ed169de0432ad5",
    IMAGENET_LABELS.name: "1f386e0d1cb6e28b9c2dac651c3deA6801e98ad1b41a14ce6bb1a093d72069f5",
}

#: Non-feline prompts that let BioCLIP recognise out-of-domain content.
NON_FELINE_PROMPTS = [
    ("non_dog", "Dog", "Canis lupus familiaris", "Canis lupus familiaris"),
    ("non_crocodile", "Crocodile", "Crocodylus niloticus", "Crocodylus niloticus"),
    ("non_car", "Car", "", "car"),
    ("non_landscape", "Landscape", "", "landscape"),
    ("non_person", "Person", "", "person"),
    ("non_building", "Building", "", "building"),
    ("non_food", "Food", "", "food"),
    ("non_bird", "Bird", "Aves", "Aves"),
]

MODEL_PROMPT_TEMPLATE = "a photo of a {prompt_name}."


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def format_size(num_bytes: int) -> str:
    return f"{num_bytes / (1024 * 1024):.1f} MB"


def download(url: str, destination: Path, *, force: bool = False) -> bool:
    if destination.exists() and not force:
        print(f"  [skip] {destination.name} already present ({format_size(destination.stat().st_size)})")
        return True

    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary = destination.with_name(destination.name + ".part")
    if temporary.exists():
        temporary.unlink()

    request = urllib.request.Request(url, headers={"User-Agent": "FelidLens-model-setup/1.0"})
    print(f"  [get ] {destination.name} <- {url}")
    try:
        with urllib.request.urlopen(request, timeout=120) as response, temporary.open("wb") as handle:
            shutil.copyfileobj(response, handle)
        temporary.replace(destination)
    except Exception:
        if temporary.exists():
            temporary.unlink()
        raise

    print(f"         wrote {format_size(destination.stat().st_size)}")
    return True


def verify_download(destination: Path) -> bool:
    expected = EXPECTED_SHA256.get(destination.name)
    if not expected:
        return True
    actual = sha256(destination)
    if actual.lower() != expected.lower():
        print(
            f"  [FAIL] {destination.name} checksum mismatch\n"
            f"         expected {expected}\n"
            f"         actual   {actual}"
        )
        return False
    print(f"  [ok  ] {destination.name} sha256 {actual}")
    return True


def setup_imagenet(*, force: bool = False) -> bool:
    print("ImageNet gate (MobileNetV2-12, Apache-2.0)")
    try:
        download(IMAGENET_MODEL, IMAGENET_MODEL, force=force)
        download(IMAGENET_LABELS_URL, IMAGENET_LABELS, force=force)
    except Exception as exc:  # pragma: no cover - network dependent
        print(f"  [FAIL] download failed: {exc}")
        return False
    return verify_download(IMAGENET_MODEL) and verify_download(IMAGENET_LABELS)


def _load_catalog_entries() -> list[dict]:
    if not CATALOG_PATH.exists():
        raise FileNotFoundError(
            f"Catalog not found at {CATALOG_PATH}. Run backend/scripts/build_catalog.py first."
        )
    catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))

    entries: list[dict] = []
    for species in catalog["species"]:
        entries.append(
            {
                "species_id": species["id"],
                "common_name": species["common_name"],
                "scientific_name": species["scientific_name"],
                "prompt_name": species["scientific_name"],
                "non_feline": False,
            }
        )
    for species_id, common_name, scientific_name, prompt_name in NON_FELINE_PROMPTS:
        entries.append(
            {
                "species_id": species_id,
                "common_name": common_name,
                "scientific_name": scientific_name,
                "prompt_name": prompt_name,
                "non_feline": True,
            }
        )
    return entries


def _export_bioclip_onnx(model, *, force: bool = False) -> bool:
    import torch

    if BIOCLIP_ONNX.exists() and not force:
        print(f"  [skip] {BIOCLIP_ONNX.name} already present ({format_size(BIOCLIP_ONNX.stat().st_size)})")
        return True

    class ImageEncoder(torch.nn.Module):
        def __init__(self, wrapped):
            super().__init__()
            self.wrapped = wrapped

        def forward(self, pixel_values):
            return self.wrapped.encode_image(pixel_values)

    encoder = ImageEncoder(model).eval()
    dummy = torch.randn(1, 3, 224, 224)
    BIOCLIP_ONNX.parent.mkdir(parents=True, exist_ok=True)
    print(f"  [exp ] exporting {BIOCLIP_ONNX.name} (opset 17)")

    export_kwargs = dict(
        input_names=["pixel_values"],
        output_names=["image_embeds"],
        dynamic_axes={"pixel_values": {0: "batch"}, "image_embeds": {0: "batch"}},
        opset_version=17,
        do_constant_folding=True,
    )
    try:
        torch.onnx.export(encoder, dummy, str(BIOCLIP_ONNX), dynamo=False, **export_kwargs)
    except TypeError:
        # torch < 2.6 has no ``dynamo`` switch and defaults to the legacy exporter.
        torch.onnx.export(encoder, dummy, str(BIOCLIP_ONNX), **export_kwargs)

    print(f"         wrote {format_size(BIOCLIP_ONNX.stat().st_size)}")
    print(f"         sha256 {sha256(BIOCLIP_ONNX)}")

    try:
        import numpy as np
        import onnxruntime as ort

        session = ort.InferenceSession(str(BIOCLIP_ONNX), providers=["CPUExecutionProvider"])
        with torch.no_grad():
            expected = encoder(dummy).numpy()
        actual = session.run(None, {"pixel_values": dummy.numpy()})[0]
        max_diff = float(np.abs(expected - actual).max())
        print(f"  [ok  ] ONNX/PyTorch max abs diff {max_diff:.2e}")
        if max_diff > 1e-3:
            print("  [FAIL] exported ONNX does not match PyTorch within tolerance")
            return False
    except ImportError:
        print("  [note] onnxruntime not installed here; skipping numeric verification")
        print("         the runtime venv tests will verify the export")

    return True


def _write_text_embeddings(model, tokenizer) -> bool:
    import numpy as np
    import torch
    import torch.nn.functional as F

    entries = _load_catalog_entries()
    prompts = [MODEL_PROMPT_TEMPLATE.format(prompt_name=e["prompt_name"]) for e in entries]

    print(f"  [exp ] encoding {len(prompts)} text prompts")
    with torch.no_grad():
        embeddings = model.encode_text(tokenizer(prompts))
        embeddings = F.normalize(embeddings, dim=-1).cpu().numpy().astype(np.float32)

    if embeddings.shape[0] != len(entries) or embeddings.shape[1] != 512:
        print(f"  [FAIL] unexpected embedding shape {embeddings.shape}")
        return False

    BIOCLIP_EMBEDDINGS.parent.mkdir(parents=True, exist_ok=True)
    np.savez_compressed(
        BIOCLIP_EMBEDDINGS,
        embeddings=embeddings,
        labels=np.array([e["species_id"] for e in entries]),
        common_names=np.array([e["common_name"] for e in entries]),
        scientific_names=np.array([e["scientific_name"] for e in entries]),
        non_feline=np.array([e["non_feline"] for e in entries]),
        prompt_template=np.array([MODEL_PROMPT_TEMPLATE]),
        model_name=np.array(["BioCLIP ViT-B/16"]),
        model_source=np.array(["imageomics/bioclip"]),
        license=np.array(["MIT"]),
    )
    print(
        f"         wrote {BIOCLIP_EMBEDDINGS.name} "
        f"({BIOCLIP_EMBEDDINGS.stat().st_size} bytes, {embeddings.shape[0]} prompts)"
    )
    print(f"         sha256 {sha256(BIOCLIP_EMBEDDINGS)}")
    return True


def setup_bioclip(*, force: bool = False) -> bool:
    print("BioCLIP species ranker (imageomics/bioclip, MIT)")

    try:
        import torch  # noqa: F401
        import open_clip
    except ImportError as exc:
        print(f"  [FAIL] optional export dependencies are missing: {exc}")
        print("         Install them in a separate environment, then re-run:")
        print("           python -m venv .model-export")
        print("           .model-export\\Scripts\\python.exe -m pip install -r backend\\requirements-models.txt")
        print("           .model-export\\Scripts\\python.exe backend\\scripts\\setup_identification_models.py --bioclip")
        print("         The API runtime does not need torch or open_clip.")
        return False

    print("  [get ] loading imageomics/bioclip from Hugging Face")
    try:
        model, _, _ = open_clip.create_model_and_transforms("hf-hub:imageomics/bioclip")
        model.eval()
        tokenizer = open_clip.get_tokenizer("hf-hub:imageomics/bioclip")
    except Exception as exc:  # pragma: no cover - network dependent
        print(f"  [FAIL] could not load BioCLIP: {exc}")
        return False

    if not _export_bioclip_onnx(model, force=force):
        return False
    if not _write_text_embeddings(model, tokenizer):
        return False
    return True


def check() -> bool:
    print("Identification artefacts")
    ok = True
    for label, path in [
        ("ImageNet gate", IMAGENET_MODEL),
        ("ImageNet labels", IMAGENET_LABELS),
        ("BioCLIP vision ONNX", BIOCLIP_ONNX),
        ("BioCLIP text embeddings", BIOCLIP_EMBEDDINGS),
    ]:
        if not path.exists():
            print(f"  [MISS] {label}: {path}")
            ok = False
            continue
        print(f"  [ok  ] {label}: {path} ({format_size(path.stat().st_size)})")
        print(f"         sha256 {sha256(path)}")
        if label.startswith("ImageNet"):
            ok = verify_download(path) and ok
    return ok


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--all", action="store_true", help="set up the gate and BioCLIP")
    parser.add_argument("--imagenet", action="store_true", help="download the MobileNetV2 gate and labels")
    parser.add_argument("--bioclip", action="store_true", help="export BioCLIP and precompute text embeddings")
    parser.add_argument("--check", action="store_true", help="report installed artefacts and checksums")
    parser.add_argument("--force", action="store_true", help="overwrite existing artefacts")
    args = parser.parse_args(argv)

    if not any([args.all, args.imagenet, args.bioclip, args.check]):
        parser.print_help()
        return 2

    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    ok = True
    if args.check:
        ok = check() and ok
    if args.all or args.imagenet:
        ok = setup_imagenet(force=args.force) and ok
    if args.all or args.bioclip:
        ok = setup_bioclip(force=args.force) and ok

    print()
    if ok:
        print("Done. Restart the backend so provider selection sees the new files.")
        return 0
    print("One or more steps failed. See the messages above.")
    return 1


if __name__ == "__main__":
    sys.exit(main())

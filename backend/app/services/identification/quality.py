"""Deterministic image-quality checks used by the identification pipeline.

These are not species heuristics. They only decide whether an image is too
degraded to support a confident result. A low-quality image is allowed to
produce an abstention; it is never used to invent a prediction.
"""

from __future__ import annotations

from typing import Any, Dict

import numpy as np
from PIL import Image

from ...config import settings


def assess_image_quality(image: Image.Image) -> Dict[str, Any]:
    # Work on a bounded grayscale copy so the check is cheap and deterministic.
    probe = image.convert("L")
    if max(probe.size) > 512:
        probe.thumbnail((512, 512), Image.Resampling.BILINEAR)

    arr = np.asarray(probe, dtype=np.float32)
    if arr.ndim != 2 or arr.size == 0:
        return {
            "low_quality": True,
            "flags": ["unreadable_pixels"],
            "sharpness": 0.0,
            "brightness": 0.0,
            "contrast": 0.0,
        }

    # 4-neighbour Laplacian variance; a standard, explainable sharpness proxy.
    laplacian = (
        -4.0 * arr[1:-1, 1:-1]
        + arr[:-2, 1:-1]
        + arr[2:, 1:-1]
        + arr[1:-1, :-2]
        + arr[1:-1, 2:]
    )
    sharpness = float(np.var(laplacian)) if laplacian.size else 0.0
    brightness = float(np.mean(arr))
    contrast = float(np.std(arr))

    flags = []
    if sharpness < settings.quality_blur_threshold:
        flags.append("low_sharpness")
    if brightness < settings.quality_brightness_min:
        flags.append("too_dark")
    if brightness > settings.quality_brightness_max:
        flags.append("too_bright")
    if contrast < settings.quality_contrast_min:
        flags.append("low_contrast")

    return {
        "low_quality": bool(flags),
        "flags": flags,
        "sharpness": round(sharpness, 2),
        "brightness": round(brightness, 2),
        "contrast": round(contrast, 2),
        "width": image.size[0],
        "height": image.size[1],
    }

#!/usr/bin/env python3
"""Mirror a small, pre-verified batch of Wikimedia Commons food images locally.

Only records already marked active, exact-match and individually verified are
eligible. The script never discovers or selects new images on its own.
"""
import hashlib
import io
import json
import urllib.request
from pathlib import Path
from datetime import date

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
ATTR_PATH = ROOT / "assets/images/attributions.json"
MANIFEST_PATH = ROOT / "recipes/manifest.json"
MAP_PATH = ROOT / "research/recipe-images.json"
MAX_PER_RUN = 5
MAX_EDGE = 1600
WEBP_QUALITY = 86

attrs = json.loads(ATTR_PATH.read_text(encoding="utf-8"))
manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))["recipes"]
records = attrs["records"]

eligible = [
    r for r in records
    if r.get("activeOnSite") is True
    and r.get("match") == "exact"
    and r.get("status") == "verified-this-run-remote-local-copy-pending"
    and not r.get("filePath")
    and r.get("imageUrl", "").startswith("https://thumb.wikimedia.org/")
    and r.get("sourceUrl", "").startswith("https://commons.wikimedia.org/wiki/File:")
]
eligible = sorted(eligible, key=lambda r: int(r["recipeId"]))[:MAX_PER_RUN]

recipe_by_id = {}
for rel in manifest:
    recipe_path = ROOT / rel
    recipe = json.loads(recipe_path.read_text(encoding="utf-8"))
    recipe_by_id[int(recipe["id"])] = (recipe_path, recipe)

added_hashes = set()
mirrored = []
today = date.today().isoformat()

for record in eligible:
    rid = int(record["recipeId"])
    if rid not in recipe_by_id:
        raise RuntimeError(f"Recipe {rid} is not listed in recipes/manifest.json")

    req = urllib.request.Request(
        record["imageUrl"],
        headers={"User-Agent": "WorldWellbeingKitchen/1.0 (licensed image mirror)"}
    )
    with urllib.request.urlopen(req, timeout=45) as response:
        content_type = response.headers.get("Content-Type", "").lower()
        payload = response.read()
    if not content_type.startswith("image/"):
        raise RuntimeError(f"Recipe {rid}: unexpected content type {content_type!r}")
    if len(payload) < 5000:
        raise RuntimeError(f"Recipe {rid}: source image is unexpectedly small")

    digest = hashlib.sha256(payload).hexdigest()
    if digest in added_hashes:
        raise RuntimeError(f"Recipe {rid}: duplicate source image bytes in this batch")
    added_hashes.add(digest)

    with Image.open(io.BytesIO(payload)) as probe:
        probe.verify()
    with Image.open(io.BytesIO(payload)) as source:
        image = ImageOps.exif_transpose(source).convert("RGB")
        image.thumbnail((MAX_EDGE, MAX_EDGE), Image.Resampling.LANCZOS)

    rel_path = f"assets/images/recipes/{rid:03d}.webp"
    output = ROOT / rel_path
    output.parent.mkdir(parents=True, exist_ok=True)
    image.save(output, "WEBP", quality=WEBP_QUALITY, method=6)

    # Re-open the final file to validate its format and dimensions.
    with Image.open(output) as check:
        check.verify()
    with Image.open(output) as check:
        if check.format != "WEBP" or min(check.size) < 300:
            raise RuntimeError(f"Recipe {rid}: local WebP failed validation")

    recipe_path, recipe = recipe_by_id[rid]
    recipe["image"] = "/" + rel_path
    recipe["imageStatus"] = "licensed-commons-local-validated"
    recipe_path.write_text(
        json.dumps(recipe, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8"
    )

    record["filePath"] = rel_path
    record["status"] = "licensed-commons-local-validated"
    record["localCopyDate"] = today
    record["localFileSha256"] = hashlib.sha256(output.read_bytes()).hexdigest()
    mirrored.append(record)

# Build the image metadata consumed by scripts/build-site.js. Preserve the
# original source page and licence, whether the asset is local or still remote.
image_map = {}
for record in records:
    if record.get("activeOnSite") is not True or record.get("match") != "exact":
        continue
    rid = str(record["recipeId"])
    url = ("/" + record["filePath"]) if record.get("filePath") else record.get("imageUrl")
    if not url:
        continue
    image_map[rid] = {
        "url": url,
        "creator": record.get("creator"),
        "license": record.get("licenseName"),
        "licenseUrl": record.get("licenseUrl"),
        "page": record.get("sourceUrl"),
        "match": record.get("match"),
        "sourceType": "commons",
        "localFile": bool(record.get("filePath"))
    }

MAP_PATH.parent.mkdir(parents=True, exist_ok=True)
MAP_PATH.write_text(
    json.dumps(image_map, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
    encoding="utf-8"
)

active_exact = [
    r for r in records
    if r.get("activeOnSite") is True and r.get("match") == "exact"
]
unique_active = {
    r.get("filePath") or r.get("imageUrl") or r.get("sourceUrl")
    for r in active_exact
    if r.get("filePath") or r.get("imageUrl") or r.get("sourceUrl")
}
all_exact_sources = {
    r.get("sourceUrl") for r in records
    if r.get("match") == "exact" and r.get("sourceUrl")
}
summary = attrs.setdefault("summary", {})
summary.update({
    "recipeCount": len(manifest),
    "activeUniqueExactImages": len(unique_active),
    "uniqueExactImageSources": len(all_exact_sources),
    "pendingRecipesAfterCleanup": max(0, len(manifest) - len(unique_active)),
    "generatedThisRun": 0,
    "sourcedAndIndividuallyVerifiedThisRun": len(mirrored),
    "validatedThisRun": len(mirrored),
    "localFilesAddedThisRun": len(mirrored),
    "lastRunDate": today,
    "note": (
        f"{len(mirrored)} individually verified exact-match Wikimedia Commons "
        "images were mirrored to local WebP assets. Original creators, source "
        "pages and licence links are retained. No AI-generated images are "
        "claimed in this run."
    )
})
ATTR_PATH.write_text(
    json.dumps(attrs, ensure_ascii=False, indent=2) + "\n",
    encoding="utf-8"
)

print(json.dumps({
    "mirrored": len(mirrored),
    "recipeIds": [int(r["recipeId"]) for r in mirrored],
    "localFiles": [r["filePath"] for r in mirrored],
    "activeUniqueExactImages": len(unique_active),
    "pendingRecipes": max(0, len(manifest) - len(unique_active)),
    "validated": len(mirrored)
}, indent=2))

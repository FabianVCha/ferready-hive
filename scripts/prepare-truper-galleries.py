"""Build reviewed local galleries; never synthesize or overwrite source pixels."""
import hashlib
import json
from collections import Counter
from pathlib import Path
from PIL import Image, ImageDraw, ImageOps

ROOT = Path(__file__).resolve().parents[1]
# Owner-authorized illustrations are labeled independently of package inclusion.
APPROVED = {entry["source"]: entry for entry in json.loads(
    (ROOT / "data/approved/truper-gallery-selection.json").read_text()
)}
EXCLUSIONS_PATH = ROOT / "data/approved/truper-multi-media-exclusions.json"
EXCLUDED = {entry["source"]: entry["reason"] for entry in json.loads(EXCLUSIONS_PATH.read_text())} if EXCLUSIONS_PATH.exists() else {}
CONTENTS = json.loads((ROOT / "data/approved/truper-contents-selection.json").read_text())
BADGE_SOURCE_HASHES = {
    "103740": "4125d2ffcb7f45c7841c5e111bc1df2bb35feadcccdad1089f1009661ddadf74",
    "104271": "041777315a7d57c335826671c98a6421723562047ba44587f4da6cc72a7fc343",
}
CONTENTS_SOURCES = {
    component["source"]: {**component, "reference": reference, "confirmation": entry["confirmation"]}
    for reference, entry in CONTENTS.items() for component in entry["components"]
}

def cutout(image):
    """Remove only edge-connected almost-white pixels; preserve enclosed whites."""
    rgba = image.convert("RGBA")
    if rgba.getchannel("A").getextrema()[0] < 255:
        return rgba, "supplied-alpha"
    rgb = rgba.convert("RGB")
    # Require all channels to be white, not merely a bright red/green channel.
    candidate = Image.new("L", rgb.size)
    candidate.putdata([255 if min(pixel) >= 250 else 0 for pixel in rgb.getdata()])
    padded = ImageOps.expand(candidate, border=1, fill=255)
    ImageDraw.floodfill(padded, (0, 0), 128, thresh=0)
    connected = padded.crop((1, 1, rgb.width + 1, rgb.height + 1))
    alpha = connected.point(lambda value: 0 if value == 128 else 255)
    rgba.putalpha(alpha)
    return rgba, "edge-connected-white-250"

def frame_object(image):
    """Trim empty canvas, then retain an even 6% safety margin without stretching."""
    bounds = image.getchannel("A").getbbox()
    if bounds is None:
        raise ValueError("Image contains no visible object")
    trimmed = image.crop(bounds)
    margin = max(1, round(max(trimmed.size) * .06))
    return ImageOps.expand(trimmed, border=margin, fill=(0, 0, 0, 0))

def remove_reviewed_badge(image, reference):
    """Remove only the reviewed, detached marketing badge, never product pixels."""
    if reference not in ("103740", "104271"):
        return image
    if image.size != (1800, 1800):
        raise ValueError(f"Reviewed badge coordinates require the original canvas: {reference}")
    image = image.copy()
    # Both original photographs place "Nuevo" in this otherwise empty corner.
    # The complete product and all photographed accessories lie outside it.
    image.paste((0, 0, 0, 0), (0, 0, 380, 220))
    return image

def prepare_illustration(source):
    """Reframe after downsampling too: rounding must not produce uneven margins."""
    image, method = cutout(Image.open(source))
    image = frame_object(image)
    image.thumbnail((1200, 1200))
    image = frame_object(image)
    # At most one transparent pixel per edge is lost to integer rounding.
    dx = max(0, (image.width - 1200 + 1) // 2)
    dy = max(0, (image.height - 1200 + 1) // 2)
    return image.crop((dx, dy, image.width - dx, image.height - dy)), method

def main():
    catalog_path = ROOT / "data/approved/catalog.json"
    catalog = json.loads(catalog_path.read_text())
    by_ref = {p["reference"]: p for p in catalog["products"]}
    audit = {"approved": [], "excluded": [], "inventory": [], "confirmed_contents": []}
    primary_hashes = {
        hashlib.sha256((ROOT / "apps/storefront/public" / src.lstrip("/")).read_bytes()).hexdigest()
        for product in catalog["products"] for src in product["images"]
    }
    # Fail before changing the catalog when reviewed evidence disappears or changes.
    for path, entry in {**APPROVED, **CONTENTS_SOURCES}.items():
        source = ROOT / path
        if not source.exists() or hashlib.sha256(source.read_bytes()).hexdigest() != entry["sha256"]:
            raise ValueError(f"Reviewed source missing or changed: {path}")
    for reference, expected_hash in BADGE_SOURCE_HASHES.items():
        source = ROOT / "apps/storefront/public" / by_ref[reference]["images"][0].lstrip("/")
        if hashlib.sha256(source.read_bytes()).hexdigest() != expected_hash:
            raise ValueError(f"Reviewed badge source changed: {reference}")
    for product in catalog["products"]:
        product["gallery"] = []
        if product["images"]:
            source = ROOT / "apps/storefront/public" / product["images"][0].lstrip("/")
            output = source.with_name(source.stem + "-alpha.png")
            image, method = cutout(Image.open(source))
            image = remove_reviewed_badge(image, product["reference"])
            image = frame_object(image)
            image.save(output)
            product["gallery"].append({
                "src": "/" + str(output.relative_to(ROOT / "apps/storefront/public")),
                "original": product["images"][0],
                "kind": "photo",
                "caption": "Fotografía del fabricante · fondo blanco retirado",
                "provenance": product["image_source_url"],
                "background": method,
                **({"cleanup": "Detached Nuevo badge removed from reviewed empty corner [0,0,380,220]; product pixels unchanged."}
                   if product["reference"] in ("103740", "104271") else {}),
            })
    for category in [category["handle"] for category in catalog["categories"]]:
        files = sorted(p for p in (ROOT / "data/research/truper/images" / category).glob("*/*") if p.suffix.lower() in [".png", ".jpg", ".webp", ".jpeg"])
        for source in files:
            reference = source.parent.name.split("-")[0]
            path = str(source.relative_to(ROOT))
            digest = hashlib.sha256(source.read_bytes()).hexdigest()
            with Image.open(source) as supplied:
                dimensions = list(supplied.size)
                alpha = list(supplied.convert("RGBA").getchannel("A").getextrema())
            audit["inventory"].append({
                "reference": reference, "source": path, "sha256": digest,
                "dimensions": dimensions, "alpha_range": alpha,
                "role": "primary-photo" if digest in primary_hashes or (
                    reference in by_ref and by_ref[reference]["images"] and
                    source.name in ("original-truper.jpg", "candidato-truper.jpg")
                ) else
                "confirmed-contents-illustration" if path in CONTENTS_SOURCES else
                "alternate-product-or-detail" if path in APPROVED else
                "not-selected",
            })
            if path in CONTENTS_SOURCES:
                component = CONTENTS_SOURCES[path]
                confirmation = CONTENTS[reference]
                if by_ref[reference]["model"] != confirmation["model"] or component["confirmation"]["source"] != "user-confirmed":
                    raise ValueError(f"Contents confirmation does not match product: {reference}")
                output = ROOT / "apps/storefront/public" / component["src"].lstrip("/")
                image, method = prepare_illustration(source)
                image.save(output, lossless=True)
                audit["confirmed_contents"].append({**component, "background": method, "dimensions": list(image.size)})
                continue
            if reference not in by_ref or path not in APPROVED:
                if not source.name.startswith(("original-", "candidato-")):
                    reason = {
                        "101895": "Isolated backing pad or wrench: not an additional product view; package inclusion not established.",
                        "103068": "Isolated chuck key or auxiliary handle: exact loose accessory and package inclusion not established.",
                        "103740": "Blade, guide and key composition: accessory specifications and package contents not verified.",
                        "104271": "Isolated battery, charger, bag, handle or clip: accessory render does not verify exact shipped item.",
                        "104275": "Isolated charger, bag or bit sets: exact bit counts and shipped accessories not independently verified.",
                        "104412": "Isolated charger, battery, clip or adapter: exact shipped accessory not established by product view.",
                        "11452": "BROU-R2-1/4M marking is legible at full resolution, but altered cutting-tip geometry does not establish a faithful alternate view.",
                        "13448": "Isolated dust bag or sanding belt: exact dimensions and accessory identity not established.",
                        "14012": "Isolated grinder accessory; some files duplicated under 16590 despite different disc diameters.",
                        "16182": "Isolated chuck or handles: exact fit and shipped loose components not established.",
                        "16590": "Rejected complete renders have 6-inch/150-mm discs or corrupted motor-power markings inconsistent with 9-inch/2350-W SKU. Isolated disc is 7 inches; shared accessories also occur under 14012. Use manufacturer photo only.",
                        "103030": "Isolated oil, air filter, cap or hardware: exact replacement identity and shipped inclusion not verified.",
                        "103660": "Isolated disc, hex key or carbon brushes: exact accessory specifications not verified.",
                    }.get(reference, "Not a reviewed additional view of an approved reference.")
                    audit["excluded"].append({"source": path, "reason": EXCLUDED.get(path, reason)})
                continue
            product = by_ref[reference]
            output = ROOT / f"apps/storefront/public/project/products/truper/{reference}-illustration-{digest[:12]}.webp"
            image, method = prepare_illustration(source)
            image.save(output, lossless=True)
            entry = {
                "src": "/" + str(output.relative_to(ROOT / "apps/storefront/public")),
                "kind": "illustration",
                "caption": "Accesorio ilustrado · inclusión por confirmar" if APPROVED[path].get("role") == "accessory" else "Ilustración suministrada · no es fotografía del fabricante; no acredita accesorios incluidos",
                "provenance": str(source.relative_to(ROOT)),
                "source_sha256": digest,
                "background": method,
                "role": APPROVED[path].get("role", "angle"),
                "observation": APPROVED[path].get("observation", ""),
            }
            product["gallery"].append(entry)
            audit["approved"].append({"reference": reference, **entry})
    catalog_path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n")
    (ROOT / "data/approved/truper-gallery-audit.json").write_text(json.dumps(audit, ensure_ascii=False, indent=2) + "\n")
    sync_classification(catalog)
    print(json.dumps({"products": len(by_ref), "galleries": sum(len(p["gallery"]) > 1 for p in by_ref.values()), "supplementary": len(audit["approved"]), "cutouts": sum(bool(p["images"]) for p in by_ref.values()), "confirmed_components": len(audit["confirmed_contents"]), "excluded": len(audit["excluded"])}))

def sync_classification(catalog):
    """Reconcile usage metadata without altering the exhaustive source inventory."""
    by_ref = {p["reference"]: p for p in catalog["products"]}
    classification_path = ROOT / "data/approved/truper-image-classification.json"
    if classification_path.exists():
        classification = json.loads(classification_path.read_text())
        selected = {view["provenance"]: view for p in catalog["products"] for view in p["gallery"] if view["kind"] == "illustration"}
        exclusions_path = ROOT / "data/approved/truper-multi-media-exclusions.json"
        conflicts = {entry["source"]: entry["reason"] for entry in json.loads(exclusions_path.read_text())} if exclusions_path.exists() else {}
        for entry in classification["files"]:
            path = entry["path"]
            if path in selected:
                view = selected[path]
                entry["current_usage"] = {"selection": "approved", "src": view["src"], "reason": None}
                entry["publication_state"] = "local-storefront-ready-not-production"
                if view["role"] == "detail":
                    entry["classification"] = "detail"
                    entry["recommended_chapter_role"] = "detail"
            elif path in conflicts:
                entry["previous_classification"] = entry.get("previous_classification", entry["classification"])
                entry["classification"] = "incompatible"
                entry["recommended_chapter_role"] = "none-pending"
                entry["recommended_usage"] = "exclude-incompatible"
                entry["current_usage"] = {"selection": "excluded", "src": None, "reason": conflicts[path]}
            elif entry["reference"] in by_ref and Path(path).name.startswith(("original-", "candidato-")):
                gallery = by_ref[entry["reference"]].get("gallery", [])
                photo = next((view for view in gallery if view["kind"] == "photo"), None)
                if photo:
                    entry["current_usage"] = {"selection": "approved", "src": photo["src"], "reason": "Manufacturer photo; original bytes retained separately."}
                    entry["publication_state"] = "local-storefront-ready-not-production"
        for folder in classification["folders"]:
            folder["classification_counts"] = dict(Counter(entry["classification"] for entry in classification["files"] if entry["folder"] == folder["folder"]))
        classification["summary"]["classification_counts"] = dict(Counter(entry["classification"] for entry in classification["files"]))
        classification["website_integration"] = {"date": "2026-11-24", "products": len(by_ref), "multi_folders": 20, "illustrations": len(selected), "backend_changed": False, "production_published": False}
        classification_path.write_text(json.dumps(classification, ensure_ascii=False, indent=2) + "\n")

if __name__ == "__main__":
    main()

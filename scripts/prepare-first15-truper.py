"""Build the project-owned selection from owner-supplied files, without editing them."""
import hashlib
import json
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageOps, ImageChops
import numpy as np

root = Path(sys.argv[2]) if len(sys.argv) > 2 else Path(__file__).resolve().parents[1]
source = Path(sys.argv[1])
products = []
provenance = []
scenes = {}
components = {
    "104412": [(7, "Batería 2 Ah", "1 batería A12-BAT-2A"), (8, "Cargador", "1 cargador A12-CAR"),
               (9, "Clip", "1 clip para cinturón"), (10, "Adaptador", "1 adaptador de clavija")],
    "104271": [(5, "Baterías 4 Ah ×2", "2 baterías N20-BAT-4A"),
               (6, "Cargador", "1 cargador N20-CAR"), (9, "Adaptador", "1 adaptador AD-PR"),
               (10, "Correa", "1 correa para muñeca"), (11, "Mango auxiliar", "1 mango auxiliar"),
               (12, "Maleta", "1 maleta MALE-14 de 14 pulgadas"), (13, "Clip", "1 clip para cinturón")],
    "14659": [(3, "Mango auxiliar", "1 mango auxiliar"), (4, "Control de profundidad", "1 varilla"),
              (5, "Llave de broquero", "1 llave para broquero")],
}
target = root / "apps/storefront/public/project/products/first15-truper"
target.mkdir(parents=True, exist_ok=True)
for ficha in sorted(source.glob("*/ficha.json")):
    raw = ficha.read_bytes()
    data = json.loads(raw)
    code = data.get("truper_code", "").strip()
    if not code:
        continue
    images = []
    gallery = []
    assets = []
    # Manufacturer photos precede explicitly labelled owner-supplied illustrations.
    files = [ficha.parent / name for name in data["images"]]
    files += sorted(p for p in ficha.parent.glob("*.png") if p not in files)
    for index, path in enumerate(files, 1):
        name = f"{code}-{index:02}.webp"
        image = Image.open(path).convert("RGBA")
        image.thumbnail((1600, 1600))
        # Remove only near-white pixels connected to the outside, never enclosed
        # white labels or product details. Keep the owner's originals untouched.
        rgb = np.asarray(image)[:, :, :3]
        candidate = Image.fromarray(np.where(np.min(rgb, axis=2) >= 242, 255, 0).astype("uint8"))
        candidate = ImageOps.expand(candidate, border=1, fill=255)
        ImageDraw.floodfill(candidate, (0, 0), 128)
        candidate = candidate.crop((1, 1, candidate.width - 1, candidate.height - 1))
        alpha = candidate.point(lambda value: 0 if value == 128 else 255)
        image.putalpha(ImageChops.multiply(image.getchannel("A"), alpha))
        bounds = image.getbbox()
        if bounds:
            image = image.crop(bounds)
        image = ImageOps.expand(image, border=24, fill=(0, 0, 0, 0))
        image.save(target / name, "WEBP", quality=90)
        url = f"/project/products/first15-truper/{name}"
        illustration = path.suffix.lower() == ".png"
        images.append(url)
        gallery.append({
            "src": url,
            "kind": "illustration" if illustration else "photo",
            "caption": (f"Ilustración aportada · {data['clave']} · {index}"
                        if illustration else f"Fotografía del producto · {data['clave']} · {index}"),
            "provenance": "Owner-supplied primeros-15-truper batch; not independently reverified.",
        })
        assets.append({"source": path.name, "output": url,
                       "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
                       "kind": gallery[-1]["kind"]})
    handle = f"{code}-{data['clave'].lower()}".replace("/", "-")
    includes = "; ".join(data["includes"])
    products.append({
        "reference": code, "handle": handle, "title": data["name"],
        "category": "seleccion-inicial", "brand": data["brand_grupo_truper"],
        "model": data["clave"], "description": data["name"],
        "summary": data["name"], "price_cop": None,
        "images": images, "gallery": gallery,
        "specifications": {"Incluye": includes},
        "source_url": data["ficha_url"], "image_source_url": data["ficha_url"],
        "approved_by": "project-owner-supplied-selection", "approved_at": "2026-11-27",
    })
    scenes[code] = {
        "model": data["clave"], "includes": includes,
        "main": images[3] if code == "104271" else images[0],
        "project": images[1] if len(images) > 1 else images[0],
        "components": [{"id": f"accessory-{i}", "src": images[index - 1],
                        "label": label, "detail": detail + " · ilustración aportada"}
                       for i, (index, label, detail) in enumerate(components.get(code, []))],
    }
    provenance.append({"reference": code, "folder": ficha.parent.name,
                       "source_json_sha256": hashlib.sha256(raw).hexdigest(),
                       "supplied_verification_claim": data.get("verified_against"),
                       "assets": assets})
assert len(products) == 14, "Expected 14 confirmed products; stop on source changes."
catalog = {"version": 1, "categories": [{"handle": "seleccion-inicial", "name": "Selección Ferready"}],
           "products": products}
out = root / "data/project"
out.mkdir(parents=True, exist_ok=True)
(out / "first15-truper.json").write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n")
(out / "first15-truper-scenes.json").write_text(json.dumps(scenes, ensure_ascii=False, indent=2) + "\n")
(out / "first15-truper-provenance.json").write_text(json.dumps({
    "source_batch": "primeros-15-truper", "confirmed": provenance,
    "pending": [{"position": 15, "name": "Manguera para lavamanos",
                 "status": "pending", "reference": None, "images": [],
                 "reason": "Owner requested leaving the unmatched reference pending."}],
}, ensure_ascii=False, indent=2) + "\n")
print(f"Prepared {len(products)} confirmed products, {sum(len(p['images']) for p in products)} images, 1 pending slot.")

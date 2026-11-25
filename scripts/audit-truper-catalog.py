"""Offline evidence matrix. Visual findings are explicit, not inferred from hashes."""
import hashlib
import json
import re
from collections import defaultdict
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
def load(path):
    return json.loads((ROOT / path).read_text())

def main():
    catalog = load("data/approved/catalog.json")["products"]
    research = {p["official_code"]: p for p in load("data/research/truper/products.json")["products"]}
    evidence = {p["reference"]: p for p in load("data/approved/truper-source-evidence.json")}
    audit = load("data/approved/truper-gallery-audit.json")
    contents = load("data/approved/truper-contents-selection.json")
    browser_reports = {}
    for mode, folder in (("reduced", "browser"), ("normal", "browser-normal")):
        proof = Path("/tmp/opencode/truper-all-validation") / folder / "proof.json"
        if proof.exists():
            report = json.loads(proof.read_text())
            assert not report["issues"] and not report["errors"], mode
            assert len(report["checks"]) == 432, mode
            browser_reports[mode] = report
    role_source = (ROOT / "apps/storefront/lib/editorial-media.mjs").read_text()
    projects = {ref: match.group(1) for ref, body in re.findall(r'"(\d+)": \{([^}]+)\}', role_source)
                if (match := re.search(r'project: "([a-f0-9]+)"', body))}
    notes = {
        "101895": "6-inch pneumatic orbital sander. Pad 19390 is a mounted component, not this SKU's own code; wrench inclusion unknown.",
        "103068": "Regression only: exact TAL-1/2N2 user-confirmed handle and key; retain three pieces, not a fourth duplicate mounted handle.",
        "103740": "7-1/4-inch circular saw; detached Nuevo badge removed. Blade/guide/key illustration exists, but full package inclusion is not cached.",
        "103741": "10-inch table saw with visible fence/guard; one manufacturer composition, no isolated accessory sources.",
        "104271": "Title explicitly confirms two 4-Ah batteries. Photo shows mounted plus loose battery, bag, handle and charger. Isolated battery marking matches 20V/4Ah; no full included-items block. Detached Nuevo badge removed.",
        "104275": "Two-tool combo manufacturer composition shows drills, charger, bag and bit cases. Individual tool illustrations are alternate product views; exact loose bit counts/inclusion not independently specified.",
        "104412": "Title explicitly confirms one 2-Ah battery. Original is an annotated infographic, not a clean cutout. Isolated slide-pack battery has a different form factor from the compact handle battery; do not substitute. Adapter/clip/charger inclusion unresolved.",
        "11452": "Original engraving BROU-R2 1/4M checked. Supplied alternate engraving is legible at full resolution, correcting the previous unreadable-label rationale; altered cutting-tip geometry still prevents faithful-view approval.",
        "13448": "3x21-inch belt sander. Vent close-up is detail only, not project/contents. Loose bag and belt exist, but exact loose inventory is unconfirmed.",
        "14012": "7-inch PRO grinder; retained product illustrations show 7-inch disc. Shared flange/handle/guard/brush/wrench/disc files under 16590 are not cross-SKU proof.",
        "16182": "Floor drill press, 17-inch swing and B16 chuck taper in cached specs. Three feed handles appear mounted; loose render does not imply three additional handles.",
        "16590": "9-inch/2350-W INDUSTRIAL grinder. Removed all four supplied complete-product renders: three display 6-inch/150-mm discs; the nominally 9-inch render has corrupted motor power. Separate 7-inch disc also wrong. Manufacturer photo retained.",
        "103030": "10-L horizontal lubricated compressor. SAE30 is required oil type, not proof the illustrated 250-ml bottle is shipped; filter/cap/hardware inclusion unknown.",
        "104215": "400-ml double-action aerosol bottle; a single complete product, no isolated additional items.",
        "104491": "50-L vertical white medical-grade compressor; not the orange 10-L model. No extra loose images.",
        "10745": "9-inch bare roller cage/frame; absence of paint sleeve is correct, not missing imagery.",
        "12465": "1/2-inch wood-handled camel-hair brush. Cached handle conversion says 4-3/4 inches (118 cm), internally inconsistent; do not silently invent a replacement value.",
        "13879": "9-inch roller with thick pink sleeve and frame as photographed; no isolated spare sleeve.",
        "17849": "1/2-inch black plastic-handled EXPERT brush; distinct from wood-handled 12465.",
        "100416": "Orange 5.5-ft3 wheelbarrow; solid tire differentiates it from red pneumatic 11776.",
        "102639": "12-inch rounded trowel with wooden handle and six-rivet specification; no loose components.",
        "11776": "Red 6-ft3 wheelbarrow with pneumatic tire; no extra wheel inferred.",
        "15020": "Garden trowel with wooden handle; garden classification preserved despite construction source folder.",
        "15850": "2-inch flexible stainless putty knife, black/orange handle; one complete tool.",
        "19784": "Two-bearing set identity is cached; only a retailer candidate photo exists. Manufacturer-photo provenance remains unresolved; no synthetic replacement.",
        "100105": "10-inch/40-tooth saw blade with 1-inch bore; original printed markings match reference identity.",
        "102364": "Five SDS Plus concrete bits in one manufacturer set photograph; contents-as-product, no duplicated five-tool inventory.",
        "103660": "14-inch cut-off saw with D handle. Alternate product angles retained; isolated 14-inch disc/hex key/brushes do not prove package inventory.",
        "104549": "120-cm laser tile cutter; title states carrying case, but case image is unavailable. Cached spec explicitly excludes two AAA batteries; never add them as included.",
        "11110": "1/16-inch HSS metal drill bit, single item; no kit inferred.",
        "11423": "5/8x11 UNC tap; title states individual case but no isolated case image exists.",
        "12544": "3-inch/1-mm abrasive disc identity; retailer candidate shows matching code but does not establish manufacturer photo provenance.",
        "15711": "7-inch/40-grit flap disc with 7/8-inch bore; printed 15711 checked, not a grinder accessory reused from another SKU.",
        "17025": "Orange folding utility knife, blade open; not a loose blade set.",
        "17903": "Case of ten 25-mm SK4 blades; cached Contenido=10 Cuchillas confirms quantity, not ten extra cases.",
        "50004": "29-piece metal-drill-bit set with orange case; manufacturer set composition retained, not decomposed into invented isolated pieces.",
    }
    known = {
        "104271": "Manufacturer cached title: two batteries, 4 Ah each; full loose inventory still pending.",
        "104412": "Manufacturer cached title: one battery, 2 Ah; isolated slide-pack illustration is not faithful.",
        "104549": "Manufacturer cached title: carrying case; specifications explicitly exclude 2 AAA batteries. No case image.",
        "11423": "Manufacturer cached title: individual case; no isolated case image.",
        "102364": "Manufacturer cached title/photo: set of five bits.",
        "50004": "Manufacturer cached title/photo: 29 bits in case.",
        "17903": "Manufacturer cached specifications: ten blades in case.",
        "19784": "Manufacturer cached title: set of two bearings; usable photo unavailable.",
    }
    hashes = defaultdict(list)
    for item in audit["inventory"]:
        digest = hashlib.sha256((ROOT / item["source"]).read_bytes()).hexdigest()
        assert digest == item["sha256"], item["source"]
        hashes[digest].append(item)
    duplicates = [[{"reference": x["reference"], "source": x["source"]} for x in group]
                  for group in hashes.values() if len({x["reference"] for x in group}) > 1]
    for group in hashes.values():
        if len({x["reference"] for x in group}) > 1:
            assert all(x["role"] == "not-selected" for x in group), "Cross-SKU duplicate entered the approved set"
    matrix = []
    for product in catalog:
        ref = product["reference"]
        source = research[ref]
        same = product["model"] == source["model"] and product["title"] == source["name"] and product["specifications"] == source["specifications"]
        assert same, ref
        views = []
        for view in product["gallery"]:
            file = ROOT / "apps/storefront/public" / view["src"].lstrip("/")
            with Image.open(file).convert("RGBA") as image:
                bbox = image.getchannel("A").getbbox()
                assert bbox and image.getpixel((0, 0))[3] == 0, view["src"]
                assert bbox[0] == image.width - bbox[2] and bbox[1] == image.height - bbox[3], view["src"]
                views.append({"src": view["src"], "kind": view["kind"], "dimensions": list(image.size),
                              "alpha_bbox": list(bbox), "sha256": hashlib.sha256(file.read_bytes()).hexdigest()})
        for original in product["images"]:
            file = ROOT / "apps/storefront/public" / original.lstrip("/")
            assert hashlib.sha256(file.read_bytes()).hexdigest() == evidence[ref]["photograph_sha256"], ref
        files = [x for x in audit["inventory"] if x["reference"] == ref]
        main_src = next((x["src"] for x in views if x["kind"] == "photo"), None)
        project_src = next((x["src"] for x in views if projects.get(ref) and projects[ref] in x["src"]), main_src)
        table_sources = ([main_src] if main_src else []) + [x["src"] for x in contents.get(ref, {}).get("components", [])]
        matrix.append({
            "reference": ref, "model": product["model"], "handle": product["handle"], "category": product["category"],
            "scope": "regression" if ref == "103068" else "requested-other-reference",
            "identity_matches_cached_manufacturer": same,
            "source_url": product["source_url"], "source_files": files, "source_image_count": len(files),
            "approved_media_count": len(views), "published_views": views,
            "stage_policy": ["manufacturer-photo", "explicit-reviewed-alternate-or-main", "confirmed-components-or-product-only", "illustrative-packing"],
            "stage_sources": [[main_src] if main_src else [], [project_src] if project_src else [], table_sources, table_sources],
            "table_piece_count": 3 if ref == "103068" else 1 if product["images"] else 0,
            "contents_evidence": "Exact user confirmation (not manufacturer verification)." if ref in contents else known.get(ref, "No full reference-specific included-items block cached. No extra package inventory asserted."),
            "contents_confirmation": "user-exact-reference" if ref in contents else "partial-manufacturer-facts" if ref in known else "no-extra-inventory-asserted",
            "visual_findings": notes[ref],
            "photo_status": "missing-provenance" if not product["images"] else "annotated-original" if ref == "104412" else "manufacturer-photo",
            "browser_checks": {mode: len([x for x in report["checks"] if x["reference"] == ref])
                               for mode, report in browser_reports.items()},
        })
    output = {"scope": "All 35 other references plus 103068 regression; no network extraction or generation.",
              "visual_evidence_directory": "/tmp/opencode/truper-all-validation",
              "summary": {"references": 36, "requested_other_references": 35, "source_files_visually_reviewed": 109,
                          "manufacturer_photos": 34, "retained_illustrations": len(audit["approved"]),
                          "confirmed_accessory_illustrations": 2, "excluded_illustrations": len(audit["excluded"])},
              "cross_reference_identical_sources": duplicates, "matrix": matrix}
    output["browser_verification"] = {
        mode: {"stage_checks": len(report["checks"]), "asset_urls": len(report["assets"]),
               "issues": report["issues"], "browser_errors": report["errors"]}
        for mode, report in browser_reports.items()
    }
    destination = ROOT / "data/approved/truper-catalog-validation.json"
    destination.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps(output["summary"]))
    print("Cross-reference duplicate groups:", len(duplicates))

if __name__ == "__main__":
    main()

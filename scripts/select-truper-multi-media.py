"""Select the owner's twenty multi-image folders, with explicit conflict exclusions."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MULTI_REFERENCES = {
    "101895", "103068", "104271", "104275", "104412", "13448", "14012",
    "16182", "16590", "103030", "103660", "104495", "103722", "100891",
    "100894", "104242", "104274", "13178", "100362", "104111",
}
CONFLICTS = {
    "644c0caf82d9": "Isolated wide slide-mount battery conflicts with the compact tool's narrow base.",
    "a47544132e6a": "Full-resolution label says 100 mAh; verified ARBA-12 capacity is 12,000 mAh.",
    "befa6ef3f2b2": "Full-resolution rear label says 10,000 mAh / 3.7 V; verified ARBA-12 is 12,000 mAh / 14.8 V.",
    "39c029f942e0": "Full-resolution rear label says NLL-4D / 20 V; verified product is NL-16 / 11.1 V.",
}


def main():
    audit = json.loads((ROOT / "data/approved/truper-image-classification.json").read_text())
    catalog = json.loads((ROOT / "data/approved/catalog.json").read_text())
    references = {p["reference"] for p in catalog["products"]}
    multi = MULTI_REFERENCES
    available = {f["reference"] for f in audit["folders"] if f["source_count"] > 2}
    if not multi <= available:
        raise ValueError("An explicitly approved multi-image folder is missing.")
    confirmed = json.loads((ROOT / "data/approved/truper-contents-selection.json").read_text())
    confirmed_sources = {c["source"] for entry in confirmed.values() for c in entry["components"]}
    selection = []
    excluded = []
    seen = set()
    for entry in audit["files"]:
        if entry["reference"] not in multi & references:
            continue
        path = entry["path"]
        if Path(path).name.startswith(("original-", "candidato-")) or path in confirmed_sources:
            continue
        # This battery's wide slide mount conflicts with the pictured narrow base.
        conflict = CONFLICTS.get(entry["sha256"][:12])
        if entry["classification"] in ("incompatible", "uncertain") or conflict:
            excluded.append({"source": path, "reason": conflict or entry["observation"]})
            continue
        identity = (entry["reference"], entry["sha256"])
        if identity in seen:
            continue
        seen.add(identity)
        role = "accessory" if entry["classification"] in ("accessory", "accessory_group") else "detail" if entry["classification"] == "detail" else "angle"
        if entry["sha256"].startswith("c1e068f39122"):
            role = "detail"  # Supplied partial front panel, not a complete-product angle.
        selection.append({
            "reference": entry["reference"], "source": path, "sha256": entry["sha256"],
            "role": role, "observation": entry["observation"],
            "authorization": "owner-approved-2026-11-24",
        })
    (ROOT / "data/approved/truper-gallery-selection.json").write_text(json.dumps(selection, ensure_ascii=False, indent=2) + "\n")
    (ROOT / "data/approved/truper-multi-media-exclusions.json").write_text(json.dumps(excluded, ensure_ascii=False, indent=2) + "\n")
    print(f"Selected {len(selection)} illustrations across {len(multi & references)} folders; excluded {len(excluded)} conflicts.")


if __name__ == "__main__":
    main()

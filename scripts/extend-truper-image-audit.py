"""Extend the reviewed image inventory; never import commercial products."""

from collections import Counter, defaultdict
import hashlib
import json
from pathlib import Path
import shutil

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
AUDIT = ROOT / "data/approved/truper-image-classification.json"
PROOF = ROOT / "docs/assets/truper-image-classification"
REVIEW = Path("/tmp/opencode/truper-full-audit")

# These positions refer to the saved, visually opened contact sheets, not
# filename-derived classifications. They are resolved to exact paths below.
ACCESSORIES = {
    18: "Estuche rígido negro y naranja",
    19: "Dos boquillas negras y dos agujas metálicas",
    20: "Cable rojo y negro con pinzas y módulo",
    21: "Manguera corta flexible con conectores",
    22: "Cabezal de inflado con palanca",
    36: "Llave hexagonal larga", 37: "Llave hexagonal corta",
    38: "Conector neumático roscado",
    43: "Cincel de punta", 44: "Cincel plano",
    45: "Tubo blanco sin rotulado visible",
    62: "Cincel de punta", 63: "Cincel plano",
    64: "Dos tubos rotulados como grasa",
    65: "Dos carbones con conductor trenzado",
    66: "Mango auxiliar con abrazadera",
    67: "Cuatro tornillos negros", 68: "Llave hexagonal",
    75: "Mango auxiliar con abrazadera",
    76: "Cuatro tornillos negros", 77: "Llave hexagonal",
    80: "Conector neumático", 83: "Cargador negro",
    86: "Batería naranja y negra",
    94: "Llave hexagonal", 97: "Conector neumático",
    98: "Segunda llave hexagonal", 100: "Dos tubos blancos sin etiqueta",
    103: "Botella translúcida de aceite",
    161: "Puntas de prueba roja y negra",
    162: "Sonda térmica con cable blanco",
    163: "Adaptador pequeño negro y rojo",
    164: "Cubierta protectora negra", 165: "Pila rectangular de 9 V",
    167: "Soporte negro con dos imanes",
    168: "Cable USB-A a USB-C", 169: "Batería naranja de 12 V",
}
ANGLES = {
    15, 16, 17, 33, 34, 35,
    *range(46, 58), 59, 60, 61, 78, 79,
    82, 85, 87, 99, 101, 102, 158, 159, 160, 170, 171, 172,
}
CONFLICTS = {
    95: "Cincel plano de demolición: no representa una pieza propia de la engrapadora mostrada",
    96: "Cincel de punta de demolición: no representa una pieza propia de la engrapadora mostrada",
    84: "Composición de tres herramientas distintas; no atribuir este conjunto al producto individual",
}
PRIMARY_NOTES = {
    9: "Flotador negro con vástago",
    40: "Carrete de hilo naranja",
    72: "Mango largo de madera",
    90: "Mango corto de madera",
    91: "Ficha de punzones con tabla de variantes: no identifica visualmente una sola variante",
    122: "Grupo de grapas metálicas",
    124: "Llave de cruz",
    125: "Hoja para sierra sable",
    129: "Tres extensiones metálicas para dados",
    136: "Manguera plana azul enrollada",
    137: "Azadón de mango largo",
}


def main():
    audit = json.loads(AUDIT.read_text())
    if audit.get("scope") == "full-research-image-root":
        write_report(audit)
        return
    previous = audit["summary"]
    paths = json.loads((REVIEW / "index.json").read_text())
    existing = {row["path"] for row in audit["files"]}
    actual = {
        str(p.relative_to(ROOT))
        for p in (ROOT / "data/research/truper/images").rglob("*")
        if p.suffix.lower() in (".png", ".jpg", ".jpeg", ".webp")
    }
    assert set(paths) == actual - existing
    PROOF.mkdir(exist_ok=True, parents=True)
    for sheet in REVIEW.glob("new-*.jpg"):
        shutil.copyfile(sheet, PROOF / sheet.name)
    (PROOF / "full-root-additional-index.json").write_text(
        json.dumps(paths, indent=2) + "\n"
    )
    for index, path in enumerate(paths):
        source = ROOT / path
        classification = (
            "incompatible" if index in CONFLICTS else
            "accessory" if index in ACCESSORIES else
            "angle" if index in ANGLES else
            "kit" if index == 88 else "primary"
        )
        observation = CONFLICTS.get(index) or ACCESSORIES.get(index)
        if not observation:
            observation = PRIMARY_NOTES.get(index) or (
                "Vista del cuerpo completo; comparar geometría y rotulado con el original de la carpeta"
                if classification == "angle" else
                "Composición de herramienta, bolsa, cargador y batería"
                if classification == "kit" else
                "Vista de referencia del producto o conjunto, observada en lámina; no prueba de cantidades incluidas"
            )
        with Image.open(source) as image:
            size = list(image.size)
        audit["files"].append({
            "folder": source.parent.name, "path": path,
            "number": index + 1, "sha256": hashlib.sha256(source.read_bytes()).hexdigest(),
            "size": size, "reference": source.parent.name.split("-")[0],
            "classification": classification, "observation": observation,
            "visual_review": "opened-full-root-contact-sheet",
            "visual_evidence": f"docs/assets/truper-image-classification/new-{index // 40 * 40}.jpg",
            "visual_evidence_position": index,
            "provenance_kind": "source-attribution-not-independently-verified",
            "provenance_note": "Owner-supplied asset; source and manufacturer-photography status not inferred from filename.",
            "same_sha256_other_paths": [],
            "current_usage": {"selection": "not-evaluated-outside-existing-36"},
            "matching_confidence": "visual-family-only-exact-model-not-certified",
            "inclusion_status": "not-confirmed",
            "recommended_usage": "hold-model-conflict" if classification == "incompatible" else
                "labeled-accessory-illustration-no-inclusion-claim" if classification == "accessory"
                else "owner-approved-asset-model-review-before-publication",
            "recommended_chapter_role": "none-pending" if classification == "incompatible"
                else "illustrated-accessory" if classification == "accessory"
                else "product-view" if classification == "angle" else "overview",
        })
    for row in audit["files"]:
        row["usage_authorization"] = "owner-approved-2026-11-24"
        if row["classification"] in ("accessory", "accessory_group"):
            if row["recommended_chapter_role"] != "contents":
                row["recommended_usage"] = "labeled-accessory-illustration-no-inclusion-claim"
                row["recommended_chapter_role"] = "illustrated-accessory"
        row["publication_state"] = "prepared-not-published-by-this-audit"
    groups = defaultdict(list)
    hashes = defaultdict(list)
    for row in audit["files"]:
        groups[row["folder"]].append(row)
        hashes[row["sha256"]].append(row["path"])
    for row in audit["files"]:
        row["same_sha256_other_paths"] = [
            p for p in hashes[row["sha256"]] if p != row["path"]
        ]
    audit["scope_history"] = [{"scope": "four-category-restricted-audit", "summary": previous}]
    audit["scope"] = "full-research-image-root"
    audit["status"] = "owner-authorized-assets-visual-audit-not-catalog-import"
    audit["limits"] = [
        "Owner explicitly permits supplied illustrations and additional assets on 2026-11-24; no blanket illustration or licensing exclusion.",
        "Authorization does not establish exact model, accessory fit or manufacturer package inclusion.",
        "Accessories may be presented as illustrations without an included-in-box claim; conflicts remain separate.",
        "Original 109 observations retained; additional 229 files opened in six indexed contact sheets, not individually at full resolution.",
        "Small contact sheets establish visual family, not independently certified exact-model identity.",
        "No website, Medusa, commercial catalog or original image was modified by this extension.",
    ]
    audit["folders"] = [
        {"folder": folder, "reference": rows[0]["reference"], "source_count": len(rows),
         "classification_counts": dict(Counter(r["classification"] for r in rows))}
        for folder, rows in sorted(groups.items())
    ]
    audit["summary"] = {
        "folders": len(groups), "source_images": len(audit["files"]),
        "folders_over_two": sum(len(rows) > 2 for rows in groups.values()),
        "folders_with_two": sum(len(rows) == 2 for rows in groups.values()),
        "folders_with_one": sum(len(rows) == 1 for rows in groups.values()),
        "classification_counts": dict(Counter(r["classification"] for r in audit["files"])),
    }
    assert len(groups) == 189 and len(audit["files"]) == 338
    AUDIT.write_text(json.dumps(audit, ensure_ascii=False, indent=2) + "\n")
    write_report(audit)
    print(json.dumps(audit["summary"], indent=2))


def write_report(audit):
    lines = [
        "# Full-root Truper visual inventory",
        "",
        "338 files / 189 folders. Owner authorization: 2026-11-24.",
        "This is preparation, not a catalog import or publication.",
        "Small-sheet review is not exact-model certification or package-inclusion evidence.",
        "",
        "## All 20 folders containing more than two files",
        "",
        "| Folder | Files | Observed roles |",
        "|---|---:|---|",
    ]
    for folder in audit["folders"]:
        if folder["source_count"] > 2:
            roles = ", ".join(f"{key}: {value}" for key, value in folder["classification_counts"].items())
            lines.append(f"| {folder['folder']} | {folder['source_count']} | {roles} |")
    lines.extend(["", "## Additional 229 files — exact-path review", ""])
    for row in audit["files"]:
        if "visual_evidence" not in row:
            continue
        lines.extend([
            f"### `{row['path']}`", "",
            f"- Classification: `{row['classification']}`.",
            f"- Observed: {row['observation']}.",
            f"- Role: `{row['recommended_chapter_role']}`; inclusion: `{row['inclusion_status']}`.",
            f"- Review proof: [{row['visual_evidence_position']}]"
            f"(assets/truper-image-classification/{Path(row['visual_evidence']).name}).",
            f"- SHA-256: `{row['sha256']}`.", "",
        ])
    (ROOT / "docs/truper-image-classification-full-root.md").write_text("\n".join(lines) + "\n")


if __name__ == "__main__":
    main()

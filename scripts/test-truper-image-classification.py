"""Verify audit coverage, not the truth of visual judgments."""

import hashlib
import json
from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]


class ImageClassificationTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.audit = json.loads(
            (ROOT / "data/approved/truper-image-classification.json").read_text()
        )

    def test_exhaustive_source_coverage(self):
        actual = {
            str(path.relative_to(ROOT))
            for path in (ROOT / "data/research/truper/images").rglob("*")
            if path.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp")
        }
        files = self.audit["files"]
        self.assertEqual(len(files), 338)
        self.assertEqual(len({row["folder"] for row in files}), 189)
        self.assertEqual({row["path"] for row in files}, actual)
        self.assertEqual(len({row["path"] for row in files}), len(files))

    def test_hashes_observations_and_roles(self):
        allowed = {
            "primary", "kit", "angle", "detail", "accessory",
            "accessory_group", "incompatible", "uncertain",
        }
        for row in self.audit["files"]:
            with self.subTest(path=row["path"]):
                self.assertEqual(
                    hashlib.sha256((ROOT / row["path"]).read_bytes()).hexdigest(),
                    row["sha256"],
                )
                self.assertIn(row["classification"], allowed)
                self.assertTrue(row["observation"])
                self.assertTrue(row["visual_review"].startswith("opened-"))
                self.assertIn(row["recommended_chapter_role"],
                              ("overview", "product-view", "detail", "contents",
                               "none-pending", "illustrated-accessory"))
                self.assertEqual(row["usage_authorization"],
                                 "owner-approved-2026-11-24")
                if row["recommended_chapter_role"] == "contents":
                    self.assertEqual(row["reference"], "103068")
                    self.assertEqual(row["inclusion_status"],
                                     "user-confirmed-2026-11-23")

    def test_summary_and_contact_sheets(self):
        folders = self.audit["folders"]
        self.assertEqual(sum(row["source_count"] for row in folders), 338)
        self.assertEqual(sum(row["source_count"] > 2 for row in folders), 20)
        self.assertEqual(sum(row["source_count"] == 2 for row in folders), 3)
        self.assertEqual(sum(row["source_count"] == 1 for row in folders), 166)
        proof = ROOT / "docs/assets/truper-image-classification"
        for folder in folders:
            if folder["source_count"] > 1 and folder["folder"] in {
                row["folder"] for row in self.audit["files"]
                if row["visual_review"] == "opened-contact-sheet"
            }:
                self.assertTrue((proof / (folder["folder"] + ".jpg")).is_file())
        for filename in ("singles-0.jpg", "singles-12.jpg"):
            self.assertTrue((proof / filename).is_file())
        for row in self.audit["files"]:
            if "visual_evidence" in row:
                self.assertTrue((ROOT / row["visual_evidence"]).is_file())
        index = json.loads((proof / "full-root-additional-index.json").read_text())
        added = [row for row in self.audit["files"] if "visual_evidence" in row]
        self.assertEqual(len(index), 229)
        self.assertEqual({row["path"] for row in added}, set(index))
        for row in added:
            self.assertEqual(index[row["visual_evidence_position"]], row["path"])

    def test_authorization_does_not_assert_inclusion_or_override_conflicts(self):
        for row in self.audit["files"]:
            if row["classification"] == "incompatible":
                self.assertEqual(row["recommended_chapter_role"], "none-pending")
            if row["classification"] in ("accessory", "accessory_group"):
                self.assertIn(row["recommended_chapter_role"],
                              ("contents", "illustrated-accessory"))


if __name__ == "__main__":
    unittest.main()

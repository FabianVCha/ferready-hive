"""Pixel invariants for deterministic background removal."""
import importlib.util
import unittest
from pathlib import Path
from PIL import Image

spec = importlib.util.spec_from_file_location("galleries", Path(__file__).with_name("prepare-truper-galleries.py"))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class BackgroundTests(unittest.TestCase):
    def test_bright_product_colors_are_not_treated_as_white(self):
        image = Image.new("RGB", (5, 5), "white")
        colors = [(255, 0, 0), (255, 180, 0), (255, 255, 0)]
        for x, color in enumerate(colors, 1):
            image.putpixel((x, 2), color)
        output, _ = module.cutout(image)
        for x, color in enumerate(colors, 1):
            self.assertEqual(output.getpixel((x, 2)), (*color, 255))
        self.assertEqual(output.getpixel((0, 0))[3], 0)

    def test_enclosed_whites_and_product_rgb_are_preserved(self):
        image = Image.new("RGB", (9, 9), "white")
        for x in range(2, 7):
            for y in range(2, 7):
                image.putpixel((x, y), (25, 30, 35))
        image.putpixel((4, 4), (255, 255, 255))
        output, _ = module.cutout(image)
        self.assertEqual(output.getpixel((0, 0))[3], 0)
        self.assertEqual(output.getpixel((4, 4))[3], 255)
        self.assertEqual(output.convert("RGB").tobytes(), image.tobytes())

    def test_existing_alpha_is_not_resegmented(self):
        image = Image.new("RGBA", (3, 3), (255, 255, 255, 128))
        output, method = module.cutout(image)
        self.assertEqual(method, "supplied-alpha")
        self.assertEqual(output.tobytes(), image.tobytes())

    def test_framing_trims_padding_without_changing_object_geometry(self):
        image = Image.new("RGBA", (100, 160), (0, 0, 0, 0))
        for x in range(30, 70):
            for y in range(60, 80):
                image.putpixel((x, y), (20, 30, 40, 255))
        output = module.frame_object(image)
        self.assertEqual(output.size, (44, 24))
        self.assertEqual(output.getchannel("A").getbbox(), (2, 2, 42, 22))
        self.assertEqual(output.crop((2, 2, 42, 22)).tobytes(),
                         image.crop((30, 60, 70, 80)).tobytes())

    def test_reviewed_sources_exist_and_match_hashes(self):
        import hashlib
        for path, entry in module.APPROVED.items():
            self.assertEqual(hashlib.sha256((module.ROOT / path).read_bytes()).hexdigest(), entry["sha256"])

    def test_badge_cleanup_preserves_every_pixel_outside_reviewed_corner(self):
        image = Image.new("RGBA", (1800, 1800), (20, 30, 40, 255))
        for reference in ("103740", "104271"):
            output = module.remove_reviewed_badge(image, reference)
            self.assertEqual(output.getpixel((0, 0))[3], 0)
            self.assertEqual(output.crop((380, 0, 1800, 1800)).tobytes(),
                             image.crop((380, 0, 1800, 1800)).tobytes())
            self.assertEqual(output.crop((0, 220, 380, 1800)).tobytes(),
                             image.crop((0, 220, 380, 1800)).tobytes())
            self.assertEqual(image.getpixel((0, 0))[3], 255)
        self.assertIs(module.remove_reviewed_badge(image, "103068"), image)
        with self.assertRaises(ValueError):
            module.remove_reviewed_badge(Image.new("RGBA", (900, 900)), "103740")

    def test_every_published_view_has_transparent_and_even_canvas_margins(self):
        import json
        catalog = json.loads((module.ROOT / "data/approved/catalog.json").read_text())
        views = [view for product in catalog["products"] for view in product["gallery"]]
        views.extend(component for entry in module.CONTENTS.values() for component in entry["components"])
        for view in views:
                with self.subTest(src=view["src"]):
                    image = Image.open(module.ROOT / "apps/storefront/public" / view["src"].lstrip("/")).convert("RGBA")
                    left, top, right, bottom = image.getchannel("A").getbbox()
                    self.assertGreater(left, 0)
                    self.assertGreater(top, 0)
                    self.assertEqual(left, image.width - right)
                    self.assertEqual(top, image.height - bottom)
                    self.assertEqual(image.getpixel((0, 0))[3], 0)
                    if view.get("kind") == "illustration":
                        self.assertLessEqual(max(image.size), 1200)

    def test_contents_approval_is_limited_to_the_confirmed_reference(self):
        import hashlib
        self.assertEqual(list(module.CONTENTS), ["103068"])
        entry = module.CONTENTS["103068"]
        self.assertEqual(entry["model"], "TAL-1/2N2")
        self.assertEqual(entry["confirmation"]["source"], "user-confirmed")
        self.assertFalse(entry["confirmation"]["manufacturer_verified"])
        self.assertEqual([component["id"] for component in entry["components"]], ["handle", "key"])
        for component in entry["components"]:
            self.assertEqual(hashlib.sha256((module.ROOT / component["source"]).read_bytes()).hexdigest(), component["sha256"])

if __name__ == "__main__":
    unittest.main()

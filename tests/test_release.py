import json
import os
from pathlib import Path
import subprocess
import unittest
from zipfile import ZipFile


ROOT = Path(__file__).resolve().parent.parent
PROJECT_URL = "https://gitlab.example.org/group/enigma-box"


class ReleasePackagingTest(unittest.TestCase):
    def test_release_assets_match_and_point_to_the_tag(self):
        source = json.loads((ROOT / "module.json").read_text(encoding="utf-8"))
        tag = f"v{source['version']}"
        env = os.environ.copy()
        env.update(CI_PROJECT_URL=PROJECT_URL, CI_COMMIT_TAG=tag)
        subprocess.run(["node", "tooling/check-release.js", tag], cwd=ROOT, check=True)
        subprocess.run(["python3", "tooling/package.py"], cwd=ROOT, env=env, check=True)

        manifest = json.loads((ROOT / "dist/module.json").read_text(encoding="utf-8"))
        self.assertEqual(manifest["version"], source["version"])
        self.assertEqual(manifest["manifest"], f"{PROJECT_URL}/-/releases/permalink/latest/downloads/module.json")
        self.assertEqual(manifest["download"], f"{PROJECT_URL}/-/releases/{tag}/downloads/enigma-box.zip")
        with ZipFile(ROOT / "dist/enigma-box.zip") as archive:
            self.assertIsNone(archive.testzip())
            self.assertEqual(json.loads(archive.read("module.json")), manifest)
            for path in source["esmodules"] + source["styles"]:
                self.assertIn(path, archive.namelist())
            self.assertNotIn("package.json", archive.namelist())

    def test_mismatched_tag_is_rejected(self):
        result = subprocess.run(
            ["node", "tooling/check-release.js", "v999999.999999.999999"],
            cwd=ROOT, capture_output=True,
        )
        self.assertNotEqual(result.returncode, 0)


if __name__ == "__main__":
    unittest.main()

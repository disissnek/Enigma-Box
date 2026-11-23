import json
import os
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile


root = Path(__file__).resolve().parent.parent
output = root / "dist" / "enigma-box.zip"
output.parent.mkdir(exist_ok=True)

manifest = json.loads((root / "module.json").read_text(encoding="utf-8"))
project_url = os.environ.get("CI_PROJECT_URL")
tag = os.environ.get("CI_COMMIT_TAG")
if bool(project_url) != bool(tag):
    raise SystemExit("CI_PROJECT_URL and CI_COMMIT_TAG must both be set")
if project_url and tag:
    project_url = project_url.rstrip("/")
    manifest["manifest"] = f"{project_url}/-/releases/permalink/latest/downloads/module.json"
    manifest["download"] = f"{project_url}/-/releases/{tag}/downloads/enigma-box.zip"

manifest_bytes = (json.dumps(manifest, ensure_ascii=False, indent=2) + "\n").encode("utf-8")
(output.parent / "module.json").write_bytes(manifest_bytes)

with ZipFile(output, "w", compression=ZIP_DEFLATED) as archive:
    archive.writestr("module.json", manifest_bytes)
    for directory in ("scripts", "styles", "templates", "img", "sounds"):
        for path in sorted((root / directory).rglob("*")):
            if path.is_file():
                archive.write(path, path.relative_to(root))

print(f"Created {output.relative_to(root)}")

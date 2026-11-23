import { readFile, access } from "node:fs/promises";

const manifest = JSON.parse(await readFile("module.json", "utf8"));

for (const field of ["id", "title", "version"]) {
  if (typeof manifest[field] !== "string" || !manifest[field].trim()) {
    throw new Error(`module.json must contain a nonempty ${field}`);
  }
}

for (const field of ["esmodules", "styles"]) {
  if (!Array.isArray(manifest[field]) || !manifest[field].every(path => typeof path === "string" && path)) {
    throw new Error(`module.json ${field} must be an array of paths`);
  }
  for (const path of manifest[field]) {
    await access(path);
  }
}

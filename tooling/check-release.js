import { readFile } from "node:fs/promises";

const tag = process.argv[2] ?? "";
const manifest = JSON.parse(await readFile("module.json", "utf8"));

if (!/^v(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)$/.test(tag)) {
  throw new Error("Release tag must have the form v1.2.3");
}
if (tag.slice(1) !== manifest.version) {
  throw new Error(`Release tag ${tag} does not match module version ${manifest.version}`);
}

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { validateManifest } from "../src/validator/validateManifest.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const fixture = (relPath) =>
  JSON.parse(readFileSync(path.join(here, "fixtures", relPath), "utf8"));

const transcript = fixture("transcript.sample.json");

test("geldig manifest komt door de validator", () => {
  const manifest = fixture("manifest.geldig.json");
  const result = validateManifest(manifest, transcript);
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

const afkeurset = [
  ["ontbrekende-source-turns.json", "ontbrekende-source-turns"],
  ["onbekend-veld.json", "onbekend-veld"],
  ["ongeldig-label.json", "ongeldig-label"],
  ["niet-bestaande-beurt.json", "niet-bestaande-beurt"],
  ["ongeldig-autonomieniveau.json", "ongeldig-autonomieniveau"],
  ["edge-naar-onbestaande-taak.json", "onbestaande-taak-referentie"],
  ["cyclische-afhankelijkheid.json", "cyclische-afhankelijkheid"],
];

for (const [bestand, verwachteCategorie] of afkeurset) {
  test(`afkeurset: ${verwachteCategorie} wordt afgekeurd met reden`, () => {
    const manifest = fixture(`afkeurset/${bestand}`);
    const result = validateManifest(manifest, transcript);

    assert.equal(result.valid, false);
    assert.ok(
      result.errors.some((err) => err.category === verwachteCategorie),
      `verwachtte categorie "${verwachteCategorie}" in errors, kreeg: ${JSON.stringify(result.errors)}`,
    );
    for (const err of result.errors) {
      assert.ok(err.message && err.message.length > 0, "elke fout heeft een reden");
    }
  });
}

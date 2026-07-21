import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { compile } from "../src/compiler/compile.js";
import { validateManifest } from "../src/validator/validateManifest.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const goldenDir = path.join(here, "golden");

for (const naam of readdirSync(goldenDir)) {
  const caseDir = path.join(goldenDir, naam);
  const transcript = JSON.parse(readFileSync(path.join(caseDir, "input.json"), "utf8"));
  const meta = JSON.parse(readFileSync(path.join(caseDir, "meta.json"), "utf8"));

  test(`golden ${naam}: byte-gelijke uitvoer`, () => {
    const uitvoer = compile(transcript, meta);
    const verwachteDir = path.join(caseDir, "expected");
    const verwachteBestanden = readdirSync(verwachteDir);

    assert.deepEqual(
      Object.keys(uitvoer).sort(),
      verwachteBestanden.sort(),
      "compiler moet exact de verwachte bestandsnamen produceren",
    );

    for (const bestand of verwachteBestanden) {
      const verwacht = readFileSync(path.join(verwachteDir, bestand), "utf8");
      assert.equal(uitvoer[bestand], verwacht, `${naam}/${bestand} moet byte-gelijk zijn aan de golden fixture`);
    }
  });

  test(`golden ${naam}: hetzelfde transcript geeft byte-gelijke herhaling`, () => {
    const eerste = compile(transcript, meta);
    const tweede = compile(transcript, meta);
    assert.deepEqual(eerste, tweede);
  });

  test(`golden ${naam}: wereldmodel komt door de Stap 1-validator`, () => {
    const uitvoer = compile(transcript, meta);
    const manifestBestand = Object.keys(uitvoer).find((f) => f.startsWith("wereldmodel_"));
    const manifest = JSON.parse(uitvoer[manifestBestand]);
    const result = validateManifest(manifest, transcript);
    assert.equal(result.valid, true, JSON.stringify(result.errors));
  });
}

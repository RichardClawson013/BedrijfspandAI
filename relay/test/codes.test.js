import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { laadCodes, isGeldigeCode } from "../src/codes.js";

function maakCodesBestand(codes) {
  const dir = mkdtempSync(path.join(tmpdir(), "bedrijfspandai-codes-"));
  const bestand = path.join(dir, "codes.json");
  writeFileSync(bestand, JSON.stringify(codes), "utf8");
  return { bestand, dir };
}

test("laadCodes leest een JSON-array van toegangscodes", () => {
  const { bestand, dir } = maakCodesBestand(["abc-123", "def-456"]);
  try {
    assert.deepEqual(laadCodes(bestand), ["abc-123", "def-456"]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("laadCodes gooit een duidelijke fout als het geen array is", () => {
  const { bestand, dir } = maakCodesBestand({ niet: "een array" });
  try {
    assert.throws(() => laadCodes(bestand), /JSON-array/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("isGeldigeCode: bekende code is geldig", () => {
  assert.equal(isGeldigeCode("abc-123", ["abc-123", "def-456"]), true);
});

test("isGeldigeCode: onbekende code is ongeldig", () => {
  assert.equal(isGeldigeCode("niet-bestaand", ["abc-123"]), false);
});

test("isGeldigeCode: lege of ontbrekende code is altijd ongeldig", () => {
  assert.equal(isGeldigeCode("", ["abc-123"]), false);
  assert.equal(isGeldigeCode(undefined, ["abc-123"]), false);
  assert.equal(isGeldigeCode(null, ["abc-123"]), false);
});

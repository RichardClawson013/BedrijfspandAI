import { readFileSync } from "node:fs";
import { createHash, timingSafeEqual } from "node:crypto";

function hash(waarde) {
  return createHash("sha256").update(waarde, "utf8").digest();
}

export function laadCodes(codesPath) {
  const inhoud = readFileSync(codesPath, "utf8");
  const codes = JSON.parse(inhoud);
  if (!Array.isArray(codes)) {
    throw new Error(`${codesPath} moet een JSON-array van toegangscodes bevatten`);
  }
  return codes;
}

export function isGeldigeCode(code, codes) {
  if (typeof code !== "string" || code.length === 0) return false;

  const codeHash = hash(code);
  return codes.some((bekendeCode) => {
    const bekendeHash = hash(bekendeCode);
    return timingSafeEqual(codeHash, bekendeHash);
  });
}

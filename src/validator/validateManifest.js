import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import manifestSchema from "../schema/manifest.schema.json" with { type: "json" };

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validateSchema = ajv.compile(manifestSchema);

function categorizeSchemaError(err) {
  if (err.keyword === "additionalProperties") return "onbekend-veld";
  if (err.keyword === "required" && err.params?.missingProperty === "source_turns") {
    return "ontbrekende-source-turns";
  }
  if (err.keyword === "enum" && err.instancePath.endsWith("/dekking")) return "ongeldig-label";
  if (err.keyword === "enum" && err.instancePath.endsWith("/autonomie")) {
    return "ongeldig-autonomieniveau";
  }
  return "schema";
}

function findOnbestaandeBeurten(manifest, transcript) {
  const knownTurns = new Set((transcript ?? []).map((entry) => entry.turn));
  const errors = [];

  const check = (items, label) => {
    for (const item of items) {
      for (const turn of item.source_turns ?? []) {
        if (!knownTurns.has(turn)) {
          errors.push({
            category: "niet-bestaande-beurt",
            message: `${label} ${item.id ?? `${item.van}->${item.naar}`}: source_turns bevat beurt ${turn}, die niet in het transcript voorkomt`,
          });
        }
      }
    }
  };

  check(manifest.tasks ?? [], "taak");
  check(manifest.edges ?? [], "edge");

  return errors;
}

export function validateManifest(manifest, transcript) {
  const errors = [];

  const schemaValid = validateSchema(manifest);
  if (!schemaValid) {
    for (const err of validateSchema.errors) {
      errors.push({
        category: categorizeSchemaError(err),
        message: `${err.instancePath || "(root)"} ${err.message}`,
      });
    }
  }

  if (schemaValid) {
    errors.push(...findOnbestaandeBeurten(manifest, transcript));
  }

  return { valid: errors.length === 0, errors };
}

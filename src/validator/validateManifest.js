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

function findGraafinconsistenties(manifest) {
  const errors = [];
  const geldigeIds = new Set((manifest.tasks ?? []).map((taak) => taak.id));
  const edges = manifest.edges ?? [];

  for (const edge of edges) {
    for (const kant of ["van", "naar"]) {
      if (!geldigeIds.has(edge[kant])) {
        errors.push({
          category: "onbestaande-taak-referentie",
          message: `edge ${edge.van}->${edge.naar}: "${kant}" verwijst naar taak-id "${edge[kant]}", die niet in tasks voorkomt`,
        });
      }
    }
  }

  const cykel = vindCykel(edges);
  if (cykel) {
    errors.push({
      category: "cyclische-afhankelijkheid",
      message: `cyclische afhankelijkheid gevonden: ${cykel.join(" -> ")}`,
    });
  }

  return errors;
}

function vindCykel(edges) {
  const adjacency = new Map();
  const alleNodes = new Set();
  for (const edge of edges) {
    if (!adjacency.has(edge.van)) adjacency.set(edge.van, []);
    adjacency.get(edge.van).push(edge.naar);
    alleNodes.add(edge.van);
    alleNodes.add(edge.naar);
  }

  const WIT = 0;
  const GRIJS = 1;
  const ZWART = 2;
  const status = new Map();
  const pad = [];

  function dfs(node) {
    status.set(node, GRIJS);
    pad.push(node);
    for (const buur of adjacency.get(node) ?? []) {
      const buurStatus = status.get(buur) ?? WIT;
      if (buurStatus === GRIJS) {
        const cykelStart = pad.indexOf(buur);
        return [...pad.slice(cykelStart), buur];
      }
      if (buurStatus === WIT) {
        const gevonden = dfs(buur);
        if (gevonden) return gevonden;
      }
    }
    pad.pop();
    status.set(node, ZWART);
    return null;
  }

  for (const node of alleNodes) {
    if ((status.get(node) ?? WIT) === WIT) {
      const gevonden = dfs(node);
      if (gevonden) return gevonden;
    }
  }
  return null;
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
    errors.push(...findGraafinconsistenties(manifest));
  }

  return { valid: errors.length === 0, errors };
}

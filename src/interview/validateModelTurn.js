const BEURTTYPEN = new Set([
  "naamstap",
  "dialoog",
  "taak",
  "edge",
  "ziel_principe",
  "skill",
  "tool",
  "afronding",
]);

const DEKKINGSLABELS = new Set(["GEDEKT", "AFGELEID", "GEEN-DEKKING"]);
const SPREKERS = new Set(["interviewer", "ondernemer"]);
const AUTONOMIENIVEAUS = new Set(["autonoom", "eerst-vragen", "nooit"]);
const TOOLSOORTEN = new Set(["huidig", "suggestie"]);

// Toegestane velden per beurttype, in lijn met systemPrompt.js UITVOERFORMAAT
// en manifest.schema.json ($defs.task/$defs.edge). Een veld hierbuiten wordt
// nu al tijdens het interview afgekeurd (met kans op automatisch herstel via
// de bestaande retry), i.p.v. pas bij het compileren als additionalProperties-
// fout in het manifest.
const NAAMSTAP_TOPLEVEL_VELDEN = new Set(["turn", "type", "naam"]);
const DIALOOG_TOPLEVEL_VELDEN = new Set(["turn", "type", "spreker", "tekst"]);
const AFRONDING_TOPLEVEL_VELDEN = new Set(["turn", "type"]);
const DATA_BEURT_TOPLEVEL_VELDEN = new Set(["turn", "type", "data"]);

const TAAK_DATA_VELDEN = new Set([
  "id", "naam", "beschrijving", "trigger", "afhankelijk_van", "autonomie",
  "escalatie", "faalgevolg", "dekking", "source_turns",
]);
const EDGE_DATA_VELDEN = new Set(["van", "naar", "soort", "dekking", "source_turns"]);
const ZIEL_PRINCIPE_DATA_VELDEN = new Set(["titel", "tekst", "reden", "dekking", "source_turns"]);
const SKILL_DATA_VELDEN = new Set(["naam", "domein", "dekking", "source_turns"]);
const TOOL_DATA_VELDEN = new Set(["naam", "taak_id", "soort", "redenering", "dekking", "source_turns"]);

function voegFoutToe(errors, category, message) {
  errors.push({ category, message });
}

function valideerOnbekendeVelden(obj, toegestaneVelden, errors, context) {
  const onbekend = Object.keys(obj).filter((veld) => !toegestaneVelden.has(veld));
  if (onbekend.length > 0) {
    voegFoutToe(errors, "onbekend-veld", `${context}: onbekend veld/velden ${onbekend.join(", ")}`);
  }
}

function isNietLegeString(waarde) {
  return typeof waarde === "string" && waarde.length > 0;
}

function isObject(waarde) {
  return typeof waarde === "object" && waarde !== null && !Array.isArray(waarde);
}

function valideerSourceTurns(data, errors, context) {
  if (!Array.isArray(data.source_turns) || data.source_turns.length === 0) {
    voegFoutToe(errors, "ongeldige-source-turns", `${context}: source_turns ontbreekt of is leeg`);
    return;
  }
  const allePositief = data.source_turns.every((n) => Number.isInteger(n) && n >= 1);
  if (!allePositief) {
    voegFoutToe(
      errors,
      "ongeldige-source-turns",
      `${context}: source_turns moet positieve gehele beurtnummers bevatten`,
    );
  }
}

function valideerDekking(data, errors, context) {
  if (!DEKKINGSLABELS.has(data.dekking)) {
    voegFoutToe(errors, "ongeldig-label", `${context}: dekking "${data.dekking}" is geen geldig label`);
  }
}

function valideerData(beurt, errors, context) {
  if (!isObject(beurt.data)) {
    voegFoutToe(errors, "ontbrekend-veld", `${context}: data ontbreekt`);
    return null;
  }
  return beurt.data;
}

function valideerNaamstap(beurt, errors) {
  const context = `naamstap beurt ${beurt.turn}`;
  valideerOnbekendeVelden(beurt, NAAMSTAP_TOPLEVEL_VELDEN, errors, context);
  if (!isNietLegeString(beurt.naam)) {
    voegFoutToe(errors, "ontbrekend-veld", "naamstap: naam ontbreekt of is leeg");
  }
}

/**
 * Puur signaal dat het model, na expliciete bevestiging van de ondernemer
 * (SPEC.md §2 punt 7), het interview als voldoende beschouwt. Geen extra
 * data-velden nodig — turn en type zijn al gecontroleerd door valideerBeurt.
 */
function valideerAfronding(beurt, errors) {
  valideerOnbekendeVelden(beurt, AFRONDING_TOPLEVEL_VELDEN, errors, `afronding beurt ${beurt.turn}`);
}

function valideerDialoog(beurt, errors) {
  const context = `dialoog beurt ${beurt.turn}`;
  valideerOnbekendeVelden(beurt, DIALOOG_TOPLEVEL_VELDEN, errors, context);
  if (!SPREKERS.has(beurt.spreker)) {
    voegFoutToe(errors, "ontbrekend-veld", `${context}: spreker moet "interviewer" of "ondernemer" zijn`);
  }
  if (!isNietLegeString(beurt.tekst)) {
    voegFoutToe(errors, "ontbrekend-veld", `${context}: tekst ontbreekt of is leeg`);
  }
}

function valideerTaak(beurt, errors) {
  const context = `taak beurt ${beurt.turn}`;
  valideerOnbekendeVelden(beurt, DATA_BEURT_TOPLEVEL_VELDEN, errors, context);
  const data = valideerData(beurt, errors, context);
  if (!data) return;

  valideerOnbekendeVelden(data, TAAK_DATA_VELDEN, errors, context);
  if (!isNietLegeString(data.id)) voegFoutToe(errors, "ontbrekend-veld", `${context}: data.id ontbreekt`);
  if (!isNietLegeString(data.naam)) voegFoutToe(errors, "ontbrekend-veld", `${context}: data.naam ontbreekt`);
  if (data.autonomie !== undefined && !AUTONOMIENIVEAUS.has(data.autonomie)) {
    voegFoutToe(errors, "ongeldig-label", `${context}: autonomie "${data.autonomie}" is geen geldig niveau`);
  }
  valideerDekking(data, errors, context);
  valideerSourceTurns(data, errors, context);
}

function valideerEdge(beurt, errors) {
  const context = `edge beurt ${beurt.turn}`;
  valideerOnbekendeVelden(beurt, DATA_BEURT_TOPLEVEL_VELDEN, errors, context);
  const data = valideerData(beurt, errors, context);
  if (!data) return;

  valideerOnbekendeVelden(data, EDGE_DATA_VELDEN, errors, context);
  if (!isNietLegeString(data.van)) voegFoutToe(errors, "ontbrekend-veld", `${context}: data.van ontbreekt`);
  if (!isNietLegeString(data.naar)) voegFoutToe(errors, "ontbrekend-veld", `${context}: data.naar ontbreekt`);
  valideerDekking(data, errors, context);
  valideerSourceTurns(data, errors, context);
}

function valideerZielPrincipe(beurt, errors) {
  const context = `ziel_principe beurt ${beurt.turn}`;
  valideerOnbekendeVelden(beurt, DATA_BEURT_TOPLEVEL_VELDEN, errors, context);
  const data = valideerData(beurt, errors, context);
  if (!data) return;

  valideerOnbekendeVelden(data, ZIEL_PRINCIPE_DATA_VELDEN, errors, context);
  if (!isNietLegeString(data.tekst)) voegFoutToe(errors, "ontbrekend-veld", `${context}: data.tekst ontbreekt`);
  valideerDekking(data, errors, context);
  valideerSourceTurns(data, errors, context);
}

function valideerSkill(beurt, errors) {
  const context = `skill beurt ${beurt.turn}`;
  valideerOnbekendeVelden(beurt, DATA_BEURT_TOPLEVEL_VELDEN, errors, context);
  const data = valideerData(beurt, errors, context);
  if (!data) return;

  valideerOnbekendeVelden(data, SKILL_DATA_VELDEN, errors, context);
  if (!isNietLegeString(data.naam)) voegFoutToe(errors, "ontbrekend-veld", `${context}: data.naam ontbreekt`);
  valideerDekking(data, errors, context);
  valideerSourceTurns(data, errors, context);
}

function valideerTool(beurt, errors) {
  const context = `tool beurt ${beurt.turn}`;
  valideerOnbekendeVelden(beurt, DATA_BEURT_TOPLEVEL_VELDEN, errors, context);
  const data = valideerData(beurt, errors, context);
  if (!data) return;

  valideerOnbekendeVelden(data, TOOL_DATA_VELDEN, errors, context);
  if (!isNietLegeString(data.naam)) voegFoutToe(errors, "ontbrekend-veld", `${context}: data.naam ontbreekt`);
  if (!TOOLSOORTEN.has(data.soort)) {
    voegFoutToe(errors, "ontbrekend-veld", `${context}: soort moet "huidig" of "suggestie" zijn`);
  }
  valideerDekking(data, errors, context);
  valideerSourceTurns(data, errors, context);
}

const VALIDATORS_PER_TYPE = {
  naamstap: valideerNaamstap,
  dialoog: valideerDialoog,
  taak: valideerTaak,
  edge: valideerEdge,
  ziel_principe: valideerZielPrincipe,
  skill: valideerSkill,
  tool: valideerTool,
  afronding: valideerAfronding,
};

function valideerBeurt(beurt, errors) {
  if (!isObject(beurt)) {
    voegFoutToe(errors, "ongeldige-beurt", "beurt is geen object");
    return;
  }
  if (!Number.isInteger(beurt.turn) || beurt.turn < 1) {
    voegFoutToe(errors, "ongeldig-beurtnummer", `beurtnummer "${beurt.turn}" is geen positief geheel getal`);
  }
  if (!BEURTTYPEN.has(beurt.type)) {
    voegFoutToe(errors, "onbekend-beurttype", `beurttype "${beurt.type}" is onbekend`);
    return;
  }
  VALIDATORS_PER_TYPE[beurt.type](beurt, errors);
}

/**
 * Valideert een ruw modelantwoord (string) tegen het beurt-protocol dat
 * parseTranscript.js verderop in de keten verwacht. Puur en deterministisch:
 * geen netwerk, geen state. Geeft { valid, errors, turns? } terug, in
 * dezelfde vorm als validateManifest.
 */
export function parseModelResponse(raw) {
  let beurten;
  try {
    beurten = JSON.parse(raw);
  } catch (parseError) {
    return {
      valid: false,
      errors: [{ category: "ongeldige-json", message: `antwoord is geen geldige JSON: ${parseError.message}` }],
    };
  }

  if (!Array.isArray(beurten) || beurten.length === 0) {
    return {
      valid: false,
      errors: [{ category: "geen-beurten", message: "antwoord moet een niet-lege array van beurten zijn" }],
    };
  }

  const errors = [];
  for (const beurt of beurten) {
    valideerBeurt(beurt, errors);
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, errors: [], turns: beurten };
}

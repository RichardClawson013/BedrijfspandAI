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

function voegFoutToe(errors, category, message) {
  errors.push({ category, message });
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
  if (!isNietLegeString(beurt.naam)) {
    voegFoutToe(errors, "ontbrekend-veld", "naamstap: naam ontbreekt of is leeg");
  }
}

/**
 * Puur signaal dat het model, na expliciete bevestiging van de ondernemer
 * (SPEC.md §2 punt 7), het interview als voldoende beschouwt. Geen extra
 * velden nodig — turn en type zijn al gecontroleerd door valideerBeurt.
 */
function valideerAfronding() {}

function valideerDialoog(beurt, errors) {
  const context = `dialoog beurt ${beurt.turn}`;
  if (!SPREKERS.has(beurt.spreker)) {
    voegFoutToe(errors, "ontbrekend-veld", `${context}: spreker moet "interviewer" of "ondernemer" zijn`);
  }
  if (!isNietLegeString(beurt.tekst)) {
    voegFoutToe(errors, "ontbrekend-veld", `${context}: tekst ontbreekt of is leeg`);
  }
}

function valideerTaak(beurt, errors) {
  const context = `taak beurt ${beurt.turn}`;
  const data = valideerData(beurt, errors, context);
  if (!data) return;

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
  const data = valideerData(beurt, errors, context);
  if (!data) return;

  if (!isNietLegeString(data.van)) voegFoutToe(errors, "ontbrekend-veld", `${context}: data.van ontbreekt`);
  if (!isNietLegeString(data.naar)) voegFoutToe(errors, "ontbrekend-veld", `${context}: data.naar ontbreekt`);
  valideerDekking(data, errors, context);
  valideerSourceTurns(data, errors, context);
}

function valideerZielPrincipe(beurt, errors) {
  const context = `ziel_principe beurt ${beurt.turn}`;
  const data = valideerData(beurt, errors, context);
  if (!data) return;

  if (!isNietLegeString(data.tekst)) voegFoutToe(errors, "ontbrekend-veld", `${context}: data.tekst ontbreekt`);
  valideerDekking(data, errors, context);
  valideerSourceTurns(data, errors, context);
}

function valideerSkill(beurt, errors) {
  const context = `skill beurt ${beurt.turn}`;
  const data = valideerData(beurt, errors, context);
  if (!data) return;

  if (!isNietLegeString(data.naam)) voegFoutToe(errors, "ontbrekend-veld", `${context}: data.naam ontbreekt`);
  valideerDekking(data, errors, context);
  valideerSourceTurns(data, errors, context);
}

function valideerTool(beurt, errors) {
  const context = `tool beurt ${beurt.turn}`;
  const data = valideerData(beurt, errors, context);
  if (!data) return;

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

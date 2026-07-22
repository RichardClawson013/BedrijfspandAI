import { test } from "node:test";
import assert from "node:assert/strict";

import { buildOpenOnderwerpen } from "../src/compiler/buildOpenOnderwerpen.js";

test("geen open onderwerpen: duidelijke lege-staat-melding, geen kopjes", () => {
  const output = buildOpenOnderwerpen({
    naam: "Mila",
    taken: [{ id: "T-0001", naam: "Factuur versturen", dekking: "GEDEKT", source_turns: [1] }],
    edges: [],
  });

  assert.match(output, /^# Open onderwerpen — trainingsagenda voor Mila\n/);
  assert.match(output, /Geen open onderwerpen\. Alles is GEDEKT of AFGELEID vastgelegd\./);
  assert.doesNotMatch(output, /## Open taken/);
});

test("open taak zonder enige relatie: 'wat hangt hiervan af' zegt expliciet niets bekend", () => {
  const output = buildOpenOnderwerpen({
    naam: "Nova",
    taken: [{ id: "T-0001", naam: "Onbekende taak", dekking: "GEEN-DEKKING", source_turns: [7] }],
    edges: [],
  });

  assert.match(output, /### Onbekende taak/);
  assert.match(output, /\*\*Waar:\*\* beurt 7/);
  assert.match(output, /niets bekends — geen andere taak of edge verwijst hiernaar\./);
});

test("open taak met afhankelijkheid via een edge wordt als 'hangt hiervan af' getoond", () => {
  const output = buildOpenOnderwerpen({
    naam: "Nova",
    taken: [
      { id: "T-0001", naam: "Open taak", dekking: "GEEN-DEKKING", source_turns: [7] },
      { id: "T-0002", naam: "Vervolgtaak", dekking: "GEDEKT", source_turns: [8] },
    ],
    edges: [{ van: "T-0002", naar: "T-0001", dekking: "GEDEKT", source_turns: [8] }],
  });

  assert.match(output, /\*\*Wat hangt hiervan af:\*\* T-0002/);
});

test("open taak met afhankelijkheid via afhankelijk_van van een andere taak", () => {
  const output = buildOpenOnderwerpen({
    naam: "Nova",
    taken: [
      { id: "T-0001", naam: "Open taak", dekking: "GEEN-DEKKING", source_turns: [7] },
      { id: "T-0002", naam: "Vervolgtaak", dekking: "GEDEKT", source_turns: [8], afhankelijk_van: ["T-0001"] },
    ],
    edges: [],
  });

  assert.match(output, /\*\*Wat hangt hiervan af:\*\* T-0002/);
});

test("open edge komt onder 'Open afhankelijkheden' met van/naar in de kop", () => {
  const output = buildOpenOnderwerpen({
    naam: "Nova",
    taken: [
      { id: "T-0001", naam: "A", dekking: "GEDEKT", source_turns: [1] },
      { id: "T-0002", naam: "B", dekking: "GEDEKT", source_turns: [2] },
    ],
    edges: [{ van: "T-0001", naar: "T-0002", dekking: "GEEN-DEKKING", source_turns: [3] }],
  });

  assert.match(output, /## Open afhankelijkheden/);
  assert.match(output, /### T-0001 → T-0002/);
  assert.match(output, /\*\*Waar:\*\* beurt 3/);
});

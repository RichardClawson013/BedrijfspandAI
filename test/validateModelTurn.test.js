import { test } from "node:test";
import assert from "node:assert/strict";

import { parseModelResponse } from "../src/interview/validateModelTurn.js";

test("geldige beurten van alle typen worden geaccepteerd", () => {
  const raw = JSON.stringify([
    { turn: 1, type: "naamstap", naam: "Nova" },
    { turn: 2, type: "dialoog", spreker: "interviewer", tekst: "Vertel eens over een vaste taak." },
    { turn: 3, type: "dialoog", spreker: "ondernemer", tekst: "Ik stuur elke maand de facturen." },
    {
      turn: 4,
      type: "taak",
      data: {
        id: "T-0001",
        naam: "Facturen versturen",
        autonomie: "eerst-vragen",
        dekking: "GEDEKT",
        source_turns: [3],
      },
    },
    {
      turn: 5,
      type: "edge",
      data: { van: "T-0001", naar: "T-0002", soort: "volgt-op", dekking: "GEDEKT", source_turns: [3] },
    },
    {
      turn: 6,
      type: "ziel_principe",
      data: { titel: "Stiptheid", tekst: "Facturen op tijd sturen.", dekking: "GEDEKT", source_turns: [3] },
    },
    {
      turn: 7,
      type: "skill",
      data: { naam: "Factureren", domein: "Financieel", dekking: "GEDEKT", source_turns: [3] },
    },
    {
      turn: 8,
      type: "tool",
      data: { naam: "Excel", taak_id: "T-0001", soort: "huidig", dekking: "GEDEKT", source_turns: [3] },
    },
    { turn: 9, type: "afronding" },
  ]);

  const result = parseModelResponse(raw);
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
  assert.equal(result.turns.length, 9);
});

test("een afronding-beurt heeft geen extra velden nodig", () => {
  const raw = JSON.stringify([{ turn: 1, type: "afronding" }]);
  const result = parseModelResponse(raw);
  assert.equal(result.valid, true);
});

test("een GEEN-DEKKING beurt met source_turns naar het onderwerp is geldig, ook zonder verdere inhoud", () => {
  const raw = JSON.stringify([
    {
      turn: 2,
      type: "taak",
      data: { id: "T-0002", naam: "Onbekende taak", dekking: "GEEN-DEKKING", source_turns: [1] },
    },
  ]);

  const result = parseModelResponse(raw);
  assert.equal(result.valid, true);
});

test("ongeldige JSON wordt afgekeurd met categorie ongeldige-json", () => {
  const result = parseModelResponse("{ dit is geen json");
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.category === "ongeldige-json"));
});

test("een los object in plaats van een array wordt afgekeurd", () => {
  const result = parseModelResponse(JSON.stringify({ turn: 1, type: "naamstap", naam: "Nova" }));
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.category === "geen-beurten"));
});

test("een lege array wordt afgekeurd", () => {
  const result = parseModelResponse(JSON.stringify([]));
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.category === "geen-beurten"));
});

test("een onbekend beurttype wordt afgekeurd", () => {
  const raw = JSON.stringify([{ turn: 1, type: "verzinsel", iets: "iets" }]);
  const result = parseModelResponse(raw);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.category === "onbekend-beurttype"));
});

test("een taak zonder dekking wordt afgekeurd", () => {
  const raw = JSON.stringify([
    { turn: 1, type: "taak", data: { id: "T-0001", naam: "Iets doen", source_turns: [1] } },
  ]);
  const result = parseModelResponse(raw);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.category === "ongeldig-label"));
});

test("een taak met een verzonnen dekkingslabel wordt afgekeurd", () => {
  const raw = JSON.stringify([
    { turn: 1, type: "taak", data: { id: "T-0001", naam: "Iets doen", dekking: "MISSCHIEN", source_turns: [1] } },
  ]);
  const result = parseModelResponse(raw);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.category === "ongeldig-label"));
});

test("een taak zonder source_turns wordt afgekeurd", () => {
  const raw = JSON.stringify([
    { turn: 1, type: "taak", data: { id: "T-0001", naam: "Iets doen", dekking: "GEDEKT" } },
  ]);
  const result = parseModelResponse(raw);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.category === "ongeldige-source-turns"));
});

test("een taak met een lege source_turns array wordt afgekeurd", () => {
  const raw = JSON.stringify([
    { turn: 1, type: "taak", data: { id: "T-0001", naam: "Iets doen", dekking: "GEDEKT", source_turns: [] } },
  ]);
  const result = parseModelResponse(raw);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.category === "ongeldige-source-turns"));
});

test("een beurt zonder geldig beurtnummer wordt afgekeurd", () => {
  const raw = JSON.stringify([{ turn: 0, type: "naamstap", naam: "Nova" }]);
  const result = parseModelResponse(raw);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.category === "ongeldig-beurtnummer"));
});

test("een naamstap zonder naam wordt afgekeurd", () => {
  const raw = JSON.stringify([{ turn: 1, type: "naamstap" }]);
  const result = parseModelResponse(raw);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.category === "ontbrekend-veld"));
});

test("een dialoog zonder tekst wordt afgekeurd", () => {
  const raw = JSON.stringify([{ turn: 2, type: "dialoog", spreker: "interviewer" }]);
  const result = parseModelResponse(raw);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.category === "ontbrekend-veld"));
});

test("een dialoog met een onbekende spreker wordt afgekeurd", () => {
  const raw = JSON.stringify([{ turn: 2, type: "dialoog", spreker: "robot", tekst: "hallo" }]);
  const result = parseModelResponse(raw);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.category === "ontbrekend-veld"));
});

test("een tool met een ongeldige soort wordt afgekeurd", () => {
  const raw = JSON.stringify([
    { turn: 2, type: "tool", data: { naam: "Excel", soort: "wens", dekking: "GEDEKT", source_turns: [1] } },
  ]);
  const result = parseModelResponse(raw);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.category === "ontbrekend-veld"));
});

test("een taak met een ongeldig autonomieniveau wordt afgekeurd", () => {
  const raw = JSON.stringify([
    {
      turn: 1,
      type: "taak",
      data: { id: "T-1", naam: "Iets", autonomie: "soms", dekking: "GEDEKT", source_turns: [1] },
    },
  ]);
  const result = parseModelResponse(raw);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.category === "ongeldig-label"));
});

test("meerdere fouten in één antwoord worden allemaal gerapporteerd", () => {
  const raw = JSON.stringify([
    { turn: 1, type: "taak", data: { id: "T-1" } },
    { turn: 2, type: "onzin" },
  ]);
  const result = parseModelResponse(raw);
  assert.equal(result.valid, false);
  assert.ok(result.errors.length >= 3);
});

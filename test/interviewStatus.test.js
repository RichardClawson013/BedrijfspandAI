import { test } from "node:test";
import assert from "node:assert/strict";

import {
  RONDE_WAARSCHUWING,
  RONDE_DESTILLATIE,
  RONDE_AFSLUITEN,
  NOODREM_TOTAAL,
  WAARSCHUWINGSTEKST,
  AFSLUITTEKST,
  rondenSindsLaatsteExtractie,
  noodremBereikt,
  bepaalVraagStatus,
} from "../src/interview/interviewStatus.js";

function interviewerBeurt(turn) {
  return { turn, type: "dialoog", spreker: "interviewer", tekst: `vraag ${turn}` };
}

function ondernemerBeurt(turn) {
  return { turn, type: "dialoog", spreker: "ondernemer", tekst: `antwoord ${turn}` };
}

function taakBeurt(turn) {
  return {
    turn,
    type: "taak",
    data: { id: `T-${turn}`, naam: "iets", dekking: "GEDEKT", source_turns: [turn] },
  };
}

function skillBeurt(turn) {
  return {
    turn,
    type: "skill",
    data: { naam: "iets", dekking: "GEDEKT", source_turns: [turn] },
  };
}

test("direct na de naamstap staat de teller op 0", () => {
  const transcript = [{ turn: 1, type: "naamstap", naam: "Nova" }];
  assert.equal(rondenSindsLaatsteExtractie(transcript), 0);
});

test("elke interviewer-dialoogbeurt telt als één ronde", () => {
  const transcript = [
    { turn: 1, type: "naamstap", naam: "Nova" },
    interviewerBeurt(2),
    ondernemerBeurt(3),
    interviewerBeurt(4),
    ondernemerBeurt(5),
  ];
  assert.equal(rondenSindsLaatsteExtractie(transcript), 2);
});

test("een taak-extractie reset de teller naar 0", () => {
  const transcript = [
    { turn: 1, type: "naamstap", naam: "Nova" },
    interviewerBeurt(2),
    ondernemerBeurt(3),
    interviewerBeurt(4),
    ondernemerBeurt(5),
    taakBeurt(6),
    interviewerBeurt(7),
  ];
  assert.equal(rondenSindsLaatsteExtractie(transcript), 1);
});

test("een skill-extractie (terzijde) reset de teller NIET", () => {
  const transcript = [
    { turn: 1, type: "naamstap", naam: "Nova" },
    interviewerBeurt(2),
    ondernemerBeurt(3),
    skillBeurt(4),
    interviewerBeurt(5),
    ondernemerBeurt(6),
  ];
  assert.equal(rondenSindsLaatsteExtractie(transcript), 2);
});

test("ondernemer-dialoogbeurten tellen niet mee", () => {
  const transcript = [
    { turn: 1, type: "naamstap", naam: "Nova" },
    ondernemerBeurt(2),
    ondernemerBeurt(3),
  ];
  assert.equal(rondenSindsLaatsteExtractie(transcript), 0);
});

test("status is normaal onder de 8 rondes", () => {
  const transcript = [{ turn: 1, type: "naamstap", naam: "Nova" }];
  for (let i = 0; i < 7; i += 1) {
    transcript.push(interviewerBeurt(transcript.length + 1));
  }
  assert.equal(rondenSindsLaatsteExtractie(transcript), 7);
  assert.equal(bepaalVraagStatus(transcript), "normaal");
});

test("status is waarschuwing bij ronde 8 en 9", () => {
  const transcript = [{ turn: 1, type: "naamstap", naam: "Nova" }];
  for (let i = 0; i < 8; i += 1) {
    transcript.push(interviewerBeurt(transcript.length + 1));
  }
  assert.equal(bepaalVraagStatus(transcript), "waarschuwing");

  transcript.push(interviewerBeurt(transcript.length + 1));
  assert.equal(rondenSindsLaatsteExtractie(transcript), 9);
  assert.equal(bepaalVraagStatus(transcript), "waarschuwing");
});

test("status is destilleren bij ronde 10 en 11", () => {
  const transcript = [{ turn: 1, type: "naamstap", naam: "Nova" }];
  for (let i = 0; i < 10; i += 1) {
    transcript.push(interviewerBeurt(transcript.length + 1));
  }
  assert.equal(bepaalVraagStatus(transcript), "destilleren");
});

test("status is afsluiten bij ronde 12", () => {
  const transcript = [{ turn: 1, type: "naamstap", naam: "Nova" }];
  for (let i = 0; i < 12; i += 1) {
    transcript.push(interviewerBeurt(transcript.length + 1));
  }
  assert.equal(bepaalVraagStatus(transcript), "afsluiten");
});

test("noodrem overstemt alles zodra het totaal 2500 bereikt", () => {
  const transcript = Array.from({ length: NOODREM_TOTAAL }, (_, i) =>
    i === 0 ? { turn: 1, type: "naamstap", naam: "Nova" } : interviewerBeurt(i + 1),
  );
  assert.equal(noodremBereikt(transcript), true);
  assert.equal(bepaalVraagStatus(transcript), "noodrem");
});

test("de waarschuwings- en afsluitteksten zijn vaste, niet-lege teksten", () => {
  assert.ok(WAARSCHUWINGSTEKST.length > 0);
  assert.ok(AFSLUITTEKST.length > 0);
  assert.ok(AFSLUITTEKST.includes("Dankjewel"));
});

test("de drempelconstanten kloppen met de afgesproken 8/10/12", () => {
  assert.equal(RONDE_WAARSCHUWING, 8);
  assert.equal(RONDE_DESTILLATIE, 10);
  assert.equal(RONDE_AFSLUITEN, 12);
});

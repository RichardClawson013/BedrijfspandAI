import { test } from "node:test";
import assert from "node:assert/strict";

import { parseTranscript } from "../src/compiler/parseTranscript.js";

test("naamstap hoeft niet op positie 0 te staan (welkomsbericht is beurt 1 sinds Stap 5 deelstap 4)", () => {
  const transcript = [
    { turn: 1, type: "dialoog", spreker: "interviewer", tekst: "welkomsbericht" },
    { turn: 2, type: "dialoog", spreker: "ondernemer", tekst: "ik ben django" },
    { turn: 3, type: "dialoog", spreker: "interviewer", tekst: "hoe moet de werknemer heten?" },
    { turn: 4, type: "dialoog", spreker: "ondernemer", tekst: "Jean Cloud" },
    { turn: 5, type: "naamstap", naam: "Jean Cloud" },
  ];

  const parsed = parseTranscript(transcript);
  assert.equal(parsed.naam, "Jean Cloud");
});

test("een afronding-beurt breekt het parsen niet", () => {
  const transcript = [
    { turn: 1, type: "naamstap", naam: "Nova" },
    { turn: 2, type: "afronding" },
  ];

  const parsed = parseTranscript(transcript);
  assert.equal(parsed.naam, "Nova");
});

test("ontbreekt de naamstap volledig, dan een duidelijke fout", () => {
  const transcript = [{ turn: 1, type: "dialoog", spreker: "interviewer", tekst: "hallo" }];

  assert.throws(() => parseTranscript(transcript), /naamstap/);
});

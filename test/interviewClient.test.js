import { test } from "node:test";
import assert from "node:assert/strict";

import { bouwMessages, vraagModelBeurt } from "../src/interview/interviewClient.js";

function jsonResponse(status, body) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

function volgordeFetch(antwoorden) {
  let i = 0;
  return async () => {
    const volgende = antwoorden[i];
    i += 1;
    return volgende;
  };
}

test("bouwMessages zet systeemprompt eerst, dan model/ondernemer in volgorde", () => {
  const wisselingen = [
    { rol: "model", inhoud: "[]" },
    { rol: "ondernemer", inhoud: "hallo" },
  ];
  const messages = bouwMessages("SYSTEEM", wisselingen);
  assert.deepEqual(messages, [
    { role: "system", content: "SYSTEEM" },
    { role: "assistant", content: "[]" },
    { role: "user", content: "hallo" },
  ]);
});

test("geldig antwoord bij de eerste poging geeft direct ok:true", async () => {
  const geldig = JSON.stringify([{ turn: 1, type: "naamstap", naam: "Nova" }]);
  const fetchImpl = volgordeFetch([jsonResponse(200, { content: geldig })]);

  const resultaat = await vraagModelBeurt({
    apiUrl: "http://luik.test/interview",
    code: "test-code",
    systeemPrompt: "SYSTEEM",
    wisselingen: [],
    fetchImpl,
  });

  assert.equal(resultaat.ok, true);
  assert.equal(resultaat.beurten.length, 1);
});

test("ongeldig antwoord op poging 1 en 2, geldig op poging 3: herstelt automatisch", async () => {
  const geldig = JSON.stringify([{ turn: 1, type: "naamstap", naam: "Nova" }]);
  const fetchImpl = volgordeFetch([
    jsonResponse(200, { content: "geen geldige json" }),
    jsonResponse(200, { content: "[]" }),
    jsonResponse(200, { content: geldig }),
  ]);

  const resultaat = await vraagModelBeurt({
    apiUrl: "http://luik.test/interview",
    code: "test-code",
    systeemPrompt: "SYSTEEM",
    wisselingen: [],
    fetchImpl,
  });

  assert.equal(resultaat.ok, true);
  assert.equal(resultaat.beurten.length, 1);
});

test("na drie ongeldige pogingen stopt het met een duidelijke reden", async () => {
  const fetchImpl = volgordeFetch([
    jsonResponse(200, { content: "geen json" }),
    jsonResponse(200, { content: "[]" }),
    jsonResponse(200, { content: "ook geen json" }),
  ]);

  const resultaat = await vraagModelBeurt({
    apiUrl: "http://luik.test/interview",
    code: "test-code",
    systeemPrompt: "SYSTEEM",
    wisselingen: [],
    fetchImpl,
  });

  assert.equal(resultaat.ok, false);
  assert.equal(resultaat.reden, "ongeldig-antwoord-na-herstelpogingen");
  assert.equal(resultaat.pogingen.length, 3);
});

test("een netwerkfout (doorgeefluik onbereikbaar) stopt direct, zonder herstelpogingen", async () => {
  let aanroepen = 0;
  const fetchImpl = async () => {
    aanroepen += 1;
    throw new Error("connect ECONNREFUSED");
  };

  const resultaat = await vraagModelBeurt({
    apiUrl: "http://luik.test/interview",
    code: "test-code",
    systeemPrompt: "SYSTEEM",
    wisselingen: [],
    fetchImpl,
  });

  assert.equal(resultaat.ok, false);
  assert.equal(resultaat.reden, "doorgeefluik-onbereikbaar");
  assert.equal(aanroepen, 1);
});

test("een ongeldige toegangscode (401 van het luik) stopt direct, zonder herstelpogingen", async () => {
  let aanroepen = 0;
  const fetchImpl = async () => {
    aanroepen += 1;
    return jsonResponse(401, { error: "ongeldige toegangscode" });
  };

  const resultaat = await vraagModelBeurt({
    apiUrl: "http://luik.test/interview",
    code: "verkeerde-code",
    systeemPrompt: "SYSTEEM",
    wisselingen: [],
    fetchImpl,
  });

  assert.equal(resultaat.ok, false);
  assert.equal(resultaat.reden, "doorgeefluik-fout");
  assert.equal(aanroepen, 1);
});

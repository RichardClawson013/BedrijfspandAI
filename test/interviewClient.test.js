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
  const fetchImpl = volgordeFetch([
    jsonResponse(200, { content: geldig, provider: "google", model: "gemini-2.5-flash" }),
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

test("provider en model uit de doorgeefluik-respons komen terug in het resultaat", async () => {
  const geldig = JSON.stringify([{ turn: 1, type: "naamstap", naam: "Nova" }]);
  const fetchImpl = volgordeFetch([
    jsonResponse(200, { content: geldig, provider: "google", model: "gemini-2.5-flash" }),
  ]);

  const resultaat = await vraagModelBeurt({
    apiUrl: "http://luik.test/interview",
    code: "test-code",
    systeemPrompt: "SYSTEEM",
    wisselingen: [],
    fetchImpl,
  });

  assert.equal(resultaat.provider, "google");
  assert.equal(resultaat.model, "gemini-2.5-flash");
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

test("na drie ongeldige pogingen volgt een gracieuze uitleg i.p.v. hard stoppen", async () => {
  const fetchImpl = volgordeFetch([
    jsonResponse(200, { content: "geen json" }),
    jsonResponse(200, { content: "[]" }),
    jsonResponse(200, { content: "ook geen json" }),
    jsonResponse(200, { content: "Sorry, kun je dat anders verwoorden?" }),
  ]);

  const resultaat = await vraagModelBeurt({
    apiUrl: "http://luik.test/interview",
    code: "test-code",
    systeemPrompt: "SYSTEEM",
    wisselingen: [],
    fetchImpl,
  });

  assert.equal(resultaat.ok, true);
  assert.equal(resultaat.gracieusHersteld, true);
  assert.equal(resultaat.uitlegTekst, "Sorry, kun je dat anders verwoorden?");
  assert.equal(resultaat.pogingen.length, 3);
});

test("valt terug op vaste tekst als zelfs de gracieuze uitleg mislukt", async () => {
  const fetchImpl = volgordeFetch([
    jsonResponse(200, { content: "geen json" }),
    jsonResponse(200, { content: "[]" }),
    jsonResponse(200, { content: "ook geen json" }),
  ]);
  const fetchImplMetNetwerkfout = async (...args) => {
    const volgende = await fetchImpl(...args);
    if (volgende === undefined) throw new Error("connect ECONNREFUSED");
    return volgende;
  };

  const resultaat = await vraagModelBeurt({
    apiUrl: "http://luik.test/interview",
    code: "test-code",
    systeemPrompt: "SYSTEEM",
    wisselingen: [],
    fetchImpl: fetchImplMetNetwerkfout,
    wachtImpl: async () => {},
  });

  assert.equal(resultaat.ok, true);
  assert.equal(resultaat.gracieusHersteld, true);
  assert.equal(resultaat.uitlegTekst, "Ik liep vast bij het verwerken van je laatste antwoord. Kun je het opnieuw of in andere woorden formuleren?");
});

test("een netwerkfout (doorgeefluik onbereikbaar) probeert stil opnieuw, en faalt pas als alle pogingen op zijn", async () => {
  let aanroepen = 0;
  const fetchImpl = async () => {
    aanroepen += 1;
    throw new Error("connect ECONNREFUSED");
  };
  const gewachtMet = [];
  const wachtImpl = async (ms) => {
    gewachtMet.push(ms);
  };

  const resultaat = await vraagModelBeurt({
    apiUrl: "http://luik.test/interview",
    code: "test-code",
    systeemPrompt: "SYSTEEM",
    wisselingen: [],
    fetchImpl,
    wachtImpl,
  });

  assert.equal(resultaat.ok, false);
  assert.equal(resultaat.reden, "doorgeefluik-onbereikbaar");
  assert.equal(aanroepen, 3);
  assert.deepEqual(gewachtMet, [500, 1500]);
});

test("netwerkfout op de eerste poging herstelt vanzelf op de tweede", async () => {
  const geldig = JSON.stringify([{ turn: 1, type: "naamstap", naam: "Nova" }]);
  let aanroepen = 0;
  const fetchImpl = async () => {
    aanroepen += 1;
    if (aanroepen === 1) throw new Error("connect ECONNREFUSED");
    return jsonResponse(200, { content: geldig, provider: "google", model: "gemini-2.5-flash" });
  };

  const resultaat = await vraagModelBeurt({
    apiUrl: "http://luik.test/interview",
    code: "test-code",
    systeemPrompt: "SYSTEEM",
    wisselingen: [],
    fetchImpl,
    wachtImpl: async () => {},
  });

  assert.equal(resultaat.ok, true);
  assert.equal(resultaat.beurten.length, 1);
  assert.equal(aanroepen, 2);
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

import { test } from "node:test";
import assert from "node:assert/strict";

import { stuurNaarGoogle } from "../src/google.js";

function maakGoogleBody(tekst) {
  return { candidates: [{ content: { parts: [{ text: tekst }] }, finishReason: "STOP" }] };
}

test("gebruikt de eerste (primaire) sleutel als die werkt", async () => {
  const gebruikteUrls = [];
  const fetchImpl = async (url) => {
    gebruikteUrls.push(url);
    return { ok: true, status: 200, json: async () => maakGoogleBody("ok") };
  };

  const resultaat = await stuurNaarGoogle({
    messages: [{ role: "user", content: "hoi" }],
    apiKeys: ["primair", "backup"],
    model: "gemini-2.5-flash",
    fetchImpl,
  });

  assert.deepEqual(resultaat, { content: "ok" });
  assert.equal(gebruikteUrls.length, 1);
  assert.ok(gebruikteUrls[0].includes("key=primair"));
});

test("valt terug op backup-sleutels bij 401, 403 of 429", async () => {
  for (const status of [401, 403, 429]) {
    const gebruikteUrls = [];
    const fetchImpl = async (url) => {
      gebruikteUrls.push(url);
      if (url.includes("key=primair")) {
        return { ok: false, status, json: async () => ({ error: { message: "sleutelprobleem" } }) };
      }
      return { ok: true, status: 200, json: async () => maakGoogleBody("van backup") };
    };

    const resultaat = await stuurNaarGoogle({
      messages: [{ role: "user", content: "hoi" }],
      apiKeys: ["primair", "backup"],
      model: "gemini-2.5-flash",
      fetchImpl,
    });

    assert.equal(resultaat.content, "van backup", `status ${status} moet terugvallen op backup`);
    assert.equal(gebruikteUrls.length, 2);
  }
});

test("valt NIET terug bij een fout die niets met de sleutel te maken heeft (bv. 400)", async () => {
  const gebruikteUrls = [];
  const fetchImpl = async (url) => {
    gebruikteUrls.push(url);
    return { ok: false, status: 400, json: async () => ({ error: { message: "ongeldig verzoek" } }) };
  };

  await assert.rejects(
    stuurNaarGoogle({
      messages: [{ role: "user", content: "hoi" }],
      apiKeys: ["primair", "backup"],
      model: "gemini-2.5-flash",
      fetchImpl,
    }),
    /status 400/,
  );
  assert.equal(gebruikteUrls.length, 1, "backup-sleutel mag niet geprobeerd worden bij een 400");
});

test("gooit een duidelijke fout als er geen enkele sleutel geconfigureerd is", async () => {
  await assert.rejects(
    stuurNaarGoogle({ messages: [], apiKeys: [], model: "gemini-2.5-flash", fetchImpl: async () => {} }),
    /geen enkele Google-sleutel/,
  );
});

test("gooit de laatste fout als alle sleutels falen", async () => {
  const fetchImpl = async () => ({ ok: false, status: 429, json: async () => ({ error: { message: "op" } }) });

  await assert.rejects(
    stuurNaarGoogle({
      messages: [{ role: "user", content: "hoi" }],
      apiKeys: ["primair", "backup"],
      model: "gemini-2.5-flash",
      fetchImpl,
    }),
    /status 429/,
  );
});

test("vertaalt OpenAI-stijl messages (incl. system) naar Google contents-formaat", async () => {
  let ontvangenBody;
  const fetchImpl = async (url, opties) => {
    ontvangenBody = JSON.parse(opties.body);
    return { ok: true, status: 200, json: async () => maakGoogleBody("ok") };
  };

  await stuurNaarGoogle({
    messages: [
      { role: "system", content: "jij bent een interviewer" },
      { role: "user", content: "hoi" },
      { role: "assistant", content: "hallo" },
    ],
    apiKeys: ["sleutel"],
    model: "gemini-2.5-flash",
    fetchImpl,
  });

  assert.deepEqual(ontvangenBody.systemInstruction, { parts: [{ text: "jij bent een interviewer" }] });
  assert.deepEqual(ontvangenBody.contents, [
    { role: "user", parts: [{ text: "hoi" }] },
    { role: "model", parts: [{ text: "hallo" }] },
  ]);
});

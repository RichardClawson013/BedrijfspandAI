import { test } from "node:test";
import assert from "node:assert/strict";

import { stuurNaarOpenRouter } from "../src/openrouter.js";

function maakOpenRouterBody(tekst) {
  return { choices: [{ message: { role: "assistant", content: tekst } }] };
}

test("gebruikt de eerste (primaire) sleutel als die werkt", async () => {
  const gebruikt = [];
  const fetchImpl = async (url, opties) => {
    gebruikt.push(opties.headers.Authorization);
    return { ok: true, status: 200, json: async () => maakOpenRouterBody("ok") };
  };

  const resultaat = await stuurNaarOpenRouter({
    messages: [{ role: "user", content: "hoi" }],
    apiKeys: ["primair", "backup"],
    model: "test/model",
    fetchImpl,
  });

  assert.deepEqual(resultaat, { content: "ok" });
  assert.deepEqual(gebruikt, ["Bearer primair"]);
});

test("valt terug op backup-sleutels bij 401, 403 of 429", async () => {
  for (const status of [401, 403, 429]) {
    const gebruikt = [];
    const fetchImpl = async (url, opties) => {
      const sleutel = opties.headers.Authorization;
      gebruikt.push(sleutel);
      if (sleutel === "Bearer primair") {
        return { ok: false, status, json: async () => ({ error: "sleutelprobleem" }) };
      }
      return { ok: true, status: 200, json: async () => maakOpenRouterBody("van backup") };
    };

    const resultaat = await stuurNaarOpenRouter({
      messages: [{ role: "user", content: "hoi" }],
      apiKeys: ["primair", "backup"],
      model: "test/model",
      fetchImpl,
    });

    assert.equal(resultaat.content, "van backup", `status ${status} moet terugvallen op backup`);
    assert.deepEqual(gebruikt, ["Bearer primair", "Bearer backup"]);
  }
});

test("valt NIET terug bij een fout die niets met de sleutel te maken heeft (bv. 400)", async () => {
  const gebruikt = [];
  const fetchImpl = async (url, opties) => {
    gebruikt.push(opties.headers.Authorization);
    return { ok: false, status: 400, json: async () => ({ error: "ongeldig verzoek" }) };
  };

  await assert.rejects(
    stuurNaarOpenRouter({
      messages: [{ role: "user", content: "hoi" }],
      apiKeys: ["primair", "backup"],
      model: "test/model",
      fetchImpl,
    }),
    /status 400/,
  );
  assert.deepEqual(gebruikt, ["Bearer primair"], "backup-sleutel mag niet geprobeerd worden bij een 400");
});

test("gooit een duidelijke fout als er geen enkele sleutel geconfigureerd is", async () => {
  await assert.rejects(
    stuurNaarOpenRouter({ messages: [], apiKeys: [], model: "test/model", fetchImpl: async () => {} }),
    /geen enkele OpenRouter-sleutel/,
  );
});

test("gooit de laatste fout als alle sleutels falen", async () => {
  const fetchImpl = async () => ({ ok: false, status: 429, json: async () => ({ error: "op" }) });

  await assert.rejects(
    stuurNaarOpenRouter({
      messages: [{ role: "user", content: "hoi" }],
      apiKeys: ["primair", "backup"],
      model: "test/model",
      fetchImpl,
    }),
    /status 429/,
  );
});

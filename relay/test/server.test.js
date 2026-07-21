import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { maakServer } from "../src/server.js";
import { maakRateLimiter } from "../src/rateLimiter.js";

function maakCodesBestand(codes) {
  const dir = mkdtempSync(path.join(tmpdir(), "bedrijfspandai-relay-"));
  const bestand = path.join(dir, "codes.json");
  writeFileSync(bestand, JSON.stringify(codes), "utf8");
  return { bestand, dir };
}

async function starteServer(app) {
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  return { server, basisUrl: `http://127.0.0.1:${port}` };
}

test("GET /gezond antwoordt 200 zonder toegangscode nodig te hebben", async () => {
  const { bestand, dir } = maakCodesBestand(["geldige-code"]);
  const app = maakServer({ codesPath: bestand, apiKey: "sk-test", model: "test/model" });
  const { server, basisUrl } = await starteServer(app);

  try {
    const res = await fetch(`${basisUrl}/gezond`);
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { status: "ok" });
  } finally {
    server.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("POST /interview zonder geldige code wordt geweigerd (401)", async () => {
  const { bestand, dir } = maakCodesBestand(["geldige-code"]);
  const app = maakServer({ codesPath: bestand, apiKey: "sk-test", model: "test/model" });
  const { server, basisUrl } = await starteServer(app);

  try {
    const res = await fetch(`${basisUrl}/interview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: "fout-code", messages: [{ role: "user", content: "hoi" }] }),
    });
    assert.equal(res.status, 401);
    assert.equal((await res.json()).error, "ongeldige toegangscode");
  } finally {
    server.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("POST /interview met geldige code stuurt door naar OpenRouter en geeft het antwoord terug", async () => {
  const { bestand, dir } = maakCodesBestand(["geldige-code"]);
  let ontvangenVerzoek;
  const fetchImpl = async (url, opties) => {
    ontvangenVerzoek = { url, opties };
    return {
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: { role: "assistant", content: "hallo terug" } }] }),
    };
  };

  const app = maakServer({
    codesPath: bestand,
    apiKey: "sk-test-geheim",
    model: "test/model",
    fetchImpl,
  });
  const { server, basisUrl } = await starteServer(app);

  try {
    const res = await fetch(`${basisUrl}/interview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: "geldige-code", messages: [{ role: "user", content: "hoi" }] }),
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.choices[0].message.content, "hallo terug");

    assert.equal(ontvangenVerzoek.opties.headers.Authorization, "Bearer sk-test-geheim");
    const verzondenBody = JSON.parse(ontvangenVerzoek.opties.body);
    assert.equal(verzondenBody.model, "test/model");
    assert.deepEqual(verzondenBody.messages, [{ role: "user", content: "hoi" }]);
  } finally {
    server.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("POST /interview zonder messages geeft 400", async () => {
  const { bestand, dir } = maakCodesBestand(["geldige-code"]);
  const app = maakServer({ codesPath: bestand, apiKey: "sk-test", model: "test/model" });
  const { server, basisUrl } = await starteServer(app);

  try {
    const res = await fetch(`${basisUrl}/interview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: "geldige-code" }),
    });
    assert.equal(res.status, 400);
  } finally {
    server.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("POST /interview: als OpenRouter faalt, komt er 502 zonder de sleutel te lekken", async () => {
  const { bestand, dir } = maakCodesBestand(["geldige-code"]);
  const fetchImpl = async () => {
    throw new Error("netwerkfout richting OpenRouter");
  };
  const app = maakServer({ codesPath: bestand, apiKey: "sk-geheim", model: "test/model", fetchImpl });
  const { server, basisUrl } = await starteServer(app);

  try {
    const res = await fetch(`${basisUrl}/interview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: "geldige-code", messages: [{ role: "user", content: "hoi" }] }),
    });
    assert.equal(res.status, 502);
    const tekst = JSON.stringify(await res.json());
    assert.ok(!tekst.includes("sk-geheim"), "de API-sleutel mag nooit in de foutmelding lekken");
  } finally {
    server.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("POST /interview respecteert de rate limiter (429 na het maximum)", async () => {
  const { bestand, dir } = maakCodesBestand(["geldige-code"]);
  const fetchImpl = async () => ({ ok: true, status: 200, json: async () => ({ ok: true }) });
  const rateLimiter = maakRateLimiter({ maxAanvragen: 1, vensterMs: 60_000 });
  const app = maakServer({ codesPath: bestand, apiKey: "sk-test", model: "test/model", fetchImpl, rateLimiter });
  const { server, basisUrl } = await starteServer(app);

  const verzoek = () =>
    fetch(`${basisUrl}/interview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: "geldige-code", messages: [{ role: "user", content: "hoi" }] }),
    });

  try {
    const eerste = await verzoek();
    assert.equal(eerste.status, 200);
    const tweede = await verzoek();
    assert.equal(tweede.status, 429);
  } finally {
    server.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("CORS-header staat alleen de toegestane origin toe", async () => {
  const { bestand, dir } = maakCodesBestand(["geldige-code"]);
  const app = maakServer({
    codesPath: bestand,
    apiKey: "sk-test",
    model: "test/model",
    toegestaneOrigin: "https://richardclawson013.github.io",
  });
  const { server, basisUrl } = await starteServer(app);

  try {
    const res = await fetch(`${basisUrl}/gezond`);
    assert.equal(res.headers.get("access-control-allow-origin"), "https://richardclawson013.github.io");
  } finally {
    server.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

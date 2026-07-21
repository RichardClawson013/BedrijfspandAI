import express from "express";
import { laadCodes, isGeldigeCode } from "./codes.js";
import { maakRateLimiter } from "./rateLimiter.js";
import { stuurNaarOpenRouter } from "./openrouter.js";

export function maakServer({ codesPath, apiKey, model, toegestaneOrigin, fetchImpl, rateLimiter }) {
  const app = express();
  app.use(express.json({ limit: "256kb" }));

  const magDoor = rateLimiter ?? maakRateLimiter();

  app.use((req, res, next) => {
    if (toegestaneOrigin) {
      res.setHeader("Access-Control-Allow-Origin", toegestaneOrigin);
      res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    }
    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }
    next();
  });

  app.get("/gezond", (req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.post("/interview", async (req, res) => {
    const ip = req.ip ?? "onbekend";
    if (!magDoor(ip)) {
      res.status(429).json({ error: "te veel aanvragen, probeer later opnieuw" });
      return;
    }

    const { code, messages } = req.body ?? {};

    let codes;
    try {
      codes = laadCodes(codesPath);
    } catch {
      res.status(500).json({ error: "toegangscodes konden niet gelezen worden" });
      return;
    }

    if (!isGeldigeCode(code, codes)) {
      res.status(401).json({ error: "ongeldige toegangscode" });
      return;
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: "messages ontbreekt of is leeg" });
      return;
    }

    try {
      const antwoord = await stuurNaarOpenRouter({ messages, apiKey, model, fetchImpl });
      res.status(200).json(antwoord);
    } catch {
      res.status(502).json({ error: "doorsturen naar OpenRouter is mislukt" });
    }
  });

  return app;
}

function main() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL;
  const toegestaneOrigin = process.env.ALLOWED_ORIGIN;
  const codesPath = process.env.CODES_PATH ?? new URL("../codes.json", import.meta.url).pathname;
  const port = process.env.PORT ?? 8787;

  if (!apiKey) {
    console.error("OPENROUTER_API_KEY ontbreekt — zet 'm in relay/.env");
    process.exit(1);
  }
  if (!model) {
    console.error("OPENROUTER_MODEL ontbreekt — zet 'm in relay/.env");
    process.exit(1);
  }

  const app = maakServer({ codesPath, apiKey, model, toegestaneOrigin });
  app.listen(port, () => {
    console.log(`doorgeefluik luistert op poort ${port}`);
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

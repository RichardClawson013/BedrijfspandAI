import express from "express";
import { laadCodes, isGeldigeCode } from "./codes.js";
import { maakRateLimiter } from "./rateLimiter.js";
import { stuurNaarOpenRouter } from "./openrouter.js";
import { stuurNaarGoogle } from "./google.js";

const PROVIDERS = {
  openrouter: stuurNaarOpenRouter,
  google: stuurNaarGoogle,
};

export function maakServer({
  codesPath,
  provider = "openrouter",
  apiKeys,
  model,
  toegestaneOrigin,
  fetchImpl,
  rateLimiter,
}) {
  const stuurNaarProvider = PROVIDERS[provider];
  if (!stuurNaarProvider) {
    throw new Error(`onbekende provider: ${provider}`);
  }

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
      const antwoord = await stuurNaarProvider({ messages, apiKeys, model, fetchImpl });
      res.status(200).json({ ...antwoord, provider, model });
    } catch {
      res.status(502).json({ error: `doorsturen naar ${provider} is mislukt` });
    }
  });

  return app;
}

function laadApiKeysUitEnv(provider) {
  const naam = `${provider.toUpperCase()}_API_KEYS`;
  return (process.env[naam] ?? "")
    .split(",")
    .map((sleutel) => sleutel.trim())
    .filter((sleutel) => sleutel.length > 0);
}

function main() {
  const provider = process.env.PROVIDER ?? "openrouter";
  const apiKeys = laadApiKeysUitEnv(provider);
  const model = process.env.MODEL;
  const toegestaneOrigin = process.env.ALLOWED_ORIGIN;
  const codesPath = process.env.CODES_PATH ?? new URL("../codes.json", import.meta.url).pathname;
  const port = process.env.PORT ?? 8787;

  if (!PROVIDERS[provider]) {
    console.error(`PROVIDER=${provider} is onbekend — gebruik "openrouter" of "google"`);
    process.exit(1);
  }
  if (apiKeys.length === 0) {
    console.error(
      `${provider.toUpperCase()}_API_KEYS ontbreekt — zet minstens één sleutel in relay/.env (komma-gescheiden voor meerdere)`,
    );
    process.exit(1);
  }
  if (!model) {
    console.error("MODEL ontbreekt — zet 'm in relay/.env");
    process.exit(1);
  }

  const app = maakServer({ codesPath, provider, apiKeys, model, toegestaneOrigin });
  app.listen(port, () => {
    console.log(`doorgeefluik luistert op poort ${port}, provider=${provider} (${apiKeys.length} sleutel(s) geconfigureerd)`);
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

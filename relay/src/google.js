const GOOGLE_URL = (model) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
const SLEUTEL_GERELATEERDE_STATUSSEN = new Set([401, 403, 429]);

function naarGoogleBody(messages) {
  const systeemDelen = messages.filter((bericht) => bericht.role === "system").map((bericht) => bericht.content);
  const contents = messages
    .filter((bericht) => bericht.role !== "system")
    .map((bericht) => ({
      role: bericht.role === "assistant" ? "model" : "user",
      parts: [{ text: bericht.content }],
    }));

  const body = { contents };
  if (systeemDelen.length > 0) {
    body.systemInstruction = { parts: [{ text: systeemDelen.join("\n\n") }] };
  }
  return body;
}

async function eenPoging({ messages, apiKey, model, fetchImpl }) {
  const response = await fetchImpl(`${GOOGLE_URL(model)}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(naarGoogleBody(messages)),
  });

  const body = await response.json();

  if (!response.ok) {
    const error = new Error(`Google antwoordde met status ${response.status}`);
    error.status = response.status;
    error.body = body;
    throw error;
  }

  return body;
}

function normaliseerAntwoord(body) {
  const tekst = body?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof tekst !== "string") {
    throw new Error("Google-antwoord had geen bruikbare inhoud");
  }
  return { content: tekst };
}

/**
 * Zelfde patroon als stuurNaarOpenRouter: sleutels op volgorde proberen,
 * terugvallen op de volgende bij een sleutel-gerelateerde fout (401/403/429)
 * of een netwerkfout — niet bij een andere fout (bv. 400), want een andere
 * sleutel lost die dan niet op.
 */
export async function stuurNaarGoogle({ messages, apiKeys, model, fetchImpl = fetch }) {
  if (!Array.isArray(apiKeys) || apiKeys.length === 0) {
    throw new Error("er is geen enkele Google-sleutel geconfigureerd");
  }

  let laatsteFout;
  for (const apiKey of apiKeys) {
    try {
      const body = await eenPoging({ messages, apiKey, model, fetchImpl });
      return normaliseerAntwoord(body);
    } catch (fout) {
      laatsteFout = fout;
      const magOpnieuw = !fout.status || SLEUTEL_GERELATEERDE_STATUSSEN.has(fout.status);
      if (!magOpnieuw) throw fout;
    }
  }
  throw laatsteFout;
}

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const SLEUTEL_GERELATEERDE_STATUSSEN = new Set([401, 403, 429]);

async function eenPoging({ messages, apiKey, model, fetchImpl }) {
  const response = await fetchImpl(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages }),
  });

  const body = await response.json();

  if (!response.ok) {
    const error = new Error(`OpenRouter antwoordde met status ${response.status}`);
    error.status = response.status;
    error.body = body;
    throw error;
  }

  return body;
}

function normaliseerAntwoord(body) {
  const tekst = body?.choices?.[0]?.message?.content;
  if (typeof tekst !== "string") {
    throw new Error("OpenRouter-antwoord had geen bruikbare inhoud");
  }
  return { content: tekst };
}

/**
 * Probeert de sleutels in volgorde (eerste = primair, rest = backup).
 * Valt alleen terug op de volgende sleutel bij een sleutel-gerelateerde fout
 * (401/403/429) of een netwerkfout — niet bij een fout die niets met de
 * sleutel te maken heeft, want een andere sleutel lost die dan niet op.
 */
export async function stuurNaarOpenRouter({ messages, apiKeys, model, fetchImpl = fetch }) {
  if (!Array.isArray(apiKeys) || apiKeys.length === 0) {
    throw new Error("er is geen enkele OpenRouter-sleutel geconfigureerd");
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

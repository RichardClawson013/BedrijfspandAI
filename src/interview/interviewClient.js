import { parseModelResponse } from "./validateModelTurn.js";

const MAX_HERSTELPOGINGEN = 2;

/**
 * Bouwt de OpenAI-stijl messages-array die het doorgeefluik verwacht. Het
 * luik is stateless, dus bij elke aanroep wordt de volledige geschiedenis
 * opnieuw meegestuurd: het systeemprompt als system, elke eerdere
 * modelrespons (het rauwe, eerder gevalideerde JSON-antwoord) als
 * assistant, elke ondernemer-invoer als user.
 */
export function bouwMessages(systeemPrompt, wisselingen) {
  const messages = [{ role: "system", content: systeemPrompt }];
  for (const wisseling of wisselingen) {
    if (wisseling.rol === "model") {
      messages.push({ role: "assistant", content: wisseling.inhoud });
    } else if (wisseling.rol === "ondernemer") {
      messages.push({ role: "user", content: wisseling.inhoud });
    }
  }
  return messages;
}

async function roepInterviewluikAan({ apiUrl, code, messages, fetchImpl }) {
  let response;
  try {
    response = await fetchImpl(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, messages }),
    });
  } catch (netwerkFout) {
    const fout = new Error(netwerkFout.message);
    fout.categorie = "doorgeefluik-onbereikbaar";
    throw fout;
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const fout = new Error(body.error ?? `doorgeefluik antwoordde met status ${response.status}`);
    fout.categorie = "doorgeefluik-fout";
    fout.status = response.status;
    throw fout;
  }

  const data = await response.json();
  return data.content;
}

/**
 * Vraagt het model om de volgende beurt(en). Bij een antwoord dat niet aan
 * het beurt-protocol voldoet, wordt het model tot twee keer opnieuw
 * gevraagd met de concrete foutmelding erbij. Faalt dat ook, dan stopt het
 * interview met een duidelijke reden — nooit stil doorgaan met een
 * onbetrouwbaar antwoord. Een onbereikbaar doorgeefluik of een afgewezen
 * verzoek (bv. ongeldige toegangscode) wordt niet herhaald: opnieuw
 * proberen lost dat niet op.
 */
export async function vraagModelBeurt({ apiUrl, code, systeemPrompt, wisselingen, fetchImpl }) {
  let messages = bouwMessages(systeemPrompt, wisselingen);
  const pogingFouten = [];

  for (let poging = 1; poging <= MAX_HERSTELPOGINGEN + 1; poging += 1) {
    let ruweTekst;
    try {
      ruweTekst = await roepInterviewluikAan({ apiUrl, code, messages, fetchImpl });
    } catch (fout) {
      return { ok: false, reden: fout.categorie ?? "onbekende-fout", detail: fout.message };
    }

    const resultaat = parseModelResponse(ruweTekst);
    if (resultaat.valid) {
      return { ok: true, beurten: resultaat.turns, ruweTekst };
    }

    pogingFouten.push({ poging, errors: resultaat.errors });

    const foutmelding = resultaat.errors.map((e) => `${e.category}: ${e.message}`).join("; ");
    messages = [
      ...messages,
      { role: "assistant", content: ruweTekst },
      {
        role: "user",
        content: `Dit antwoord voldeed niet aan het verplichte formaat (${foutmelding}). Antwoord opnieuw, uitsluitend met een geldige JSON-array volgens het protocol.`,
      },
    ];
  }

  return { ok: false, reden: "ongeldig-antwoord-na-herstelpogingen", pogingen: pogingFouten };
}

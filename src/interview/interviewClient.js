import { parseModelResponse } from "./validateModelTurn.js";

const MAX_HERSTELPOGINGEN = 2;

// SPEC.md §6 ("Netwerkfout-herstel"): een onbereikbaar doorgeefluik mag het
// gesprek niet meer hard beëindigen. Alleen deze categorie wordt herhaald —
// `doorgeefluik-fout` (bv. een afgewezen toegangscode) lost opnieuw proberen
// niet op.
const MAX_NETWERK_HERPOGINGEN = 2;
const NETWERK_BACKOFF_MS = [500, 1500];

function wacht(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

async function doeEenAanroep({ apiUrl, code, messages, fetchImpl }) {
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
  return { ruweTekst: data.content, provider: data.provider, model: data.model };
}

/**
 * Probeert het doorgeefluik aan te roepen, met stille herpoging (oplopende
 * backoff) zolang de fout categorie `doorgeefluik-onbereikbaar` heeft. Een
 * afgewezen verzoek (`doorgeefluik-fout`, bv. ongeldige toegangscode) wordt
 * nooit herhaald — dat lost een nieuwe poging niet op.
 */
async function roepInterviewluikAan({ apiUrl, code, messages, fetchImpl, wachtImpl = wacht }) {
  for (let poging = 0; poging <= MAX_NETWERK_HERPOGINGEN; poging += 1) {
    try {
      return await doeEenAanroep({ apiUrl, code, messages, fetchImpl });
    } catch (fout) {
      const isLaatstePoging = poging === MAX_NETWERK_HERPOGINGEN;
      if (fout.categorie !== "doorgeefluik-onbereikbaar" || isLaatstePoging) {
        throw fout;
      }
      await wachtImpl(NETWERK_BACKOFF_MS[poging]);
    }
  }
  // Onbereikbaar: de lus hierboven retourneert of gooit altijd binnen
  // MAX_NETWERK_HERPOGINGEN + 1 pogingen.
}

const VASTE_TERUGVALTEKST =
  "Ik liep vast bij het verwerken van je laatste antwoord. Kun je het opnieuw of in andere woorden formuleren?";

/**
 * Laatste redmiddel na uitgeputte herstelpogingen (SPEC.md §2 punt 4): niet
 * nogmaals de volledige, complexe protocol-opdracht (daar liep het net al
 * op vast), maar een sterk vereenvoudigde vraag om alleen gewone tekst —
 * veel kleinere kans dat het model daar ook op vastloopt. Lukt zelfs dat
 * niet (netwerkfout, leeg antwoord), dan een vaste, niet-modelgegenereerde
 * tekst met dezelfde strekking. Gooit nooit een fout: het gesprek moet
 * altijd door kunnen.
 */
async function vraagGracieuzeUitleg({ apiUrl, code, messages, fetchImpl, wachtImpl }) {
  const gracieuzeMessages = [
    ...messages,
    {
      role: "user",
      content:
        "Je antwoorden voldeden niet aan het verplichte formaat, ook niet na herstelpogingen. Schrijf nu ALLEEN gewone tekst — geen JSON, geen array: één korte, vriendelijke zin waarin je de ondernemer uitlegt dat je vastliep bij het verwerken van zijn laatste antwoord, en vraagt dat antwoord opnieuw of anders te verwoorden.",
      },
    ];

  try {
    const { ruweTekst } = await roepInterviewluikAan({ apiUrl, code, messages: gracieuzeMessages, fetchImpl, wachtImpl });
    const tekst = ruweTekst?.trim();
    return tekst && tekst.length > 0 ? tekst : VASTE_TERUGVALTEKST;
  } catch {
    return VASTE_TERUGVALTEKST;
  }
}

/**
 * Vraagt het model om de volgende beurt(en). Bij een antwoord dat niet aan
 * het beurt-protocol voldoet, wordt het model tot twee keer opnieuw
 * gevraagd met de concrete foutmelding erbij. Faalt dat ook, dan schakelt
 * het over op een vereenvoudigde, gracieuze uitleg aan de ondernemer
 * (`vraagGracieuzeUitleg`) — het interview stopt nooit meer onherstelbaar
 * door een modelhapering. Een onbereikbaar doorgeefluik wordt binnen
 * `roepInterviewluikAan` al stil herhaald (SPEC.md §6); pas als ook die
 * herpogingen uitgeput zijn, of bij een afgewezen verzoek (bv. ongeldige
 * toegangscode), geeft deze functie `ok: false` terug.
 */
export async function vraagModelBeurt({ apiUrl, code, systeemPrompt, wisselingen, fetchImpl, wachtImpl }) {
  let messages = bouwMessages(systeemPrompt, wisselingen);
  const pogingFouten = [];

  for (let poging = 1; poging <= MAX_HERSTELPOGINGEN + 1; poging += 1) {
    let ruweTekst;
    let provider;
    let model;
    try {
      ({ ruweTekst, provider, model } = await roepInterviewluikAan({ apiUrl, code, messages, fetchImpl, wachtImpl }));
    } catch (fout) {
      return { ok: false, reden: fout.categorie ?? "onbekende-fout", detail: fout.message };
    }

    const resultaat = parseModelResponse(ruweTekst);
    if (resultaat.valid) {
      return { ok: true, beurten: resultaat.turns, ruweTekst, provider, model };
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

  const uitlegTekst = await vraagGracieuzeUitleg({ apiUrl, code, messages, fetchImpl, wachtImpl });
  return { ok: true, gracieusHersteld: true, uitlegTekst, pogingen: pogingFouten };
}

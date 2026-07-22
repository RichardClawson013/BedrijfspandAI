export const RONDE_WAARSCHUWING = 8;
export const RONDE_DESTILLATIE = 10;
export const RONDE_AFSLUITEN = 12;
export const NOODREM_TOTAAL = 2500;

const EXTRACTIE_RESET_TYPEN = new Set(["taak", "edge"]);

export const WAARSCHUWINGSTEKST =
  "We naderen een grens in dit onderdeel van het gesprek. Wil je je antwoord " +
  "nog aanscherpen — bijvoorbeeld door het eerst voor jezelf op een rijtje te " +
  "zetten — voordat we verdergaan?";

export const AFSLUITTEKST =
  "Dankjewel voor alle informatie. We gaan ons best doen om wat nu nog mist " +
  "in te vullen op een manier die waarde toevoegt aan jouw verhaal en bedrijf.";

/**
 * Telt interviewer-dialoogbeurten sinds de laatste taak- of edge-extractie
 * (of sinds de naamstap als er nog geen extractie was geweest). Puur en
 * deterministisch: rekent alleen met beurttypen die de validator van
 * Deelstap 1 al goedkeurt — nooit met een oordeel van het model zelf over
 * of iets "een nieuwe vraag" is.
 */
export function rondenSindsLaatsteExtractie(transcript) {
  let rondes = 0;
  for (const beurt of transcript) {
    if (beurt.type === "naamstap" || EXTRACTIE_RESET_TYPEN.has(beurt.type)) {
      rondes = 0;
      continue;
    }
    if (beurt.type === "dialoog" && beurt.spreker === "interviewer") {
      rondes += 1;
    }
  }
  return rondes;
}

export function noodremBereikt(transcript) {
  return transcript.length >= NOODREM_TOTAAL;
}

/**
 * Bepaalt de status van de lopende interviewvraag. De client gebruikt dit
 * om te beslissen wat er hierna naar het model gestuurd wordt — dit is een
 * afgedwongen status, geen suggestie die het model kan negeren.
 */
export function bepaalVraagStatus(transcript) {
  if (noodremBereikt(transcript)) return "noodrem";

  const rondes = rondenSindsLaatsteExtractie(transcript);
  if (rondes >= RONDE_AFSLUITEN) return "afsluiten";
  if (rondes >= RONDE_DESTILLATIE) return "destilleren";
  if (rondes >= RONDE_WAARSCHUWING) return "waarschuwing";
  return "normaal";
}

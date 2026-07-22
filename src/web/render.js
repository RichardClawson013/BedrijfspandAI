const DEKKING_LABELS = {
  GEDEKT: "GEDEKT",
  AFGELEID: "AFGELEID",
  "GEEN-DEKKING": "GEEN-DEKKING",
};

function dekkingBadge(dekking) {
  const badge = document.createElement("span");
  const sleutel = dekking ?? "ontbreekt";
  badge.className = `badge badge--${sleutel.toLowerCase().replace("-", "")}`;
  badge.textContent = DEKKING_LABELS[sleutel] ?? "dekking ontbreekt";
  return badge;
}

function beurtBron(sourceTurns) {
  if (!sourceTurns || sourceTurns.length === 0) return "geen bronverwijzing";
  const meervoud = sourceTurns.length > 1 ? "en" : "";
  return `beurt${meervoud} ${sourceTurns.join(", ")}`;
}

function renderDialoog(beurt) {
  const el = document.createElement("article");
  el.className = `bericht bericht--${beurt.spreker}`;
  const spreker = document.createElement("p");
  spreker.className = "bericht__spreker";
  spreker.textContent = beurt.spreker;
  const tekst = document.createElement("p");
  tekst.className = "bericht__tekst";
  tekst.textContent = beurt.tekst;
  el.append(spreker, tekst);
  return el;
}

function renderExtractie(titel, samenvatting, data) {
  const el = document.createElement("article");
  el.className = "extractie";
  const kop = document.createElement("p");
  kop.className = "extractie__kop";
  kop.textContent = titel;
  const inhoud = document.createElement("p");
  inhoud.className = "extractie__inhoud";
  inhoud.textContent = samenvatting;
  const meta = document.createElement("p");
  meta.className = "extractie__meta";
  meta.append(dekkingBadge(data.dekking), document.createTextNode(` — ${beurtBron(data.source_turns)}`));
  el.append(kop, inhoud, meta);
  return el;
}

export function renderTurn(beurt) {
  switch (beurt.type) {
    case "naamstap": {
      const el = document.createElement("article");
      el.className = "extractie extractie--naamstap";
      el.textContent = `Naamstap vastgelegd: de digitale werknemer heet voortaan ${beurt.naam}.`;
      return el;
    }
    case "dialoog":
      return renderDialoog(beurt);
    case "afronding": {
      const el = document.createElement("article");
      el.className = "extractie extractie--naamstap";
      el.textContent = "Interview afgerond — bezig met compileren en valideren...";
      return el;
    }
    case "taak":
      return renderExtractie(`Taak vastgelegd: ${beurt.data.naam}`, beurt.data.beschrijving ?? "(geen beschrijving)", beurt.data);
    case "edge":
      return renderExtractie(`Afhankelijkheid vastgelegd: ${beurt.data.van} → ${beurt.data.naar}`, beurt.data.soort ?? "(geen soort opgegeven)", beurt.data);
    case "ziel_principe":
      return renderExtractie(`Principe vastgelegd: ${beurt.data.titel ?? "(zonder titel)"}`, beurt.data.tekst, beurt.data);
    case "skill":
      return renderExtractie(`Vaardigheid vastgelegd: ${beurt.data.naam}`, beurt.data.domein ?? "(geen domein)", beurt.data);
    case "tool":
      return renderExtractie(`Gereedschap vastgelegd: ${beurt.data.naam}`, beurt.data.soort === "suggestie" ? "AI-suggestie" : "huidig gebruikt", beurt.data);
    default:
      throw new Error(`onbekend beurttype: ${beurt.type}`);
  }
}

function extensieMimeType(bestandsnaam) {
  if (bestandsnaam.endsWith(".json")) return "application/json";
  if (bestandsnaam.endsWith(".md")) return "text/markdown";
  if (bestandsnaam.endsWith(".html")) return "text/html";
  return "text/plain";
}

export function renderGeslaagd(uitvoer) {
  const wrap = document.createElement("div");
  wrap.className = "resultaat resultaat--geslaagd";

  const kop = document.createElement("p");
  kop.className = "resultaat__kop";
  kop.textContent = "De validator keurt dit manifest goed. Downloads:";
  wrap.append(kop);

  const lijst = document.createElement("ul");
  lijst.className = "downloadlijst";
  for (const [bestandsnaam, inhoud] of Object.entries(uitvoer)) {
    const item = document.createElement("li");
    const link = document.createElement("a");
    const blob = new Blob([inhoud], { type: extensieMimeType(bestandsnaam) });
    link.href = URL.createObjectURL(blob);
    link.download = bestandsnaam;
    link.textContent = bestandsnaam;
    item.append(link);
    lijst.append(item);
  }
  wrap.append(lijst);

  return wrap;
}

export function renderAfkeuring(errors) {
  const wrap = document.createElement("div");
  wrap.className = "resultaat resultaat--afgekeurd";

  const kop = document.createElement("p");
  kop.className = "resultaat__kop";
  kop.textContent = "De validator keurt dit manifest af. Er wordt niets stil hersteld of opgevuld — dit ontbreekt:";
  wrap.append(kop);

  const lijst = document.createElement("ul");
  lijst.className = "foutenlijst";
  for (const fout of errors) {
    const item = document.createElement("li");
    const categorie = document.createElement("strong");
    categorie.textContent = fout.category;
    item.append(categorie, document.createTextNode(`: ${fout.message}`));
    lijst.append(item);
  }
  wrap.append(lijst);

  return wrap;
}

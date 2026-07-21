function escapeHtml(input) {
  return String(input)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

const AUTONOMIE_LABELS = [
  ["autonoom", "Doet zelfstandig"],
  ["eerst-vragen", "Vraagt eerst"],
  ["nooit", "Raakt nooit aan"],
];

function principeItem(principe) {
  const titel = escapeHtml(principe.titel ?? "Principe");
  const tekst = escapeHtml(principe.tekst);
  const dekking = escapeHtml(principe.dekking);
  const beurten = principe.source_turns.join(", ");
  return `        <li><strong>${titel}:</strong> ${tekst} <em>(${dekking}, beurt ${beurten})</em></li>`;
}

function taakItem(taak) {
  const naam = escapeHtml(taak.naam);
  const faalgevolg = taak.faalgevolg
    ? ` — <em>faalgevolg: ${escapeHtml(taak.faalgevolg)}</em>`
    : "";
  return `          <li>${naam}${faalgevolg}</li>`;
}

export function buildRapport({ naam, taken, zielPrincipes }) {
  const naamEsc = escapeHtml(naam);
  const slugEsc = escapeHtml(naam.toLowerCase());

  const principesHtml = zielPrincipes.length
    ? zielPrincipes.map(principeItem).join("\n")
    : "        <li><em>Geen principes vastgelegd.</em></li>";

  const taakSecties = AUTONOMIE_LABELS.map(([niveau, label]) => {
    const items = taken.filter((taak) => taak.autonomie === niveau);
    const lijst = items.length
      ? items.map(taakItem).join("\n")
      : "          <li><em>Geen taken op dit niveau.</em></li>";
    return `    <section>
      <h2>${escapeHtml(label)}</h2>
      <ul>
${lijst}
      </ul>
    </section>`;
  }).join("\n");

  return `<!doctype html>
<html lang="nl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Maak kennis met ${naamEsc}</title>
  </head>
  <body>
    <main>
      <h1>Maak kennis met ${naamEsc}.</h1>
      <section>
        <h2>Wie ${naamEsc} is</h2>
        <ul>
${principesHtml}
        </ul>
      </section>
${taakSecties}
      <footer>
        <p>Leeswijzer: zie ook ziel_${slugEsc}.md, agents_${slugEsc}.md, skills_${slugEsc}.md, tools_${slugEsc}.md en wereldmodel_${slugEsc}.json.</p>
      </footer>
    </main>
  </body>
</html>
`;
}

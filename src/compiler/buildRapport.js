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
    <style>
      :root {
        --color-bg: oklch(11% 0.03 300);
        --color-surface: oklch(20% 0.032 300);
        --color-border: oklch(32% 0.03 300);
        --color-text: oklch(92% 0.015 90);
        --color-text-muted: oklch(68% 0.02 290);
        --color-gold: oklch(80% 0.13 86);
        --color-orange: oklch(58% 0.16 42);
        --font-serif: "Iowan Old Style", "Palatino Linotype", "URW Palladio", Palatino, P052, ui-serif, Georgia, serif;
        --font-sans: ui-sans-serif, "Segoe UI", system-ui, -apple-system, Roboto, sans-serif;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: var(--color-bg);
        color: var(--color-text);
        font-family: var(--font-sans);
        line-height: 1.6;
      }
      main { max-width: 42rem; margin: 0 auto; padding: 3rem 1.5rem 4rem; }
      h1, h2 { font-family: var(--font-serif); font-weight: 600; line-height: 1.2; margin: 0 0 1rem; }
      h1 { font-size: clamp(1.8rem, 1.4rem + 1.6vw, 2.5rem); color: var(--color-gold); }
      h2 { font-size: 1.25rem; }
      section {
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: 14px;
        padding: 1.5rem;
        margin-bottom: 1rem;
      }
      ul { margin: 0; padding-left: 1.2rem; }
      li { margin-bottom: 0.5rem; }
      em { color: var(--color-text-muted); font-style: normal; }
      footer { color: var(--color-text-muted); font-size: 0.85rem; margin-top: 2rem; }
    </style>
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

function vindAfhankelijkheden(taakId, taken, edges) {
  const verbonden = new Set();
  for (const edge of edges) {
    if (edge.van === taakId) verbonden.add(edge.naar);
    if (edge.naar === taakId) verbonden.add(edge.van);
  }
  for (const taak of taken) {
    if ((taak.afhankelijk_van ?? []).includes(taakId)) verbonden.add(taak.id);
  }

  if (verbonden.size === 0) return "niets bekends — geen andere taak of edge verwijst hiernaar.";
  return [...verbonden].join(", ");
}

export function buildOpenOnderwerpen({ naam, taken, edges }) {
  const openTaken = taken.filter((taak) => taak.dekking === "GEEN-DEKKING");
  const openEdges = edges.filter((edge) => edge.dekking === "GEEN-DEKKING");

  const regels = [`# Open onderwerpen — trainingsagenda voor ${naam}`, ""];

  if (openTaken.length === 0 && openEdges.length === 0) {
    regels.push("_Geen open onderwerpen. Alles is GEDEKT of AFGELEID vastgelegd._");
    return `${regels.join("\n").trimEnd()}\n`;
  }

  regels.push(
    `Dit zijn de onderwerpen die tijdens het interview bewust open zijn gelaten ` +
      `(GEEN-DEKKING) — de trainingsagenda voor ${naam} zodra deze operationeel is.`,
    "",
  );

  if (openTaken.length > 0) {
    regels.push("## Open taken", "");
    for (const taak of openTaken) {
      regels.push(`### ${taak.naam}`, "");
      regels.push(`- **Waar:** beurt ${taak.source_turns.join(", ")}`);
      regels.push(
        "- **Waarom open:** bewust open gelaten tijdens het interview — geen bronverwijzing of afgeleide redenering vastgelegd.",
      );
      regels.push(`- **Wat hangt hiervan af:** ${vindAfhankelijkheden(taak.id, taken, edges)}`);
      regels.push("");
    }
  }

  if (openEdges.length > 0) {
    regels.push("## Open afhankelijkheden", "");
    for (const edge of openEdges) {
      regels.push(`### ${edge.van} → ${edge.naar}`, "");
      regels.push(`- **Waar:** beurt ${edge.source_turns.join(", ")}`);
      regels.push(
        "- **Waarom open:** bewust open gelaten tijdens het interview — geen bronverwijzing of afgeleide redenering vastgelegd.",
      );
      regels.push("");
    }
  }

  return `${regels.join("\n").trimEnd()}\n`;
}

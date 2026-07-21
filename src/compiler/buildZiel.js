function dekkingsregel(data) {
  const meervoud = data.source_turns.length > 1 ? "en" : "";
  return `**Dekking:** ${data.dekking} — beurt${meervoud} ${data.source_turns.join(", ")}`;
}

export function buildZiel({ naam, zielPrincipes }) {
  const regels = [`# Ziel van ${naam}`, ""];

  if (zielPrincipes.length === 0) {
    regels.push("_Geen principes vastgelegd in dit interview._", "");
  }

  zielPrincipes.forEach((principe, index) => {
    regels.push(`## ${principe.titel ?? `Principe ${index + 1}`}`, "");
    regels.push(principe.tekst, "");
    if (principe.reden) {
      regels.push(`**Reden:** ${principe.reden}`, "");
    }
    regels.push(dekkingsregel(principe), "");
  });

  return `${regels.join("\n").trimEnd()}\n`;
}

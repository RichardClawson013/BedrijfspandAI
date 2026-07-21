function regel(tool) {
  const voorTaak = tool.taak_id ? ` (voor ${tool.taak_id})` : "";
  const redenering = tool.redenering ? `: ${tool.redenering}` : "";
  return `- **${tool.naam}**${voorTaak} — ${tool.dekking}${redenering}, beurt ${tool.source_turns.join(", ")}`;
}

export function buildTools({ naam, tools }) {
  const regels = [`# Gereedschap — ${naam}`, ""];

  const huidig = tools.filter((tool) => tool.soort === "huidig");
  const suggesties = tools.filter((tool) => tool.soort === "suggestie");

  regels.push("## Huidig gebruikt", "");
  if (huidig.length === 0) {
    regels.push("_Geen huidig gereedschap vastgelegd._", "");
  } else {
    for (const tool of huidig) regels.push(regel(tool));
    regels.push("");
  }

  regels.push("## AI-toolsuggesties", "");
  if (suggesties.length === 0) {
    regels.push("_Geen suggesties._", "");
  } else {
    for (const tool of suggesties) regels.push(regel(tool));
    regels.push("");
  }

  return `${regels.join("\n").trimEnd()}\n`;
}

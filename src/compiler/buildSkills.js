export function buildSkills({ naam, skills }) {
  const regels = [`# Vaardigheden — ${naam}`, ""];

  if (skills.length === 0) {
    regels.push("_Geen vaardigheden vastgelegd in dit interview._", "");
    return `${regels.join("\n").trimEnd()}\n`;
  }

  const perDomein = new Map();
  for (const skill of skills) {
    const domein = skill.domein ?? "Algemeen";
    if (!perDomein.has(domein)) perDomein.set(domein, []);
    perDomein.get(domein).push(skill);
  }

  for (const [domein, lijst] of [...perDomein.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    regels.push(`## ${domein}`, "");
    for (const skill of lijst) {
      regels.push(`- **${skill.naam}** (${skill.dekking}, beurt ${skill.source_turns.join(", ")})`);
    }
    regels.push("");
  }

  return `${regels.join("\n").trimEnd()}\n`;
}

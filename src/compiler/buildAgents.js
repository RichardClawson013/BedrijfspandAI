const AUTONOMIE_LABELS = [
  ["autonoom", "Doet zelfstandig"],
  ["eerst-vragen", "Vraagt eerst"],
  ["nooit", "Raakt nooit aan"],
];

export function buildAgents({ naam, taken }) {
  const regels = [`# Operationeel profiel — ${naam}`, ""];

  for (const [niveau, label] of AUTONOMIE_LABELS) {
    const takenOpNiveau = taken.filter((taak) => taak.autonomie === niveau);
    regels.push(`## ${label}`, "");
    if (takenOpNiveau.length === 0) {
      regels.push("_Geen taken op dit niveau._", "");
    } else {
      for (const taak of takenOpNiveau) {
        regels.push(`- **${taak.naam}** (${taak.dekking}, beurt ${taak.source_turns.join(", ")})`);
      }
      regels.push("");
    }
  }

  const onbepaald = taken.filter((taak) => !taak.autonomie);
  if (onbepaald.length > 0) {
    regels.push("## Nog niet bepaald", "");
    for (const taak of onbepaald) {
      regels.push(`- **${taak.naam}** — autonomieniveau nog niet vastgesteld`);
    }
    regels.push("");
  }

  regels.push("## Escalatieregels", "");
  const takenMetEscalatie = taken.filter((taak) => taak.escalatie?.length);
  if (takenMetEscalatie.length === 0) {
    regels.push("_Geen escalatieregels vastgelegd._", "");
  } else {
    for (const taak of takenMetEscalatie) {
      for (const regel of taak.escalatie) {
        regels.push(`- **${taak.naam}** — als ${regel.als}, dan ${regel.dan}`);
      }
    }
    regels.push("");
  }

  return `${regels.join("\n").trimEnd()}\n`;
}

export function parseTranscript(transcript) {
  if (!Array.isArray(transcript) || transcript.length === 0) {
    throw new Error("transcript moet een niet-lege array zijn");
  }

  // Sinds Stap 5 deelstap 4 is beurt 1 het vaste welkomsbericht, niet meer
  // per definitie de naamstap (SPEC.md §2 punt 2/3) — de naamstap wordt
  // dus op positie gezocht, niet aangenomen op transcript[0].
  const naamstap = transcript.find((beurt) => beurt.type === "naamstap");
  if (!naamstap) {
    throw new Error('transcript moet een beurt met type "naamstap" bevatten');
  }

  const parsed = {
    naam: naamstap.naam,
    taken: [],
    edges: [],
    zielPrincipes: [],
    skills: [],
    tools: [],
  };

  for (const beurt of transcript) {
    switch (beurt.type) {
      case "naamstap":
      case "dialoog":
      case "afronding":
        break;
      case "taak":
        parsed.taken.push(beurt.data);
        break;
      case "edge":
        parsed.edges.push(beurt.data);
        break;
      case "ziel_principe":
        parsed.zielPrincipes.push(beurt.data);
        break;
      case "skill":
        parsed.skills.push(beurt.data);
        break;
      case "tool":
        parsed.tools.push(beurt.data);
        break;
      default:
        throw new Error(`onbekend beurttype: ${beurt.type}`);
    }
  }

  return parsed;
}

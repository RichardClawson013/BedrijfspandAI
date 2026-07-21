export function parseTranscript(transcript) {
  if (!Array.isArray(transcript) || transcript.length === 0) {
    throw new Error("transcript moet een niet-lege array zijn");
  }

  const eerste = transcript[0];
  if (eerste.turn !== 1 || eerste.type !== "naamstap") {
    throw new Error('beurt 1 moet de naamstap zijn (type: "naamstap", turn: 1)');
  }

  const parsed = {
    naam: eerste.naam,
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

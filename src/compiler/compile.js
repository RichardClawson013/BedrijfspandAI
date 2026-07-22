import { parseTranscript } from "./parseTranscript.js";
import { buildManifest } from "./buildManifest.js";
import { buildZiel } from "./buildZiel.js";
import { buildAgents } from "./buildAgents.js";
import { buildSkills } from "./buildSkills.js";
import { buildTools } from "./buildTools.js";
import { buildRapport } from "./buildRapport.js";
import { buildOpenOnderwerpen } from "./buildOpenOnderwerpen.js";
import { canonicalJson } from "./canonicalJson.js";

export function compile(transcript, { generated, interviewId, provider, model }) {
  const parsed = parseTranscript(transcript);
  const naamSlug = parsed.naam.toLowerCase();

  const manifest = buildManifest(parsed, {
    generated,
    interviewId,
    provider,
    model,
    turnsTotal: transcript.length,
  });

  return {
    [`wereldmodel_${naamSlug}.json`]: canonicalJson(manifest),
    [`ziel_${naamSlug}.md`]: buildZiel(parsed),
    [`agents_${naamSlug}.md`]: buildAgents(parsed),
    [`skills_${naamSlug}.md`]: buildSkills(parsed),
    [`tools_${naamSlug}.md`]: buildTools(parsed),
    [`rapport_${naamSlug}.html`]: buildRapport(parsed),
    [`open_onderwerpen_trainingbot_${naamSlug}.md`]: buildOpenOnderwerpen(parsed),
    "transcript.json": canonicalJson(transcript),
  };
}

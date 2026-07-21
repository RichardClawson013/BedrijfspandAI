export function buildManifest({ naam, taken, edges }, { generated, interviewId, provider, model, turnsTotal }) {
  return {
    schema_version: "1.0",
    generated,
    werknemer: { naam },
    interview: {
      id: interviewId,
      turns_total: turnsTotal,
      provider,
      model,
    },
    tasks: taken,
    edges,
  };
}

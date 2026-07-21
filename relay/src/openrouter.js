const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export async function stuurNaarOpenRouter({ messages, apiKey, model, fetchImpl = fetch }) {
  const response = await fetchImpl(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages }),
  });

  const body = await response.json();

  if (!response.ok) {
    const error = new Error(`OpenRouter antwoordde met status ${response.status}`);
    error.status = response.status;
    error.body = body;
    throw error;
  }

  return body;
}

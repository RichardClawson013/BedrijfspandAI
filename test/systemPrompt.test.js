import { test } from "node:test";
import assert from "node:assert/strict";

import { INTERVIEW_SYSTEEM_PROMPT } from "../src/interview/systemPrompt.js";

test("het systeemprompt bevat de kernregels van het protocol", () => {
  assert.ok(INTERVIEW_SYSTEEM_PROMPT.length > 0);
  for (const kern of [
    "naamstap",
    "GEEN-DEKKING",
    "source_turns",
    "10 verduidelijkingsrondes",
    "2500 beurten",
    "JSON-array",
  ]) {
    assert.ok(INTERVIEW_SYSTEEM_PROMPT.includes(kern), `verwacht "${kern}" in het systeemprompt`);
  }
});

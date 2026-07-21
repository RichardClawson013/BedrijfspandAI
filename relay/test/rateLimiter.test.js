import { test } from "node:test";
import assert from "node:assert/strict";

import { maakRateLimiter } from "../src/rateLimiter.js";

test("laat aanvragen door tot het maximum", () => {
  const magDoor = maakRateLimiter({ maxAanvragen: 3, vensterMs: 60_000 });
  assert.equal(magDoor("ip-1"), true);
  assert.equal(magDoor("ip-1"), true);
  assert.equal(magDoor("ip-1"), true);
  assert.equal(magDoor("ip-1"), false);
});

test("houdt sleutels (IP's) apart bij", () => {
  const magDoor = maakRateLimiter({ maxAanvragen: 1, vensterMs: 60_000 });
  assert.equal(magDoor("ip-a"), true);
  assert.equal(magDoor("ip-b"), true);
  assert.equal(magDoor("ip-a"), false);
});

test("staat weer toe zodra het venster verlopen is", () => {
  let tijd = 0;
  const magDoor = maakRateLimiter({ maxAanvragen: 1, vensterMs: 1000, klok: () => tijd });

  assert.equal(magDoor("ip-1"), true);
  assert.equal(magDoor("ip-1"), false);

  tijd = 1001;
  assert.equal(magDoor("ip-1"), true);
});

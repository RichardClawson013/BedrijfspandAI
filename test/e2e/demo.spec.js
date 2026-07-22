import { test, expect } from "@playwright/test";

test("geldig interview: doorloop levert 8 downloadbare bestanden op", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Start de demo — sla de toegangscode over" }).click();

  await page.getByRole("button", { name: /Geldig interview \(Sam\)/ }).click();
  await expect(page.locator("#interview-naam")).toHaveText("— Sam");

  const volgende = page.getByRole("button", { name: "Volgende beurt →" });
  while (await volgende.isVisible()) {
    await volgende.click();
  }

  await page.screenshot({ path: "test-results/screenshots/geldig-interview-voltooid.png" });

  await page.getByRole("button", { name: "Gesprek afronden" }).click();

  await expect(page.locator(".resultaat--geslaagd")).toBeVisible();
  const downloads = page.locator(".downloadlijst a");
  await expect(downloads).toHaveCount(8);

  const bestandsnamen = await downloads.allTextContents();
  expect(bestandsnamen.sort()).toEqual(
    [
      "wereldmodel_sam.json",
      "ziel_sam.md",
      "agents_sam.md",
      "skills_sam.md",
      "tools_sam.md",
      "rapport_sam.html",
      "open_onderwerpen_trainingbot_sam.md",
      "transcript.json",
    ].sort(),
  );

  await page.screenshot({ path: "test-results/screenshots/geldig-interview-resultaat.png" });
});

test("interview met fout: validator keurt af met reden, geen downloads", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Start de demo — sla de toegangscode over" }).click();

  await page.getByRole("button", { name: /Interview met een fout \(Robin\)/ }).click();
  await expect(page.locator("#interview-naam")).toHaveText("— Robin");

  const volgende = page.getByRole("button", { name: "Volgende beurt →" });
  while (await volgende.isVisible()) {
    await volgende.click();
  }

  await page.getByRole("button", { name: "Gesprek afronden" }).click();

  await expect(page.locator(".resultaat--afgekeurd")).toBeVisible();
  await expect(page.locator(".foutenlijst li")).toContainText("ontbrekende-source-turns");
  await expect(page.locator(".downloadlijst")).toHaveCount(0);

  await page.screenshot({ path: "test-results/screenshots/fout-interview-resultaat.png" });
});

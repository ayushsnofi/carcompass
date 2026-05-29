import { test, expect } from "@playwright/test";

test.describe("Car recommendation flow", () => {
  test("submits query and shows ranked results with scores", async ({ page }) => {
    await page.goto("/");

    await page.getByLabel(/describe the car/i).fill(
      "Family SUV under 15 lakh with good safety and mileage"
    );
    await page.getByRole("button", { name: /get recommendations/i }).click();

    await expect(page.getByTestId("results-list")).toBeVisible({ timeout: 15000 });
    const cards = page.getByTestId("result-card");
    await expect(cards.first()).toBeVisible();
    await expect(page.getByTestId("total-score").first()).toBeVisible();
    await expect(page.getByTestId("score-breakdown").first()).toBeVisible();
    await expect(page.getByTestId("explanation").first()).toBeVisible();
  });

  test("compare drawer shows tradeoffs", async ({ page }) => {
    await page.goto("/");

    await page.getByLabel(/describe the car/i).fill(
      "Fuel efficient hatchback for city under 10 lakh"
    );
    await page.getByRole("button", { name: /get recommendations/i }).click();

    await expect(page.getByTestId("results-list")).toBeVisible({ timeout: 15000 });

    const checkboxes = page.getByTestId("compare-checkbox");
    await checkboxes.nth(0).check();
    await checkboxes.nth(1).check();

    await expect(page.getByTestId("compare-drawer")).toBeVisible();
    await expect(page.getByTestId("compare-tradeoff").first()).toBeVisible();
  });

  test("search history appears after search", async ({ page }) => {
    await page.goto("/");

    const query = "Automatic sedan with sunroof under 18 lakh";
    await page.getByLabel(/describe the car/i).fill(query);
    await page.getByRole("button", { name: /get recommendations/i }).click();

    await expect(page.getByTestId("results-list")).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId("search-history")).toBeVisible();
    await expect(page.getByTestId("search-history")).toContainText(query.slice(0, 20));
  });
});

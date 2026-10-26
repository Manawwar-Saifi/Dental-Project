import { test, expect } from "@playwright/test";
import { patientLogin } from "./helpers/patient-auth.js";
import { PATIENT } from "./fixtures/test-data.js";

test.describe("Patient Portal", () => {
  test.beforeEach(async ({ page }) => {
    await patientLogin(page);
  });

  test("dashboard shows welcome and stats", async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText(/welcome/i).first()).toBeVisible();
    // Stat cards should exist
    await expect(page.getByText(/appointment/i).first()).toBeVisible();
  });

  test("can navigate to appointments page", async ({ page }) => {
    await page.getByText(/appointment/i).first().click();
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/my appointments|appointment/i).first()).toBeVisible();
  });

  test("can navigate to profile page", async ({ page }) => {
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(new RegExp(PATIENT.name, "i")).first()).toBeVisible();
  });
});

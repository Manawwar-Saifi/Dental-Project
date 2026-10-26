import { test, expect } from "@playwright/test";
import { PATIENT } from "./fixtures/test-data.js";
import { patientLogin } from "./helpers/patient-auth.js";

test.describe("Patient Login", () => {
  test("patient can login with password", async ({ page }) => {
    await patientLogin(page);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("patient login fails with wrong password", async ({ page }) => {
    await page.goto("/login");

    // Switch to password tab
    await page.getByText(/login with password/i).click();
    await page.waitForTimeout(500);

    await page.getByLabel(/email/i).fill(PATIENT.email);
    await page.getByLabel(/password/i).fill("WrongPassword");
    await page.getByRole("button", { name: /login|sign in/i }).click();

    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/login/);
  });
});

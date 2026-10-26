import { test, expect } from "@playwright/test";
import { adminLogin } from "./helpers/admin-auth.js";

test.describe("Admin Patients", () => {
  test.beforeEach(async ({ page }) => {
    await adminLogin(page);
    await page.goto("/admin/patients");
    await page.waitForLoadState("networkidle");
  });

  test("patients page loads with table", async ({ page }) => {
    await expect(page.getByText(/patient/i).first()).toBeVisible();
    // DataTable should render (search input exists)
    await expect(page.getByPlaceholder(/search/i).first()).toBeVisible();
  });

  test("admin can open add patient modal", async ({ page }) => {
    await page.getByRole("button", { name: /add patient/i }).click();
    // Modal should appear with form fields
    await expect(page.getByLabel(/name/i).first()).toBeVisible();
    await expect(page.getByLabel(/phone/i).first()).toBeVisible();
  });

  test("admin can search for a patient", async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i).first();
    await searchInput.fill("Test");
    await page.waitForTimeout(1000);
    // Table should still be visible (may show filtered results or empty)
    await expect(page.locator("table").first()).toBeVisible();
  });
});

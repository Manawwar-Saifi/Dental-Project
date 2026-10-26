import { test, expect } from "@playwright/test";
import { adminLogin } from "./helpers/admin-auth.js";

test.describe("Admin Appointments", () => {
  test.beforeEach(async ({ page }) => {
    await adminLogin(page);
    await page.goto("/admin/appointments");
    await page.waitForLoadState("networkidle");
  });

  test("appointments page loads", async ({ page }) => {
    await expect(page.getByText(/appointment/i).first()).toBeVisible();
    await expect(page.getByPlaceholder(/search/i).first()).toBeVisible();
  });

  test("admin can open book appointment modal", async ({ page }) => {
    const addBtn = page.getByRole("button", { name: /add|book|new/i }).first();
    await addBtn.click();
    // Modal should have patient search and date fields
    await expect(page.getByText(/search patient|select patient/i).first()).toBeVisible();
  });
});

import { test, expect } from "@playwright/test";
import { adminLogin } from "./helpers/admin-auth.js";

test.describe("Admin Billing", () => {
  test.beforeEach(async ({ page }) => {
    await adminLogin(page);
    await page.goto("/admin/billing");
    await page.waitForLoadState("networkidle");
  });

  test("billing page loads with stats cards", async ({ page }) => {
    await expect(page.getByText(/billing|invoice/i).first()).toBeVisible();
    // Stats cards should be visible
    await expect(page.getByText(/total invoices/i).first()).toBeVisible();
  });

  test("admin can open create invoice modal", async ({ page }) => {
    await page.getByRole("button", { name: /create invoice/i }).click();
    // Modal should have patient search and items section
    await expect(page.getByText(/select patient|search patient/i).first()).toBeVisible();
    await expect(page.getByText(/line items/i).first()).toBeVisible();
  });
});

import { test, expect } from "@playwright/test";
import { ADMIN } from "./fixtures/test-data.js";
import { adminLogin } from "./helpers/admin-auth.js";

test.describe("Admin Login", () => {
  test("admin can login and sees dashboard", async ({ page }) => {
    await adminLogin(page);
    await expect(page).toHaveURL(/\/admin\/dashboard/);
    await expect(page.getByText(/dashboard/i).first()).toBeVisible();
  });

  test("admin login fails with wrong password", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel(/email/i).fill(ADMIN.email);
    await page.getByLabel(/password/i).fill("WrongPassword");
    await page.getByRole("button", { name: /login|sign in/i }).click();

    // Should stay on login page and show error
    await expect(page).toHaveURL(/\/admin\/login/);
    await page.waitForTimeout(2000);
    // Error message should be visible
    const errorVisible = await page.locator('[role="alert"], .MuiAlert-root, .error').first().isVisible();
    expect(errorVisible).toBe(true);
  });

  test("admin can access patients page after login", async ({ page }) => {
    await adminLogin(page);
    await page.goto("/admin/patients");
    await expect(page).toHaveURL(/\/admin\/patients/);
    await expect(page.getByText(/patient/i).first()).toBeVisible();
  });
});

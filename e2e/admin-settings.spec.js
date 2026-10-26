import { test, expect } from "@playwright/test";
import { adminLogin } from "./helpers/admin-auth.js";

test.describe("Admin Settings Page", () => {
  test.beforeEach(async ({ page }) => {
    await adminLogin(page);
  });

  test("should navigate to settings page and display tabs", async ({
    page,
  }) => {
    await page.goto("/admin/settings");
    await page.waitForLoadState("networkidle");

    const tabs = page.locator(
      "[role='tablist'], [class*='tab'], button:has-text('Profile'), button:has-text('General')"
    );
    await expect(tabs.first()).toBeVisible();
  });

  test("should show name and email fields in profile tab", async ({
    page,
  }) => {
    await page.goto("/admin/settings");
    await page.waitForLoadState("networkidle");

    // Click the profile tab if it exists as a separate tab
    const profileTab = page.getByRole("tab", { name: /profile/i });
    if (await profileTab.isVisible().catch(() => false)) {
      await profileTab.click();
      await page.waitForLoadState("networkidle");
    }

    const nameField = page.getByLabel(/name/i);
    const emailField = page.getByLabel(/email/i);

    await expect(nameField.first()).toBeVisible();
    await expect(emailField.first()).toBeVisible();
  });
});

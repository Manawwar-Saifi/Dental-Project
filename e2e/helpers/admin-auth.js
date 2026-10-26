import { ADMIN } from "../fixtures/test-data.js";

export async function adminLogin(page) {
  await page.goto("/admin/login");
  await page.getByLabel(/email/i).fill(ADMIN.email);
  await page.getByLabel(/password/i).fill(ADMIN.password);
  await page.getByRole("button", { name: /login|sign in/i }).click();
  await page.waitForURL("**/admin/dashboard", { timeout: 15000 });
}

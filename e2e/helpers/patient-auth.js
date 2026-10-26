import { PATIENT } from "../fixtures/test-data.js";

export async function patientLogin(page) {
  await page.goto("/login");

  // Click the "LOGIN WITH PASSWORD" tab (patient login defaults to OTP tab)
  await page.getByText(/login with password/i).click();
  await page.waitForTimeout(500);

  // Now fill the password login form
  await page.getByLabel(/email/i).fill(PATIENT.email);
  await page.getByLabel(/password/i).fill(PATIENT.password);
  await page.getByRole("button", { name: /login|sign in/i }).click();
  await page.waitForURL("**/dashboard", { timeout: 15000 });
}

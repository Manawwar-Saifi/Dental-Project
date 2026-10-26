/**
 * E2E Test Credentials
 *
 * These must match actual users in the database.
 * For local dev: use seeded admin (npm run seed)
 * For CI: seed test data before running tests
 */
export const ADMIN = {
  email: process.env.TEST_ADMIN_EMAIL || "admin@dentalclinic.example.com",
  password: process.env.TEST_ADMIN_PASSWORD || "Admin@123",
};

export const PATIENT = {
  email: process.env.TEST_PATIENT_EMAIL || "patient@test.com",
  password: process.env.TEST_PATIENT_PASSWORD || "Patient@123",
  name: "Test Patient",
};

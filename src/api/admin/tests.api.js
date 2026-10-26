/**
 * Admin Tests API
 *
 * API functions for diagnostic test master management.
 */
import api from "../axios";

/**
 * Get all test types (master)
 */
export const getTestMaster = async () => {
  const res = await api.get("/tests/master");
  return res.data;
};

/**
 * Get single test type
 */
export const getTestType = async (id) => {
  const res = await api.get(`/tests/master/${id}`);
  return res.data;
};

/**
 * Create new test type
 */
export const createTestType = async (data) => {
  const res = await api.post("/tests/master", data);
  return res.data;
};

/**
 * Update test type
 */
export const updateTestType = async (id, data) => {
  const res = await api.put(`/tests/master/${id}`, data);
  return res.data;
};

/**
 * Delete (soft) test type
 */
export const deleteTestType = async (id) => {
  const res = await api.delete(`/tests/master/${id}`);
  return res.data;
};

/**
 * Get test categories
 */
export const getTestCategories = async () => {
  const res = await api.get("/tests/categories");
  return res.data;
};

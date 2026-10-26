/**
 * Admin Users/Staff API
 *
 * API functions for staff management.
 * Backend endpoints: /api/users
 */
import api from "../axios";

/**
 * Get all users (paginated, searchable)
 * @param {Object} params - { page, limit, search, isActive }
 */
export const getUsers = (params = {}) =>
  api.get("/users", { params }).then((res) => res.data);

/**
 * Get single user by ID
 * @param {string} id - User ID
 */
export const getUser = (id) =>
  api.get(`/users/${id}`).then((res) => res.data);

/**
 * Create new user/staff
 * @param {Object} data - { name, email, phone, password, role }
 */
export const createUser = (data) =>
  api.post("/users", data).then((res) => res.data);

/**
 * Update user
 * @param {string} id - User ID
 * @param {Object} data - { name, email, phone, role, isActive }
 */
export const updateUser = (id, data) =>
  api.patch(`/users/${id}`, data).then((res) => res.data);

/**
 * Deactivate user (soft delete)
 * @param {string} id - User ID
 */
export const deactivateUser = (id) =>
  api.delete(`/users/${id}`).then((res) => res.data);

/**
 * Reactivate user
 * @param {string} id - User ID
 */
export const reactivateUser = (id) =>
  api.patch(`/users/${id}/reactivate`).then((res) => res.data);

/**
 * Permanently delete user (deactivated users only)
 * @param {string} id - User ID
 */
export const permanentDeleteUser = (id) =>
  api.delete(`/users/${id}/permanent`).then((res) => res.data);

/**
 * Get users eligible to be selected as blog authors
 * (admin, blog_editor, clinic_manager roles, active only)
 */
export const getBlogAuthors = () =>
  api.get("/users/blog-authors").then((res) => res.data);

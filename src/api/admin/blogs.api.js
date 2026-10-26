/**
 * Admin Blogs API
 *
 * API functions for managing blog posts.
 *
 * Endpoints:
 * - GET /blogs - Get all blogs with pagination/filters (admin/blog_editor)
 * - GET /blogs/:id - Get single blog
 * - POST /blogs - Create blog
 * - PATCH /blogs/:id - Update blog
 * - DELETE /blogs/:id - Delete blog
 * - POST /blogs/:id/publish - Publish blog
 * - POST /blogs/:id/unpublish - Unpublish blog
 * - GET /blogs/stats - Blog stats for dashboard widget
 * - POST /blogs/upload-image - Upload a cover/inline image
 */
import api from "../axios";

/**
 * Get all blogs with pagination and filters
 * @param {Object} params - Query parameters (page, limit, status, search)
 * @returns {Promise}
 */
export const getAllBlogs = (params = {}) =>
  api.get("/blogs", { params }).then((res) => res.data);

/**
 * Get single blog by ID
 * @param {string} id - Blog ID
 * @returns {Promise}
 */
export const getBlogById = (id) =>
  api.get(`/blogs/${id}`).then((res) => res.data);

/**
 * Create new blog post
 * @param {Object} data - Blog data
 * @returns {Promise}
 */
export const createBlog = (data) =>
  api.post("/blogs", data).then((res) => res.data);

/**
 * Update blog post
 * @param {string} id - Blog ID
 * @param {Object} data - Updated data
 * @returns {Promise}
 */
export const updateBlog = (id, data) =>
  api.patch(`/blogs/${id}`, data).then((res) => res.data);

/**
 * Delete blog post
 * @param {string} id - Blog ID
 * @returns {Promise}
 */
export const deleteBlog = (id) =>
  api.delete(`/blogs/${id}`).then((res) => res.data);

/**
 * Publish blog post
 * @param {string} id - Blog ID
 * @returns {Promise}
 */
export const publishBlog = (id) =>
  api.post(`/blogs/${id}/publish`).then((res) => res.data);

/**
 * Unpublish blog post (back to draft)
 * @param {string} id - Blog ID
 * @returns {Promise}
 */
export const unpublishBlog = (id) =>
  api.post(`/blogs/${id}/unpublish`).then((res) => res.data);

/**
 * Get blog stats for dashboard widget
 * @returns {Promise}
 */
export const getBlogStats = () => api.get("/blogs/stats").then((res) => res.data);

/**
 * Upload a blog cover/inline image
 * @param {File} file - Image file
 * @returns {Promise}
 */
export const getDistinctAuthorNames = () =>
  api.get("/blogs/author-names").then((res) => res.data);

export const uploadBlogImage = (file) => {
  const formData = new FormData();
  formData.append("image", file);
  return api
    .post("/blogs/upload-image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((res) => res.data);
};

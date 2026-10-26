/**
 * Public Blogs API
 *
 * Public (unauthenticated) endpoints for the blog listing and detail pages.
 */
import api from "./axios";

export const getPublicBlogs = (params = {}) =>
  api.get("/blogs/public", { params }).then((res) => res.data);

export const getPublicBlogBySlug = (slug) =>
  api.get(`/blogs/public/${slug}`).then((res) => res.data);

export const getRelatedBlogs = (id) =>
  api.get(`/blogs/public/${id}/related`).then((res) => res.data);

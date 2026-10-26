import api from "../axios";

/**
 * UPLOADS API
 *
 * Mints a short-lived, SIGNED Cloudinary upload signature so the browser can
 * upload large files (phone camera photos are routinely 3-12MB) straight to
 * Cloudinary, bypassing Vercel's hard ~4.5MB serverless request body limit.
 *
 * The signature is signed server-side with the folder pinned, so a caller
 * cannot redirect uploads elsewhere in the Cloudinary account. Requires an
 * authenticated admin/staff session.
 *
 * @returns {Promise} - { signature, timestamp, folder, apiKey, cloudName, expiresIn }
 */
export const getUploadSignature = () =>
  api.post("/uploads/signature").then((res) => res.data);

export default getUploadSignature;

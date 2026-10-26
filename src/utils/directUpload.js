/**
 * Direct browser -> Cloudinary upload.
 *
 * WHY: the API runs as a Vercel serverless function, which enforces a HARD
 * ~4.5MB request body limit that cannot be raised from application code.
 * Report uploads used to stream the file THROUGH the API, so every byte
 * counted against that ceiling. Phone camera photos are routinely 3-12MB, so
 * they were rejected by the platform before our code ever ran -- while
 * sub-2MB desktop files sailed through. That is the entire "works on desktop,
 * fails on every phone" bug.
 *
 * The limit was also CUMULATIVE: the report endpoint accepts up to 10 files in
 * one request, so even a few mid-size files together could breach it.
 *
 * Now the browser uploads each file straight to Cloudinary with a short-lived
 * signature minted by our backend, and only the resulting metadata (a few
 * hundred bytes) is posted to us. Nothing large touches the function, so
 * neither the per-file nor the cumulative limit applies.
 *
 * Uploads are SIGNED, never unsigned -- an unsigned preset would let anyone on
 * the internet write into the Cloudinary account. The signature is obtained
 * from an authenticated endpoint and pins the folder server-side.
 */
import { getUploadSignature } from "../api/admin/uploads.api";
import { IS_DEMO } from "../demo/flag";

/**
 * Demo build: nothing leaves the browser. Each file is exposed through an
 * object URL (valid for this page session) with simulated progress.
 */
const uploadOneDemo = async (file, onProgress) => {
  for (const pct of [25, 60, 100]) {
    await new Promise((resolve) => setTimeout(resolve, 120));
    onProgress?.(pct);
  }
  const url = URL.createObjectURL(file);
  return {
    url,
    publicId: `demo/${Date.now()}-${file.name}`,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    thumbnailUrl: file.type.startsWith("image/") ? url : undefined,
  };
};

const CLOUDINARY_UPLOAD_URL = (cloudName) =>
  `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;

/**
 * Upload one file directly to Cloudinary.
 *
 * XMLHttpRequest rather than fetch(): fetch has no upload-progress event, and
 * an 8MB upload over mobile data takes real time -- without progress the UI
 * would look hung.
 *
 * @param {File} file
 * @param {object} signature - from getUploadSignature()
 * @param {(percent:number)=>void} [onProgress]
 * @returns {Promise<{url,publicId,fileName,fileSize,fileType,thumbnailUrl}>}
 */
const uploadOne = (file, signature, onProgress) =>
  new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", file);
    form.append("api_key", signature.apiKey);
    form.append("timestamp", signature.timestamp);
    form.append("signature", signature.signature);
    // MUST match the folder that was signed, or Cloudinary rejects the upload.
    form.append("folder", signature.folder);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", CLOUDINARY_UPLOAD_URL(signature.cloudName));

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      let body = null;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        // Surface what actually came back -- a bare "unexpected response"
        // tells whoever is debugging a phone-only failure nothing at all.
        console.error("[directUpload] Non-JSON response", xhr.status, xhr.responseText?.slice(0, 300));
        return reject(
          new Error(`Upload service returned an unreadable response (HTTP ${xhr.status})`)
        );
      }

      if (xhr.status < 200 || xhr.status >= 300) {
        const detail = body?.error?.message || `HTTP ${xhr.status}`;
        console.error("[directUpload] Upload rejected", {
          status: xhr.status,
          detail,
          fileName: file.name,
          fileType: file.type,
          fileSizeMB: (file.size / 1024 / 1024).toFixed(2),
        });
        return reject(new Error(`Upload failed: ${detail}`));
      }

      resolve({
        url: body.secure_url,
        publicId: body.public_id,
        fileName: file.name,
        fileSize: file.size,
        // Cloudinary transcodes HEIC/HEIF on ingest, so report the delivered
        // format rather than the browser's original MIME type.
        fileType: body.resource_type === "image" ? `image/${body.format}` : file.type,
        thumbnailUrl:
          body.resource_type === "image"
            ? body.secure_url.replace("/upload/", "/upload/w_200,h_200,c_thumb/")
            : undefined,
      });
    };

    xhr.onerror = () =>
      reject(new Error("Network error while uploading. Please check your connection."));
    xhr.ontimeout = () => reject(new Error("The upload timed out. Please try again."));

    xhr.send(form);
  });

/**
 * Upload several files directly to Cloudinary, reporting per-file progress.
 *
 * One signature is minted and reused across the batch -- it is valid for a
 * window, not a single use, and re-requesting per file would just add
 * round-trips. Uploads run SEQUENTIALLY: parallel 8MB uploads on mobile data
 * contend for the same narrow uplink, making every file slower and progress
 * meaningless.
 *
 * @param {File[]} files
 * @param {(index:number, percent:number)=>void} [onFileProgress]
 * @returns {Promise<Array>} metadata for each uploaded file, in input order
 */
export const uploadFilesDirect = async (files, onFileProgress) => {
  if (IS_DEMO) {
    const results = [];
    for (let i = 0; i < files.length; i++) {
      results.push(await uploadOneDemo(files[i], (pct) => onFileProgress?.(i, pct)));
    }
    return results;
  }

  // Distinguish a signature failure from an upload failure -- they have very
  // different causes (auth/permissions/server config vs the file or network),
  // and lumping them together makes a report of "upload failed" undiagnosable.
  let data;
  try {
    ({ data } = await getUploadSignature());
  } catch (err) {
    console.error("[directUpload] Could not obtain an upload signature", err?.response?.status, err?.response?.data);
    throw new Error(
      err?.response?.data?.message ||
        "Could not start the upload (could not get authorisation). Please refresh and try again."
    );
  }

  if (!data?.signature || !data?.cloudName || !data?.apiKey) {
    console.error("[directUpload] Signature response missing fields", data);
    throw new Error("Uploads are not configured correctly on the server. Please contact support.");
  }

  const results = [];
  for (let i = 0; i < files.length; i++) {
    // Sequential is deliberate -- see the note above.
    const meta = await uploadOne(files[i], data, (pct) => onFileProgress?.(i, pct));
    results.push(meta);
  }
  return results;
};

export default uploadFilesDirect;

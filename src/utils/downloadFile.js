import api from "../api/axios";
import { IS_DEMO } from "../demo/flag";

async function fetchBlob(url, options) {
  // Demo build: API export URLs are served by the in-browser mock, not the network.
  const apiBase = api.defaults.baseURL || "";
  if (IS_DEMO && apiBase && url.startsWith(apiBase)) {
    const response = await api.get(url.slice(apiBase.length), { responseType: "blob" });
    return response.data;
  }
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
  return response.blob();
}

/**
 * Robust cross-platform file download.
 *
 * iOS Safari often ignores the `download` attribute (and plain
 * window.open navigation) for cross-origin URLs like Cloudinary-hosted
 * files -- it either does nothing or just opens/navigates to the file
 * instead of saving it. Fetching the file into a blob first and triggering
 * the download from an object URL (same-origin, in-memory) is far more
 * reliable across Windows/Android/iOS than relying on the browser to
 * interpret download intent for an external URL.
 *
 * Falls back to opening the URL in a new tab (iOS's native PDF/image
 * viewer has its own Share/Save button -- the standard iOS-friendly
 * fallback) if the fetch/blob approach fails for any reason (CORS,
 * network, etc).
 *
 * @param {string} url - File URL to fetch.
 * @param {string} filename - Suggested filename for the saved file.
 * @param {RequestInit} [options] - Optional extra fetch options (e.g. `headers`
 *   with an Authorization bearer token for authenticated API endpoints like
 *   report/patient exports, as opposed to public Cloudinary URLs).
 */
export async function downloadFile(url, filename = "download", options = {}) {
  if (!url) return;
  try {
    const blob = await fetchBlob(url, options);
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    // There is no real API behind the demo build, so opening the URL would
    // only show a dead page -- let the caller's error toast handle it.
    if (IS_DEMO) throw error;
    window.open(url, "_blank");
  }
}

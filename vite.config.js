import process from "node:process";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Google's public reCAPTCHA v2 test key: works on any domain and always passes.
const RECAPTCHA_TEST_SITE_KEY = "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";

/**
 * Portfolio demo build (`vite --mode demo`): keep the copy from feeding the
 * clinic's real Google Ads account or competing with its site in search.
 */
const demoHtml = () => ({
  name: "demo-html",
  transformIndexHtml(html) {
    return html
      .replace(
        /<!-- Google Ads gtag\.js -->[\s\S]*?<\/script>\s*<script>[\s\S]*?<\/script>/,
        "<script>window.dataLayer = []; window.gtag = function () {};</script>",
      )
      .replace(/<meta name="robots" content="[^"]*" \/>/, '<meta name="robots" content="noindex, nofollow" />')
      .replace(/\s*<link rel="canonical" [^>]*\/>/, "")
      // Checkout is simulated in the demo (src/demo/razorpay.js).
      .replace(/\s*<script src="https:\/\/checkout\.razorpay\.com\/v1\/checkout\.js"><\/script>/, "");
  },
});

/**
 * Every other build: replace the demo entry points with empty stubs so the
 * mock API and its dataset never ship, not even as an unused lazy chunk.
 */
const stripDemo = () => ({
  name: "strip-demo",
  enforce: "pre",
  load(id) {
    const file = id.split("?")[0].replace(/\\/g, "/");
    if (/\/src\/demo\/(index\.js|DemoBanner\.jsx|razorpay\.js)$/.test(file)) {
      return [
        "export default function DemoDisabled() { return null; }",
        "export const demoAdapter = undefined;",
        "export const installDemoRazorpay = () => {};",
      ].join("\n");
    }
  },
});

export default defineConfig(({ mode }) => {
  if (mode === "demo") process.env.VITE_RECAPTCHA_SITE_KEY = RECAPTCHA_TEST_SITE_KEY;

  return {
    plugins: [react(), tailwindcss(), mode === "demo" ? demoHtml() : stripDemo()],
    server: { port: 5174 },
  };
});

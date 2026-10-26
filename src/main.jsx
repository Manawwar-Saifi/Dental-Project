import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { IS_DEMO } from "./demo/flag";

// Portfolio demo build: swap Razorpay Checkout for a simulated dialog.
if (IS_DEMO) {
  import("./demo/razorpay.js").then(({ installDemoRazorpay }) => installDemoRazorpay());
}

/**
 * Global MUI theme — aligns all MUI components with the site theme
 * (navy + orange accent, DM Sans, rounded corners). Replaces MUI's
 * default blue primary so buttons, inputs, tabs, switches, pagination,
 * spinners, etc. render orange across the admin panel automatically.
 */
const muiTheme = createTheme({
  palette: {
    primary: {
      main: "#F57C00",
      dark: "#e06c00",
      light: "#ff9d3f",
      contrastText: "#ffffff",
    },
    secondary: { main: "#0D1B4A" },
  },
  typography: {
    fontFamily: '"DM Sans", sans-serif',
  },
  shape: { borderRadius: 5 },
  components: {
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: "#f9fafb",
          color: "#6b7280",
          fontSize: "0.8125rem",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.03em",
        },
      },
    },
    // Disable MUI's scroll-lock globally for all Modal-based components.
    //
    // Root cause: MUI's Modal (the shared base for Dialog, Popover, Menu, Drawer)
    // adds body.style.overflow='hidden' + body.style.paddingRight=<scrollbarWidth>px
    // whenever any of these open. Since <html> (not <body>) is the scroll container
    // here, the scrollbar never disappears when body.overflow is hidden — but the
    // padding-right is still added, narrowing the content area by ~15px and creating
    // a visible right-side gap on every open/close.
    //
    // disableScrollLock: true prevents MUI from measuring/modifying body padding at
    // all. scrollbar-gutter: stable on <html> (in index.css) acts as belt-and-
    // suspenders: it reserves a permanent gutter so content width never changes even
    // if some other code triggers scroll-lock unexpectedly.
    //
    // Each MUI Modal-based component needs its own entry — theme defaultProps do NOT
    // cascade from MuiModal to its consumers (Dialog, Popover, etc.).
    MuiDialog: {
      defaultProps: {
        disableScrollLock: true,
      },
    },
    MuiPopover: {
      defaultProps: {
        disableScrollLock: true,
      },
    },
    MuiMenu: {
      defaultProps: {
        disableScrollLock: true,
      },
    },
  },
});

// Handle stale chunks after a new deploy — Vite emits vite:preloadError
// when a dynamic import fails to load its JS chunk (usually because Vercel
// replaced the chunk file with a new hash during deployment).
if (typeof window !== "undefined") {
  let hasReloaded = false;
  window.addEventListener("vite:preloadError", () => {
    if (hasReloaded) return;
    hasReloaded = true;
    console.warn("[vite] preload error — new version detected, reloading");
    setTimeout(() => { window.location.reload(); }, 200);
  });

  window.addEventListener("error", (event) => {
    if (hasReloaded) return;
    const msg = event.message || event.error?.message || "";
    if (
      msg.includes("Failed to fetch dynamically imported module") ||
      msg.includes("Loading chunk") ||
      msg.includes("ChunkLoadError")
    ) {
      hasReloaded = true;
      console.warn("[fallback] chunk load error — reloading");
      setTimeout(() => { window.location.reload(); }, 200);
    }
  });

  window.addEventListener("unhandledrejection", (event) => {
    if (hasReloaded) return;
    const msg = event.reason?.message || String(event.reason || "");
    if (
      msg.includes("Failed to fetch dynamically imported module") ||
      msg.includes("Loading chunk") ||
      msg.includes("ChunkLoadError")
    ) {
      hasReloaded = true;
      console.warn("[promise] chunk load error — reloading");
      setTimeout(() => { window.location.reload(); }, 200);
    }
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

createRoot(document.getElementById("root")).render(
  <QueryClientProvider client={queryClient}>
    <ThemeProvider theme={muiTheme}>
      <App />
    </ThemeProvider>
  </QueryClientProvider>,
);
// This code is for all users
window.__TANSTACK_QUERY_CLIENT__ = queryClient;
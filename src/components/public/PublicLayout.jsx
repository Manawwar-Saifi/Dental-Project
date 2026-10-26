/**
 * Public Layout
 *
 * Wraps public pages with header and footer.
 */
import { Outlet, Link } from "react-router-dom";
import { Box } from "@mui/material";
import PublicHeader from "./PublicHeader";
import PublicFooter from "./PublicFooter";
import MobileBottomBar from "./MobileBottomBar";
import WhatsAppButton from "./WhatsAppButton";

const PublicLayout = () => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        fontFamily: "'Poppins', sans-serif !important",
        // Reserve space for the fixed mobile/tablet bottom bar so the footer
        // and last section aren't hidden behind it (removed on desktop).
        pb: { xs: "calc(56px + env(safe-area-inset-bottom))", lg: 0 },
      }}
      className="public-layout"
    >
      <PublicHeader />
      <Box sx={{ flexGrow: 1 }}>
        <Outlet />
      </Box>
      <PublicFooter />
      <MobileBottomBar />
      <WhatsAppButton />
      {/* Floating Contact Us — fixed to right edge, vertically centered */}
      <Link
        to="/contact"
        aria-label="Contact us"
        style={{
          position: 'fixed',
          right: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 50,
          backgroundColor: '#0d1b4a',
          color: '#ffffff',
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          padding: '14px 8px',
          borderRadius: '6px 0 0 6px',
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          textDecoration: 'none',
          boxShadow: '-2px 4px 12px rgba(0,0,0,0.25)',
          transition: 'background-color 0.2s ease',
          fontFamily: "'Poppins', sans-serif",
          userSelect: 'none',
        }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#1a2d6d'; }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#0d1b4a'; }}
      >
        Contact Us
      </Link>
    </Box>
  );
};

export default PublicLayout;

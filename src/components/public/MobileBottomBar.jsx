/**
 * Mobile/Tablet Bottom Action Bar
 *
 * Fixed bottom navigation shown on mobile + tablet only (hidden on desktop).
 * Four equal items: Home, Call, WhatsApp, Book. Premium look — calm navy icons
 * + slate labels, with a single muted-gold accent on the active route.
 * Phone/WhatsApp use the shared primary-number source (config/contact).
 */
import { NavLink, useLocation } from "react-router-dom";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import CallRoundedIcon from "@mui/icons-material/CallRounded";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import { PRIMARY_PHONE_TEL, WHATSAPP_URL } from "../../config/contact";
import { GTAG_CONVERSIONS } from "../../utils/gtagConversions";

const fireBookAppointmentConversion = () => {
  if (typeof window.gtag === "function") {
    window.gtag("event", "conversion", { send_to: GTAG_CONVERSIONS.BOOK_APPOINTMENT });
  }
};

const NAVY = "#0C2B4E"; // default icon
const SLATE = "#3E4C5A"; // default label
const GOLD = "#B8860B"; // active accent (icon + label)

const itemClass =
  "flex flex-1 flex-col items-center justify-center gap-1 min-h-[56px] no-underline text-[10.5px] font-medium leading-none transition-colors";
const labelStyle = { letterSpacing: "0.04em" };

const MobileBottomBar = () => {
  const { pathname } = useLocation();
  const isHome = pathname === "/";
  const isBook = pathname.startsWith("/book-appointment");

  return (
    <nav
      aria-label="Quick actions"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white"
      style={{
        paddingBottom: "env(safe-area-inset-bottom)",
        borderTop: "1px solid #E8EAED",
        boxShadow: "0 -2px 12px rgba(12,43,78,0.06)",
      }}
    >
      <div className="flex items-stretch max-w-7xl mx-auto">
        <NavLink to="/" className={itemClass} style={{ color: isHome ? GOLD : SLATE }}>
          <HomeRoundedIcon sx={{ fontSize: 23, color: isHome ? GOLD : NAVY }} />
          <span style={labelStyle}>Home</span>
        </NavLink>

        <a href={PRIMARY_PHONE_TEL} className={itemClass} style={{ color: SLATE }}>
          <CallRoundedIcon sx={{ fontSize: 23, color: NAVY }} />
          <span style={labelStyle}>Call</span>
        </a>

        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={itemClass}
          style={{ color: SLATE }}
        >
          <WhatsAppIcon sx={{ fontSize: 23, color: NAVY }} />
          <span style={labelStyle}>WhatsApp</span>
        </a>

        <NavLink
          to="/book-appointment"
          onClick={fireBookAppointmentConversion}
          className={itemClass}
          style={{ color: isBook ? GOLD : SLATE }}
        >
          <EventAvailableRoundedIcon sx={{ fontSize: 23, color: isBook ? GOLD : NAVY }} />
          <span style={labelStyle}>Book</span>
        </NavLink>
      </div>
    </nav>
  );
};

export default MobileBottomBar;

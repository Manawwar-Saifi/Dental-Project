import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Drawer, Collapse, IconButton } from "@mui/material";
import { useAuthStore } from "../../store/auth.store";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import LoginIcon from "@mui/icons-material/Login";
import logo from "../../../public/dental-clinic-logo.png";
import { GTAG_CONVERSIONS } from "../../utils/gtagConversions";

const fireBookAppointmentConversion = () => {
  if (typeof window.gtag === "function") {
    window.gtag("event", "conversion", { send_to: GTAG_CONVERSIONS.BOOK_APPOINTMENT });
  }
};

const PublicHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // Reuse the existing patient auth store (same Bearer-token auth used elsewhere).
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const patient = useAuthStore((state) => state.patient);
  const logout = useAuthStore((state) => state.logout);
  const [mobileExpanded, setMobileExpanded] = useState({});
  const [showMenu, SetShowMenu] = useState(false);

  const isActive = (path) => location.pathname === path;
  const isActiveRoute = (path) => location.pathname.startsWith(path);

  const handleMenuClick = () => {
    SetShowMenu(true);
  };

  const handleCrossClick = () => {
    SetShowMenu(false);
  };

  // Close the mobile drawer (and collapse any expanded submenu) after a
  // nav link is tapped, so navigating from the menu also dismisses it.
  const closeMobileMenu = () => {
    SetShowMenu(false);
    setMobileExpanded({});
  };

  return (
    <>
      {/* Top Bar (hidden on phones, shown tablet and up) */}
      <div className="hidden md:block bg-[#0D1B4A] text-white py-2 text-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-white">
                <PhoneIcon className="text-[16px]!" />
                <span className="text-[13px]! flex items-center gap-1">
                  <a
                    href="tel:+918708362763"
                    className="text-white no-underline cursor-pointer hover:text-gray-200 transition-colors"
                  >
                    +91 8708362763
                  </a>
                  <span className="text-gray-400">|</span>
                  <a
                    href="tel:+919467776028"
                    className="text-white no-underline cursor-pointer hover:text-gray-200 transition-colors"
                  >
                    +91 9467776028
                  </a>
                </span>
              </div>
              <NavLink
                to="mailto:contact@dentalclinic.example.com"
                className="flex items-center gap-1 text-white no-underline cursor-pointer hover:text-gray-200 transition-colors"
              >
                <EmailIcon className="text-[16px]!" />
                <span className="text-[13px]!">
                  contact@dentalclinic.example.com
                </span>
              </NavLink>
            </div>
            <div className="hidden md:flex items-center gap-4">
              {/* <NavLink
                to="/book-appointment"
                className={({ isActive }) =>
                  `text-sm cursor-pointer no-underline transition-colors ${
                    isActive ? "text-[#0196da]" : "text-black text-gray-200"
                  }`
                }
              >
                Sign up
              </NavLink> */}
              <span className="text-white/40">|</span>
              <NavLink
                to="/login"
                className="flex items-center gap-1 text-white no-underline text-sm cursor-pointer hover:text-gray-200 transition-colors"
              >
                <LoginIcon className="text-[16px]!" /> Login
              </NavLink>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className={`sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100`}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16">
          <div className="flex items-center justify-between min-h-17.5">
            {/* Logo */}
            <NavLink
              to="/"
              className="flex items-center no-underline mr-6 cursor-pointer shrink-0"
            >
              <img
                src={logo}
                alt="Dental Clinic"
                className="h-12 sm:h-14 lg:h-12 w-auto object-contain"
              />
              {/* Desktop name — unchanged */}
              <div className="hidden lg:block ml-2">
                <span
                  className="block font-extrabold text-[#0D1B4A] leading-tight text-[20px]"
                  style={{ fontWeight: 800 }}
                >
                  DENTAL CLINIC
                </span>
                <span
                  className="block text-gray-400 text-[11px]"
                  style={{
                    fontWeight: 400,
                    letterSpacing: "0.08em",
                  }}
                >
                  CARING FOR YOUR SMILE
                </span>
              </div>
              {/* Mobile/tablet name — two-line lockup beside the larger logo.
                  "DENTAL" is tracked wider so its width lines up with the
                  "CLINIC" line below, like a proper logo lockup. */}
              <div className="lg:hidden ml-2 leading-tight">
                <span
                  className="block font-bold text-[#0D1B4A] leading-none text-[18px] sm:text-[20px]"
                  style={{ letterSpacing: "0.2em" }}
                >
                  DENTAL
                </span>
                <span
                  className="block font-medium text-gray-500 leading-none mt-0.5 text-[10px] sm:text-[11px]"
                  style={{ letterSpacing: "0.2em" }}
                >
                  CLINIC
                </span>
              </div>
            </NavLink>

            {/* Desktop Nav */}
            <div
              className={`lg:flex ml-auto mr-6 items-center main-navbar ${showMenu ? "showMenuWithTransition" : ""}`}
            >
              <nav className="navdiv ">
                <img src={logo} alt="logo" />
                <ul className="lg:flex items-center gap-1.5">
                  <li>
                    {" "}
                    <NavLink
                      to="/"
                      onClick={closeMobileMenu}
                      className={`navItems ${isActive("/") ? "active-nav" : ""}`}
                    >
                      Home
                    </NavLink>
                  </li>
                  <li>
                    <div
                      className={`flex items-center gap-0.5 navItems ${mobileExpanded.treatments ? "mobile-open" : ""} ${isActiveRoute("/treatments") ? "active-nav" : ""}`}
                      onClick={() =>
                        setMobileExpanded((prev) => ({
                          ...prev,
                          treatments: !prev.treatments,
                        }))
                      }
                    >
                      Treatments{" "}
                      <ExpandMoreIcon className="text-[18px]! iconsDD" />
                      <div className="dropdown-nav">
                        <ul
                          onClick={closeMobileMenu}
                          className="lg:!grid lg:!grid-cols-2 lg:!gap-x-2 lg:!w-auto lg:!min-w-[520px] lg:!max-w-[90vw] lg:!p-4 lg:!rounded-xl lg:[&_a]:!whitespace-nowrap lg:[&_a]:!text-[13px]"
                        >
                          <li>
                            <NavLink to="/treatments/dental-implant">
                              Dental Implant
                            </NavLink>
                          </li>
                          <li>
                            <NavLink to="/treatments/root-canal-treatment-rct">
                              Root Canal Treatment Rct
                            </NavLink>
                          </li>
                          <li>
                            <NavLink to="/treatments/wisdom-teeth">
                              Wisdom Teeth
                            </NavLink>
                          </li>
                          <li>
                            <NavLink to="/treatments/clear-aligners">
                              Clear Aligners
                            </NavLink>
                          </li>
                          <li>
                            <NavLink to="/treatments/cosmatic-dental-bonding">
                              Cosmatic Dental Bonding
                            </NavLink>
                          </li>
                          <li>
                            <NavLink to="/treatments/laser-dentistry">
                              Laser Dentistry
                            </NavLink>
                          </li>
                          <li>
                            <NavLink to="/treatments/kids-dentistry">
                              Kids Dentistry
                            </NavLink>
                          </li>
                          <li>
                            <NavLink to="/treatments/dental-crowns-and-bridges">
                              Dental Crowns And Bridges
                            </NavLink>
                          </li>
                          <li>
                            <NavLink to="/treatments/gum-disease-treatment">
                              Gum Disease Treatment
                            </NavLink>
                          </li>
                          <li>
                            <NavLink to="/treatments/dental-filling">
                              Dental Filling
                            </NavLink>
                          </li>
                          <li>
                            <NavLink to="/treatments/dentures">
                              Dentures
                            </NavLink>
                          </li>
                          <li>
                            <NavLink to="/treatments/teeth-whitening">
                              Teeth Whitening
                            </NavLink>
                          </li>
                          <li>
                            <NavLink to="/treatments/mouth-ulcers">
                              Mouth Ulcers
                            </NavLink>
                          </li>
                          <li>
                            <NavLink to="/treatments/braces">Braces</NavLink>
                          </li>
                          <li>
                            <NavLink to="/treatments/smile-makeover">
                              Smile Makeover
                            </NavLink>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </li>
                  <li>
                    <div
                      className={`flex items-center gap-0.5 navItems ${mobileExpanded.appointments ? "mobile-open" : ""} ${isActiveRoute("/book-appointment") ? "active-nav" : ""}`}
                      onClick={() =>
                        setMobileExpanded((prev) => ({
                          ...prev,
                          appointments: !prev.appointments,
                        }))
                      }
                    >
                      Appointments{" "}
                      <ExpandMoreIcon className="text-[18px]! iconsDD" />
                      <div className="dropdown-nav">
                        <ul onClick={closeMobileMenu}>
                          <li>
                            <NavLink to="/book-appointment" onClick={fireBookAppointmentConversion}>
                              Book Appointment
                            </NavLink>
                          </li>
                          <li>
                            <NavLink to="/login">Track Appointment</NavLink>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </li>
                  <li>
                    {" "}
                    <NavLink
                      to="/membership-plans"
                      onClick={closeMobileMenu}
                      className={`flex items-center gap-0.5 navItems ${isActive("/membership-plans") ? "active-nav" : ""}`}
                    >
                      Membership Plan{" "}
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/contact"
                      onClick={closeMobileMenu}
                      className={`navItems ${isActive("/contact") ? "active-nav" : ""}`}
                    >
                      Contacts
                    </NavLink>
                  </li>
                </ul>

                {/* Auth actions — mobile drawer only (desktop has Login in the
                    top bar). Reflects the patient auth state. */}
                <div className="lg:hidden mt-4 pt-4 px-2.5 border-t border-gray-200">
                  {isAuthenticated ? (
                    <>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-[#0D1B4A] text-white font-semibold text-sm shrink-0">
                          {patient?.name?.[0]?.toUpperCase() || "P"}
                        </div>
                        <span className="text-[#0D1B4A] font-semibold text-[15px] truncate">
                          {patient?.name || "My Account"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          closeMobileMenu();
                          navigate("/dashboard");
                        }}
                        className="block w-full text-center bg-[#F57C00] text-white rounded-full font-semibold text-[15px] py-2.5 mb-2.5 cursor-pointer hover:bg-[#E06C00] transition-colors"
                      >
                        Dashboard
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          closeMobileMenu();
                          logout();
                          navigate("/");
                        }}
                        className="block w-full text-center bg-transparent text-[#0D1B4A] border border-gray-300 rounded-full font-semibold text-[15px] py-2.5 cursor-pointer hover:bg-gray-50 hover:border-gray-400 transition-colors"
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        closeMobileMenu();
                        navigate("/login");
                      }}
                      className="flex items-center justify-center gap-1.5 w-full bg-[#F57C00] text-white rounded-full font-semibold text-[15px] py-2.5 cursor-pointer hover:bg-[#E06C00] transition-colors"
                    >
                      <LoginIcon className="text-[18px]!" /> Login
                    </button>
                  )}
                </div>
              </nav>
              <div>
                <CloseIcon
                  onClick={handleCrossClick}
                  className="cursor-pointer close-icon crossIcon"
                />
              </div>
            </div>

            {/* Book Appointment CTA */}
            <NavLink
              to="/book-appointment"
              onClick={fireBookAppointmentConversion}
              className="hidden lg:inline-flex items-center bg-[#F57C00] text-white rounded-full font-semibold text-[15px] tracking-wide px-6 py-2.5 no-underline cursor-pointer shrink-0 shadow-sm hover:bg-[#E06C00] hover:shadow-md transition-all duration-200"
            >
              Book Appointment
            </NavLink>

            {/* Book Now removed on mobile/tablet — it now lives in the fixed
                bottom action bar (see MobileBottomBar). */}

            <div className="menuIcon">
              {" "}
              <MenuIcon onClick={handleMenuClick} />
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
    </>
  );
};

export default PublicHeader;

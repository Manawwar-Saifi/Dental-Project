import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import meta from "./data/_meta.json";

const DEFAULT_PASSWORD = "Demo@123";

/**
 * Floating "portfolio demo" badge with the demo login details. Opens by
 * itself on the login pages so visitors know how to get in.
 */
const DemoBanner = () => {
  const { pathname } = useLocation();
  const onLoginPage = pathname === "/login" || pathname === "/admin/login";
  // null until the visitor toggles it; until then it is open only on login pages.
  const [userOpen, setOpen] = useState(null);
  const open = userOpen ?? onLoginPage;

  const accounts = meta.demoAccounts || {};
  const admin = accounts.admin || { email: "admin@example.com", password: DEFAULT_PASSWORD };
  const patient = accounts.patient || { phone: "9876543210", password: DEFAULT_PASSWORD, otp: "123456" };
  const staff = Object.entries(accounts)
    .filter(([key, value]) => key !== "admin" && key !== "patient" && value?.email)
    .map(([key, value]) => ({ role: value.role || key, email: value.email }));

  return (
    <div className="fixed left-3 bottom-20 lg:bottom-4 z-[10000] max-w-[calc(100vw-24px)] font-['DM_Sans',sans-serif]">
      {open ? (
        <div className="w-80 max-w-full rounded-lg border border-orange-200 bg-white p-4 text-sm text-gray-700 shadow-xl">
          <div className="mb-2 flex items-start justify-between gap-3">
            <p className="font-semibold text-[#0D1B4A]">Portfolio demo</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="-mr-1 -mt-1 rounded px-1.5 text-lg leading-none text-gray-400 hover:text-gray-700"
              aria-label="Hide demo info"
            >
              ×
            </button>
          </div>
          <p className="mb-3 text-xs leading-relaxed text-gray-500">
            Every patient, appointment and payment here is fictional and lives only in your
            browser. Changes reset when you refresh the page.
          </p>

          <div className="mb-3 rounded-md bg-orange-50 p-2.5">
            <div className="mb-1 flex items-center justify-between">
              <span className="font-medium text-[#0D1B4A]">Admin panel</span>
              <Link to="/admin/login" className="text-xs font-medium text-[#F57C00] hover:underline">
                Open →
              </Link>
            </div>
            <p className="text-xs">
              {admin.email} · {admin.password || DEFAULT_PASSWORD}
            </p>
            {staff.length > 0 && (
              <p className="mt-1 text-[11px] text-gray-500">
                Other roles: {staff.map((s) => s.email).join(", ")} (same password)
              </p>
            )}
          </div>

          <div className="rounded-md bg-slate-50 p-2.5">
            <div className="mb-1 flex items-center justify-between">
              <span className="font-medium text-[#0D1B4A]">Patient portal</span>
              <Link to="/login" className="text-xs font-medium text-[#F57C00] hover:underline">
                Open →
              </Link>
            </div>
            <p className="text-xs">
              Phone {patient.phone} · OTP {patient.otp || "123456"}
            </p>
            <p className="text-xs">or password {patient.password || DEFAULT_PASSWORD}</p>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-full bg-[#0D1B4A] px-3.5 py-2 text-xs font-medium text-white shadow-lg hover:bg-[#162a6b]"
        >
          <span className="h-2 w-2 rounded-full bg-[#F57C00]" />
          Demo · fictional data
        </button>
      )}
    </div>
  );
};

export default DemoBanner;

import {
  createRoutesFromElements,
  createBrowserRouter,
  RouterProvider,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import { ToastContainer } from "react-toastify";
import Loading from "./components/Loading";
import ProtectedRoute from "./components/ProtectedRoute";
import UserLayout from "./components/UserLayout";
import AdminProtectedRoute from "./components/admin/AdminProtectedRoute";
import AdminLayout from "./components/admin/AdminLayout";
import { IS_DEMO } from "./demo/flag";

// Patient Auth pages
const Login = lazy(() => import("./pages/auth/Login"));
const VerifyOtp = lazy(() => import("./pages/auth/VerifyOtp"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));

// Patient pages
const Dashboard = lazy(() => import("./pages/patient/Dashboard"));
const Appointments = lazy(() => import("./pages/patient/Appointments"));
const AppointmentDetail = lazy(() => import("./pages/patient/AppointmentDetail"));
const Payments = lazy(() => import("./pages/patient/Payments"));
const Invoices = lazy(() => import("./pages/patient/Invoices"));
const Reports = lazy(() => import("./pages/patient/Reports"));
const Treatments = lazy(() => import("./pages/patient/Treatments"));
const Membership = lazy(() => import("./pages/patient/Membership"));
const Profile = lazy(() => import("./pages/patient/Profile"));
const PatientNotifications = lazy(() => import("./pages/patient/Notifications"));
const BookAppointment = lazy(() => import("./pages/patient/BookAppointment"));

// Public standalone pages
// const MembershipPlans = lazy(() => import("./pages/patient/MembershipPlans"));

// Public pages
const PublicLayout = lazy(() => import("./components/public/PublicLayout"));
const HomePage = lazy(() => import("./pages/public/HomePage"));
const SonipatPage = lazy(() => import("./pages/public/SonipatPage"));
const ContactPage = lazy(() => import("./pages/public/ContactPage"));
const TreatmentsPage = lazy(() => import("./pages/public/TreatmentsPage"));
const TreatmentPage = lazy(() => import("./pages/public/TreatmentPage"));
const BlogListPage = lazy(() => import("./pages/public/BlogListPage"));
const BlogDetailPage = lazy(() => import("./pages/public/BlogDetailPage"));
const PlansPage = lazy(() => import("./pages/public/PlansPage"));
const PlanDetailPage = lazy(() => import("./pages/public/PlanDetailPage"));
const TermsPage = lazy(() => import("./pages/public/TermsPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/public/PrivacyPolicyPage"));
const RefundPolicyPage = lazy(() => import("./pages/public/RefundPolicyPage"));
const BookAppointmentPage = lazy(() => import("./pages/public/BookAppointmentPage"));
const DoctorProfilePage = lazy(() => import("./pages/public/DoctorProfilePage"));
const DoctorProfile = lazy(() => import("./pages/public/DoctorProfile"));
const DoctorProfileAjayKaushik = lazy(() => import("./pages/public/DoctorProfileAjayKaushik"));
const DoctorProfileAashishSonik = lazy(() => import("./pages/public/DoctorProfileAashishSonik"));

// Admin pages
const AdminLogin = lazy(() => import("./pages/admin/Login"));
const AdminResetPassword = lazy(() => import("./pages/admin/ResetPassword"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminPatients = lazy(() => import("./pages/admin/Patients"));
const AdminAppointments = lazy(() => import("./pages/admin/Appointments"));
const AdminTreatments = lazy(() => import("./pages/admin/Treatments"));
const AdminTests = lazy(() => import("./pages/admin/Tests"));
const AdminLab = lazy(() => import("./pages/admin/Lab"));
const AdminPayments = lazy(() => import("./pages/admin/Payments"));
const AdminReports = lazy(() => import("./pages/admin/Reports"));
const AdminMemberships = lazy(() => import("./pages/admin/Memberships"));
const AdminClinics = lazy(() => import("./pages/admin/Clinics"));
const AdminSettings = lazy(() => import("./pages/admin/Settings"));
const AdminPermissionManager = lazy(() => import("./pages/admin/PermissionManager"));
const AdminBilling = lazy(() => import("./pages/admin/Billing"));
const AdminNotifications = lazy(() => import("./pages/admin/Notifications"));
const AdminUsers = lazy(() => import("./pages/admin/User"));
const AdminEnquiries = lazy(() => import("./pages/admin/Enquiries"));
const AdminBlogs = lazy(() => import("./pages/admin/Blogs"));
const AdminBlogEditor = lazy(() => import("./pages/admin/BlogEditor"));
const AdminExpenses = lazy(() => import("./pages/admin/Expenses"));

/**
 * App Routes
 *
 * Public standalone pages:
 * - /login - Patient phone number input
 * - /verify-otp - OTP verification
 * - /book-appointment - Book appointment (no login required)
 *
 * Patient Protected routes (require authentication):
 * - /dashboard - Patient dashboard (default)
 * - /appointments - View appointments
 * - /payments - Payment history
 * - /reports - Medical reports
 * - /treatments - Treatment history
 * - /membership - Patient's membership status
 * - /membership-plans - Buy membership plans (requires login for Razorpay payment)
 * - /profile - View/edit profile
 *
 * Admin Public routes:
 * - /admin/login - Admin email/password login
 *
 * Admin Protected routes (require admin authentication):
 * - /admin/dashboard - Admin dashboard
 * - /admin/patients - Manage patients
 * - /admin/appointments - Manage appointments
 * - /admin/treatments - Manage treatments
 * - /admin/tests - Manage tests
 * - /admin/payments - View payments
 * - /admin/reports - View reports
 * - /admin/memberships - Manage memberships
 * - /admin/clinics - Manage clinics
 * - /admin/settings - Admin settings
 */
/**
 * Scrolls the window to the top on every route change so new pages always
 * open at the top (e.g. treatment links no longer land mid/bottom of page).
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// Portfolio demo build only (see src/demo): floating badge with demo logins.
const DemoBanner = IS_DEMO ? lazy(() => import("./demo/DemoBanner")) : null;

// Root layout: mounts ScrollToTop once for the whole app, then renders routes.
const RootLayout = () => (
  <>
    <ScrollToTop />
    {DemoBanner && (
      <Suspense fallback={null}>
        <DemoBanner />
      </Suspense>
    )}
    <Outlet />
  </>
);

const App = () => {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route element={<RootLayout />}>
        {/* ======================== */}
        {/* PUBLIC WEBSITE ROUTES */}
        {/* ======================== */}
        <Route element={<PublicLayout />}>
          <Route path="/" index element={<HomePage />} />
          <Route path="/dentist-in-sonipat" element={<SonipatPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/treatments" element={<TreatmentsPage />} />
          <Route path="/treatments/:slug" element={<TreatmentPage />} />
          <Route path="/blog" element={<BlogListPage />} />
          <Route path="/blog/:slug" element={<BlogDetailPage />} />
          <Route path="/book-appointment" element={<BookAppointmentPage />} />
          <Route path="/membership-plans" element={<PlansPage />} />
          <Route path="/membership-plans/:id" element={<PlanDetailPage />} />
          <Route path="/doctors/ujjwal-prem" element={<DoctorProfile />} />
          <Route path="/doctors/ajay-kaushik" element={<DoctorProfileAjayKaushik />} />
          <Route path="/doctors/aashish-sonik" element={<DoctorProfileAashishSonik />} />
          <Route path="/doctors/dr-ujjwal-prem" element={<Navigate to="/doctors/ujjwal-prem" replace />} />
          <Route path="/doctors/dr-ajay-kaushik" element={<Navigate to="/doctors/ajay-kaushik" replace />} />
          <Route path="/doctors/dr-aashish-sonik" element={<Navigate to="/doctors/aashish-sonik" replace />} />
          <Route path="/doctors/:slug" element={<DoctorProfilePage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/refund-policy" element={<RefundPolicyPage />} />
        </Route>

        {/* ======================== */}
        {/* PATIENT ROUTES */}
        {/* ======================== */}

        {/* Patient Auth routes (standalone pages) */}
        <Route path="/login" element={<Login />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Patient Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<UserLayout />}>

            {/* Patient pages */}
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="appointments/:id" element={<AppointmentDetail />} />
            <Route path="payments" element={<Payments />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="reports" element={<Reports />} />
            <Route path="my-treatments" element={<Treatments />} />
            <Route path="membership" element={<Membership />} />
            {/* <Route path="membership-plans" element={<MembershipPlans />} /> */}
            <Route path="profile" element={<Profile />} />
            <Route path="notifications" element={<PatientNotifications />} />
          </Route>
        </Route>

        {/* ======================== */}
        {/* ADMIN ROUTES */}
        {/* ======================== */}

        {/* Admin Public route - Login */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Admin Public route - Reset Password (from emailed reset link) */}
        <Route path="/admin/reset-password" element={<AdminResetPassword />} />

        {/* Admin Protected routes */}
        <Route element={<AdminProtectedRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            {/* Redirect /admin to /admin/dashboard */}
            <Route index element={<Navigate to="/admin/dashboard" replace />} />

            {/* Admin pages */}
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="patients" element={<AdminPatients />} />
            <Route path="enquiries" element={<AdminEnquiries />} />
            <Route path="appointments" element={<AdminAppointments />} />
            <Route path="treatments" element={<AdminTreatments />} />
            <Route path="tests" element={<AdminTests />} />
            <Route path="lab" element={<AdminLab />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="billing" element={<AdminBilling />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="memberships" element={<AdminMemberships />} />
            <Route path="blogs" element={<AdminBlogs />} />
            <Route path="blogs/new" element={<AdminBlogEditor />} />
            <Route path="blogs/:id/edit" element={<AdminBlogEditor />} />
            <Route path="clinics" element={<AdminClinics />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="permissions" element={<AdminPermissionManager />} />
            <Route path="expenses" element={<AdminExpenses />} />
          </Route>
        </Route>

        {/* Catch all - redirect to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    )
  );

  return (
    <Suspense fallback={<Loading />}>
      <RouterProvider router={router} />
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        draggable
        pauseOnHover
        theme="colored"
        ariaLabel="Notifications"
      />
    </Suspense>
  );
};

export default App;

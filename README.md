# Dental Clinic CMS - Frontend

A modern dental clinic management system built with React, MUI, and TailwindCSS.

## Production

| | URL |
|---|---|
| **Frontend (Vercel)** | `https://dentalclinic.example.com` |
| **Backend (Vercel)** | `https://your-backend.example.com` |

**Vercel environment variable required (frontend project):**
```
VITE_API_URL=https://your-backend.example.com/api
```
Without this, `axios.js` falls back to `http://localhost:5000/api` and all API calls fail on production.

## Tech Stack

- **React 19.2** - UI Library
- **Vite 7.2** - Build Tool
- **MUI v7.3** - Component Library (new Grid syntax with `size` prop)
- **TailwindCSS v4.1** - Utility-first CSS
- **React Query (TanStack) v5.90** - Server state management
- **Zustand v5.0** - Client state management
- **React Router v7.13** - Routing
- **Axios 1.13** - HTTP client
- **Day.js** - Date handling

## Project Structure

```
frontend/src/
├── api/                    # API layer
│   ├── axios.js           # Axios instance configuration
│   ├── auth.api.js        # Authentication API (OTP, login)
│   ├── patient/           # Patient API functions (6 modules)
│   │   ├── appointments.api.js
│   │   ├── memberships.api.js
│   │   ├── patients.api.js
│   │   ├── payments.api.js
│   │   ├── reports.api.js
│   │   └── treatments.api.js
│   └── admin/             # Admin API functions (16 modules)
│       ├── patients.api.js
│       ├── appointments.api.js
│       ├── treatments.api.js
│       ├── tests.api.js
│       ├── clinics.api.js
│       ├── memberships.api.js
│       ├── payments.api.js
│       ├── billing.api.js
│       ├── reports.api.js
│       ├── notifications.api.js
│       ├── enquiries.api.js
│       ├── users.api.js
│       ├── settings.api.js
│       └── dashboard.api.js
│
├── hooks/                  # React Query hooks
│   ├── patient/            # 6 patient hooks
│   │   ├── useMyAppointments.js
│   │   ├── useMyPayments.js
│   │   ├── useMyReports.js
│   │   ├── useMyTreatments.js
│   │   ├── useMemberships.js
│   │   └── usePatients.js
│   └── admin/              # 16 admin hooks
│       ├── useAdminAuth.js
│       ├── usePatients.js
│       ├── useAppointments.js
│       ├── useTreatments.js
│       ├── useTests.js
│       ├── useClinics.js
│       ├── useMemberships.js
│       ├── usePayments.js
│       ├── useBilling.js
│       ├── useReports.js
│       ├── useNotifications.js
│       ├── useEnquiries.js
│       ├── useUsers.js
│       ├── useSettings.js
│       └── useDashboard.js
│
├── components/
│   ├── common/            # Shared components
│   │   ├── DataTable.jsx  # Reusable data table with search, filter, pagination
│   │   └── DeleteConfirmModal.jsx  # Soft delete confirmation
│   │
│   ├── admin/
│   │   ├── AdminHeader.jsx    # Header with notification dropdown
│   │   ├── AdminSidebar.jsx   # Navigation sidebar
│   │   └── modals/        # Admin modal components (28+)
│           ├── PatientDetailModal.jsx
│           ├── AddPatientModal.jsx
│           ├── EditPatientModal.jsx
│           ├── AppointmentDetailModal.jsx
│           ├── AddAppointmentModal.jsx
│           ├── EditAppointmentModal.jsx
│           ├── CancelAppointmentModal.jsx
│           ├── TreatmentDetailModal.jsx
│           ├── AddTreatmentModal.jsx
│           ├── EditTreatmentModal.jsx
│           ├── TestDetailModal.jsx
│           ├── AddTestModal.jsx
│           ├── EditTestModal.jsx
│           ├── ClinicDetailModal.jsx
│           ├── AddClinicModal.jsx
│           ├── EditClinicModal.jsx
│           ├── MembershipDetailModal.jsx
│           ├── AddMembershipModal.jsx
│           ├── EditMembershipModal.jsx
│           ├── AddPaymentModal.jsx
│           ├── PaymentDetailModal.jsx
│           ├── RecordPaymentModal.jsx
│           ├── AddReportModal.jsx
│           ├── EditReportModal.jsx
│           ├── CreateInvoiceModal.jsx     # Invoice with line items
│           ├── InvoiceDetailModal.jsx     # Invoice actions
│           ├── SendNotificationModal.jsx  # Send/bulk notifications
│           ├── AddUserModal.jsx           # Create staff
│           ├── UserDetailModal.jsx        # Edit/deactivate staff
│           └── EnquiryDetailModal.jsx     # Lead detail + actions
│
├── pages/
│   ├── auth/              # Authentication pages
│   │   ├── Login.jsx      # Email OTP login (patient) / Email+Password (admin)
│   │   └── VerifyOtp.jsx  # OTP verification page
│   │
│   ├── admin/             # Admin pages (16 total)
│   │   ├── Dashboard.jsx
│   │   ├── Patients.jsx
│   │   ├── Enquiries.jsx      # Lead management
│   │   ├── Appointments.jsx
│   │   ├── Treatments.jsx
│   │   ├── Tests.jsx
│   │   ├── Payments.jsx
│   │   ├── Billing.jsx        # Invoice management
│   │   ├── Reports.jsx
│   │   ├── Memberships.jsx
│   │   ├── Notifications.jsx  # Notification center
│   │   ├── Clinics.jsx
│   │   ├── User.jsx           # Staff management
│   │   ├── Settings.jsx
│   │   └── Login.jsx
│   │
│   └── patient/           # Patient portal pages (9 total)
│       ├── Dashboard.jsx      # Stats from all modules
│       ├── Appointments.jsx   # Upcoming/Past/All tabs
│       ├── BookAppointment.jsx # 4-step booking wizard
│       ├── Payments.jsx       # Payment history + summary
│       ├── Treatments.jsx     # Treatment list + progress
│       ├── Reports.jsx        # Medical reports + download
│       ├── Profile.jsx        # Edit profile with API save
│       ├── Membership.jsx     # Current membership status
│       └── MembershipPlans.jsx # Browse + purchase plans
│
├── store/                 # Zustand stores
│   ├── auth.store.js      # Authentication state (admin/patient, pendingEmail)
│   └── admin.store.js     # Admin-specific state
│
└── App.jsx               # Routes configuration
```

## Admin Dashboard Features

### Notification System
- Real-time notification center with database sync
- Notification bell icon in admin header showing unread count
- Clickable dropdown showing recent notifications
- Auto-refresh every 60 seconds for new notifications
- Mark individual notifications as read
- "Mark all as read" functionality
- Notification types with custom icons:
  - Appointments (blue)
  - Payments (green)
  - Treatments (purple)
  - Tests (purple)
  - Memberships (orange)
  - General notifications (gray)
- Priority indicators (high/urgent) with colored chips
- Time ago formatting (e.g., "2h ago", "Just now")
- Loading states with skeleton placeholders
- Empty state when no notifications

### [2026-07-02] AddPatientModal — Duplicate Phone Bug Fix
**Files:** `components/admin/modals/AddPatientModal.jsx`, `hooks/admin/usePatients.js`

**Root cause (Phase 2 — Chrome autofill hardening):** Even after adding `e.stopPropagation()` and removing `onSettled`, Chrome's autofill heuristic could still inject the submitted phone number into the DataTable search field during React's re-render cycle. Three further guards applied (see below). **Root cause (Phase 1):** Two compounding issues:
1. `createMutation` in `usePatients.js` had `onSettled: () => invalidatePatients()`, which fired on **both success and failure**. A failed create (e.g. duplicate phone) still invalidated and immediately refetched the patients query, triggering a Patients page re-render while the modal's phone input was still focused. This re-render, combined with some browsers' autofill heuristics for `name="phone"` inputs, caused the DataTable's search field to receive the phone number value — calling `handleSearch(phoneNumber)` and filtering the list.
2. API errors were shown via `toast.error()` only (no inline feedback), so the admin had no clear in-form signal, making the behavior visible on re-try.

**Fixes applied:**
- ✅ `handleSubmit` now accepts the `MouseEvent` and immediately calls `e.stopPropagation()` + `e.preventDefault()` — prevents click event from bubbling through the React fiber tree to any ancestor handler.
- ✅ Errors are shown **inline** in the form, not just as a toast:
  - Duplicate phone (409 or message containing "phone"/"already exist") → sets `errors.phone` → shown as red helperText on the phone field
  - Other API errors → sets `errors._form` → shown as an `<Alert severity="error">` at the top of the form
  - All inline errors clear when the user edits any field
- ✅ On **success**: `toast.success("Patient added successfully")` fires, form resets, modal closes, patients list refreshes via `onSuccess` callback.
- ✅ `createMutation.onSettled` removed from `usePatients.js` — `onSuccess` is sufficient for the success case; the list must NOT be refetched on failure.
- ✅ No changes to `Patients.jsx` search/filter logic.

**Phase 2 — Chrome autofill hardening** (`components/common/DataTable.jsx`, `AddPatientModal.jsx`):
- ✅ **FIX 1 — DataTable search: non-standard name** (`DataTable.jsx`): Added `name="search-no-autofill"` to the search TextField's `inputProps`. Chrome's autofill heuristic only injects into inputs with names it recognises as standard form fields (phone, email, etc.); a non-standard name breaks that association. Note: the search TextField is in `DataTable.jsx`, not `Patients.jsx` — the fix is applied at the source.
- ✅ **FIX 2 — AddPatientModal: formKey forces field remount** (`AddPatientModal.jsx`): Added `formKey` state that increments each time `open` becomes `true` (via `useEffect`). The Grid container wrapping all TextFields receives `key={formKey}`, so React unmounts and remounts every input on each modal open, destroying any DOM-level autofill associations Chrome built from the previous session.
- ✅ **FIX 3 — DataTable search: isTrusted guard** (`DataTable.jsx`): `handleSearchChange` now returns early if `!e.isTrusted`. Real keystrokes set `isTrusted = true`; browser-autofill and programmatically dispatched events set it `false` in most browsers. Combined with FIX 1 and FIX 2, this is belt-and-suspenders.

### Patients Management
- View all patients with search and filters
- Click row to view patient details in modal
- **Deep-link to patient profile:** navigating to `/admin/patients?patientId=<mongoId>` auto-opens `PatientDetailModal` for that patient. The param is cleared from the URL when the modal closes (`replace: true`) so refreshing does not re-open it. Used by the Membership Plans page subscriber preview — clicking a subscriber name navigates here with their ID.
- **Enhanced Patient Detail Modal** with 5 tabs:
  - **Overview**: Personal info, medical info, membership, emergency contact
  - **Appointments**: View all appointments with edit button on each row
  - **Treatments**: Treatment history with status and costs
  - **Payments**: Payment summary + history with "Record Payment" button
  - **Reports**: Medical reports list
- **Assign Membership** (`AssignMembershipModal.jsx`) — opened via "+ Assign Membership" button on the Overview tab:
  - Fetches all plans (active + inactive) via `GET /memberships/plans?active=all`.
  - Plans with `discontinued: true` are rendered as **disabled** `MenuItem`s (gray text `#9CA3AF`, MUI `disabled` prop, `opacity: 1` override so they remain legible). They appear in the list so admins know they exist, but cannot be clicked or submitted.
  - Plans with `isActive: false` but `discontinued: false` (temporarily inactive) are labeled "(Inactive)" and remain selectable.
  - The server-side `POST /api/memberships/assign` also rejects `discontinued: true` plans with HTTP 400 — this is the authoritative enforcement; the frontend disable is UX-only.
  - Plan status field names: `isActive` (Boolean, temporary deactivation) and `discontinued` (Boolean, permanent retirement) — both live on the `MembershipPlan` model.
- Add new patient via modal
- Edit patient information
- Soft delete (deactivate) patients

### Appointments Management
- View all appointments with search and filters
- Filter by status (scheduled, confirmed, completed, cancelled)
- Filter by type (regular, emergency, follow-up)
- Add new appointment with patient search (Autocomplete)
- Edit appointment details (clinic shown as read-only)
- Cancel appointment with reason

### Treatment Master
- View all treatment types
- Filter by category and status
- Add new treatment type with pricing
- Edit treatment details
- Soft delete (deactivate) treatments

### Test Master
- View all diagnostic test types
- Filter by category, type (in-house/external), status
- Add new test type
- Edit test details
- Soft delete (deactivate) tests

### Clinics Management
- View all clinic locations
- Add new clinic with:
  - Name, phone number
  - Full address (street, area, city, state, pincode)
  - Active status
- Edit clinic information
- Soft delete (deactivate) clinics

### Membership Plans Management
- View all membership plans with filters (type, tier, status)
- Plan types: Individual, Family
- Plan tiers: Silver, Gold, Platinum
- Add new plan with:
  - Name, code, type, tier
  - Price, duration (months)
  - Discount percentage
  - Max members (for family plans)
  - Features list (dynamic add/remove)
  - Display order
- Edit plan details
- Soft delete (deactivate) plans
- **Active Subscribers column** (`Memberships.jsx`) — shows count of patients currently holding each plan as an **active** membership:
  - "Active" definition matches the `hasMembership` virtual on Patient: `membership.status === "active" AND membership.expiryDate > now`. Expired or cancelled memberships are excluded.
  - Data source: `GET /api/memberships/plans/subscriber-counts` (admin-only, `authProtect`). Single bulk request for all plans — no N+1 queries.
  - Plans with 0 active subscribers show `—` (not 0 or broken empty).
  - Plans with ≥1 subscriber show a clickable purple chip (`N active`). Clicking opens a Popover listing up to 10 patient avatars + names. If there are more than 10, a `+N more` indicator is shown.
  - Each patient row in the Popover is clickable — closes the popover and navigates to `/admin/patients?patientId=<id>`. The Patients page reads this URL param on mount and auto-opens `PatientDetailModal` for that patient. When the modal is closed, the `patientId` param is cleared from the URL (using `replace: true`) so a page refresh does not re-open the modal.
  - **API response shape note:** `getPatient(id)` in `patients.api.js` already unwraps the axios response via `.then((res) => res.data)`. The backend `GET /api/patients/:id` returns `{ success, data: { patient }, message }`, so after unwrapping, `res` in Patients.jsx's `.then()` is the full body — use `res.data.patient` (not `res.data`) to get the patient object for `setSelectedPatient`.
  - The existing "Members" column (`plan.maxMembers`, capacity/family-plan size) is **unchanged** — the new column is additive.
  - Backend: new `getPlanSubscriberCounts` controller function + route registered **before** `GET /plans/:id` to avoid Express route-param conflict.

### Payments Management
- View payment history
- Record new payment from Patient Detail Modal:
  - Payment modes: Cash, UPI, Card, Bank Transfer
  - Payment types: OPD Fee, Consultation, Treatment, Test, Membership, Other
  - Reference/transaction number (for non-cash)
  - Notes
- [2026-06-30] **Redesigned Payment History table** (`Payments.jsx`) — two-tab structure (Paid / Refunded) with shared filter bar:

  **Two tabs** (MUI Tabs, compact 36 px, style matches `PatientDetailModal`):
  - **Paid tab** — queries `GET /api/payments?status=paid`; page resets to 1 on tab switch
  - **Refunded tab** — queries `GET /api/payments?status=refunded`; shows the same 7 base columns plus two extra columns appended before Actions

  **Column structure (7 base columns + Actions, shared by both tabs):**
  | # | Column | Notes |
  |---|---|---|
  | 1 | Receipt No. | `paymentNumber`, monospace green |
  | 2 | Date & Time | `paidAt \|\| createdAt` with time (en-IN locale) |
  | 3 | Patient | Click → `PatientDetailModal` |
  | 4 | Invoice No. | `invoice.invoiceNumber`, click → `InvoiceDetailModal`; `—` when absent (advance/OPD fee) |
  | 5 | Treatment/Service | `treatmentName` wins over `type` label; colour-coded chip |
  | 6 | Amount Paid | Right-aligned, bold green |
  | 7 | Mode | Colour-coded chip (cash/card/upi/razorpay/netbanking/other) |
  | — | Actions | `VisibilityIcon` → `PaymentDetailModal` (always); `PrintIcon` → Download Invoice PDF via `getInvoice(id)` + `downloadInvoicePDF` (when invoice linked); `ReplayIcon` → Process Refund (Paid tab, no `settledInvoices` only); `UndoIcon` → Reverse (when `settledInvoices[]` present) |

  **Refunded tab extra columns** (inserted between Mode and Actions):
  | Column | Source |
  |---|---|
  | Refunded On | `payment.refund.refundedAt` (date, en-IN locale) |
  | Refund Reason | `payment.refund.reason` (truncated + hover tooltip) |

  - Status column intentionally omitted — each tab already conveys the status.
  - **Edit** button intentionally omitted — no `updatePayment` handler exists in the backend.
  - **Cheque** filter intentionally omitted — not a valid `paymentMode` enum value in the schema.
  - Backend `GET /api/payments` already supports any `?status=` value generically — no backend changes needed.
  - Download PDF calls `getInvoice(id)` on demand (the payments list only has partial invoice data); result passed to `downloadInvoicePDF(fullInvoice)`.
  - `InvoiceDetailModal` receives the partially-populated `invoice` object from the payments list API (`invoiceNumber` + `grandTotal`); the modal handles display from there.

  **Export PDF** (`Export PDF` button in Tabs row, right-aligned):
  - Endpoint: `GET /api/payments/export/pdf` — admin-only (`authProtect`). Registered before `/:id` in `payment.routes.js` to avoid route conflict.
  - Accepts the same filter params as the list endpoint: `status`, `paymentMode`, `type`, `from`, `to`. The active tab's `status` is always passed; `search` is NOT passed (backend never implemented it in `getAllPayments`).
  - Filter logic extracted into `buildPaymentQuery()` shared helper in `payment.controller.js` — called by both `getAllPayments` and `exportPaymentsPdf`. Filter logic cannot diverge.
  - PDF format (redesigned 2026-07-01, updated 2026-07-01): PDFKit, no new packages. Logo (`frontend/public/dental-clinic-logo.png`, 55×55pt, top-left) + clinic name 18pt bold navy (`#0D1B4A`) + subtitle 9pt gray to its right. HR divider. Title 13pt bold centered. Filter/export info 9pt gray. Summary stats 10pt bold. Table header row: dark navy `#0D1B4A` background, white 10pt bold text, `ellipsis: true` (prevents any header overflowing into adjacent column). Data rows: 10pt, 22pt height, alternating white/`#F8F8FF`. Thin `#E5E7EB` 0.5pt rules between rows. Footer 8pt gray `#9ca3af` pinned to bottom of last page.
  - **Why `₹` is absent**: Helvetica (WinAnsiEncoding/Windows-1252) does not include Unicode U+20B9 (₹) — it maps to an apostrophe glyph, shifts the x-cursor, and causes adjacent column text to bleed together ("AMOUNTMODE" header, "1Razorpay" data). Column header uses "AMT (Rs.)" (9 chars ≈ 48pt fits in 55pt column). Data rows show plain numbers. "Rs." appears in the summary total line only.
  - **Why column total is 500pt not 515pt**: filling exactly 515pt (usable width) leaves 0pt inter-column gap; text at a boundary bleeds. 500pt total + 15pt right buffer + 2pt PAD per cell ensures no adjacent text ever touches.
  - Dates rendered as "DD Mon YYYY" ("01 Jul 2026") via locale-independent formatter — avoids US-format bug when server locale is not en-IN.
  - Explicit `y` variable tracks row position; never reads `doc.y` or calls `moveDown` — eliminates doc.y cursor-drift column bleed.
  - **Paid tab** PDF: Portrait A4 (595.28 × 841.89 pt), 7 columns totalling 500pt: Receipt No.(85) | Date(65) | Patient(95) | Invoice No.(65) | Service(75) | AMT Rs.(55, right) | Mode(60).
  - **Refunded tab** PDF: Landscape A4 (841.89 × 595.28 pt), 9 columns totalling 762pt: Receipt No.(82) | Date(65) | Patient(100) | Invoice No.(68) | Service(87) | AMT Rs.(57, right) | Mode(60) | Refunded On(80) | Reason(163). Invoice No. retained — `processRefund()` keeps the original invoice link.
  - Capped at 5 000 rows. Page-break: `y + 22 > PAGE_H - 55`; column headers redrawn on continuation pages.
  - Frontend fetches via `axios.get(url, { responseType: "blob" })` — required because the endpoint is auth-protected and cannot be opened as a plain browser URL.
  - **Preview flow (2026-07-01):** clicking "Export PDF" fetches the blob → `createObjectURL` → opens a 90vw × 90vh `Dialog` with an `<iframe src={blobUrl}>` (browser's native PDF viewer). The dialog footer has a green "Download" button (same `<a>` click pattern) and a "Close" button. Closing the dialog calls `URL.revokeObjectURL` to free memory. No immediate download occurs on button click.
  - Button shows `CircularProgress` (14 px) in place of `DownloadIcon` and label changes to "Loading Preview…" while in-flight. On error, shows `Snackbar` with `severity: "error"`.
- [2026-06-30] **Refund / Reverse flow in `PaymentDetailModal`**:
  - **Process Refund** button shown when `payment.status === "paid"` AND the payment has no `settledInvoices` (i.e., it was linked directly to a single invoice). Opens inline form with Amount (partial OK, ≤ original) + Reason. Calls `POST /api/payments/:id/refund`.
    - Amount field: leave blank → full refund; enter value → partial refund. Each payment can only be refunded once.
    - **Client-side validation** (inline, real-time): amount must be > 0 and ≤ `payment.amount`; error shown as red helper text on the field, "Confirm Refund" button disabled while error exists. Uses `slotProps.htmlInput` (MUI v7) not deprecated `inputProps`.
    - **Server-side validation** (`processRefund` controller): rejects `amount ≤ 0` (HTTP 400) and `amount > payment.amount` (HTTP 400). Never trusts client-sent amount as authoritative.
    - For Razorpay payments: backend also calls `razorpay.payments.refund()` before updating the DB.
    - After refund: payment `status` → `"refunded"`, `refund.amount` stored, linked invoice's `amountPaid` reduced and `calculateTotals()` re-run (status/paymentStatus reverts correctly).
    - Patient sees `status: "refunded"` chip in their Payment History.
  - **Reverse Payment** button shown when the payment has `settledInvoices[]` (admin-recorded via Collect Payment / Record Payment). Opens inline form with Reason only (full amount always reversed). Calls `POST /api/payments/admin/reverse-payment`.
    - Restores each invoice to its exact pre-payment `amountPaid` using stored snapshots.
    - Payment `status` → `"reversed"`.
  - Both buttons are mutually exclusive — only one can be visible at a time based on payment type.

### Billing & Invoices Management
- View all invoices with search, filters (status, payment status), and date range
- **5 stat cards** sourced from `GET /api/billing/stats` (`Invoice.getStats()` aggregate):
  | Card | Data field | Color | Click filter |
  |---|---|---|---|
  | Total Invoices | `stats.totalInvoices` | indigo | clears all filters |
  | Total Amount | `stats.totalAmount` (₹) | blue | clears all filters |
  | Total Paid | `stats.totalPaid` (₹) | green | paymentStatus=paid |
  | Balance Due | `stats.totalDue` (₹) | red | paymentStatus=unpaid,partial |
  | OPD Collection | `stats.opdCollection` (₹) | teal | itemType=opd_fee |
- [2026-06-30] "Unpaid Invoices" stat card removed (was displaying `stats.unpaidCount`; backend field preserved). Grid resized to `md:2.4` (5-up, exact 12-column fit).
- [2026-06-30] Stat card toggle-to-clear filter behavior (`Billing.jsx` only):
  - **Total Paid**, **Balance Due**, and **OPD Collection** cards are now togglable: clicking a card filters the table; clicking the **same card again** clears the filter and returns to the full list.
  - Active card shows a **2px `#F57C00` (accent) border** with a faint orange glow — matching the `border-accent` convention used on featured plan cards (`PlansPage`) and active CTA buttons (`Login`). Implemented via MUI `sx` (`borderColor: "#F57C00"`, `borderWidth: 2`).
  - **Total Invoices** and **Total Amount** cards are "show-all" resets (they call `setFilters({})`); they never show an active border.
  - Switching a **Status or Payment dropdown** in CompactFilterBar automatically deactivates any stat-card-driven filter (clears `activeStatCard`) so the card border doesn't stay highlighted after a manual override.
  - The **Refresh icon** (RefreshIcon in CompactFilterBar) only re-fetches data with the current params — it is NOT a clear-filters button and does NOT clear the stat card active state. Toggle-click is the single mechanism for clearing a stat-card filter.
  - No backend changes. No other components touched.
- [2026-06-30] 5th stat card "OPD Collection" added (`stats.opdCollection` — billed OPD revenue; sum of `item.total` for `opd_fee` items). Uses `LocalHospitalIcon` (teal). Click filters table to `itemType=opd_fee` — backend `getAllInvoices` now accepts this param and filters to invoices with at least one `opd_fee` line item.
- [2026-06-30] Invoice table columns completely redesigned (`Billing.jsx`). Old columns (Invoice #, Patient, Date, Items, Total, Paid, Balance, Status, Payment, Preview) replaced with 10 new columns in this order:

  | # | Column | Notes |
  |---|---|---|
  | 1 | Invoice No. | font-mono, indigo-600 |
  | 2 | Date | `invoiceDate`, DataTable `type: "date"` format |
  | 3 | Patient | Linked — clicking opens `PatientDetailModal`; `usePatient(id)` hook fetches full data for modal header |
  | 4 | Treatment | `items[0].description` + "+N more" indicator for multiple items |
  | 5 | Total Amount | `grandTotal` |
  | 6 | Paid | `amountPaid` in green |
  | 7 | Due | `balanceDue` in red when > 0; inline "Collect" button for unpaid/partial invoices |
  | 8 | Payment Status | Single consolidated badge: Overdue=error(red), Paid=success(green), Partial=warning(amber), Unpaid=default-outlined(gray). Priority: `status==="overdue"` first, then paymentStatus |
  | 9 | Due Date | `dueDate` formatted same as Date; text rendered red if `dueDate < now && paymentStatus !== "paid"` |
  | 10 | Action | 4 icon buttons: Print (`downloadInvoicePDF(row)` — download-only via html2pdf.js), View (`InvoicePreviewModal`), Edit (opens `InvoiceDetailModal`; disabled for non-draft invoices), Reminder (`POST /api/notifications/reminder/payment` with `{ invoiceId, patientId }`; disabled for draft/cancelled/paid) |

  The old `statusColors`, `statusLabels`, `paymentStatusColors`, `paymentStatusLabels` objects and the `allColumns` dynamic computation are removed. Column definitions now live inside the component for state-setter access.
- Create new invoice (admin) via modal
- View/edit invoice details, record payments, cancel, delete draft invoices
- Client-side PDF download (html2pdf.js)
- [2026-06-30] `InvoiceDetailModal` purple header chip contrast fixes (both chips — scoped to header only, table-row chips unchanged):
  - **Payment Status chip**: removed `variant="outlined"` (MUI error/warning/success filled colors provide sufficient contrast: red, amber, green on purple). Fix applied 2026-06-30.
  - **Status chip**: replaced MUI `color` prop with explicit `sx` per-status so `default` (draft/cancelled) no longer renders as unreadable light-gray-on-purple. Per-status colors: Draft=`#64748b`, Sent=`#0369a1`, Partially Paid=`#b45309`, Paid=`#15803d`, Overdue=`#9f1239` (deep rose, distinct from payment "Unpaid"'s MUI error red `#d32f2f`), Cancelled=`#374151`. All use white text. Fix applied 2026-06-30.
- [2026-07-01] `PatientDetailModal` blue header **membership chip** contrast fix — same category as InvoiceDetailModal. The membership plan chip (`"Implant Post Care (0% off)"`) used `className="bg-yellow-100 text-yellow-700"` which MUI v7 Chip overrides: Emotion CSS-in-JS wins over Tailwind className, leaving the chip with `rgba(0,0,0,0.08)` background (near-transparent on dark blue) and `rgba(0,0,0,0.87)` text (dark on dark blue — nearly invisible). Fixed with `sx={{ bgcolor: "#fef9c3", color: "#92400e", fontWeight: 500 }}` — solid yellow-100 background with amber-800 text, clearly visible on the blue header. The neighbouring "Active/Inactive" chip uses `color="success"/"error"` which MUI renders as filled green/red — already legible, unchanged.
- [2026-07-01] `MembershipDetailModal` purple header **plan code chip** contrast fix — continuation of the same chip-on-purple pattern. The plan code chip (e.g. "IMP-PC") used `className="bg-white/20 text-white font-mono"` which rendered as a semi-transparent lavender smear on the purple gradient, making the text unreadable. Replaced with `sx={{ bgcolor: "#ffffff", color: "#5b21b6", fontFamily: "monospace", fontSize: "0.7rem" }}` — solid white fill with dark purple text, matching the InvoiceDetailModal solid-`bgcolor`+`color` technique. The neighbouring "Active/Inactive" chip (`color="success"/"default"`) was already legible and is unchanged. Fix is scoped to the header chip only; the `font-mono` code chip in the Memberships table row is unaffected.
- [2026-06-30] Invoice table compact density — brought in line with the established admin table pattern (Appointments, Payments, Lab):
  - `DataTable` gained a backward-compatible `size` prop (default `"medium"`); Billing.jsx passes `size="small"` which reduces MUI TableCell padding from 16px to 6px top/bottom, matching the visual density of a `<Table size="small">`. No other pages affected.
  - Payment Status chip gains `sx={{ fontSize: '11px' }}` matching Appointments' chip sizing.
  - Section spacing tightened: page header `mb-6`→`mb-4`, stats grid `mb-4`→`mb-3`.
  - Column render patterns already matched the established pattern (`variant="body2"`, `Chip size="small"`, `IconButton size="small"`, `<Icon fontSize="small" />`). No changes to column content or logic.
- [2026-06-30] `CreateInvoiceModal` — Qty field removed from line item rows:
  - The **Qty** input has been removed from each line item card. All manually-created line items are now implicitly **quantity 1**.
  - Internal state (`blankItem`) still carries `quantity: 1` so `calcItemTotal` (which reads `item.quantity`) continues to work correctly. The submit payload sends `quantity: 1` for every item via the existing `Number(item.quantity) || 1` expression.
  - **Backend confirmed safe (no changes):** both `createInvoice` (billing.controller.js) and `generateInvoice` (invoice.service.js) already do `const quantity = item.quantity || 1`, so a missing/absent field defaults to 1. The `addInvoiceItem` endpoint (for adding items to existing draft invoices) also does the same and is unaffected.
  - Grid layout updated: Category(xs=6/sm=3) + Description(xs=6/sm=3) + Price(xs=6/sm=3) + Disc%(xs=6/sm=3). Removes the former Qty(xs=4/sm=2) slot; Price and Disc% each widened from sm=2→sm=3 to fill the freed columns.
  - Validation updated: removed the `qty > 0` check (no longer user-controlled); updated toast message accordingly.
- [2026-06-30] `CreateInvoiceModal` — Membership plan quick-fill dropdown:
  - When a line item's **Category** is set to `"Membership"`, a **"Select Plan"** dropdown appears as a second sub-row inside that item card. All existing fields (Description, Qty, Price, Disc %) remain visible and editable at all times — nothing is hidden or replaced.
  - Plans sourced live from `GET /memberships/plans` (active/non-discontinued only) via the existing `getMembershipPlans` in `api/admin/memberships.api.js`. Fetch fires once per modal open; cleanup flag prevents stale-state race if modal closes before fetch resolves. Each option renders `"{plan.name} — ₹{plan.price}"`.
  - Selecting a plan **auto-fills** the row's existing Description field (plan name) and Price field (plan price). Both remain manually editable after auto-fill — admin can still adjust for a custom deal.
  - Switching Category away from Membership hides the plan dropdown and clears the internal `planId` selection. Description and Price are unaffected since they are always-visible editable fields.
  - `planId: ""` added to `blankItem`; `handleItemChange` clears only `planId` on category change (not description/price).
  - **⚠️ Activation gap (not fixed in this task):** submitting a `"Membership"`-category line item through the existing `POST /api/billing/invoices` endpoint creates a billing record but does **not** activate the patient's membership (`patient.membership` is never set, `hasMembership` stays `false`). Membership activation requires a separate call to `POST /api/memberships/assign-manual`. This gap is intentional — membership-endpoint routing is scoped as a separate task.
- [2026-06-30] Payment Reminder popup (`Billing.jsx` only — no new component file):
  - Reminder bell icon (Action column) now opens a compact `xs` Dialog instead of firing directly.
  - Dialog shows: Patient name + phone, Invoice #, Outstanding balance, and an info banner clarifying which channels are functional.
  - Send button calls `POST /api/notifications/reminder/payment` with `{ invoiceId, patientId }` (exact server-required body). Loading spinner during send; success/error via existing snackbar on completion. Dialog blocks close while sending.
  - **Channel status confirmed from source** (2026-06-30): In-app only is functional. `sendEmail` utility exists (`backend/src/utils/email.js`) but `createPaymentReminder` model static does not set `sendEmail: true` — no email sent. SMS (`sendSms: true` is hardcoded) and WhatsApp are stubs (`console.log` only, no provider). The dialog info banner reflects this accurately.
  - **No `reminderSent`/`lastReminderAt` field on Invoice model** — no "last sent" indicator shown. Gap noted for future implementation.
  - No backend files changed. Endpoint is behind `authProtect`, validates both IDs server-side.

### Reports Management
- View all medical reports with search and filters
- Upload new report with file (PDF, images):
  - Patient selection (Autocomplete search)
  - Clinic selection
  - Report title and category (X-Ray, OPG, CBCT, Lab Report, Prescription, etc.)
  - Description and notes
  - Report date
  - Visibility toggle (show/hide from patient)
  - Tags support
  - File upload to Cloudinary (max 10MB)
- Edit report metadata:
  - Update title, description, notes
  - Change visibility to patient
  - Replace uploaded file (auto-deletes old file from Cloudinary)
- Download reports with proper PDF handling
- Delete reports (hard delete - removes from both Cloudinary and database)
- Auto-generated report numbers (REP-XXXXXX)

### Settings Page
Comprehensive admin settings with **five tabs** (Profile, Clinic, Notifications, System, Popup):

> **Note:** "Fees" (OPD/consultation fees) and "Plan Pricing" (dental plan prices) tabs were removed. Their associated state, hooks (`useFeeSettings`, `useFeeSettingsMutations`), and handlers were also removed from `Settings.jsx`.

#### Tab 0 — Profile Settings
- Personal information (name, email, phone)
- Profile picture upload
- Password change functionality
- Account preferences

#### Tab 1 — Clinic Settings
- Clinic name and contact information
- Full address details
- Working hours configuration
- Operating days selection

#### Tab 2 — Notification Preferences
- Email notifications toggle (appointment reminders, payment confirmations, system alerts)
- SMS notifications toggle (appointment reminders, payment confirmations, system alerts)

#### Tab 3 — System Configuration
- Timezone selection
- Currency format (INR, USD, etc.)
- Language preference
- Date format (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD)
- Time format (12-hour, 24-hour)
- Data backup settings

#### Tab 4 — Popup Settings
- Popup content and display configuration

## Patient Portal Features

### Authentication — Two Login Methods

**Method 1 — Email OTP (passwordless):**
- Enter email address → receive 6-digit OTP via email → enter OTP to login
- OTP expires after 10 minutes; resend available
- Route: `POST /api/auth/patient/login` + `POST /api/auth/patient/verify-otp`

**Method 2 — Password login (phone or email + password):**
- Enter phone number (10-digit) or email address + password
- Default password for all admin-created patients: **`account123`**
- Patients created via self-service membership purchase receive a random cryptographic password by email at signup
- Route: `POST /api/auth/patient/login-password`
- Both methods set a `patient_token` cookie and return a JWT

**Password reset:** Patients can use `/forgot-password` — receives an email link valid for 30 minutes. New password must be ≥10 characters with at least one letter and one number.

Protected routes — all patient pages require authentication. Auto-redirect to login if not authenticated.

### My Reports
- View all medical reports uploaded by admin
- Filter by category (X-Ray, OPG, CBCT, Lab Report, Prescription, etc.)
- Download reports as PDFs
- View report details (title, date, description, notes)
- Only visible reports are shown (controlled by admin)

### Book Appointment (`BookAppointment.jsx`) — Membership Free-OPD path
- [2026-07-01] **Phase 1 audit confirmed gap:** Patient self-booking was a 4-step wizard (Clinic & Date → Patient Info → Payment → Confirmation) that always required Razorpay payment regardless of membership status. Members were charged the full OPD fee.
- [2026-07-01] **Fix (Option A — logged-in only bypass):**
  - Computed `isMemberFree = isLoggedIn && !!patient?.hasMembership` from the Zustand auth store (`hasMembership` is included in the login response and persisted).
  - When `isMemberFree` is true, Step 2 "Next" button becomes **"Book for Free"** and triggers `handleFreeBooking()` directly — Razorpay step (Step 3) is skipped entirely.
  - `handleFreeBooking` calls `POST /api/appointments/book-free` (new `patientProtect` endpoint). The backend re-reads membership from DB on every request — the client-supplied `isMemberFree` flag is never trusted server-side.
  - If membership has expired since last login, the backend returns HTTP 403 and the user sees a toast prompting them to refresh and book with payment.
  - A green notice banner appears at the top of Step 2 (Patient Info) for logged-in members: "Your active membership makes OPD consultations free."
  - A purple nudge appears at the top of Step 3 (payment step) for non-logged-in visitors: "Already a member? Log in to skip this payment and book for free."
  - Success screen shows "Free — Membership Benefit" in green instead of "₹0".
  - Anonymous visitors (no login): unchanged — always pay via Razorpay as before.
  - **Backend endpoint:** `POST /api/appointments/book-free` — `patientProtect`, re-verifies `patient.hasMembership` server-side, creates appointment with `isFree: true, opdFeePaid: true, paymentMethod: "free", paymentStatus: "free"`. No Razorpay payment record created. Sends confirmation email with "OPD fee waived — Membership benefit applied" note. See `backend/src/modules/appointments/appointment.controller.js::bookAppointmentFree`.

## MUI Grid v7 Syntax

All components use the new MUI Grid v7 syntax:

```jsx
import Grid from "@mui/material/Grid";

<Grid container spacing={3}>
  <Grid size={{ xs: 12, md: 6 }}>
    {/* Content */}
  </Grid>
</Grid>
```

## TailwindCSS v4 Notes

Using Tailwind v4 syntax:
- Gradients: `bg-linear-to-r` (not `bg-gradient-to-r`)

## API Response Format

All API responses follow this structure:

```javascript
{
  success: true,
  message: "...",
  data: [...],           // Array of items
  pagination: {          // For paginated endpoints
    total: 100,
    page: 1,
    limit: 10,
    pages: 10
  }
}
```

## Data Extraction Pattern

```javascript
// In page components
const { data, isLoading, refetch } = usePatients({ page, limit, search });

// Extract data from response
const patients = data?.data || [];
const pagination = data?.pagination || { total: 0 };
```

## File Upload & Cloudinary Integration

### Medical Reports Upload
- Files are uploaded to Cloudinary for reliable storage
- Supported formats: PDF, JPEG, PNG, GIF, WebP
- Maximum file size: 10MB
- PDFs are uploaded as `resource_type: "image"` to enable download functionality
- Automatic thumbnail generation for image files (200x200)

### Download Mechanism
- Uses Cloudinary's `fl_attachment` flag to force browser downloads
- Prevents corrupted PDF downloads by proper resource type configuration
- Downloads preserve original filenames

### File Operations
- **Upload**: File → Multer (memory storage) → Cloudinary → MongoDB reference
- **Replace**: Delete old file from Cloudinary → Upload new → Update MongoDB
- **Delete**: Hard delete removes file from both Cloudinary and MongoDB database

## UI Conventions

### No Native Browser Dialogs
All `window.alert`, `window.confirm`, and `window.prompt` calls have been removed from the codebase. Replacements:

- **Confirmations (destructive actions)** — use `<ConfirmDialog>` from `components/common/ConfirmDialog.jsx`. Pattern: add `const [xConfirmOpen, setXConfirmOpen] = useState(false)`, set it `true` on button click, pass the action to `onConfirm`. The component blocks the UI safely and only calls `onConfirm` on explicit user click — the delete never fires without a second click, identical to the old `if (window.confirm)` guard.
- **Warnings / info messages** — use `toast.warn(...)` or `toast.error(...)` from `react-toastify`. `ToastContainer` is mounted once in `App.jsx` and covers all routes.
- **Files affected**: `AppointmentDetailModal`, `EnquiryDetailModal`, `InvoiceDetailModal`, `PatientDetailModal`, `PaymentDetailModal` (confirm → ConfirmDialog); `DoctorProfilePage` + 15 treatment pages (reCAPTCHA alert → toast.warn).

## 📝 Recent Updates

### Notification System (Latest)
- ✅ Real-time notification center in admin header
- ✅ Unread count badge with auto-refresh (every 60s)
- ✅ Interactive notification dropdown
- ✅ Mark as read/unread functionality
- ✅ Multiple notification types with custom icons
- ✅ Priority indicators (high/urgent)
- ✅ React Query integration for efficient caching
- ✅ Loading states and empty states

### Email OTP Authentication
- ✅ Passwordless patient login via email OTP
- ✅ OTP request and verification UI
- ✅ Resend OTP functionality
- ✅ Protected routes for patient pages
- ✅ Auto-redirect on authentication failure
- ✅ Clean login/verification flow

### UI/UX Improvements
- ✅ Fixed patient table immediate refresh after add/edit
- ✅ Fixed search field autofill issue with `autoComplete="off"`
- ✅ Improved React Query cache invalidation
- ✅ Better loading states with skeleton placeholders
- ✅ Enhanced error handling and user feedback
- ✅ [2026-06-30, scope extended 2026-06-30] Fixed right-side layout shift / blank-strip gap when any MUI Modal-based component opens (Dialog, Select, Menu, Popover — affects all admin modals and filter dropdowns). **Root cause:** MUI's `useScrollLock` fires whenever any `Modal`-derived component (Dialog, Popover, Menu, Drawer) opens. It measures `window.innerWidth − document.documentElement.clientWidth` (scrollbar width, typically 15px), sets `body.style.overflow='hidden'` and `body.style.paddingRight=15px`. Since `<html>` is the scroll container (not `<body>`), the scrollbar on `<html>` does NOT disappear when body overflow is hidden — but MUI still adds padding-right to body, shrinking content by 15px while the scrollbar stays visible → right-side gap. **Why `scrollbar-gutter: stable` alone doesn't fix it:** `clientWidth` still excludes the stable gutter space, so MUI still measures 15px and still adds the padding additively on top of the gutter — the compensation and the stable gutter both apply. **Correct fix:** (a) `disableScrollLock: true` as a theme `defaultProps` on each MUI Modal-based component — prevents MUI from measuring or modifying body padding at all; (b) `scrollbar-gutter: stable` on `html` in `index.css` as belt-and-suspenders. **Important:** theme `defaultProps` do NOT cascade from `MuiModal` to its consumers — each component needs its own entry. **Files changed:** `frontend/src/main.jsx` — `MuiDialog`, `MuiPopover`, `MuiMenu` each get `defaultProps.disableScrollLock: true`. `MuiPopover` and `MuiMenu` were added in the first pass (fixed dropdowns); `MuiDialog` was the missing entry causing Dialog modals to still show the gap.

### Payment Management
- ✅ Date range filtering for payments
- ✅ Payment statistics and reports
- ✅ Better payment modals with validation

### [2026-07-02] Patient Portal — Dashboard Improvements
**File:** `pages/patient/Dashboard.jsx`

- ✅ **Quick Actions block moved to top** — now appears before the Welcome Section and stats cards, wrapped in its own `<Grid container spacing={3} sx={{ mb: 3 }}>`. Gives patients immediate access to key actions on page load
- ✅ **Button label updated** — "Book Appointment" → "Book Appointment / Treatment" (first Quick Actions button only; no other changes to the section)
- ✅ **Membership plans display** — the "Your Membership" card now also shows all available active clinic plans below the patient's own plan state:
  - Uses existing `useMembershipPlans` hook (calls public `GET /api/memberships/plans`, no auth required, returns only `isActive: true, discontinued: false` plans)
  - Plans rendered in a 3-column grid (`xs: 12 / sm: 6 / md: 4`) showing plan name, discount %, and price/duration
  - Patient's current active plan highlighted with orange border + "Your Plan" chip badge
  - "View All →" button links to `/membership-plans` for full plan details
  - No Razorpay/self-purchase flow — display only

### [2026-07-02] Patient Portal — Payment History Page Rewrite
**File:** `pages/patient/Payments.jsx`

- ✅ **Data source switched** — from the Payment collection (`useMyPayments`) to invoice-derived history (`useMyPaymentHistory` / `GET /api/billing/invoices/my-payment-history`). Fixes "No payments found" when payments were recorded via `PATCH /billing/invoices/:id/payment` (no Payment document created)
- ✅ **New table columns** — Date, Invoice No., Service, Total Amount, Amount Paid (green), Mode, Status
- ✅ **Equal-height summary cards** — all three stat cards (`Total Billed`, `Total Paid`, `Pending Amount`) are equal height via `alignItems: "stretch"` on the Grid container + `height: "100%"` on each Card. The "Pending Amount" card's Pay Now button is anchored to the card bottom via flex column with `justifyContent: "space-between"` on CardContent
- ✅ Removed `TablePagination`, `page`/`limit` state, `modeLabels`, `typeLabels` — replaced with `paymentModeLabels` and invoice `paymentStatus`-based `statusColors`

### [2026-07-02] Patient Portal — Heading Size Consistency
**Files:** `Appointments.jsx`, `Invoices.jsx`, `Reports.jsx`, `Treatments.jsx`

- ✅ All patient portal page headings standardised to `variant="h5" fontWeight="bold"` to match the `Membership.jsx` reference heading ("My Membership")
- ✅ Pages changed: "My Appointments" (h4→h5), "Invoices" (h4→h5), "Medical Reports" (h4→h5), "My Treatments" (h4→h5)
- ✅ `Membership.jsx` heading ("My Membership") and `Notifications.jsx` heading ("Notifications") already correct — left unchanged

### [2026-07-02] Patient Portal — Membership Page
**File:** `pages/patient/Membership.jsx`

- ✅ Removed green "VIEW PLANS" `Button` from inside the "No Active Membership" card (`variant="contained"`, `startIcon={<ArrowDownwardIcon />}`, `bgcolor: "#0d9488"`)
- ✅ Orange "View All Plans" button below the card (outside the no-membership state) — **not touched**

### [2026-07-02] Patient Portal — Notifications Page Fixes
**File:** `pages/patient/Notifications.jsx`

- ✅ **Fix 1 — Data shape mismatch:** `data?.data?.notifications` returned `undefined` because `ApiResponse.paginated` puts the array directly at `data.data`, not at `data.data.notifications`. Fixed to `data?.data || []`
- ✅ **Fix 2 — Bell not resetting:** Added `useEffect` that calls `markAllAsRead()` on mount whenever unread notifications exist. This triggers `PATCH /notifications/mark-all-read` and invalidates the `["patient", "notifications", "unread-count"]` query key so the bell resets to 0 when the patient visits the Notifications page
- ✅ Added `import { useEffect } from "react"`

### [2026-07-02] Patient Portal — "Book Treatment" Removal
**Files:** `components/PatientSidebar.jsx`, `App.jsx`

- ✅ Removed `{ title: "Book Treatment", path: "/book-treatment", icon: <AddShoppingCartIcon /> }` nav item from the patient sidebar — the route no longer exists in the sidebar navigation
- ✅ Removed `const BookTreatment = lazy(...)` import and `<Route path="book-treatment" .../>` from `App.jsx`
- ✅ "Book Appointment / Treatment" button on Dashboard Quick Actions is **unaffected** — it routes to `/book-appointment`

### [2026-07-02] Admin — PatientDetailModal Tab Changes
**File:** `components/admin/modals/PatientDetailModal.jsx`

- ✅ **Renamed** "Payments" tab → "Payment History" (tab index 4, label only — content, panel, and index unchanged)
- ✅ **Added** "Lab" tab (index 6, after Reports) showing the patient's lab orders
  - Fetches via existing `GET /api/lab-orders` (`getLabOrders` from `labOrders.api.js`) with `limit: 200`
  - Client-side filtered by `patient._id` (backend `getAllLabOrders` does not yet accept a `patient` query param)
  - Columns: Order No., Date, Lab, Items (comma-joined procedures), Delivery status chip, Payment status chip, Total
  - Empty state: "No lab orders found for this patient."
  - New status color entries added to shared `statusColors` map: `delivered` (success), `rejected` (error), `partially_paid` (warning)
- ✅ **Added** "Invoices" tab (index 7, after Lab) showing the patient's invoices
  - Fetches via `getInvoices({ patient: patientId, limit: 50 })` — server-side filtered (backend supports `patient` query param)
  - Columns: Invoice No., Date, Items (first item + "+N more"), Total, Paid, Balance Due, Payment Status chip, eye icon action
  - Eye icon opens `InvoiceDetailModal` for that invoice (reuses existing modal, no modification)
  - Empty state: "No invoices found for this patient."
  - Supports `paymentStatusFilter` prop for pre-filtered views (e.g., "unpaid" from stat card click)
  - Filter chip shown when active; × clears it back to all invoices
- ✅ **Billing stat cards in "Payment History" tab made clickable:**
  - "Total Amount" card → navigates to Invoices tab (all invoices)
  - "Balance Due" card → navigates to Invoices tab pre-filtered to `paymentStatus=unpaid`
  - "Invoices" count card → navigates to Invoices tab (all invoices)
  - "Total Paid" card → no action (already on Payment History tab)
  - Renamed "Pending" label to "Balance Due" for clarity
  - Clicking Invoices tab header directly resets any active filter
- ✅ **Payment History tab now shows actual payment data derived from invoices:**
  - Root cause of empty tab: previous implementation called `getPatientPayments` which queries the `Payment` collection — but this system tracks payments on invoices (`amountPaid`, `paymentMethod`, `paymentStatus` fields on Invoice model). `Payment.find()` returned empty.
  - Fix: replaced with `getInvoices({ patient: patientId, limit: 50 })`, filtered client-side to `amountPaid > 0`
  - Table columns: Date (`invoiceDate`) / Invoice No. / Description (first item) / Total (`grandTotal`) / Paid / Payment Mode / Status chip
  - Summary line above table: "Total Paid: ₹X across Y invoices"
  - Empty state: "No payments recorded for this patient yet."
  - Read-only — "Record Payment" button and `RecordPaymentModal` removed (admin uses Billing page for actions)
  - Stat cards retained (from `getBillingStats`): Total Amount / Total Paid / Balance Due / Invoices count
- ✅ **No other tabs, panels, or functionality changed**

### [2026-07-02] Admin — Billing Stats Cards: Three Bug Fixes
**Files:** `pages/admin/Billing.jsx` (frontend), `backend/src/modules/billing/billing.controller.js` (backend)

- ✅ **Fix 1 — Balance Due click filter now includes partial invoices:**
  - Was: clicking "Balance Due" stat card sent `paymentStatus=unpaid` — partial invoices (with outstanding `balanceDue`) were excluded.
  - Fix: click now sends `paymentStatus=unpaid,partial`. Backend `getAllInvoices` was updated to parse comma-separated `paymentStatus` values, validate each against `["unpaid","partial","paid"]`, and use `{ $in: [...] }` for multi-value queries. Single-value behaviour unchanged.
- ✅ **Fix 2 — Stats date filter now uses `invoiceDate` (was `createdAt`):**
  - `getBillingStats` was building `matchQuery.createdAt = { $gte, $lte }` but `getAllInvoices` and the invoice table both use `invoiceDate`. For backdated invoices the stat totals and the visible table rows fell into different date buckets.
  - Fix: `matchQuery.createdAt` → `matchQuery.invoiceDate` in `getBillingStats`. `Invoice.getStats()` aggregation is unchanged.
- ✅ **Fix 3 — Date scope label added to each stat card:**
  - Each stat card now shows a small muted subtitle (11 px, `text.secondary`) below the value showing the active date window.
  - Default (no date picker set): shows current month + year, e.g. "July 2026" (mirrors the backend current-month default).
  - When a date range is active: shows the formatted range, e.g. "1 Jul – 15 Jul" (or "From 1 Jul" / "Until 15 Jul" when only one end is set).
  - No new API calls or state — derived purely from existing `fromDate`/`toDate` state. `StatCard` accepts a new optional `dateLabel` prop; unchanged if omitted.

### [2026-07-03] Admin — Filter Reset (↺) Fixed on 11 Admin Pages

The refresh/reset (↺) button was calling `refetch()` only on all pages except Patients — this refetched data from the server but did NOT clear the visible filter state (search text, dropdowns, date pickers remained active). Fixed by adding `handleReset` functions that reset all filter state variables and wiring the button to `handleReset` instead of `refetch()`.

**Pages fixed (batch 1):** `Billing.jsx`, `Appointments.jsx`, `Payments.jsx`, `Memberships.jsx`, `Lab.jsx`
**Pages fixed (batch 2):** `Enquiries.jsx`, `Treatments.jsx`, `Notifications.jsx`, `Clinics.jsx`, `User.jsx`
**Already correct:** `Patients.jsx`

| Page | States reset by ↺ | Notes |
|---|---|---|
| Billing | `search`, `filters`, `fromDate`, `toDate`, `activeStatCard`, `page` | |
| Appointments | `search`, `filters`, `dateFilter`, `page` | `dateFilter` resets the quick-filter button highlight |
| Payments | `search`, `filters`, `fromDate`, `toDate`, `page` | `selectedPatient` (collect payment) left alone — not a filter |
| Memberships | `search`, `filters` | Client-side filter; also added `searchValue={search}` to DataTable so visual input clears |
| Lab | `filters` (including `filters.search`), `fromDate`, `toDate`, `page`, `view` | Search stored inside `filters` object; resets Active/Archived toggle too |
| Enquiries | `search`, `filters`, `fromDate`, `toDate`, `page` | |
| Treatments | `search`, `filters` | Client-side filter; added `searchValue={search}` |
| Notifications | `search`, `filters`, `fromDate`, `toDate`, `page` | |
| Clinics | `search`, `filters` | Client-side filter; added `searchValue={search}` |
| User | `search`, `filters`, `page` | Staff Management page |

`searchValue={search}` prop is required on DataTable for client-side filtered pages (Memberships, Treatments, Clinics) because DataTable has its own internal `searchTerm` state — without `searchValue`, resetting parent `search` state doesn't clear the visible input.

### [2026-07-03] Admin — Lab Page Filter Bar Reorganised (4-Column Grid)

`Lab.jsx` (`LabOrdersTab` component): filter bar changed from a single flex row to a MUI Grid layout:
- **Top row** (flex, space-between): "New Lab Order" button (left) + Refresh ↺ (right, above filter rows)
- **Grid row 1** (4 × `md=3`): Active/Archived toggle | From date | To date (+inline Clear) | Search
- **Grid row 2** (3 × `md=3`): Lab dropdown | Delivery dropdown | Payment dropdown

Requires `import Grid from "@mui/material/Grid"` (separate import, not from `@mui/material`).

### [2026-07-03] Admin — Settings: "Fees" and "Plan Pricing" Tabs Removed

`Settings.jsx`: removed two tabs and all their associated code:
- **"Fees" tab** (was index 2): OPD/consultation fee settings, called `useFeeSettings` + `useFeeSettingsMutations` hooks
- **"Plan Pricing" tab** (was index 6): dental plan prices stored in `localStorage`

Removed: `PaymentIcon` import, `useFeeSettings`, `useFeeSettingsMutations` hook calls, `feeForm` and `planPricingForm` state, two `useEffect`s, four handlers (`handleFeeChange`, `handleSaveFees`, `handlePlanPriceChange`, `handleSavePlanPricing`), both Tab components and both TabPanel blocks. Remaining tabs re-indexed: Notifications 3→2, System 4→3, Popup 5→4.

### [2026-07-02] Admin — AppointmentDetailModal Payment Status Fix
**File:** `components/admin/modals/AppointmentDetailModal.jsx`

- ✅ **Bug:** Popup showed "Pending" while the appointments table row showed "Paid" for the same appointment. Root cause: the popup used `opdFeePaid` boolean only, while the table used `invoice.paymentStatus` with priority logic
- ✅ **Fix:** Replaced the simple `opdFeePaid` check with priority logic matching the table:
  1. `invoice?.paymentStatus === "paid"` OR `paymentStatus === "paid"` → "Paid" chip (success)
  2. `invoice?.paymentStatus === "partial"` → "Partially Paid" chip (warning)
  3. `opdFeePaid === true` → "Paid" chip (success, legacy fallback)
  4. Default → "Unpaid" chip (error)
- ✅ Added `invoice` and `paymentStatus` to the destructured fields from `appointment`

### [2026-07-03] Admin — `minHeight: 100vh` on 6 Page Wrappers

Added `sx={{ minHeight: "100vh" }}` to the outermost `<Box>` in: `Billing.jsx`, `Patients.jsx`, `Appointments.jsx`, `Payments.jsx`, `Lab.jsx` (LabsTab), `Memberships.jsx`. Combined with `scrollbar-gutter: stable` on `html` in `index.css`, this prevents the layout shift (scrollbar appearing/disappearing) that caused a brief right-side gap when navigating between pages with and without enough content to scroll.

## Getting Started

```bash
# Install dependencies
npm install

# Start development server (requires backend running on port 5001)
npm run dev

# Build for production
npm run build
```

## Environment Variables

Local development — create `.env` file:
```env
VITE_API_URL=http://localhost:5001/api
```

Production (set in Vercel dashboard for the frontend project):
```env
VITE_API_URL=https://your-backend.example.com/api
```

## Color Scheme

| Module | Primary Color |
|--------|---------------|
| Patients | Blue (`blue-600`) |
| Enquiries | Teal (`teal-600`) |
| Appointments | Indigo (`indigo-600`) |
| Treatments | Teal (`teal-600`) |
| Tests | Purple (`purple-600`) |
| Payments | Green (`green-600`) |
| Billing | Indigo (`indigo-600`) |
| Reports | Teal (`teal-600`) |
| Memberships | Purple (`purple-600`) |
| Notifications | Blue (`blue-600`) |
| Clinics | Blue (`blue-600`) |
| Staff | Purple (`purple-600`) |
| Settings | Gray (`gray-600`) |

## Modal Pattern

All admin modals follow this pattern:

1. **Detail Modal** - View item details, with Edit/Delete buttons
2. **Add Modal** - Form to create new item
3. **Edit Modal** - Form pre-filled with existing data
4. **Delete Modal** - Soft delete confirmation (reusable component)

```jsx
// Usage in page
<DetailModal
  open={detailModalOpen}
  onClose={() => setDetailModalOpen(false)}
  item={selectedItem}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```

## React Query Hooks Pattern

### Standard CRUD Hooks

```javascript
// Hook file (e.g., useClinics.js)
export const useClinics = (params = {}) => {
  return useQuery({
    queryKey: ["admin", "clinics", params],
    queryFn: () => getClinics(params),
    staleTime: 5 * 60 * 1000,
  });
};

export const useClinicMutations = () => {
  const queryClient = useQueryClient();

  const createClinic = useMutation({
    mutationFn: createClinicApi,
    onSuccess: () => queryClient.invalidateQueries(["admin", "clinics"]),
  });

  return {
    createClinic: createClinic.mutate,
    isCreating: createClinic.isPending,
    // ... other mutations
  };
};
```

### Notification Hooks (Real-time Updates)

```javascript
// useNotifications.js
export const useUnreadCount = () => {
  return useQuery({
    queryKey: ["admin", "notifications", "unread-count"],
    queryFn: getUnreadCount,
    staleTime: 30 * 1000,        // 30 seconds
    refetchInterval: 60 * 1000,  // Auto-refresh every 60 seconds
  });
};

export const useNotificationMutations = () => {
  const queryClient = useQueryClient();

  const invalidateNotifications = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "notifications"] });
  };

  const markReadMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => invalidateNotifications(),
  });

  return {
    markAsRead: markReadMutation.mutate,
    isMarkingRead: markReadMutation.isPending,
  };
};
```

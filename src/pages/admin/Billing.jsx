/**
 * Admin Billing Page
 *
 * Displays list of all invoices with:
 * - Stats cards (total invoices, amount, paid, balance due, OPD collection)
 * - Search by invoice number/patient
 * - Filter by status, payment status
 * - Date range filter
 * - Pagination
 * - Create new invoice
 * - View / Edit / Print / Reminder actions per row
 */
import { useState } from "react";
import {
  Box,
  Typography,
  Chip,
  Avatar,
  Button,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import AddIcon from "@mui/icons-material/Add";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import PrintIcon from "@mui/icons-material/Print";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import { useQueryClient } from "@tanstack/react-query";
import InvoicePreviewModal from "../../components/InvoicePreviewModal";
import QuickDateRangeFilter from "../../components/admin/QuickDateRangeFilter";
import DataTable from "../../components/common/DataTable";
import CompactFilterBar from "../../components/common/CompactFilterBar";
import { useInvoices, useBillingStats } from "../../hooks/admin/useBilling";
import { getBillingExportUrl } from "../../api/admin/billing.api";
import { usePatient } from "../../hooks/admin/usePatients";
import CreateInvoiceModal from "../../components/admin/modals/CreateInvoiceModal";
import InvoiceDetailModal from "../../components/admin/modals/InvoiceDetailModal";
import CollectPaymentModal from "../../components/admin/modals/CollectPaymentModal";
import PatientDetailModal from "../../components/admin/modals/PatientDetailModal";
import api from "../../api/axios";
import { useAdminStore } from "../../store/admin.store";
import { downloadFile } from "../../utils/downloadFile";
import { usePermissions } from "../../hooks/admin/usePermissions";

// Shared date formatter — matches DataTable's built-in type="date" format
const fmtDate = (val) =>
  val
    ? new Date(val).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "-";

/**
 * Derive a single consolidated payment-status label + MUI Chip color from
 * an invoice row.  Priority order:
 *   1. status === "overdue"  → "Overdue"  (error / red)
 *   2. paymentStatus === "paid"   → "Paid"     (success / green)
 *   3. paymentStatus === "partial" → "Partial"  (warning / amber)
 *   4. else                        → "Unpaid"   (default outlined / gray)
 */
const getPaymentBadge = (row) => {
  if (row.status === "overdue") return { label: "Overdue", color: "error", variant: "filled" };
  if (row.paymentStatus === "paid") return { label: "Paid", color: "success", variant: "filled" };
  if (row.paymentStatus === "partial") return { label: "Partial", color: "warning", variant: "filled" };
  return { label: "Unpaid", color: "default", variant: "outlined" };
};

/**
 * Filter options
 */
const filterOptions = [
  {
    key: "status",
    label: "Status",
    options: [
      { value: "draft", label: "Draft" },
      { value: "sent", label: "Sent" },
      { value: "partially_paid", label: "Partially Paid" },
      { value: "paid", label: "Paid" },
      { value: "overdue", label: "Overdue" },
      { value: "cancelled", label: "Cancelled" },
    ],
  },
  {
    key: "paymentStatus",
    label: "Payment",
    options: [
      { value: "unpaid", label: "Unpaid" },
      { value: "partial", label: "Partial" },
      { value: "paid", label: "Paid" },
    ],
  },
  {
    key: "voided",
    label: "Voided",
    options: [{ value: "true", label: "Voided Only" }],
  },
];

/**
 * Stat card component.
 * isActive — when true, renders a 2px #F57C00 (accent) border to match the
 * existing border-accent convention used on featured plan cards (PlansPage)
 * and active CTA buttons (Login, HomePage). Click the active card again to
 * toggle the filter off.
 */
const StatCard = ({ icon: Icon, label, value, color, onClick, isActive, dateLabel }) => (
  <Card
    variant="outlined"
    onClick={onClick}
    className="h-full"
    sx={{
      ...(onClick && {
        cursor: "pointer",
        transition: "all 0.2s ease",
        "&:hover": { transform: "translateY(-2px)", boxShadow: "0 4px 20px rgba(0,0,0,0.12)" },
      }),
      ...(isActive && {
        borderColor: "#F57C00",
        borderWidth: 2,
        boxShadow: "0 0 0 1px rgba(245,124,0,0.15)",
      }),
    }}
  >
    <CardContent className="flex items-center gap-3 py-3">
      <Box className={`p-2 rounded-lg shrink-0 ${color}`}>
        <Icon className="text-white" />
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="caption" className="text-gray-500" noWrap sx={{ display: "block" }}>
          {label}
        </Typography>
        <Typography variant="h6" className="font-numbers font-bold leading-tight" noWrap sx={{ display: "block" }}>
          {value}
        </Typography>
        {dateLabel && (
          <Typography variant="caption" noWrap sx={{ color: "text.secondary", fontSize: "11px", display: "block", lineHeight: 1.4 }}>
            {dateLabel}
          </Typography>
        )}
      </Box>
    </CardContent>
  </Card>
);

const Billing = () => {
  const queryClient = useQueryClient();
  const adminToken = useAdminStore((state) => state.token);

  // ── Pagination / search / filter state ──────────────────────────────────
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({});
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [exportAnchorEl, setExportAnchorEl] = useState(null);

  // ── Active stat-card filter state ────────────────────────────────────────
  // Tracks which stat card is currently driving the table filter so we can
  // show a highlighted border and toggle it off on a second click.
  // null | "paid" | "unpaid" | "opd"
  const [activeStatCard, setActiveStatCard] = useState(null);

  // ── Modal states ─────────────────────────────────────────────────────────
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const { hasPermission } = usePermissions();
  const [collectOpen, setCollectOpen] = useState(false);
  const [collectInvoice, setCollectInvoice] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // ── Payment reminder dialog state ─────────────────────────────────────────
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [reminderInvoice, setReminderInvoice] = useState(null);
  const [reminderSending, setReminderSending] = useState(false);

  // ── Patient detail modal state ────────────────────────────────────────────
  // patientForModal is the partial patient object from the invoice row.
  // usePatient fetches the full record so the modal's header (Active/Inactive,
  // membership) renders correctly. The modal opens immediately with partial
  // data and re-renders when the full fetch resolves (< 1 s normally).
  const [patientModalOpen, setPatientModalOpen] = useState(false);
  const [patientForModal, setPatientForModal] = useState(null);
  const { data: fullPatientData } = usePatient(patientForModal?._id);
  const patientToShow = fullPatientData?.data?.patient || patientForModal;

  // ── Data fetching ────────────────────────────────────────────────────────
  const { data, isLoading, refetch } = useInvoices({
    page,
    limit,
    search,
    ...filters,
    ...(fromDate && { from: fromDate }),
    ...(toDate && { to: toDate }),
  });

  const invoices = data?.data || [];
  const pagination = data?.pagination || { total: 0 };

  const { data: statsData } = useBillingStats({
    ...(fromDate && { from: fromDate }),
    ...(toDate && { to: toDate }),
  });
  const stats = statsData?.data?.stats || {};

  // Muted date scope label shown below each stat card value.
  // Default (no date picker set) → "All time" (stats now cover all invoices).
  // When a range is active → "1 Jul – 15 Jul" (or partial if only one end set).
  const statDateLabel = (() => {
    if (fromDate || toDate) {
      const fmt = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      if (fromDate && toDate) return `${fmt(fromDate)} – ${fmt(toDate)}`;
      if (fromDate) return `From ${fmt(fromDate)}`;
      return `Until ${fmt(toDate)}`;
    }
    return "All time";
  })();

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleSearch = (value) => { setSearch(value); setPage(1); };

  /**
   * Export the CURRENTLY filtered invoice list as a PDF statement -- carries
   * over the same search text + active filters + date range shown on
   * screen, so the export matches what the admin is looking at. Same
   * pattern as Patients.jsx's handleExport.
   */
  const handleExportPdf = async () => {
    setExportAnchorEl(null);
    const exportParams = {
      search,
      ...filters,
      ...(fromDate && { from: fromDate }),
      ...(toDate && { to: toDate }),
    };
    const url = getBillingExportUrl(exportParams);
    const today = new Date().toISOString().slice(0, 10);

    try {
      await downloadFile(url, `billing-statement-${today}.pdf`, {
        headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {},
        credentials: "include",
      });
    } catch {
      setSnackbar({ open: true, message: "Failed to export billing statement as PDF", severity: "error" });
    }
  };

  const handleFilterChange = (key, value) => {
    // Manual dropdown use deactivates any stat-card-driven filter so the
    // card border doesn't stay highlighted after the user overrides it.
    setActiveStatCard(null);
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
    setPage(1);
  };

  // Toggle a stat card's filter on/off. Clicking the same card twice clears.
  // When activating a card, also clear the date range — stat cards show all-time
  // totals (no date scope), so the table must match to stay consistent.
  const handleStatCardClick = (cardKey, filterToSet) => {
    if (activeStatCard === cardKey) {
      setActiveStatCard(null);
      setFilters({});
    } else {
      setActiveStatCard(cardKey);
      setFilters(filterToSet);
      setFromDate("");
      setToDate("");
    }
    setPage(1);
  };

  const handleRowClick = (invoice) => {
    setSelectedInvoice(invoice);
    setDetailModalOpen(true);
  };

  const handleReset = () => {
    setSearch("");
    setFilters({});
    setFromDate("");
    setToDate("");
    setActiveStatCard(null);
    setPage(1);
  };

  const formatCurrency = (val) => `₹${(val || 0).toLocaleString("en-IN")}`;

  // Step 1 — bell icon click: open the confirmation dialog
  const handleReminderClick = (invoice) => {
    setReminderInvoice(invoice);
    setReminderDialogOpen(true);
  };

  // Step 2 — dialog Send button: call the endpoint
  const handleSendReminderConfirm = async () => {
    if (!reminderInvoice) return;
    setReminderSending(true);
    try {
      await api.post("/notifications/reminder/payment", {
        invoiceId: reminderInvoice._id,
        patientId: reminderInvoice.patient?._id,
      });
      setReminderDialogOpen(false);
      setReminderInvoice(null);
      setSnackbar({ open: true, message: "Payment reminder sent to patient", severity: "success" });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || "Failed to send reminder",
        severity: "error",
      });
    } finally {
      setReminderSending(false);
    }
  };

  // ── Column definitions (inside component for state-setter access) ─────────
  const columns = [
    // 1. Invoice No.
    {
      field: "invoiceNumber",
      headerName: "Invoice No.",
      minWidth: 140,
      render: (value) => (
        <Typography variant="body2" className="font-mono font-medium text-indigo-600">
          {value || "-"}
        </Typography>
      ),
    },
    // 2. Date
    {
      field: "invoiceDate",
      headerName: "Date",
      minWidth: 110,
      type: "date",
    },
    // 3. Patient — linked to PatientDetailModal
    {
      field: "patient",
      headerName: "Patient",
      minWidth: 170,
      render: (value) => (
        <Box
          className="flex items-center gap-2 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            setPatientForModal(value);
            setPatientModalOpen(true);
          }}
        >
          <Avatar className="bg-indigo-100 text-indigo-600" sx={{ width: 28, height: 28, fontSize: "0.75rem" }}>
            {value?.name?.[0]?.toUpperCase() || "P"}
          </Avatar>
          <Box>
            <Typography
              variant="body2"
              className="font-medium text-indigo-700 hover:underline"
              sx={{ lineHeight: 1.3 }}
            >
              {value?.name || "Unknown"}
            </Typography>
            <Typography variant="caption" className="text-gray-500">
              {value?.phone || ""}
            </Typography>
          </Box>
        </Box>
      ),
    },
    // 4. Treatment — first item description + "+N more" if multiple
    {
      field: "items",
      headerName: "Treatment",
      minWidth: 190,
      render: (value) => {
        const items = value || [];
        if (items.length === 0) return <span className="text-gray-400">-</span>;
        const primary = items[0]?.description || "-";
        const extra = items.length - 1;
        return (
          <Box>
            <Typography
              variant="body2"
              className="font-medium"
              sx={{ maxWidth: 170, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
            >
              {primary}
            </Typography>
            {extra > 0 && (
              <Typography variant="caption" className="text-gray-500">
                +{extra} more
              </Typography>
            )}
          </Box>
        );
      },
    },
    // 5. Total Amount
    {
      field: "grandTotal",
      headerName: "Total Amount",
      minWidth: 120,
      render: (value) => (
        <Typography variant="body2" className="font-numbers font-semibold">
          ₹{(value || 0).toLocaleString("en-IN")}
        </Typography>
      ),
    },
    // 6. Paid
    {
      field: "amountPaid",
      headerName: "Paid",
      minWidth: 100,
      render: (value) => (
        <Typography variant="body2" className="font-numbers text-green-600">
          ₹{(value || 0).toLocaleString("en-IN")}
        </Typography>
      ),
    },
    // 7. Due — red when positive; inline Collect button
    {
      field: "balanceDue",
      headerName: "Due",
      minWidth: 160,
      render: (value, row) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography
            variant="body2"
            className={`font-numbers ${value > 0 ? "text-red-600 font-medium" : "text-gray-500"}`}
          >
            ₹{(value || 0).toLocaleString("en-IN")}
          </Typography>
          {value > 0 && row.paymentStatus !== "paid" && row.status !== "cancelled" && hasPermission("payments", "create") && (
            <Button
              size="small"
              variant="contained"
              onClick={(e) => {
                e.stopPropagation();
                setCollectInvoice(row);
                setCollectOpen(true);
              }}
              sx={{
                bgcolor: "#f59e0b",
                color: "#fff",
                textTransform: "none",
                fontWeight: 600,
                fontSize: "11px",
                borderRadius: "6px",
                px: 1.5,
                py: 0.4,
                minWidth: "auto",
                lineHeight: 1.4,
                "&:hover": { bgcolor: "#d97706" },
              }}
            >
              Collect
            </Button>
          )}
        </Box>
      ),
    },
    // 8. Payment Status — single consolidated badge
    {
      field: "paymentStatus",
      headerName: "Payment Status",
      minWidth: 130,
      render: (_value, row) => {
        const { label, color, variant } = getPaymentBadge(row);
        return <Chip label={label} size="small" color={color} variant={variant} sx={{ fontSize: '11px' }} />;
      },
    },
    // 9. Due Date — red text when overdue and unpaid
    {
      field: "dueDate",
      headerName: "Due Date",
      minWidth: 115,
      render: (value, row) => {
        if (!value) return <span className="text-gray-400">-</span>;
        const isOverdue =
          new Date(value) < new Date() && row.paymentStatus !== "paid";
        return (
          <Typography
            variant="body2"
            className={isOverdue ? "text-red-600 font-medium" : ""}
          >
            {fmtDate(value)}
          </Typography>
        );
      },
    },
    // 10. Action — Print / View / Edit / Reminder
    {
      field: "_id",
      headerName: "Action",
      minWidth: 160,
      align: "center",
      render: (_value, row) => {
        const isDraft = row.status === "draft";
        const reminderDisabled =
          row.status === "cancelled" ||
          row.status === "draft" ||
          row.paymentStatus === "paid";

        return (
          <Box sx={{ display: "flex", gap: 0.5, justifyContent: "center" }}>
            {/* Print / Download PDF — opens preview modal first */}
            <Tooltip title="Print / Download PDF">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewInvoice(row);
                  setPreviewOpen(true);
                }}
              >
                <PrintIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* View — opens InvoicePreviewModal */}
            <Tooltip title="Preview Invoice">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewInvoice(row);
                  setPreviewOpen(true);
                }}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* Edit — draft only; opens InvoiceDetailModal */}
            <Tooltip title={isDraft ? "Edit Draft Invoice" : "Only draft invoices can be edited"}>
              {/* Wrap in span so Tooltip works on disabled buttons */}
              <span>
                <IconButton
                  size="small"
                  disabled={!isDraft}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedInvoice(row);
                    setDetailModalOpen(true);
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>

            {/* Reminder — disabled for draft / cancelled / paid */}
            <Tooltip
              title={
                reminderDisabled
                  ? "Reminder not available for this invoice"
                  : "Send payment reminder to patient"
              }
            >
              <span>
                <IconButton
                  size="small"
                  disabled={reminderDisabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReminderClick(row);
                  }}
                >
                  <NotificationsActiveIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        );
      },
    },
  ];

  return (
    <Box sx={{ minHeight: "100vh" }}>
      {/* Header */}
      <Box className="flex flex-wrap justify-between items-center gap-4 mb-4">
        <Box>
          <Typography variant="h4" className="font-bold text-gray-800">
            Billing & Invoices
          </Typography>
          <Typography variant="body2" className="text-gray-500">
            Create and manage patient invoices
          </Typography>
        </Box>
        <Box className="flex items-center gap-2">
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            endIcon={<ArrowDropDownIcon />}
            onClick={(e) => setExportAnchorEl(e.currentTarget)}
          >
            Export
          </Button>
          <Menu anchorEl={exportAnchorEl} open={Boolean(exportAnchorEl)} onClose={() => setExportAnchorEl(null)}>
            <MenuItem onClick={handleExportPdf}>
              <ListItemIcon>
                <PictureAsPdfIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Export as PDF</ListItemText>
            </MenuItem>
          </Menu>
          {hasPermission("billing", "create") && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Create Invoice
            </Button>
          )}
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} className="mb-3">
        {/* "Show all" reset cards — no active state, always clear filters */}
        <Grid size={{ xs: 6, md: 2.4 }}>
          <StatCard
            icon={ReceiptLongIcon}
            label="Total Invoices"
            value={stats.totalInvoices || 0}
            color="bg-indigo-500"
            dateLabel={statDateLabel}
            onClick={() => { setActiveStatCard(null); setFilters({}); setPage(1); }}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 2.4 }}>
          <StatCard
            icon={AttachMoneyIcon}
            label="Total Amount"
            value={formatCurrency(stats.totalAmount)}
            color="bg-blue-500"
            dateLabel={statDateLabel}
            onClick={() => { setActiveStatCard(null); setFilters({}); setPage(1); }}
          />
        </Grid>
        {/* Filter cards — togglable; show accent border when active */}
        <Grid size={{ xs: 6, md: 2.4 }}>
          <StatCard
            icon={AccountBalanceWalletIcon}
            label="Total Paid"
            value={formatCurrency(stats.totalPaid)}
            color="bg-green-500"
            dateLabel={statDateLabel}
            isActive={activeStatCard === "paid"}
            onClick={() => handleStatCardClick("paid", { paymentStatus: "paid" })}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 2.4 }}>
          <StatCard
            icon={WarningAmberIcon}
            label="Balance Due"
            value={formatCurrency(stats.totalDue)}
            color="bg-red-500"
            dateLabel={statDateLabel}
            isActive={activeStatCard === "unpaid"}
            onClick={() => handleStatCardClick("unpaid", { paymentStatus: "unpaid,partial" })}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 2.4 }}>
          <StatCard
            icon={LocalHospitalIcon}
            label="Appointment Collected"
            value={formatCurrency(stats.opdCollection)}
            color="bg-teal-500"
            dateLabel={statDateLabel}
            isActive={activeStatCard === "opd"}
            onClick={() => handleStatCardClick("opd", { itemType: "opd_fee" })}
          />
        </Grid>
      </Grid>

      {/* Filters */}
      <CompactFilterBar
        dateFilterSlot={
          <QuickDateRangeFilter
            value={{ from: fromDate, to: toDate }}
            onChange={({ from, to }) => {
              setFromDate(from);
              setToDate(to);
              setPage(1);
            }}
          />
        }
        search={search}
        onSearchChange={handleSearch}
        searchPlaceholder="Search by invoice number or patient..."
        filters={filterOptions}
        filterValues={filters}
        onFilterChange={handleFilterChange}
        onRefresh={handleReset}
      />

      {/* Data Table */}
      <DataTable
        size="small"
        columns={columns}
        data={invoices}
        loading={isLoading}
        pagination={{
          page,
          limit,
          total: pagination.total,
          onPageChange: setPage,
          onLimitChange: (newLimit) => {
            setLimit(newLimit);
            setPage(1);
          },
        }}
        onRowClick={handleRowClick}
        emptyMessage="No invoices found"
      />

      {/* Create Invoice Modal */}
      <CreateInvoiceModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => refetch()}
      />

      {/* Invoice Preview Modal (View action) */}
      <InvoicePreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        invoice={previewInvoice}
      />

      {/* Invoice Detail Modal (row click + Edit action for drafts) */}
      <InvoiceDetailModal
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedInvoice(null);
        }}
        invoice={selectedInvoice}
        onRefresh={refetch}
      />

      {/* Collect Payment Modal */}
      <CollectPaymentModal
        open={collectOpen}
        onClose={() => {
          setCollectOpen(false);
          setCollectInvoice(null);
        }}
        invoice={collectInvoice}
        patient={collectInvoice?.patient}
        onSuccess={(msg) => {
          queryClient.invalidateQueries({ queryKey: ["admin", "billing"] });
          queryClient.invalidateQueries({ queryKey: ["admin", "payments"] });
          queryClient.invalidateQueries({ queryKey: ["admin", "unpaid-invoices"] });
          refetch();
          if (msg) setSnackbar({ open: true, message: msg, severity: "success" });
        }}
      />

      {/* Patient Detail Modal (Patient column link) */}
      <PatientDetailModal
        open={patientModalOpen}
        onClose={() => {
          setPatientModalOpen(false);
          setPatientForModal(null);
        }}
        patient={patientToShow}
      />

      {/* Payment Reminder Confirmation Dialog */}
      <Dialog
        open={reminderDialogOpen}
        onClose={() => {
          if (reminderSending) return;
          setReminderDialogOpen(false);
          setReminderInvoice(null);
        }}
        maxWidth="xs"
        fullWidth
        PaperProps={{ className: "rounded-xl" }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box className="flex items-center gap-2">
            <NotificationsActiveIcon sx={{ color: "#6366f1", fontSize: 22 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: 16 }}>
              Send Payment Reminder
            </Typography>
          </Box>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ pt: 2, pb: 1 }}>
          {/* Patient + invoice summary */}
          <Box className="flex flex-col gap-2">
            <Box className="flex justify-between items-center">
              <Typography variant="body2" className="text-gray-500">Patient</Typography>
              <Typography variant="body2" className="font-medium text-right">
                {reminderInvoice?.patient?.name || "—"}
                {reminderInvoice?.patient?.phone && (
                  <span className="text-gray-400 font-normal"> · {reminderInvoice.patient.phone}</span>
                )}
              </Typography>
            </Box>
            <Box className="flex justify-between items-center">
              <Typography variant="body2" className="text-gray-500">Invoice</Typography>
              <Typography variant="body2" className="font-mono font-medium text-indigo-600">
                {reminderInvoice?.invoiceNumber || "—"}
              </Typography>
            </Box>
            <Box className="flex justify-between items-center">
              <Typography variant="body2" className="text-gray-500">Outstanding</Typography>
              <Typography variant="body2" className="font-numbers font-semibold text-red-600">
                {formatCurrency(reminderInvoice?.balanceDue)}
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              mt: 2,
              px: 1.5,
              py: 1,
              bgcolor: "#f0f9ff",
              border: "1px solid #bae6fd",
              borderRadius: "6px",
            }}
          >
            <Typography variant="caption" sx={{ color: "#0369a1", lineHeight: 1.5 }}>
              An <strong>in-app notification</strong> will be sent to the patient's dashboard.
              SMS and email reminders are not yet configured.
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            size="small"
            onClick={() => {
              setReminderDialogOpen(false);
              setReminderInvoice(null);
            }}
            disabled={reminderSending}
            sx={{ textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={handleSendReminderConfirm}
            disabled={reminderSending}
            startIcon={reminderSending ? <CircularProgress size={14} color="inherit" /> : <NotificationsActiveIcon fontSize="small" />}
            sx={{
              textTransform: "none",
              bgcolor: "#6366f1",
              "&:hover": { bgcolor: "#4f46e5" },
              fontWeight: 600,
            }}
          >
            {reminderSending ? "Sending…" : "Send Reminder"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar — used for payment collection success + reminder feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Billing;

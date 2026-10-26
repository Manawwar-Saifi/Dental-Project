import { useState, useEffect, useCallback } from "react";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  CircularProgress,
  Autocomplete,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  Divider,
  Tabs,
  Tab,
  Skeleton,
  Menu,
  MenuItem,
  ListItemIcon,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import UndoIcon from "@mui/icons-material/Undo";
import PrintIcon from "@mui/icons-material/Print";
import ReplayIcon from "@mui/icons-material/Replay";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";
import DownloadIcon from "@mui/icons-material/Download";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ReplayCircleFilledIcon from "@mui/icons-material/ReplayCircleFilled";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import ReceiptIcon from "@mui/icons-material/Receipt";
import TableChartIcon from "@mui/icons-material/TableChart";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { getInvoice } from "../../api/admin/billing.api";
import DataTable from "../../components/common/DataTable";
import CompactFilterBar from "../../components/common/CompactFilterBar";
import QuickDateRangeFilter from "../../components/admin/QuickDateRangeFilter";
import CollectPaymentModal from "../../components/admin/modals/CollectPaymentModal";
import PaymentDetailModal from "../../components/admin/modals/PaymentDetailModal";
import InvoiceDetailModal from "../../components/admin/modals/InvoiceDetailModal";
import PatientDetailModal from "../../components/admin/modals/PatientDetailModal";
import { usePayments, useAdminPaymentMutations, usePatientUnpaidInvoices, usePaymentSummaryStats } from "../../hooks/admin/usePayments";
import ExternalIncomeTab from "./ExternalIncomeTab";
import { searchPatients } from "../../api/admin/patients.api";
import AddPaymentModal from "../../components/admin/modals/AddPaymentModal";
import { downloadInvoicePDF } from "../../utils/downloadInvoicePDF";
import { exportPaymentsPdf, exportCombined } from "../../api/admin/payments.api";
import { usePermissions } from "../../hooks/admin/usePermissions";

const fmt = (n) => (n || 0).toLocaleString("en-IN");

/** Stats Card — mirrors Dashboard's StatsCard visual style. */
const StatsCard = ({ title, value, icon: Icon, iconBg, iconColor, loading, sub }) => (
  <Card elevation={0} className="h-full rounded-xl! border border-gray-100 shadow-xs!">
    <CardContent className="flex items-center gap-4 p-5!">
      <Box className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
        <Icon className={`${iconColor} text-2xl`} />
      </Box>
      <Box>
        <Typography variant="body2" className="text-gray-500 mb-1 text-[13px] font-medium">
          {title}
        </Typography>
        {loading ? (
          <Skeleton width={60} height={32} />
        ) : (
          <Typography variant="h5" className="font-numbers font-bold text-[#003366] text-[28px]">
            {value ?? 0}
          </Typography>
        )}
        {!loading && sub && (
          <Typography variant="caption" className="text-gray-400 text-[11px]">
            {sub}
          </Typography>
        )}
      </Box>
    </CardContent>
  </Card>
);

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

// ── Category chip colors ────────────────────────────────────────────────────
const CATEGORY_COLORS = {
  Treatment: { bg: "#ede9fe", color: "#5b21b6" },
  Membership: { bg: "#fef3c7", color: "#92400e" },
  "Appointment Fee": { bg: "#dbeafe", color: "#1e40af" },
  Test: { bg: "#dcfce7", color: "#166534" },
  Medicine: { bg: "#fce7f3", color: "#9d174d" },
  Other: { bg: "#f3f4f6", color: "#374151" },
};

// ── Label maps (static, used inside columns) ─────────────────────────────────
const MODE_LABELS = {
  cash: "Cash",
  card: "Card",
  upi: "UPI",
  razorpay: "Razorpay",
  netbanking: "Net Banking",
  other: "Other",
};

const TYPE_LABELS = {
  opd_fee: "Appointment Fee",
  consultation: "Consultation",
  treatment: "Treatment",
  test: "Test",
  invoice_payment: "Invoice Payment",
  advance: "Advance",
  membership: "Membership",
  refund: "Refund",
  other: "Other",
};

const TYPE_CHIP_COLORS = {
  "Appointment Fee": { bg: "#dbeafe", color: "#1e40af" },
  "Consultation":    { bg: "#ede9fe", color: "#5b21b6" },
  "Treatment":       { bg: "#dcfce7", color: "#166534" },
  "Test":            { bg: "#fce7f3", color: "#9d174d" },
  "Invoice Payment": { bg: "#f3f4f6", color: "#374151" },
  "Advance":         { bg: "#fef9c3", color: "#713f12" },
  "Membership":      { bg: "#fef3c7", color: "#92400e" },
  "Refund":          { bg: "#fef2f2", color: "#991b1b" },
};

const MODE_CHIP_COLORS = {
  cash:       { bg: "#dcfce7", color: "#166534" },
  upi:        { bg: "#ede9fe", color: "#5b21b6" },
  card:       { bg: "#dbeafe", color: "#1e40af" },
  razorpay:   { bg: "#fdf4ff", color: "#6b21a8" },
  netbanking: { bg: "#fef3c7", color: "#92400e" },
  other:      { bg: "#f3f4f6", color: "#374151" },
};

const filterOptions = [
  {
    key: "paymentMode",
    label: "Mode",
    options: [
      { value: "cash",       label: "Cash" },
      { value: "card",       label: "Card" },
      { value: "upi",        label: "UPI" },
      { value: "razorpay",   label: "Razorpay" },
      { value: "netbanking", label: "Net Banking" },
      { value: "other",      label: "Other" },
    ],
  },
  {
    key: "type",
    label: "Type",
    options: [
      { value: "opd_fee",         label: "Appointment Fee" },
      { value: "consultation",    label: "Consultation" },
      { value: "treatment",       label: "Treatment" },
      { value: "test",            label: "Test" },
      { value: "invoice_payment", label: "Invoice" },
      { value: "advance",         label: "Advance" },
      { value: "membership",      label: "Membership" },
    ],
  },
];

const Payments = () => {
  // ── Patient search state ───────────────────────────────────────────────────
  const [patientQuery, setPatientQuery] = useState("");
  const [patientOptions, setPatientOptions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // ── Collect payment modal state ────────────────────────────────────────────
  const { hasPermission } = usePermissions();
  const [collectOpen, setCollectOpen] = useState(false);
  const [collectInvoice, setCollectInvoice] = useState(null);

  // ── Payment history table state ────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({});
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  // ── Patient / Invoice detail modal state ─────────────────────────────────
  const [patientForModal, setPatientForModal] = useState(null);
  const [patientModalOpen, setPatientModalOpen] = useState(false);
  const [invoiceForModal, setInvoiceForModal] = useState(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);

  // ── Active tab: 0 = Paid, 1 = Refunded & Voided, 2 = Another Source ─────
  const [activeTab, setActiveTab] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [exportAllAnchor, setExportAllAnchor] = useState(null);
  const [exportingAll, setExportingAll] = useState(false);

  // ── PDF preview dialog state ──────────────────────────────────────────────
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [pdfFilename, setPdfFilename] = useState("");

  // ── Reversal state ─────────────────────────────────────────────────────────
  const [reverseDialogOpen, setReverseDialogOpen] = useState(false);
  const [reversalPayment, setReversalPayment] = useState(null);
  const [reversalReason, setReversalReason] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const { reversePayment, isReversing } = useAdminPaymentMutations();

  // ── Unpaid invoices (React Query, enabled only when patient selected) ───────
  const {
    data: unpaidData,
    isLoading: loadingUnpaid,
  } = usePatientUnpaidInvoices(selectedPatient?._id);

  // ── Payment history ────────────────────────────────────────────────────────
  const activeStatus = activeTab === 0 ? "paid" : "refunded,refund_pending,reversed";
  const { data, isLoading, refetch } = usePayments({
    page,
    limit,
    search,
    status: activeStatus,
    ...filters,
    ...(fromDate && { from: fromDate }),
    ...(toDate && { to: toDate }),
  });

  const payments = data?.data || [];
  const pagination = data?.pagination || { total: 0 };

  // ── Patient search ─────────────────────────────────────────────────────────
  const fetchPatients = useCallback(async (q) => {
    setSearchLoading(true);
    try {
      const res = await searchPatients(q);
      setPatientOptions(res?.data?.patients || []);
    } catch {
      setPatientOptions([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients("");
  }, [fetchPatients]);

  useEffect(() => {
    const timer = setTimeout(() => fetchPatients(patientQuery), 300);
    return () => clearTimeout(timer);
  }, [patientQuery, fetchPatients]);

  const handlePatientChange = (_, newValue) => {
    setSelectedPatient(newValue);
  };

  // ── Payment history handlers ───────────────────────────────────────────────
  const handleTabChange = (_, newTab) => {
    setActiveTab(newTab);
    setPage(1);
  };

  const handleExportPdf = async () => {
    setExporting(true);
    try {
      const params = {
        status: activeStatus,
        ...filters,
        ...(fromDate && { from: fromDate }),
        ...(toDate && { to: toDate }),
      };
      const blob = await exportPaymentsPdf(params);
      const url = window.URL.createObjectURL(blob);
      const filename = `payment-history-${activeStatus}-${new Date().toISOString().split("T")[0]}.pdf`;
      setPdfPreviewUrl(url);
      setPdfFilename(filename);
      setPdfPreviewOpen(true);
    } catch (err) {
      console.error("Export failed:", err);
      setSnackbar({ open: true, message: "Failed to export PDF. Please try again.", severity: "error" });
    } finally {
      setExporting(false);
    }
  };

  const handlePreviewClose = () => {
    setPdfPreviewOpen(false);
    if (pdfPreviewUrl) {
      window.URL.revokeObjectURL(pdfPreviewUrl);
      setPdfPreviewUrl(null);
    }
    setPdfFilename("");
  };

  const handlePreviewDownload = () => {
    const a = document.createElement("a");
    a.href = pdfPreviewUrl;
    a.download = pdfFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleExportAll = async (format) => {
    setExportAllAnchor(null);
    setExportingAll(true);
    try {
      const params = {
        format,
        ...(fromDate && { from: fromDate }),
        ...(toDate && { to: toDate }),
      };
      const blob = await exportCombined(params);
      const today = new Date().toISOString().split("T")[0];
      const ext = format === "csv" ? "csv" : "pdf";
      const filename = `payment-history-all-${today}.${ext}`;
      if (format === "pdf") {
        const url = window.URL.createObjectURL(blob);
        setPdfPreviewUrl(url);
        setPdfFilename(filename);
        setPdfPreviewOpen(true);
      } else {
        const url = window.URL.createObjectURL(new Blob([blob], { type: "text/csv;charset=utf-8;" }));
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Combined export failed:", err);
      setSnackbar({ open: true, message: "Combined export failed. Please try again.", severity: "error" });
    } finally {
      setExportingAll(false);
    }
  };

  const handleSearch = (value) => {
    setSearch(value);
    setPage(1);
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
    setPage(1);
  };

  const handleReset = () => {
    setSearch("");
    setFilters({});
    setFromDate("");
    setToDate("");
    setPage(1);
  };

  const handleRowClick = (payment) => {
    setSelectedPayment(payment);
    setDetailModalOpen(true);
  };

  // ── Reversal ───────────────────────────────────────────────────────────────
  const handleReverseConfirm = async () => {
    if (!reversalPayment || !reversalReason.trim()) return;
    const payNum = reversalPayment.paymentNumber || "Payment";
    try {
      await reversePayment({ paymentId: reversalPayment._id, reason: reversalReason.trim() });
      setReverseDialogOpen(false);
      setReversalPayment(null);
      setReversalReason("");
      setSnackbar({
        open: true,
        message: `${payNum} reversed successfully.`,
        severity: "success",
      });
      refetch();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err?.response?.data?.message || "Failed to reverse payment.",
        severity: "error",
      });
    }
  };

  // Returns a human-readable service label — treatmentName wins over generic type
  const getServiceLabel = (row) => row.treatmentName || TYPE_LABELS[row.type] || row.type || "—";

  // Columns defined inside the component so render fns can close over state setters
  const allColumns = [
    // 1. Receipt No.
    {
      field: "paymentNumber",
      headerName: "Receipt No.",
      minWidth: 180,
      render: (value, row) => (
        <Box className="flex items-center gap-1 flex-wrap">
          <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: 700, color: "#16a34a" }}>
            {value || "—"}
          </Typography>
          {row.status === "refund_pending" && (
            <Tooltip title="Razorpay refund failed — needs manual confirmation" placement="top">
              <Chip
                label="Pending"
                size="small"
                sx={{ bgcolor: "#fef3c7", color: "#92400e", fontWeight: 700, fontSize: 10, height: 18, cursor: "help" }}
              />
            </Tooltip>
          )}
          {row.status === "refunded" && activeTab === 1 && (
            <Tooltip title="Money returned to patient" placement="top">
              <Chip
                label="Refunded"
                size="small"
                color="success"
                sx={{ fontWeight: 700, fontSize: 10, height: 18, cursor: "help" }}
              />
            </Tooltip>
          )}
          {row.status === "reversed" && activeTab === 1 && (
            <Tooltip title="Data entry correction — no money changed hands" placement="top">
              <Chip
                label="Voided"
                size="small"
                sx={{ bgcolor: "#f3f4f6", color: "#374151", fontWeight: 700, fontSize: 10, height: 18, cursor: "help" }}
              />
            </Tooltip>
          )}
        </Box>
      ),
    },
    // 2. Date & Time
    {
      field: "paidAt",
      headerName: "Date & Time",
      minWidth: 160,
      render: (value, row) => (
        <Typography variant="body2" sx={{ fontSize: 13 }}>
          {new Date(value || row.createdAt).toLocaleString("en-IN", {
            day: "2-digit", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit",
          })}
        </Typography>
      ),
    },
    // 3. Patient — click opens PatientDetailModal
    {
      field: "patient",
      headerName: "Patient",
      minWidth: 180,
      render: (value) => (
        <Box
          className="flex items-center gap-2 cursor-pointer"
          onClick={(e) => { e.stopPropagation(); setPatientForModal(value); setPatientModalOpen(true); }}
        >
          <Avatar sx={{ width: 28, height: 28, fontSize: "0.75rem", bgcolor: "#dcfce7", color: "#16a34a" }}>
            {value?.name?.[0]?.toUpperCase() || "P"}
          </Avatar>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.3 }} className="hover:underline">
              {value?.name || "Unknown"}
            </Typography>
            <Typography variant="caption" className="text-gray-500">{value?.phone || ""}</Typography>
          </Box>
        </Box>
      ),
    },
    // 4. Invoice No. — click opens InvoiceDetailModal
    {
      field: "invoice",
      headerName: "Invoice No.",
      minWidth: 150,
      render: (value) => {
        if (!value?.invoiceNumber)
          return <Typography variant="body2" sx={{ color: "#9ca3af" }}>—</Typography>;
        return (
          <Typography
            variant="body2"
            sx={{ fontFamily: "monospace", fontWeight: 700, color: "#4338ca", cursor: "pointer" }}
            className="hover:underline"
            onClick={(e) => { e.stopPropagation(); setInvoiceForModal(value); setInvoiceModalOpen(true); }}
          >
            {value.invoiceNumber}
          </Typography>
        );
      },
    },
    // 5. Treatment / Service
    {
      field: "type",
      headerName: "Treatment/Service",
      minWidth: 165,
      render: (_value, row) => {
        const label = getServiceLabel(row);
        const style = TYPE_CHIP_COLORS[label] || { bg: "#f3f4f6", color: "#374151" };
        return (
          <Box component="span" sx={{
            px: 1, py: 0.3, bgcolor: style.bg, color: style.color,
            borderRadius: "4px", fontSize: 12, fontWeight: 600, display: "inline-block",
          }}>
            {label}
          </Box>
        );
      },
    },
    // 6. Amount Paid
    {
      field: "amount",
      headerName: "Amount Paid",
      minWidth: 120,
      align: "right",
      render: (value) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: "#16a34a" }}>
          ₹{fmt(value)}
        </Typography>
      ),
    },
    // 7. Payment Mode
    {
      field: "paymentMode",
      headerName: "Mode",
      minWidth: 120,
      render: (value) => {
        const style = MODE_CHIP_COLORS[value] || { bg: "#f3f4f6", color: "#374151" };
        return (
          <Box component="span" sx={{
            px: 1, py: 0.3, bgcolor: style.bg, color: style.color,
            borderRadius: "4px", fontSize: 12, fontWeight: 600, display: "inline-block",
          }}>
            {MODE_LABELS[value] || value || "—"}
          </Box>
        );
      },
    },
    // Actions
    {
      field: "_id",
      headerName: "Actions",
      minWidth: 120,
      align: "center",
      render: (_value, row) => (
        <Box sx={{ display: "flex", gap: 0.5, justifyContent: "center" }}>
          {/* View payment details — always visible */}
          <Tooltip title="View Payment Details">
            <IconButton size="small" sx={{ color: "#4338ca" }} onClick={(e) => {
              e.stopPropagation();
              setSelectedPayment(row);
              setDetailModalOpen(true);
            }}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {/* Download invoice PDF — only when a linked invoice exists */}
          {row.invoice?._id && (
            <Tooltip title="Download Invoice PDF">
              <IconButton size="small" sx={{ color: "#6b7280" }} onClick={async (e) => {
                e.stopPropagation();
                try {
                  const res = await getInvoice(row.invoice._id);
                  const fullInvoice = res?.data?.invoice || res?.data;
                  if (fullInvoice) await downloadInvoicePDF(fullInvoice);
                } catch (err) {
                  console.error("Invoice PDF download failed:", err);
                }
              }}>
                <PrintIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {/* Process Refund — opens PaymentDetailModal (refund form pre-available) */}
          {row.status === "paid" && !row.settledInvoices?.length && (
            <Tooltip title="Process Refund">
              <IconButton size="small" sx={{ color: "#dc2626" }} onClick={(e) => {
                e.stopPropagation();
                setSelectedPayment(row);
                setDetailModalOpen(true);
              }}>
                <ReplayIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {/* Confirm Manual Refund — for refund_pending rows (Razorpay API previously failed) */}
          {row.status === "refund_pending" && (
            <Tooltip title="Confirm manual refund (Razorpay failed)">
              <IconButton size="small" sx={{ color: "#ea580c" }} onClick={(e) => {
                e.stopPropagation();
                setSelectedPayment(row);
                setDetailModalOpen(true);
              }}>
                <ReplayIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {/* Reverse — for admin-recorded payments that settled multiple invoices */}
          {!row.reversed && row.status !== "reversed" && !!row.settledInvoices?.length && (
            <Tooltip title="Reverse Payment">
              <IconButton size="small" color="error" onClick={(e) => {
                e.stopPropagation();
                setReversalPayment(row);
                setReversalReason("");
                setReverseDialogOpen(true);
              }}>
                <UndoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ];

  // ── Refunded-tab extra columns ─────────────────────────────────────────────
  const refundedOnCol = {
    field: "_refundedAt",
    headerName: "Actioned On",
    minWidth: 140,
    render: (_, row) => {
      const ts = row.status === "reversed" ? row.reversedAt : row.refund?.refundedAt;
      return (
        <Typography variant="body2" sx={{ fontSize: 13 }}>
          {ts
            ? new Date(ts).toLocaleDateString("en-IN", {
                day: "2-digit", month: "short", year: "numeric",
              })
            : "—"}
        </Typography>
      );
    },
  };

  const refundReasonCol = {
    field: "_refundReason",
    headerName: "Reason",
    minWidth: 200,
    render: (_, row) => {
      const reason = row.status === "reversed" ? row.reversalReason : row.refund?.reason;
      return reason ? (
        <Tooltip title={reason} placement="top">
          <Typography variant="body2" sx={{
            fontSize: 13,
            maxWidth: 190,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            display: "block",
          }}>
            {reason}
          </Typography>
        </Tooltip>
      ) : (
        <Typography variant="body2" sx={{ color: "#9ca3af" }}>—</Typography>
      );
    },
  };

  // For the Refunded tab, splice in the two extra columns before Actions
  const columns = activeTab === 1
    ? [...allColumns.slice(0, 7), refundedOnCol, refundReasonCol, allColumns[7]]
    : allColumns;

  // ── Unpaid invoice data ────────────────────────────────────────────────────
  const unpaidInvoices = unpaidData?.invoices || [];
  const patientInfo = unpaidData?.patient || {};
  const totalPending = unpaidData?.totalPending || 0;

  const { data: summaryStatsData, isLoading: summaryStatsLoading } = usePaymentSummaryStats({
    ...(fromDate && { from: fromDate }),
    ...(toDate && { to: toDate }),
  });
  const summaryStats = summaryStatsData?.data || {};

  return (
    <Box sx={{ minHeight: "100vh" }}>
      {/* ── SUMMARY CARDS — computed from the Payment collection only ──────── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatsCard
            title="Total Collected"
            value={`₹${fmt(summaryStats.totalCollected)}`}
            icon={TrendingUpIcon}
            iconBg="bg-green-50"
            iconColor="text-green-500"
            loading={summaryStatsLoading}
            sub={
              summaryStats.externalIncome > 0
                ? `incl. ₹${fmt(summaryStats.externalIncome)} external income`
                : undefined
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatsCard
            title="Total Refunded"
            value={`₹${fmt(summaryStats.totalRefunded)}`}
            icon={ReplayCircleFilledIcon}
            iconBg="bg-amber-50"
            iconColor="text-amber-500"
            loading={summaryStatsLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatsCard
            title="Net Collection"
            value={`₹${fmt(summaryStats.netCollection)}`}
            icon={AccountBalanceWalletIcon}
            iconBg="bg-blue-50"
            iconColor="text-[#003366]"
            loading={summaryStatsLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatsCard
            title="Transactions"
            value={summaryStats.transactionCount}
            icon={ReceiptIcon}
            iconBg="bg-gray-100"
            iconColor="text-gray-500"
            loading={summaryStatsLoading}
          />
        </Grid>
      </Grid>

      {/* ── HEADER + PATIENT SEARCH (one row) ──────────────────────────────── */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#1f2937", whiteSpace: "nowrap" }}>Payment History</Typography>
        <PersonSearchIcon sx={{ color: "#6b7280", fontSize: 18, flexShrink: 0 }} />
        <Autocomplete
          options={patientOptions}
          getOptionLabel={(opt) => opt?.name || ""}
          isOptionEqualToValue={(option, value) => option._id === value._id}
          filterOptions={(x) => x}
          loading={searchLoading}
          value={selectedPatient}
          onChange={handlePatientChange}
          inputValue={patientQuery}
          onInputChange={(_, val, reason) => {
            if (reason !== "reset") setPatientQuery(val);
          }}
          noOptionsText={searchLoading ? "Searching…" : "No patients found"}
          renderOption={(props, option) => (
            <Box component="li" {...props} key={option._id}>
              <Box>
                <Typography variant="body2" fontWeight={600}>
                  {option.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {option.phone || "—"}
                  {option.email ? ` · ${option.email}` : ""}
                </Typography>
              </Box>
            </Box>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Type patient name or phone…"
              size="small"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {searchLoading ? <CircularProgress size={16} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          sx={{ flex: 1, maxWidth: 400, "& .MuiInputBase-root": { height: 36, fontSize: "13px" } }}
        />
      </Box>

      {/* ── UNPAID INVOICES SECTION (shown after patient selected) ────────── */}
      {selectedPatient && (
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent sx={{ pb: "12px !important", pt: 1.5, px: 2 }}>
            {loadingUnpaid ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 2 }}>
                <CircularProgress size={20} />
                <Typography variant="body2" color="text.secondary">
                  Loading invoices…
                </Typography>
              </Box>
            ) : (
              <>
                {/* Patient header */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: 2,
                    mb: 2,
                  }}
                >
                  <Box>
                    <Typography variant="h6" fontWeight={700} sx={{ fontSize: 16 }}>
                      {patientInfo.name || selectedPatient.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {patientInfo.phone || selectedPatient.phone || "—"}
                    </Typography>
                  </Box>
                  {totalPending > 0 && (
                    <Box sx={{ textAlign: "right" }}>
                      <Typography variant="caption" color="text.secondary">
                        Total Pending
                      </Typography>
                      <Typography
                        variant="h5"
                        fontWeight={700}
                        sx={{ color: "#dc2626", lineHeight: 1.2 }}
                      >
                        ₹{fmt(totalPending)}
                      </Typography>
                    </Box>
                  )}
                </Box>

                {unpaidInvoices.length === 0 ? (
                  <Box
                    sx={{
                      textAlign: "center",
                      py: 4,
                      color: "#6b7280",
                      bgcolor: "#f9fafb",
                      borderRadius: 1.5,
                    }}
                  >
                    <Typography variant="h6" sx={{ mb: 0.5 }}>
                      ✅ All invoices are paid
                    </Typography>
                    <Typography variant="body2">
                      {patientInfo.name || selectedPatient.name} has no outstanding balance.
                    </Typography>
                  </Box>
                ) : (
                  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: "#f9fafb" }}>
                          <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>Invoice #</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>Date</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>Category</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: 13 }} align="right">
                            Total
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: 13 }} align="right">
                            Paid
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: 13 }} align="right">
                            Balance Due
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: 13 }} align="center">
                            Action
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {unpaidInvoices.map((inv) => {
                          const catStyle =
                            CATEGORY_COLORS[inv.category] || CATEGORY_COLORS.Other;
                          return (
                            <TableRow
                              key={inv._id}
                              sx={{ "&:last-child td": { border: 0 } }}
                            >
                              <TableCell>
                                <Typography
                                  variant="body2"
                                  fontWeight={700}
                                  sx={{ fontFamily: "monospace", color: "#4338ca" }}
                                >
                                  {inv.invoiceNumber}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontSize: 13 }}>
                                  {formatDate(inv.date)}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Box
                                  component="span"
                                  sx={{
                                    px: 1,
                                    py: 0.3,
                                    bgcolor: catStyle.bg,
                                    color: catStyle.color,
                                    borderRadius: "4px",
                                    fontSize: 12,
                                    fontWeight: 600,
                                  }}
                                >
                                  {inv.category}
                                </Box>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" sx={{ fontSize: 13 }}>
                                  ₹{fmt(inv.totalAmount)}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography
                                  variant="body2"
                                  sx={{ fontSize: 13, color: "#16a34a", fontWeight: 600 }}
                                >
                                  ₹{fmt(inv.amountPaid)}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography
                                  variant="body2"
                                  fontWeight={700}
                                  sx={{ color: "#dc2626", fontSize: 14 }}
                                >
                                  ₹{fmt(inv.balanceDue)}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                {hasPermission("payments", "create") && (
                                  <Button
                                    variant="contained"
                                    size="small"
                                    onClick={() => {
                                      setCollectInvoice(inv);
                                      setCollectOpen(true);
                                    }}
                                    sx={{
                                      bgcolor: "#f59e0b",
                                      color: "#fff",
                                      fontWeight: 700,
                                      fontSize: 12,
                                      px: 1.5,
                                      "&:hover": { bgcolor: "#d97706" },
                                    }}
                                  >
                                    Collect Payment
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── PAID / REFUNDED TABS ─────────────────────────────────────────── */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{
            minHeight: 36,
            "& .MuiTab-root": {
              minHeight: 36,
              py: 0.5,
              px: 1.5,
              fontSize: "0.75rem",
              fontWeight: 600,
              textTransform: "none",
              minWidth: 0,
            },
          }}
        >
          <Tab label="Paid" />
          <Tab label="Refunded & Voided" />
          <Tab label="Another Source" />
        </Tabs>
        <Box sx={{ display: "flex", gap: 0.75, alignItems: "center", mb: 0.5 }}>
          {/* Per-tab export — unchanged */}
          <Button
            size="small"
            variant="outlined"
            startIcon={exporting ? <CircularProgress size={14} /> : <DownloadIcon fontSize="small" />}
            onClick={handleExportPdf}
            disabled={exporting || exportingAll}
            sx={{
              fontSize: "0.75rem",
              fontWeight: 600,
              textTransform: "none",
              borderColor: "#d1d5db",
              color: "#374151",
              "&:hover": { borderColor: "#9ca3af", bgcolor: "#f9fafb" },
            }}
          >
            {exporting ? "Loading…" : "Export PDF"}
          </Button>

          {/* Combined export — all tabs at once */}
          <Button
            size="small"
            variant="contained"
            startIcon={exportingAll ? <CircularProgress size={14} color="inherit" /> : <TableChartIcon fontSize="small" />}
            endIcon={<ArrowDropDownIcon fontSize="small" />}
            onClick={(e) => setExportAllAnchor(e.currentTarget)}
            disabled={exportingAll || exporting}
            sx={{
              fontSize: "0.75rem",
              fontWeight: 600,
              textTransform: "none",
              bgcolor: "#1e40af",
              "&:hover": { bgcolor: "#1d3a9e" },
              "&:disabled": { bgcolor: "#93c5fd", color: "#fff" },
            }}
          >
            {exportingAll ? "Exporting…" : "Export All"}
          </Button>
          <Menu
            anchorEl={exportAllAnchor}
            open={Boolean(exportAllAnchor)}
            onClose={() => setExportAllAnchor(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            PaperProps={{ sx: { minWidth: 180, mt: 0.5 } }}
          >
            <MenuItem dense onClick={() => handleExportAll("csv")}>
              <ListItemIcon sx={{ minWidth: 32 }}><TableChartIcon fontSize="small" /></ListItemIcon>
              Download CSV
            </MenuItem>
            <MenuItem dense onClick={() => handleExportAll("pdf")}>
              <ListItemIcon sx={{ minWidth: 32 }}><DownloadIcon fontSize="small" /></ListItemIcon>
              Preview &amp; Download PDF
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* Tab 2: Another Source — ExternalIncomeTab handles its own list/stats */}
      {activeTab === 2 ? (
        <ExternalIncomeTab fromDate={fromDate} toDate={toDate} />
      ) : (
        <>
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
            searchPlaceholder="Search by payment number or patient…"
            filters={filterOptions}
            filterValues={filters}
            onFilterChange={handleFilterChange}
            onRefresh={handleReset}
          />

          <DataTable
            columns={columns}
            data={payments}
            loading={isLoading}
            getRowStyle={(row) =>
              row.reversed || row.status === "reversed" ? { opacity: 0.55 } : undefined
            }
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
            emptyMessage={activeTab === 0 ? "No paid payments found" : "No refunded or voided payments found"}
          />
        </>
      )}

      {/* ── COLLECT PAYMENT MODAL ─────────────────────────────────────────── */}
      <CollectPaymentModal
        open={collectOpen}
        onClose={() => {
          setCollectOpen(false);
          setCollectInvoice(null);
        }}
        invoice={collectInvoice}
        patient={
          unpaidData?.patient || {
            name: selectedPatient?.name,
            phone: selectedPatient?.phone,
          }
        }
        onSuccess={(msg) => {
          setSnackbar({ open: true, message: msg, severity: "success" });
          refetch();
        }}
      />

      {/* ── ADD PAYMENT MODAL (legacy, keep for record button elsewhere) ─── */}
      <AddPaymentModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={() => refetch()}
      />

      {/* ── PAYMENT DETAIL MODAL ─────────────────────────────────────────── */}
      <PaymentDetailModal
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedPayment(null);
        }}
        payment={selectedPayment}
        onRefund={() => refetch()}
        onDelete={() => {
          setDetailModalOpen(false);
          setSelectedPayment(null);
          refetch();
        }}
      />

      {/* ── INVOICE DETAIL MODAL ─────────────────────────────────────────── */}
      <InvoiceDetailModal
        open={invoiceModalOpen}
        onClose={() => { setInvoiceModalOpen(false); setInvoiceForModal(null); }}
        invoice={invoiceForModal}
        onRefresh={refetch}
      />

      {/* ── PATIENT DETAIL MODAL ─────────────────────────────────────────── */}
      <PatientDetailModal
        open={patientModalOpen}
        onClose={() => { setPatientModalOpen(false); setPatientForModal(null); }}
        patient={patientForModal}
      />

      {/* ── PDF PREVIEW DIALOG ────────────────────────────────────────────── */}
      <Dialog
        open={pdfPreviewOpen}
        onClose={handlePreviewClose}
        maxWidth={false}
        PaperProps={{
          sx: {
            width: "90vw",
            height: "90vh",
            m: 2,
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        <DialogTitle
          sx={{
            py: 1.5,
            px: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <Typography variant="subtitle1" fontWeight={700}>
            PDF Preview
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 0, flex: 1, minHeight: 0, overflow: "hidden" }}>
          {pdfPreviewUrl && (
            <iframe
              src={pdfPreviewUrl}
              style={{ width: "100%", height: "100%", border: "none", display: "block" }}
              title="Payment History PDF Preview"
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1.5, borderTop: "1px solid #e5e7eb", flexShrink: 0 }}>
          <Button onClick={handlePreviewClose} color="inherit" sx={{ textTransform: "none" }}>
            Close
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handlePreviewDownload}
            sx={{ textTransform: "none", bgcolor: "#16a34a", "&:hover": { bgcolor: "#15803d" } }}
          >
            Download
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── REVERSAL CONFIRM DIALOG ───────────────────────────────────────── */}
      <Dialog
        open={reverseDialogOpen}
        onClose={() => !isReversing && setReverseDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Reverse Payment</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          {reversalPayment && (
            <Box sx={{ bgcolor: "#f3f4f6", borderRadius: 1.5, p: 1.5, mb: 2 }}>
              <Typography variant="body2" fontWeight={700} sx={{ mb: 0.25 }}>
                {reversalPayment.paymentNumber} &bull; ₹
                {fmt(reversalPayment.amount)} &bull;{" "}
                {reversalPayment.patient?.name || "Unknown"}
                {reversalPayment.patient?.phone
                  ? ` — ${reversalPayment.patient.phone}`
                  : ""}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {reversalPayment.paidAt
                  ? new Date(reversalPayment.paidAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "—"}{" "}
                &bull; Mode:{" "}
                {reversalPayment.paymentMode
                  ? reversalPayment.paymentMode.charAt(0).toUpperCase() +
                    reversalPayment.paymentMode.slice(1)
                  : "—"}
              </Typography>
            </Box>
          )}
          <Typography
            variant="body2"
            sx={{
              mb: 2,
              color: "#b45309",
              bgcolor: "#fffbeb",
              border: "1px solid #fde68a",
              borderRadius: 1,
              p: 1.5,
            }}
          >
            ⚠️ This will undo all invoice settlements from this payment and restore previous
            balances.
          </Typography>
          <TextField
            label="Reason for reversal *"
            fullWidth
            multiline
            rows={2}
            size="small"
            value={reversalReason}
            onChange={(e) => setReversalReason(e.target.value)}
            placeholder="e.g. Payment recorded by mistake"
            disabled={isReversing}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => setReverseDialogOpen(false)}
            disabled={isReversing}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleReverseConfirm}
            disabled={!reversalReason.trim() || isReversing}
            startIcon={isReversing ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{
              bgcolor: "#dc2626",
              "&:hover": { bgcolor: "#b91c1c" },
              "&:disabled": { bgcolor: "#fca5a5" },
            }}
          >
            {isReversing ? "Reversing…" : "Reverse Payment"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── SNACKBAR ────────────────────────────────────────────────────────── */}
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

export default Payments;

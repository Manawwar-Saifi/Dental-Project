import { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  Paper,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Snackbar,
  Alert,
  CircularProgress,
  Divider,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import BlockIcon from "@mui/icons-material/Block";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import MoneyOffIcon from "@mui/icons-material/MoneyOff";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import QuickDateRangeFilter from "../../components/admin/QuickDateRangeFilter";
import DataTable from "../../components/common/DataTable";
import {
  useExpenses,
  useExpenseStaff,
  useCreateExpense,
  useUpdateExpense,
  useVoidExpense,
  usePermanentDeleteExpense,
  useProfitLoss,
} from "../../hooks/admin/useExpenses";
import { useAdminStore } from "../../store/admin.store";
import { usePermissions } from "../../hooks/admin/usePermissions";
import { exportExpensesCsv, exportExpensesPdf } from "../../api/admin/expenses.api";
import DownloadIcon from "@mui/icons-material/Download";

// ── Constants ──────────────────────────────────────────────────────────────────

// Categories where a vendor/supplier name is meaningful.
// For salaries, rent, utilities, other — vendor doesn't apply.
const VENDOR_CATEGORIES = new Set(["lab", "materials", "equipment", "marketing"]);

// ── Helpers ────────────────────────────────────────────────────────────────────

const INR = (v) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v || 0);

const fmtDate = (val) =>
  val
    ? new Date(val).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "-";

const CATEGORY_LABELS = {
  lab: "Lab",
  salaries: "Salaries",
  rent: "Rent",
  utilities: "Utilities",
  materials: "Materials",
  equipment: "Equipment",
  marketing: "Marketing",
  other: "Other",
};

const CATEGORY_COLORS = {
  lab: "info",
  salaries: "primary",
  rent: "warning",
  utilities: "secondary",
  materials: "success",
  equipment: "default",
  marketing: "error",
  other: "default",
};

const PAYMENT_MODE_LABELS = {
  cash: "Cash",
  upi: "UPI",
  net_banking: "Net Banking",
  card: "Card",
  cheque: "Cheque",
  other: "Other",
};

const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }));
const PAYMENT_MODE_OPTIONS = Object.entries(PAYMENT_MODE_LABELS).map(([value, label]) => ({ value, label }));

const EMPTY_FORM = {
  date: new Date().toISOString().slice(0, 10),
  category: "",
  description: "",
  amount: "",
  paymentMode: "",
  spentBy: "",
  vendor: "",
  notes: "",
};

// ── Stats card ─────────────────────────────────────────────────────────────────
// `positive` (bool | undefined): when provided, colors the icon bg and value
// text green (true) or red (false) and adds a matching border — mirrors the
// HeadlineCard treatment on the P&L page. Omit for a neutral colored card.

const StatCard = ({ icon: Icon, label, value, color, sub, positive }) => {
  const hasSign = positive !== undefined;
  const iconBg = hasSign ? (positive ? "#22c55e" : "#ef4444") : color;
  const valueColor = hasSign ? (positive ? "success.main" : "error.main") : "text.primary";

  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        borderColor: hasSign ? (positive ? "success.light" : "error.light") : undefined,
      }}
    >
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: iconBg,
              flexShrink: 0,
            }}
          >
            <Icon sx={{ color: "#fff", fontSize: 20 }} />
          </Box>
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontFamily: '"Inter", "DM Sans", sans-serif' }}
            >
              {label}
            </Typography>
            <Typography
              variant="h6"
              fontWeight={700}
              lineHeight={1.2}
              color={valueColor}
              className="font-numbers"
              sx={{ fontFeatureSettings: '"tnum"' }}
            >
              {value}
            </Typography>
            {sub && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontFamily: '"Inter", "DM Sans", sans-serif' }}
              >
                {sub}
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

// ── Expense form modal ─────────────────────────────────────────────────────────

const ExpenseModal = ({ open, onClose, expense, staffList, currentUserId, onSaved }) => {
  const isEdit = !!expense;
  const [form, setForm] = useState(
    isEdit
      ? {
          date: expense.date ? new Date(expense.date).toISOString().slice(0, 10) : "",
          category: expense.category || "",
          description: expense.description || "",
          amount: String(expense.amount || ""),
          paymentMode: expense.paymentMode || "",
          spentBy: expense.spentBy?._id || expense.spentBy || "",
          vendor: expense.vendor || "",
          notes: expense.notes || "",
        }
      : { ...EMPTY_FORM, spentBy: currentUserId || "" }
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const createMutation = useCreateExpense();
  const updateMutation = useUpdateExpense();

  const showVendor = VENDOR_CATEGORIES.has(form.category);

  // Derive recorder name from staff list — display only, recordedBy is always server-set.
  const recorderName = staffList.find((u) => u._id === currentUserId)?.name || "you";

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  // When category changes, clear vendor if the new category doesn't use it.
  // This prevents a stale vendor from a previous category being silently saved.
  const handleCategoryChange = (newCategory) => {
    setForm((f) => ({
      ...f,
      category: newCategory,
      vendor: VENDOR_CATEGORIES.has(newCategory) ? f.vendor : "",
    }));
  };

  const handleSubmit = async () => {
    if (!form.date) return setError("Date is required");
    if (!form.category) return setError("Category is required");
    if (!form.description.trim()) return setError("Description is required");
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) return setError("Amount must be > 0");
    if (!form.paymentMode) return setError("Payment mode is required");
    if (!form.spentBy) return setError("Spent by is required");

    setError("");
    setSaving(true);
    try {
      const payload = {
        date: form.date,
        category: form.category,
        description: form.description.trim(),
        amount: Number(form.amount),
        paymentMode: form.paymentMode,
        spentBy: form.spentBy,
        // Belt-and-suspenders: never send vendor for categories that don't support it,
        // even if state somehow drifted (e.g. category changed without triggering onChange).
        vendor: VENDOR_CATEGORIES.has(form.category) ? (form.vendor.trim() || undefined) : undefined,
        notes: form.notes.trim() || undefined,
      };

      if (isEdit) {
        await updateMutation.mutateAsync({ id: expense._id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onSaved();
      onClose();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to save expense");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? "Edit Expense" : "Record Expense"}</DialogTitle>
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 0.5 }}>
          <Grid container spacing={2}>
            {/* Category first — it controls which additional fields appear */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Category *</InputLabel>
                <Select
                  value={form.category}
                  label="Category *"
                  onChange={(e) => handleCategoryChange(e.target.value)}
                >
                  {CATEGORY_OPTIONS.map((o) => (
                    <MenuItem key={o.value} value={o.value}>
                      {o.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Date *"
                type="date"
                size="small"
                fullWidth
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Description *"
                size="small"
                fullWidth
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="What was this expense for?"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Amount (₹) *"
                type="number"
                size="small"
                fullWidth
                value={form.amount}
                onChange={(e) => set("amount", e.target.value)}
                slotProps={{ input: { inputProps: { min: 0.01, step: 0.01 } } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Payment Mode *</InputLabel>
                <Select
                  value={form.paymentMode}
                  label="Payment Mode *"
                  onChange={(e) => set("paymentMode", e.target.value)}
                >
                  {PAYMENT_MODE_OPTIONS.map((o) => (
                    <MenuItem key={o.value} value={o.value}>
                      {o.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: showVendor ? 6 : 12 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Spent By *</InputLabel>
                <Select
                  value={form.spentBy}
                  label="Spent By *"
                  onChange={(e) => set("spentBy", e.target.value)}
                >
                  {staffList.map((u) => (
                    <MenuItem key={u._id} value={u._id}>
                      {u.name}
                      {u._id === currentUserId ? " (me)" : ""}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {/* Vendor — shown only for categories that involve an outside supplier */}
            {showVendor && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Vendor (optional)"
                  size="small"
                  fullWidth
                  value={form.vendor}
                  onChange={(e) => set("vendor", e.target.value)}
                  placeholder="Supplier / vendor name"
                />
              </Grid>
            )}
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Notes (optional)"
                size="small"
                fullWidth
                multiline
                rows={2}
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
              />
            </Grid>
            {/* Attribution line — shown in both create and edit */}
            <Grid size={{ xs: 12 }}>
              {!isEdit ? (
                <Typography variant="caption" color="text.secondary">
                  Recorded by: <strong>{recorderName}</strong> (system-assigned at save, not editable)
                </Typography>
              ) : expense.recordedBy ? (
                <Typography variant="caption" color="text.secondary">
                  Recorded by:{" "}
                  <strong>{expense.recordedBy?.name || "—"}</strong>
                  {expense.editedBy && (
                    <> · Last edited by <strong>{expense.editedBy?.name}</strong> on {fmtDate(expense.editedAt)}</>
                  )}
                </Typography>
              ) : null}
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving}>
          {saving ? <CircularProgress size={18} /> : isEdit ? "Save Changes" : "Record Expense"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ── Void dialog ────────────────────────────────────────────────────────────────

const VoidDialog = ({ expense, onClose, onVoided }) => {
  const voidMutation = useVoidExpense();
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [voiding, setVoiding] = useState(false);

  const handleVoid = async () => {
    if (!reason.trim() || reason.trim().length < 10) {
      return setError("Please enter a reason of at least 10 characters.");
    }
    setError("");
    setVoiding(true);
    try {
      await voidMutation.mutateAsync({ id: expense._id, reason: reason.trim() });
      onVoided();
      onClose();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to void expense");
      setVoiding(false);
    }
  };

  return (
    <Dialog open={!!expense} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ color: "warning.main" }}>Void Expense?</DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          Voiding removes this expense from P&L and stats. The record is preserved
          for audit and can be viewed under the "Voided" filter.
        </Alert>
        <Typography variant="body2" sx={{ mb: 2 }}>
          <strong>{fmtDate(expense?.date)}</strong> · {CATEGORY_LABELS[expense?.category]} ·{" "}
          <strong>{INR(expense?.amount)}</strong>
          <br />
          <Typography component="span" variant="caption" color="text.secondary">
            {expense?.description}
          </Typography>
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 1.5 }}>
            {error}
          </Alert>
        )}
        <TextField
          label="Void reason *"
          size="small"
          fullWidth
          multiline
          rows={2}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Why is this expense being voided? (min 10 chars)"
          helperText={`${reason.length} / 10 min`}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={voiding}>
          Cancel
        </Button>
        <Button variant="contained" color="warning" onClick={handleVoid} disabled={voiding}>
          {voiding ? <CircularProgress size={18} /> : "Void Expense"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ── Permanent delete dialog (admin only, voided expenses only) ─────────────────

const PermanentDeleteDialog = ({ expense, onClose, onDeleted }) => {
  const deleteMutation = usePermanentDeleteExpense();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setBusy(true);
    try {
      await deleteMutation.mutateAsync(expense._id);
      onDeleted();
      onClose();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to delete expense");
      setBusy(false);
    }
  };

  return (
    <Dialog open={!!expense} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ color: "error.main" }}>Delete Permanently?</DialogTitle>
      <DialogContent>
        <Alert severity="error" sx={{ mb: 2 }}>
          This cannot be undone. The record will be removed from the database
          permanently. Any historical P&amp;L report that included this expense will
          show different figures if re-generated.
        </Alert>
        <Typography variant="body2" sx={{ mb: 1 }}>
          <strong>{fmtDate(expense?.date)}</strong> · {CATEGORY_LABELS[expense?.category]} ·{" "}
          <strong>{INR(expense?.amount)}</strong>
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {expense?.description}
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mt: 1.5 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button variant="contained" color="error" onClick={handleDelete} disabled={busy}>
          {busy ? <CircularProgress size={18} /> : "Delete Permanently"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ── Main page ──────────────────────────────────────────────────────────────────

const Expenses = () => {
  const { admin } = useAdminStore();
  const { hasPermission } = usePermissions();

  // Filters
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filters, setFilters] = useState({});
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const isAdmin = admin?.role === "admin";

  // Modal state
  const [showForm, setShowForm] = useState(false);
  const [editExpense, setEditExpense] = useState(null);
  const [voidTarget, setVoidTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Snackbar
  const [snack, setSnack] = useState({ open: false, msg: "", sev: "success" });
  const showSnack = (msg, sev = "success") => setSnack({ open: true, msg, sev });

  // Export state
  const [exporting, setExporting] = useState(false);

  const isVoidedView = filters.voided === "true";

  // Query params — stats + list share the same date/filter window
  const queryParams = useMemo(() => ({
    from: fromDate || undefined,
    to: toDate || undefined,
    category: filters.category || undefined,
    paymentMode: filters.paymentMode || undefined,
    spentBy: filters.spentBy || undefined,
    voided: filters.voided || undefined,
    search: search || undefined,
    page,
    limit,
  }), [fromDate, toDate, filters, search, page]);

  // P&L params: date range only — category filter is intentionally excluded so
  // net profit always reflects the full picture, not just one filtered category.
  // This is the SAME endpoint the Profit & Loss page uses; there is no parallel
  // computation here.
  const pnlParams = useMemo(() => ({
    from: fromDate || undefined,
    to: toDate || undefined,
  }), [fromDate, toDate]);

  const { data: expenseData, isLoading } = useExpenses(queryParams);
  const { data: staffData } = useExpenseStaff();
  const { data: pnlData } = useProfitLoss(pnlParams);

  const expenses = expenseData?.data || [];
  const pagination = expenseData?.pagination || {};
  const staffList = staffData?.data?.users || [];

  // All four stat card values come from the same P&L endpoint.
  // expenses.lab   = LabOrder.paymentHistory payments + Expense docs where category === "lab"
  // expenses.other = Expense docs where category !== "lab"
  // The two are mutually exclusive: other + lab = total. Profit = Payment − other − lab.
  const totalPayment = pnlData?.data?.revenue?.net;
  const otherExpense = pnlData?.data?.expenses?.other;
  const labExpense   = pnlData?.data?.expenses?.lab;
  const netProfit    = pnlData?.data?.netProfit;
  const isProfitPositive = netProfit !== undefined ? netProfit >= 0 : undefined;
  // Lab card note: show how much of labExpense came from LabOrder payments vs Expense docs
  const labOrdersTotal = pnlData?.data?.expenses?.labOrderPayments ?? 0;

  const handleFilterChange = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };
  const handleSearch = (v) => { setSearch(v); setPage(1); };

  const handleReset = () => {
    setSearch("");
    setFilters({});
    setFromDate("");
    setToDate("");
    setPage(1);
  };

  const exportParams = useMemo(() => ({
    from: fromDate || undefined,
    to: toDate || undefined,
    category: filters.category || undefined,
    paymentMode: filters.paymentMode || undefined,
    spentBy: filters.spentBy || undefined,
    search: search || undefined,
  }), [fromDate, toDate, filters, search]);

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const blob = await exportExpensesCsv(exportParams);
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url;
      a.download = `expenses-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      showSnack("CSV export failed. Please try again.", "error");
    } finally {
      setExporting(false);
    }
  };

  const handleExportPdf = async () => {
    setExporting(true);
    try {
      const blob = await exportExpensesPdf(exportParams);
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url;
      a.download = `expenses-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      showSnack("PDF export failed. Please try again.", "error");
    } finally {
      setExporting(false);
    }
  };

  // Stat date label
  const statDateLabel = useMemo(() => {
    if (!fromDate && !toDate) return "All time";
    if (fromDate && toDate && fromDate === toDate)
      return fmtDate(fromDate);
    if (fromDate && toDate)
      return `${fmtDate(fromDate)} – ${fmtDate(toDate)}`;
    if (fromDate) return `From ${fmtDate(fromDate)}`;
    return `To ${fmtDate(toDate)}`;
  }, [fromDate, toDate]);

  const filterOptions = [
    {
      key: "category",
      label: "Category",
      options: CATEGORY_OPTIONS,
    },
    {
      key: "paymentMode",
      label: "Mode",
      options: PAYMENT_MODE_OPTIONS,
    },
    {
      key: "spentBy",
      label: "Spent By",
      options: staffList.map((u) => ({ value: u._id, label: u.name })),
    },
    {
      key: "voided",
      label: "Status",
      options: [
        { value: "", label: "Active" },
        { value: "true", label: "Voided" },
      ],
    },
  ];

  const columns = [
    {
      field: "date",
      headerName: "Date",
      minWidth: 110,
      render: (v) => fmtDate(v),
    },
    {
      field: "category",
      headerName: "Category",
      minWidth: 110,
      render: (v) => (
        <Chip
          label={CATEGORY_LABELS[v] || v}
          color={CATEGORY_COLORS[v] || "default"}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: "description",
      headerName: "Description",
      minWidth: 180,
      render: (v, row) => (
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <Typography variant="body2">{v}</Typography>
            {row.isVoided && (
              <Chip label="Voided" size="small" color="default" sx={{ height: 18, fontSize: "0.65rem" }} />
            )}
          </Box>
          {row.vendor && (
            <Typography variant="caption" color="text.secondary">
              {row.vendor}
            </Typography>
          )}
          {row.isVoided && row.voidReason && (
            <Typography variant="caption" color="text.secondary" display="block">
              Reason: {row.voidReason}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: "amount",
      headerName: "Amount",
      minWidth: 110,
      align: "right",
      render: (v, row) => (
        <Typography fontWeight={600} color={row.isVoided ? "text.disabled" : "error.main"}>
          {INR(v)}
        </Typography>
      ),
    },
    {
      field: "paymentMode",
      headerName: "Mode",
      minWidth: 100,
      render: (v) => PAYMENT_MODE_LABELS[v] || v,
    },
    {
      field: "spentBy",
      headerName: "Spent By",
      minWidth: 120,
      render: (v) => v?.name || "—",
    },
    {
      field: "recordedBy",
      headerName: "Recorded By",
      minWidth: 120,
      render: (v, row) => (
        <Box>
          <Typography variant="body2">{v?.name || "—"}</Typography>
          {row.editedBy && (
            <Tooltip title={`Last edited by ${row.editedBy?.name} on ${fmtDate(row.editedAt)}`}>
              <Typography variant="caption" color="warning.main">
                edited
              </Typography>
            </Tooltip>
          )}
        </Box>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      minWidth: 100,
      align: "center",
      render: (_v, row) => {
        if (row.isVoided) {
          // In the voided view, admin can permanently delete the record.
          if (!isAdmin) return null;
          return (
            <Tooltip title="Delete permanently">
              <IconButton size="small" color="error" onClick={() => setDeleteTarget(row)}>
                <DeleteForeverIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          );
        }
        return (
          <Box sx={{ display: "flex", gap: 0.5, justifyContent: "center" }}>
            {hasPermission("expenses", "edit") && (
              <Tooltip title="Edit">
                <IconButton size="small" onClick={() => setEditExpense(row)}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {hasPermission("expenses", "delete") && (
              <Tooltip title="Void expense">
                <IconButton size="small" color="warning" onClick={() => setVoidTarget(row)}>
                  <BlockIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
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
          <Typography variant="h5" fontWeight={700}>
            Expenses
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track clinic expenditure. Lab costs are sourced from Lab Order payments.
          </Typography>
        </Box>
        <TextField
          size="small"
          placeholder="Search description or vendor…"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          sx={{ flex: 1, minWidth: 200 }}
          autoComplete="off"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 18, color: "text.disabled" }} />
              </InputAdornment>
            ),
          }}
        />
        {!isVoidedView && (
          <Box sx={{ display: "flex", gap: 1 }}>
            <Tooltip title="Export CSV">
              <span>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={handleExportCsv}
                  disabled={exporting}
                >
                  CSV
                </Button>
              </span>
            </Tooltip>
            <Tooltip title="Export PDF">
              <span>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={handleExportPdf}
                  disabled={exporting}
                >
                  PDF
                </Button>
              </span>
            </Tooltip>
            {hasPermission("expenses", "create") && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setShowForm(true)}
              >
                Record Expense
              </Button>
            )}
          </Box>
        )}
      </Box>

      {/* Stats cards — four fixed cards, all from the same P&L endpoint.
          "Non-Lab Expenses" and "Lab Expenses" are mutually exclusive subsets of total
          expenses — they never overlap, so readers can safely add them without
          double-counting. Profit = Total Payment − Non-Lab Expenses − Lab Expenses.
          Hidden in voided view (voided records don't count in any figures). */}
      {!isVoidedView && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              icon={TrendingUpIcon}
              label="Total Payment"
              value={totalPayment !== undefined ? INR(totalPayment) : "—"}
              color="#22c55e"
              sub={statDateLabel}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              icon={MoneyOffIcon}
              label="Non-Lab Expenses"
              value={otherExpense !== undefined ? INR(otherExpense) : "—"}
              color="#ef4444"
              sub={statDateLabel}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              icon={MedicalServicesIcon}
              label="Lab Expenses"
              value={labExpense !== undefined ? INR(labExpense) : "—"}
              color="#f59e0b"
              sub={
                labExpense !== undefined && labOrdersTotal > 0
                  ? `incl. ${INR(labOrdersTotal)} from Lab Orders`
                  : statDateLabel
              }
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              icon={AccountBalanceIcon}
              label="Profit"
              value={netProfit !== undefined ? INR(netProfit) : "—"}
              color="#6366f1"
              sub={statDateLabel}
              positive={isProfitPositive}
            />
          </Grid>
        </Grid>
      )}

      {/* Voided view banner */}
      {isVoidedView && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Showing voided expenses. These records are excluded from all stats and P&L figures.
        </Alert>
      )}

      {/* Filters — date range + all dropdowns + refresh; flexWrap so nothing clips */}
      <Paper className="p-3 mb-4">
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center" }}>
          <QuickDateRangeFilter
            value={{ from: fromDate, to: toDate }}
            onChange={({ from, to }) => {
              setFromDate(from);
              setToDate(to);
              setPage(1);
            }}
          />
          {filterOptions.map((filter) => (
            <FormControl key={filter.key} size="small" sx={{ minWidth: 160 }}>
              <InputLabel>{filter.label}</InputLabel>
              <Select
                value={filters[filter.key] || ""}
                label={filter.label}
                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                {filter.options.map((option) => (
                  <MenuItem key={option.value || `_${option.label}`} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ))}
          <Tooltip title="Refresh">
            <IconButton onClick={handleReset}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      {/* Table */}
      <DataTable
        size="small"
        columns={columns}
        data={expenses}
        loading={isLoading}
        searchValue={search}
        pagination={{
          page,
          limit,
          total: pagination.total || 0,
          onPageChange: setPage,
          onLimitChange: () => { setPage(1); },
        }}
        emptyMessage={isVoidedView ? "No voided expenses found." : "No expenses recorded for this period."}
      />

      {/* Add / Edit modal */}
      {(showForm || editExpense) && (
        <ExpenseModal
          open={showForm || !!editExpense}
          onClose={() => { setShowForm(false); setEditExpense(null); }}
          expense={editExpense}
          staffList={staffList}
          currentUserId={admin?._id}
          onSaved={() => showSnack(editExpense ? "Expense updated" : "Expense recorded")}
        />
      )}

      {/* Void confirmation dialog */}
      {voidTarget && (
        <VoidDialog
          expense={voidTarget}
          onClose={() => setVoidTarget(null)}
          onVoided={() => showSnack("Expense voided", "warning")}
        />
      )}

      {/* Permanent delete dialog — admin only, voided expenses only */}
      {deleteTarget && (
        <PermanentDeleteDialog
          expense={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => showSnack("Expense permanently deleted", "error")}
        />
      )}

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snack.sev} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Expenses;

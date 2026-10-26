/**
 * ExternalIncomeTab
 *
 * Tab content for "Another Source" income in the Payment History page.
 * Non-patient revenue recorded per entry: date, amount, doctor (staff or free text),
 * clinic/hospital name, treatment, notes.
 *
 * Void pattern mirrors Expenses: soft-delete with reason, voided rows excluded by default.
 * Dialog-content padding fix: sx={{ "&&": { pt: 2.5 } }} prevents MUI's
 * `.MuiDialogTitle-root + .MuiDialogContent-root { pt: 0 }` override from
 * clipping the top label.
 */
import { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Switch,
  Chip,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import BlockIcon from "@mui/icons-material/Block";
import StyledTextField from "../../components/admin/shared/StyledTextField";
import DataTable from "../../components/common/DataTable";
import {
  useExternalIncomes,
  useExternalIncomeStaff,
  useCreateExternalIncome,
  useUpdateExternalIncome,
  useVoidExternalIncome,
} from "../../hooks/admin/useExternalIncome";
import { usePermissions } from "../../hooks/admin/usePermissions";

// ── Helpers ────────────────────────────────────────────────────────────────────

const INR = (v) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(v || 0);

const fmtDate = (val) =>
  val
    ? new Date(val).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

// ── Record Income Dialog ───────────────────────────────────────────────────────

const EMPTY_FORM = {
  date: new Date().toISOString().slice(0, 10),
  amount: "",
  doctorSelect: "", // "_other" or a user _id
  doctorName: "",
  clinicName: "",
  treatment: "",
  notes: "",
};

const RecordIncomeDialog = ({ open, onClose, record, staffList, onSaved }) => {
  const isEdit = !!record;

  const deriveInitialForm = () => {
    if (!record) return { ...EMPTY_FORM };
    return {
      date: record.date ? new Date(record.date).toISOString().slice(0, 10) : "",
      amount: String(record.amount || ""),
      doctorSelect: record.doctor?._id || record.doctor || "_other",
      doctorName: record.doctorName || "",
      clinicName: record.clinicName || "",
      treatment: record.treatment || "",
      notes: record.notes || "",
    };
  };

  const [form, setForm] = useState(deriveInitialForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const createMutation = useCreateExternalIncome();
  const updateMutation = useUpdateExternalIncome();

  const isOther = form.doctorSelect === "_other";

  const set = (field, val) => setForm((f) => ({ ...f, [field]: val }));

  const handleDoctorSelectChange = (val) => {
    setForm((f) => ({
      ...f,
      doctorSelect: val,
      // Clear free-text when switching to a staff user; keep it when "Other"
      doctorName: val === "_other" ? f.doctorName : "",
    }));
  };

  const handleSubmit = async () => {
    if (!form.date) return setError("Date is required");
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0)
      return setError("Amount must be greater than 0");
    if (!form.clinicName.trim()) return setError("Clinic / Hospital name is required");
    if (!form.treatment.trim()) return setError("Treatment is required");
    if (isOther && !form.doctorName.trim()) return setError("Doctor name is required");
    if (!isOther && !form.doctorSelect) return setError("Please select a doctor");

    setError("");
    setSaving(true);

    const payload = {
      date: form.date,
      amount: Number(form.amount),
      clinicName: form.clinicName.trim(),
      treatment: form.treatment.trim(),
      notes: form.notes.trim() || undefined,
    };

    if (isOther) {
      payload.doctorName = form.doctorName.trim();
      payload.doctor = null;
    } else {
      payload.doctor = form.doctorSelect;
      payload.doctorName = "";
    }

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: record._id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onSaved();
      onClose();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to save record");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        {isEdit ? "Edit External Income" : "Record External Income"}
      </DialogTitle>
      <DialogContent sx={{ "&&": { pt: 2.5 } }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Grid container spacing={2}>
          {/* Date */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <StyledTextField
              label="Date *"
              type="date"
              size="small"
              fullWidth
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
            />
          </Grid>

          {/* Amount */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <StyledTextField
              label="Amount (₹) *"
              type="number"
              size="small"
              fullWidth
              value={form.amount}
              onChange={(e) => set("amount", e.target.value)}
              inputProps={{ min: 0.01, step: 0.01 }}
            />
          </Grid>

          {/* Doctor select */}
          <Grid size={{ xs: 12 }}>
            <FormControl size="small" fullWidth>
              <InputLabel shrink>Doctor *</InputLabel>
              <Select
                label="Doctor *"
                value={form.doctorSelect}
                onChange={(e) => handleDoctorSelectChange(e.target.value)}
                displayEmpty
                notched
              >
                <MenuItem value="" disabled>
                  <em>Select doctor…</em>
                </MenuItem>
                {(staffList || []).map((u) => (
                  <MenuItem key={u._id} value={u._id}>
                    {u.name}{" "}
                    <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                      ({u.role})
                    </Typography>
                  </MenuItem>
                ))}
                <MenuItem value="_other">Other (enter name)</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Free-text doctor name — shown only when "Other" is selected */}
          {isOther && (
            <Grid size={{ xs: 12 }}>
              <StyledTextField
                label="Doctor Name *"
                size="small"
                fullWidth
                value={form.doctorName}
                onChange={(e) => set("doctorName", e.target.value)}
                placeholder="Enter doctor's name"
              />
            </Grid>
          )}

          {/* Clinic / Hospital */}
          <Grid size={{ xs: 12 }}>
            <StyledTextField
              label="Clinic / Hospital *"
              size="small"
              fullWidth
              value={form.clinicName}
              onChange={(e) => set("clinicName", e.target.value)}
              placeholder="e.g. Sundar Dental, Apollo Hospital"
            />
          </Grid>

          {/* Treatment */}
          <Grid size={{ xs: 12 }}>
            <StyledTextField
              label="Treatment *"
              size="small"
              fullWidth
              value={form.treatment}
              onChange={(e) => set("treatment", e.target.value)}
              placeholder="e.g. Root Canal, Implant"
            />
          </Grid>

          {/* Notes */}
          <Grid size={{ xs: 12 }}>
            <StyledTextField
              label="Notes"
              size="small"
              fullWidth
              multiline
              rows={2}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Optional additional details"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving}>
          {saving ? <CircularProgress size={18} /> : isEdit ? "Save Changes" : "Record Income"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ── Void Dialog ────────────────────────────────────────────────────────────────

const VoidDialog = ({ record, onClose, onVoided }) => {
  const voidMutation = useVoidExternalIncome();
  const [voidReason, setVoidReason] = useState("");
  const [error, setError] = useState("");
  const [voiding, setVoiding] = useState(false);

  const handleVoid = async () => {
    if (!voidReason.trim() || voidReason.trim().length < 10)
      return setError("Please enter a reason of at least 10 characters.");
    setError("");
    setVoiding(true);
    try {
      await voidMutation.mutateAsync({ id: record._id, voidReason: voidReason.trim() });
      onVoided();
      onClose();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to void record");
      setVoiding(false);
    }
  };

  return (
    <Dialog open={!!record} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ color: "warning.main" }}>Void External Income?</DialogTitle>
      <DialogContent sx={{ "&&": { pt: 2 } }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          Voiding removes this record from revenue totals. The record is preserved for audit.
        </Alert>
        <Typography variant="body2" sx={{ mb: 2 }}>
          <strong>{fmtDate(record?.date)}</strong> &bull;{" "}
          <strong>{INR(record?.amount)}</strong>
          <br />
          <Typography component="span" variant="caption" color="text.secondary">
            {record?.clinicName} &bull; {record?.treatment}
          </Typography>
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 1.5 }}>
            {error}
          </Alert>
        )}
        <StyledTextField
          label="Void reason *"
          size="small"
          fullWidth
          multiline
          rows={2}
          value={voidReason}
          onChange={(e) => setVoidReason(e.target.value)}
          placeholder="Why is this record being voided? (min 10 chars)"
          helperText={`${voidReason.length} / 10 min`}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={voiding}>
          Cancel
        </Button>
        <Button variant="contained" color="warning" onClick={handleVoid} disabled={voiding}>
          {voiding ? <CircularProgress size={18} /> : "Void Record"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ── Main Tab Component ─────────────────────────────────────────────────────────

/**
 * @param {string} fromDate - yyyy-mm-dd or ""
 * @param {string} toDate   - yyyy-mm-dd or ""
 */
const ExternalIncomeTab = ({ fromDate = "", toDate = "" }) => {
  const { hasPermission } = usePermissions();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [voidTarget, setVoidTarget] = useState(null);
  const [showVoided, setShowVoided] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const queryParams = useMemo(
    () => ({
      from: fromDate || undefined,
      to: toDate || undefined,
      includeVoided: showVoided ? "true" : undefined,
      page,
      limit,
    }),
    [fromDate, toDate, showVoided, page, limit]
  );

  const { data: listData, isLoading } = useExternalIncomes(queryParams);
  const { data: staffData } = useExternalIncomeStaff();

  const records = listData?.data || [];
  const pagination = listData?.pagination || { total: 0 };
  const staffList = staffData?.data?.users || [];

  const getDoctorLabel = (row) => {
    if (row.doctor?.name) return row.doctor.name;
    if (row.doctorName) return row.doctorName;
    return "—";
  };

  const columns = [
    {
      field: "date",
      headerName: "Date",
      minWidth: 110,
      render: (v) => fmtDate(v),
    },
    {
      field: "amount",
      headerName: "Amount",
      minWidth: 110,
      align: "right",
      render: (v, row) => (
        <Typography
          variant="body2"
          sx={{ fontWeight: 700, color: row.isVoided ? "text.disabled" : "#16a34a" }}
        >
          {INR(v)}
        </Typography>
      ),
    },
    {
      field: "doctor",
      headerName: "Doctor",
      minWidth: 140,
      render: (_v, row) => (
        <Typography variant="body2" sx={{ color: row.isVoided ? "text.disabled" : "inherit" }}>
          {getDoctorLabel(row)}
        </Typography>
      ),
    },
    {
      field: "clinicName",
      headerName: "Clinic / Hospital",
      minWidth: 160,
      render: (v, row) => (
        <Typography variant="body2" sx={{ color: row.isVoided ? "text.disabled" : "inherit" }}>
          {v || "—"}
        </Typography>
      ),
    },
    {
      field: "treatment",
      headerName: "Treatment",
      minWidth: 140,
      render: (v, row) => (
        <Typography variant="body2" sx={{ color: row.isVoided ? "text.disabled" : "inherit" }}>
          {v || "—"}
        </Typography>
      ),
    },
    {
      field: "isVoided",
      headerName: "Status",
      minWidth: 90,
      render: (v) =>
        v ? (
          <Chip label="Voided" size="small" color="default" sx={{ fontSize: 11 }} />
        ) : (
          <Chip label="Active" size="small" color="success" variant="outlined" sx={{ fontSize: 11 }} />
        ),
    },
    {
      field: "_id",
      headerName: "Actions",
      minWidth: 110,
      align: "center",
      render: (_v, row) => {
        if (row.isVoided) return null;
        return (
          <Box sx={{ display: "flex", gap: 0.5, justifyContent: "center" }}>
            {hasPermission("external_income", "edit") && (
              <Tooltip title="Edit">
                <IconButton size="small" onClick={() => { setEditRecord(row); setDialogOpen(true); }}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {hasPermission("external_income", "delete") && (
              <Tooltip title="Void record">
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

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditRecord(null);
  };

  return (
    <Box>
      {/* Header row: title + controls */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2, mb: 2 }}>
        <Box>
          <Typography variant="subtitle1" fontWeight={700} color="#1f2937">
            External Income Records ({pagination.total})
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Non-patient revenue from other clinics or hospitals
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={showVoided}
                onChange={(e) => { setShowVoided(e.target.checked); setPage(1); }}
              />
            }
            label={<Typography variant="body2" color="text.secondary">Show voided</Typography>}
            sx={{ m: 0 }}
          />
          {hasPermission("external_income", "create") && (
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => { setEditRecord(null); setDialogOpen(true); }}
              sx={{ bgcolor: "#003366", "&:hover": { bgcolor: "#002244" }, textTransform: "none", fontWeight: 600 }}
            >
              Record Income
            </Button>
          )}
        </Box>
      </Box>

      {/* Table */}
      <DataTable
        columns={columns}
        data={records}
        loading={isLoading}
        getRowStyle={(row) => (row.isVoided ? { opacity: 0.55 } : undefined)}
        pagination={{
          page,
          limit,
          total: pagination.total,
          onPageChange: setPage,
        }}
        emptyMessage="No external income records found"
      />

      {/* Record / Edit dialog */}
      {dialogOpen && (
        <RecordIncomeDialog
          open={dialogOpen}
          onClose={handleDialogClose}
          record={editRecord}
          staffList={staffList}
          onSaved={handleDialogClose}
        />
      )}

      {/* Void dialog */}
      {voidTarget && (
        <VoidDialog
          record={voidTarget}
          onClose={() => setVoidTarget(null)}
          onVoided={() => setVoidTarget(null)}
        />
      )}
    </Box>
  );
};

export default ExternalIncomeTab;

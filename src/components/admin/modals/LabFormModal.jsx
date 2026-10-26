/**
 * Lab Form Modal — create or edit a lab and its procedures price list.
 */
import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  MenuItem,
  IconButton,
  CircularProgress,
  FormControlLabel,
  Switch,
  Divider,
  Paper,
} from "@mui/material";
import { toast } from "react-toastify";
import Grid from "@mui/material/Grid";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import BusinessIcon from "@mui/icons-material/Business";
import { useLabMutations } from "../../../hooks/admin/useLabs";

const pricingTypeOptions = [
  { value: "per_unit", label: "Per unit" },
  { value: "per_arch", label: "Per arch" },
  { value: "fixed", label: "Fixed" },
  { value: "fixed_plus_per_unit", label: "Fixed + per unit" },
];

// Map a legacy `unit` value to the new pricingType (for pre-migration data).
const legacyUnitToType = (unit) =>
  unit === "per arch" ? "per_arch" : unit === "fixed" ? "fixed" : "per_unit";

const blankProcedure = { name: "", price: "", basePrice: "", pricingType: "per_unit", notes: "" };

const LabFormModal = ({ open, onClose, lab, onSuccess }) => {
  const isEdit = !!lab?._id;
  // Initial state derived from `lab`. The parent remounts this modal (via `key`)
  // each time it opens, so the initializer always reflects the current lab.
  const [form, setForm] = useState(() => ({
    name: lab?.name || "",
    contactPerson: lab?.contactPerson || "",
    phone: lab?.phone || "",
    address: lab?.address || "",
    status: lab?.status || "active",
    procedures: lab?.procedures?.length
      ? lab.procedures.map((p) => ({
          name: p.name || "",
          price: p.price ?? "",
          basePrice: p.basePrice ?? "",
          pricingType: p.pricingType || legacyUnitToType(p.unit),
          notes: p.notes || "",
        }))
      : [{ ...blankProcedure }],
  }));

  const { createLabAsync, updateLabAsync, isCreating, isUpdating } = useLabMutations();
  const saving = isCreating || isUpdating;

  const handleProcChange = (i, field, value) => {
    setForm((prev) => {
      const procedures = [...prev.procedures];
      procedures[i] = { ...procedures[i], [field]: value };
      return { ...prev, procedures };
    });
  };

  const addProc = () =>
    setForm((prev) => ({ ...prev, procedures: [...prev.procedures, { ...blankProcedure }] }));

  const removeProc = (i) =>
    setForm((prev) => ({ ...prev, procedures: prev.procedures.filter((_, idx) => idx !== i) }));

  const handleSubmit = async () => {
    if (!form.name.trim()) return toast.error("Lab name is required");

    const procedures = form.procedures
      .filter((p) => p.name.trim())
      .map((p) => ({
        name: p.name.trim(),
        price: Number(p.price) || 0,
        basePrice: Number(p.basePrice) || 0,
        pricingType: p.pricingType || "per_unit",
        notes: p.notes || undefined,
      }));

    const payload = {
      name: form.name.trim(),
      contactPerson: form.contactPerson || undefined,
      phone: form.phone || undefined,
      address: form.address || undefined,
      status: form.status,
      procedures,
    };

    try {
      if (isEdit) {
        await updateLabAsync({ id: lab._id, data: payload });
        toast.success("Lab updated");
      } else {
        await createLabAsync(payload);
        toast.success("Lab created");
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save lab");
    }
  };

  const handleClose = () => {
    if (!saving) onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth PaperProps={{ className: "rounded-xl" }}>
      <DialogTitle className="bg-navy text-white">
        <Box className="flex items-center justify-between">
          <Box className="flex items-center gap-2">
            <BusinessIcon />
            <Typography variant="h6" component="span" className="font-bold">{isEdit ? "Edit Lab" : "Add Lab"}</Typography>
          </Box>
          <IconButton onClick={handleClose} disabled={saving}><CloseIcon className="text-white" /></IconButton>
        </Box>
      </DialogTitle>

      <DialogContent className="p-6 mt-2">
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth label="Lab Name *" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} size="small" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth label="Contact Person" value={form.contactPerson} onChange={(e) => setForm((p) => ({ ...p, contactPerson: e.target.value }))} size="small" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth label="Phone" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} size="small" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Box className="flex items-center h-full">
              <FormControlLabel
                control={
                  <Switch
                    checked={form.status === "active"}
                    onChange={(e) => setForm((p) => ({ ...p, status: e.target.checked ? "active" : "inactive" }))}
                    color="success"
                  />
                }
                label={form.status === "active" ? "Active" : "Inactive"}
              />
            </Box>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField fullWidth label="Address" value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} size="small" multiline rows={2} />
          </Grid>

          {/* Procedures */}
          <Grid size={{ xs: 12 }}>
            <Divider className="my-2" />
            <Box className="flex items-center justify-between mb-3">
              <Typography variant="subtitle1" className="font-semibold">Procedures</Typography>
              <Button size="small" startIcon={<AddIcon />} onClick={addProc} variant="outlined">Add Procedure</Button>
            </Box>

            {form.procedures.map((p, i) => (
              <Paper key={i} variant="outlined" className="p-3 mb-3">
                <Grid container spacing={2} alignItems="center">
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField fullWidth label="Name" value={p.name} onChange={(e) => handleProcChange(i, "name", e.target.value)} size="small" />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField select fullWidth label="Pricing Type" value={p.pricingType} onChange={(e) => handleProcChange(i, "pricingType", e.target.value)} size="small">
                      {pricingTypeOptions.map((o) => (<MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 2 }}>
                    <TextField
                      fullWidth
                      label={p.pricingType === "fixed" ? "Fixed (₹)" : p.pricingType === "fixed_plus_per_unit" ? "Per-unit (₹)" : "Price (₹)"}
                      type="number"
                      value={p.price}
                      onChange={(e) => handleProcChange(i, "price", e.target.value)}
                      size="small"
                      inputProps={{ min: 0 }}
                    />
                  </Grid>
                  {p.pricingType === "fixed_plus_per_unit" && (
                    <Grid size={{ xs: 6, sm: 2 }}>
                      <TextField fullWidth label="Base (₹)" type="number" value={p.basePrice} onChange={(e) => handleProcChange(i, "basePrice", e.target.value)} size="small" inputProps={{ min: 0 }} />
                    </Grid>
                  )}
                  <Grid size={{ xs: 6, sm: p.pricingType === "fixed_plus_per_unit" ? 12 : 2 }}>
                    <TextField fullWidth label="Notes" value={p.notes} onChange={(e) => handleProcChange(i, "notes", e.target.value)} size="small" />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 1 }}>
                    <IconButton size="small" color="error" onClick={() => removeProc(i)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Grid>
                </Grid>
              </Paper>
            ))}
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions className="p-4 bg-gray-50">
        <Button onClick={handleClose} color="inherit" disabled={saving}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={saving}
          sx={{ bgcolor: "#f57c00", "&:hover": { bgcolor: "#e06c00" } }}
          startIcon={saving ? <CircularProgress size={16} /> : null}
        >
          {saving ? "Saving..." : isEdit ? "Save Lab" : "Create Lab"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LabFormModal;

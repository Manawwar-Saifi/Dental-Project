/**
 * Create Lab Order Modal
 *
 * Mirrors the invoice create modal: dynamic line items, patient search,
 * lab + doctor selectors, auto-calculated totals.
 */
import { useState, useEffect } from "react";
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
  Autocomplete,
  Divider,
  Paper,
} from "@mui/material";
import { toast } from "react-toastify";
import Grid from "@mui/material/Grid";
import CloseIcon from "@mui/icons-material/Close";
import ScienceIcon from "@mui/icons-material/Science";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { searchPatients } from "../../../api/admin/patients.api";
import { useLabs } from "../../../hooks/admin/useLabs";
import { useUsers } from "../../../hooks/admin/useUsers";
import { useLabOrderMutations } from "../../../hooks/admin/useLabOrders";
import { todayStr, MAX_DATE } from "../../../utils/dateInput";

const blankItem = { procedure: "", quantity: 1, unitPrice: "", basePrice: 0, pricingType: "per_unit" };

const formatCurrency = (v) => `₹${(Number(v) || 0).toLocaleString("en-IN")}`;

// Price label shown in the procedure dropdown, per pricing type.
const procPriceLabel = (p) => {
  if (p.pricingType === "fixed_plus_per_unit")
    return `₹${p.basePrice || 0} + ₹${p.price}/unit`;
  if (p.pricingType === "fixed") return `₹${p.price} fixed`;
  if (p.pricingType === "per_arch") return `₹${p.price}/arch`;
  return `₹${p.price}/unit`;
};

// Line total honouring the pricing type.
const computeLineTotal = (it) => {
  const qty = Number(it.quantity) || 0;
  const unit = Number(it.unitPrice) || 0;
  const base = Number(it.basePrice) || 0;
  if (it.pricingType === "fixed") return unit;
  if (it.pricingType === "fixed_plus_per_unit") return base + qty * unit;
  return qty * unit; // per_unit / per_arch
};

const CreateLabOrderModal = ({ open, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    lab: null,
    patient: null,
    doctor: "",
    items: [{ ...blankItem }],
    expectedDelivery: "",
    notes: "",
  });
  const [patientSearch, setPatientSearch] = useState("");
  const [patientOptions, setPatientOptions] = useState([]);
  const [patientLoading, setPatientLoading] = useState(false);

  const { data: labsData } = useLabs({ status: "active" });
  const labs = labsData?.data?.labs || [];
  const { data: usersData } = useUsers({ limit: 100 });
  const doctors = usersData?.data || [];
  const { createLabOrderAsync, isCreating } = useLabOrderMutations();

  const procedures = formData.lab?.procedures || [];

  // Reset on open
  useEffect(() => {
    if (open) {
      setFormData({
        lab: null,
        patient: null,
        doctor: "",
        items: [{ ...blankItem }],
        expectedDelivery: "",
        notes: "",
      });
      setPatientSearch("");
      setPatientOptions([]);
    }
  }, [open]);

  // Debounced patient search
  useEffect(() => {
    const run = async () => {
      if (patientSearch.length < 2) {
        setPatientOptions([]);
        return;
      }
      setPatientLoading(true);
      try {
        const res = await searchPatients(patientSearch);
        setPatientOptions(res.data?.patients || []);
      } catch {
        setPatientOptions([]);
      } finally {
        setPatientLoading(false);
      }
    };
    const t = setTimeout(run, 300);
    return () => clearTimeout(t);
  }, [patientSearch]);

  const handleItemChange = (index, field, value) => {
    setFormData((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };
      // Auto-fill pricing from the selected lab procedure
      if (field === "procedure") {
        const proc = procedures.find((p) => p.name === value);
        if (proc) {
          items[index].unitPrice = proc.price;
          items[index].basePrice = proc.basePrice || 0;
          items[index].pricingType = proc.pricingType || "per_unit";
        }
      }
      return { ...prev, items };
    });
  };

  const addItem = () =>
    setFormData((prev) => ({ ...prev, items: [...prev.items, { ...blankItem }] }));

  const removeItem = (index) => {
    if (formData.items.length <= 1) {
      toast.error("At least one item is required");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const lineTotal = (it) => computeLineTotal(it);
  const orderTotal = formData.items.reduce((s, it) => s + lineTotal(it), 0);

  const handleSubmit = async () => {
    if (!formData.lab) return toast.error("Please select a lab");
    if (!formData.patient) return toast.error("Please select a patient");
    const invalid = formData.items.find(
      (it) =>
        !it.procedure ||
        !Number(it.quantity) ||
        Number(it.quantity) <= 0 ||
        (!(Number(it.unitPrice) > 0) && !(Number(it.basePrice) > 0)),
    );
    if (invalid)
      return toast.error("Each item needs a procedure, quantity > 0 and a price");

    try {
      await createLabOrderAsync({
        lab: formData.lab._id,
        patient: formData.patient._id,
        doctor: formData.doctor || undefined,
        items: formData.items.map((it) => ({
          procedure: it.procedure,
          quantity: Number(it.quantity) || 1,
          unitPrice: Number(it.unitPrice) || 0,
          basePrice: Number(it.basePrice) || 0,
          pricingType: it.pricingType || "per_unit",
        })),
        expectedDelivery: formData.expectedDelivery || undefined,
        notes: formData.notes || undefined,
      });
      toast.success("Lab order created");
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create lab order");
    }
  };

  const handleClose = () => {
    if (!isCreating) onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth PaperProps={{ className: "rounded-xl" }}>
      <DialogTitle className="bg-navy text-white" sx={{ p: 0 }}>
        <Box className="flex items-center justify-between px-4 py-2">
          <Box className="flex items-center gap-2">
            <ScienceIcon fontSize="small" />
            <Typography variant="subtitle1" className="font-bold">New Lab Order</Typography>
          </Box>
          <IconButton onClick={handleClose} disabled={isCreating} size="small">
            <CloseIcon className="text-white" fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent className="p-4 mt-5">
        <Grid container spacing={2}>
          {/* Lab */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Autocomplete
              options={labs}
              getOptionLabel={(o) => o?.name || ""}
              value={formData.lab}
              isOptionEqualToValue={(opt, val) => opt._id === val?._id}
              onChange={(_, value) =>
                setFormData((prev) => ({ ...prev, lab: value, items: [{ ...blankItem }] }))
              }
              renderInput={(params) => (
                <TextField {...params} label="Lab *" placeholder="Select lab" size="small" />
              )}
            />
          </Grid>

          {/* Patient */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Autocomplete
              options={patientOptions}
              getOptionLabel={(o) => (o ? `${o.name} - ${o.phone}` : "")}
              value={formData.patient}
              onChange={(_, value) => setFormData((prev) => ({ ...prev, patient: value }))}
              onInputChange={(_, value) => setPatientSearch(value)}
              loading={patientLoading}
              isOptionEqualToValue={(opt, val) => opt._id === val?._id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Patient *"
                  placeholder="Search by name or phone..."
                  size="small"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {patientLoading ? <CircularProgress size={18} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              noOptionsText={patientSearch.length < 2 ? "Type at least 2 characters" : "No patients found"}
            />
          </Grid>

          {/* Doctor */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              select
              fullWidth
              label="Doctor"
              value={formData.doctor}
              onChange={(e) => setFormData((prev) => ({ ...prev, doctor: e.target.value }))}
              size="small"
            >
              <MenuItem value="">— None —</MenuItem>
              {doctors.map((d) => (
                <MenuItem key={d._id} value={d.name}>{d.name}</MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Expected delivery */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              label="Expected Delivery"
              type="date"
              value={formData.expectedDelivery}
              onChange={(e) => setFormData((prev) => ({ ...prev, expectedDelivery: e.target.value }))}
              size="small"
              slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: todayStr(), max: MAX_DATE } }}
            />
          </Grid>

          {/* Items */}
          <Grid size={{ xs: 12 }}>
            <Divider className="mt-6 mb-2" />
            <Box className="flex items-center justify-between mb-3">
              <Typography variant="subtitle1" className="font-semibold">Procedures</Typography>
              <Button size="small" startIcon={<AddIcon />} onClick={addItem} variant="outlined" disabled={!formData.lab}>
                Add Item
              </Button>
            </Box>

            {!formData.lab && (
              <Typography variant="body2" color="text.secondary" className="mb-2">
                Select a lab first to choose procedures.
              </Typography>
            )}

            {formData.items.map((item, index) => (
              <Box key={index} className="border border-gray-200 rounded py-3 px-4 mb-2">
                <Grid container spacing={1.5} alignItems="center">
                  <Grid size={{ xs: 12, sm: 5 }}>
                    <TextField
                      select
                      fullWidth
                      label="Procedure *"
                      value={item.procedure}
                      onChange={(e) => handleItemChange(index, "procedure", e.target.value)}
                      size="small"
                      disabled={!formData.lab}
                    >
                      {procedures.map((p) => (
                        <MenuItem key={p._id || p.name} value={p.name}>
                          {p.name} — {procPriceLabel(p)}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 4, sm: 2 }}>
                    <TextField
                      fullWidth
                      label="Qty"
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                      size="small"
                      inputProps={{ min: 1 }}
                    />
                  </Grid>
                  <Grid size={{ xs: 4, sm: 2 }}>
                    <TextField
                      fullWidth
                      label="Unit Price (₹)"
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(index, "unitPrice", e.target.value)}
                      size="small"
                      inputProps={{ min: 0 }}
                    />
                  </Grid>
                  <Grid size={{ xs: 4, sm: 3 }}>
                    <Box className="flex items-center justify-between">
                      <Typography variant="body2" className="font-numbers font-semibold text-green-600">
                        {formatCurrency(lineTotal(item))}
                      </Typography>
                      <IconButton size="small" color="error" onClick={() => removeItem(index)} disabled={formData.items.length <= 1}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Grid>
                  {item.pricingType === "fixed_plus_per_unit" && (
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="caption" className="text-gray-500">
                        Base: {formatCurrency(item.basePrice)} + (Qty {Number(item.quantity) || 0} × {formatCurrency(item.unitPrice)}/unit) = {formatCurrency(lineTotal(item))}
                      </Typography>
                    </Grid>
                  )}
                  {item.pricingType === "fixed" && (
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="caption" className="text-gray-500">
                        Fixed price — quantity not charged.
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>
            ))}

            {/* Order total */}
            <Box className="flex justify-end mt-1">
              <Box className="flex items-center gap-3">
                <Typography variant="caption" className="font-bold text-gray-600">Order Total:</Typography>
                <Typography variant="body2" className="font-numbers font-bold text-green-600">
                  {formatCurrency(orderTotal)}
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Notes */}
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Notes"
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              size="small"
              multiline
              rows={1}
              placeholder="Optional notes..."
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions className="p-2 bg-gray-50">
        <Button onClick={handleClose} color="inherit" disabled={isCreating} sx={{ textTransform: "none", fontSize: "12px", py: 0.5, px: 1.5 }}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isCreating}
          sx={{ bgcolor: "#f57c00", "&:hover": { bgcolor: "#e06c00" }, textTransform: "none", fontSize: "12px", fontWeight: 600 }}
          startIcon={isCreating ? <CircularProgress size={16} /> : <AddIcon />}
        >
          {isCreating ? "Creating..." : "Create Order"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateLabOrderModal;

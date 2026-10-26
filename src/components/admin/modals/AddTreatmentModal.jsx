/**
 * Add Treatment Modal
 *
 * Modal for creating a new treatment type.
 */
import React, { useState } from "react";
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
} from "@mui/material";
import { toast } from "react-toastify";
import Grid from "@mui/material/Grid";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import { useTreatmentMutations } from "../../../hooks/admin/useTreatments";

/**
 * Treatment categories
 */
const categories = [
  { value: "preventive", label: "Preventive Care" },
  { value: "restorative", label: "Restorative" },
  { value: "cosmetic", label: "Cosmetic" },
  { value: "orthodontics", label: "Orthodontics" },
  { value: "periodontics", label: "Periodontics" },
  { value: "endodontics", label: "Endodontics" },
  { value: "oral_surgery", label: "Oral Surgery" },
  { value: "pediatric", label: "Pediatric Dentistry" },
  { value: "prosthodontics", label: "Prosthodontics" },
  { value: "other", label: "Other" },
];

const AddTreatmentModal = ({ open, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    category: "",
    description: "",
    price: "",
    sessionsRequired: 1,
    duration: "",
    isActive: true,
  });
  const { createTreatment, isCreating } = useTreatmentMutations();

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleSwitchChange = (field) => (e) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.checked,
    }));
  };

  const handleSubmit = () => {
    // Validation
    if (!formData.code.trim()) {
      toast.error("Treatment code is required");
      return;
    }
    if (!formData.name.trim()) {
      toast.error("Treatment name is required");
      return;
    }
    if (!formData.category) {
      toast.error("Category is required");
      return;
    }
    if (!formData.price || Number(formData.price) <= 0) {
      toast.error("Valid price is required");
      return;
    }

    const data = {
      code: formData.code.toUpperCase(),
      name: formData.name,
      category: formData.category,
      description: formData.description,
      price: Number(formData.price),
      sessionsRequired: Number(formData.sessionsRequired) || 1,
      duration: formData.duration ? Number(formData.duration) : null,
      isActive: formData.isActive,
    };

    createTreatment(data, {
      onSuccess: () => {
        resetForm();
        onSuccess?.();
        onClose();
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || "Failed to create treatment");
      },
    });
  };

  const resetForm = () => {
    setFormData({
      code: "",
      name: "",
      category: "",
      description: "",
      price: "",
      sessionsRequired: 1,
      duration: "",
      isActive: true,
    });
  };

  const handleClose = () => {
    if (!isCreating) {
      resetForm();
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ className: "rounded-xl" }}
    >
      {/* Header */}
      <DialogTitle className="bg-linear-to-r from-teal-600 to-teal-700 text-white">
        <Box className="flex items-center justify-between">
          <Box className="flex items-center gap-2">
            <LocalHospitalIcon />
            <Typography variant="h6" component="span" className="font-bold">
              Add New Treatment
            </Typography>
          </Box>
          <IconButton onClick={handleClose} disabled={isCreating}>
            <CloseIcon className="text-white" />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* Content */}
      <DialogContent className="p-6">
        <Grid container spacing={3} className="mt-8">
          {/* Code */}
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              label="Treatment Code *"
              value={formData.code}
              onChange={handleChange("code")}
              placeholder="e.g., RCT001"
              size="small"
              inputProps={{ style: { textTransform: "uppercase" } }}
            />
          </Grid>

          {/* Name */}
          <Grid size={{ xs: 12, sm: 8 }}>
            <TextField
              fullWidth
              label="Treatment Name *"
              value={formData.name}
              onChange={handleChange("name")}
              placeholder="e.g., Root Canal Treatment"
              size="small"
            />
          </Grid>

          {/* Category */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              select
              fullWidth
              label="Category *"
              value={formData.category}
              onChange={handleChange("category")}
              size="small"
            >
              {categories.map((cat) => (
                <MenuItem key={cat.value} value={cat.value}>
                  {cat.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Price */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Price (₹) *"
              type="number"
              value={formData.price}
              onChange={handleChange("price")}
              placeholder="e.g., 5000"
              size="small"
              inputProps={{ min: 0 }}
            />
          </Grid>

          {/* Sessions Required */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Sessions Required"
              type="number"
              value={formData.sessionsRequired}
              onChange={handleChange("sessionsRequired")}
              size="small"
              inputProps={{ min: 1 }}
            />
          </Grid>

          {/* Duration */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Duration (minutes)"
              type="number"
              value={formData.duration}
              onChange={handleChange("duration")}
              placeholder="e.g., 60"
              size="small"
              inputProps={{ min: 0 }}
            />
          </Grid>

          {/* Description */}
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={handleChange("description")}
              multiline
              rows={3}
              placeholder="Describe the treatment..."
              size="small"
            />
          </Grid>

          {/* Active Status */}
          <Grid size={{ xs: 12 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={handleSwitchChange("isActive")}
                  color="success"
                />
              }
              label="Active (available for booking)"
            />
          </Grid>
        </Grid>
      </DialogContent>

      {/* Actions */}
      <DialogActions className="p-4 bg-gray-50">
        <Button onClick={handleClose} color="inherit" disabled={isCreating}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isCreating}
          className="bg-teal-600 hover:bg-teal-700"
          startIcon={isCreating ? <CircularProgress size={16} /> : <AddIcon />}
        >
          {isCreating ? "Creating..." : "Add Treatment"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddTreatmentModal;

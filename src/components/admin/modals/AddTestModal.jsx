/**
 * Add Test Modal
 *
 * Modal for creating a new diagnostic test type.
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
import BiotechIcon from "@mui/icons-material/Biotech";
import { useTestMutations } from "../../../hooks/admin/useTests";

/**
 * Test categories
 */
const categories = [
  { value: "blood", label: "Blood Test" },
  { value: "urine", label: "Urine Test" },
  { value: "imaging", label: "Imaging" },
  { value: "dental_xray", label: "Dental X-Ray" },
  { value: "oral_pathology", label: "Oral Pathology" },
  { value: "microbiology", label: "Microbiology" },
  { value: "biochemistry", label: "Biochemistry" },
  { value: "other", label: "Other" },
];

/**
 * Sample types
 */
const sampleTypes = [
  { value: "blood", label: "Blood" },
  { value: "urine", label: "Urine" },
  { value: "saliva", label: "Saliva" },
  { value: "tissue", label: "Tissue Sample" },
  { value: "swab", label: "Swab" },
  { value: "none", label: "None (Imaging)" },
];

const AddTestModal = ({ open, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    category: "",
    description: "",
    price: "",
    turnaroundTime: "",
    sampleType: "",
    preparation: "",
    isInHouse: true,
    isActive: true,
  });
  const { createTest, isCreating } = useTestMutations();

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
      toast.error("Test code is required");
      return;
    }
    if (!formData.name.trim()) {
      toast.error("Test name is required");
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
      turnaroundTime: formData.turnaroundTime ? Number(formData.turnaroundTime) : null,
      sampleType: formData.sampleType,
      preparation: formData.preparation,
      isInHouse: formData.isInHouse,
      isActive: formData.isActive,
    };

    createTest(data, {
      onSuccess: () => {
        resetForm();
        onSuccess?.();
        onClose();
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || "Failed to create test");
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
      turnaroundTime: "",
      sampleType: "",
      preparation: "",
      isInHouse: true,
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
      maxWidth="md"
      fullWidth
      PaperProps={{ className: "rounded-xl" }}
    >
      {/* Header */}
      <DialogTitle className="bg-linear-to-r from-purple-600 to-purple-700 text-white">
        <Box className="flex items-center justify-between">
          <Box className="flex items-center gap-2">
            <BiotechIcon />
            <Typography variant="h6" component="span" className="font-bold">
              Add New Test
            </Typography>
          </Box>
          <IconButton onClick={handleClose} disabled={isCreating}>
            <CloseIcon className="text-white" />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* Content */}
      <DialogContent className="p-6 mt-8">
        <Grid container spacing={3}>
          {/* Code */}
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              label="Test Code *"
              value={formData.code}
              onChange={handleChange("code")}
              placeholder="e.g., CBC001"
              size="small"
              inputProps={{ style: { textTransform: "uppercase" } }}
            />
          </Grid>

          {/* Name */}
          <Grid size={{ xs: 12, sm: 8 }}>
            <TextField
              fullWidth
              label="Test Name *"
              value={formData.name}
              onChange={handleChange("name")}
              placeholder="e.g., Complete Blood Count"
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
              placeholder="e.g., 500"
              size="small"
              inputProps={{ min: 0 }}
            />
          </Grid>

          {/* Turnaround Time */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Turnaround Time (hours)"
              type="number"
              value={formData.turnaroundTime}
              onChange={handleChange("turnaroundTime")}
              placeholder="e.g., 24"
              size="small"
              inputProps={{ min: 0 }}
            />
          </Grid>

          {/* Sample Type */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              select
              fullWidth
              label="Sample Type"
              value={formData.sampleType}
              onChange={handleChange("sampleType")}
              size="small"
            >
              {sampleTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Description */}
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={handleChange("description")}
              multiline
              rows={2}
              placeholder="Describe the test..."
              size="small"
            />
          </Grid>

          {/* Preparation */}
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Patient Preparation Instructions"
              value={formData.preparation}
              onChange={handleChange("preparation")}
              multiline
              rows={2}
              placeholder="e.g., Fasting required for 12 hours"
              size="small"
            />
          </Grid>

          {/* In-House / External */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isInHouse}
                  onChange={handleSwitchChange("isInHouse")}
                  color="primary"
                />
              }
              label={formData.isInHouse ? "In-House (at clinic)" : "External (sent to lab)"}
            />
          </Grid>

          {/* Active Status */}
          <Grid size={{ xs: 12, sm: 6 }}>
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
          className="bg-purple-600 hover:bg-purple-700"
          startIcon={isCreating ? <CircularProgress size={16} /> : <AddIcon />}
        >
          {isCreating ? "Creating..." : "Add Test"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddTestModal;

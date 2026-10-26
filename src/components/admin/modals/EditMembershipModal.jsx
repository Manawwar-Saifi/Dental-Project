/**
 * Edit Membership Plan Modal
 *
 * Modal for editing an existing membership plan.
 */
import React, { useState, useEffect } from "react";
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
  Chip,
  InputAdornment,
  Divider,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import CardMembershipIcon from "@mui/icons-material/CardMembership";
import { toast } from "react-toastify";
import { useMembershipMutations } from "../../../hooks/admin/useMemberships";

/**
 * Plan types
 */
const planTypes = [
  { value: "individual", label: "Individual" },
  { value: "family", label: "Family" },
];

/**
 * Plan tiers
 */
const planTiers = [
  { value: "silver", label: "Silver" },
  { value: "gold", label: "Gold" },
  { value: "platinum", label: "Platinum" },
];

const EditMembershipModal = ({ open, onClose, plan, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    type: "individual",
    tier: "silver",
    description: "",
    price: "",
    durationMonths: 12,
    discountPercentage: 10,
    maxMembers: 1,
    features: [],
    isActive: true,
    displayOrder: 0,
  });
  const [featureInput, setFeatureInput] = useState("");

  const { updatePlan, isUpdating } = useMembershipMutations();

  // Populate form when plan changes
  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name || "",
        code: plan.code || "",
        type: plan.type || "individual",
        tier: plan.tier || "silver",
        description: plan.description || "",
        price: plan.price || "",
        durationMonths: plan.durationMonths || 12,
        discountPercentage: plan.discountPercentage || 10,
        maxMembers: plan.maxMembers || 1,
        features: plan.features || [],
        isActive: plan.isActive !== false,
        displayOrder: plan.displayOrder || 0,
      });
    }
  }, [plan]);

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

  const handleAddFeature = () => {
    if (featureInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        features: [...prev.features, featureInput.trim()],
      }));
      setFeatureInput("");
    }
  };

  const handleRemoveFeature = (index) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = () => {
    // Validation
    if (!formData.name.trim()) {
      toast.error("Plan name is required");
      return;
    }
    if (!formData.code.trim()) {
      toast.error("Plan code is required");
      return;
    }
    if (!formData.price || Number(formData.price) <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    const data = {
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase(),
      type: formData.type,
      tier: formData.tier,
      description: formData.description.trim(),
      price: Number(formData.price),
      durationMonths: Number(formData.durationMonths),
      discountPercentage: Number(formData.discountPercentage),
      maxMembers: Number(formData.maxMembers),
      features: formData.features,
      isActive: formData.isActive,
      displayOrder: Number(formData.displayOrder),
    };

    updatePlan(
      { id: plan._id, data },
      {
        onSuccess: () => {
          onSuccess?.();
          onClose();
        },
        onError: (err) => {
          toast.error(err.response?.data?.message || "Failed to update membership plan");
        },
      }
    );
  };

  const handleClose = () => {
    if (!isUpdating) {
      setFeatureInput("");
      onClose();
    }
  };

  if (!plan) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ className: "rounded-xl" }}
    >
      {/* Header */}
      <DialogTitle className="bg-linear-to-r from-indigo-600 to-indigo-700 text-white">
        <Box className="flex items-center justify-between">
          <Box className="flex items-center gap-2">
            <CardMembershipIcon />
            <Typography variant="h6" component="span" className="font-bold">
              Edit Membership Plan
            </Typography>
          </Box>
          <IconButton onClick={handleClose} disabled={isUpdating}>
            <CloseIcon className="text-white" />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* Content */}
      <DialogContent className="p-6 mt-8">
        <Grid container spacing={3}>
          {/* Plan Name */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Plan Name *"
              value={formData.name}
              onChange={handleChange("name")}
              placeholder="e.g., Individual Gold"
              size="small"
            />
          </Grid>

          {/* Plan Code */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Plan Code *"
              value={formData.code}
              onChange={handleChange("code")}
              placeholder="e.g., IND-GLD"
              size="small"
              helperText="Unique identifier (will be uppercase)"
            />
          </Grid>

          {/* Type */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              select
              fullWidth
              label="Plan Type *"
              value={formData.type}
              onChange={handleChange("type")}
              size="small"
            >
              {planTypes.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Tier */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              select
              fullWidth
              label="Plan Tier *"
              value={formData.tier}
              onChange={handleChange("tier")}
              size="small"
            >
              {planTiers.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
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
              placeholder="e.g., 1999"
              size="small"
              InputProps={{
                startAdornment: <InputAdornment position="start">₹</InputAdornment>,
              }}
            />
          </Grid>

          {/* Duration */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Duration (months)"
              type="number"
              value={formData.durationMonths}
              onChange={handleChange("durationMonths")}
              size="small"
              inputProps={{ min: 1 }}
            />
          </Grid>

          {/* Discount Percentage */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Discount (%)"
              type="number"
              value={formData.discountPercentage}
              onChange={handleChange("discountPercentage")}
              size="small"
              inputProps={{ min: 0, max: 100 }}
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              }}
            />
          </Grid>

          {/* Max Members */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Max Members"
              type="number"
              value={formData.maxMembers}
              onChange={handleChange("maxMembers")}
              size="small"
              inputProps={{ min: 1 }}
              helperText="For family plans, usually 4"
            />
          </Grid>

          {/* Description (each line = one bullet point) */}
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Description / Rules & Conditions"
              value={formData.description}
              onChange={handleChange("description")}
              multiline
              rows={4}
              size="small"
              placeholder={"Enter each rule or condition on a new line, e.g.:\n₹500 off per clinic visit\n30% off on surgery\nValid for 1 year from purchase\nFree consultation and X-ray"}
              helperText="Each line will appear as a separate bullet point on the plans page"
            />
          </Grid>

          {/* Features */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" className="font-semibold text-gray-700 mb-2">
              Features
            </Typography>
            <Box className="flex gap-2 mb-2">
              <TextField
                fullWidth
                value={featureInput}
                onChange={(e) => setFeatureInput(e.target.value)}
                placeholder="Add a feature (e.g., 15% discount on all treatments)"
                size="small"
                onKeyPress={(e) => e.key === "Enter" && handleAddFeature()}
              />
              <Button
                variant="outlined"
                onClick={handleAddFeature}
                disabled={!featureInput.trim()}
              >
                Add
              </Button>
            </Box>
            <Box className="flex flex-wrap gap-2">
              {formData.features.map((feature, index) => (
                <Chip
                  key={index}
                  label={feature}
                  onDelete={() => handleRemoveFeature(index)}
                  variant="outlined"
                  size="small"
                />
              ))}
              {formData.features.length === 0 && (
                <Typography variant="body2" className="text-gray-400">
                  No features added yet
                </Typography>
              )}
            </Box>
          </Grid>



          {/* Display Order */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Display Order"
              type="number"
              value={formData.displayOrder}
              onChange={handleChange("displayOrder")}
              size="small"
              helperText="Order in which plan appears (0 = first)"
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
              label="Active (available for purchase)"
            />
          </Grid>
        </Grid>
      </DialogContent>

      {/* Actions */}
      <DialogActions className="p-4 bg-gray-50">
        <Button onClick={handleClose} color="inherit" disabled={isUpdating}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isUpdating}
          className="bg-indigo-600 hover:bg-indigo-700"
          startIcon={isUpdating ? <CircularProgress size={16} /> : <EditIcon />}
        >
          {isUpdating ? "Updating..." : "Update Plan"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditMembershipModal;

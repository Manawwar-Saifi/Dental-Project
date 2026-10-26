/**
 * Edit Patient Modal
 *
 * Form modal to edit an existing patient's information.
 * Pre-fills with existing patient data.
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
  Chip,
  InputAdornment,
  CircularProgress,
  Avatar,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { filterName, NAME_PLACEHOLDER } from "../../../utils/nameInput";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import AddIcon from "@mui/icons-material/Add";
import { toast } from "react-toastify";
import { usePatientMutations } from "../../../hooks/admin/usePatients";

/**
 * Gender options
 */
const genderOptions = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

/**
 * Blood group options
 */
const bloodGroupOptions = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

/**
 * Format date for input field (YYYY-MM-DD)
 */
const formatDateForInput = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return d.toISOString().split("T")[0];
};

const EditPatientModal = ({ open, onClose, patient, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    gender: "",
    dateOfBirth: "",
    bloodGroup: "",
    address: {
      street: "",
      city: "",
      state: "Haryana",
      pincode: "",
    },
    emergencyContact: {
      name: "",
      phone: "",
      relation: "",
    },
    allergies: [],
    medicalHistory: [],
    notes: "",
    isActive: true,
  });
  const [allergyInput, setAllergyInput] = useState("");
  const [historyInput, setHistoryInput] = useState("");
  const [errors, setErrors] = useState({});

  const { updatePatient, isUpdating } = usePatientMutations();

  /**
   * Initialize form with patient data when modal opens
   */
  useEffect(() => {
    if (patient && open) {
      setFormData({
        name: patient.name || "",
        phone: patient.phone || "",
        email: patient.email || "",
        gender: patient.gender || "",
        dateOfBirth: formatDateForInput(patient.dateOfBirth),
        bloodGroup: patient.bloodGroup || "",
        address: {
          street: patient.address?.street || "",
          city: patient.address?.city || "",
          state: patient.address?.state || "Haryana",
          pincode: patient.address?.pincode || "",
        },
        emergencyContact: {
          name: patient.emergencyContact?.name || "",
          phone: patient.emergencyContact?.phone || "",
          relation: patient.emergencyContact?.relation || "",
        },
        allergies: patient.allergies || [],
        medicalHistory: patient.medicalHistory || [],
        notes: patient.notes || "",
        isActive: patient.isActive !== undefined ? patient.isActive : true,
      });
      setErrors({});
    }
  }, [patient, open]);

  /**
   * Handle input change
   */
  const handleChange = (e) => {
    const { name } = e.target;
    // Person-name fields accept letters, spaces and dots only
    const value =
      name === "name" || name === "emergencyContact.name"
        ? filterName(e.target.value)
        : e.target.value;

    // Handle nested fields
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  /**
   * Add allergy to list
   */
  const handleAddAllergy = () => {
    if (
      allergyInput.trim() &&
      !formData.allergies.includes(allergyInput.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        allergies: [...prev.allergies, allergyInput.trim()],
      }));
      setAllergyInput("");
    }
  };

  /**
   * Remove allergy from list
   */
  const handleRemoveAllergy = (allergy) => {
    setFormData((prev) => ({
      ...prev,
      allergies: prev.allergies.filter((a) => a !== allergy),
    }));
  };

  /**
   * Add medical history item
   */
  const handleAddHistory = () => {
    if (
      historyInput.trim() &&
      !formData.medicalHistory.includes(historyInput.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        medicalHistory: [...prev.medicalHistory, historyInput.trim()],
      }));
      setHistoryInput("");
    }
  };

  /**
   * Remove medical history item
   */
  const handleRemoveHistory = (item) => {
    setFormData((prev) => ({
      ...prev,
      medicalHistory: prev.medicalHistory.filter((h) => h !== item),
    }));
  };

  /**
   * Validate form
   */
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = "Phone must be 10 digits";
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submit
   */
  const handleSubmit = () => {
    if (!validateForm()) return;

    // Clean up data - only send changed fields
    const cleanData = {
      name: formData.name,
      phone: formData.phone,
      email: formData.email || undefined,
      gender: formData.gender || undefined,
      dateOfBirth: formData.dateOfBirth || undefined,
      bloodGroup: formData.bloodGroup || undefined,
      address: Object.values(formData.address).some((v) => v)
        ? formData.address
        : undefined,
      emergencyContact: formData.emergencyContact.name
        ? formData.emergencyContact
        : undefined,
      allergies: formData.allergies,
      medicalHistory: formData.medicalHistory,
      notes: formData.notes || undefined,
      isActive: formData.isActive,
    };

    updatePatient(
      { id: patient._id, data: cleanData },
      {
        onSuccess: (response) => {
          onSuccess?.(response);
          onClose();
        },
        onError: (error) => {
          toast.error(
            error.response?.data?.message || "Failed to update patient"
          );
        },
      }
    );
  };

  /**
   * Handle modal close
   */
  const handleClose = () => {
    if (!isUpdating) {
      setErrors({});
      onClose();
    }
  };

  if (!patient) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        className: "rounded-xl",
      }}
    >
      {/* Header */}
      <DialogTitle className="bg-linear-to-r from-orange-500 to-orange-600 text-white">
        <Box className="flex items-center justify-between">
          <Box className="flex items-center gap-3">
            <Avatar className="bg-white text-orange-600">
              {patient.name?.[0]?.toUpperCase() || "P"}
            </Avatar>
            <Box>
              <Typography variant="h6" component="span" className="font-bold text-white">
                Edit Patient
              </Typography>
              <Typography variant="caption" className="text-orange-100">
                {patient.name} • {patient.phone}
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={handleClose}
            className="text-white"
            disabled={isUpdating}
          >
            <CloseIcon className="text-white" />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* Content */}
      <DialogContent className="p-6">
        <Grid container spacing={3} className="mt-2">
          {/* Basic Info */}
          <Grid size={{ xs: 12 }}>
            <Typography
              variant="subtitle2"
              className="font-semibold text-gray-700 mb-2"
            >
              Basic Information
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Full Name"
              name="name"
              placeholder={NAME_PLACEHOLDER}
              value={formData.name}
              onChange={handleChange}
              error={!!errors.name}
              helperText={errors.name}
              required
              size="small"
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              error={!!errors.phone}
              helperText={errors.phone}
              required
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">+91</InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
              size="small"
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              select
              size="small"
            >
              <MenuItem value="">Select Gender</MenuItem>
              {genderOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Date of Birth"
              name="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={handleChange}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Blood Group"
              name="bloodGroup"
              value={formData.bloodGroup}
              onChange={handleChange}
              select
              size="small"
            >
              <MenuItem value="">Select Blood Group</MenuItem>
              {bloodGroupOptions.map((bg) => (
                <MenuItem key={bg} value={bg}>
                  {bg}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Status */}
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Status"
              name="isActive"
              value={formData.isActive}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  isActive: e.target.value === "true",
                }))
              }
              select
              size="small"
            >
              <MenuItem value="true">Active</MenuItem>
              <MenuItem value="false">Inactive</MenuItem>
            </TextField>
          </Grid>

          {/* Address */}
          <Grid size={{ xs: 12 }}>
            <Typography
              variant="subtitle2"
              className="font-semibold text-gray-700 mb-2 mt-2"
            >
              Address
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              label="Street Address"
              name="address.street"
              value={formData.address.street}
              onChange={handleChange}
              size="small"
            />
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              label="City"
              name="address.city"
              value={formData.address.city}
              onChange={handleChange}
              size="small"
            />
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              label="State"
              name="address.state"
              value={formData.address.state}
              onChange={handleChange}
              size="small"
            />
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              label="Pincode"
              name="address.pincode"
              value={formData.address.pincode}
              onChange={handleChange}
              size="small"
            />
          </Grid>

          {/* Emergency Contact */}
          <Grid size={{ xs: 12 }}>
            <Typography
              variant="subtitle2"
              className="font-semibold text-gray-700 mb-2 mt-2"
            >
              Emergency Contact
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Contact Name"
              name="emergencyContact.name"
              placeholder="Enter contact name"
              value={formData.emergencyContact.name}
              onChange={handleChange}
              size="small"
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Contact Phone"
              name="emergencyContact.phone"
              value={formData.emergencyContact.phone}
              onChange={handleChange}
              size="small"
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Relation"
              name="emergencyContact.relation"
              value={formData.emergencyContact.relation}
              onChange={handleChange}
              size="small"
              placeholder="e.g., Spouse, Parent"
            />
          </Grid>

          {/* Medical Info */}
          <Grid size={{ xs: 12 }}>
            <Typography
              variant="subtitle2"
              className="font-semibold text-gray-700 mb-2 mt-2"
            >
              Medical Information
            </Typography>
          </Grid>

          {/* Allergies */}
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Add Allergy"
              value={allergyInput}
              onChange={(e) => setAllergyInput(e.target.value)}
              onKeyPress={(e) =>
                e.key === "Enter" && (e.preventDefault(), handleAddAllergy())
              }
              size="small"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleAddAllergy} size="small">
                      <AddIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Box className="flex flex-wrap gap-1 mt-2">
              {formData.allergies.map((allergy, idx) => (
                <Chip
                  key={idx}
                  label={allergy}
                  size="small"
                  color="error"
                  variant="outlined"
                  onDelete={() => handleRemoveAllergy(allergy)}
                />
              ))}
            </Box>
          </Grid>

          {/* Medical History */}
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Add Medical Condition"
              value={historyInput}
              onChange={(e) => setHistoryInput(e.target.value)}
              onKeyPress={(e) =>
                e.key === "Enter" && (e.preventDefault(), handleAddHistory())
              }
              size="small"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleAddHistory} size="small">
                      <AddIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Box className="flex flex-wrap gap-1 mt-2">
              {formData.medicalHistory.map((item, idx) => (
                <Chip
                  key={idx}
                  label={item}
                  size="small"
                  variant="outlined"
                  onDelete={() => handleRemoveHistory(item)}
                />
              ))}
            </Box>
          </Grid>

          {/* Notes */}
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Internal Notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              multiline
              rows={2}
              size="small"
              placeholder="Notes visible only to staff"
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
          className="bg-orange-500 hover:bg-orange-600"
          startIcon={
            isUpdating ? <CircularProgress size={16} /> : <SaveIcon />
          }
        >
          {isUpdating ? "Saving..." : "Save Changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditPatientModal;

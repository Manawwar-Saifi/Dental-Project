/**
 * Add Patient Modal
 *
 * Form modal to create a new patient with all necessary fields.
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
  Alert,
} from "@mui/material";
import { toast } from "react-toastify";
import Grid from "@mui/material/Grid";
import CloseIcon from "@mui/icons-material/Close";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import AddIcon from "@mui/icons-material/Add";
import { usePatientMutations } from "../../../hooks/admin/usePatients";
import { todayStr, dateGuards } from "../../../utils/dateInput";
import { filterName, NAME_PLACEHOLDER } from "../../../utils/nameInput";

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
 * Initial form state
 */
const initialFormState = {
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
};

const AddPatientModal = ({ open, onClose, onSuccess }) => {
  const [formData, setFormData] = useState(initialFormState);
  const [allergyInput, setAllergyInput] = useState("");
  const [historyInput, setHistoryInput] = useState("");
  const [errors, setErrors] = useState({});
  // Incremented each time the modal opens so React unmounts and remounts all
  // form TextFields, destroying any browser autofill field associations.
  const [formKey, setFormKey] = useState(0);
  useEffect(() => {
    if (open) setFormKey((k) => k + 1);
  }, [open]);

  const { createPatientAsync, isCreating } = usePatientMutations();

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

    // Clear field-specific error and any general API error
    setErrors((prev) => {
      if (!prev[name] && !prev._form) return prev;
      return { ...prev, [name]: "", _form: "" };
    });
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
   * Handle form submit.
   * Accepts the MouseEvent so we can stop propagation — prevents the click
   * from bubbling through the React fiber tree to any ancestor handler
   * (e.g. DataTable's search onChange) that could trigger an unintended filter.
   */
  const handleSubmit = async (e) => {
    e?.preventDefault();
    e?.stopPropagation();

    if (!validateForm()) return;

    // Clean up empty nested objects
    const cleanData = {
      ...formData,
      address: Object.values(formData.address).some((v) => v)
        ? formData.address
        : undefined,
      emergencyContact: formData.emergencyContact.name
        ? formData.emergencyContact
        : undefined,
      dateOfBirth: formData.dateOfBirth || undefined,
      gender: formData.gender || undefined,
      bloodGroup: formData.bloodGroup || undefined,
      notes: formData.notes || undefined,
    };

    try {
      const response = await createPatientAsync(cleanData);
      toast.success("Patient added successfully");
      setFormData(initialFormState);
      setErrors({});
      onSuccess?.(response);
      onClose();
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to create patient";
      // Show the error inline on the phone field when it's a duplicate-phone
      // rejection, or as a general form alert otherwise. Never trigger a
      // search/filter on the parent Patients list.
      const isPhoneError =
        error.response?.status === 409 ||
        message.toLowerCase().includes("phone") ||
        message.toLowerCase().includes("already exist");
      if (isPhoneError) {
        setErrors((prev) => ({ ...prev, phone: message }));
      } else {
        setErrors((prev) => ({ ...prev, _form: message }));
      }
    }
  };

  /**
   * Handle modal close
   */
  const handleClose = () => {
    if (!isCreating) {
      setFormData(initialFormState);
      setErrors({});
      onClose();
    }
  };

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
      <DialogTitle className="py-3 px-6 border-b border-gray-200">
        <Box className="flex items-center justify-between">
          <Box className="flex items-center gap-2">
            <PersonAddIcon className="text-gray-500" fontSize="small" />
            <Typography variant="subtitle1" className="text-gray-800">
              Add New Patient
            </Typography>
          </Box>
          <IconButton
            onClick={handleClose}
            size="small"
            className="text-gray-500"
            disabled={isCreating}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* Content */}
      <DialogContent className="px-5 py-3">
        <Grid container spacing={1.5} className="mt-0" key={formKey}>
          {/* General API error (non-phone errors) */}
          {errors._form && (
            <Grid size={{ xs: 12 }}>
              <Alert severity="error" sx={{ py: 0.5 }}>{errors._form}</Alert>
            </Grid>
          )}

          {/* Basic Info */}
          <Grid size={{ xs: 12 }}>
            <Typography
              variant="subtitle2"
              className="font-semibold text-gray-600 mb-0"
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
              inputProps={{ max: todayStr(), ...dateGuards }}
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

          {/* Address */}
          <Grid size={{ xs: 12 }}>
            <Typography
              variant="subtitle2"
              className="font-semibold text-gray-600 mb-0 mt-1"
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
              className="font-semibold text-gray-600 mb-0 mt-1"
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
              className="font-semibold text-gray-600 mb-0 mt-1"
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
            <Box className="flex flex-wrap gap-1 mt-1">
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
            <Box className="flex flex-wrap gap-1 mt-1">
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
      <DialogActions className="px-4 py-2 bg-gray-50 border-t border-gray-200">
        <Button onClick={handleClose} color="inherit" disabled={isCreating}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isCreating}
          className="bg-green-600 hover:bg-green-700"
          startIcon={
            isCreating ? <CircularProgress size={16} /> : <PersonAddIcon />
          }
        >
          {isCreating ? "Creating..." : "Create Patient"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddPatientModal;

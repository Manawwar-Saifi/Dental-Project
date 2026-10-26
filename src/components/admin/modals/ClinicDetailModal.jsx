/**
 * Clinic Detail Modal
 *
 * Displays complete clinic information.
 */
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Avatar,
  Chip,
  Divider,
  IconButton,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import CloseIcon from "@mui/icons-material/Close";
import BusinessIcon from "@mui/icons-material/Business";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PhoneIcon from "@mui/icons-material/Phone";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

/**
 * Info row component
 */
const InfoRow = ({ icon: Icon, label, value, color = "text-gray-600" }) => (
  <Box className="flex items-start gap-3 py-2">
    {Icon && <Icon className={`${color} mt-0.5`} fontSize="small" />}
    <Box>
      <Typography variant="caption" className="text-gray-500 block">
        {label}
      </Typography>
      <Typography variant="body2" className="font-medium">
        {value || "-"}
      </Typography>
    </Box>
  </Box>
);

/**
 * Format date
 */
const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/**
 * Format address
 */
const formatAddress = (address) => {
  if (!address) return "-";
  const parts = [
    address.street,
    address.area,
    address.city,
    address.state,
    address.pincode,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "-";
};

const ClinicDetailModal = ({ open, onClose, clinic, onEdit, onDelete, onPermanentDelete }) => {
  if (!clinic) return null;

  const { name, address, phone, isActive, createdAt, updatedAt } = clinic;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ className: "rounded-xl" }}
    >
      {/* Header */}
      <DialogTitle className="bg-linear-to-r from-blue-600 to-blue-700 text-white p-0">
        <Box className="flex items-center justify-between p-0">
          <Box className="flex items-center gap-4">
            <Avatar className="bg-white text-blue-600 w-14 h-14">
              <BusinessIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" component="span" className="font-bold">
                {name || "Clinic"}
              </Typography>
              <Box className="flex items-center gap-2 mt-1">
                <Chip
                  label={isActive ? "Active" : "Inactive"}
                  size="small"
                  color={isActive ? "success" : "default"}
                />
              </Box>
            </Box>
          </Box>
          <IconButton onClick={onClose}>
            <CloseIcon className="text-white" />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* Content */}
      <DialogContent className="p-6 mt-4">
        <Grid container spacing={4}>
          {/* Left Column */}
          <Grid size={{ xs: 12, md: 6 }}>
            {/* Basic Info */}
            <Typography
              variant="subtitle2"
              className="font-semibold text-gray-700 mb-3"
            >
              Clinic Information
            </Typography>
            <Box className="bg-gray-50 rounded-lg p-4 mb-4 mt-3">
              <InfoRow
                icon={BusinessIcon}
                label="Clinic Name"
                value={name}
                color="text-blue-600"
              />
              <InfoRow
                icon={PhoneIcon}
                label="Phone"
                value={phone}
                color="text-blue-600"
              />
            </Box>
          </Grid>

          {/* Right Column */}
          <Grid size={{ xs: 12, md: 6 }}>
            {/* Address */}
            <Typography
              variant="subtitle2"
              className="font-semibold text-gray-700 mb-3"
            >
              Address
            </Typography>
            <Box className="bg-gray-50 rounded-lg p-4 mb-4 mt-3">
              <InfoRow
                icon={LocationOnIcon}
                label="Full Address"
                value={formatAddress(address)}
                color="text-blue-600"
              />
              {address && (
                <>
                  <InfoRow label="City" value={address.city} />
                  <InfoRow label="State" value={address.state} />
                  <InfoRow label="Pincode" value={address.pincode} />
                </>
              )}
            </Box>

            {/* Status */}
            <Typography
              variant="subtitle2"
              className="font-semibold text-gray-700 mb-3"
            >
              Status
            </Typography>
            <Box className="bg-gray-50 rounded-lg p-4 mt-3 mb-3">
              <Box className="flex justify-between items-center py-2">
                <Typography variant="body2" className="text-gray-600">
                  Clinic Status
                </Typography>
                <Chip
                  label={isActive ? "Active" : "Inactive"}
                  size="small"
                  color={isActive ? "success" : "default"}
                />
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* Footer Info */}
        <Divider className="my-4" />
        <Box className="flex justify-between text-gray-400">
          <Typography variant="caption">
            Created: {formatDate(createdAt)}
          </Typography>
          <Typography variant="caption">
            Last Updated: {formatDate(updatedAt)}
          </Typography>
        </Box>
      </DialogContent>

      {/* Actions */}
      <DialogActions className="p-4 bg-gray-50 justify-between">
        <Box>
          {onDelete && isActive && (
            <Button
              variant="outlined"
              color="warning"
              onClick={() => onDelete(clinic)}
            >
              Deactivate
            </Button>
          )}
          {onPermanentDelete && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => onPermanentDelete(clinic)}
            >
              Delete Permanently
            </Button>
          )}
        </Box>
        <Box className="flex gap-2">
          <Button onClick={onClose} color="inherit">
            Close
          </Button>
          {onEdit && (
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => onEdit(clinic)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Edit Clinic
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default ClinicDetailModal;

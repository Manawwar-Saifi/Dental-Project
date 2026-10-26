/**
 * Treatment Detail Modal
 *
 * Displays complete treatment type information.
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
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import CategoryIcon from "@mui/icons-material/Category";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import TimerIcon from "@mui/icons-material/Timer";
import RepeatIcon from "@mui/icons-material/Repeat";
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

const TreatmentDetailModal = ({ open, onClose, treatment, onEdit, onDelete }) => {
  if (!treatment) return null;

  const {
    code,
    name,
    category,
    description,
    price,
    priceRange,
    sessionsRequired,
    duration,
    isActive,
    createdAt,
    updatedAt,
  } = treatment;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ className: "rounded-xl" }}
    >
      {/* Header */}
      <DialogTitle className="bg-linear-to-r from-teal-600 to-teal-700 text-white p-0">
        <Box className="flex items-center justify-between p-0">
          <Box className="flex items-center gap-4">
            <Avatar className="bg-white text-teal-600 w-14 h-14">
              <LocalHospitalIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" className="font-bold">
                {name || "Treatment"}
              </Typography>
              <Box className="flex items-center gap-2 mt-1">
                <Chip
                  label={code}
                  size="small"
                  className="bg-white/20 text-white font-mono"
                />
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
      <DialogContent className="p-6 mt-8">
        <Grid container spacing={4}>
          {/* Left Column */}
          <Grid size={{ xs: 12, md: 6 }}>
            {/* Basic Info */}
            <Typography variant="subtitle2" className="font-semibold text-gray-700 mb-3">
              Treatment Information
            </Typography>
            <Box className="bg-gray-50 rounded-lg p-4 mb-4 mt-3">
              <InfoRow
                icon={CategoryIcon}
                label="Category"
                value={category}
                color="text-teal-600"
              />
              <InfoRow
                icon={AttachMoneyIcon}
                label="Price"
                value={<span className="font-numbers">{priceRange ? `₹${priceRange.min} - ₹${priceRange.max}` : `₹${price}`}</span>}
                color="text-teal-600"
              />
              <InfoRow
                icon={RepeatIcon}
                label="Sessions Required"
                value={sessionsRequired ? `${sessionsRequired} session(s)` : "Single session"}
              />
              <InfoRow
                icon={TimerIcon}
                label="Duration"
                value={duration ? `${duration} minutes` : "-"}
              />
            </Box>
          </Grid>

          {/* Right Column */}
          <Grid size={{ xs: 12, md: 6 }}>
            {/* Description */}
            <Typography variant="subtitle2" className="font-semibold text-gray-700 mb-3">
              Description
            </Typography>
            <Box className="bg-gray-50 rounded-lg p-4 mb-4 mt-3">
              <Typography variant="body2">
                {description || "No description available"}
              </Typography>
            </Box>

            {/* Status */}
            <Typography variant="subtitle2" className="font-semibold text-gray-700 mb-3">
              Status
            </Typography>
            <Box className="bg-gray-50 rounded-lg p-4 mt-3">
              <Box className="flex justify-between items-center py-2">
                <Typography variant="body2" className="text-gray-600">
                  Treatment Status
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
          <Typography variant="caption">Created: {formatDate(createdAt)}</Typography>
          <Typography variant="caption">Last Updated: {formatDate(updatedAt)}</Typography>
        </Box>
      </DialogContent>

      {/* Actions */}
      <DialogActions className="p-4 bg-gray-50 justify-between">
        <Box>
          {onDelete && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => onDelete(treatment)}
            >
              Deactivate
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
              onClick={() => onEdit(treatment)}
              className="bg-teal-600 hover:bg-teal-700"
            >
              Edit Treatment
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default TreatmentDetailModal;

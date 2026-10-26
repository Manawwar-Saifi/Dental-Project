/**
 * Delete Confirmation Modal
 *
 * Reusable modal for confirming delete/deactivate actions.
 * Supports soft delete (deactivate) pattern.
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
  IconButton,
  CircularProgress,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import DeleteIcon from "@mui/icons-material/Delete";

const DeleteConfirmModal = ({
  open,
  onClose,
  onConfirm,
  title = "Confirm Delete",
  itemName = "this item",
  itemType = "item",
  isDeleting = false,
  error = "",
  softDelete = true, // If true, shows "deactivate" instead of "delete"
}) => {
  const actionWord = softDelete ? "deactivate" : "delete";
  const actionWordCapitalized = softDelete ? "Deactivate" : "Delete";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        className: "rounded-xl",
      }}
    >
      {/* Header */}
      <DialogTitle className="bg-linear-to-r from-red-500 to-red-600 text-white">
        <Box className="flex items-center justify-between">
          <Box className="flex items-center gap-2">
            <WarningAmberIcon className="text-white" />
            <Typography variant="h6" className="font-bold text-white">
              {title}
            </Typography>
          </Box>
          <IconButton onClick={onClose} disabled={isDeleting}>
            <CloseIcon className="text-white" />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* Content */}
      <DialogContent className="p-6">
        {error && (
          <Alert severity="error" className="mb-4">
            {error}
          </Alert>
        )}

        <Box className="text-center py-4">
          <Box className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <DeleteIcon className="text-red-500 text-3xl" />
          </Box>

          <Typography variant="h6" className="mb-2 text-gray-800">
            Are you sure you want to {actionWord}?
          </Typography>

          <Typography variant="body2" className="text-gray-600 mb-4">
            You are about to {actionWord}{" "}
            <span className="font-semibold text-gray-800">{itemName}</span>
          </Typography>

          {softDelete ? (
            <Alert severity="info" className="text-left">
              <Typography variant="body2">
                This {itemType} will be deactivated and hidden from active lists.
                You can reactivate it later if needed.
              </Typography>
            </Alert>
          ) : (
            <Alert severity="warning" className="text-left">
              <Typography variant="body2">
                This action cannot be undone. The {itemType} will be permanently
                removed from the system.
              </Typography>
            </Alert>
          )}
        </Box>
      </DialogContent>

      {/* Actions */}
      <DialogActions className="p-4 bg-gray-50">
        <Button onClick={onClose} color="inherit" disabled={isDeleting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onConfirm}
          disabled={isDeleting}
          className="bg-red-500 hover:bg-red-600"
          startIcon={
            isDeleting ? <CircularProgress size={16} /> : <DeleteIcon />
          }
        >
          {isDeleting ? `${actionWordCapitalized}ing...` : actionWordCapitalized}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteConfirmModal;

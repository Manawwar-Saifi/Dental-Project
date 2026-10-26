/**
 * User Detail Modal
 *
 * Shows user/staff details with edit and deactivate/reactivate actions.
 */
import { useState, useMemo } from "react";
import { filterName, NAME_PLACEHOLDER } from "../../../utils/nameInput";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  IconButton,
  CircularProgress,
  TextField,
  MenuItem,
  Avatar,
  Divider,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import CloseIcon from "@mui/icons-material/Close";
import PersonIcon from "@mui/icons-material/Person";
import EditIcon from "@mui/icons-material/Edit";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import { toast } from "react-toastify";
import ConfirmDialog from "../../common/ConfirmDialog";
import { useUserMutations } from "../../../hooks/admin/useUsers";
import { usePermissions } from "../../../hooks/admin/usePermissions";
import { useAdminStore } from "../../../store/admin.store";

const roleOptions = [
  { value: "admin", label: "Admin" },
  { value: "user", label: "Staff" },
];

const formatDate = (date) => {
  if (!date) return "Never";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const InfoRow = ({ label, children }) => (
  <Box className="flex justify-between items-center py-1.5">
    <Typography variant="body2" className="text-gray-500">
      {label}
    </Typography>
    <Box component="div" className="font-medium text-sm">
      {children}
    </Box>
  </Box>
);

const UserDetailModal = ({ open, onClose, user, onRefresh }) => {
  const currentAdmin = useAdminStore((state) => state.admin);
  const { hasPermission } = usePermissions();
  const canEditStaff = hasPermission("staff", "edit");
  const canDeleteStaff = hasPermission("staff", "delete");
  const isSelf = useMemo(
    () => currentAdmin?._id === user?._id,
    [currentAdmin?._id, user?._id]
  );

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});

  const {
    updateUser,
    isUpdating,
    deactivateUser,
    isDeactivating,
    reactivateUser,
    isReactivating,
    permanentDeleteUser,
    isPermanentDeleting,
  } = useUserMutations();

  const handleEdit = () => {
    setEditData({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      role: user?.role || "user",
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!editData.name.trim()) return toast.error("Name is required");
    if (!editData.email.trim()) return toast.error("Email is required");

    updateUser(
      { id: user._id, data: editData },
      {
        onSuccess: () => {
          setIsEditing(false);
          onRefresh?.();
        },
        onError: (err) =>
          toast.error(err.response?.data?.message || "Failed to update user"),
      }
    );
  };

  const [confirmAction, setConfirmAction] = useState(null); // { type, title, message }

  const handleDeactivate = () => {
    setConfirmAction({
      type: "deactivate",
      title: "Deactivate Staff",
      message: `Are you sure you want to deactivate "${user?.name}"? They will lose access.`,
    });
  };

  const executeDeactivate = () => {
    deactivateUser(user._id, {
      onSuccess: () => { toast.success("Staff deactivated"); setConfirmAction(null); onRefresh?.(); },
      onError: (err) => toast.error(err.response?.data?.message || "Failed to deactivate"),
    });
  };

  const handleReactivate = () => {
    reactivateUser(user._id, {
      onSuccess: () => onRefresh?.(),
      onError: (err) =>
        toast.error(err.response?.data?.message || "Failed to reactivate"),
    });
  };

  const handlePermanentDelete = () => {
    setConfirmAction({
      type: "delete",
      title: "Delete Staff Permanently",
      message: `Are you sure you want to permanently delete "${user?.name}"? This action cannot be undone.`,
    });
  };

  const executePermanentDelete = () => {
    permanentDeleteUser(user._id, {
      onSuccess: () => { toast.success("Deleted successfully"); setConfirmAction(null); onRefresh?.(); handleClose(); },
      onError: (err) => toast.error(err.response?.data?.message || "Failed to delete user"),
    });
  };

  const handleClose = () => {
    setIsEditing(false);
    onClose();
  };

  if (!user) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ className: "rounded-xl" }}
    >
      {/* Header */}
      <DialogTitle className="bg-linear-to-r from-purple-600 to-purple-700 text-white">
        <Box className="flex items-center justify-between">
          <Box className="flex items-center gap-3">
            <Avatar
              src={user.profilePicture?.url}
              sx={{ width: 40, height: 40, bgcolor: "rgba(255,255,255,0.2)" }}
            >
              {user.name?.[0]?.toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h6" component="span" className="font-bold">
                {user.name}
              </Typography>
              <Box className="flex gap-2 mt-0.5">
                <Chip
                  label={user.role === "admin" ? "Admin" : "Staff"}
                  size="small"
                  className="text-xs"
                  sx={{
                    bgcolor: "rgba(255,255,255,0.2)",
                    color: "white",
                  }}
                />
                <Chip
                  label={user.isActive ? "Active" : "Inactive"}
                  size="small"
                  color={user.isActive ? "success" : "default"}
                  className="text-xs"
                />
              </Box>
            </Box>
          </Box>
          <IconButton onClick={handleClose}>
            <CloseIcon className="text-white" />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* Content */}
      <DialogContent className="p-6 mt-2">
        {isEditing ? (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Name"
                placeholder={NAME_PLACEHOLDER}
                value={editData.name}
                onChange={(e) =>
                  setEditData((prev) => ({ ...prev, name: filterName(e.target.value) }))
                }
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Email"
                value={editData.email}
                onChange={(e) =>
                  setEditData((prev) => ({ ...prev, email: e.target.value }))
                }
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Phone"
                value={editData.phone}
                onChange={(e) =>
                  setEditData((prev) => ({ ...prev, phone: e.target.value }))
                }
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label="Role"
                value={editData.role}
                onChange={(e) =>
                  setEditData((prev) => ({ ...prev, role: e.target.value }))
                }
                size="small"
              >
                {roleOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        ) : (
          <>
            <InfoRow label="Email">{user.email}</InfoRow>
            <Divider />
            <InfoRow label="Phone">{user.phone || "-"}</InfoRow>
            <Divider />
            <InfoRow label="Role">
              <Chip
                label={user.role === "admin" ? "Admin" : "Staff"}
                size="small"
                color={user.role === "admin" ? "primary" : "default"}
              />
            </InfoRow>
            <Divider />
            <InfoRow label="Status">
              <Chip
                label={user.isActive ? "Active" : "Inactive"}
                size="small"
                color={user.isActive ? "success" : "error"}
              />
            </InfoRow>
            <Divider />
            <InfoRow label="Last Login">{formatDate(user.lastLogin)}</InfoRow>
            <Divider />
            <InfoRow label="Created">{formatDate(user.createdAt)}</InfoRow>
          </>
        )}
      </DialogContent>

      {/* Actions */}
      <DialogActions className="p-4 bg-gray-50">
        <Button onClick={handleClose} color="inherit">
          Close
        </Button>

        {isEditing ? (
          <>
            <Button onClick={() => setIsEditing(false)} color="inherit">
              Cancel Edit
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={isUpdating}
              className="bg-purple-600 hover:bg-purple-700"
              startIcon={
                isUpdating ? <CircularProgress size={16} /> : <SaveIcon />
              }
            >
              Save Changes
            </Button>
          </>
        ) : (
          <>
            {isSelf && (
              <Chip label="This is your account" size="small" color="info" />
            )}
            {!isSelf && user.isActive ? (
              canDeleteStaff && (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={
                    isDeactivating ? (
                      <CircularProgress size={16} />
                    ) : (
                      <BlockIcon />
                    )
                  }
                  onClick={handleDeactivate}
                  disabled={isDeactivating}
                >
                  Deactivate
                </Button>
              )
            ) : !isSelf ? (
              <>
                {canDeleteStaff && (
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={
                      isPermanentDeleting ? (
                        <CircularProgress size={16} />
                      ) : (
                        <DeleteIcon />
                      )
                    }
                    onClick={handlePermanentDelete}
                    disabled={isPermanentDeleting || isReactivating}
                  >
                    Delete Permanently
                  </Button>
                )}
                {canEditStaff && (
                  <Button
                    variant="outlined"
                    color="success"
                    startIcon={
                      isReactivating ? (
                        <CircularProgress size={16} />
                      ) : (
                        <CheckCircleIcon />
                      )
                    }
                    onClick={handleReactivate}
                    disabled={isReactivating || isPermanentDeleting}
                  >
                    Reactivate
                  </Button>
                )}
              </>
            ) : null}
            {canEditStaff && (
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={handleEdit}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Edit
              </Button>
            )}
          </>
        )}
      </DialogActions>

      {/* Confirm Dialog for deactivate/delete */}
      <ConfirmDialog
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={confirmAction?.type === "delete" ? executePermanentDelete : executeDeactivate}
        title={confirmAction?.title || ""}
        message={confirmAction?.message || ""}
        confirmText={confirmAction?.type === "delete" ? "Delete" : "Deactivate"}
        confirmColor={confirmAction?.type === "delete" ? "error" : "warning"}
        loading={confirmAction?.type === "delete" ? isPermanentDeleting : isDeactivating}
      />
    </Dialog>
  );
};

export default UserDetailModal;

/**
 * Permission Manager (admin-only)
 *
 * Matrix editor for the Permission collection that backend routes now
 * enforce via checkPermission(). Role selector + a table of modules x
 * View/Create/Edit/Delete checkboxes, auto-saving each toggle.
 */
import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  Checkbox,
  MenuItem,
  TextField,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import { toast } from "react-toastify";
import { usePermissionMatrix, usePermissionMutations } from "../../hooks/admin/usePermissions";
import { useAdminStore } from "../../store/admin.store";

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "user", label: "Staff" },
  { value: "blog_editor", label: "SEO Executive" },
  { value: "clinic_manager", label: "Clinic Manager" },
];

const MODULE_LABELS = {
  dashboard: "Dashboard",
  patients: "Patients",
  enquiries: "Enquiries",
  appointments: "Appointments",
  treatments: "Treatments (patient work)",
  treatment_catalog: "Treatment Catalog (price list)",
  lab: "Lab",
  payments: "Payment History",
  billing: "Billing",
  expenses: "Expenses",
  external_income: "External Income",
  reports: "Reports",
  memberships: "Memberships",
  blogs: "Blogs",
  notifications: "Notifications",
  clinics: "Clinics",
  staff: "Staff",
  settings: "Settings",
};

const ACTIONS = ["view", "create", "edit", "delete"];

const PermissionManager = () => {
  const { admin } = useAdminStore();
  const [selectedRole, setSelectedRole] = useState("admin");
  const [confirmState, setConfirmState] = useState(null); // { module, action, value } | null

  const { data, isLoading, isError } = usePermissionMatrix();
  const { updatePermission, isUpdating } = usePermissionMutations();

  const allPermissions = data?.data?.permissions || [];
  const rowsForRole = allPermissions.filter((p) => p.role === selectedRole);
  const getRow = (module) => rowsForRole.find((r) => r.module === module) || {};

  const applyToggle = (module, action, value) => {
    updatePermission(
      { role: selectedRole, module, data: { [action]: value } },
      {
        onSuccess: () => toast.success(`${MODULE_LABELS[module]} — ${action} ${value ? "granted" : "revoked"}`),
        onError: (err) => toast.error(err.response?.data?.message || "Failed to update permission"),
      }
    );
  };

  const handleToggle = (module, action, currentValue) => {
    const nextValue = !currentValue;

    // Self-lockout guard: editing your OWN role and removing YOUR OWN view
    // access to a module. Not a hard block (an admin might legitimately
    // want this), but requires an explicit confirmation so it can't happen
    // from a stray click.
    const isEditingOwnRole = selectedRole === admin?.role;
    if (isEditingOwnRole && action === "view" && currentValue === true) {
      setConfirmState({ module, action, value: nextValue });
      return;
    }

    applyToggle(module, action, nextValue);
  };

  const confirmSelfLockout = () => {
    if (confirmState) {
      applyToggle(confirmState.module, confirmState.action, confirmState.value);
    }
    setConfirmState(null);
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Permission Manager
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Controls what each role can view, create, edit, and delete across every module. Changes save immediately.
        </Typography>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            select
            label="Role"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            size="small"
            sx={{ minWidth: 220 }}
          >
            {ROLE_OPTIONS.map((r) => (
              <MenuItem key={r.value} value={r.value}>
                {r.label}
              </MenuItem>
            ))}
          </TextField>
          {selectedRole === admin?.role && (
            <Alert severity="info" sx={{ mt: 2 }}>
              You're editing your own role's permissions. Removing your own "View" access to a module will hide it
              from your sidebar immediately.
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
          {isLoading ? (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <CircularProgress />
            </Box>
          ) : isError ? (
            <Alert severity="error" sx={{ m: 2 }}>
              Failed to load the permission matrix.
            </Alert>
          ) : (
            <TableContainer component={Paper} elevation={0}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                    <TableCell sx={{ fontWeight: 700 }}>Module</TableCell>
                    {ACTIONS.map((a) => (
                      <TableCell key={a} align="center" sx={{ fontWeight: 700, textTransform: "capitalize" }}>
                        {a}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.keys(MODULE_LABELS).map((module) => {
                    const row = getRow(module);
                    return (
                      <TableRow key={module} hover>
                        <TableCell>{MODULE_LABELS[module]}</TableCell>
                        {ACTIONS.map((action) => (
                          <TableCell key={action} align="center">
                            <Checkbox
                              checked={!!row[action]}
                              disabled={isUpdating}
                              onChange={() => handleToggle(module, action, !!row[action])}
                              size="small"
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!confirmState} onClose={() => setConfirmState(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Remove your own access?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            You're about to remove your own <strong>View</strong> access to{" "}
            <strong>{confirmState ? MODULE_LABELS[confirmState.module] : ""}</strong>. It will disappear from your
            sidebar immediately. You can restore it later from this same Permission Manager page.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmState(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={confirmSelfLockout}>
            Remove Access
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PermissionManager;

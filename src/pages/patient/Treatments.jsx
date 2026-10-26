/**
 * Patient Treatments Page
 *
 * Shows treatment history and ongoing treatments
 */
import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  TextField,
  MenuItem,
  LinearProgress,
} from "@mui/material";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import { useMyTreatments } from "../../hooks/patient/useMyTreatments";

const statusColors = {
  planned: "info",
  in_progress: "warning",
  completed: "success",
  cancelled: "error",
  on_hold: "default",
};

const statusLabels = {
  planned: "Planned",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
  on_hold: "On Hold",
};

const categoryLabels = {
  preventive: "Preventive",
  restorative: "Restorative",
  endodontic: "Endodontic",
  periodontic: "Periodontic",
  prosthodontic: "Prosthodontic",
  orthodontic: "Orthodontic",
  surgical: "Surgical",
  cosmetic: "Cosmetic",
  pediatric: "Pediatric",
  other: "Other",
};

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatCurrency = (val) => `₹${(val || 0).toLocaleString("en-IN")}`;

const Treatments = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading, error } = useMyTreatments({
    page,
    limit,
    ...(statusFilter && { status: statusFilter }),
  });

  const treatments = data?.data || [];
  const pagination = data?.pagination || { total: 0 };

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          My Treatments
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View your treatment history and ongoing treatments
        </Typography>
      </Box>

      {/* Filter */}
      <Box sx={{ mb: 3 }}>
        <TextField
          select
          size="small"
          label="Filter by Status"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">All Statuses</MenuItem>
          {Object.entries(statusLabels).map(([value, label]) => (
            <MenuItem key={value} value={value}>
              {label}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {/* Treatments List */}
      <Card>
        <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
          {isLoading ? (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <CircularProgress />
              <Typography sx={{ mt: 2 }} color="text.secondary">
                Loading treatments...
              </Typography>
            </Box>
          ) : error ? (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <Typography color="error">
                Failed to load treatments. Please try again.
              </Typography>
            </Box>
          ) : treatments.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <MedicalServicesIcon sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No treatments found
              </Typography>
              <Typography variant="body2" color="text.disabled">
                Your treatment records will appear here
              </Typography>
            </Box>
          ) : (
            <>
              <TableContainer component={Paper} elevation={0}>
                <Table sx={{ bgcolor: "white", minWidth: "max-content" }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                      <TableCell>Treatment</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Clinic</TableCell>
                      <TableCell>Started</TableCell>
                      <TableCell>Sessions</TableCell>
                      <TableCell>Cost</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {treatments.map((treatment) => {
                      const sessionsCompleted = treatment.sessions?.filter(
                        (s) => s.status === "completed"
                      ).length || 0;
                      // sessionsPlanned (the admin's real input at booking) must win over
                      // sessions.length (sessions actually booked so far) -- otherwise a
                      // freshly-booked treatment with sessionsPlanned=3 but only the initial
                      // booking session so far incorrectly shows "1" as if that were the total.
                      const totalSessions =
                        treatment.sessionsPlanned || treatment.treatmentType?.sessionsRequired || treatment.sessions?.length || 1;
                      const progress = totalSessions > 0
                        ? Math.round((sessionsCompleted / totalSessions) * 100)
                        : 0;

                      return (
                        <TableRow key={treatment._id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {treatment.treatmentType?.name || treatment.name || "-"}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={
                                categoryLabels[treatment.treatmentType?.category] ||
                                treatment.treatmentType?.category ||
                                "-"
                              }
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {treatment.clinic?.name || "-"}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatDate(treatment.startDate || treatment.createdAt)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ minWidth: 80 }}>
                              <Typography variant="caption" className="text-gray-600">
                                {sessionsCompleted}/{totalSessions}
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={progress}
                                sx={{ height: 6, borderRadius: 3, mt: 0.5 }}
                                color={progress === 100 ? "success" : "primary"}
                              />
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {formatCurrency(treatment.treatmentType?.price || treatment.cost)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={statusLabels[treatment.status] || treatment.status}
                              size="small"
                              color={statusColors[treatment.status] || "default"}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              {pagination.total > limit && (
                <TablePagination
                  component="div"
                  count={pagination.total}
                  page={page - 1}
                  onPageChange={(_, p) => setPage(p + 1)}
                  rowsPerPage={limit}
                  onRowsPerPageChange={(e) => {
                    setLimit(parseInt(e.target.value, 10));
                    setPage(1);
                  }}
                  rowsPerPageOptions={[10, 25, 50]}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default Treatments;

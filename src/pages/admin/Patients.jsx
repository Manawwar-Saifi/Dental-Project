/**
 * Admin Patients Page
 *
 * Displays list of all patients with:
 * - Search by name/phone
 * - Filter by membership status
 * - Pagination (10 per page)
 * - Click to view patient details in modal
 * - Add, Edit, Delete (soft) patient via modals
 */
import React, { useState, useEffect } from "react";
import { Box, Typography, Button, Avatar, Chip, Menu, MenuItem, ListItemIcon, ListItemText } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import DescriptionIcon from "@mui/icons-material/Description";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import { toast } from "react-toastify";
import { useSearchParams } from "react-router-dom";
import DataTable from "../../components/common/DataTable";
import { usePatients, usePatientMutations } from "../../hooks/admin/usePatients";
import { usePermissions } from "../../hooks/admin/usePermissions";
import { getPatient, getPatientsExportUrl } from "../../api/admin/patients.api";
import { useAdminStore } from "../../store/admin.store";
import { downloadFile } from "../../utils/downloadFile";
import PatientDetailModal from "../../components/admin/modals/PatientDetailModal";
import AddPatientModal from "../../components/admin/modals/AddPatientModal";
import EditPatientModal from "../../components/admin/modals/EditPatientModal";
import DeleteConfirmModal from "../../components/common/DeleteConfirmModal";

/**
 * Table columns configuration
 */
const columns = [
  {
    field: "name",
    headerName: "Patient Name",
    minWidth: 200,
    render: (value, row) => (
      <Box className="flex items-center gap-3">
        <Avatar className="bg-blue-100 text-blue-600" sx={{ width: 36, height: 36 }}>
          {value?.[0]?.toUpperCase() || "P"}
        </Avatar>
        <Box>
          <Typography variant="body2" className="font-medium">
            {value || "Unknown"}
          </Typography>
          <Typography variant="caption" className="text-gray-500">
            {row.email || "No email"}
          </Typography>
        </Box>
      </Box>
    ),
  },
  {
    field: "phone",
    headerName: "Phone",
    minWidth: 130,
    render: (value) => <span className="font-numbers">{value}</span>,
  },
  {
    field: "gender",
    headerName: "Gender",
    minWidth: 100,
    render: (value) => (
      <span className="capitalize">{value || "-"}</span>
    ),
  },
  {
    field: "bloodGroup",
    headerName: "Blood Group",
    minWidth: 100,
    render: (value) => value || "-",
  },
  {
    field: "membership",
    headerName: "Membership",
    minWidth: 130,
    render: (value) => {
      if (!value?.status) {
        return <Chip label="None" size="small" variant="outlined" />;
      }
      const colors = {
        active: "success",
        expired: "error",
        cancelled: "default",
      };
      return (
        <Chip
          label={value.planName || value.status}
          size="small"
          color={colors[value.status] || "default"}
        />
      );
    },
  },
  {
    field: "createdAt",
    headerName: "Registered",
    minWidth: 120,
    type: "date",
  },
  {
    field: "isActive",
    headerName: "Status",
    minWidth: 100,
    render: (value) => (
      <Chip
        label={value ? "Active" : "Inactive"}
        size="small"
        color={value ? "success" : "default"}
      />
    ),
  },
];

/**
 * Filter options
 */
const filterOptions = [
  {
    key: "membership",
    label: "Membership",
    options: [
      { value: "active", label: "Active" },
      { value: "expired", label: "Expired" },
      { value: "none", label: "No Membership" },
    ],
  },
  {
    key: "isActive",
    label: "Status",
    // "All" is listed EXPLICITLY rather than leaning on the shared table's
    // implicit all-option. The backend now treats isActive=all as "no
    // condition"; relying on "param absent means all" is exactly what made
    // this filter silently wrong before.
    options: [
      { value: "all", label: "All" },
      { value: "true", label: "Active" },
      { value: "false", label: "Inactive" },
    ],
  },
];

const Patients = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Pagination and filter state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({});

  // Modal state
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Export menu state
  const [exportAnchorEl, setExportAnchorEl] = useState(null);
  const exportMenuOpen = Boolean(exportAnchorEl);
  const adminToken = useAdminStore((state) => state.token);

  // Fetch patients with React Query
  const { data, isLoading, refetch } = usePatients({
    page,
    limit,
    search,
    ...filters,
  });

  // Mutations
  const { deletePatient, updatePatient, isDeleting, reactivatePatient } = usePatientMutations();
  const { hasPermission } = usePermissions();

  // Extract data from response
  const patients = data?.data || [];
  const pagination = data?.pagination || { total: 0 };

  // Auto-open PatientDetailModal when navigated here with ?patientId=xxx
  useEffect(() => {
    const patientId = searchParams.get("patientId");
    if (!patientId) return;
    getPatient(patientId)
      .then((res) => {
        setSelectedPatient(res.data.patient);
        setDetailModalOpen(true);
      })
      .catch(() => {
        // Invalid or inaccessible patient ID — silently clear the param
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.delete("patientId");
          return next;
        }, { replace: true });
      });
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Handle search
   */
  const handleSearch = (value) => {
    setSearch(value);
    setPage(1);
  };

  /**
   * Handle filter change
   */
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }));
    setPage(1);
  };

  /**
   * Handle row click - open patient detail modal
   */
  const handleRowClick = (row) => {
    setSelectedPatient(row);
    setDetailModalOpen(true);
  };

  /**
   * Handle add patient button click
   */
  const handleAddClick = () => {
    setAddModalOpen(true);
  };

  /**
   * Handle patient created successfully
   */
  const handlePatientCreated = () => {
    setSearch("");
    setFilters({});
    setPage(1);
  };

  /**
   * Handle edit patient from detail modal
   */
  const handleEditPatient = (patient) => {
    setDetailModalOpen(false);
    setSelectedPatient(patient);
    setEditModalOpen(true);
  };

  /**
   * Handle delete patient from detail modal
   */
  const handleDeletePatient = (patient) => {
    setDetailModalOpen(false);
    setSelectedPatient(patient);
    setDeleteError("");
    setDeleteModalOpen(true);
  };

  /**
   * Confirm delete patient
   */
  const handleConfirmDelete = () => {
    if (!selectedPatient) return;

    updatePatient(
      { id: selectedPatient._id, data: { isActive: false } },
      {
        onSuccess: () => {
          setDeleteModalOpen(false);
          setSelectedPatient(null);
          refetch();
        },
        onError: (error) => {
          setDeleteError(
            error.response?.data?.message || "Failed to deactivate patient"
          );
        },
      }
    );
  };

  /**
   * Reactivate a deactivated patient (flip isActive back to true)
   */
  const handleReactivatePatient = (patient) => {
    if (!patient) return;

    reactivatePatient(patient._id, {
      onSuccess: () => {
        toast.success("Patient reactivated");
        setDetailModalOpen(false);
        setSelectedPatient(null);
        refetch();
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Failed to reactivate patient"
        );
      },
    });
  };

  /**
   * Handle patient updated successfully
   */
  const handlePatientUpdated = () => {
    refetch();
  };

  /**
   * Handle refresh/reset — clears all active filters and search so the full
   * unfiltered patient list loads. Previously onRefresh called refetch() directly,
   * which left filters intact and made the ↺ button appear broken.
   */
  const handleReset = () => {
    setSearch("");
    setFilters({});
    setPage(1);
  };

  /**
   * Export menu open/close
   */
  const handleExportMenuOpen = (event) => setExportAnchorEl(event.currentTarget);
  const handleExportMenuClose = () => setExportAnchorEl(null);

  /**
   * Export the CURRENTLY filtered patient list as CSV or PDF. Carries over
   * the same search text + active filters shown on screen, so the export
   * matches what the admin is looking at.
   */
  const handleExport = async (format) => {
    handleExportMenuClose();
    const exportParams = { search, ...filters };
    const url = getPatientsExportUrl(format, exportParams);
    const today = new Date().toISOString().slice(0, 10);
    const filename = `patients-export-${today}.${format}`;

    try {
      await downloadFile(url, filename, {
        headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {},
        credentials: "include",
      });
    } catch {
      toast.error(`Failed to export patients as ${format.toUpperCase()}`);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh" }}>
      {/* Page Header */}
      <Box className="flex justify-between items-center mb-6">
        <Box>
          <Typography variant="h4" className="font-bold text-gray-800">
            Patients
          </Typography>
          <Typography variant="body2" className="text-gray-500">
            Manage all registered patients
          </Typography>
        </Box>
        <Box className="flex items-center gap-2">
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            endIcon={<ArrowDropDownIcon />}
            onClick={handleExportMenuOpen}
          >
            Export
          </Button>
          <Menu anchorEl={exportAnchorEl} open={exportMenuOpen} onClose={handleExportMenuClose}>
            <MenuItem onClick={() => handleExport("csv")}>
              <ListItemIcon>
                <DescriptionIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Export as CSV</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleExport("pdf")}>
              <ListItemIcon>
                <PictureAsPdfIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Export as PDF</ListItemText>
            </MenuItem>
          </Menu>
          {hasPermission("patients", "create") && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleAddClick}
            >
              Add Patient
            </Button>
          )}
        </Box>
      </Box>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={patients}
        loading={isLoading}
        searchPlaceholder="Search by name or phone..."
        searchValue={search}
        onSearch={handleSearch}
        filters={filterOptions}
        filterValues={filters}
        onFilterChange={handleFilterChange}
        pagination={{
          page,
          limit,
          total: pagination.total,
          onPageChange: setPage,
          onLimitChange: (newLimit) => {
            setLimit(newLimit);
            setPage(1);
          },
        }}
        onRowClick={handleRowClick}
        onRefresh={handleReset}
        emptyMessage="No patients found"
      />

      {/* Patient Detail Modal */}
      <PatientDetailModal
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          if (searchParams.has("patientId")) {
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev);
              next.delete("patientId");
              return next;
            }, { replace: true });
          }
        }}
        patient={selectedPatient}
        onEdit={hasPermission("patients", "edit") ? handleEditPatient : undefined}
        onDelete={hasPermission("patients", "delete") ? handleDeletePatient : undefined}
        onReactivate={hasPermission("patients", "edit") ? handleReactivatePatient : undefined}
      />

      {/* Add Patient Modal */}
      <AddPatientModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={handlePatientCreated}
      />

      {/* Edit Patient Modal */}
      <EditPatientModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        patient={selectedPatient}
        onSuccess={handlePatientUpdated}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Deactivate Patient"
        itemName={selectedPatient?.name}
        itemType="patient"
        isDeleting={isDeleting}
        error={deleteError}
        softDelete={true}
      />
    </Box>
  );
};

export default Patients;

/**
 * Admin Clinics Page
 *
 * Displays list of all clinic locations with:
 * - Search by name
 * - Filter by status
 * - Click to view clinic details in modal
 * - Add, Edit, Delete (soft) clinic via modals
 */
import React, { useState, useMemo } from "react";
import { Box, Typography, Button, Chip } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import BusinessIcon from "@mui/icons-material/Business";
import DataTable from "../../components/common/DataTable";
import { useClinics, useClinicMutations } from "../../hooks/admin/useClinics";
import ClinicDetailModal from "../../components/admin/modals/ClinicDetailModal";
import AddClinicModal from "../../components/admin/modals/AddClinicModal";
import EditClinicModal from "../../components/admin/modals/EditClinicModal";
import DeleteConfirmModal from "../../components/common/DeleteConfirmModal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { toast } from "react-toastify";
import { deleteClinicPermanent } from "../../api/admin/clinics.api";

/**
 * Format address for display
 */
const formatAddress = (address) => {
  if (!address) return "-";
  const parts = [address.area, address.city].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "-";
};

/**
 * Table columns
 */
const columns = [
  {
    field: "name",
    headerName: "Clinic Name",
    minWidth: 250,
    render: (value) => (
      <Box className="flex items-center gap-2">
        <BusinessIcon className="text-blue-600" fontSize="small" />
        <Typography variant="body2" className="font-medium">
          {value}
        </Typography>
      </Box>
    ),
  },
  {
    field: "phone",
    headerName: "Phone",
    minWidth: 150,
    render: (value) => value || "-",
  },
  {
    field: "address",
    headerName: "Location",
    minWidth: 200,
    render: (value) => formatAddress(value),
  },
  {
    field: "isActive",
    headerName: "Status",
    minWidth: 120,
    render: (value) => (
      <Chip
        size="small"
        label={value ? "Active" : "Inactive"}
        color={value ? "success" : "default"}
      />
    ),
  },
  {
    field: "createdAt",
    headerName: "Created",
    minWidth: 120,
    render: (value) =>
      value ? new Date(value).toLocaleDateString("en-IN") : "-",
  },
];

/**
 * Filter options
 */
const filterOptions = [
  {
    key: "isActive",
    label: "Status",
    options: [
      { value: "true", label: "Active" },
      { value: "false", label: "Inactive" },
    ],
  },
];

const Clinics = () => {
  // Search and filter state
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({});

  // Modal state
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [permanentDeleteClinic, setPermanentDeleteClinic] = useState(null);
  const [isPermanentDeleting, setIsPermanentDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Fetch clinics with React Query
  const { data, isLoading, refetch } = useClinics();

  // Mutations
  const { deleteClinic, isDeleting } = useClinicMutations();

  // Extract data
  const clinics = data?.data || [];

  /**
   * Client-side filtering
   */
  const filteredClinics = useMemo(() => {
    return clinics.filter((clinic) => {
      // Search filter
      const matchesSearch =
        !search ||
        clinic.name?.toLowerCase().includes(search.toLowerCase()) ||
        clinic.phone?.includes(search);

      // Status filter
      const matchesStatus =
        filters.isActive === undefined ||
        String(clinic.isActive) === filters.isActive;

      return matchesSearch && matchesStatus;
    });
  }, [clinics, search, filters]);

  /**
   * Handle row click - open detail modal
   */
  const handleRowClick = (row) => {
    setSelectedClinic(row);
    setDetailModalOpen(true);
  };

  /**
   * Handle add button click
   */
  const handleAddClick = () => {
    setAddModalOpen(true);
  };

  /**
   * Handle edit from detail modal
   */
  const handleEditClinic = (clinic) => {
    setDetailModalOpen(false);
    setSelectedClinic(clinic);
    setEditModalOpen(true);
  };

  /**
   * Handle delete from detail modal
   */
  const handleDeleteClinic = (clinic) => {
    setDetailModalOpen(false);
    setSelectedClinic(clinic);
    setDeleteError("");
    setDeleteModalOpen(true);
  };

  /**
   * Confirm delete
   */
  const handleConfirmDelete = () => {
    if (!selectedClinic) return;

    deleteClinic(selectedClinic._id, {
      onSuccess: () => {
        setDeleteModalOpen(false);
        setSelectedClinic(null);
        refetch();
      },
      onError: (error) => {
        setDeleteError(
          error.response?.data?.message || "Failed to deactivate clinic"
        );
      },
    });
  };

  /**
   * Handle clinic created
   */
  const handleClinicCreated = () => {
    refetch();
  };

  /**
   * Handle clinic updated
   */
  const handleClinicUpdated = () => {
    refetch();
  };

  /**
   * Handle filter change
   */
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const handleReset = () => {
    setSearch("");
    setFilters({});
  };

  return (
    <Box>
      {/* Header */}
      <Box className="flex justify-between items-center mb-6">
        <Box>
          <Typography variant="h4" className="font-bold text-gray-800">
            Clinics
          </Typography>
          <Typography variant="body2" className="text-gray-500">
            Manage clinic locations
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddClick}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Add Clinic
        </Button>
      </Box>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredClinics}
        loading={isLoading}
        searchPlaceholder="Search clinic name or phone..."
        onSearch={setSearch}
        searchValue={search}
        filters={filterOptions}
        filterValues={filters}
        onFilterChange={handleFilterChange}
        pagination={false}
        onRowClick={handleRowClick}
        onRefresh={handleReset}
        emptyMessage="No clinics found"
      />

      {/* Clinic Detail Modal */}
      <ClinicDetailModal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        clinic={selectedClinic}
        onEdit={handleEditClinic}
        onDelete={handleDeleteClinic}
        onPermanentDelete={(clinic) => { setDetailModalOpen(false); setPermanentDeleteClinic(clinic); }}
      />

      {/* Add Clinic Modal */}
      <AddClinicModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={handleClinicCreated}
      />

      {/* Edit Clinic Modal */}
      <EditClinicModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        clinic={selectedClinic}
        onSuccess={handleClinicUpdated}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Deactivate Clinic"
        itemName={selectedClinic?.name}
        itemType="clinic"
        isDeleting={isDeleting}
        error={deleteError}
        softDelete={true}
      />

      {/* Permanent Delete Dialog */}
      <ConfirmDialog
        open={!!permanentDeleteClinic}
        onClose={() => setPermanentDeleteClinic(null)}
        onConfirm={async () => {
          setIsPermanentDeleting(true);
          try {
            await deleteClinicPermanent(permanentDeleteClinic._id);
            toast.success("Clinic deleted permanently");
            setPermanentDeleteClinic(null);
            refetch();
          } catch (err) {
            toast.error(err.response?.data?.message || "Delete failed");
          } finally {
            setIsPermanentDeleting(false);
          }
        }}
        title="Delete Clinic Permanently"
        message={`Are you sure you want to permanently delete "${permanentDeleteClinic?.name || ""}"? This action cannot be undone.`}
        confirmText="Delete"
        loading={isPermanentDeleting}
      />
    </Box>
  );
};

export default Clinics;

/**
 * Admin Treatment Master Page
 *
 * Displays list of all treatment types with:
 * - Search by name/code
 * - Filter by category, status
 * - Click to view treatment details in modal
 * - Add, Edit, Delete (soft) treatment via modals
 */
import React, { useState, useMemo } from "react";
import { Box, Typography, Button, Chip } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DataTable from "../../components/common/DataTable";
import { useTreatmentMaster, useTreatmentMutations } from "../../hooks/admin/useTreatments";
import TreatmentDetailModal from "../../components/admin/modals/TreatmentDetailModal";
import AddTreatmentModal from "../../components/admin/modals/AddTreatmentModal";
import EditTreatmentModal from "../../components/admin/modals/EditTreatmentModal";
import DeleteConfirmModal from "../../components/common/DeleteConfirmModal";
import { usePermissions } from "../../hooks/admin/usePermissions";

/**
 * Table columns
 */
const columns = [
  {
    field: "code",
    headerName: "Code",
    minWidth: 100,
    render: (value) => (
      <Typography variant="body2" className="font-mono font-medium">
        {value}
      </Typography>
    ),
  },
  {
    field: "name",
    headerName: "Treatment Name",
    minWidth: 220,
    render: (value) => (
      <Typography variant="body2" className="font-medium">
        {value}
      </Typography>
    ),
  },
  {
    field: "category",
    headerName: "Category",
    minWidth: 150,
    render: (value) => (
      <Chip
        size="small"
        label={value?.replace("_", " ") || "-"}
        className="capitalize"
        color="info"
        variant="outlined"
      />
    ),
  },
  {
    field: "price",
    headerName: "Price (₹)",
    minWidth: 120,
    render: (value) => (
      <span className="font-numbers">₹{value?.toLocaleString() || 0}</span>
    ),
  },
  {
    field: "sessionsRequired",
    headerName: "Sessions",
    minWidth: 100,
    render: (value) => value || 1,
  },
  {
    field: "duration",
    headerName: "Duration",
    minWidth: 120,
    render: (value) => (value ? `${value} min` : "-"),
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
];

/**
 * Filter options
 */
const filterOptions = [
  {
    key: "category",
    label: "Category",
    options: [
      { value: "preventive", label: "Preventive" },
      { value: "restorative", label: "Restorative" },
      { value: "cosmetic", label: "Cosmetic" },
      { value: "orthodontics", label: "Orthodontics" },
      { value: "periodontics", label: "Periodontics" },
      { value: "endodontics", label: "Endodontics" },
      { value: "oral_surgery", label: "Oral Surgery" },
      { value: "pediatric", label: "Pediatric" },
      { value: "prosthodontics", label: "Prosthodontics" },
    ],
  },
  {
    key: "isActive",
    label: "Status",
    options: [
      { value: "true", label: "Active" },
      { value: "false", label: "Inactive" },
    ],
  },
];

const TreatmentMaster = () => {
  // Search and filter state
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({});

  // Modal state
  const [selectedTreatment, setSelectedTreatment] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Fetch treatments with React Query
  const { data, isLoading, refetch } = useTreatmentMaster();

  // Mutations
  const { deleteTreatment, isDeleting } = useTreatmentMutations();

  // Extract data
  const treatments = data?.data?.treatmentTypes || [];

  /**
   * Client-side filtering
   */
  const filteredTreatments = useMemo(() => {
    return treatments.filter((treatment) => {
      // Search filter
      const matchesSearch =
        !search ||
        treatment.name?.toLowerCase().includes(search.toLowerCase()) ||
        treatment.code?.toLowerCase().includes(search.toLowerCase());

      // Category filter
      const matchesCategory =
        !filters.category || treatment.category === filters.category;

      // Status filter
      const matchesStatus =
        filters.isActive === undefined ||
        String(treatment.isActive) === filters.isActive;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [treatments, search, filters]);

  /**
   * Handle row click - open detail modal
   */
  const handleRowClick = (row) => {
    setSelectedTreatment(row);
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
  const { hasPermission } = usePermissions();
  const handleEditTreatment = (treatment) => {
    setDetailModalOpen(false);
    setSelectedTreatment(treatment);
    setEditModalOpen(true);
  };

  /**
   * Handle delete from detail modal
   */
  const handleDeleteTreatment = (treatment) => {
    setDetailModalOpen(false);
    setSelectedTreatment(treatment);
    setDeleteError("");
    setDeleteModalOpen(true);
  };

  /**
   * Confirm delete
   */
  const handleConfirmDelete = () => {
    if (!selectedTreatment) return;

    deleteTreatment(selectedTreatment._id, {
      onSuccess: () => {
        setDeleteModalOpen(false);
        setSelectedTreatment(null);
        refetch();
      },
      onError: (error) => {
        setDeleteError(
          error.response?.data?.message || "Failed to deactivate treatment"
        );
      },
    });
  };

  /**
   * Handle treatment created
   */
  const handleTreatmentCreated = () => {
    refetch();
  };

  /**
   * Handle treatment updated
   */
  const handleTreatmentUpdated = () => {
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
            Treatment Master
          </Typography>
          <Typography variant="body2" className="text-gray-500">
            Manage treatment types and pricing
          </Typography>
        </Box>

        {/* This page is the treatment MASTER CATALOG (types/pricing), which is
            the separate `treatment_catalog` module -- NOT `treatments`, which
            covers day-to-day patient treatment work. */}
        {hasPermission("treatment_catalog", "create") && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddClick}
            className="bg-teal-600 hover:bg-teal-700"
          >
            Add Treatment
          </Button>
        )}
      </Box>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredTreatments}
        loading={isLoading}
        searchPlaceholder="Search treatment name or code..."
        onSearch={setSearch}
        searchValue={search}
        filters={filterOptions}
        filterValues={filters}
        onFilterChange={handleFilterChange}
        pagination={false}
        onRowClick={handleRowClick}
        onRefresh={handleReset}
        emptyMessage="No treatments found"
      />

      {/* Treatment Detail Modal */}
      <TreatmentDetailModal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        treatment={selectedTreatment}
        onEdit={hasPermission("treatment_catalog", "edit") ? handleEditTreatment : undefined}
        onDelete={hasPermission("treatment_catalog", "delete") ? handleDeleteTreatment : undefined}
      />

      {/* Add Treatment Modal */}
      <AddTreatmentModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={handleTreatmentCreated}
      />

      {/* Edit Treatment Modal */}
      <EditTreatmentModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        treatment={selectedTreatment}
        onSuccess={handleTreatmentUpdated}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Deactivate Treatment"
        itemName={selectedTreatment?.name}
        itemType="treatment"
        isDeleting={isDeleting}
        error={deleteError}
        softDelete={true}
      />
    </Box>
  );
};

export default TreatmentMaster;

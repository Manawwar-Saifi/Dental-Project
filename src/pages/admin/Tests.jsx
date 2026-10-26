/**
 * Admin Test Master Page
 *
 * Displays list of all diagnostic test types with:
 * - Search by name/code
 * - Filter by category, type, status
 * - Click to view test details in modal
 * - Add, Edit, Delete (soft) test via modals
 */
import React, { useState, useMemo } from "react";
import { Box, Typography, Button, Chip } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DataTable from "../../components/common/DataTable";
import { useTestMaster, useTestMutations } from "../../hooks/admin/useTests";
import TestDetailModal from "../../components/admin/modals/TestDetailModal";
import AddTestModal from "../../components/admin/modals/AddTestModal";
import EditTestModal from "../../components/admin/modals/EditTestModal";
import DeleteConfirmModal from "../../components/common/DeleteConfirmModal";

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
    headerName: "Test Name",
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
    minWidth: 140,
    render: (value) => (
      <Chip
        size="small"
        label={value?.replace("_", " ") || "-"}
        color="info"
        variant="outlined"
        className="capitalize"
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
    field: "turnaroundTime",
    headerName: "TAT",
    minWidth: 100,
    render: (value) => (value ? `${value} hrs` : "-"),
  },
  {
    field: "isInHouse",
    headerName: "Type",
    minWidth: 120,
    render: (value) => (
      <Chip
        size="small"
        label={value ? "In-House" : "External"}
        color={value ? "success" : "warning"}
        variant="outlined"
      />
    ),
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
      { value: "blood", label: "Blood Test" },
      { value: "urine", label: "Urine Test" },
      { value: "imaging", label: "Imaging" },
      { value: "dental_xray", label: "Dental X-Ray" },
      { value: "oral_pathology", label: "Oral Pathology" },
      { value: "microbiology", label: "Microbiology" },
      { value: "biochemistry", label: "Biochemistry" },
    ],
  },
  {
    key: "isInHouse",
    label: "Type",
    options: [
      { value: "true", label: "In-House" },
      { value: "false", label: "External" },
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

const TestMaster = () => {
  // Search and filter state
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({});

  // Modal state
  const [selectedTest, setSelectedTest] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Fetch tests with React Query
  const { data, isLoading, refetch } = useTestMaster();

  // Mutations
  const { deleteTest, isDeleting } = useTestMutations();

  // Extract data
  const tests = data?.data?.testTypes || [];
  // console.log(tests);
  /**
   * Client-side filtering
   */
  const filteredTests = useMemo(() => {
    return tests.filter((test) => {
      // Search filter
      const matchesSearch =
        !search ||
        test.name?.toLowerCase().includes(search.toLowerCase()) ||
        test.code?.toLowerCase().includes(search.toLowerCase());

      // Category filter
      const matchesCategory =
        !filters.category || test.category === filters.category;

      // Type filter
      const matchesType =
        filters.isInHouse === undefined ||
        String(test.isInHouse) === filters.isInHouse;

      // Status filter
      const matchesStatus =
        filters.isActive === undefined ||
        String(test.isActive) === filters.isActive;

      return matchesSearch && matchesCategory && matchesType && matchesStatus;
    });
  }, [tests, search, filters]);

  /**
   * Handle row click - open detail modal
   */
  const handleRowClick = (row) => {
    setSelectedTest(row);
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
  const handleEditTest = (test) => {
    setDetailModalOpen(false);
    setSelectedTest(test);
    setEditModalOpen(true);
  };

  /**
   * Handle delete from detail modal
   */
  const handleDeleteTest = (test) => {
    setDetailModalOpen(false);
    setSelectedTest(test);
    setDeleteError("");
    setDeleteModalOpen(true);
  };

  /**
   * Confirm delete
   */
  const handleConfirmDelete = () => {
    if (!selectedTest) return;

    deleteTest(selectedTest._id, {
      onSuccess: () => {
        setDeleteModalOpen(false);
        setSelectedTest(null);
        refetch();
      },
      onError: (error) => {
        setDeleteError(
          error.response?.data?.message || "Failed to deactivate test",
        );
      },
    });
  };

  /**
   * Handle test created
   */
  const handleTestCreated = () => {
    refetch();
  };

  /**
   * Handle test updated
   */
  const handleTestUpdated = () => {
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

  return (
    <Box>
      {/* Header */}
      <Box className="flex justify-between items-center mb-6">
        <Box>
          <Typography variant="h4" className="font-bold text-gray-800">
            Test Master
          </Typography>
          <Typography variant="body2" className="text-gray-500">
            Manage diagnostic test types and pricing
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddClick}
          className="bg-purple-600 hover:bg-purple-700"
        >
          Add Test
        </Button>
      </Box>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredTests}
        loading={isLoading}
        searchPlaceholder="Search test name or code..."
        onSearch={setSearch}
        filters={filterOptions}
        filterValues={filters}
        onFilterChange={handleFilterChange}
        pagination={false}
        onRowClick={handleRowClick}
        onRefresh={refetch}
        emptyMessage="No tests found"
      />

      {/* Test Detail Modal */}
      <TestDetailModal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        test={selectedTest}
        onEdit={handleEditTest}
        onDelete={handleDeleteTest}
      />

      {/* Add Test Modal */}
      <AddTestModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={handleTestCreated}
      />

      {/* Edit Test Modal */}
      <EditTestModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        test={selectedTest}
        onSuccess={handleTestUpdated}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Deactivate Test"
        itemName={selectedTest?.name}
        itemType="test"
        isDeleting={isDeleting}
        error={deleteError}
        softDelete={true}
      />
    </Box>
  );
};

export default TestMaster;

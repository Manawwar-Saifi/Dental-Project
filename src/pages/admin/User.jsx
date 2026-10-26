/**
 * Admin Users/Staff Page
 *
 * Displays staff members with:
 * - Search by name/email/phone
 * - Filter by role, active status
 * - Pagination
 * - Add new staff member
 * - View/edit staff details
 */
import { useState } from "react";
import {
  Box,
  Typography,
  Chip,
  Avatar,
  Button,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DataTable from "../../components/common/DataTable";
import { useUsers } from "../../hooks/admin/useUsers";
import AddUserModal from "../../components/admin/modals/AddUserModal";
import UserDetailModal from "../../components/admin/modals/UserDetailModal";

/**
 * Table columns
 */
const columns = [
  {
    field: "name",
    headerName: "Name",
    minWidth: 200,
    render: (value, row) => (
      <Box className="flex items-center gap-2">
        <Avatar
          src={row.profilePicture?.url}
          className="bg-purple-100 text-purple-600"
          sx={{ width: 36, height: 36 }}
        >
          {value?.[0]?.toUpperCase() || "U"}
        </Avatar>
        <Box>
          <Typography variant="body2" className="font-medium">
            {value || "Unknown"}
          </Typography>
          <Typography variant="caption" className="text-gray-500">
            {row.email}
          </Typography>
        </Box>
      </Box>
    ),
  },
  {
    field: "phone",
    headerName: "Phone",
    minWidth: 130,
    render: (value) => (
      <Typography variant="body2">{value || "-"}</Typography>
    ),
  },
  {
    field: "role",
    headerName: "Role",
    minWidth: 100,
    render: (value) => {
      const label = value === "admin" ? "Admin" : value === "blog_editor" ? "SEO Executive" : value === "clinic_manager" ? "Clinic Manager" : "Staff";
      const color = value === "admin" ? "primary" : value === "blog_editor" ? "secondary" : value === "clinic_manager" ? "info" : "default";
      return <Chip label={label} size="small" color={color} variant="outlined" />;
    },
  },
  {
    field: "isActive",
    headerName: "Status",
    minWidth: 100,
    render: (value) => (
      <Chip
        label={value ? "Active" : "Inactive"}
        size="small"
        color={value ? "success" : "error"}
      />
    ),
  },
  {
    field: "lastLogin",
    headerName: "Last Login",
    minWidth: 140,
    type: "datetime",
  },
  {
    field: "createdAt",
    headerName: "Joined",
    minWidth: 120,
    type: "date",
  },
];

/**
 * Filter options
 */
const filterOptions = [
  {
    key: "role",
    label: "Role",
    options: [
      { value: "admin", label: "Admin" },
      { value: "user", label: "Staff" },
      { value: "blog_editor", label: "SEO Executive" },
      { value: "clinic_manager", label: "Clinic Manager" },
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

const User = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({});

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const { data, isLoading, refetch } = useUsers({
    page,
    limit,
    search,
    ...filters,
  });

  const users = data?.data?.users || data?.data || [];
  const pagination = data?.pagination || { total: 0 };

  const handleSearch = (value) => {
    setSearch(value);
    setPage(1);
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
    setPage(1);
  };

  const handleReset = () => {
    setSearch("");
    setFilters({});
    setPage(1);
  };

  const handleRowClick = (user) => {
    setSelectedUser(user);
    setDetailModalOpen(true);
  };

  return (
    <Box>
      {/* Header */}
      <Box className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <Box>
          <Typography variant="h4" className="font-bold text-gray-800">
            Staff Management
          </Typography>
          <Typography variant="body2" className="text-gray-500">
            Manage admin and staff accounts
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setAddModalOpen(true)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          Add Staff Member
        </Button>
      </Box>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={users}
        loading={isLoading}
        searchPlaceholder="Search by name, email, or phone..."
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
        onRefresh={handleReset}
        onRowClick={handleRowClick}
        emptyMessage="No staff members found"
      />

      {/* Add User Modal */}
      <AddUserModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={refetch}
      />

      {/* User Detail Modal */}
      <UserDetailModal
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        onRefresh={refetch}
      />
    </Box>
  );
};

export default User;

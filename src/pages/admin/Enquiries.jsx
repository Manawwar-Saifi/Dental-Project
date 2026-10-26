/**
 * Admin Enquiries/Leads Page
 *
 * Displays:
 * - Stats cards (total, new, contacted, converted)
 * - Enquiries table with search, filters, pagination
 * - Click row to open detail modal
 */
import { useState } from "react";
import {
  Box,
  Typography,
  Chip,
  Avatar,
  Button,
  IconButton,
  Card,
  CardContent,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { toast } from "react-toastify";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import Grid from "@mui/material/Grid";
import InboxIcon from "@mui/icons-material/Inbox";
import FiberNewIcon from "@mui/icons-material/FiberNew";
import PhoneCallbackIcon from "@mui/icons-material/PhoneCallback";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DataTable from "../../components/common/DataTable";
import CompactFilterBar from "../../components/common/CompactFilterBar";
import QuickDateRangeFilter from "../../components/admin/QuickDateRangeFilter";
import { useEnquiries, useEnquiryStats, useEnquiryMutations } from "../../hooks/admin/useEnquiries";
import EnquiryDetailModal from "../../components/admin/modals/EnquiryDetailModal";

const statusConfig = {
  new: { color: "info", label: "New" },
  contacted: { color: "primary", label: "Contacted" },
  appointment_scheduled: { color: "success", label: "Apt Scheduled" },
  visited: { color: "warning", label: "Visited" },
  converted: { color: "secondary", label: "Converted" },
  not_interested: { color: "error", label: "Not Interested" },
  invalid: { color: "default", label: "Invalid" },
  closed: { color: "default", label: "Closed" },
};

const columns = [
  {
    field: "enquiryNumber",
    headerName: "Lead #",
    minWidth: 140,
    render: (value) => (
      <Typography variant="body2" className="font-mono font-medium text-teal-600">
        {value || "-"}
      </Typography>
    ),
  },
  {
    field: "name",
    headerName: "Name",
    minWidth: 170,
    render: (value, row) => (
      <Box className="flex items-center gap-2">
        <Avatar className="bg-teal-100 text-teal-600" sx={{ width: 32, height: 32 }}>
          {value?.[0]?.toUpperCase() || "?"}
        </Avatar>
        <Box>
          <Typography variant="body2" className="font-medium">{value || "Unknown"}</Typography>
          <Typography variant="caption" className="font-numbers text-gray-500">{row.phone}</Typography>
        </Box>
      </Box>
    ),
  },
  {
    field: "treatmentName",
    headerName: "Treatment",
    minWidth: 150,
    render: (value) => (
      <Typography variant="body2">{value || "-"}</Typography>
    ),
  },
  {
    field: "source",
    headerName: "Source Page",
    minWidth: 150,
    render: (value) => {
      const page = value?.page || "-";
      const label = value?.referrer || page;
      return (
        <Box>
          <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>{label !== page ? label : ""}</Typography>
          <Typography variant="caption" className="text-gray-500">{page !== "-" ? page : "-"}</Typography>
        </Box>
      );
    },
  },
  {
    field: "status",
    headerName: "Status",
    minWidth: 130,
    render: (value) => {
      const cfg = statusConfig[value] || statusConfig.new;
      return <Chip label={cfg.label} size="small" color={cfg.color} />;
    },
  },
  {
    field: "assignedTo",
    headerName: "Assigned",
    minWidth: 120,
    render: (value) => (
      <Typography variant="body2">
        {value?.name || <span className="text-gray-400">Unassigned</span>}
      </Typography>
    ),
  },
  {
    field: "isUrgent",
    headerName: "Priority",
    minWidth: 80,
    render: (value, row) => (
      <Box>
        {value && <Chip label="Urgent" size="small" color="error" />}
        {row.isSpam && <Chip label="Spam" size="small" color="default" />}
        {!value && !row.isSpam && <span className="text-gray-400">-</span>}
      </Box>
    ),
  },
  {
    field: "nextFollowUp",
    headerName: "Follow-up",
    minWidth: 110,
    type: "date",
  },
  {
    field: "createdAt",
    headerName: "Created",
    minWidth: 110,
    type: "date",
  },
];

const getColumns = (onDeleteRow) => [
  ...columns,
  {
    field: "_actions",
    headerName: "Actions",
    minWidth: 70,
    render: (_, row) => (
      <IconButton
        size="small"
        color="error"
        onClick={(e) => {
          e.stopPropagation();
          onDeleteRow(row);
        }}
      >
        <DeleteIcon fontSize="small" />
      </IconButton>
    ),
  },
];

const filterOptions = [
  {
    key: "status",
    label: "Status",
    options: [
      { value: "new", label: "New" },
      { value: "contacted", label: "Contacted" },
      { value: "appointment_scheduled", label: "Apt Scheduled" },
      { value: "visited", label: "Visited" },
      { value: "converted", label: "Converted" },
      { value: "not_interested", label: "Not Interested" },
      { value: "invalid", label: "Invalid" },
      { value: "closed", label: "Closed" },
    ],
  },
  {
    key: "isSpam",
    label: "Spam",
    options: [
      { value: "false", label: "Not Spam" },
      { value: "true", label: "Spam Only" },
    ],
  },
];

const StatCard = ({ icon: Icon, label, value, color, onClick }) => (
  <Card
    variant="outlined"
    onClick={onClick}
    sx={onClick ? {
      cursor: "pointer",
      transition: "all 0.2s ease",
      "&:hover": { transform: "translateY(-2px)", boxShadow: "0 4px 20px rgba(0,0,0,0.12)" },
    } : undefined}
  >
    <CardContent className="flex items-center gap-3 py-3">
      <Box className={`p-2 rounded-lg ${color}`}>
        <Icon className="text-white" fontSize="small" />
      </Box>
      <Box>
        <Typography variant="caption" className="text-gray-500">{label}</Typography>
        <Typography variant="h6" className="font-bold leading-tight">{value}</Typography>
      </Box>
    </CardContent>
  </Card>
);

const Enquiries = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({});
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const { deleteEnquiry, isDeleting } = useEnquiryMutations();

  const { data, isLoading, refetch } = useEnquiries({
    page,
    limit,
    search,
    ...filters,
    ...(fromDate && { dateFrom: fromDate }),
    ...(toDate && { dateTo: toDate }),
  });

  // Backend returns { data: { enquiries, pagination: { current, pages, total, limit } } }
  const enquiries = data?.data?.enquiries || data?.data || [];
  const paginationData = data?.data?.pagination || data?.pagination || {};
  const total = paginationData.total || 0;

  const { data: statsData } = useEnquiryStats({
    ...(fromDate && { dateFrom: fromDate }),
    ...(toDate && { dateTo: toDate }),
  });
  const stats = statsData?.data?.stats || {};
  const byStatus = stats.byStatus || {};

  const handleSearch = (value) => { setSearch(value); setPage(1); };
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
    setPage(1);
  };
  const handleRowClick = (enq) => { setSelectedEnquiry(enq); setDetailModalOpen(true); };

  const handleReset = () => {
    setSearch("");
    setFilters({});
    setFromDate("");
    setToDate("");
    setPage(1);
  };

  return (
    <Box>
      {/* Header */}
      <Box className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <Box>
          <Typography variant="h4" className="font-bold text-gray-800">
            Enquiries & Leads
          </Typography>
          <Typography variant="body2" className="text-gray-500">
            Manage patient enquiries and follow-ups
          </Typography>
        </Box>
      </Box>

      {/* Stats */}
      <Grid container spacing={2} className="mb-4">
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard icon={InboxIcon} label="Total Enquiries" value={stats.total || 0} color="bg-teal-500"
            onClick={() => { setFilters({}); setPage(1); }} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard icon={FiberNewIcon} label="New" value={byStatus.new || 0} color="bg-blue-500"
            onClick={() => { setFilters({ status: "new" }); setPage(1); }} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard icon={PhoneCallbackIcon} label="Contacted" value={byStatus.contacted || 0} color="bg-indigo-500"
            onClick={() => { setFilters({ status: "contacted" }); setPage(1); }} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard icon={CheckCircleIcon} label="Converted" value={byStatus.converted || 0} color="bg-green-500"
            onClick={() => { setFilters({ status: "converted" }); setPage(1); }} />
        </Grid>
      </Grid>

      {/* Filters — single compact row */}
      <CompactFilterBar
        dateFilterSlot={
          <QuickDateRangeFilter
            value={{ from: fromDate, to: toDate }}
            onChange={({ from, to }) => {
              setFromDate(from);
              setToDate(to);
              setPage(1);
            }}
          />
        }
        search={search}
        onSearchChange={handleSearch}
        searchPlaceholder="Search by name, phone, email, or lead #..."
        filters={filterOptions}
        filterValues={filters}
        onFilterChange={handleFilterChange}
        onRefresh={handleReset}
      />

      {/* Data Table */}
      <DataTable
        columns={getColumns((row) => setConfirmDelete(row))}
        data={enquiries}
        loading={isLoading}
        pagination={{
          page,
          limit,
          total,
          onPageChange: setPage,
          onLimitChange: (newLimit) => { setLimit(newLimit); setPage(1); },
        }}
        onRowClick={handleRowClick}
        emptyMessage="No enquiries found"
      />

      {/* Detail Modal */}
      <EnquiryDetailModal
        open={detailModalOpen}
        onClose={() => { setDetailModalOpen(false); setSelectedEnquiry(null); }}
        enquiry={selectedEnquiry}
        onRefresh={refetch}
      />
      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          deleteEnquiry(confirmDelete._id, {
            onSuccess: () => {
              toast.success("Enquiry deleted successfully");
              setConfirmDelete(null);
              refetch();
            },
            onError: (err) => toast.error(err.response?.data?.message || "Delete failed"),
          });
        }}
        title="Delete Enquiry"
        message={`Are you sure you want to delete enquiry from "${confirmDelete?.name || ""}"? This action cannot be undone.`}
        confirmText="Delete"
        loading={isDeleting}
      />
    </Box>
  );
};

export default Enquiries;

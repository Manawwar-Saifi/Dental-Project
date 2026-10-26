/**
 * Admin Notifications Page
 *
 * Displays:
 * - Stats cards (total, read, SMS sent, email sent)
 * - All notifications table with filters
 * - Send notification button
 */
import { useState } from "react";
import {
  Box,
  Typography,
  Chip,
  Avatar,
  Button,
  Card,
  CardContent,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import AddIcon from "@mui/icons-material/Add";
import NotificationsIcon from "@mui/icons-material/Notifications";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";
import SmsIcon from "@mui/icons-material/Sms";
import EmailIcon from "@mui/icons-material/Email";
import EventIcon from "@mui/icons-material/Event";
import PaymentIcon from "@mui/icons-material/Payment";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import CardMembershipIcon from "@mui/icons-material/CardMembership";
import CampaignIcon from "@mui/icons-material/Campaign";
import InfoIcon from "@mui/icons-material/Info";
import DataTable from "../../components/common/DataTable";
import CompactFilterBar from "../../components/common/CompactFilterBar";
import QuickDateRangeFilter from "../../components/admin/QuickDateRangeFilter";
import {
  useAdminNotifications,
  useNotificationStats,
} from "../../hooks/admin/useNotifications";
import SendNotificationModal from "../../components/admin/modals/SendNotificationModal";

/**
 * Type config
 */
const typeConfig = {
  appointment_reminder: { label: "Apt Reminder", color: "info", icon: EventIcon },
  appointment_confirmation: { label: "Apt Confirm", color: "info", icon: EventIcon },
  appointment_cancellation: { label: "Apt Cancel", color: "error", icon: EventIcon },
  payment_reminder: { label: "Pay Reminder", color: "warning", icon: PaymentIcon },
  payment_received: { label: "Pay Received", color: "success", icon: PaymentIcon },
  treatment_update: { label: "Treatment", color: "secondary", icon: MedicalServicesIcon },
  test_result: { label: "Test Result", color: "secondary", icon: MedicalServicesIcon },
  membership_expiry: { label: "Membership", color: "warning", icon: CardMembershipIcon },
  membership_renewal: { label: "Renewal", color: "success", icon: CardMembershipIcon },
  general: { label: "General", color: "default", icon: InfoIcon },
  promotional: { label: "Promo", color: "primary", icon: CampaignIcon },
};

const priorityColors = {
  low: "default",
  normal: "info",
  high: "warning",
  urgent: "error",
};

/**
 * Table columns
 */
const columns = [
  {
    field: "type",
    headerName: "Type",
    minWidth: 140,
    render: (value) => {
      const config = typeConfig[value] || typeConfig.general;
      return (
        <Chip
          label={config.label}
          size="small"
          color={config.color}
          variant="outlined"
        />
      );
    },
  },
  {
    field: "title",
    headerName: "Title",
    minWidth: 200,
    render: (value, row) => (
      <Box>
        <Typography variant="body2" fontWeight={row.isRead ? "normal" : "bold"}>
          {value}
        </Typography>
        <Typography
          variant="caption"
          className="text-gray-500 line-clamp-1"
        >
          {row.message}
        </Typography>
      </Box>
    ),
  },
  {
    field: "recipient",
    headerName: "Recipient",
    minWidth: 160,
    render: (value, row) => (
      <Box className="flex items-center gap-2">
        <Avatar
          className="bg-blue-100 text-blue-600"
          sx={{ width: 28, height: 28, fontSize: 12 }}
        >
          {value?.name?.[0]?.toUpperCase() || "?"}
        </Avatar>
        <Box>
          <Typography variant="body2" className="font-medium">
            {value?.name || "Unknown"}
          </Typography>
          <Typography variant="caption" className="text-gray-500">
            {row.recipientType === "patient" ? "Patient" : "Staff"}
          </Typography>
        </Box>
      </Box>
    ),
  },
  {
    field: "priority",
    headerName: "Priority",
    minWidth: 90,
    render: (value) => (
      <Chip
        label={value || "normal"}
        size="small"
        color={priorityColors[value] || "default"}
      />
    ),
  },
  {
    field: "isRead",
    headerName: "Read",
    minWidth: 70,
    render: (value) => (
      <Chip
        label={value ? "Read" : "Unread"}
        size="small"
        color={value ? "default" : "warning"}
        variant={value ? "outlined" : "filled"}
      />
    ),
  },
  {
    field: "sendSms",
    headerName: "Channels",
    minWidth: 120,
    render: (_, row) => (
      <Box className="flex gap-1">
        {row.showInApp && (
          <Chip label="App" size="small" variant="outlined" sx={{ fontSize: 10, height: 22 }} />
        )}
        {row.sendSms && (
          <Chip label="SMS" size="small" color="success" variant="outlined" sx={{ fontSize: 10, height: 22 }} />
        )}
        {row.sendEmail && (
          <Chip label="Email" size="small" color="info" variant="outlined" sx={{ fontSize: 10, height: 22 }} />
        )}
      </Box>
    ),
  },
  {
    field: "createdAt",
    headerName: "Sent At",
    minWidth: 120,
    type: "datetime",
  },
];

/**
 * Filter options
 */
const filterOptions = [
  {
    key: "type",
    label: "Type",
    options: [
      { value: "appointment_reminder", label: "Apt Reminder" },
      { value: "payment_reminder", label: "Pay Reminder" },
      { value: "treatment_update", label: "Treatment" },
      { value: "general", label: "General" },
      { value: "promotional", label: "Promotional" },
      { value: "membership_expiry", label: "Membership" },
    ],
  },
  {
    key: "recipientType",
    label: "Recipient",
    options: [
      { value: "patient", label: "Patients" },
      { value: "user", label: "Staff" },
    ],
  },
];

/**
 * Stat card component
 */
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
        <Typography variant="caption" className="text-gray-500">
          {label}
        </Typography>
        <Typography variant="h6" className="font-bold leading-tight">
          {value}
        </Typography>
      </Box>
    </CardContent>
  </Card>
);

const Notifications = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({});
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sendModalOpen, setSendModalOpen] = useState(false);

  const { data, isLoading, refetch } = useAdminNotifications({
    page,
    limit,
    ...filters,
    ...(fromDate && { from: fromDate }),
    ...(toDate && { to: toDate }),
  });

  const notifications = data?.data?.notifications || data?.data || [];
  const pagination = data?.pagination || { total: 0 };

  const { data: statsData } = useNotificationStats({
    ...(fromDate && { from: fromDate }),
    ...(toDate && { to: toDate }),
  });
  const stats = statsData?.data?.stats || {};

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
            Notifications
          </Typography>
          <Typography variant="body2" className="text-gray-500">
            Send and manage notifications to patients & staff
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setSendModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Send Notification
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} className="mb-4">
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard
            icon={NotificationsIcon}
            label="Total Sent"
            value={stats.total || 0}
            color="bg-blue-500"
            onClick={() => { setFilters({}); setPage(1); }}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard
            icon={MarkEmailReadIcon}
            label="Read"
            value={stats.read || 0}
            color="bg-green-500"
            onClick={() => { setFilters({ isRead: "true" }); setPage(1); }}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard
            icon={SmsIcon}
            label="SMS Sent"
            value={stats.smsSent || 0}
            color="bg-purple-500"
            onClick={() => { setFilters({ sendSms: "true" }); setPage(1); }}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard
            icon={EmailIcon}
            label="Email Sent"
            value={stats.emailSent || 0}
            color="bg-orange-500"
            onClick={() => { setFilters({ sendEmail: "true" }); setPage(1); }}
          />
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
        searchPlaceholder="Search notifications..."
        filters={filterOptions}
        filterValues={filters}
        onFilterChange={handleFilterChange}
        onRefresh={handleReset}
      />

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={notifications}
        loading={isLoading}
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
        emptyMessage="No notifications found"
      />

      {/* Send Notification Modal */}
      <SendNotificationModal
        open={sendModalOpen}
        onClose={() => setSendModalOpen(false)}
        onSuccess={refetch}
      />
    </Box>
  );
};

export default Notifications;

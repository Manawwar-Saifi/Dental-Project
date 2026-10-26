/**
 * Admin Membership Plans Page
 *
 * Full CRUD management for membership plans.
 * Features:
 * - List all plans with DataTable (active, inactive, discontinued)
 * - Add, edit, delete plans via modals
 * - Actions menu per row: Mark Active / Mark Inactive / Mark Discontinued / Edit / Delete
 * - Filter by type, tier, status
 */
import React, { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Menu,
  MenuItem,
  Popover,
  Avatar,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import DataTable from "../../components/common/DataTable";
import {
  useMembershipPlans,
  useMembershipMutations,
  usePlanSubscriberCounts,
} from "../../hooks/admin/useMemberships";
import { useNavigate } from "react-router-dom";
import AddMembershipModal from "../../components/admin/modals/AddMembershipModal";
import EditMembershipModal from "../../components/admin/modals/EditMembershipModal";
import MembershipDetailModal from "../../components/admin/modals/MembershipDetailModal";

/**
 * Tier colors
 */
const tierColors = {
  silver: "default",
  gold: "warning",
  platinum: "info",
};

const Memberships = () => {
  // Search and filter state
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({});

  // Modal states
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  // Actions menu state
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuPlan, setMenuPlan] = useState(null);

  // ── Subscriber popover state ───────────────────────────────────────────────
  const [subPopover, setSubPopover] = useState({ anchorEl: null, planId: null });

  const navigate = useNavigate();

  // React Query — pass active:"all" so admin sees every plan (active, inactive, discontinued)
  const { data, isLoading, refetch } = useMembershipPlans({ active: "all" });
  const { deletePlan, updatePlan, isDeleting } = useMembershipMutations();

  // Subscriber counts per plan (bulk, one request)
  const { data: subData } = usePlanSubscriberCounts();
  const subscriberCounts = subData?.data?.subscriberCounts || {};

  const plans = data?.data?.plans || [];

  /**
   * Client-side search & filter
   */
  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      const matchesSearch =
        !search ||
        plan.name.toLowerCase().includes(search.toLowerCase()) ||
        plan.code.toLowerCase().includes(search.toLowerCase());

      const matchesType = !filters.type || plan.type === filters.type;
      const matchesTier = !filters.tier || plan.tier === filters.tier;

      let matchesStatus = true;
      if (filters.status === "active") matchesStatus = plan.isActive && !plan.discontinued;
      else if (filters.status === "inactive") matchesStatus = !plan.isActive && !plan.discontinued;
      else if (filters.status === "discontinued") matchesStatus = !!plan.discontinued;

      return matchesSearch && matchesType && matchesTier && matchesStatus;
    });
  }, [plans, search, filters]);

  /**
   * Actions menu handlers
   */
  const handleMenuOpen = (e, plan) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
    setMenuPlan(plan);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuPlan(null);
  };

  const handleReset = () => {
    setSearch("");
    setFilters({});
  };

  const handleStatusChange = (updates) => {
    if (!menuPlan) return;
    updatePlan(
      { id: menuPlan._id, data: updates },
      {
        onSuccess: () => {
          handleMenuClose();
          refetch();
        },
      }
    );
  };

  /**
   * Row / modal handlers
   */
  const handleRowClick = (plan) => {
    setSelectedPlan(plan);
    setDetailModalOpen(true);
  };

  const handleEdit = (plan) => {
    setSelectedPlan(plan);
    setDetailModalOpen(false);
    setEditModalOpen(true);
  };

  const handleDelete = (plan) => {
    setSelectedPlan(plan);
    setDetailModalOpen(false);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedPlan) {
      deletePlan(selectedPlan._id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setSelectedPlan(null);
          refetch();
        },
      });
    }
  };

  /**
   * Table columns — defined inside component so Actions render can close over handlers
   */
  const columns = [
    {
      field: "name",
      headerName: "Plan Name",
      minWidth: 180,
      render: (value) => (
        <Typography variant="body2" className="font-medium">
          {value}
        </Typography>
      ),
    },
    {
      field: "code",
      headerName: "Code",
      minWidth: 120,
      render: (value) => (
        <Typography variant="body2" className="font-mono text-gray-600">
          {value}
        </Typography>
      ),
    },
    {
      field: "type",
      headerName: "Type",
      minWidth: 110,
      render: (value) => (
        <Chip
          label={value}
          size="small"
          variant="outlined"
          color={value === "family" ? "secondary" : "primary"}
          className="capitalize"
        />
      ),
    },
    {
      field: "tier",
      headerName: "Tier",
      minWidth: 100,
      render: (value) => (
        <Chip
          label={value}
          size="small"
          color={tierColors[value] || "default"}
          className="capitalize"
        />
      ),
    },
    {
      field: "price",
      headerName: "Price",
      minWidth: 120,
      render: (_, row) => (
        <Typography variant="body2" className="font-numbers font-semibold text-green-600">
          {row.priceDisplay || `₹${row.price?.toLocaleString("en-IN")}`}
        </Typography>
      ),
    },
    {
      field: "discountPercentage",
      headerName: "Discount",
      minWidth: 100,
      render: (value) => (
        <Chip label={`${value}%`} size="small" color="success" variant="outlined" />
      ),
    },
    {
      field: "durationMonths",
      headerName: "Duration",
      minWidth: 100,
      render: (value) => `${value} months`,
    },
    {
      field: "maxMembers",
      headerName: "Members",
      minWidth: 90,
      render: (value) => value,
    },
    // Active Subscribers — count of patients currently holding this plan as an active membership
    {
      field: "_subscribers",
      headerName: "Active Subscribers",
      minWidth: 140,
      render: (_, row) => {
        const sub = subscriberCounts[row._id] || { count: 0, subscribers: [], hasMore: false, moreCount: 0 };
        if (sub.count === 0) {
          return <Typography variant="body2" sx={{ color: "#9ca3af" }}>—</Typography>;
        }
        return (
          <Box
            component="span"
            onClick={(e) => {
              e.stopPropagation();
              setSubPopover({ anchorEl: e.currentTarget, planId: row._id });
            }}
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              px: 1.5,
              py: 0.4,
              bgcolor: "#ede9fe",
              color: "#5b21b6",
              borderRadius: "4px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              userSelect: "none",
              "&:hover": { bgcolor: "#ddd6fe" },
            }}
          >
            {sub.count} active
          </Box>
        );
      },
    },
    {
      field: "isActive",
      headerName: "Status",
      minWidth: 130,
      render: (_, row) => {
        if (row.discontinued) {
          return (
            <Chip
              label="Discontinued"
              size="small"
              sx={{ backgroundColor: "#fef2f2", color: "#dc2626", fontWeight: 600, fontSize: "11px" }}
            />
          );
        }
        if (row.isActive) {
          return (
            <Chip
              label="Active"
              size="small"
              sx={{ backgroundColor: "#ecfdf5", color: "#059669", fontWeight: 600, fontSize: "11px" }}
            />
          );
        }
        return (
          <Chip
            label="Inactive"
            size="small"
            sx={{ backgroundColor: "#f3f4f6", color: "#6b7280", fontWeight: 600, fontSize: "11px" }}
          />
        );
      },
    },
    {
      field: "_id",
      headerName: "Actions",
      minWidth: 70,
      render: (_, row) => (
        <IconButton
          size="small"
          onClick={(e) => handleMenuOpen(e, row)}
          sx={{ color: "text.secondary" }}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      ),
    },
  ];

  return (
    <Box sx={{ minHeight: "100vh" }}>

      {/* Header */}
      <Box className="flex justify-between items-center mb-6">
        <Box>
          <Typography variant="h4" className="font-bold text-gray-800">
            Membership Plans
          </Typography>
          <Typography variant="body2" className="text-gray-500">
            Manage membership plans and pricing
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          className="bg-purple-600 hover:bg-purple-700"
          onClick={() => setAddModalOpen(true)}
        >
          Add Plan
        </Button>
      </Box>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredPlans}
        loading={isLoading}
        searchPlaceholder="Search by plan name or code..."
        onSearch={setSearch}
        searchValue={search}
        filters={[
          {
            key: "type",
            label: "Type",
            options: [
              { value: "individual", label: "Individual" },
              { value: "family", label: "Family" },
            ],
          },
          {
            key: "tier",
            label: "Tier",
            options: [
              { value: "silver", label: "Silver" },
              { value: "gold", label: "Gold" },
              { value: "platinum", label: "Platinum" },
            ],
          },
          {
            key: "status",
            label: "Status",
            options: [
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
              { value: "discontinued", label: "Discontinued" },
            ],
          },
        ]}
        filterValues={filters}
        onFilterChange={(key, value) =>
          setFilters((prev) => ({ ...prev, [key]: value }))
        }
        pagination={false}
        onRowClick={handleRowClick}
        onRefresh={handleReset}
        emptyMessage="No membership plans found"
      />

      {/* Per-row Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        {menuPlan && !menuPlan.discontinued && menuPlan.isActive && (
          <MenuItem onClick={() => handleStatusChange({ isActive: false })}>
            Mark Inactive
          </MenuItem>
        )}
        {menuPlan && !menuPlan.discontinued && !menuPlan.isActive && (
          <MenuItem onClick={() => handleStatusChange({ isActive: true, discontinued: false })}>
            Mark Active
          </MenuItem>
        )}
        {menuPlan && !menuPlan.discontinued && (
          <MenuItem
            onClick={() => handleStatusChange({ isActive: false, discontinued: true })}
            sx={{ color: "error.main" }}
          >
            Mark Discontinued
          </MenuItem>
        )}
        {menuPlan && menuPlan.discontinued && (
          <MenuItem onClick={() => handleStatusChange({ isActive: true, discontinued: false })}>
            Reactivate Plan
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            handleMenuClose();
            handleEdit(menuPlan);
          }}
        >
          Edit Plan
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleMenuClose();
            handleDelete(menuPlan);
          }}
          sx={{ color: "error.main" }}
        >
          Delete Plan
        </MenuItem>
      </Menu>

      {/* ── SUBSCRIBER PREVIEW POPOVER ──────────────────────────────────────── */}
      <Popover
        open={Boolean(subPopover.anchorEl)}
        anchorEl={subPopover.anchorEl}
        onClose={() => setSubPopover({ anchorEl: null, planId: null })}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        disableScrollLock
        PaperProps={{ sx: { width: 260, p: 1.5, borderRadius: 2, boxShadow: 3 } }}
      >
        {(() => {
          const sub = subscriberCounts[subPopover.planId] || {};
          const subs = sub.subscribers || [];
          return (
            <>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "#374151", display: "block", mb: 1 }}>
                Active Subscribers ({sub.count || 0})
              </Typography>
              {subs.length === 0 ? (
                <Typography variant="body2" sx={{ color: "#9ca3af" }}>No subscribers</Typography>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
                  {subs.map((s) => (
                    <Box
                      key={s._id}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        py: 0.75,
                        px: 1,
                        borderRadius: 1,
                        cursor: "pointer",
                        "&:hover": { bgcolor: "#f5f3ff" },
                      }}
                      onClick={() => {
                        setSubPopover({ anchorEl: null, planId: null });
                        navigate(`/admin/patients?patientId=${s._id}`);
                      }}
                    >
                      <Avatar sx={{ width: 28, height: 28, fontSize: "0.7rem", bgcolor: "#ede9fe", color: "#5b21b6" }}>
                        {s.name?.[0]?.toUpperCase() || "P"}
                      </Avatar>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: "#1f2937" }}>
                        {s.name}
                      </Typography>
                    </Box>
                  ))}
                  {sub.hasMore && (
                    <Typography variant="caption" sx={{ color: "#6b7280", textAlign: "center", pt: 0.5 }}>
                      +{sub.moreCount} more
                    </Typography>
                  )}
                </Box>
              )}
            </>
          );
        })()}
      </Popover>


      {/* Add Plan Modal */}
      <AddMembershipModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={refetch}
      />

      {/* Edit Plan Modal */}
      <EditMembershipModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedPlan(null);
        }}
        plan={selectedPlan}
        onSuccess={refetch}
      />

      {/* Plan Detail Modal */}
      <MembershipDetailModal
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedPlan(null);
        }}
        plan={selectedPlan}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Deactivate Plan?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to deactivate <strong>{selectedPlan?.name}</strong>?
            This will prevent new subscriptions but won't affect existing members.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            color="error"
            variant="contained"
            disabled={isDeleting}
          >
            {isDeleting ? "Deactivating..." : "Deactivate"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Memberships;

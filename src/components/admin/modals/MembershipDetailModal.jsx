/**
 * Membership Plan Detail Modal
 *
 * Displays detailed information about a membership plan.
 */
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Divider,
  IconButton,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CardMembershipIcon from "@mui/icons-material/CardMembership";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PeopleIcon from "@mui/icons-material/People";
import DiscountIcon from "@mui/icons-material/Discount";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

/**
 * Format currency
 */
const formatCurrency = (amount) => {
  return `₹${(amount || 0).toLocaleString("en-IN")}`;
};

/**
 * Format date
 */
const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/**
 * Tier colors
 */
const tierColors = {
  silver: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300" },
  gold: { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-300" },
  platinum: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-300" },
};

/**
 * Info row component
 */
const InfoRow = ({ label, value, icon: Icon }) => (
  <Box className="flex items-start gap-3 py-2">
    {Icon && <Icon className="text-gray-500 mt-0.5" fontSize="small" />}
    <Box>
      <Typography variant="caption" className="text-gray-500 block">
        {label}
      </Typography>
      <Typography variant="body2" className="font-medium">
        {value || "-"}
      </Typography>
    </Box>
  </Box>
);

const MembershipDetailModal = ({ open, onClose, plan, onEdit, onDelete }) => {
  if (!plan) return null;

  const {
    name,
    code,
    type,
    tier,
    description,
    price,
    priceDisplay,
    durationMonths,
    discountPercentage,
    maxMembers,
    features,
    isActive,
    displayOrder,
    createdAt,
    updatedAt,
  } = plan;

  const tierStyle = tierColors[tier] || tierColors.silver;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ className: "rounded-xl" }}
    >
      {/* Header */}
      <DialogTitle className={`bg-linear-to-r from-purple-600 to-purple-700 text-white p-0`}>
        <Box className="flex items-center justify-between p-0">
          <Box className="flex items-center gap-4">
            <Box className={`p-3 rounded-full ${tierStyle.bg}`}>
              <CardMembershipIcon className={tierStyle.text} fontSize="large" />
            </Box>
            <Box>
              <Typography variant="h5" component="span" className="font-bold">
                {name}
              </Typography>
              <Box className="flex items-center gap-2 mt-1">
                <Chip
                  label={code}
                  size="small"
                  sx={{ bgcolor: "#ffffff", color: "#5b21b6", fontFamily: "monospace", fontSize: "0.7rem" }}
                />
                <Chip
                  label={isActive ? "Active" : "Inactive"}
                  size="small"
                  color={isActive ? "success" : "default"}
                />
              </Box>
            </Box>
          </Box>
          <IconButton onClick={onClose}>
            <CloseIcon className="text-white" />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* Content */}
      <DialogContent className="p-6 mt-8">
        {/* Price & Type Banner */}
        <Box className={`rounded-lg p-4 mb-6 ${tierStyle.bg} border ${tierStyle.border}`}>
          <Box className="flex justify-between items-center">
            <Box>
              <Typography variant="h4" className={`font-numbers font-bold ${tierStyle.text}`}>
                {priceDisplay || formatCurrency(price)}
              </Typography>
              <Typography variant="body2" className="text-gray-600">
                {durationMonths} months validity
              </Typography>
            </Box>
            <Box className="text-right">
              <Chip
                label={type}
                size="small"
                color={type === "family" ? "secondary" : "primary"}
                className="capitalize mb-1"
              />
              <Typography variant="body2" className={`font-semibold capitalize ${tierStyle.text}`}>
                {tier} Tier
              </Typography>
            </Box>
          </Box>
        </Box>

        <Grid container spacing={4}>
          {/* Left Column - Plan Details */}
          <Grid size={{ xs: 12, md: 6 }} className="mb-5">
            <Typography variant="subtitle2" className="font-semibold text-gray-700 mb-3 uppercase tracking-wide">
              Plan Details
            </Typography>
            <Box className="bg-gray-50 rounded-lg p-4 mt-3">
              <InfoRow
                icon={DiscountIcon}
                label="Discount on Treatments"
                value={`${discountPercentage}% off`}
              />
              <InfoRow
                icon={PeopleIcon}
                label="Maximum Members"
                value={maxMembers === 1 ? "1 member" : `Up to ${maxMembers} members`}
              />
              <InfoRow
                icon={AccessTimeIcon}
                label="Duration"
                value={`${durationMonths} month${durationMonths > 1 ? "s" : ""}`}
              />
              {description && (
                <Box className="pt-2 mt-2 border-t border-gray-200">
                  <Typography variant="caption" className="text-gray-500 block mb-1">
                    Rules & Conditions
                  </Typography>
                  <ul style={{ margin: 0, paddingLeft: "18px" }}>
                    {description.split("\n").filter(Boolean).map((line, i) => (
                      <li key={i} style={{ fontSize: "0.85rem", marginBottom: "2px" }}>{line.trim()}</li>
                    ))}
                  </ul>
                </Box>
              )}
            </Box>
          </Grid>

          {/* Right Column - Features */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle2" className="font-semibold text-gray-700 mb-3 uppercase tracking-wide">
              Features & Benefits
            </Typography>
            <Box className="bg-gray-50 rounded-lg p-4 mt-3">
              {features && features.length > 0 ? (
                <Box className="space-y-2">
                  {features.map((feature, index) => (
                    <Box key={index} className="flex items-start gap-2">
                      <CheckCircleIcon className="text-green-500 mt-0.5" fontSize="small" />
                      <Typography variant="body2">{feature}</Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" className="text-gray-400">
                  No features listed
                </Typography>
              )}
            </Box>
          </Grid>
        </Grid>

        {/* Coupon Configuration */}
        {plan.couponConfig && (
          <>
            <Divider className="my-4" />
            <Typography variant="subtitle2" className="font-semibold text-gray-700 mb-3 uppercase tracking-wide">
              Coupon Configuration
            </Typography>
            <Box className="bg-gray-50 rounded-lg p-4">
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Typography variant="caption" className="text-gray-500 block">
                    Coupons Enabled
                  </Typography>
                  <Chip
                    label={plan.couponConfig.enabled ? "Yes" : "No"}
                    size="small"
                    color={plan.couponConfig.enabled ? "success" : "default"}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Typography variant="caption" className="text-gray-500 block">
                    Number of Coupons
                  </Typography>
                  <Typography variant="body2" className="font-medium">
                    {plan.couponConfig.numberOfCoupons ?? "-"}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Typography variant="caption" className="text-gray-500 block">
                    Flat Discount
                  </Typography>
                  <Typography variant="body2" className="font-numbers font-medium">
                    {plan.couponConfig.flatDiscount != null ? `₹${plan.couponConfig.flatDiscount}` : "-"}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Typography variant="caption" className="text-gray-500 block">
                    Surgery Discount
                  </Typography>
                  <Typography variant="body2" className="font-medium">
                    {plan.couponConfig.surgeryDiscount != null ? `${plan.couponConfig.surgeryDiscount}%` : "-"}
                  </Typography>
                </Grid>
                {plan.couponConfig.conditions && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" className="text-gray-500 block">
                      Conditions & Rules
                    </Typography>
                    <Typography variant="body2" className="font-medium whitespace-pre-line">
                      {plan.couponConfig.conditions}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          </>
        )}

        {/* Footer Info */}
        <Divider className="my-4 " />
        <Box className="flex justify-between text-gray-400 mt-3">
          <Typography variant="caption">
            Display Order: {displayOrder} | Created: {formatDate(createdAt)}
          </Typography>
          <Typography variant="caption">Last Updated: {formatDate(updatedAt)}</Typography>
        </Box>
      </DialogContent>

      {/* Actions */}
      <DialogActions className="p-4 bg-gray-50 justify-between mt-3 ">
        <Box>
          {onDelete && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => onDelete(plan)}
            >
              Deactivate
            </Button>
          )}
        </Box>
        <Box className="flex gap-2">
          <Button onClick={onClose} color="inherit">
            Close
          </Button>
          {onEdit && (
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => onEdit(plan)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Edit Plan
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default MembershipDetailModal;

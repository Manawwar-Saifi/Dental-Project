/**
 * Reusable DataTable Component
 *
 * Features:
 * - Search functionality
 * - Column filters
 * - Pagination (10 rows default)
 * - Sortable columns
 * - Loading state
 * - Empty state
 *
 * Props:
 * - columns: Array of column definitions
 * - data: Array of row data
 * - loading: Boolean for loading state
 * - searchPlaceholder: Placeholder for search input
 * - onSearch: Function called when search changes
 * - filters: Array of filter definitions
 * - onFilterChange: Function called when filter changes
 * - pagination: { page, limit, total, onPageChange }
 * - onRowClick: Function called when row is clicked
 */
import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Typography,
  Skeleton,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import RefreshIcon from "@mui/icons-material/Refresh";

/**
 * DataTable Component
 */
const DataTable = ({
  columns = [],
  data = [],
  loading = false,
  searchPlaceholder = "Search...",
  onSearch,
  // When provided, the search input becomes externally controlled — the parent
  // drives the visible value (e.g. so resetting parent state clears the box).
  searchValue,
  filters = [],
  filterValues = {},
  onFilterChange,
  pagination = null,
  onRowClick,
  onRefresh,
  emptyMessage = "No data found",
  rowsPerPageOptions = [10, 25, 50],
  getRowStyle,
  getRowSx,
  // "small" reduces MUI TableCell padding to 6px (vs 16px for default "medium").
  // Defaults to "medium" so all existing call sites are unaffected.
  size = "medium",
}) => {
  // Local search state — used when searchValue prop is not provided.
  const [searchTerm, setSearchTerm] = useState("");

  /**
   * Handle search input change.
   * Guard on isTrusted: browser-autofill and programmatic dispatches set
   * isTrusted=false in most browsers.  Real keystrokes are always trusted.
   */
  const handleSearchChange = (e) => {
    if (!e.isTrusted) return;
    const value = e.target.value;
    setSearchTerm(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  /**
   * Handle filter change
   */
  const handleFilterChange = (filterKey, value) => {
    if (onFilterChange) {
      onFilterChange(filterKey, value);
    }
  };

  /**
   * Handle page change
   */
  const handlePageChange = (event, newPage) => {
    if (pagination?.onPageChange) {
      pagination.onPageChange(newPage + 1); // MUI uses 0-based, convert to 1-based
    }
  };

  /**
   * Handle rows per page change
   */
  const handleRowsPerPageChange = (event) => {
    if (pagination?.onLimitChange) {
      pagination.onLimitChange(parseInt(event.target.value, 10));
    }
  };

  /**
   * Render loading skeleton
   */
  const renderLoadingSkeleton = () => (
    <>
      {[...Array(5)].map((_, index) => (
        <TableRow key={index}>
          {columns.map((col, colIndex) => (
            <TableCell key={colIndex}>
              <Skeleton animation="wave" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );

  /**
   * Render empty state
   */
  const renderEmptyState = () => (
    <TableRow>
      <TableCell colSpan={columns.length} align="center" className="py-12">
        <Typography variant="body1" className="text-gray-500">
          {emptyMessage}
        </Typography>
      </TableCell>
    </TableRow>
  );

  /**
   * Render cell value based on column definition
   */
  const renderCell = (row, column) => {
    // If column has a custom render function, use it
    if (column.render) {
      return column.render(row[column.field], row);
    }

    const value = row[column.field];

    // Handle null/undefined
    if (value === null || value === undefined) {
      return <span className="text-gray-400">-</span>;
    }

    // Handle date fields
    if (column.type === "date" && value) {
      return new Date(value).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }

    // Handle datetime fields
    if (column.type === "datetime" && value) {
      return new Date(value).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    // Handle currency
    if (column.type === "currency" && value) {
      return `₹${value.toLocaleString("en-IN")}`;
    }

    // Handle status chips
    if (column.type === "status" && value) {
      const statusColors = {
        active: "success",
        inactive: "default",
        pending: "warning",
        completed: "success",
        cancelled: "error",
        scheduled: "info",
        confirmed: "info",
        paid: "success",
        failed: "error",
        refunded: "secondary",
      };
      return (
        <Chip
          label={value}
          size="small"
          color={statusColors[value.toLowerCase()] || "default"}
        />
      );
    }

    return value;
  };

  return (
    <Paper className="w-full">
      {/* Search and Filters Bar — only when there's at least one control to show
          (callers that pass none, e.g. when they render their own filter row,
          get no empty toolbar). Backward-compatible: pages passing search/filters/
          refresh render exactly as before. */}
      {(onSearch || filters.length > 0 || onRefresh) && (
      <Box className="p-4 border-b border-gray-200">
        <Box sx={{ display: "flex", flexWrap: "nowrap", alignItems: "center", gap: 2 }}>
          {/* Search Input — autoComplete="off" + non-standard name prevents
              Chrome's autofill heuristic from injecting values into this field
              when a modal form on the same page is submitted. */}
          {onSearch && (
            <TextField
              size="small"
              placeholder={searchPlaceholder}
              value={searchValue !== undefined ? searchValue : searchTerm}
              onChange={handleSearchChange}
              autoComplete="off"
              inputProps={{
                autoComplete: "off",
                name: "search-no-autofill",
              }}
              sx={{ flex: 1, minWidth: 0 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon className="text-gray-400" />
                  </InputAdornment>
                ),
              }}
            />
          )}

          {/* Filters */}
          {filters.map((filter) => (
            <FormControl key={filter.key} size="small" sx={{ minWidth: 120, flexShrink: 0 }}>
              <InputLabel>{filter.label}</InputLabel>
              <Select
                value={filterValues[filter.key] || "all"}
                label={filter.label}
                onChange={(e) => handleFilterChange(filter.key, e.target.value === "all" ? "" : e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                {filter.options.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ))}

          {/* Refresh Button */}
          {onRefresh && (
            <Tooltip title="Refresh">
              <IconButton onClick={onRefresh} className="ml-auto">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
      )}

      {/* Table */}
      {/* bg-white on both the scroll container and the table so the white
          background extends with horizontal scroll (no off-white gap). */}
      <TableContainer className="bg-white">
        {/* minWidth: max-content keeps each column's natural width so the table
            OVERFLOWS the container on narrow screens (phones/tablets/foldables)
            and the container scrolls horizontally, instead of cramming/wrapping
            columns. On wide screens width:100% still fills as before. */}
        <Table size={size} sx={{ bgcolor: "white", minWidth: "max-content" }}>
          <TableHead>
            <TableRow className="bg-gray-50">
              {columns.map((column) => (
                <TableCell
                  key={column.field}
                  className="font-semibold text-gray-700"
                  style={{ minWidth: column.minWidth }}
                  align={column.align || "left"}
                >
                  {column.headerName}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              renderLoadingSkeleton()
            ) : data.length === 0 ? (
              renderEmptyState()
            ) : (
              data.map((row, index) => (
                <TableRow
                  key={row._id || index}
                  hover
                  onClick={() => onRowClick && onRowClick(row)}
                  className={onRowClick ? "cursor-pointer" : ""}
                  style={getRowStyle ? getRowStyle(row) : undefined}
                  sx={getRowSx ? getRowSx(row) : undefined}
                >
                  {columns.map((column) => (
                    <TableCell key={column.field} align={column.align || "left"}>
                      {renderCell(row, column)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {pagination && (
        <TablePagination
          component="div"
          count={pagination.total || 0}
          page={(pagination.page || 1) - 1} // Convert 1-based to 0-based
          onPageChange={handlePageChange}
          rowsPerPage={pagination.limit || 10}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={rowsPerPageOptions}
          labelRowsPerPage="Rows per page:"
          className="border-t border-gray-200"
        />
      )}
    </Paper>
  );
};

export default DataTable;

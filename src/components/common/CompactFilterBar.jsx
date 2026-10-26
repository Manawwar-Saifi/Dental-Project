/**
 * CompactFilterBar
 *
 * A single responsive row of admin list filters (matches the Lab Orders tab):
 * [Date Filter: From  To  (clear)]  [Search ………]  [dropdowns]  [refresh]
 *
 * Layout/presentation only — all state, handlers, and options are owned by the
 * parent and passed in. Any section is omitted if its props aren't provided.
 */
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
} from "@mui/material";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";

const CompactFilterBar = ({
  // Date range (omit handlers to hide the date section)
  fromDate,
  toDate,
  onFromChange,
  onToChange,
  onClearDates,
  // Optional custom date-range filter element (e.g. QuickDateRangeFilter)
  // rendered in place of the bare From/To inputs above when provided.
  dateFilterSlot,
  // Search (omit onSearchChange to hide)
  search = "",
  onSearchChange,
  searchPlaceholder = "Search...",
  // Dropdown filters: [{ key, label, options: [{ value, label }] }]
  filters = [],
  filterValues = {},
  onFilterChange,
  // Refresh (omit to hide)
  onRefresh,
}) => {
  const showDates = !!(onFromChange && onToChange);

  return (
    <Paper className="p-3 mb-4">
      <Box sx={{ display: "flex", flexWrap: "nowrap", gap: 1.5, alignItems: "center" }}>
        {dateFilterSlot}
        {!dateFilterSlot && showDates && (
          <>
            <TextField
              type="date"
              size="small"
              label="From"
              value={fromDate}
              onChange={onFromChange}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ width: 150 }}
            />
            <TextField
              type="date"
              size="small"
              label="To"
              value={toDate}
              onChange={onToChange}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ width: 150 }}
            />
            {(fromDate || toDate) && onClearDates && (
              <IconButton size="small" onClick={onClearDates} title="Clear dates">
                <ClearIcon fontSize="small" />
              </IconButton>
            )}
          </>
        )}

        {onSearchChange && (
          <TextField
            size="small"
            placeholder={searchPlaceholder}
            value={search || ""}
            onChange={(e) => onSearchChange(e.target.value)}
            sx={{ flex: 1, minWidth: 200 }}
            autoComplete="off"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon className="text-gray-400" />
                </InputAdornment>
              ),
            }}
          />
        )}

        {filters.map((filter) => (
          <FormControl key={filter.key} size="small" sx={{ minWidth: 160 }}>
            <InputLabel>{filter.label}</InputLabel>
            <Select
              value={filterValues[filter.key] || ""}
              label={filter.label}
              onChange={(e) => onFilterChange(filter.key, e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {filter.options.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ))}

        {onRefresh && (
          <Tooltip title="Refresh">
            <IconButton onClick={onRefresh}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Paper>
  );
};

export default CompactFilterBar;

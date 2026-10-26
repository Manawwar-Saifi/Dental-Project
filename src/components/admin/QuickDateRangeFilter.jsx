/**
 * QuickDateRangeFilter
 *
 * Controlled date-range picker with quick presets (Today / Yesterday /
 * This Month / This FY / Custom Range). Drop-in replacement for a bare
 * From/To date-picker pair — emits the same {from, to} yyyy-mm-dd shape.
 *
 * All computation happens in the browser's LOCAL timezone (matching
 * src/utils/dateInput.js's todayStr() convention) — never toISOString()/UTC,
 * which would shift the calendar date near midnight in IST.
 *
 * Presets other than "Custom Range" compute and emit the range immediately;
 * "Custom Range" reveals the original From/To inputs for manual entry.
 *
 * The preset dropdown starts unselected ("All Time") when the parent's
 * from/to are both empty on mount — every current caller of this component
 * defaults to showing all-time data, so this preserves that existing
 * behavior instead of silently narrowing every page to "Today" on load.
 */
import { useState, useEffect } from "react";
import {
  Box,
  TextField,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import { todayStr } from "../../utils/dateInput";

const PRESETS = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "fy", label: "This FY" },
  { value: "custom", label: "Custom Range" },
];

const toDateStr = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

const computeRange = (preset) => {
  const now = new Date();
  switch (preset) {
    case "today": {
      const t = todayStr();
      return { from: t, to: t };
    }
    case "yesterday": {
      const y = toDateStr(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
      return { from: y, to: y };
    }
    case "week": {
      // ISO Monday-anchored week (standard business week, correct for India).
      const dayOfWeek = now.getDay(); // 0=Sun … 6=Sat
      const daysFromMonday = (dayOfWeek + 6) % 7; // 0 on Mon, 1 on Tue, …
      const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysFromMonday);
      return { from: toDateStr(monday), to: todayStr() };
    }
    case "month": {
      const first = toDateStr(new Date(now.getFullYear(), now.getMonth(), 1));
      return { from: first, to: todayStr() };
    }
    case "fy": {
      // India FY: April 1 - March 31. Month index 3 = April (0-based).
      const fyStartYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
      const fyStart = toDateStr(new Date(fyStartYear, 3, 1));
      return { from: fyStart, to: todayStr() };
    }
    default:
      return { from: "", to: "" };
  }
};

const QuickDateRangeFilter = ({ value = {}, onChange }) => {
  const { from = "", to = "" } = value;
  const [preset, setPreset] = useState(() => (from || to ? "custom" : ""));

  // If the parent clears the range externally (e.g. a stat-card filter or
  // "Reset" button resetting fromDate/toDate directly), drop a stale computed
  // preset selection back to "All Time". Custom is left alone even when both
  // fields are blank, since the user may have just switched to it on purpose.
  useEffect(() => {
    if (!from && !to && preset && preset !== "custom") {
      setPreset("");
    }
  }, [from, to]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePresetChange = (e) => {
    const next = e.target.value;
    setPreset(next);
    if (next === "custom") return; // reveal pickers; wait for manual input
    onChange(next === "" ? { from: "", to: "" } : computeRange(next));
  };

  const handleFromChange = (e) => onChange({ from: e.target.value, to });
  const handleToChange = (e) => onChange({ from, to: e.target.value });
  const handleClear = () => {
    setPreset("");
    onChange({ from: "", to: "" });
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <FormControl size="small" sx={{ minWidth: 150 }}>
        {/* Select uses displayEmpty (the "" value renders "All Time"), so the
            label must always render shrunk -- otherwise it sits in the same
            vertical space as the displayed value and visually overlaps it. */}
        <InputLabel shrink>Date Range</InputLabel>
        <Select
          displayEmpty
          value={preset}
          label="Date Range"
          onChange={handlePresetChange}
          sx={{ "& .MuiInputBase-root": { height: 36 }, height: 36, fontSize: "0.8125rem" }}
        >
          <MenuItem value="">All Time</MenuItem>
          {PRESETS.map((p) => (
            <MenuItem key={p.value} value={p.value}>
              {p.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {preset === "custom" && (
        <>
          <TextField
            type="date"
            size="small"
            label="From"
            value={from}
            onChange={handleFromChange}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ width: 150 }}
          />
          <TextField
            type="date"
            size="small"
            label="To"
            value={to}
            onChange={handleToChange}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ width: 150 }}
          />
        </>
      )}

      {(from || to) && (
        <IconButton size="small" onClick={handleClear} title="Clear dates">
          <ClearIcon fontSize="small" />
        </IconButton>
      )}
    </Box>
  );
};

export default QuickDateRangeFilter;

/**
 * Patient Dashboard card — upcoming follow-up reminders.
 * Reminder only: no fee/invoice is shown. Email is the primary channel; this is
 * the in-app surface for the patient.
 */
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  CircularProgress,
} from "@mui/material";
import EventRepeatIcon from "@mui/icons-material/EventRepeat";
import { getMyFollowUps } from "../../api/patient/followups.api";

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "-";

const UpcomingFollowUps = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getMyFollowUps()
      .then((res) => {
        if (active) setItems(res.data?.reminders || []);
      })
      .catch(() => {
        if (active) setItems([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <EventRepeatIcon sx={{ color: "#ed6c02" }} />
          <Typography variant="h6" fontWeight="bold">
            Upcoming Follow-ups
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ textAlign: "center", py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : items.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 1 }}>
            No upcoming follow-ups.
          </Typography>
        ) : (
          <Box className="flex flex-col gap-2">
            {items.map((r) => (
              <Box
                key={r._id}
                sx={{ p: 1.5, bgcolor: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 2 }}
                className="flex items-center justify-between gap-2"
              >
                <Box className="min-w-0">
                  <Typography variant="body2" fontWeight="bold">
                    {formatDate(r.followUpDate)}
                    {r.time ? ` · ${r.time}` : ""}
                  </Typography>
                  {r.reason && (
                    <Typography variant="caption" color="text.secondary" className="block truncate">
                      {r.reason}
                    </Typography>
                  )}
                  {r.clinic?.name && (
                    <Typography variant="caption" color="text.secondary" className="block">
                      {r.clinic.name}
                    </Typography>
                  )}
                </Box>
                <Chip size="small" label="Reminder" color="warning" variant="outlined" />
              </Box>
            ))}
          </Box>
        )}

        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
          A reminder only — no payment is due now. We'll also email you before the date.
        </Typography>
      </CardContent>
    </Card>
  );
};

export default UpcomingFollowUps;

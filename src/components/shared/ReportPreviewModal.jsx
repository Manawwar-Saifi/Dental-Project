/**
 * Report Preview Modal
 *
 * Full-screen (mobile) / large (desktop) preview for a report's file(s),
 * with large, easy-to-tap Back and Download buttons -- replaces relying on
 * a tiny per-row Download icon, which is hard to tap accurately on mobile.
 * Reused across the admin Reports page, Patient Detail modal's Reports
 * tab, and the patient portal's Reports page.
 */
import { useState, useEffect } from "react";
import {
  Dialog,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Button,
  Chip,
  useMediaQuery,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DownloadIcon from "@mui/icons-material/Download";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { downloadFile } from "../../utils/downloadFile";

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const ReportPreviewModal = ({ open, onClose, report }) => {
  const isMobile = useMediaQuery("(max-width:600px)");
  const [fileIndex, setFileIndex] = useState(0);

  // Multi-file reports store data in files[] -- legacy singular `file` is a
  // Mongoose-default-populated placeholder ({fileType:...}, no url) for
  // reports created before multi-file support, always truthy but unusable
  // unless it genuinely has a url.
  const reportFiles =
    report?.files?.length > 0 ? report.files : report?.file?.url ? [report.file] : [];
  const currentFile = reportFiles[fileIndex];

  // Reset to the first file whenever a different report is opened.
  useEffect(() => {
    if (open) setFileIndex(0);
  }, [open, report?._id]);

  if (!report) return null;

  const isImage = currentFile?.fileType?.includes("image");
  const isPdf = currentFile?.fileType?.includes("pdf") || currentFile?.url?.includes(".pdf");

  return (
    <Dialog open={open} onClose={onClose} fullScreen={isMobile} maxWidth="md" fullWidth>
      <AppBar position="relative" color="default" elevation={1}>
        <Toolbar sx={{ gap: 1 }}>
          <IconButton edge="start" onClick={onClose} size="large" aria-label="Back">
            {isMobile ? <ArrowBackIcon /> : <CloseIcon />}
          </IconButton>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" noWrap fontWeight="medium">
              {report.title || "Report"}
            </Typography>
            {reportFiles.length > 1 && (
              <Typography variant="caption" color="text.secondary">
                File {fileIndex + 1} of {reportFiles.length}
              </Typography>
            )}
          </Box>
          {report.category && (
            <Chip size="small" label={report.category.replace("_", " ")} variant="outlined" sx={{ display: { xs: "none", sm: "flex" } }} />
          )}
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          bgcolor: "#f5f5f5",
          minHeight: isMobile ? "calc(100vh - 128px)" : 480,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {formatDate(report.reportDate || report.createdAt)}
          </Typography>
          {reportFiles.length > 1 && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <IconButton size="small" disabled={fileIndex === 0} onClick={() => setFileIndex((i) => i - 1)}>
                <ChevronLeftIcon />
              </IconButton>
              <IconButton size="small" disabled={fileIndex === reportFiles.length - 1} onClick={() => setFileIndex((i) => i + 1)}>
                <ChevronRightIcon />
              </IconButton>
            </Box>
          )}
        </Box>

        <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "auto", p: 2 }}>
          {!currentFile ? (
            <Typography color="text.secondary">No file available for this report</Typography>
          ) : isImage ? (
            <Box
              component="img"
              src={currentFile.url}
              alt={report.title}
              sx={{ maxWidth: "100%", maxHeight: "70vh", objectFit: "contain", borderRadius: 1, boxShadow: 1 }}
            />
          ) : isPdf ? (
            <Box
              component="iframe"
              src={`https://docs.google.com/gview?url=${encodeURIComponent(currentFile.url)}&embedded=true`}
              title={report.title}
              sx={{ width: "100%", height: isMobile ? "calc(100vh - 220px)" : "65vh", border: "none", borderRadius: 1, bgcolor: "white" }}
            />
          ) : (
            <Typography color="text.secondary">
              Preview not available for this file type -- use Download below.
            </Typography>
          )}
        </Box>
      </Box>

      <Box sx={{ display: "flex", gap: 1.5, p: 2, borderTop: "1px solid #e0e0e0", bgcolor: "white" }}>
        <Button
          fullWidth
          size="large"
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={onClose}
          sx={{ py: 1.5 }}
        >
          Back
        </Button>
        <Button
          fullWidth
          size="large"
          variant="contained"
          startIcon={<DownloadIcon />}
          disabled={!currentFile}
          onClick={() => currentFile && downloadFile(currentFile.url, report.title || "report")}
          sx={{ py: 1.5 }}
        >
          Download
        </Button>
      </Box>
    </Dialog>
  );
};

export default ReportPreviewModal;

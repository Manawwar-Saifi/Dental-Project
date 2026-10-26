/**
 * Edit Report Modal
 *
 * Modal for editing report metadata and replacing the uploaded file.
 */
import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  MenuItem,
  IconButton,
  CircularProgress,
  FormControlLabel,
  Switch,
  Paper,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DescriptionIcon from "@mui/icons-material/Description";
import DeleteIcon from "@mui/icons-material/Delete";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ImageIcon from "@mui/icons-material/Image";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import { toast } from "react-toastify";
import { useReportMutations } from "../../../hooks/admin/useReports";

const reportCategories = [
  { value: "xray", label: "X-Ray" },
  { value: "opg", label: "OPG" },
  { value: "cbct", label: "CBCT" },
  { value: "lab_report", label: "Lab Report" },
  { value: "prescription", label: "Prescription" },
  { value: "treatment_plan", label: "Treatment Plan" },
  { value: "consent_form", label: "Consent Form" },
  { value: "other", label: "Other" },
];

const formatFileSize = (bytes) => {
  if (!bytes) return "-";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

const EditReportModal = ({ open, onClose, report, onSuccess }) => {
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [formData, setFormData] = useState({
    title: "",
    category: "xray",
    description: "",
    reportDate: "",
    isVisibleToPatient: true,
    notes: "",
  });
  const [newFile, setNewFile] = useState(null);

  const { updateReport, replaceFile, isUpdating, isReplacingFile } =
    useReportMutations();

  const isBusy = isUpdating || isReplacingFile;

  useEffect(() => {
    if (report) {
      setFormData({
        title: report.title || "",
        category: report.category || "xray",
        description: report.description || "",
        reportDate: report.reportDate
          ? new Date(report.reportDate).toISOString().split("T")[0]
          : "",
        isVisibleToPatient: report.isVisibleToPatient ?? true,
        notes: report.notes || "",
      });
      setNewFile(null);
    }
  }, [report]);

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSwitchChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.checked }));
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/jpg",
      ];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Please select a PDF or image file (JPEG, PNG)");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setNewFile(file);
    }
  };

  const handleRemoveNewFile = () => {
    setNewFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      toast.error("Report title is required");
      return;
    }

    const onDone = () => {
      onSuccess?.();
      onClose();
    };

    const onFail = (err) => {
      toast.error(err.response?.data?.message || "Failed to update report");
    };

    // If a new file is selected, replace file first, then update metadata
    if (newFile) {
      const fd = new FormData();
      fd.append("file", newFile);

      replaceFile(
        { id: report._id, formData: fd },
        {
          onSuccess: () => {
            // Now update metadata
            updateReport(
              {
                id: report._id,
                data: {
                  title: formData.title.trim(),
                  category: formData.category,
                  description: formData.description.trim(),
                  reportDate: formData.reportDate,
                  isVisibleToPatient: formData.isVisibleToPatient,
                  notes: formData.notes.trim(),
                },
              },
              { onSuccess: onDone, onError: onFail }
            );
          },
          onError: onFail,
        }
      );
    } else {
      // Only update metadata
      updateReport(
        {
          id: report._id,
          data: {
            title: formData.title.trim(),
            category: formData.category,
            description: formData.description.trim(),
            reportDate: formData.reportDate,
            isVisibleToPatient: formData.isVisibleToPatient,
            notes: formData.notes.trim(),
          },
        },
        { onSuccess: onDone, onError: onFail }
      );
    }
  };

  const handleClose = () => {
    if (!isBusy) {
      setNewFile(null);
      onClose();
    }
  };

  const currentFile = report?.file;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ className: "rounded-xl" }}
    >
      <DialogTitle className="bg-linear-to-r from-teal-600 to-teal-700 text-white">
        <Box className="flex items-center justify-between">
          <Box className="flex items-center gap-2">
            <EditIcon />
            <Typography variant="h6" component="span" className="font-bold">
              Edit Report
            </Typography>
          </Box>
          <IconButton onClick={handleClose} disabled={isBusy}>
            <CloseIcon className="text-white" />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent className="p-6 mt-4">
        {/* Patient info (read-only) */}
        {report?.patient && (
          <Box className="mb-4 p-3 bg-gray-50 rounded-lg">
            <Typography variant="caption" color="text.secondary">
              Patient
            </Typography>
            <Typography variant="body2" className="font-medium">
              {report.patient.name} ({report.patient.phone})
            </Typography>
          </Box>
        )}

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Report Title *"
              value={formData.title}
              onChange={handleChange("title")}
              size="small"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              select
              fullWidth
              label="Category *"
              value={formData.category}
              onChange={handleChange("category")}
              size="small"
            >
              {reportCategories.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Report Date"
              type="date"
              value={formData.reportDate}
              onChange={handleChange("reportDate")}
              size="small"
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isVisibleToPatient}
                  onChange={handleSwitchChange("isVisibleToPatient")}
                  color="success"
                />
              }
              label="Visible to patient"
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={handleChange("description")}
              multiline
              rows={2}
              size="small"
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Notes (Internal)"
              value={formData.notes}
              onChange={handleChange("notes")}
              multiline
              rows={2}
              size="small"
            />
          </Grid>

          {/* Current File & Replace */}
          <Grid size={{ xs: 12 }}>
            <Typography
              variant="subtitle2"
              className="font-semibold text-gray-700 mb-2"
            >
              Report File
            </Typography>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileSelect}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Show current file if no new file selected */}
            {!newFile && currentFile?.url && (
              <Paper variant="outlined" className="p-4 bg-gray-50">
                <Box className="flex items-center justify-between">
                  <Box className="flex items-center gap-3">
                    {currentFile.fileType?.includes("pdf") ? (
                      <PictureAsPdfIcon
                        className="text-red-500"
                        sx={{ fontSize: 40 }}
                      />
                    ) : currentFile.fileType?.includes("image") ? (
                      <ImageIcon
                        className="text-blue-500"
                        sx={{ fontSize: 40 }}
                      />
                    ) : (
                      <DescriptionIcon
                        className="text-gray-500"
                        sx={{ fontSize: 40 }}
                      />
                    )}
                    <Box>
                      <Typography
                        variant="body2"
                        className="font-medium text-gray-800"
                      >
                        {currentFile.originalName || "Current File"}
                      </Typography>
                      <Typography variant="caption" className="text-gray-500">
                        {formatFileSize(currentFile.fileSize)} |{" "}
                        {currentFile.fileType || "Unknown type"}
                      </Typography>
                    </Box>
                  </Box>
                  <Box className="flex items-center gap-2">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<SwapHorizIcon />}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Choose File
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<PhotoCameraIcon />}
                      onClick={() => cameraInputRef.current?.click()}
                    >
                      Take Photo
                    </Button>
                  </Box>
                </Box>
              </Paper>
            )}

            {/* Show new file selected for replacement */}
            {newFile && (
              <Paper variant="outlined" className="p-4 bg-teal-50 border-teal-200">
                <Box className="flex items-center justify-between">
                  <Box className="flex items-center gap-3">
                    <CloudUploadIcon
                      className="text-teal-600"
                      sx={{ fontSize: 40 }}
                    />
                    <Box>
                      <Typography
                        variant="body2"
                        className="font-medium text-gray-800"
                      >
                        {newFile.name}
                      </Typography>
                      <Typography variant="caption" className="text-gray-500">
                        {formatFileSize(newFile.size)} | {newFile.type}
                      </Typography>
                      <Typography
                        variant="caption"
                        className="block text-teal-700 font-medium"
                      >
                        New file — will replace current on save
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton
                    onClick={handleRemoveNewFile}
                    size="small"
                    className="text-red-500"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Paper>
            )}

            {/* No file at all */}
            {!newFile && !currentFile?.url && (
              <Paper
                variant="outlined"
                className="p-8 border-2 border-dashed border-gray-300 transition-colors"
              >
                <Box className="flex flex-col items-center gap-2 text-gray-500">
                  <CloudUploadIcon
                    sx={{ fontSize: 48 }}
                    className="text-gray-400"
                  />
                  <Typography variant="body1" className="font-medium">
                    Choose a file or take a photo
                  </Typography>
                  <Typography variant="body2" className="text-gray-400 mb-3">
                    PDF, JPEG, PNG (max 10MB)
                  </Typography>
                  <Box className="flex items-center gap-3">
                    <Button
                      variant="outlined"
                      startIcon={<UploadFileIcon />}
                      onClick={() => fileInputRef.current?.click()}
                      className="border-teal-600 text-teal-700 hover:border-teal-700"
                    >
                      Choose File
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<PhotoCameraIcon />}
                      onClick={() => cameraInputRef.current?.click()}
                      className="border-teal-600 text-teal-700 hover:border-teal-700"
                    >
                      Take Photo
                    </Button>
                  </Box>
                </Box>
              </Paper>
            )}
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions className="p-4 bg-gray-50">
        <Button onClick={handleClose} color="inherit" disabled={isBusy}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isBusy}
          className="bg-teal-600 hover:bg-teal-700"
          startIcon={
            isBusy ? <CircularProgress size={16} /> : <EditIcon />
          }
        >
          {isReplacingFile
            ? "Uploading File..."
            : isUpdating
              ? "Saving..."
              : "Save Changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditReportModal;

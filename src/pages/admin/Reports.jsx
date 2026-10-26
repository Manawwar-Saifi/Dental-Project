/**
 * Admin Reports Page
 */
import React, { useState } from "react";
import { toast } from "react-toastify";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import {
  Box,
  Typography,
  Button,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import DataTable from "../../components/common/DataTable";
import { useReports, useReportMutations } from "../../hooks/admin/useReports";
import AddReportModal from "../../components/admin/modals/AddReportModal";
import EditReportModal from "../../components/admin/modals/EditReportModal";
import PatientDetailModal from "../../components/admin/modals/PatientDetailModal";
import ReportPreviewModal from "../../components/shared/ReportPreviewModal";

/**
 * Table columns
 */
const columns = (onEdit, onDelete, onViewPatient) => [
  {
    field: "reportNumber",
    headerName: "Report #",
    minWidth: 130,
    render: (value) => (
      <Typography variant="body2" className="font-mono font-medium">
        {value || "-"}
      </Typography>
    ),
  },
  {
    field: "title",
    headerName: "Title",
    minWidth: 180,
    render: (value) => (
      <Typography
        variant="body2"
        className="font-medium truncate max-w-[200px]"
      >
        {value || "-"}
      </Typography>
    ),
  },
  {
    field: "category",
    headerName: "Category",
    minWidth: 120,
    render: (value) => {
      const labels = {
        xray: "X-Ray",
        opg: "OPG",
        cbct: "CBCT",
        lab_report: "Lab Report",
        prescription: "Prescription",
        treatment_plan: "Treatment Plan",
        consent_form: "Consent Form",
        other: "Other",
      };
      return (
        <Chip
          label={labels[value] || value || "-"}
          size="small"
          variant="outlined"
        />
      );
    },
  },
  {
    field: "patient",
    headerName: "Patient",
    minWidth: 160,
    render: (value) => (
      <Box
        className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 rounded-lg p-1 -m-1 transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          if (value?._id) onViewPatient(value);
        }}
      >
        <Avatar sx={{ width: 32, height: 32 }} className="bg-indigo-100 text-indigo-600">
          {value?.name?.[0]?.toUpperCase() || "P"}
        </Avatar>
        <Typography variant="body2" className="text-indigo-600 hover:underline">
          {value?.name || "Unknown"}
        </Typography>
      </Box>
    ),
  },
  {
    field: "reportDate",
    headerName: "Report Date",
    minWidth: 120,
    type: "date",
  },
  {
    field: "file",
    headerName: "File",
    minWidth: 90,
    // Multi-file reports store data in files[] -- the legacy singular
    // `file` field is a Mongoose-default-populated placeholder object
    // ({ fileType: "application/pdf" }) with no url, always truthy but
    // never useful. Read files[] first, fall back to `file` only for
    // reports genuinely created before multi-file support existed.
    //
    // No per-row tap target here anymore -- a tiny Download/View icon was
    // hard to tap accurately on mobile. Tapping ANYWHERE on the row now
    // opens the full-screen ReportPreviewModal (large Back/Download
    // buttons); this cell is just a quick visual indicator of file count.
    render: (value, row) => {
      const reportFiles = row.files?.length > 0 ? row.files : value?.url ? [value] : [];
      if (reportFiles.length === 0) return <Typography variant="caption" color="text.disabled">-</Typography>;
      return (
        <Typography variant="caption" color="text.secondary">
          {reportFiles.length > 1 ? `${reportFiles.length} files` : "1 file"}
        </Typography>
      );
    },
  },
  {
    field: "_actions",
    headerName: "Actions",
    minWidth: 90,
    render: (_, row) => {
      return (
      <Box className="flex gap-1">
        <Tooltip title="Edit">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(row);
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton
            size="small"
            color="error"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(row);
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      );
    },
  },
  {
    field: "createdAt",
    headerName: "Created",
    minWidth: 110,
    type: "date",
  },
];

const Reports = () => {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({});
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [patientModalOpen, setPatientModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [previewReport, setPreviewReport] = useState(null);

  const { data, isLoading, refetch } = useReports({
    search,
    ...filters,
  });
  const { deleteReport } = useReportMutations();

  const reports = data?.data || [];

  const handleEdit = (report) => {
    setSelectedReport(report);
    setEditModalOpen(true);
  };

  const handleDelete = (report) => {
    setConfirmDelete(report);
  };

  const handleViewPatient = (patient) => {
    setSelectedPatient(patient);
    setPatientModalOpen(true);
  };

  return (
    <Box>
      <Box className="flex justify-between items-center mb-6">
        <Box>
          <Typography variant="h4" className="font-bold">
            Reports
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage patient reports and documents
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setAddModalOpen(true)}
        >
          Upload Report
        </Button>
      </Box>

      <DataTable
        columns={columns(handleEdit, handleDelete, handleViewPatient)}
        data={reports}
        loading={isLoading}
        searchPlaceholder="Search by report number, title or patient..."
        onSearch={setSearch}
        onRefresh={refetch}
        onRowClick={setPreviewReport}
        emptyMessage="No reports found"
      />

      <ReportPreviewModal
        open={!!previewReport}
        onClose={() => setPreviewReport(null)}
        report={previewReport}
      />

      <AddReportModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={refetch}
      />

      <EditReportModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedReport(null);
        }}
        report={selectedReport}
        onSuccess={refetch}
      />

      <PatientDetailModal
        open={patientModalOpen}
        onClose={() => {
          setPatientModalOpen(false);
          setSelectedPatient(null);
        }}
        patient={selectedPatient}
      />
      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          deleteReport(confirmDelete._id, {
            onSuccess: () => {
              toast.success("Report deleted successfully");
              setConfirmDelete(null);
              refetch();
            },
            onError: (err) => toast.error(err.response?.data?.message || "Delete failed"),
          });
        }}
        title="Delete Report"
        message={`Are you sure you want to delete "${confirmDelete?.title || ""}"? This action cannot be undone.`}
        confirmText="Delete"
      />
    </Box>
  );
};

export default Reports;

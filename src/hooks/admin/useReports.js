/**
 * Admin Reports Hook (React Query)
 *
 * Custom hook for managing reports data.
 *
 * Features:
 * - Fetch reports with pagination
 * - Upload, update, delete reports
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getReports,
  getReport,
  uploadReport,
  updateReport,
  deleteReport,
  replaceReportFile,
} from "../../api/admin/reports.api";

/**
 * Query key factory
 */
const reportKeys = {
  all: ["admin", "reports"],
  list: (params) => [...reportKeys.all, "list", params],
  detail: (id) => [...reportKeys.all, "detail", id],
};

/**
 * Hook for fetching reports list
 * @param {Object} params - Query parameters (page, limit, search, etc.)
 */
export const useReports = (params = {}) => {
  return useQuery({
    queryKey: reportKeys.list(params),
    queryFn: () => getReports(params),
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Hook for fetching single report
 * @param {string} id - Report ID
 */
export const useReport = (id) => {
  return useQuery({
    queryKey: reportKeys.detail(id),
    queryFn: () => getReport(id),
    enabled: !!id,
  });
};

/**
 * Hook for report mutations (upload, update, delete)
 */
export const useReportMutations = () => {
  const queryClient = useQueryClient();

  const invalidateReports = () => {
    queryClient.invalidateQueries({ queryKey: reportKeys.all });
  };

  const upload = useMutation({
    mutationFn: uploadReport,
    onSuccess: invalidateReports,
  });

  const update = useMutation({
    mutationFn: ({ id, data }) => updateReport(id, data),
    onSuccess: invalidateReports,
  });

  const remove = useMutation({
    mutationFn: deleteReport,
    onSuccess: invalidateReports,
  });

  const replaceFile = useMutation({
    mutationFn: ({ id, formData }) => replaceReportFile(id, formData),
    onSuccess: invalidateReports,
  });

  return {
    uploadReport: upload.mutate,
    updateReport: update.mutate,
    deleteReport: remove.mutate,
    replaceFile: replaceFile.mutate,
    isUploading: upload.isPending,
    isUpdating: update.isPending,
    isDeleting: remove.isPending,
    isReplacingFile: replaceFile.isPending,
  };
};

export default useReports;
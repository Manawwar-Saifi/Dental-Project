/**
 * Admin Blogs Hook (React Query)
 *
 * Custom hook for managing blog post data.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllBlogs,
  getBlogById,
  getBlogStats,
  createBlog,
  updateBlog,
  deleteBlog,
  publishBlog,
  unpublishBlog,
} from "../../api/admin/blogs.api";

/**
 * Hook for fetching blogs list
 * @param {Object} params - Query parameters (page, limit, status, search)
 */
export const useBlogs = (params = {}) => {
  return useQuery({
    queryKey: ["admin", "blogs", params],
    queryFn: () => getAllBlogs(params),
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Hook for fetching a single blog
 * @param {string} id - Blog ID
 */
export const useBlog = (id) => {
  return useQuery({
    queryKey: ["admin", "blogs", id],
    queryFn: () => getBlogById(id),
    enabled: !!id,
  });
};

/**
 * Hook for fetching blog stats (dashboard widget)
 */
export const useBlogStats = () => {
  return useQuery({
    queryKey: ["admin", "blogs", "stats"],
    queryFn: getBlogStats,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook for blog mutations (create, update, delete, publish, unpublish)
 */
export const useBlogMutations = () => {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "blogs"] });
  };

  const create = useMutation({
    mutationFn: createBlog,
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, data }) => updateBlog(id, data),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: deleteBlog,
    onSuccess: invalidate,
  });

  const publish = useMutation({
    mutationFn: publishBlog,
    onSuccess: invalidate,
  });

  const unpublish = useMutation({
    mutationFn: unpublishBlog,
    onSuccess: invalidate,
  });

  return {
    createBlog: create.mutate,
    createBlogAsync: create.mutateAsync,
    isCreating: create.isPending,
    createError: create.error,

    updateBlog: update.mutate,
    updateBlogAsync: update.mutateAsync,
    isUpdating: update.isPending,
    updateError: update.error,

    deleteBlog: remove.mutate,
    isDeleting: remove.isPending,

    publishBlog: publish.mutate,
    isPublishing: publish.isPending,

    unpublishBlog: unpublish.mutate,
    isUnpublishing: unpublish.isPending,
  };
};

export default useBlogs;

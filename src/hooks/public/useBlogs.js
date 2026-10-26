/**
 * Public Blog Hooks (React Query)
 *
 * Custom hooks for public-facing blog data.
 */
import { useQuery } from "@tanstack/react-query";
import { getRelatedBlogs } from "../../api/blogs.api";

/**
 * Hook for fetching related blog posts for a given post ID.
 * @param {string} id - Blog post MongoDB _id
 */
export const useRelatedBlogs = (id) => {
  return useQuery({
    queryKey: ["public", "blogs", "related-by-id", id],
    queryFn: () => getRelatedBlogs(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

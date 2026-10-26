/**
 * BlogPreviewModal
 *
 * Full-screen MUI Dialog that renders the current formData as it will appear
 * on the public BlogDetailPage. Uses the same CSS classes as the public page
 * so rendering stays in sync without an extra abstraction layer.
 *
 * Props:
 *   open       — boolean, controls dialog visibility
 *   onClose    — callback to close without resetting formData
 *   formData   — BlogEditor's current formData state (live, not a saved snapshot)
 *   status     — current publish status string
 */
import { Dialog, DialogContent, DialogTitle, IconButton, Chip, Box, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import BlogFaqSection from "../../public/BlogFaqSection";
import BlogTocSection, { buildToc, injectHeadingIds } from "../../public/BlogTocSection";

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })
    : "";

export default function BlogPreviewModal({ open, onClose, formData, status }) {
  const today = new Date().toISOString();

  // Build a preview-friendly blog object from formData
  const previewBlog = {
    title: formData.title || "Untitled Post",
    coverImage: formData.coverImage || "",
    coverImageAlt: formData.coverImageAlt || formData.title || "",
    content: formData.content || "",
    category: formData.category || "General",
    publishedAt: today,
    readTimeMinutes: (() => {
      const text = String(formData.content || "").replace(/<[^>]*>/g, " ");
      const words = text.trim().split(/\s+/).filter(Boolean);
      return Math.max(1, Math.ceil(words.length / 200));
    })(),
  };

  // Inject id attributes into <h2> tags so TOC anchor links have targets in
  // the modal's scroll container. Mirrors BlogDetailPage's render-time logic.
  const previewToc = buildToc(previewBlog.content);
  const renderedContent = previewToc.length >= 3
    ? injectHeadingIds(previewBlog.content, previewToc)
    : previewBlog.content;

  return (
    <Dialog open={open} onClose={onClose} fullScreen>
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 3,
          py: 1.5,
          borderBottom: "1px solid",
          borderColor: "divider",
          bgcolor: "#f9fafb",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            Preview
          </Typography>
          <Chip
            size="small"
            label={status === "published" ? "Published" : status === "scheduled" ? "Scheduled" : "Draft"}
            color={status === "published" ? "success" : status === "scheduled" ? "warning" : "default"}
          />
          <Typography variant="caption" color="text.secondary">
            This is how your post will look to readers.
          </Typography>
        </Box>
        <IconButton onClick={onClose} edge="end" aria-label="close preview">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, overflowX: "hidden" }}>
        {/* Cover image hero */}
        {previewBlog.coverImage && (
          <div className="w-full max-h-[280px] md:max-h-[400px] lg:max-h-[480px] max-w-5xl mx-auto overflow-hidden bg-gray-100">
            <img
              src={previewBlog.coverImage}
              alt={previewBlog.coverImageAlt}
              className="w-full max-h-[280px] md:max-h-[400px] lg:max-h-[480px] object-cover"
            />
          </div>
        )}

        <section className="py-12 bg-white">
          <div className="max-w-3xl mx-auto px-4">
            <h1 className="text-[#003366] font-extrabold text-3xl md:text-4xl leading-tight mb-4">
              {previewBlog.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-gray-500 text-sm mb-4">
              <span className="flex items-center gap-1.5">
                <CalendarTodayIcon sx={{ fontSize: 16 }} />
                {formatDate(previewBlog.publishedAt)}
              </span>
              <span className="flex items-center gap-1.5">
                <AccessTimeIcon sx={{ fontSize: 16 }} />
                {previewBlog.readTimeMinutes} min read
              </span>
            </div>

            {previewBlog.category && (
              <div className="flex flex-wrap gap-1.5 mb-6">
                <Chip
                  size="small"
                  label={previewBlog.category}
                  className="bg-[#e8f4fd] text-[#006694]"
                />
              </div>
            )}

            {/* Table of Contents — mirrors BlogDetailPage; scrollIntoView works
                inside the modal's DialogContent scroll container */}
            <BlogTocSection content={previewBlog.content} />

            {/* Blog content — same CSS class block as BlogDetailPage.
                renderedContent has id attributes on <h2> tags so TOC anchors
                have targets for document.getElementById to find. */}
            <div
              className="blog-content max-w-none text-gray-700 text-base leading-[1.8]
                [&_h2]:text-[#003366] [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-4
                [&_h3]:text-[#003366] [&_h3]:text-xl [&_h3]:font-bold [&_h3]:mt-6 [&_h3]:mb-3
                [&_p]:mb-4
                [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:space-y-1
                [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_ol]:space-y-1
                [&_a]:text-accent [&_a]:underline
                [&_strong]:font-semibold [&_strong]:text-[#003366]
                [&_img]:rounded-xl [&_img]:my-6 [&_img]:w-full"
              dangerouslySetInnerHTML={{ __html: renderedContent }}
            />

            {/* FAQ Accordion — mirrors the published BlogDetailPage layout */}
            <BlogFaqSection faqs={formData.faqs} />
          </div>
        </section>
      </DialogContent>
    </Dialog>
  );
}

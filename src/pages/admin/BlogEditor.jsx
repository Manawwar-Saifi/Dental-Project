/**
 * Admin Blog Create/Edit Page
 *
 * Handles both /admin/blogs/new (create) and /admin/blogs/:id/edit (edit) —
 * presence of the :id route param determines the mode.
 */
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Typography,
  TextField,
  Button,
  Chip,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  ListSubheader,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloseIcon from "@mui/icons-material/Close";
import ImageIcon from "@mui/icons-material/Image";
import VisibilityIcon from "@mui/icons-material/Visibility";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PreviewIcon from "@mui/icons-material/Visibility";
import { toast } from "react-toastify";
import RichTextEditor from "../../components/admin/blog/RichTextEditor";
import BlogPreviewModal from "../../components/admin/blog/BlogPreviewModal";
import { useBlog, useBlogMutations } from "../../hooks/admin/useBlogs";
import { uploadBlogImage, getDistinctAuthorNames } from "../../api/admin/blogs.api";
import { getBlogAuthors } from "../../api/admin/users.api";
import StyledTextField from "../../components/admin/shared/StyledTextField";
import { useAdminStore } from "../../store/admin.store";
import FocusKeywordAnalysis from "../../components/admin/blog/FocusKeywordAnalysis";
import FaqEditor from "../../components/admin/blog/FaqEditor";

const slugify = (title) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 100);

const BLOG_CATEGORIES = ["Oral Hygiene", "Treatments", "Patient Stories", "General"];

const WORDS_PER_MINUTE = 200;

/** Client-side mirror of the server's read-time formula (blog.controller.js
 * computeReadTime) -- strip HTML tags, count words, divide by 200wpm, round
 * up. Purely a live UI estimate; the value actually stored comes from the
 * server on save. */
const estimateReadTime = (html = "") => {
  const text = String(html || "").replace(/<[^>]*>/g, " ");
  const words = text.trim().split(/\s+/).filter(Boolean);
  return Math.max(1, Math.ceil(words.length / WORDS_PER_MINUTE));
};

/** Converts an ISO date string to the local "YYYY-MM-DDTHH:mm" value a
 * datetime-local input expects (accounting for timezone offset). */
const toLocalInputValue = (isoString) => {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return "";
  const offsetMs = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offsetMs).toISOString().slice(0, 16);
};

const getInitialFormState = () => ({
  title: "",
  slug: "",
  excerpt: "",
  coverImage: "",
  coverImageAlt: "",
  content: "",
  tags: "",
  seoTitle: "",
  seoDescription: "",
  canonicalUrl: "",
  ogImage: "",
  ogTitle: "",
  ogDescription: "",
  category: "General",
  scheduledPublishAt: "",
  author: "",
  authorName: "",
  focusKeyword: "",
  faqs: [],
});

const BlogEditor = () => {
  const { id } = useParams();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const coverInputRef = useRef(null);
  const ogImageInputRef = useRef(null);

  // Logged-in admin — used to default the author field on new posts
  const loggedInAdmin = useAdminStore((s) => s.admin);

  const { data, isLoading } = useBlog(id);
  const {
    createBlogAsync,
    updateBlogAsync,
    isCreating,
    isUpdating,
  } = useBlogMutations();

  // Fetch selectable blog authors
  const { data: authorsData } = useQuery({
    queryKey: ["blog-authors"],
    queryFn: getBlogAuthors,
    staleTime: 5 * 60 * 1000,
  });
  const authors = authorsData?.data?.authors || [];

  // Previously typed custom author names (derived from existing posts — no extra collection)
  const { data: authorNamesData } = useQuery({
    queryKey: ["blog-author-names"],
    queryFn: getDistinctAuthorNames,
    staleTime: 5 * 60 * 1000,
  });
  const customAuthorNames = authorNamesData?.data?.names || [];

  const [formData, setFormData] = useState(getInitialFormState());
  const [status, setStatus] = useState("draft");
  const [slugTouched, setSlugTouched] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingOgImage, setIsUploadingOgImage] = useState(false);
  const [errors, setErrors] = useState({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const [otherAuthorOpen, setOtherAuthorOpen] = useState(false);
  const [otherAuthorInput, setOtherAuthorInput] = useState("");

  const blogViews = data?.data?.blog?.views || 0;

  // Pre-fill form when editing an existing blog
  useEffect(() => {
    const blog = data?.data?.blog;
    if (blog) {
      setFormData({
        title: blog.title || "",
        slug: blog.slug || "",
        excerpt: blog.excerpt || "",
        coverImage: blog.coverImage || "",
        coverImageAlt: blog.coverImageAlt || "",
        content: blog.content || "",
        tags: (blog.tags || []).join(", "),
        seoTitle: blog.seoTitle || "",
        seoDescription: blog.seoDescription || "",
        canonicalUrl: blog.canonicalUrl || "",
        ogImage: blog.ogImage || "",
        ogTitle: blog.ogTitle || "",
        ogDescription: blog.ogDescription || "",
        category: blog.category || "General",
        scheduledPublishAt: toLocalInputValue(blog.scheduledPublishAt),
        // author is an ObjectId ref — API returns populated { _id, name };
        // store the _id string so it matches the <Select> values
        author: blog.author?._id || blog.author || "",
        authorName: blog.authorName || "",
        focusKeyword: blog.focusKeyword || "",
        faqs: blog.faqs || [],
      });
      setStatus(blog.status || "draft");
      setSlugTouched(true);
    }
  }, [data]);

  // For new posts: default author to the logged-in user once their ID is known
  useEffect(() => {
    if (!isEditMode && loggedInAdmin?._id && !formData.author) {
      setFormData((prev) => ({ ...prev, author: loggedInAdmin._id }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedInAdmin, isEditMode]);

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));

    if (field === "title" && !slugTouched) {
      setFormData((prev) => ({ ...prev, title: value, slug: slugify(value) }));
    }
  };

  const handleSlugChange = (e) => {
    setSlugTouched(true);
    setFormData((prev) => ({ ...prev, slug: e.target.value }));
  };

  // All custom names to show: previously typed (from API) + current formData (for unsaved posts)
  const allCustomNames = [...new Set([...customAuthorNames, formData.authorName].filter(Boolean))];
  // Select value: custom name takes priority over staff ObjectId for display
  const authorSelectValue = formData.authorName || formData.author || "";

  const handleAuthorSelectChange = (e) => {
    const val = e.target.value;
    if (val === "__other__") {
      setOtherAuthorInput(formData.authorName || "");
      setOtherAuthorOpen(true);
      return;
    }
    // 24-char hex → MongoDB ObjectId → staff user
    if (/^[0-9a-f]{24}$/i.test(val)) {
      setFormData((prev) => ({ ...prev, author: val, authorName: "" }));
    } else {
      // Previously typed custom name selected from dropdown
      setFormData((prev) => ({ ...prev, authorName: val }));
    }
  };

  const handleOtherAuthorSave = () => {
    const name = otherAuthorInput.trim();
    if (!name) return;
    setFormData((prev) => ({ ...prev, authorName: name }));
    setOtherAuthorOpen(false);
  };

  const handleOtherAuthorCancel = () => {
    setOtherAuthorOpen(false);
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingCover(true);
    try {
      const result = await uploadBlogImage(file);
      const url = result?.data?.url || result?.url;
      if (url) {
        setFormData((prev) => ({ ...prev, coverImage: url }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Cover image upload failed");
    } finally {
      setIsUploadingCover(false);
      e.target.value = "";
    }
  };

  const handleOgImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingOgImage(true);
    try {
      const result = await uploadBlogImage(file);
      const url = result?.data?.url || result?.url;
      if (url) {
        setFormData((prev) => ({ ...prev, ogImage: url }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "OG image upload failed");
    } finally {
      setIsUploadingOgImage(false);
      e.target.value = "";
    }
  };

  const validate = (targetStatus) => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Please add a title";
    // Strip HTML tags before the empty check — Tiptap emits "<p></p>" for a
    // blank editor, which is non-empty as a string but has no real content.
    if (!(formData.content || "").replace(/<[^>]*>/g, "").trim())
      newErrors.content = "Please add some content";
    if (targetStatus === "scheduled" && !formData.scheduledPublishAt) {
      newErrors.scheduledPublishAt = "Please select a date and time";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildPayload = (targetStatus) => ({
    title: formData.title.trim(),
    ...(formData.slug.trim() ? { slug: formData.slug.trim() } : {}),
    excerpt: formData.excerpt,
    coverImage: formData.coverImage || null,
    coverImageAlt: formData.coverImageAlt,
    content: formData.content,
    tags: formData.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    seoTitle: formData.seoTitle,
    seoDescription: formData.seoDescription,
    canonicalUrl: formData.canonicalUrl,
    ogImage: formData.ogImage,
    ogTitle: formData.ogTitle,
    ogDescription: formData.ogDescription,
    category: formData.category,
    scheduledPublishAt:
      targetStatus === "scheduled" && formData.scheduledPublishAt
        ? new Date(formData.scheduledPublishAt).toISOString()
        : null,
    status: targetStatus,
    author: formData.author || undefined,
    authorName: formData.authorName || "",
    focusKeyword: formData.focusKeyword,
    faqs: formData.faqs,
  });

  const handleSave = async (targetStatus) => {
    if (!validate(targetStatus)) {
      const parts = [];
      if (!formData.title.trim()) parts.push("a title");
      if (!(formData.content || "").replace(/<[^>]*>/g, "").trim()) parts.push("some content");
      const needsDate = targetStatus === "scheduled" && !formData.scheduledPublishAt;
      if (parts.length > 0 && needsDate) {
        const joined = parts.join(" and ");
        toast.info(`Please add ${joined} and select a publish date before saving.`);
      } else if (parts.length > 0) {
        const joined =
          parts.length === 1
            ? parts[0]
            : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
        toast.info(`Please add ${joined} before saving.`);
      } else if (needsDate) {
        toast.info("Please select a publish date and time before scheduling.");
      }
      return;
    }

    const payload = buildPayload(targetStatus);

    try {
      if (isEditMode) {
        await updateBlogAsync({ id, data: payload });
      } else {
        await createBlogAsync(payload);
      }
      const successMessage =
        targetStatus === "published"
          ? "Blog published successfully"
          : targetStatus === "scheduled"
            ? "Blog scheduled successfully"
            : "Blog saved as draft";
      toast.success(successMessage);
      navigate("/admin/blogs");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save blog");
    }
  };

  const isSaving = isCreating || isUpdating;

  if (isEditMode && isLoading) {
    return (
      <Box className="flex justify-center py-20">
        <CircularProgress sx={{ color: "#f57c00" }} />
      </Box>
    );
  }

  // Count images missing alt text for the SEO nudge
  const allImgTags = formData.content.match(/<img[^>]*>/g) || [];
  const missingAltCount = allImgTags.filter((tag) => !/alt="[^"]+"/i.test(tag)).length;

  return (
    <Box>
      {/* Preview Modal */}
      <BlogPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        formData={formData}
        status={status}
      />

      {/* Header — sticky bar with title on the left and action buttons on the right */}
      <Box
        sx={{
          position: "sticky",
          top: "64px",
          zIndex: 100,
          backgroundColor: "background.paper",
          borderBottom: "1px solid",
          borderColor: "divider",
          py: 1.5,
          px: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 3,
        }}
      >
        <Box className="flex items-center gap-3">
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/admin/blogs")}
            className="text-gray-600"
          >
            Back
          </Button>
          <Box className="flex items-center gap-3">
            <Typography variant="h5" className="font-bold text-gray-800">
              {isEditMode ? "Edit Blog Post" : "New Blog Post"}
            </Typography>
            <Chip
              size="small"
              label={
                status === "published" ? "Published" : status === "scheduled" ? "Scheduled" : "Draft"
              }
              color={
                status === "published" ? "success" : status === "scheduled" ? "warning" : "default"
              }
            />
            {isEditMode && (
              <Chip
                size="small"
                variant="outlined"
                icon={<VisibilityIcon fontSize="small" />}
                label={`${blogViews.toLocaleString("en-IN")} views`}
                className="text-gray-600"
              />
            )}
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <Button onClick={() => navigate("/admin/blogs")} color="inherit" disabled={isSaving}>
            Cancel
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => setPreviewOpen(true)}
            startIcon={<PreviewIcon />}
            disabled={isSaving}
          >
            Preview
          </Button>
          <Button
            variant="outlined"
            onClick={() => handleSave("draft")}
            disabled={isSaving}
            startIcon={isSaving ? <CircularProgress size={16} /> : null}
          >
            Save as Draft
          </Button>
          {status === "scheduled" ? (
            <Button
              variant="contained"
              onClick={() => handleSave("scheduled")}
              disabled={isSaving}
              className="bg-accent hover:bg-accent-dark"
              startIcon={isSaving ? <CircularProgress size={16} /> : null}
            >
              Schedule
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={() => handleSave("published")}
              disabled={isSaving}
              className="bg-accent hover:bg-accent-dark"
              startIcon={isSaving ? <CircularProgress size={16} /> : null}
            >
              Publish
            </Button>
          )}
        </Box>
      </Box>

      <Box className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-6">

        {/* ── Left column ── */}
        <Box className="lg:col-span-2 space-y-4">

          {/* Card: Title + Slug + Excerpt */}
          <Paper variant="outlined" className="p-4 rounded-xl">
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <TextField
                fullWidth
                label="Title"
                required
                value={formData.title}
                onChange={handleChange("title")}
                error={!!errors.title}
                helperText={errors.title}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                fullWidth
                label="Slug"
                value={formData.slug}
                onChange={handleSlugChange}
                size="small"
                slotProps={{
                  inputLabel: { shrink: true, sx: { color: "#9ca3af" } },
                }}
                helperText={`URL: /blog/${formData.slug || "your-slug-here"}`}
              />
              <TextField
                fullWidth
                label="Excerpt"
                multiline
                rows={2}
                value={formData.excerpt}
                onChange={handleChange("excerpt")}
                inputProps={{ maxLength: 1000 }}
                slotProps={{ inputLabel: { shrink: true } }}
                helperText={`Short summary shown in the blog listing — ${formData.excerpt.length}/1000`}
              />
            </Box>
          </Paper>

          {/* Card: Content editor */}
          <Paper variant="outlined" className="p-4 rounded-xl">
            <Box className="flex items-center justify-between" sx={{ mb: 2.5 }}>
              <Typography variant="subtitle2" className="font-semibold text-gray-700">
                Content{" "}
                {errors.content && (
                  <span className="text-red-600 font-normal">— {errors.content}</span>
                )}
              </Typography>
              <Box className="flex items-center gap-1 text-gray-500">
                <AccessTimeIcon sx={{ fontSize: 15 }} />
                <Typography variant="caption">
                  ~{estimateReadTime(formData.content)} min read
                </Typography>
              </Box>
            </Box>
            <RichTextEditor
              content={formData.content}
              onChange={(html) => {
                setFormData((prev) => ({ ...prev, content: html }));
                if (errors.content) setErrors((prev) => ({ ...prev, content: "" }));
              }}
            />
          </Paper>

          {/* FAQs card */}
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              FAQs
            </Typography>
            <FaqEditor
              faqs={formData.faqs}
              onChange={(faqs) => setFormData((prev) => ({ ...prev, faqs }))}
            />
          </Paper>
        </Box>

        {/* ── Right sidebar ── */}
        <Box className="space-y-4">

          {/* Cover Image */}
          <Paper variant="outlined" className="p-4 rounded-xl">
            <Typography variant="subtitle2" className="font-semibold text-gray-700 mb-3">
              Cover Image
            </Typography>
            {formData.coverImage ? (
              <Box sx={{ mb: 2 }}>
                <img
                  src={formData.coverImage}
                  alt="Cover preview"
                  className="w-full h-40 object-cover rounded-lg border border-gray-200"
                />
                <Button
                  size="small"
                  startIcon={<CloseIcon fontSize="small" />}
                  onClick={() => setFormData((prev) => ({ ...prev, coverImage: "" }))}
                  sx={{ mt: 1, color: "error.main" }}
                >
                  Remove
                </Button>
              </Box>
            ) : (
              <Box
                sx={{
                  height: 64,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px dashed",
                  borderColor: "divider",
                  borderRadius: 1.5,
                  mb: 2,
                  color: "text.disabled",
                }}
              >
                <ImageIcon />
              </Box>
            )}
            <Button
              variant="outlined"
              fullWidth
              disabled={isUploadingCover}
              onClick={() => coverInputRef.current?.click()}
              startIcon={isUploadingCover ? <CircularProgress size={16} /> : <ImageIcon />}
            >
              {isUploadingCover ? "Uploading..." : "Upload Cover Image"}
            </Button>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleCoverUpload}
            />
            <TextField
              fullWidth
              label="Cover Image Alt Text"
              value={formData.coverImageAlt}
              onChange={handleChange("coverImageAlt")}
              size="small"
              slotProps={{ inputLabel: { shrink: true } }}
              placeholder="Describe the image for screen readers"
              helperText="Describe the image for accessibility and Google Images."
              sx={{ mt: 2 }}
            />
          </Paper>

          {/* Organise — Category then Tags */}
          <Paper variant="outlined" className="p-4 rounded-xl">
            <Typography variant="subtitle2" className="font-semibold text-gray-700 mb-3!">
              Organise
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <FormControl fullWidth size="small">
                <InputLabel shrink>Category</InputLabel>
                <Select
                  label="Category"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, category: e.target.value }))
                  }
                  className="text-[12px]!"
                >
                  {BLOG_CATEGORIES.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Tags"
                value={formData.tags}
                onChange={handleChange("tags")}
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
                helperText="Comma-separated, e.g. dental, sonipat, tips"
              />
            </Box>
          </Paper>

          {/* Publishing */}
          <Paper variant="outlined" className="p-4 rounded-xl">
            <Typography variant="subtitle2" className="font-semibold text-gray-700 mb-3!">
              Publishing
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <FormControl fullWidth size="small">
                <InputLabel shrink>Status</InputLabel>
                <Select
                  label="Status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="text-[12px]!"
                >
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="published">Published</MenuItem>
                  <MenuItem value="scheduled">Scheduled</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel shrink>Author</InputLabel>
                <Select
                  label="Author"
                  value={authorSelectValue}
                  onChange={handleAuthorSelectChange}
                  displayEmpty
                >
                  <ListSubheader>Staff</ListSubheader>
                  {authors.map((a) => (
                    <MenuItem key={a._id} value={a._id}>
                      {a.name}
                    </MenuItem>
                  ))}
                  {allCustomNames.length > 0 && (
                    <ListSubheader>Custom Authors</ListSubheader>
                  )}
                  {allCustomNames.map((name) => (
                    <MenuItem key={name} value={name}>
                      {name}
                    </MenuItem>
                  ))}
                  <Divider />
                  <MenuItem value="__other__">
                    <em>Other (type a name)…</em>
                  </MenuItem>
                </Select>
              </FormControl>

              {/* Custom author name dialog */}
              <Dialog
                open={otherAuthorOpen}
                onClose={handleOtherAuthorCancel}
                maxWidth="xs"
                fullWidth
              >
                <DialogTitle>Custom Author Name</DialogTitle>
                <DialogContent sx={{ "&&": { pt: 2.5 } }}>
                  <StyledTextField
                    autoFocus
                    fullWidth
                    size="small"
                    label="Author Name"
                    value={otherAuthorInput}
                    onChange={(e) => setOtherAuthorInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && otherAuthorInput.trim()) {
                        handleOtherAuthorSave();
                      }
                    }}
                  />
                </DialogContent>
                <DialogActions sx={{ px: 2, pb: 2 }}>
                  <Button onClick={handleOtherAuthorCancel} variant="outlined" size="small">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleOtherAuthorSave}
                    variant="contained"
                    size="small"
                    disabled={!otherAuthorInput.trim()}
                  >
                    Save
                  </Button>
                </DialogActions>
              </Dialog>
              {status === "scheduled" && (
                <TextField
                  fullWidth
                  type="datetime-local"
                  label="Publish On"
                  size="small"
                  value={formData.scheduledPublishAt}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      scheduledPublishAt: e.target.value,
                    }));
                    if (errors.scheduledPublishAt) {
                      setErrors((prev) => ({ ...prev, scheduledPublishAt: "" }));
                    }
                  }}
                  error={!!errors.scheduledPublishAt}
                  helperText={
                    errors.scheduledPublishAt ||
                    "Post goes live automatically once this time passes"
                  }
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              )}
            </Box>
          </Paper>

          {/* SEO Settings — collapsible; structured to accept upcoming fields */}
          <Accordion variant="outlined" className="rounded-xl!">
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                px: 2,
                minHeight: "52px !important",
                "& .MuiAccordionSummary-content": { my: 1.5 },
              }}
            >
              <Typography variant="subtitle2" className="font-semibold text-gray-700">
                SEO Settings
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 2, pb: 2.5, pt: 1 }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                <TextField
                  fullWidth
                  label="SEO Title"
                  value={formData.seoTitle}
                  onChange={handleChange("seoTitle")}
                  size="small"
                  inputProps={{ maxLength: 70 }}
                  helperText={`${formData.seoTitle.length}/60 characters${
                    formData.seoTitle.length > 60
                      ? " — may be truncated in search results"
                      : ""
                  }`}
                  slotProps={{
                    inputLabel: { shrink: true },
                    formHelperText: {
                      sx: {
                        color:
                          formData.seoTitle.length > 60 ? "#d32f2f" : "text.secondary",
                      },
                    },
                  }}
                />
                <TextField
                  fullWidth
                  label="SEO Description"
                  multiline
                  rows={3}
                  value={formData.seoDescription}
                  onChange={handleChange("seoDescription")}
                  size="small"
                  inputProps={{ maxLength: 170 }}
                  helperText={`${formData.seoDescription.length}/160 characters${
                    formData.seoDescription.length > 160
                      ? " — may be truncated in search results"
                      : formData.seoDescription.length > 0 &&
                          formData.seoDescription.length < 150
                        ? " — aim for 150-160"
                        : ""
                  }`}
                  slotProps={{
                    inputLabel: { shrink: true },
                    formHelperText: {
                      sx: {
                        color:
                          formData.seoDescription.length > 160
                            ? "#d32f2f"
                            : "text.secondary",
                      },
                    },
                  }}
                />

                <TextField
                  fullWidth
                  label="Canonical URL"
                  value={formData.canonicalUrl}
                  onChange={handleChange("canonicalUrl")}
                  size="small"
                  slotProps={{ inputLabel: { shrink: true } }}
                  placeholder="https://dentalclinic.example.com/blog/your-slug"
                  helperText="Leave blank unless this content is published elsewhere first."
                />

                <TextField
                  fullWidth
                  label="Focus Keyword"
                  value={formData.focusKeyword}
                  onChange={handleChange("focusKeyword")}
                  size="small"
                  slotProps={{ inputLabel: { shrink: true } }}
                  placeholder="e.g. dental implants"
                  helperText="The main phrase this post targets."
                />

                {formData.focusKeyword.trim() && (
                  <FocusKeywordAnalysis
                    keyword={formData.focusKeyword}
                    formData={formData}
                  />
                )}

                {/* Alt-text nudge: warn if any inline images lack meaningful alt */}
                {missingAltCount > 0 && (
                  <Typography variant="caption" color="warning.main" sx={{ display: "block", mb: 1 }}>
                    {missingAltCount} image{missingAltCount > 1 ? "s" : ""} in the content{" "}
                    {missingAltCount > 1 ? "are" : "is"} missing alt text.
                  </Typography>
                )}

                {/* Open Graph (Social Sharing) subsection */}
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mb: 1.5, fontWeight: 600 }}
                  >
                    Open Graph (Social Sharing)
                  </Typography>

                  {formData.ogImage ? (
                    <Box sx={{ mb: 1.5 }}>
                      <img
                        src={formData.ogImage}
                        alt="OG preview"
                        className="w-full h-24 object-cover rounded-lg border border-gray-200"
                      />
                      <Button
                        size="small"
                        startIcon={<CloseIcon fontSize="small" />}
                        onClick={() => setFormData((prev) => ({ ...prev, ogImage: "" }))}
                        sx={{ mt: 0.5, color: "error.main" }}
                      >
                        Remove
                      </Button>
                    </Box>
                  ) : null}

                  <Button
                    variant="outlined"
                    size="small"
                    fullWidth
                    onClick={() => ogImageInputRef.current?.click()}
                    startIcon={isUploadingOgImage ? <CircularProgress size={14} /> : <ImageIcon />}
                    disabled={isUploadingOgImage}
                    sx={{ mb: 2 }}
                  >
                    {isUploadingOgImage ? "Uploading..." : "Upload OG Image"}
                  </Button>
                  <input
                    ref={ogImageInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleOgImageUpload}
                  />

                  <TextField
                    fullWidth
                    label="OG Title"
                    value={formData.ogTitle}
                    onChange={handleChange("ogTitle")}
                    size="small"
                    slotProps={{ inputLabel: { shrink: true } }}
                    helperText="Falls back to SEO title → post title. ~60 chars."
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    fullWidth
                    label="OG Description"
                    multiline
                    rows={2}
                    value={formData.ogDescription}
                    onChange={handleChange("ogDescription")}
                    size="small"
                    slotProps={{ inputLabel: { shrink: true } }}
                    helperText="Falls back to SEO description → excerpt. ~160 chars."
                  />
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>
        </Box>
      </Box>
    </Box>
  );
};

export default BlogEditor;

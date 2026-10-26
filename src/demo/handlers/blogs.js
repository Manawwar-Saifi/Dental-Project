/**
 * /blogs — port of blogs/blog.controller.js (public + admin/blog_editor).
 */
import { all, findById, insert, remove, nowIso } from "../core/db.js";
import { ok, created, fail } from "../core/http.js";
import { where, findWhere, sortBy, populate, populateAll, pick } from "../core/query.js";
import { requirePermission } from "../lib/enquiries-shape.js";

const WORDS_PER_MINUTE = 200;
const OBJECT_ID = /^[0-9a-f]{24}$/i;

const computeReadTime = (html = "") => {
  const text = String(html || "").replace(/<[^>]*>/g, " ");
  const words = text.trim().split(/\s+/).filter(Boolean);
  return Math.max(1, Math.ceil(words.length / WORDS_PER_MINUTE));
};

const publicVisibilityQuery = () => ({
  $or: [{ status: "published" }, { status: "scheduled", scheduledPublishAt: { $lte: new Date() } }],
});

const cleanFaqs = (faqs) =>
  (Array.isArray(faqs) ? faqs : [])
    .filter((f) => (f?.question || "").trim() && (f?.answer || "").replace(/<[^>]*>/g, "").trim())
    .map((f) => ({ question: f.question, answer: f.answer, _id: f._id || newSubId() }));

let subCounter = Math.floor(Math.random() * 0xffff);
const newSubId = () => {
  const seconds = Math.floor(Date.now() / 1000).toString(16).padStart(8, "0");
  let random = "";
  for (let i = 0; i < 12; i++) random += Math.floor(Math.random() * 16).toString(16);
  subCounter = (subCounter + 1) % 0xffff;
  return seconds + random + subCounter.toString(16).padStart(4, "0");
};

const slugify = (title) =>
  String(title)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 100);

/** pre("validate"): fill + de-duplicate the slug. */
const uniqueSlug = (slug, selfId) => {
  const base = String(slug).toLowerCase().trim();
  let candidate = base;
  let counter = 2;
  while (all("Blog").some((b) => b.slug === candidate && String(b._id) !== String(selfId))) {
    candidate = `${base}-${counter}`;
    counter++;
  }
  return candidate;
};

const withAuthor = (doc) => populate(doc, "author", "User", "name");

const toDateOrNull = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

const validId = (id) => OBJECT_ID.test(String(id));

export default function register(r) {
  // ================================================================ public
  r.get("/blogs/public", (req) => {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const matched = where("Blog", publicVisibilityQuery()).map((b) => ({
      ...b,
      effectivePublishedAt: b.publishedAt ?? b.scheduledPublishAt ?? null,
    }));
    const pageItems = sortBy(matched, "-effectivePublishedAt").slice(skip, skip + limitNum);
    const blogs = populateAll(pageItems, "author", "User", "name").map((b) => ({
      ...b,
      publishedAt: b.publishedAt || b.scheduledPublishAt || null,
    }));

    return ok({ blogs, total: matched.length, page: pageNum, limit: limitNum }, "Blogs fetched successfully");
  });

  r.get("/blogs/public/:id/related", (req) => {
    const { id } = req.params;
    if (!validId(id)) return fail(400, "Invalid blog ID");
    const current = findWhere("Blog", { _id: id, ...publicVisibilityQuery() });
    if (!current) return fail(404, "Blog not found");

    const projection = "title slug coverImage coverImageAlt publishedAt readTimeMinutes category";
    const same = sortBy(
      where("Blog", { _id: { $ne: id }, category: current.category, ...publicVisibilityQuery() }),
      "-publishedAt"
    ).slice(0, 3);
    let related = [...same];
    if (related.length < 3) {
      const exclude = [id, ...related.map((p) => String(p._id))];
      const extras = sortBy(where("Blog", { _id: { $nin: exclude }, ...publicVisibilityQuery() }), "-publishedAt").slice(
        0,
        3 - related.length
      );
      related = [...related, ...extras];
    }
    return ok({ blogs: related.map((b) => pick(b, projection)) }, "Related blogs fetched successfully");
  });

  r.get("/blogs/public/:slug", (req) => {
    const blog = findWhere("Blog", { slug: req.params.slug, ...publicVisibilityQuery() });
    if (!blog) return fail(404, "Blog not found");
    blog.views = (blog.views || 0) + 1;
    const out = withAuthor(blog);
    if (!out.publishedAt && out.scheduledPublishAt) out.publishedAt = out.scheduledPublishAt;
    return ok({ blog: out }, "Blog fetched successfully");
  });

  // ================================================================ admin / blog_editor
  r.get("/blogs/stats", (req) => {
    requirePermission(req, "blogs", "view");
    const blogs = all("Blog");
    return ok(
      {
        totalBlogs: blogs.length,
        publishedCount: blogs.filter((b) => b.status === "published").length,
        draftCount: blogs.filter((b) => b.status === "draft").length,
        totalViews: blogs.reduce((sum, b) => sum + (Number(b.views) || 0), 0),
      },
      "Blog stats fetched successfully"
    );
  });

  r.get("/blogs/author-names", (req) => {
    requirePermission(req, "blogs", "view");
    const names = [...new Set(all("Blog").map((b) => b.authorName).filter((n) => n != null && n !== ""))].sort();
    return ok({ names }, "Distinct author names fetched");
  });

  r.get("/blogs", (req) => {
    requirePermission(req, "blogs", "view");
    const { page = 1, limit = 10, status, search, category } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (search) query.title = { $regex: search, $options: "i" };

    const matched = sortBy(where("Blog", query), "-createdAt");
    const blogs = populateAll(matched.slice(skip, skip + limitNum), "author", "User", "name");
    return ok({ blogs, total: matched.length, page: pageNum, limit: limitNum }, "Blogs fetched successfully");
  });

  r.get("/blogs/:id", (req) => {
    requirePermission(req, "blogs", "view");
    const { id } = req.params;
    if (!validId(id)) return fail(400, "Invalid blog ID");
    const blog = findById("Blog", id);
    if (!blog) return fail(404, "Blog not found");
    return ok({ blog: withAuthor(blog) }, "Blog fetched successfully");
  });

  r.post("/blogs/upload-image", (req) => {
    requirePermission(req, "blogs", "edit");
    const image = req.files?.[0];
    if (!image) return fail(400, "Image file is required");
    const url = typeof URL !== "undefined" && URL.createObjectURL ? URL.createObjectURL(image) : "";
    return ok({ url, public_id: `dental-clinic/blogs/demo-${Date.now()}` }, "Image uploaded successfully");
  });

  r.post("/blogs", (req) => {
    const user = requirePermission(req, "blogs", "create");
    const body = req.body || {};
    const { title, slug, content, canonicalUrl, status, scheduledPublishAt } = body;

    if (!title || !content) return fail(400, "Title and content are required");
    if (canonicalUrl && canonicalUrl.trim() !== "" && !/^https?:\/\//i.test(canonicalUrl.trim())) {
      return fail(400, "Canonical URL must be an absolute URL starting with http:// or https://");
    }
    const resolvedStatus = ["published", "scheduled"].includes(status) ? status : "draft";
    if (resolvedStatus === "scheduled" && !scheduledPublishAt) {
      return fail(400, "scheduledPublishAt is required when status is scheduled");
    }
    const category = ["Oral Hygiene", "Treatments", "Patient Stories", "General"].includes(body.category)
      ? body.category
      : "General";

    const saved = insert("Blog", {
      title: String(title).trim(),
      slug: uniqueSlug(slug || slugify(title)),
      excerpt: body.excerpt ?? "",
      content,
      coverImage: body.coverImage ?? null,
      author: String(body.author || user._id),
      authorName: body.authorName ? String(body.authorName).trim() : "",
      status: resolvedStatus,
      scheduledPublishAt: resolvedStatus === "scheduled" ? toDateOrNull(scheduledPublishAt) : null,
      publishedAt: resolvedStatus === "published" ? nowIso() : null,
      views: 0,
      tags: (Array.isArray(body.tags) ? body.tags : []).map((t) => String(t).trim().toLowerCase()),
      seoTitle: body.seoTitle ?? "",
      seoDescription: body.seoDescription ?? "",
      category,
      readTimeMinutes: computeReadTime(content),
      canonicalUrl: canonicalUrl ? canonicalUrl.trim() : "",
      coverImageAlt: body.coverImageAlt || "",
      ogImage: body.ogImage || "",
      ogTitle: body.ogTitle || "",
      ogDescription: body.ogDescription || "",
      focusKeyword: body.focusKeyword || "",
      faqs: cleanFaqs(body.faqs),
      __v: 0,
    });

    return created({ blog: withAuthor(saved) }, "Blog created successfully");
  });

  r.patch("/blogs/:id", (req) => {
    requirePermission(req, "blogs", "edit");
    const { id } = req.params;
    if (!validId(id)) return fail(400, "Invalid blog ID");
    const blog = findById("Blog", id);
    if (!blog) return fail(404, "Blog not found");
    const body = req.body || {};

    if (
      body.canonicalUrl !== undefined &&
      String(body.canonicalUrl).trim() !== "" &&
      !/^https?:\/\//i.test(String(body.canonicalUrl).trim())
    ) {
      return fail(400, "Canonical URL must be an absolute URL starting with http:// or https://");
    }

    const next = { ...blog };
    const allowed = [
      "title", "slug", "excerpt", "content", "coverImage", "coverImageAlt", "tags", "seoTitle",
      "seoDescription", "canonicalUrl", "ogImage", "ogTitle", "ogDescription", "status", "category",
      "scheduledPublishAt", "author", "authorName", "focusKeyword", "faqs",
    ];
    for (const field of allowed) {
      if (body[field] === undefined) continue;
      if (field === "faqs") next.faqs = cleanFaqs(body.faqs);
      else if (field === "tags") next.tags = (Array.isArray(body.tags) ? body.tags : []).map((t) => String(t).trim().toLowerCase());
      else if (field === "scheduledPublishAt") next.scheduledPublishAt = toDateOrNull(body.scheduledPublishAt);
      else next[field] = body[field];
    }

    if (next.status === "scheduled" && !next.scheduledPublishAt) {
      return fail(400, "scheduledPublishAt is required when status is scheduled");
    }
    if (next.status !== "scheduled") next.scheduledPublishAt = null;
    if (next.status !== blog.status && next.status === "published" && !next.publishedAt) {
      next.publishedAt = nowIso();
    }
    if (body.content !== undefined) next.readTimeMinutes = computeReadTime(next.content);
    if (!next.slug && next.title) next.slug = slugify(next.title);
    if (next.slug !== blog.slug) next.slug = uniqueSlug(next.slug, blog._id);
    if (next.author && typeof next.author === "object") next.author = String(next.author._id);

    Object.assign(blog, next, { updatedAt: nowIso() });
    return ok({ blog: withAuthor(blog) }, "Blog updated successfully");
  });

  r.delete("/blogs/:id", (req) => {
    requirePermission(req, "blogs", "delete");
    const { id } = req.params;
    if (!validId(id)) return fail(400, "Invalid blog ID");
    if (!remove("Blog", id)) return fail(404, "Blog not found");
    return ok(null, "Blog deleted successfully");
  });

  r.post("/blogs/:id/publish", (req) => {
    requirePermission(req, "blogs", "edit");
    const { id } = req.params;
    if (!validId(id)) return fail(400, "Invalid blog ID");
    const blog = findById("Blog", id);
    if (!blog) return fail(404, "Blog not found");
    blog.status = "published";
    if (!blog.publishedAt) blog.publishedAt = nowIso();
    blog.updatedAt = nowIso();
    return ok({ blog: withAuthor(blog) }, "Blog published successfully");
  });

  r.post("/blogs/:id/unpublish", (req) => {
    requirePermission(req, "blogs", "edit");
    const { id } = req.params;
    if (!validId(id)) return fail(400, "Invalid blog ID");
    const blog = findById("Blog", id);
    if (!blog) return fail(404, "Blog not found");
    blog.status = "draft";
    blog.updatedAt = nowIso();
    return ok({ blog: withAuthor(blog) }, "Blog unpublished successfully");
  });
}

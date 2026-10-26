/**
 * BlogCard — reusable blog post card for listing and related-posts sections.
 * Used by BlogListPage and BlogDetailPage.
 */
import { Link } from "react-router-dom";

function ordinalSuffix(day) {
  if (day >= 11 && day <= 13) return "th";
  switch (day % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}

const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const day = d.getDate();
  const month = d.toLocaleDateString("en-IN", { month: "short" });
  const year = d.getFullYear();
  return `${day}${ordinalSuffix(day)} ${month} ${year}`;
};

/**
 * @param {Object} blog - Blog post object with title, slug, coverImage,
 *   coverImageAlt, publishedAt, readTimeMinutes fields.
 * @param {"full"|"compact"} variant - "full" for listing page style (taller card),
 *   "compact" for related-posts style (smaller card).
 */
const BlogCard = ({ blog, variant = "full" }) => {
  if (variant === "compact") {
    return (
      <Link
        to={`/blog/${blog.slug}`}
        className="block no-underline rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200"
      >
        {blog.coverImage ? (
          <img
            src={blog.coverImage}
            alt={blog.coverImageAlt || blog.title}
            loading="lazy"
            className="w-full aspect-video object-cover"
          />
        ) : (
          <div className="w-full aspect-video bg-[#e8f4fd]" />
        )}
        <p className="text-[#003366] text-sm font-semibold p-3 leading-snug">
          {blog.title}
        </p>
      </Link>
    );
  }

  // Default "full" variant — matches BlogListPage card style
  return (
    <Link
      to={`/blog/${blog.slug}`}
      className="group flex flex-col h-full rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 no-underline"
    >
      <div className="relative aspect-2/1 w-full overflow-hidden shrink-0">
        {blog.coverImage ? (
          <img
            src={blog.coverImage}
            alt={blog.coverImageAlt || blog.title}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 bg-[#e8f4fd] flex items-center justify-center">
            <span className="text-[#006694] font-bold text-lg">Dental Clinic</span>
          </div>
        )}
      </div>
      <div className="flex flex-col flex-1 p-5 bg-gray-50">
        <h2
          className="text-[#003366] group-hover:text-[#006694] transition-colors duration-200 mb-3 line-clamp-2 leading-snug"
          style={{ fontSize: "1.05rem", fontWeight: 700 }}
        >
          {blog.title}
        </h2>
        <div className="flex-1" />
        <p className="text-gray-400 text-xs">
          {formatDate(blog.publishedAt)}
          {blog.readTimeMinutes ? ` | ${blog.readTimeMinutes} min read` : ""}
        </p>
      </div>
    </Link>
  );
};

export default BlogCard;

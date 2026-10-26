import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Pagination, CircularProgress } from "@mui/material";
import BreadcrumbBanner from "../../components/public/BreadcrumbBanner";
import { getPublicBlogs } from "../../api/blogs.api";

const PAGE_SIZE = 9;

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

const BlogListPage = () => {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["public", "blogs", page],
    queryFn: () => getPublicBlogs({ page, limit: PAGE_SIZE }),
  });

  const blogs = data?.data?.blogs || [];
  const total = data?.data?.total || 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <>
      <title>Dental Health Blog | Dental Clinic, Sonipat</title>
      <meta
        name="description"
        content="Read expert dental health tips, treatment guides, and clinic updates from Dental Clinic in Sonipat. Stay informed about painless dentistry, implants, and more."
      />
      <meta
        name="keywords"
        content="dental blog Sonipat, dental health tips, Dental Clinic blog"
      />
      <link rel="canonical" href="https://dentalclinic.example.com/blog" />
      <meta name="robots" content="index, follow" />
      <meta property="og:title" content="Dental Health Blog | Dental Clinic, Sonipat" />
      <meta
        property="og:description"
        content="Read expert dental health tips, treatment guides, and clinic updates from Dental Clinic in Sonipat."
      />
      <meta property="og:url" content="https://dentalclinic.example.com/blog" />
      <meta
        property="og:image"
        content="https://dentalclinic.example.com/dental-clinic-logo.png"
      />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Dental Health Blog | Dental Clinic, Sonipat" />
      <meta
        name="twitter:description"
        content="Read expert dental health tips, treatment guides, and clinic updates from Dental Clinic in Sonipat."
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Blog",
            "@id": "https://dentalclinic.example.com/blog#blog",
            name: "Dental Clinic Blog",
            url: "https://dentalclinic.example.com/blog",
            publisher: { "@id": "https://dentalclinic.example.com/#organization" },
          }),
        }}
      />

      <BreadcrumbBanner
        title="Our Blog"
        breadcrumbs={[{ label: "Home", path: "/" }, { label: "Blog" }]}
      />

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-center text-gray-500 mb-12 max-w-3xl mx-auto" style={{ fontSize: "1rem" }}>
            Dental health tips, treatment guides, and updates from the Dental Clinic team in
            Sonipat.
          </p>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <CircularProgress sx={{ color: "#f57c00" }} />
            </div>
          ) : blogs.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg">No blog posts yet — check back soon!</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {blogs.map((blog) => (
                  <Link
                    key={blog._id}
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
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center mt-12">
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(_, value) => {
                      setPage(value);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    color="primary"
                  />
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
};

export default BlogListPage;

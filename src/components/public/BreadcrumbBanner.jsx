/**
 * Breadcrumb Banner
 *
 * Hero-style breadcrumb section with background image/gradient,
 * page title, and breadcrumb trail.
 *
 * `title` renders as the page's h1 by default — pass showTitle={false} on
 * pages that already render their own h1 elsewhere, to avoid a duplicate.
 */
import { Box, Container } from "@mui/material";
import { Link } from "react-router-dom";

const BreadcrumbBanner = ({
  backgroundImage,
  title,
  breadcrumbs = [],
  showTitle = true,
}) => {
  const showHeading = Boolean(title) && showTitle;
  const showTrail = breadcrumbs.length > 0;

  if (!showHeading && !showTrail) {
    return (
      <Box
        sx={{
          background: backgroundImage
            ? `linear-gradient(135deg, rgba(0,51,102,0.85), rgba(0,102,148,0.8)), url(${backgroundImage}) center/cover no-repeat`
            : "linear-gradient(135deg, #003366 0%, #006694 50%, #4db8d9 100%)",
          height: "10px",
        }}
      />
    );
  }

  return (
    <Box
      sx={{
        background: backgroundImage
          ? `linear-gradient(135deg, rgba(0,51,102,0.85), rgba(0,102,148,0.8)), url(${backgroundImage}) center/cover no-repeat`
          : "linear-gradient(135deg, #003366 0%, #006694 50%, #4db8d9 100%)",
        py: { xs: 2, md: 2.5 },
      }}
    >
      <Container maxWidth="lg" sx={{ px: { xs: 2, md: 4 } }}>
        {showHeading && (
          <h1
            className="text-white font-bold m-0"
            style={{ fontSize: "clamp(20px, 3vw, 28px)", lineHeight: 1.2 }}
          >
            {title}
          </h1>
        )}
        {showTrail && (
          <nav aria-label="breadcrumb" className={showHeading ? "mt-1" : ""}>
            <ol className="flex flex-wrap items-center gap-1.5 text-white/70 text-[12px] list-none p-0 m-0">
              {breadcrumbs.map((b, i) => (
                <li key={b.label} className="flex items-center gap-1.5">
                  {i > 0 && <span aria-hidden="true">/</span>}
                  {b.path ? (
                    <Link
                      to={b.path}
                      className="text-white/70 hover:text-white no-underline"
                    >
                      {b.label}
                    </Link>
                  ) : (
                    <span className="text-white">{b.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
      </Container>
    </Box>
  );
};

export default BreadcrumbBanner;

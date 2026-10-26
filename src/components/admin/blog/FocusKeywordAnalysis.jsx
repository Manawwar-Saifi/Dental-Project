import { useMemo } from "react";
import { Box, Typography, Chip } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";

function present(bool) {
  return bool
    ? <CheckCircleOutlineIcon fontSize="small" color="success" />
    : <RadioButtonUncheckedIcon fontSize="small" color="disabled" />;
}

export default function FocusKeywordAnalysis({ keyword, formData }) {
  const analysis = useMemo(() => {
    if (!keyword.trim()) return null;
    const kw = keyword.trim().toLowerCase();

    // Strip HTML from content before counting
    const bodyText = (formData.content || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    const titleText = (formData.title || "").toLowerCase();
    const metaText = (formData.seoDescription || "").toLowerCase();

    // Count phrase occurrences in body (case-insensitive)
    const bodyLower = bodyText.toLowerCase();
    let occurrences = 0;
    let pos = 0;
    while ((pos = bodyLower.indexOf(kw, pos)) !== -1) { occurrences++; pos += kw.length; }

    // Word count (split on whitespace)
    const wordCount = bodyText ? bodyText.split(/\s+/).filter(Boolean).length : 0;

    // Density
    const kwWordCount = kw.split(/\s+/).length;
    const density = wordCount > 0 ? ((occurrences * kwWordCount) / wordCount) * 100 : 0;

    // H2 check — from raw HTML
    const h2Matches = [...(formData.content || "").matchAll(/<h2[^>]*>(.*?)<\/h2>/gi)];
    const inH2 = h2Matches.some(m => m[1].replace(/<[^>]*>/g, "").toLowerCase().includes(kw));

    return { occurrences, wordCount, density, inTitle: titleText.includes(kw), inMeta: metaText.includes(kw), inH2 };
  }, [keyword, formData.content, formData.title, formData.seoDescription]);

  if (!analysis) return null;
  const { occurrences, wordCount, density, inTitle, inMeta, inH2 } = analysis;

  return (
    <Box sx={{ mt: 1.5, p: 1.5, bgcolor: "grey.50", borderRadius: 1, border: "1px solid", borderColor: "grey.200" }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1, fontWeight: 600 }}>
        Keyword Analysis
      </Typography>
      <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
        Body: <strong>{occurrences}</strong> occurrence{occurrences !== 1 ? "s" : ""} in {wordCount} words
        {wordCount > 0 && ` (${density.toFixed(1)}%)`}
        {density > 4.5 && (
          <Chip label="High density" size="small" color="warning" sx={{ ml: 1, height: 16, fontSize: 10 }} />
        )}
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          {present(inTitle)}
          <Typography variant="caption">In title</Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          {present(inMeta)}
          <Typography variant="caption">In meta description</Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          {present(inH2)}
          <Typography variant="caption">In an H2 heading</Typography>
        </Box>
      </Box>
    </Box>
  );
}

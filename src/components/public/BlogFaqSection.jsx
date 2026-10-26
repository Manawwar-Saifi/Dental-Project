import { Accordion, AccordionSummary, AccordionDetails, Box, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

/**
 * BlogFaqSection
 *
 * Shared FAQ accordion used by both BlogDetailPage (published post) and
 * BlogPreviewModal (live formData preview). Keeping both surfaces in the
 * same component prevents them drifting out of sync.
 *
 * Props:
 *   faqs — array of { question: string, answer: string (HTML) }
 *           Renders nothing when faqs is empty or undefined.
 */
export default function BlogFaqSection({ faqs }) {
  if (!faqs?.length) return null;

  return (
    <Box sx={{ mt: 6 }}>
      <Typography variant="h5" fontWeight={700} color="#003366" sx={{ mb: 3 }}>
        Frequently Asked Questions
      </Typography>
      {faqs.map((faq, i) => (
        <Accordion
          key={i}
          sx={{
            mb: 1,
            borderRadius: "8px !important",
            "&:before": { display: "none" },
            border: "1px solid",
            borderColor: "grey.200",
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography fontWeight={600} fontSize="0.95rem">
              {faq.question}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <div
              className="text-gray-700 text-sm leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_a]:text-accent [&_a]:underline [&_strong]:font-semibold"
              dangerouslySetInnerHTML={{ __html: faq.answer }}
            />
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}

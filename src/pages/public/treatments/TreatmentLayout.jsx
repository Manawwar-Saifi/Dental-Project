import { Box, Typography, Container, Card, CardContent, Chip } from "@mui/material";
import Grid from "@mui/material/Grid";
import BreadcrumbBanner from "../../../components/public/BreadcrumbBanner";

const TreatmentLayout = ({ page }) => {
  return (
    <>
      <BreadcrumbBanner
        title={page.title}
        breadcrumbs={[
          { label: "Home", path: "/" },
          { label: "Treatments", path: "/treatments" },
          { label: page.title },
        ]}
      />

      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Typography variant="h4" fontWeight={800} color="#003366" gutterBottom>
              {page.title}
            </Typography>

            {page.content && (
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8, mb: 4 }}>
                {page.content}
              </Typography>
            )}

            {page.sections?.map((section, i) => (
              <Box key={i} sx={{ mb: 4 }}>
                <Typography variant="h5" fontWeight={700} color="#003366" gutterBottom>
                  {section.title}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                  {section.content}
                </Typography>
              </Box>
            ))}

            {page.procedureSteps?.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h5" fontWeight={700} color="#003366" gutterBottom>
                  Procedure
                </Typography>
                {page.procedureSteps.map((step, i) => (
                  <Box key={i} className="flex gap-3 mb-3">
                    <Box
                      sx={{
                        width: 32, height: 32, borderRadius: "50%", bgcolor: "#006694",
                        color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 700, fontSize: "0.85rem", flexShrink: 0,
                      }}
                    >
                      {i + 1}
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>{step.step}</Typography>
                      <Typography variant="body2" color="text.secondary">{step.description}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            {page.faqs?.length > 0 && (
              <Card sx={{ borderRadius: 2, mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} color="#003366" gutterBottom>
                    FAQs
                  </Typography>
                  {page.faqs.map((faq, i) => (
                    <Box key={i} sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        Q: {faq.question}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {faq.answer}
                      </Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            )}

            {page.keywords?.length > 0 && (
              <Card sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Related Topics
                  </Typography>
                  <Box className="flex flex-wrap gap-1">
                    {page.keywords.map((kw, i) => (
                      <Chip key={i} label={kw} size="small" variant="outlined" />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      </Container>
    </>
  );
};

export default TreatmentLayout;

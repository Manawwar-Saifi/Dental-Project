import { useTheme, useMediaQuery } from "@mui/material";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
  Button,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import InvoicePDF from "./InvoicePDF";
import { downloadInvoicePDF } from "../utils/downloadInvoicePDF";

const InvoicePreviewModal = ({ open, onClose, invoice }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const handleDownload = async () => {
    await downloadInvoicePDF(invoice);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={fullScreen}
      PaperProps={{ sx: { borderRadius: fullScreen ? 0 : 2 } }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pb: 1,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography variant="h6" component="span" fontWeight="bold">
          Invoice Preview
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ bgcolor: "#f3f4f6", p: { xs: 1.5, sm: 3 } }}>
        <Box
          sx={{
            bgcolor: "#ffffff",
            boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
            borderRadius: 1,
            maxWidth: "210mm",
            mx: "auto",
            overflow: "hidden",
          }}
        >
          {invoice ? (
            <InvoicePDF invoice={invoice} />
          ) : (
            <Box sx={{ p: 6, textAlign: "center" }}>
              <Typography color="text.secondary">No invoice selected</Typography>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1, borderTop: "1px solid", borderColor: "divider" }}>
        <Button variant="outlined" color="inherit" onClick={onClose}>
          Close
        </Button>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={handleDownload}
          disabled={!invoice}
          sx={{
            bgcolor: "#f59e0b",
            color: "#fff",
            "&:hover": { bgcolor: "#d97706" },
            "&:disabled": { bgcolor: "#fcd34d" },
          }}
        >
          Download PDF
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InvoicePreviewModal;

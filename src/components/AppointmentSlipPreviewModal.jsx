import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, CircularProgress, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import AppointmentSlip from './AppointmentSlip';
import { downloadAppointmentSlip } from '../utils/downloadAppointmentSlip';

const AppointmentSlipPreviewModal = ({ open, onClose, appointment }) => {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadAppointmentSlip(appointment);
    } catch (err) {
      console.error('Download error:', err);
    }
    setDownloading(false);
  };

  console.log(appointment)

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      PaperProps={{
        sx: {
          borderRadius: '12px',
          maxHeight: '95vh',
          width: '900px',
        }
      }}
    >
      <DialogTitle sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #e5e7eb',
        py: 1.5, px: 3
      }}>
        <span style={{ fontWeight: 700, fontSize: '16px' }}>Appointment Slip Preview22</span>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent sx={{
        p: 3,
        backgroundColor: '#e5e7eb',
        overflowY: 'auto',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
      }}>
        {/* Scale wrapper */}
        <Box sx={{
          transformOrigin: 'top center',
          transform: 'scale(0.85)',
          width: '794px',
          flexShrink: 0,
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          borderRadius: '4px',
          overflow: 'hidden',
          marginBottom: '-120px',
        }}>
          {appointment && <AppointmentSlip appointment={appointment} />}
        </Box>
      </DialogContent>

      <DialogActions sx={{
        px: 3, py: 2,
        borderTop: '1px solid #e5e7eb',
        gap: 1
      }}>
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{ textTransform: 'none', borderRadius: '8px' }}
        >
          Close
        </Button>
        <Button
          variant="contained"
          onClick={handleDownload}
          disabled={downloading}
          startIcon={downloading
            ? <CircularProgress size={16} color="inherit" />
            : <DownloadIcon />}
          sx={{
            textTransform: 'none',
            borderRadius: '8px',
            backgroundColor: '#f59e0b',
            '&:hover': { backgroundColor: '#d97706' }
          }}
        >
          {downloading ? 'Downloading...' : 'Download PDF'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AppointmentSlipPreviewModal;

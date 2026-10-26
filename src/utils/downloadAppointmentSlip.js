import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { createRoot } from 'react-dom/client';
import React from 'react';
import AppointmentSlip from '../components/AppointmentSlip';

export const downloadAppointmentSlip = async (appointment) => {
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    left: -9999px;
    top: 0;
    width: 794px;
    height: 1123px;
    overflow: hidden;
    background: white;
  `;
  document.body.appendChild(container);

  const root = createRoot(container);
  root.render(React.createElement(AppointmentSlip, { appointment }));

  await new Promise(r => setTimeout(r, 500));

  const canvas = await html2canvas(container, {
    scale: 2,
    useCORS: true,
    width: 794,
    height: 1123,
    windowWidth: 794,
    windowHeight: 1123,
    x: 0,
    y: 0,
    scrollX: 0,
    scrollY: 0,
    backgroundColor: '#ffffff',
  });

  const pdf = new jsPDF({
    unit: 'mm',
    format: 'a4',
    orientation: 'portrait',
  });

  pdf.addImage(canvas.toDataURL('image/jpeg', 0.98), 'JPEG', 0, 0, 210, 297);

  const patientName = appointment?.patient?.name || appointment?.patientName || 'Patient';
  pdf.save(`Appointment_Slip_${patientName}.pdf`);

  root.unmount();
  document.body.removeChild(container);
};

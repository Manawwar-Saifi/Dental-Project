import React from 'react';
import { CLINIC_NAME } from '../constants/clinic.js';

const AppointmentSlip = ({ appointment }) => {
  const patient = appointment?.patient || {};

  const formatDate = (date) => {
    if (!date) return '..................';
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  return (
    <div style={{
      width: '210mm',
      height: '297mm',
      backgroundColor: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      margin: '0 auto',
      position: 'relative',
      overflow: 'hidden',
      boxSizing: 'border-box',
    }}>

      {/* ══════════════════════════════
          TOP WAVE HEADER SVG
      ══════════════════════════════ */}
      <div style={{ position: 'relative', width: '100%', height: '65mm' }}>
        <svg
          viewBox="0 0 794 246"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: '100%', height: '100%', display: 'block' }}
          preserveAspectRatio="none"
        >
          {/* Main teal background */}
          <rect width="794" height="246" fill="#0097A7" />

          {/* White wave curve at bottom */}
          <path
            d="M0,180 C200,246 600,130 794,190 L794,246 L0,246 Z"
            fill="#ffffff"
          />

          {/* Green accent curve */}
          <path
            d="M580,0 C670,40 760,90 794,50 L794,0 Z"
            fill="#8BC34A"
          />

          {/* Clinic Logo / Name on left */}
          <text x="30" y="60" fill="#ffffff" fontSize="22" fontWeight="700" fontFamily="Arial">
            {CLINIC_NAME}
          </text>
          <text x="32" y="85" fill="rgba(255,255,255,0.85)" fontSize="11" fontFamily="Arial">
            {CLINIC_NAME}
          </text>
        </svg>

        {/* DR. NAME — top right (outside svg for easier styling) */}
        <div style={{
          position: 'absolute',
          top: '10mm',
          right: '14mm',
          textAlign: 'right',
        }}>

          {/* Doctor name */}
          <div style={{
            fontSize: '22px',
            fontWeight: '800',
            color: '#ffffff',
            textShadow: '1px 1px 6px rgba(0,0,0,0.5)',
            letterSpacing: '0.5px',
            marginBottom: '2mm',
          }}>
            {appointment?.doctor?.name ? `Dr. ${appointment.doctor.name}` : 'Dr. Ujjwal Prem'}
          </div>

          {/* Qualification */}
          <div style={{
            fontSize: '12px',
            color: 'rgba(255,255,255,0.92)',
            textShadow: '0 1px 4px rgba(0,0,0,0.4)',
            marginBottom: '5mm',
          }}>
            BDS, MDS — Dental Surgeon
          </div>

        </div>
      </div>

      {/* ══════════════════════════════
          PATIENT INFO ROW
      ══════════════════════════════ */}
      <div style={{
        padding: '5mm 14mm 4mm 14mm',
        display: 'flex',
        gap: '6mm',
        alignItems: 'flex-end',
        fontSize: '13px',
        color: '#000',
      }}>
        {/* Rx symbol */}
        <div style={{
          fontSize: '28px',
          fontWeight: '700',
          color: '#0097A7',
          marginRight: '2mm',
          lineHeight: 1,
          alignSelf: 'center',
        }}>
          ℞
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2mm', flex: 3 }}>
          <span style={{ fontWeight: '700', whiteSpace: 'nowrap' }}>Name :</span>
          <div style={{
            borderBottom: '1px dotted #333',
            flex: 1,
            paddingBottom: '1px',
            minWidth: '45mm',
            color: '#000',
          }}>
            {patient.name || appointment?.patientName || ''}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2mm' }}>
          <span style={{ fontWeight: '700', whiteSpace: 'nowrap' }}>Age :</span>
          <div style={{ borderBottom: '1px dotted #333', minWidth: '12mm', paddingBottom: '1px' }}>
            {patient.age || ''}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2mm' }}>
          <span style={{ fontWeight: '700', whiteSpace: 'nowrap' }}>Gender:</span>
          <div style={{ borderBottom: '1px dotted #333', minWidth: '14mm', paddingBottom: '1px' }}>
            {patient.gender || ''}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2mm' }}>
          <span style={{ fontWeight: '700', whiteSpace: 'nowrap' }}>Date :</span>
          <div style={{ borderBottom: '1px dotted #333', minWidth: '22mm', paddingBottom: '1px' }}>
            {formatDate(appointment?.appointmentDate || appointment?.date)}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════
          LARGE BLANK WRITING SPACE
      ══════════════════════════════ */}
      <div style={{ height: '185mm' }} />

      {/* ══════════════════════════════
          PLAIN WHITE FOOTER
      ══════════════════════════════ */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTop: '2px solid #0097A7',
        padding: '5mm 14mm',
        backgroundColor: '#ffffff',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '12px', fontWeight: '700', color: '#0097A7', marginBottom: '2mm' }}>
          Dental Clinic
        </div>
        <div style={{ fontSize: '11px', color: '#333', marginBottom: '1.5mm' }}>
          Delhi Road, Sonipat, Haryana, India
        </div>
        <div style={{ fontSize: '11px', color: '#333' }}>
          Phone: +91 87083 62763 &nbsp;|&nbsp; dentalclinic.example.com
        </div>
      </div>

    </div>
  );
};

export default AppointmentSlip;

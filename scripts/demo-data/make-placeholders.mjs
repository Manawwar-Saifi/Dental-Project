#!/usr/bin/env node
/**
 * Creates the small placeholder attachments referenced by the demo dataset's
 * medical reports (Report.files[].url -> /demo/...). Run once; the output is
 * committed under public/demo/. Re-running overwrites the files.
 *
 *   node scripts/demo-data/make-placeholders.mjs
 *
 * SVGs are hand-drawn "scan" placeholders; PDFs are generated with jspdf
 * (already a frontend dependency). Everything is clearly labelled DEMO.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const OUT = join(ROOT, "public", "demo");
mkdirSync(OUT, { recursive: true });

// ---------------------------------------------------------------- SVG scans
const frame = (w, h, title, body) => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <radialGradient id="glow" cx="50%" cy="50%" r="60%">
      <stop offset="0%" stop-color="#3a3a3a"/>
      <stop offset="100%" stop-color="#0b0b0b"/>
    </radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#glow)"/>
${body}
  <text x="16" y="28" fill="#9ad" font-family="monospace" font-size="15">${title}</text>
  <text x="16" y="${h - 14}" fill="#777" font-family="monospace" font-size="12">DENTAL CLINIC - DEMO IMAGE - NOT A REAL PATIENT SCAN</text>
  <text x="${w / 2}" y="${h / 2 + 10}" fill="#ffffff" fill-opacity="0.08" font-family="sans-serif" font-size="${Math.round(h / 4)}" font-weight="700" text-anchor="middle">DEMO</text>
</svg>
`;

const tooth = (x, y, s, rot = 0) =>
  `  <g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">
    <path d="M-18,-40 C-30,-40 -32,-20 -28,-4 C-24,12 -20,34 -14,60 C-10,72 -4,70 -3,56 L0,30 L3,56 C4,70 10,72 14,60 C20,34 24,12 28,-4 C32,-20 30,-40 18,-40 C10,-40 6,-34 0,-34 C-6,-34 -10,-40 -18,-40 Z" fill="#d9d9d9" fill-opacity="0.85"/>
    <path d="M-10,-30 C-12,-10 -8,20 -4,44 M10,-30 C12,-10 8,20 4,44" stroke="#555" stroke-width="3" fill="none"/>
  </g>`;

const iopa = frame(
  420,
  320,
  "IOPA / RVG  -  TOOTH 36",
  [tooth(150, 150, 1.4), tooth(270, 150, 1.4), `  <rect x="250" y="80" width="40" height="22" rx="6" fill="#fff" fill-opacity="0.9"/>`].join("\n"),
);

const opgTeeth = [];
for (let i = 0; i < 14; i++) {
  const x = 90 + i * 46;
  const curve = Math.pow((i - 6.5) / 6.5, 2) * 40;
  opgTeeth.push(tooth(x, 140 + curve, 0.62, (i - 6.5) * 2));
  opgTeeth.push(tooth(x, 300 - curve, 0.62, 180 - (i - 6.5) * 2));
}
const opg = frame(
  780,
  440,
  "OPG  -  PANORAMIC RADIOGRAPH",
  [
    `  <ellipse cx="390" cy="225" rx="360" ry="190" fill="none" stroke="#666" stroke-width="2" stroke-dasharray="6 6"/>`,
    ...opgTeeth,
  ].join("\n"),
);

const cbctSlices = [];
for (let r = 0; r < 2; r++) {
  for (let c = 0; c < 3; c++) {
    const x = 30 + c * 190;
    const y = 50 + r * 170;
    cbctSlices.push(
      `  <rect x="${x}" y="${y}" width="170" height="150" fill="#000" stroke="#444"/>\n` +
        `  <ellipse cx="${x + 85}" cy="${y + 80}" rx="${50 - c * 6}" ry="${38 + r * 6}" fill="#bbb" fill-opacity="${0.35 + c * 0.15}"/>\n` +
        `  <text x="${x + 6}" y="${y + 16}" fill="#9ad" font-family="monospace" font-size="11">SLICE ${r * 3 + c + 1}</text>`,
    );
  }
}
const cbct = frame(620, 420, "CBCT  -  AXIAL SLICES (MANDIBLE)", cbctSlices.join("\n"));

const svgs = {
  "xray-iopa.svg": iopa,
  "opg-panoramic.svg": opg,
  "cbct-scan.svg": cbct,
};
for (const [name, content] of Object.entries(svgs)) {
  writeFileSync(join(OUT, name), content);
}

// ---------------------------------------------------------------- PDFs
const require = createRequire(import.meta.url);
const { jsPDF } = require("jspdf");

const header = (doc, title) => {
  doc.setFillColor(0, 51, 102);
  doc.rect(0, 0, 210, 26, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text("Dental Clinic", 14, 12);
  doc.setFontSize(9);
  doc.text("Sector 15, Sonipat, Haryana  |  DEMO DOCUMENT - sample data only", 14, 19);
  doc.setTextColor(20, 20, 20);
  doc.setFontSize(14);
  doc.text(title, 14, 40);
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 44, 196, 44);
  doc.setFontSize(10);
};
const footer = (doc) => {
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 140);
  doc.text("This file is a placeholder generated for the portfolio demo. It contains no real patient information.", 14, 285);
};
const lines = (doc, startY, rows) => {
  let y = startY;
  for (const row of rows) {
    doc.text(row, 14, y);
    y += 7;
  }
  return y;
};

const pdfs = {
  "lab-report.pdf": (doc) => {
    header(doc, "Laboratory Report");
    let y = lines(doc, 54, ["Patient: Demo Patient", "Referred by: Dr. Arjun Malik", "Sample: Venous blood (fasting)", ""]);
    doc.setFont(undefined, "bold");
    doc.text("Parameter", 14, y);
    doc.text("Result", 90, y);
    doc.text("Reference range", 130, y);
    doc.setFont(undefined, "normal");
    y += 8;
    for (const [p, r, n] of [
      ["Fasting Blood Sugar", "96 mg/dL", "70 - 100 mg/dL"],
      ["HbA1c", "5.4 %", "< 5.7 %"],
      ["Haemoglobin", "13.6 g/dL", "12 - 16 g/dL"],
      ["Platelet count", "2.6 lakh/uL", "1.5 - 4.5 lakh/uL"],
      ["PT / INR", "1.02", "0.8 - 1.2"],
    ]) {
      doc.text(p, 14, y);
      doc.text(r, 90, y);
      doc.text(n, 130, y);
      y += 7;
    }
    lines(doc, y + 6, ["Impression: All values within normal limits. Fit for planned dental procedure."]);
    footer(doc);
  },
  "prescription.pdf": (doc) => {
    header(doc, "Prescription");
    lines(doc, 54, [
      "Patient: Demo Patient                    Date: as per report",
      "Diagnosis: Symptomatic irreversible pulpitis (36)",
      "",
      "Rx",
      "1. Tab. Amoxicillin 500 mg - 1 tab three times a day x 5 days",
      "2. Tab. Ibuprofen + Paracetamol - 1 tab SOS for pain (max 3/day)",
      "3. Chlorhexidine 0.2% mouthwash - 10 ml twice daily x 7 days",
      "",
      "Advice: Warm saline rinses. Avoid chewing on the treated side.",
      "Review after 7 days or earlier if swelling increases.",
      "",
      "Dr. Arjun Malik, BDS, MDS (Demo)",
    ]);
    footer(doc);
  },
  "treatment-plan.pdf": (doc) => {
    header(doc, "Treatment Plan & Estimate");
    let y = lines(doc, 54, ["Patient: Demo Patient", "Plan prepared by: Dr. Kavita Rathee", ""]);
    doc.setFont(undefined, "bold");
    doc.text("Phase", 14, y);
    doc.text("Procedure", 40, y);
    doc.text("Estimate (INR)", 150, y);
    doc.setFont(undefined, "normal");
    y += 8;
    for (const [ph, pr, est] of [
      ["1", "Records, intra-oral scan and attachments", "Included"],
      ["2", "Aligner trays 1-12 (upper & lower)", "Included"],
      ["3", "Refinement trays if required", "Included"],
      ["4", "Retainers after completion", "Included"],
    ]) {
      doc.text(ph, 14, y);
      doc.text(pr, 40, y);
      doc.text(est, 150, y);
      y += 7;
    }
    lines(doc, y + 6, [
      "Total package: as per invoice. Membership discount applied where eligible.",
      "Expected duration: 9 - 12 months, reviews every 3 - 4 weeks.",
    ]);
    footer(doc);
  },
  "consent-form.pdf": (doc) => {
    header(doc, "Informed Consent");
    lines(doc, 54, [
      "I, the undersigned, confirm that the proposed treatment, its benefits, risks,",
      "alternatives and expected costs have been explained to me in a language I understand.",
      "",
      "I understand that individual results vary and that additional procedures may be",
      "required. I consent to local anaesthesia and to clinical photographs being taken",
      "for my treatment records.",
      "",
      "Patient signature: ____________________      Date: __________",
      "Doctor signature:  ____________________      Witness: ________",
    ]);
    footer(doc);
  },
};
for (const [name, build] of Object.entries(pdfs)) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  build(doc);
  writeFileSync(join(OUT, name), Buffer.from(doc.output("arraybuffer")));
}

console.log(`Placeholders written to ${OUT}:`);
for (const name of [...Object.keys(svgs), ...Object.keys(pdfs)]) console.log(`  /demo/${name}`);

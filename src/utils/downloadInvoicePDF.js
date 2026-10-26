import html2pdf from "html2pdf.js";
import { createRoot } from "react-dom/client";
import { createElement } from "react";
import InvoicePDF from "../components/InvoicePDF";

export const downloadInvoicePDF = async (invoice) => {
  const patientName = (invoice?.patient?.name || "Patient").replace(/\s+/g, "_");
  const invoiceNo = invoice?.invoiceNumber || "INV";

  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "0";
  document.body.appendChild(container);

  const root = createRoot(container);
  root.render(createElement(InvoicePDF, { invoice }));

  // Give React one tick to flush the render before html2canvas reads the DOM
  await new Promise((resolve) => setTimeout(resolve, 300));

  const opt = {
    margin: 10,
    filename: `Invoice_${invoiceNo}_${patientName}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
  };

  try {
    await html2pdf().set(opt).from(container.firstChild).save();
  } finally {
    root.unmount();
    document.body.removeChild(container);
  }
};

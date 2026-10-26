/**
 * InvoicePDF
 *
 * Print-ready, black-and-white invoice layout.
 * ALL styles are inline — required for html2pdf.js / html2canvas rendering.
 * Colors: only #000, #333, #666, #999, #e0e0e0, #f0f0f0, #fff.
 * Amounts: ₹ INR only, en-IN locale formatting.
 */
import { CLINIC_NAME } from "../constants/clinic.js";

const fmt = (val) =>
  `₹${(val ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const ITEM_TYPE_LABELS = {
  treatment: "Treatment",
  surgery: "Surgery",
  test: "Test",
  opd_fee: "OPD Fee",
  membership: "Membership",
  medicine: "Medicine",
  other: "Other",
};

const STATUS_LABELS = {
  unpaid: "UNPAID",
  partial: "PARTIALLY PAID",
  paid: "PAID",
};

const getStatusStyle = (status) => {
  const base = {
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "1.5px",
    textTransform: "uppercase",
    display: "inline-block",
    fontFamily: "Inter, sans-serif",
    lineHeight: "1",
    verticalAlign: "middle",
  };
  const s = (status || "").toLowerCase();
  if (s === "paid") return { ...base, color: "#16A34A" };
  if (s.includes("partial")) return { ...base, color: "#D97706" };
  return { ...base, color: "#DC2626" };
};

/* ── Tiny helpers ─────────────────────────────────────────────────── */

const SectionLabel = ({ children }) => (
  <div
    style={{
      fontSize: "9px",
      textTransform: "uppercase",
      letterSpacing: "2px",
      color: "#999999",
      fontWeight: "600",
      marginBottom: "10px",
    }}
  >
    {children}
  </div>
);

const DetailRow = ({ label, value }) => (
  <div style={{ display: "flex", marginBottom: "4px" }}>
    <span
      style={{
        fontSize: "12px",
        color: "#666666",
        width: "90px",
        flexShrink: 0,
      }}
    >
      {label}
    </span>
    <span style={{ fontSize: "12px", color: "#000000", fontWeight: "500" }}>
      {value || "—"}
    </span>
  </div>
);

const TotalRow = ({ label, value, bold, thick }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      padding: "4px 0",
      fontSize: bold ? "13px" : "12px",
      fontWeight: bold ? "700" : "400",
      color: "#000000",
      borderTop: thick ? "2px solid #000000" : undefined,
      marginTop: thick ? "6px" : undefined,
    }}
  >
    <span style={{ color: bold ? "#000000" : "#666666" }}>{label}</span>
    <span>{value}</span>
  </div>
);

/* ── Main component ───────────────────────────────────────────────── */

const InvoicePDF = ({ invoice }) => {
  const items = invoice?.items || [];
  const payStatus = STATUS_LABELS[invoice?.paymentStatus] || "UNPAID";
  const hasDiscount =
    (invoice?.discount?.percentage > 0) || (invoice?.discount?.amount > 0);

  return (
    <div
      style={{
        maxWidth: "780px",
        padding: "40px",
        backgroundColor: "#ffffff",
        fontFamily: "Inter, sans-serif",
        color: "#333333",
        boxSizing: "border-box",
      }}
    >
      {/* ── 1. HEADER ─────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* Left — logo + clinic name */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <img
            src="/dental-clinic-logo.png"
            alt="Dental Clinic"
            height="50"
            style={{ height: "50px", marginRight: "12px", objectFit: "contain" }}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <div>
            <div
              style={{
                fontSize: "22px",
                fontWeight: "700",
                color: "#000000",
                letterSpacing: "0.5px",
                lineHeight: "1.2",
              }}
            >
              Dental Clinic
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "#666666",
                marginTop: "2px",
              }}
            >
              {CLINIC_NAME}
            </div>
            <div
              style={{
                fontSize: "10px",
                color: "#999999",
                marginTop: "1px",
              }}
            >
              Delhi Road, Sonipat
            </div>
          </div>
        </div>

        {/* Right — INVOICE label + number + status */}
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "3px",
              color: "#999999",
              fontWeight: "600",
            }}
          >
            Invoice
          </div>
          <div
            style={{
              fontSize: "18px",
              fontWeight: "700",
              color: "#000000",
              margin: "4px 0 8px",
            }}
          >
            {invoice?.invoiceNumber || "—"}
          </div>
          <div style={getStatusStyle(invoice?.paymentStatus)}>
            {payStatus}
          </div>
        </div>
      </div>

      {/* ── 2. DIVIDER ────────────────────────────────────────────── */}
      <div
        style={{
          borderTop: "1px solid #000000",
          margin: "24px 0",
        }}
      />

      {/* ── 3. DETAILS SECTION ────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        {/* Left — invoice details */}
        <div style={{ width: "55%" }}>
          <SectionLabel>Invoice Details</SectionLabel>
          <DetailRow label="Date"     value={fmtDate(invoice?.invoiceDate)} />
          <DetailRow label="Due Date" value={fmtDate(invoice?.dueDate)} />
          <DetailRow label="Clinic"   value={invoice?.clinic?.name} />
        </div>

        {/* Right — bill to */}
        <div style={{ width: "40%" }}>
          <SectionLabel>Bill To</SectionLabel>
          <div
            style={{
              fontSize: "15px",
              color: "#000000",
              fontWeight: "600",
              marginBottom: "4px",
            }}
          >
            {invoice?.patient?.name || "—"}
          </div>
          {invoice?.patient?.phone && (
            <div style={{ fontSize: "12px", color: "#333333", marginBottom: "2px" }}>
              {invoice.patient.phone}
            </div>
          )}
          {invoice?.patient?.email && (
            <div style={{ fontSize: "12px", color: "#333333" }}>
              {invoice.patient.email}
            </div>
          )}
        </div>
      </div>

      {/* ── 4. LINE ITEMS TABLE ───────────────────────────────────── */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "28px",
          fontSize: "12px",
        }}
      >
        <thead>
          <tr
            style={{
              borderTop: "2px solid #000000",
              borderBottom: "1px solid #000000",
            }}
          >
            {[
              { label: "#",          w: "5%",     align: "left"   },
              { label: "Description",w: "32%",    align: "left"   },
              { label: "Category",   w: "18%",    align: "left"   },
              { label: "Qty",        w: "10%",    align: "center" },
              { label: "Unit Price", w: "17.5%",  align: "right"  },
              { label: "Amount",     w: "17.5%",  align: "right"  },
            ].map((col) => (
              <th
                key={col.label}
                style={{
                  width: col.w,
                  padding: "10px 8px",
                  textAlign: col.align,
                  fontSize: "9px",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  color: "#666666",
                  fontWeight: "600",
                  backgroundColor: "transparent",
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                style={{
                  padding: "20px 8px",
                  textAlign: "center",
                  color: "#999999",
                  fontSize: "12px",
                  borderBottom: "2px solid #000000",
                }}
              >
                No items
              </td>
            </tr>
          ) : (
            items.map((item, idx) => {
              const isLast = idx === items.length - 1;
              return (
                <tr key={idx}>
                  <td
                    style={{
                      padding: "12px 8px",
                      fontSize: "13px",
                      color: "#000000",
                      borderBottom: isLast ? "2px solid #000000" : "1px solid #e0e0e0",
                    }}
                  >
                    {idx + 1}
                  </td>
                  <td
                    style={{
                      padding: "12px 8px",
                      fontSize: "13px",
                      color: "#000000",
                      fontWeight: "500",
                      borderBottom: isLast ? "2px solid #000000" : "1px solid #e0e0e0",
                    }}
                  >
                    {item.description || "—"}
                  </td>
                  <td
                    style={{
                      padding: "12px 8px",
                      fontSize: "13px",
                      color: "#333333",
                      borderBottom: isLast ? "2px solid #000000" : "1px solid #e0e0e0",
                    }}
                  >
                    {ITEM_TYPE_LABELS[item.itemType] || item.itemType || "—"}
                  </td>
                  <td
                    style={{
                      padding: "12px 8px",
                      fontSize: "13px",
                      color: "#000000",
                      textAlign: "center",
                      borderBottom: isLast ? "2px solid #000000" : "1px solid #e0e0e0",
                    }}
                  >
                    {item.quantity ?? 1}
                  </td>
                  <td
                    style={{
                      padding: "12px 8px",
                      fontSize: "13px",
                      color: "#000000",
                      textAlign: "right",
                      borderBottom: isLast ? "2px solid #000000" : "1px solid #e0e0e0",
                    }}
                  >
                    {fmt(item.unitPrice)}
                  </td>
                  <td
                    style={{
                      padding: "12px 8px",
                      fontSize: "13px",
                      color: "#000000",
                      textAlign: "right",
                      borderBottom: isLast ? "2px solid #000000" : "1px solid #e0e0e0",
                    }}
                  >
                    {fmt(item.total)}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* ── 5. TOTALS ─────────────────────────────────────────────── */}
      <div
        style={{
          width: "240px",
          marginTop: "20px",
          marginLeft: "auto",
        }}
      >
        <TotalRow label="Subtotal" value={fmt(invoice?.subtotal)} />

        {hasDiscount && (
          <TotalRow
            label={
              invoice?.discount?.percentage
                ? `Discount (${invoice.discount.percentage}%)`
                : "Discount"
            }
            value={`-${fmt(invoice?.discount?.amount)}`}
          />
        )}

        {(invoice?.totalTax || 0) > 0 && (
          <TotalRow label="Tax" value={fmt(invoice?.totalTax)} />
        )}

        {/* thin separator */}
        <div style={{ borderTop: "1px solid #e0e0e0", margin: "6px 0" }} />

        <TotalRow label="Grand Total" value={fmt(invoice?.grandTotal)} bold />

        {/* thick line below grand total */}
        <div style={{ borderTop: "2px solid #000000", margin: "6px 0" }} />

        <TotalRow label="Amount Paid"  value={fmt(invoice?.amountPaid)} />
        <TotalRow
          label="Balance Due"
          value={fmt(invoice?.balanceDue ?? 0)}
          bold
        />
      </div>

      {/* ── 6. FOOTER ─────────────────────────────────────────────── */}
      <div style={{ marginTop: "60px" }}>
        <div style={{ borderTop: "1px solid #e0e0e0" }} />
        <div
          style={{
            fontSize: "12px",
            color: "#333333",
            fontWeight: "500",
            textAlign: "center",
            marginTop: "14px",
          }}
        >
          Thank you for choosing Dental Clinic
        </div>
        <div
          style={{
            fontSize: "10px",
            color: "#999999",
            textAlign: "center",
            marginTop: "4px",
          }}
        >
          {CLINIC_NAME}
        </div>
        <div
          style={{
            fontSize: "9px",
            fontStyle: "italic",
            color: "#999999",
            textAlign: "center",
            marginTop: "4px",
          }}
        >
          Signature not required. Digitally generated
        </div>
      </div>
    </div>
  );
};

export default InvoicePDF;

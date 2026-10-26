/**
 * Stand-in for Razorpay Checkout in the demo build. Pages keep calling
 * `new window.Razorpay(options).open()` exactly as in production; this shows a
 * small "simulated payment" dialog and hands the page a fake success payload,
 * which the demo API's verify endpoints accept. No money and no network.
 */

const formatAmount = (paise, currency = "INR") =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 }).format(
    (Number(paise) || 0) / 100,
  );

const randomId = (prefix) => `${prefix}_demo${Math.random().toString(36).slice(2, 12)}`;

class DemoRazorpay {
  constructor(options = {}) {
    this.options = options;
    this.listeners = {};
    this.overlay = null;
  }

  on(event, callback) {
    (this.listeners[event] ||= []).push(callback);
  }

  close() {
    this.overlay?.remove();
    this.overlay = null;
  }

  open() {
    const { amount, currency, name, description, theme, modal } = this.options;
    const accent = theme?.color || "#F57C00";

    const overlay = document.createElement("div");
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.style.cssText =
      "position:fixed;inset:0;z-index:20000;background:rgba(13,27,74,.55);display:flex;align-items:center;justify-content:center;padding:16px;font-family:'DM Sans',sans-serif";

    const card = document.createElement("div");
    card.style.cssText =
      "width:100%;max-width:360px;background:#fff;border-radius:10px;box-shadow:0 20px 50px rgba(0,0,0,.3);overflow:hidden";

    const header = document.createElement("div");
    header.style.cssText = `background:${accent};color:#fff;padding:16px 20px`;
    const merchant = document.createElement("div");
    merchant.style.cssText = "font-weight:600;font-size:16px";
    merchant.textContent = name || "Dental Clinic";
    const desc = document.createElement("div");
    desc.style.cssText = "font-size:13px;opacity:.9;margin-top:2px";
    desc.textContent = description || "Payment";
    header.append(merchant, desc);

    const body = document.createElement("div");
    body.style.cssText = "padding:20px";
    const total = document.createElement("div");
    total.style.cssText = "font-size:28px;font-weight:700;color:#0D1B4A";
    total.textContent = formatAmount(amount, currency);
    const note = document.createElement("p");
    note.style.cssText = "margin:8px 0 20px;font-size:13px;line-height:1.5;color:#6b7280";
    note.textContent = "Simulated Razorpay checkout — this is a portfolio demo, no real payment is made.";

    const pay = document.createElement("button");
    pay.type = "button";
    pay.textContent = `Pay ${formatAmount(amount, currency)}`;
    pay.style.cssText = `width:100%;padding:12px;border:0;border-radius:6px;background:${accent};color:#fff;font-size:15px;font-weight:600;cursor:pointer`;
    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.textContent = "Cancel";
    cancel.style.cssText =
      "width:100%;margin-top:8px;padding:10px;border:0;background:transparent;color:#6b7280;font-size:14px;cursor:pointer";

    body.append(total, note, pay, cancel);
    card.append(header, body);
    overlay.append(card);
    document.body.append(overlay);
    this.overlay = overlay;

    cancel.addEventListener("click", () => {
      this.close();
      modal?.ondismiss?.();
    });

    pay.addEventListener("click", () => {
      pay.disabled = true;
      cancel.disabled = true;
      pay.textContent = "Processing…";
      setTimeout(() => {
        this.close();
        this.options.handler?.({
          razorpay_payment_id: randomId("pay"),
          razorpay_order_id: this.options.order_id || randomId("order"),
          razorpay_signature: "demo_signature",
        });
      }, 900);
    });
  }
}

export function installDemoRazorpay() {
  window.Razorpay = DemoRazorpay;
}

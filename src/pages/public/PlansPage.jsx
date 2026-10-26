/**
 * Public Membership Plans Page
 *
 * Displays membership plans from backend API.
 * Allows purchase via Razorpay (requires patient login).
 */
import { useState } from "react";
import { CircularProgress } from "@mui/material";
import { filterName, NAME_PLACEHOLDER } from "../../utils/nameInput";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { CLINIC_NAME } from "../../constants/clinic.js";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import HealthAndSafetyIcon from "@mui/icons-material/HealthAndSafety";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useAuthStore } from "../../store/auth.store";
import api from "../../api/axios";
import BreadcrumbBanner from "../../components/public/BreadcrumbBanner";
import { ONLINE_PAYMENTS_ENABLED } from "../../utils/paymentFlags";

const fieldCls =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[15px] text-gray-800 outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-orange-200";

// Load the Razorpay checkout script on demand (resolves once available) so the
// gateway is guaranteed loaded before new window.Razorpay() is called.
const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const PlansPage = () => {
  const [buyDialog, setBuyDialog] = useState(null);
  const [buyForm, setBuyForm] = useState({ name: "", phone: "", email: "" });
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const patient = useAuthStore((state) => state.patient);

  // Fetch plans from API
  const { data, isLoading } = useQuery({
    queryKey: ["public", "membership-plans"],
    queryFn: () => api.get("/memberships/plans").then((res) => res.data),
    staleTime: 5 * 60 * 1000,
  });

  // Order cards by price ascending so Premium (₹666) sits left, Star (₹999)
  // in the center, and Implant Post Care (₹4,500) on the right.
  const plans = [...(data?.data?.plans || data?.data || [])].sort(
    (a, b) => (a.price || 0) - (b.price || 0)
  );
  // The middle plan is highlighted as the recommended ("Most Popular") option —
  // with the price-ascending order above this lands on Star (₹999).
  const featuredIndex = plans.length ? Math.floor(plans.length / 2) : -1;

  // Handle Buy Now click — opens the checkout modal, prefilling the
  // logged-in patient's details for the payment step.
  const handleBuyClick = (plan) => {
    setBuyDialog(plan);
    setShowTerms(false);
    setBuyForm({
      name: patient?.name || "",
      phone: patient?.phone || "",
      email: patient?.email || "",
    });
  };

  // Handle purchase with Razorpay
  const handlePurchase = async () => {
    if (!buyForm.name.trim() || !buyForm.phone.trim() || !buyForm.email.trim()) {
      toast.info("Please fill in all fields");
      return;
    }
    if (!/^\d{10}$/.test(buyForm.phone.replace(/\D/g, ""))) {
      toast.info("Please enter a valid 10-digit phone number");
      return;
    }

    setIsProcessing(true);
    try {
      // Ensure the Razorpay gateway script is loaded before using it.
      const scriptOk = await loadRazorpayScript();
      if (!scriptOk) {
        toast.error("Failed to load payment gateway. Please try again.");
        setIsProcessing(false);
        return;
      }

      // Create Razorpay order
      const orderRes = await api.post("/payments/razorpay/create-order", {
        planId: buyDialog._id,
        type: "membership",
        isOnlineBooking: true,
      });

      const { order, paymentId, key_id } = orderRes.data.data;

      // Load Razorpay
      const rzp = new window.Razorpay({
        key: key_id,
        amount: order.amount,
        currency: order.currency,
        name: "Dental Clinic",
        description: `${buyDialog.name} Membership`,
        order_id: order.id,
        prefill: {
          name: buyForm.name,
          contact: buyForm.phone,
          email: buyForm.email,
        },
        theme: { color: "#006694" },
        handler: async (response) => {
          try {
            // Verify payment
            await api.post("/payments/razorpay/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              paymentId,
            });

            // Purchase membership
            await api.post("/memberships/purchase", {
              planId: buyDialog._id,
              paymentId,
              name: buyForm.name,
              phone: buyForm.phone,
              email: buyForm.email,
            });

            toast.success("Membership purchased successfully! Check your email for login details.");
            setBuyDialog(null);
          } catch (err) {
            toast.error(err.response?.data?.message || "Payment verification failed");
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            toast.warning("Payment cancelled");
          },
        },
      });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to initiate payment");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatPrice = (p) => `₹${(p || 0).toLocaleString("en-IN")}`;

  return (
    <>
      <title>Dental Membership Plans | Affordable Preventive Dental Care</title>
      <meta
        name="description"
        content="Explore our dental membership plans designed to make quality dental care more affordable. Enjoy exclusive savings, preventive care benefits, and discounts on a wide range of dental treatments."
      />
      <meta
        name="keywords"
        content="dental membership plans Sonipat, dental health plan, Dental Clinic plans, affordable dental care Sonipat"
      />
      <link rel="canonical" href="https://dentalclinic.example.com/membership-plans" />
      <meta name="robots" content="index, follow" />
      <meta
        property="og:title"
        content="Dental Membership Plans | Affordable Preventive Dental Care"
      />
      <meta
        property="og:description"
        content="Explore our dental membership plans designed to make quality dental care more affordable. Enjoy exclusive savings, preventive care benefits, and discounts on a wide range of dental treatments."
      />
      <meta property="og:url" content="https://dentalclinic.example.com/membership-plans" />
      <meta
        property="og:image"
        content="https://dentalclinic.example.com/dental-clinic-logo.png"
      />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Dental Membership Plans | Affordable Preventive Dental Care" />
      <meta
        name="twitter:description"
        content="Explore our dental membership plans designed to make quality dental care more affordable. Enjoy exclusive savings, preventive care benefits, and discounts on a wide range of dental treatments."
      />
      <meta
        name="twitter:image"
        content="https://dentalclinic.example.com/dental-clinic-logo.png"
      />
      {plans.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ItemList",
              itemListElement: plans.map((plan, i) => ({
                "@type": "Offer",
                position: i + 1,
                name: plan.name,
                description: plan.description || undefined,
                price: plan.price,
                priceCurrency: "INR",
                url: "https://dentalclinic.example.com/membership-plans",
                itemOffered: {
                  "@type": "Service",
                  name: `${plan.name} Membership`,
                  provider: {
                    "@type": "Dentist",
                    name: "Dental Clinic",
                  },
                },
              })),
            }),
          }}
        />
      )}
      <BreadcrumbBanner
        title="Our Plans"
        breadcrumbs={[{ label: "Home", path: "/" }, { label: "Plans" }]}
        showTitle={false}
      />

      <section className="py-[48px] md:py-[64px] bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16">
          <h1
            className="text-[#003366] text-center mb-2"
            style={{ fontSize: "2rem", fontWeight: 800 }}
          >
            Dental Membership Plans
          </h1>
          <p className="text-center text-gray-500 mb-10 max-w-2xl mx-auto text-base">
            Choose the perfect plan for you and your family. Enjoy exclusive
            discounts and priority care.
          </p>

          {/* Compact intro — 3 quick benefits (keeps plan cards near the top) */}
          <div className="max-w-4xl mx-auto mb-10">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  icon: <LocalOfferIcon className="text-accent!" />,
                  title: "Discounts on treatments",
                  desc: "Save on a wide range of dental procedures.",
                },
                {
                  icon: <MedicalServicesIcon className="text-accent!" />,
                  title: "Free consultations & X-rays",
                  desc: "Included with every plan.",
                },
                {
                  icon: <HealthAndSafetyIcon className="text-accent!" />,
                  title: "Affordable care for everyone",
                  desc: "Quality dentistry, accessible to all.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="bg-white rounded-xl border border-gray-100 p-4 text-center"
                >
                  <span className="inline-flex w-10 h-10 rounded-full bg-orange-50 items-center justify-center mb-2">
                    {item.icon}
                  </span>
                  <p className="text-[#003366] text-[15px] font-semibold leading-tight">
                    {item.title}
                  </p>
                  <p className="text-gray-500 text-[13px] mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {plans.length > 0 && (
            <h2 className="text-[#003366] text-center text-[22px] font-bold mb-6">
              Choose Your Membership Plan
            </h2>
          )}

          {isLoading ? (
            <div className="text-center py-16">
              <CircularProgress sx={{ color: "#f57c00" }} />
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-600 text-lg font-semibold">
                No plans available at the moment
              </p>
              <p className="text-gray-500 text-sm mt-1">
                Contact us for membership information
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto items-stretch">
              {plans.map((plan, i) => {
                const featured = i === featuredIndex;
                return (
                  <div
                    key={plan._id}
                    className={`relative rounded-2xl py-8 px-6 flex flex-col bg-white border ${
                      featured
                        ? "border-accent md:scale-[1.03]"
                        : "border-gray-200"
                    }`}
                  >
                    {featured && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white text-[12px] font-semibold rounded-full px-3 py-1">
                        Most Popular
                      </span>
                    )}

                    {/* Name + description */}
                    <div className="text-center">
                      <h3 className="text-[#003366] text-xl font-bold leading-tight capitalize">
                        {plan.name}
                      </h3>
                      {plan.description && (
                        <p className="text-gray-500 text-sm mt-2 line-clamp-2">
                          {plan.description.replace(/\n/g, " ")}
                        </p>
                      )}
                    </div>

                    {/* Price */}
                    <p className="text-center mt-4">
                      <span className="font-numbers text-[#003366] text-4xl font-extrabold">
                        {formatPrice(plan.price)}
                      </span>
                      {plan.durationMonths >= 12 && (
                        <span className="font-numbers text-gray-500 text-sm">/year</span>
                      )}
                    </p>

                    <div className="border-t border-gray-100 my-5" />

                    {/* Benefits */}
                    <ul className="flex-grow space-y-1">
                      {(plan.features || []).map((feature, j) => (
                        <li
                          key={j}
                          className="flex items-start gap-2 py-1.5 text-gray-700 text-[14px] leading-snug"
                        >
                          <CheckIcon className="text-accent text-[16px]! mt-0.5 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Buy Now -- online purchase requires Razorpay; when
                        disabled, purchases aren't available online (no
                        server-side payment verification exists to safely
                        create an "unpaid" membership record instead). */}
                    {ONLINE_PAYMENTS_ENABLED ? (
                      <button
                        type="button"
                        onClick={() => handleBuyClick(plan)}
                        className="mt-6 block w-full text-center border-2 border-accent text-accent bg-transparent hover:bg-accent hover:text-white rounded-xl py-3 text-[15px] font-semibold transition-colors duration-200 cursor-pointer"
                      >
                        Buy Now
                      </button>
                    ) : (
                      <div className="mt-6 text-center text-[13px] text-gray-500 border border-gray-200 rounded-xl py-3 px-2">
                        Online purchase is temporarily unavailable. Please visit the clinic to purchase this plan.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Full philosophy — below the cards so plans/prices come first */}
          <div className="max-w-3xl mx-auto text-center mt-14">
            <h2 className="text-[#003366] text-[24px] font-bold mb-4">
              What is the Dental Clinic Health Plan?
            </h2>
            <div className="text-gray-600 text-base space-y-4" style={{ lineHeight: 1.8 }}>
              <p>
                The Dental Clinic Health Plan is a comprehensive and affordable
                way to ensure your dental health is always a priority. Designed
                for individuals and families, our plan provides access to a wide
                range of preventive and restorative dental services, helping you
                maintain a healthy smile without the stress of unexpected
                expenses.
              </p>
              <p>
                Aligned with the vision of 'Smile for All', Dental Clinic's
                Health Plans aim to make 'Caring for your smile' a reality. We're
                bridging the gap between quality dental care and affordability,
                ensuring that every individual — regardless of background — has
                access to safe, expert, and compassionate oral healthcare.
              </p>
              <p>
                With the Dental Clinic Health Plan, you get discounts on
                treatments, free consultations, and the flexibility to choose
                from a range of dental services — all while enjoying the trusted
                care of our expert team.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Checkout modal */}
      {buyDialog && (
        <div
          className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !isProcessing && setBuyDialog(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 md:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-[#003366] text-xl font-bold capitalize">
                  {buyDialog.name}
                </h3>
                <p className="mt-1">
                  <span className="font-numbers text-[#003366] text-3xl font-extrabold">
                    {formatPrice(buyDialog.price)}
                  </span>
                  {buyDialog.durationMonths >= 12 && (
                    <span className="font-numbers text-gray-500 text-sm">/year</span>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => !isProcessing && setBuyDialog(null)}
                aria-label="Close"
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <CloseIcon />
              </button>
            </div>

            {/* Benefits summary */}
            {buyDialog.features?.length > 0 && (
              <ul className="mt-5 space-y-1.5 max-h-48 overflow-y-auto">
                {buyDialog.features.map((feature, j) => (
                  <li
                    key={j}
                    className="flex items-start gap-2 text-gray-700 text-[14px] leading-snug"
                  >
                    <CheckIcon className="text-accent text-[16px]! mt-0.5 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Your details — no login required; account is created/linked after payment */}
            <div className="mt-5 space-y-3">
              <input
                className={fieldCls}
                placeholder={NAME_PLACEHOLDER}
                value={buyForm.name}
                onChange={(e) => setBuyForm((p) => ({ ...p, name: filterName(e.target.value) }))}
              />
              <input
                className={fieldCls}
                placeholder="Phone Number"
                value={buyForm.phone}
                onChange={(e) => setBuyForm((p) => ({ ...p, phone: e.target.value }))}
              />
              <input
                type="email"
                className={fieldCls}
                placeholder="Email"
                value={buyForm.email}
                onChange={(e) => setBuyForm((p) => ({ ...p, email: e.target.value }))}
              />
            </div>

            {/* Action */}
            <div className="mt-5">
              <button
                type="button"
                onClick={handlePurchase}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-dark disabled:opacity-60 text-white rounded-xl py-3 text-[15px] font-semibold transition-colors duration-200 cursor-pointer disabled:cursor-not-allowed"
              >
                {isProcessing && (
                  <CircularProgress size={18} sx={{ color: "#fff" }} />
                )}
                {isProcessing
                  ? "Processing..."
                  : `Proceed to Payment — ${formatPrice(buyDialog.price)}`}
              </button>
              <p className="text-[13px] text-gray-400 mt-2 text-center">
                Login details will be emailed to you after purchase.
              </p>
              <p className="text-[12px] text-gray-500 mt-1 text-center">
                Payments processed by {CLINIC_NAME}.
              </p>
            </div>

            {/* Terms & Conditions accordion (collapsed by default) */}
            {buyDialog.terms && (
              <div className="mt-4 border-t border-gray-100 pt-3">
                <button
                  type="button"
                  onClick={() => setShowTerms((s) => !s)}
                  className="w-full flex items-center justify-between text-[13px] font-semibold text-[#003366] cursor-pointer"
                  aria-expanded={showTerms}
                >
                  <span>Terms &amp; Conditions</span>
                  <span
                    className={`transition-transform duration-200 ${showTerms ? "rotate-180" : ""}`}
                  >
                    ▾
                  </span>
                </button>
                {showTerms && (
                  <p className="mt-2 text-[12px] text-gray-500 leading-relaxed">
                    {buyDialog.terms}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default PlansPage;

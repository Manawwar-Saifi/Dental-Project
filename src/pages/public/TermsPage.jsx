/**
 * Terms & Conditions (static)
 */
import BreadcrumbBanner from "../../components/public/BreadcrumbBanner";
import { CLINIC_NAME } from "../../constants/clinic.js";

const Section = ({ title, children }) => (
  <section className="mb-8">
    <h2 className="text-[#003366] text-xl font-bold mb-3">{title}</h2>
    <div className="text-gray-700 text-[15px] leading-[1.8] space-y-3">
      {children}
    </div>
  </section>
);

const TermsPage = () => {
  return (
    <>
      <title>Terms &amp; Conditions | Dental Clinic</title>
      <meta
        name="description"
        content="Terms & Conditions for Dental Clinic, Sonipat — appointment policies, payments, membership plans, cancellations, and patient data handling explained."
      />
      <meta name="keywords" content="Dental Clinic terms and conditions, dental clinic policy Sonipat" />
      <link rel="canonical" href="https://dentalclinic.example.com/terms" />
      <meta name="robots" content="index, follow" />
      <meta property="og:title" content="Terms & Conditions | Dental Clinic" />
      <meta
        property="og:description"
        content="Terms & Conditions for Dental Clinic, Sonipat — appointment policies, payments, membership plans, cancellations, and patient data handling."
      />
      <meta property="og:url" content="https://dentalclinic.example.com/terms" />
      <meta
        property="og:image"
        content="https://dentalclinic.example.com/dental-clinic-logo.png"
      />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content="Terms & Conditions | Dental Clinic" />
      <meta
        name="twitter:description"
        content="Terms & Conditions for Dental Clinic, Sonipat — appointment policies, payments, membership plans, and patient policies."
      />
      <meta
        name="twitter:image"
        content="https://dentalclinic.example.com/dental-clinic-logo.png"
      />
      <BreadcrumbBanner
        title="Terms & Conditions"
        breadcrumbs={[{ label: "Home", path: "/" }, { label: "Terms & Conditions" }]}
        showTitle={false}
      />

      <section className="py-[48px] md:py-[64px] bg-white">
        <div className="max-w-4xl mx-auto px-[32px]">
          <h1 className="text-[#003366] text-3xl font-bold mb-2">
            Terms &amp; Conditions
          </h1>
          <p className="text-gray-400 text-[14px] mb-2">
            Last updated: June 2, 2026
          </p>
          <p className="text-gray-500 text-[14px] mb-10">
            Operated by {CLINIC_NAME}.
          </p>

          <p className="text-gray-700 text-[15px] leading-[1.8] mb-8">
            These Terms &amp; Conditions govern your use of Dental Clinic's
            services, website, appointment booking, and membership plans. By
            booking an appointment or purchasing a plan, you agree to the terms
            below.
          </p>

          <Section title="1. Appointments & Cancellations">
            <p>
              Appointments can be booked online or by calling the clinic. We
              request at least <strong>24 hours' notice</strong> to cancel or
              reschedule an appointment. Cancellations made with less than 24
              hours' notice, or missed appointments, may be subject to a
              rebooking fee, and any OPD/registration fee paid may be
              non-refundable.
            </p>
            <p>
              Please arrive at least 10 minutes before your scheduled time. The
              clinic reserves the right to reschedule appointments due to
              emergencies or unforeseen circumstances.
            </p>
          </Section>

          <Section title="2. Payments & Fees">
            <p>
              Consultation (OPD) fees and membership payments are collected
              online through our secure payment partner (Razorpay) or at the
              clinic. All prices are listed in Indian Rupees (₹) and are
              inclusive of applicable taxes unless stated otherwise.
            </p>
            <p>
              Fees paid to confirm an appointment or purchase a membership are
              generally non-refundable except where required by law or at the
              clinic's discretion.
            </p>
          </Section>

          <Section title="3. Membership Plans">
            <p>
              Membership plans are valid for the period stated at the time of
              purchase (typically one year) and are{" "}
              <strong>non-transferable</strong> between individuals. Plans are
              valid at all Dental Clinic locations in Sonipat.
            </p>
            <p>
              Membership benefits and discounts <strong>cannot be combined</strong>{" "}
              with other offers, promotions, or third-party insurance unless
              expressly stated. The clinic reserves the right to modify, add, or
              discontinue plans, benefits, or pricing at any time; changes will
              not affect the benefits of an already-active membership for its
              current term.
            </p>
          </Section>

          <Section title="4. Patient Data & Privacy">
            <p>
              We collect and process personal and medical information to provide
              dental care. Your data is handled in accordance with our{" "}
              <a href="/privacy-policy" className="text-accent no-underline hover:underline">
                Privacy Policy
              </a>
              . Payment card details are never stored by the clinic — they are
              processed directly by our payment gateway.
            </p>
          </Section>

          <Section title="5. Limitation of Liability">
            <p>
              Dental treatment outcomes vary between individuals and cannot be
              guaranteed. To the maximum extent permitted by law, Dental Clinic
              Clinic is not liable for any indirect or consequential loss arising
              from the use of our website or services. Nothing in these terms
              limits liability that cannot be excluded under applicable law.
            </p>
          </Section>

          <Section title="6. Changes to These Terms">
            <p>
              We may update these Terms &amp; Conditions from time to time. The
              latest version will always be available on this page with the
              updated date shown above.
            </p>
          </Section>

          <Section title="7. Contact Us">
            <p>
              For any questions about these terms, contact us at{" "}
              <a href="tel:+918708362763" className="text-accent no-underline hover:underline">
                +91 8708362763
              </a>{" "}
              or{" "}
              <a
                href="mailto:contact@dentalclinic.example.com"
                className="text-accent no-underline hover:underline"
              >
                contact@dentalclinic.example.com
              </a>
              .
            </p>
          </Section>
        </div>
      </section>
    </>
  );
};

export default TermsPage;

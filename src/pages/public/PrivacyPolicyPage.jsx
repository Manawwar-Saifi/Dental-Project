/**
 * Privacy Policy (static)
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

const PrivacyPolicyPage = () => {
  return (
    <>
      <title>Privacy Policy | Dental Clinic</title>
      <meta
        name="description"
        content="Privacy Policy for Dental Clinic, Sonipat — how we collect, use, store, and protect your personal and medical information, and your data rights."
      />
      <meta name="keywords" content="Dental Clinic privacy policy, patient data protection Sonipat" />
      <link rel="canonical" href="https://dentalclinic.example.com/privacy-policy" />
      <meta name="robots" content="index, follow" />
      <meta property="og:title" content="Privacy Policy | Dental Clinic" />
      <meta
        property="og:description"
        content="Privacy Policy for Dental Clinic, Sonipat — how we collect, use, store, and protect your personal and medical information."
      />
      <meta property="og:url" content="https://dentalclinic.example.com/privacy-policy" />
      <meta
        property="og:image"
        content="https://dentalclinic.example.com/dental-clinic-logo.png"
      />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content="Privacy Policy | Dental Clinic" />
      <meta
        name="twitter:description"
        content="Privacy Policy for Dental Clinic, Sonipat — how we collect, use, store, and protect your personal and medical information."
      />
      <meta
        name="twitter:image"
        content="https://dentalclinic.example.com/dental-clinic-logo.png"
      />
      <BreadcrumbBanner
        title="Privacy Policy"
        breadcrumbs={[{ label: "Home", path: "/" }, { label: "Privacy Policy" }]}
        showTitle={false}
      />

      <section className="py-[48px] md:py-[64px] bg-white">
        <div className="max-w-4xl mx-auto px-[32px]">
          <h1 className="text-[#003366] text-3xl font-bold mb-2">
            Privacy Policy
          </h1>
          <p className="text-gray-400 text-[14px] mb-2">
            Last updated: June 2, 2026
          </p>
          <p className="text-gray-500 text-[14px] mb-10">
            Operated by {CLINIC_NAME}.
          </p>

          <p className="text-gray-700 text-[15px] leading-[1.8] mb-8">
            Dental Clinic ("we", "us") is committed to protecting your
            privacy. This policy explains what information we collect, how we use
            it, and the choices you have. It applies to our website, patient
            portal, and clinic services.
          </p>

          <Section title="1. Information We Collect">
            <p>To provide dental care and manage your account, we may collect:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Name, email address, phone number, and date of birth</li>
              <li>Gender and relevant medical / dental history</li>
              <li>Appointment details (clinic, date, time, reason for visit)</li>
              <li>
                Payment information processed via our payment gateway — we do{" "}
                <strong>not</strong> store your card numbers, CVV, or banking
                credentials
              </li>
              <li>Reports and documents you or our staff upload to your record</li>
            </ul>
          </Section>

          <Section title="2. How We Use Your Information">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>To book, confirm, and manage your appointments</li>
              <li>To provide treatment and maintain your dental records</li>
              <li>To process payments and memberships</li>
              <li>
                To send appointment confirmations, OTPs, and login details by
                email/SMS
              </li>
              <li>To improve our services and respond to your enquiries</li>
            </ul>
          </Section>

          <Section title="3. Data Storage & Security">
            <p>
              Your data is stored securely in a managed cloud database (MongoDB
              Atlas) with access restricted to authorized clinic staff. We use
              industry-standard measures including encrypted connections (HTTPS)
              and access controls to protect your information.
            </p>
          </Section>

          <Section title="4. Third-Party Services">
            <p>
              We rely on trusted third-party providers to operate our services.
              Your relevant data may be processed by:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>Razorpay</strong> — secure payment processing (card, UPI,
                net banking)
              </li>
              <li>
                <strong>Cloudinary</strong> — storage of reports and document
                uploads
              </li>
              <li>
                <strong>Google reCAPTCHA</strong> — spam and abuse prevention on
                forms
              </li>
              <li>
                <strong>Email service (Nodemailer)</strong> — sending OTPs,
                confirmations, and notifications
              </li>
            </ul>
            <p>
              These providers process data only as needed to deliver their
              service and under their own privacy and security policies.
            </p>
          </Section>

          <Section title="5. Your Rights & Data Deletion">
            <p>
              You may request access to, correction of, or deletion of your
              personal data held by us. To make a request, contact us using the
              details below. We will respond within a reasonable timeframe,
              subject to any legal or medical record-retention obligations.
            </p>
          </Section>

          <Section title="6. Changes to This Policy">
            <p>
              We may update this Privacy Policy periodically. The latest version
              will always be available on this page with the updated date shown
              above.
            </p>
          </Section>

          <Section title="7. Contact Us">
            <p>
              For privacy questions or data requests, contact us at{" "}
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

export default PrivacyPolicyPage;

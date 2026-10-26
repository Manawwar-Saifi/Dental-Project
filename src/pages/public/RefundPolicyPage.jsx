/**
 * Refund & Re-treatment Policy (static)
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

const RefundPolicyPage = () => {
  return (
    <>
      <title>Refund & Re-treatment Policy | Dental Clinic</title>
      <meta
        name="description"
        content="Read our refund and re-treatment policy — eligibility, process, timelines, and terms for dental treatment refunds and re-treatments at Dental Clinic."
      />
      <meta name="keywords" content="Dental Clinic refund policy, dental treatment re-treatment policy Sonipat" />
      <link rel="canonical" href="https://dentalclinic.example.com/refund-policy" />
      <meta name="robots" content="index, follow" />
      <meta property="og:title" content="Refund & Re-treatment Policy | Dental Clinic" />
      <meta
        property="og:description"
        content="Read our refund and re-treatment policy — eligibility, process, timelines, and terms for dental treatment refunds and re-treatments at Dental Clinic."
      />
      <meta property="og:url" content="https://dentalclinic.example.com/refund-policy" />
      <meta
        property="og:image"
        content="https://dentalclinic.example.com/dental-clinic-logo.png"
      />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content="Refund & Re-treatment Policy | Dental Clinic" />
      <meta
        name="twitter:description"
        content="Read our refund and re-treatment policy — eligibility, process, timelines, and terms for dental treatment refunds and re-treatments at Dental Clinic."
      />
      <meta
        name="twitter:image"
        content="https://dentalclinic.example.com/dental-clinic-logo.png"
      />
      <BreadcrumbBanner
        title="Refund & Re-treatment Policy"
        breadcrumbs={[{ label: "Home", path: "/" }, { label: "Refund & Re-treatment Policy" }]}
        showTitle={false}
      />

      <section className="py-[48px] md:py-[64px] bg-white">
        <div className="max-w-4xl mx-auto px-[32px]">
          <h1 className="text-[#003366] text-3xl font-bold mb-2">
            Refund & Re-treatment Policy
          </h1>
          <p className="text-gray-400 text-[14px] mb-2">
            Last updated: June 2, 2026
          </p>
          <p className="text-gray-500 text-[14px] mb-10">
            Operated by {CLINIC_NAME}.
          </p>

          <Section title="Refund Policy">
            <p>
              Refunds will be available when there is a wrong payment or
              incorrect card transaction into the clinic's account. Refunds
              are also available when there is a change in the patient's
              general medical condition — such as cardiac, pulmonary, or
              endocrine conditions — rendering the patient unsuitable for the
              said treatment.
            </p>
            <p>
              Dental treatment outcomes, like all medical treatment, depend on
              many factors including the condition and progress of the
              underlying disease, the patient's biology, pre- and
              post-treatment care, and patient compliance. If clinic
              management, subject to review by our Quality Processes,
              determines that a treatment outcome could have been better,
              refunds may be approved under sole discretion.
            </p>
          </Section>

          <Section title="Refund Modes">
            <p>Refunds are available in two modes:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Credit to the patient's bank account (takes 15–30 days)</li>
              <li>
                Credit Cover: a faster option where the refund is credited to
                the patient's account with the clinic, usable within one year
                for any treatment for themselves or anyone known to them,
                transferable via written request.
              </li>
            </ul>
            <p>
              Credit Cover advantage: no deductions for consultations,
              X-rays, diagnosis, or treatment planning — except for treatment
              already carried out such as scaling, extraction, or lab work.
            </p>
          </Section>

          <Section title="Refund Process">
            <p>The refund process takes 15–30 days and follows these steps:</p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>
                The process begins once a written request is received from
                the patient with reasons. The request must be initiated
                within 6 months of treatment.
              </li>
              <li>
                The patient submits documents, receipts, and X-rays, and
                returns any delivered dentures, crowns, aligners, failed
                implants, or orthodontic appliances to the treating clinic.
                No refund is eligible if there is loss of prosthesis or
                failure to return the implant.
              </li>
              <li>
                Our Quality Team reviews the refund request based on all
                facts and patient-provided records, and reserves full right
                to approve or decline.
              </li>
              <li>
                Consultations, X-rays, diagnosis, treatment planning, and
                membership plans are not eligible for refund and will be
                deducted. Lab charges for prosthesis, aligners, crowns, and
                dentures will also be deducted.
              </li>
            </ol>
          </Section>

          <Section title="When Refund Claims Are Not Eligible">
            <ol className="list-decimal pl-6 space-y-2">
              <li>
                Treatment has started, is part-completed, or a
                prosthesis/implant/bracket/crown has been ordered.
              </li>
              <li>
                The patient does not report for treatment for a long time and
                the condition deteriorates, or the fit has changed (as in
                dentures, crowns, or aligners).
              </li>
              <li>
                Six months have passed since treatment was completed, or the
                patient received treatment at any clinic outside this
                network.
              </li>
              <li>
                The patient did not comply with instructions or failed to
                report for further treatment (e.g., implant follow-ups or
                wearing retention plates in orthodontic treatment).
              </li>
              <li>
                Aligners: if impressions or scans have been done and the
                aligners have been ordered.
              </li>
              <li>
                If the aligner, crown, or denture has not been collected by
                the patient and the fit has changed due to shifting teeth,
                requiring new measurements.
              </li>
              <li>If the treatment was booked under a zero-interest finance scheme.</li>
            </ol>
          </Section>

          <Section title="Warranty on Crowns & Bridges">
            <ol className="list-decimal pl-6 space-y-2">
              <li>
                Crowns and bridges under lab warranty are limited to free
                replacement of the prosthesis if it cracks, chips, or comes
                out during the warranty period. The crown must be returned to
                avail warranty.
              </li>
              <li>
                If the crown or prosthesis is lost, the cost of remaking will
                be charged.
              </li>
              <li>
                Warranty covers the crown only, not the tooth. Pain in the
                tooth does not qualify for a refund on the crown.
              </li>
              <li>Warranty does not cover tooth fracture, tooth disease, or toothache.</li>
            </ol>
          </Section>

          <Section title="Compulsory Deductions on Cancellation">
            <ul className="list-disc pl-6 space-y-2">
              <li>Cancellation of Aligner work: ₹10,000</li>
              <li>Cancellation of Implant / Orthodontic treatment: ₹5,000</li>
              <li>Cancellation of any other treatment: ₹3,000</li>
            </ul>
          </Section>

          <Section title="Re-treatment Policy">
            <p>
              {CLINIC_NAME} aims to
              ensure the best clinical practices through highly qualified and
              trained doctors. However, if the outcome of any treatment is
              not on the desired lines due to various limitations,
              re-treatment will be undertaken on priority (limited to 6
              months unless otherwise specified) in the following cases:
            </p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>
                Loss of filling, breakage of appliance, or cementation
                failure.
              </li>
              <li>
                Treatment outcome not as per patient satisfaction — provided
                the patient was regular with appointments, post-operative
                check-ups, and followed instructions. If non-compliance led
                to the need for additional procedures, the cost difference
                will be borne by the patient.
              </li>
              <li>
                In case of failed treatment: re-treatment or alternate
                treatment will be undertaken at the clinic within 6 months.
              </li>
              <li>
                The patient must not have received treatment from a clinic
                outside this network to qualify for re-treatment.
              </li>
            </ol>
          </Section>

          <Section title="Orthodontic Re-treatment (within 1 year of completion)">
            <p>
              Qualifies if the patient complied with timely appointments and
              review visits, reported breakages of brackets/appliances
              immediately, wore retainers/aligners as advised, and did not
              delay visits.
            </p>
            <p>
              Does not qualify if the patient stops coming for 4 months at a
              stretch after treatment has started — the clinic reserves the
              right to cancel the treatment in such cases.
            </p>
          </Section>

          <Section title="Implant Re-treatment (within 1 year of completion)">
            <p>
              Qualifies if the patient came for balance treatment on time
              (implant surgery or crown/teeth fixing), followed
              post-operative instructions, maintained normal blood parameters
              (especially Serum Calcium and Vitamin D), abstained from
              smoking, and — if diabetic or hypertensive — attended timely
              post-operative check-ups.
            </p>
            <p>
              Does not qualify if the patient delayed coming for balance
              treatment; additional costs will apply as per procedure.
            </p>
          </Section>

          <Section title="Patient Relocation to Another City or Country">
            <ol className="list-decimal pl-6 space-y-2">
              <li>
                Treatment will continue, or re-treatment will be undertaken
                at any of our clinics after consultation with our doctors,
                subject to management approval on a case-to-case basis.
              </li>
              <li>
                For Orthodontic and Implant patients, if there is no in-house
                specialist of that specialty in the new city, the patient
                will bear visitation charges for an external specialist. If
                there is no clinic at all in the new city, no refunds are
                admissible and treatment will only be provided at the
                closest clinic.
              </li>
            </ol>
          </Section>

          <Section title="Management Rights">
            <p>
              In case a patient attempts to defame the clinic or its doctors,
              management reserves the right to reject any claim for refund
              or re-treatment. Management reserves the right to accept or
              reject any refund or re-treatment claim based on clinical
              findings and patient history, and if the patient has not
              followed instructions. Disputes, if any, are subject to the
              exclusive jurisdiction of Haryana courts, where {CLINIC_NAME} has its registered
              office.
            </p>
          </Section>
        </div>
      </section>
    </>
  );
};

export default RefundPolicyPage;

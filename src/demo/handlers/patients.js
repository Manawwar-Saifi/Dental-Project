/**
 * Demo handlers for /api/patients/* (except /patients/auth/*), ported from
 * the backend's patient.controller.js.
 */
import { all, findById, findOne, insert, remove } from "../core/db.js";
import { DemoError, file, notFound, notInDemo, ok, created, paginated } from "../core/http.js";
import { currentPatient, currentUser, requirePatient, requireUser } from "../core/auth.js";
import { count, findWhere, populate, populateAll, sortBy, sumBy, where } from "../core/query.js";
import { hasActiveMembership, currentDiscount, patientJSON } from "../lib/patients-shape.js";
import { childSessions, isObjectId } from "../lib/appointments-common.js";

// ---------------------------------------------------------------- helpers

/** page/limit exactly like `parseInt(page)` / `parseInt(limit)` with defaults 1 / 10. */
const pageOf = (query, defaultLimit = 10) => {
  const page = parseInt(query.page ?? 1, 10) || 1;
  const limit = parseInt(query.limit ?? defaultLimit, 10) || defaultLimit;
  return { page, limit, skip: (page - 1) * limit };
};

const sliceList = (list, query, defaultLimit = 10) => {
  const { page, limit, skip } = pageOf(query, defaultLimit);
  return { items: list.slice(skip, skip + limit), page, limit, total: list.length };
};

/** anyAuth + patientSelfOrAdmin. */
function requireSelfOrAdmin(req) {
  const user = currentUser(req);
  if (user && user.isActive !== false) return { user };
  const patient = currentPatient(req);
  if (patient && patient.isActive !== false) {
    if (String(patient._id) === String(req.params.id)) return { patient };
    throw new DemoError(403, "Not authorized to access this resource");
  }
  throw new DemoError(401, "Not authorized");
}

const getPatientOr404 = (id) => {
  const patient = findById("Patient", id);
  if (!patient) throw notFound("Patient");
  return patient;
};

const regex = (text) => new RegExp(text, "i");
const safeRegex = (text) => {
  try {
    return regex(text);
  } catch {
    return regex(String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  }
};

function buildPatientQuery({ search, isActive, hasMembership, membership }) {
  const query = {};
  const conditions = [];
  if (isActive === "all") {
    // everyone
  } else if (isActive === undefined || isActive === "") {
    query.isActive = true;
  } else {
    query.isActive = isActive === "true";
  }
  if (search) {
    const r = safeRegex(search);
    conditions.push({ $or: [{ name: r }, { phone: r }, { email: r }] });
  }
  if (hasMembership === "true") conditions.push({ "membership.status": "active" });
  else if (hasMembership === "false") {
    conditions.push({ $or: [{ "membership.status": { $ne: "active" } }, { membership: { $exists: false } }] });
  }
  if (membership === "active") conditions.push({ "membership.status": "active" });
  else if (membership === "expired") conditions.push({ "membership.status": "expired" });
  else if (membership === "none") {
    conditions.push({ $or: [{ membership: { $exists: false } }, { "membership.status": { $exists: false } }] });
  }
  if (conditions.length) query.$and = conditions;
  return query;
}

const withClinic = (patient, select = "name code") =>
  populate(patientJSON(patient), "preferredClinic", "Clinic", select);

const csvEscape = (value) => {
  const str = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
};

const formatAddress = (a) => (a ? [a.street, a.city, a.state, a.pincode].filter(Boolean).join(", ") : "");
const membershipLabel = (m) => (!m?.status ? "None" : m.planName || m.status);

const PORTAL_STATUS = (treatmentStatus) =>
  !treatmentStatus ? "in_progress" : treatmentStatus === "completed" ? "completed" : "cancelled";

// ---------------------------------------------------------------- routes

export default function register(r) {
  // GET /patients
  r.get("/patients", (req) => {
    requireUser(req);
    const { search, isActive, hasMembership, membership } = req.query;
    const list = sortBy(where("Patient", buildPatientQuery({ search, isActive, hasMembership, membership })), "-createdAt");
    const page = sliceList(list, req.query);
    return paginated(page.items.map((p) => withClinic(p)), page);
  });

  // GET /patients/search?q=
  r.get("/patients/search", (req) => {
    requireUser(req);
    const { q, phone, limit = 10 } = req.query;
    const query = { isActive: true };
    if (phone) query.phone = safeRegex(phone);
    else if (q) query.$or = [{ name: safeRegex(q) }, { phone: safeRegex(q) }];
    const patients = sortBy(where("Patient", query), "name")
      .slice(0, parseInt(limit, 10) || 10)
      .map((p) => ({
        _id: p._id,
        name: p.name,
        phone: p.phone,
        ...(p.email !== undefined ? { email: p.email } : {}),
        ...(p.membership !== undefined ? { membership: p.membership } : {}),
        hasMembership: hasActiveMembership(p),
        currentDiscount: currentDiscount(p),
        calculatedAge: null,
        id: String(p._id),
      }));
    return ok({ patients }, "Search results");
  });

  // GET /patients/export?format=csv|pdf
  r.get("/patients/export", (req) => {
    requireUser(req);
    const { format = "csv", search, isActive, hasMembership, membership } = req.query;
    if (format === "pdf") throw notInDemo("PDF export isn't available in the demo. Try CSV instead.");
    const patients = sortBy(where("Patient", buildPatientQuery({ search, isActive, hasMembership, membership })), "-createdAt");
    const header = ["Name", "Phone", "Email", "Address", "Registered Date", "Status", "Membership"];
    const rows = patients.map((p) =>
      [
        p.name || "",
        p.phone || "",
        p.email || "",
        formatAddress(p.address),
        p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-IN") : "",
        p.isActive ? "Active" : "Inactive",
        membershipLabel(p.membership),
      ]
        .map(csvEscape)
        .join(",")
    );
    const csv = "﻿" + [header.join(","), ...rows].join("\r\n");
    return file(csv, { filename: `patients-export-${Date.now()}.csv`, type: "text/csv; charset=utf-8" });
  });

  // GET /patients/me (the logged-in patient)
  r.get("/patients/me", (req) => {
    const patient = requirePatient(req);
    return ok({ patient: withClinic(patient, "name code address") }, "Patient fetched successfully");
  });

  // GET /patients/:id
  r.get("/patients/:id", (req) => {
    requireSelfOrAdmin(req);
    const patient = getPatientOr404(req.params.id);
    return ok({ patient: withClinic(patient, "name code address") }, "Patient fetched successfully");
  });

  // POST /patients
  r.post("/patients", (req) => {
    requireUser(req);
    const b = req.body || {};
    const { name, phone, email } = b;
    if (!name || !phone) throw new DemoError(400, "Name and phone are required");
    if (/\d/.test(name)) throw new DemoError(400, "Name cannot contain numbers");
    if (!/^[6-9]\d{9}$/.test(phone)) throw new DemoError(400, "Please provide a valid 10-digit phone number");
    if (findOne("Patient", (p) => p.phone === phone)) {
      throw new DemoError(409, "Patient with this phone number already exists");
    }
    if (email && findOne("Patient", (p) => p.email === String(email).toLowerCase())) {
      throw new DemoError(409, "Patient with this email already exists");
    }
    const doc = { phone, name: String(name).trim(), isActive: true, membershipHistory: [], allergies: [], medicalHistory: [], __v: 0 };
    if (email) doc.email = String(email).toLowerCase();
    for (const field of ["gender", "dateOfBirth", "age", "address", "bloodGroup", "allergies", "medicalHistory", "emergencyContact", "preferredClinic", "notes"]) {
      if (b[field] !== undefined && b[field] !== "") doc[field] = b[field];
    }
    if (doc.dateOfBirth) doc.dateOfBirth = new Date(doc.dateOfBirth).toISOString();
    if (doc.address && !doc.address.state) doc.address = { state: "Haryana", ...doc.address };
    const patient = insert("Patient", doc);
    return created({ patient: patientJSON(patient) }, "Patient created successfully");
  });

  // PATCH /patients/:id
  r.patch("/patients/:id", (req) => {
    requireSelfOrAdmin(req);
    const patient = getPatientOr404(req.params.id);
    const b = req.body || {};
    if (b.email && String(b.email).toLowerCase() !== patient.email) {
      const taken = all("Patient").some(
        (p) => p.email === String(b.email).toLowerCase() && String(p._id) !== String(patient._id)
      );
      if (taken) throw new DemoError(400, "Email is already in use");
    }
    if (b.isActive === false && hasActiveMembership(patient)) {
      throw new DemoError(
        400,
        "Cannot deactivate a patient with an active membership plan. Please cancel or expire the membership first."
      );
    }
    const allowed = ["name", "email", "gender", "dateOfBirth", "age", "address", "bloodGroup", "allergies", "medicalHistory", "emergencyContact", "preferredClinic", "notes", "isActive"];
    for (const field of allowed) {
      if (b[field] === undefined) continue;
      if (field === "email" && b.email) patient.email = String(b.email).toLowerCase();
      else if (field === "dateOfBirth" && b.dateOfBirth) patient.dateOfBirth = new Date(b.dateOfBirth).toISOString();
      else patient[field] = b[field];
    }
    if (hasActiveMembership(patient)) patient.isActive = true;
    patient.updatedAt = new Date().toISOString();
    return ok({ patient: withClinic(patient) }, "Patient updated successfully");
  });

  // DELETE /patients/:id (hard delete of an inactive patient)
  r.delete("/patients/:id", (req) => {
    requireUser(req);
    if (!isObjectId(req.params.id)) throw new DemoError(400, "Invalid patient ID");
    const patient = getPatientOr404(req.params.id);
    if (patient.isActive === true) {
      throw new DemoError(400, "Only inactive patients can be permanently deleted. Please deactivate the patient first.");
    }
    if (patient.membership?.status === "active") throw new DemoError(400, "Cannot delete patient with active membership.");
    remove("Patient", patient._id);
    return ok({ name: patient.name }, `Patient "${patient.name}" has been permanently deleted.`);
  });

  // PATCH /patients/:id/reactivate
  r.patch("/patients/:id/reactivate", (req) => {
    requireUser(req);
    const patient = getPatientOr404(req.params.id);
    patient.isActive = true;
    patient.updatedAt = new Date().toISOString();
    return ok({ patient: patientJSON(patient) }, "Patient reactivated successfully");
  });

  // PATCH /patients/:id/reset-password (nothing is stored in the demo)
  r.patch("/patients/:id/reset-password", (req) => {
    requireUser(req);
    const patient = getPatientOr404(req.params.id);
    const { newPassword, generate } = req.body || {};
    let temp;
    if (generate) {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
      temp = Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("") + "a7";
    } else if (!(typeof newPassword === "string" && newPassword.length >= 10 && /[A-Za-z]/.test(newPassword) && /[0-9]/.test(newPassword))) {
      throw new DemoError(400, "Password must be at least 10 characters and include at least one letter and one number");
    }
    patient.updatedAt = new Date().toISOString();
    return ok(
      { patientId: patient._id, ...(generate ? { temporaryPassword: temp } : {}) },
      generate ? "Temporary password generated" : "Password updated successfully"
    );
  });

  // GET /patients/:id/profile
  r.get("/patients/:id/profile", (req) => {
    requireUser(req);
    const patient = getPatientOr404(req.params.id);
    const id = String(patient._id);
    const pending = where("Invoice", { patient: id, paymentStatus: { $in: ["unpaid", "partial"] }, status: { $ne: "cancelled" } });
    const last = sortBy(where("Appointment", { patient: id, status: "completed" }), "-date")[0];
    return ok(
      {
        patient: withClinic(patient),
        summary: {
          totalAppointments: count("Appointment", { patient: id, status: { $ne: "pending" } }),
          totalTreatments: count("Treatment", { patient: id }),
          totalInvoices: count("Invoice", { patient: id }),
          pendingBalance: sumBy(pending, "balanceDue"),
          lastVisit: last ? last.date : null,
        },
      },
      "Patient profile fetched"
    );
  });

  // GET /patients/:id/appointments (OPD visits only)
  r.get("/patients/:id/appointments", (req) => {
    requireUser(req);
    const patient = getPatientOr404(req.params.id);
    const query = { patient: String(patient._id), visitType: "opd", status: { $ne: "pending" } };
    if (req.query.status) query.status = req.query.status;
    const list = sortBy(where("Appointment", query), "-date");
    const page = sliceList(list, req.query);
    return paginated(populateAll(page.items, "clinic", "Clinic", "name code"), page);
  });

  // GET /patients/:id/treatments (treatment-plan appointments, reshaped for the portal)
  r.get("/patients/:id/treatments", (req) => {
    requireSelfOrAdmin(req);
    const patient = getPatientOr404(req.params.id);
    const { status } = req.query;
    const { page, limit, skip } = pageOf(req.query);
    const all_ = sortBy(where("Appointment", { patient: String(patient._id), visitType: "treatment", status: { $ne: "pending" } }), "-createdAt");
    let appointments = status ? all_ : all_.slice(skip, skip + limit);
    let total = all_.length;

    let treatments = appointments.map((a) => {
      const tm = a.treatmentId ? findById("TreatmentMaster", a.treatmentId) : null;
      const invoice = a.invoice ? findById("Invoice", a.invoice) : null;
      const opd = a.originatingOpdAppointment ? findById("Appointment", a.originatingOpdAppointment) : null;
      const sessions = childSessions(a._id, { visitType: "treatment_session" }).map((s) => ({ status: s.status }));
      return {
        _id: a._id,
        appointmentNumber: a.appointmentNumber,
        originatingOpdAppointment: opd ? { _id: opd._id, appointmentNumber: opd.appointmentNumber } : null,
        name: a.treatmentName || tm?.name || "Treatment",
        treatmentType: tm ? { name: tm.name, category: tm.category, price: tm.price } : null,
        clinic: populate(a, "clinic", "Clinic", "name code").clinic,
        startDate: a.createdAt,
        createdAt: a.createdAt,
        sessions: [{ status: a.status }, ...sessions],
        sessionsPlanned: a.sessionsPlanned || null,
        cost: invoice?.grandTotal ?? a.fee ?? 0,
        status: PORTAL_STATUS(a.treatmentStatus),
      };
    });
    if (status) {
      treatments = treatments.filter((t) => t.status === status);
      total = treatments.length;
      treatments = treatments.slice(skip, skip + limit);
    }
    return paginated(treatments, { page, limit, total });
  });

  // GET /patients/:id/payments
  r.get("/patients/:id/payments", (req) => {
    requireSelfOrAdmin(req);
    const patient = getPatientOr404(req.params.id);
    const id = String(patient._id);
    const list = sortBy(where("Payment", { patient: id }), "-createdAt");
    const page = sliceList(list, req.query);
    let payments = populateAll(page.items, "invoice", "Invoice", "invoiceNumber grandTotal");
    payments = populateAll(payments, "treatmentType", "TreatmentMaster", "name");
    const paid = where("Payment", { patient: id, status: "paid" });
    const summary = { totalPaid: sumBy(paid, "amount"), paymentCount: paid.length };
    return paginated({ payments, summary }, page);
  });

  // GET /patients/:id/invoices
  r.get("/patients/:id/invoices", (req) => {
    requireSelfOrAdmin(req);
    const patient = getPatientOr404(req.params.id);
    const query = { patient: String(patient._id) };
    if (req.query.status) query.status = req.query.status;
    const page = sliceList(sortBy(where("Invoice", query), "-createdAt"), req.query);
    return paginated(populateAll(page.items, "clinic", "Clinic", "name code"), page);
  });

  // GET /patients/:id/reports
  r.get("/patients/:id/reports", (req) => {
    requireUser(req);
    const patient = getPatientOr404(req.params.id);
    const query = { patient: String(patient._id), isActive: true };
    if (req.query.category) query.category = req.query.category;
    const page = sliceList(sortBy(where("Report", query), "-createdAt"), req.query);
    return paginated(populateAll(page.items, "uploadedBy", "User", "name"), page);
  });

  // GET /patients/:id/tests
  r.get("/patients/:id/tests", (req) => {
    requireUser(req);
    const patient = getPatientOr404(req.params.id);
    const query = { patient: String(patient._id) };
    if (req.query.status) query.status = req.query.status;
    const page = sliceList(sortBy(where("Test", query), "-createdAt"), req.query);
    let tests = populateAll(page.items, "testType", "TestMaster", "name code category price");
    tests = populateAll(tests, "clinic", "Clinic", "name code");
    return paginated(tests, page);
  });

  // GET /patients/:id/membership
  r.get("/patients/:id/membership", (req) => {
    requireSelfOrAdmin(req);
    const patient = getPatientOr404(req.params.id);
    let currentMembership = patient.membership ? populate(patient, "membership.plan", "MembershipPlan").membership : null;
    if (currentMembership && !currentMembership.plan && currentMembership.planName) {
      const byName = findWhere("MembershipPlan", { name: currentMembership.planName });
      if (byName) currentMembership = { ...currentMembership, plan: byName };
    }
    return ok(
      {
        currentMembership,
        membershipHistory: patient.membershipHistory || [],
        hasMembership: hasActiveMembership(patient),
        currentDiscount: currentDiscount(patient),
      },
      "Patient membership fetched"
    );
  });

  // GET /patients/:id/active-context
  r.get("/patients/:id/active-context", (req) => {
    requireUser(req);
    const { id } = req.params;
    if (!isObjectId(id)) throw new DemoError(400, "Invalid patient ID");
    const treatmentAppts = sortBy(
      where("Appointment", { patient: id, visitType: "treatment", status: { $ne: "cancelled" }, treatmentStatus: { $in: [null] } }),
      "-createdAt"
    );
    if (!treatmentAppts.length) return ok({ activeTreatments: [] });
    const invoices = where("Invoice", { patient: id, paymentStatus: { $in: ["unpaid", "partial", "paid"] } });
    if (!invoices.length) return ok({ activeTreatments: [] });

    const used = new Set();
    const enriched = treatmentAppts.map((t) => {
      const apptId = String(t._id);
      const invoice =
        invoices.find((inv) => t.invoice && String(inv._id) === String(t.invoice)) ||
        invoices.find((inv) => inv.appointment && String(inv.appointment) === apptId) ||
        invoices.find((inv) => !used.has(String(inv._id)));
      if (!invoice) return null;
      used.add(String(invoice._id));
      const sessionsCount = childSessions(t._id, { status: { $ne: "cancelled" } }).length;
      const sessionsBooked = sessionsCount + 1;
      const sessionsPlanned = t.sessionsPlanned || null;
      const sessionsRemaining = sessionsPlanned ? Math.max(0, sessionsPlanned - sessionsBooked) : null;
      if (sessionsPlanned !== null && sessionsBooked >= sessionsPlanned && invoice.balanceDue === 0) return null;
      return {
        parentAppointmentId: t._id,
        treatmentName: t.treatmentName || t.customTreatmentName || "Treatment",
        parentDate: t.date,
        parentTimeSlot: t.timeSlot,
        createdAt: t.createdAt,
        invoice: {
          _id: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          grandTotal: invoice.grandTotal,
          amountPaid: invoice.amountPaid,
          balanceDue: invoice.balanceDue,
          paymentStatus: invoice.paymentStatus,
        },
        sessionsBooked,
        sessionsPlanned,
        sessionsRemaining,
        nextSessionNumber: sessionsCount + 2,
        isPaidInFull: invoice.paymentStatus === "paid",
        suggestedPaymentPerSession:
          sessionsPlanned && invoice.balanceDue > 0 && sessionsRemaining > 0
            ? Math.ceil(invoice.balanceDue / sessionsRemaining)
            : null,
      };
    });

    const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
    const activeTreatments = enriched.filter(Boolean).filter((t) => {
      if (!t.isPaidInFull) return true;
      if (Date.parse(t.createdAt) > cutoff) return true;
      return childSessions(t.parentAppointmentId, { status: { $ne: "cancelled" } }).some(
        (s) => Date.parse(s.createdAt) > cutoff
      );
    });
    return ok({ activeTreatments });
  });
}

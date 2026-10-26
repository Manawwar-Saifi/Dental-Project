/**
 * Demo handlers for /api/appointments/*, ported from the backend's
 * appointment.controller.js (+ appointmentToken.js). Emails, WhatsApp,
 * in-app notifications and Razorpay calls are skipped; online payments are
 * simulated (any pending payment linked to a hold is accepted on confirm).
 */
import { all, findById, findOne, insert, newId, nowIso, remove } from "../core/db.js";
import { DemoError, created, notFound, ok, paginated } from "../core/http.js";
import { currentPatient, currentUser, requirePatient, requireUser } from "../core/auth.js";
import { escapeRegex, istDateString, istDayRange, populate, sortBy, where } from "../core/query.js";
import { hasActiveMembership, patientJSON, populatedPatient } from "../lib/patients-shape.js";
import {
  MIN_BACKDATE_DAYS,
  assignIdentifiers,
  calculateInvoiceTotals,
  canBackdate,
  childSessions,
  countSlot,
  createAppointmentDoc,
  createPayment,
  generateInvoice,
  isObjectId,
  istHourMinute,
  istStartOfDay,
  nextDailyToken,
  slotCapacityFor,
  toDateIso,
  validateAppointmentSlot,
} from "../lib/appointments-common.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const ADMIN_PAYMENT_METHODS = ["cash", "upi", "razorpay"];
const PENDING_HOLD_MS = 15 * 60 * 1000;

const toPaymentMode = (m) =>
  m === "cash" ? "cash" : m === "upi" ? "upi" : m === "razorpay" || m === "online" ? "razorpay" : "other";

const fail = (status, message) => new DemoError(status, message);

const feeSettings = () =>
  all("SystemSettings")[0]?.feeSettings || { opdFeeRegular: 300, opdFeeEmergency: 500 };

// ---------------------------------------------------------------- populate helpers

const withPatient = (doc, select) => ({ ...doc, patient: populatedPatient(doc.patient, select) });

/** Apply a list of [path, model, select] populates; "patient" gets patient virtuals. */
function populateDoc(doc, specs) {
  let out = doc;
  for (const [path, model, select] of specs) {
    out = path === "patient" && model === "Patient" ? withPatient(out, select) : populate(out, path, model, select);
  }
  return out;
}

const LIST_POPULATE = [
  ["patient", "Patient", "name phone"],
  ["clinic", "Clinic", "name code"],
  ["originatingOpdAppointment", "Appointment", "appointmentNumber date"],
  ["treatmentId", "TreatmentMaster", "name"],
  ["invoice", "Invoice", "invoiceNumber grandTotal amountPaid balanceDue paymentStatus items discount"],
];

const getAppointmentOr404 = (id) => {
  const appt = findById("Appointment", id);
  if (!appt) throw notFound("Appointment");
  return appt;
};

/** anyAuth + appointmentSelfOrAdmin. Returns { user } or { patient }. */
function requireAppointmentAccess(req) {
  const user = currentUser(req);
  if (user && user.isActive !== false) return { user };
  const patient = currentPatient(req);
  if (patient && patient.isActive !== false) {
    const appt = findById("Appointment", req.params.id);
    if (!appt) throw notFound("Appointment");
    if (String(appt.patient) === String(patient._id)) return { patient };
    throw fail(403, "Not authorized to access this resource");
  }
  throw fail(401, "Not authorized");
}

/** UTC-midnight day range of a date (the backend's setHours on a UTC server). */
const utcDayRange = (value) => {
  const d = new Date(value);
  const start = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return { start: new Date(start), end: new Date(start + DAY_MS - 1) };
};

const slotMinutes = (slot) => {
  const [h, m] = String(slot).split(":").map(Number);
  return h * 60 + m;
};

function newPatientDoc({ name, phone, email, registeredBy }) {
  return insert("Patient", {
    phone,
    ...(email ? { email: String(email).toLowerCase() } : {}),
    name: String(name).trim(),
    allergies: [],
    medicalHistory: [],
    membershipHistory: [],
    ...(registeredBy ? { registeredBy: String(registeredBy) } : {}),
    isActive: true,
    __v: 0,
  });
}

const fakeId = (prefix) => `${prefix}_demo${Math.random().toString(36).slice(2, 12)}`;

/** Simulated Razorpay payment link for an invoice. */
function attachPaymentLink(appointment, invoice) {
  const paymentLinkId = fakeId("plink");
  const shortUrl = `https://rzp.io/i/${paymentLinkId.slice(-8)}`;
  invoice.paymentLink = { id: paymentLinkId, shortUrl, status: "created", createdAt: nowIso(), paidAt: null };
  appointment.paymentLinkUrl = shortUrl;
  appointment.paymentLinkId = paymentLinkId;
  appointment.paymentLinkStatus = "created";
  return { shortUrl, paymentLinkId, whatsappSent: true };
}

const bookingSummary = (appointment, patient, extra = {}) => ({
  appointmentId: appointment._id,
  appointmentNumber: appointment.appointmentNumber,
  tokenNumber: appointment.tokenNumber,
  status: appointment.status,
  ...extra,
  patient: { id: patient._id, name: patient.name, phone: patient.phone },
});

// ---------------------------------------------------------------- routes

export default function register(r) {
  // ---------- GET /appointments
  r.get("/appointments", (req) => {
    requireUser(req);
    const { page = 1, limit = 10, date, clinic, status, appointmentType, visitType, search, parentAppointment, patient, treatmentStatus } = req.query;
    const filter = {};
    if (clinic && isObjectId(clinic)) filter.clinic = clinic;
    if (parentAppointment && isObjectId(parentAppointment)) filter.parentAppointment = parentAppointment;
    if (patient && isObjectId(patient)) filter.patient = patient;
    if (status && status !== "all") {
      filter.status = status.includes(",") ? { $in: status.split(",").map((s) => s.trim()) } : status;
    }
    if (treatmentStatus === "active") filter.treatmentStatus = { $in: [null] };
    else if (treatmentStatus === "completed") filter.treatmentStatus = { $nin: [null] };
    if (appointmentType) filter.appointmentType = appointmentType;
    if (visitType) {
      filter.visitType = visitType.includes(",") ? { $in: visitType.split(",").map((v) => v.trim()) } : visitType;
    }
    if (date) {
      const { start, end } = utcDayRange(date);
      filter.date = { $gte: start, $lte: end };
    }
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    if (search && search.trim()) {
      const re = new RegExp(escapeRegex(search.trim()), "i");
      const ids = where("Patient", { $or: [{ name: re }, { phone: re }] }).map((p) => p._id);
      if (!ids.length) return paginated([], { page: pageNum, limit: limitNum, total: 0 }, "Appointments fetched");
      filter.patient = { $in: ids };
    }
    filter.$and = [{ status: { $ne: "pending" } }];

    const list = sortBy(where("Appointment", filter), { date: -1, timeSlot: 1 });
    const items = list.slice((pageNum - 1) * limitNum, pageNum * limitNum).map((a) => populateDoc(a, LIST_POPULATE));
    return paginated(items, { page: pageNum, limit: limitNum, total: list.length }, "Appointments fetched");
  });

  // ---------- GET /appointments/today
  r.get("/appointments/today", (req) => {
    requireUser(req);
    const { start, end } = istDayRange(istDateString());
    const list = sortBy(
      where("Appointment", { date: { $gte: start, $lte: end }, status: { $nin: ["cancelled", "pending"] } }),
      "tokenNumber"
    ).map((a) => populateDoc(a, [["patient", "Patient", "name phone"], ["clinic", "Clinic", "name"]]));
    return ok(list, "Today's appointments fetched");
  });

  // ---------- GET /appointments/upcoming
  r.get("/appointments/upcoming", (req) => {
    requireUser(req);
    const days = Number(req.query.days ?? 7) || 7;
    const start = istStartOfDay(istDateString());
    const end = new Date(start.getTime() + (days + 1) * DAY_MS - 1);
    const list = sortBy(
      where("Appointment", { date: { $gte: start, $lte: end }, status: "scheduled" }),
      { date: 1, timeSlot: 1 }
    ).map((a) => populateDoc(a, [["patient", "Patient", "name phone"], ["clinic", "Clinic", "name"]]));
    return ok(list, "Upcoming appointments fetched");
  });

  // ---------- GET /appointments/stale-treatments
  r.get("/appointments/stale-treatments", (req) => {
    requireUser(req);
    const cutoff = Date.now() - 90 * DAY_MS;
    const candidates = where("Appointment", {
      visitType: "treatment",
      treatmentStatus: null,
      sessionsPlanned: { $ne: null, $gt: 0 },
      status: { $nin: ["cancelled", "pending"] },
    });
    const stale = [];
    for (const parent of candidates) {
      const sessions = sortBy(childSessions(parent._id, { status: { $nin: ["cancelled", "pending"] } }), "-createdAt");
      const sessionsBooked = sessions.length + 1;
      if (sessionsBooked >= parent.sessionsPlanned) continue;
      const lastActivity = sessions[0]?.createdAt || parent.createdAt;
      if (Date.parse(lastActivity) > cutoff) continue;
      const populated = populateDoc(parent, [["patient", "Patient", "name phone"], ["clinic", "Clinic", "name code"]]);
      stale.push({
        appointmentId: parent._id,
        patient: populated.patient,
        clinic: populated.clinic,
        treatmentName: parent.treatmentName,
        sessionsBooked,
        sessionsPlanned: parent.sessionsPlanned,
        lastActivity,
        daysSinceActivity: Math.floor((Date.now() - Date.parse(lastActivity)) / DAY_MS),
      });
    }
    stale.sort((a, b) => b.daysSinceActivity - a.daysSinceActivity);
    return ok({ staleTreatments: stale, count: stale.length }, "Stale treatments fetched");
  });

  // ---------- GET /appointments/unbilled
  r.get("/appointments/unbilled", (req) => {
    requireUser(req);
    const fields = ["_id", "appointmentNumber", "patient", "clinic", "visitType", "fee", "opdFee", "status", "paymentStatus", "invoiceError", "date", "createdAt"];
    const list = sortBy(
      where("Appointment", {
        invoice: { $in: [null] },
        isFree: { $ne: true },
        status: { $nin: ["cancelled", "pending"] },
        $or: [{ fee: { $gt: 0 } }, { opdFee: { $gt: 0 } }],
      }),
      "-createdAt"
    ).map((a) => {
      const slim = Object.fromEntries(fields.filter((f) => a[f] !== undefined).map((f) => [f, a[f]]));
      return populate(populate(slim, "patient", "Patient", "name phone"), "clinic", "Clinic", "name code");
    });
    return ok({ unbilledAppointments: list, count: list.length }, "Unbilled appointments fetched");
  });

  // ---------- GET /appointments/available-slots
  r.get("/appointments/available-slots", (req) => {
    const user = currentUser(req);
    const { clinic: clinicId, date, bookingType } = req.query;
    const capacity = slotCapacityFor(bookingType);
    if (!clinicId || !date) throw fail(400, "Clinic and date are required");
    if (!isObjectId(clinicId)) throw fail(400, "Invalid clinic ID");
    const requested = new Date(date);
    if (Number.isNaN(requested.getTime())) throw fail(400, "Invalid date format");

    const allSlots = [];
    for (let h = 9; h < 22; h++) {
      for (let m = 0; m < 60; m += 30) allSlots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
    const counts = {};
    for (const slot of allSlots) counts[slot] = countSlot({ clinic: clinicId, date, timeSlot: slot });
    const bookedSlots = allSlots.filter((s) => counts[s] >= capacity);
    let availableSlots = allSlots.filter((s) => counts[s] < capacity);

    const startOfDay = istStartOfDay(date);
    const todayStart = istStartOfDay(istDateString());
    if (startOfDay < todayStart) {
      if (canBackdate(user)) {
        if (startOfDay < new Date(todayStart.getTime() - MIN_BACKDATE_DAYS * DAY_MS)) availableSlots = [];
      } else {
        availableSlots = [];
      }
    } else if (startOfDay.getTime() === todayStart.getTime() && !canBackdate(user)) {
      const { hour, minute } = istHourMinute();
      availableSlots = availableSlots.filter((s) => slotMinutes(s) > hour * 60 + minute);
    }

    return ok(
      {
        date: requested.toISOString().split("T")[0],
        clinic: clinicId,
        bookingType: bookingType === "emergency" ? "emergency" : "regular",
        capacity,
        totalSlots: allSlots.length,
        bookedSlots: bookedSlots.length,
        availableSlots,
      },
      "Available slots fetched successfully"
    );
  });

  // ---------- GET /appointments/:id  (falls through to the by-phone lookup)
  r.get("/appointments/:id", (req) => {
    const { id } = req.params;
    if (isObjectId(id)) {
      requireAppointmentAccess(req);
      const appt = getAppointmentOr404(id);
      if (appt.status === "pending") throw notFound("Appointment");
      const data = populateDoc(appt, [
        ["patient", "Patient", "name phone email hasMembership currentDiscount"],
        ["clinic", "Clinic", "name code address"],
        ["createdBy", "User", "name"],
        ["treatmentId", "TreatmentMaster", "name"],
        ["originatingOpdAppointment", "Appointment", "appointmentNumber date"],
        ["invoice", "Invoice", "invoiceNumber items subtotal discount totalTax grandTotal amountPaid balanceDue paymentStatus"],
      ]);
      const payment = findOne("Payment", (p) => String(p.appointment) === String(id));
      data.payment = payment
        ? Object.fromEntries(
            ["_id", "paymentNumber", "amount", "paymentMode", "status", "paidAt", "razorpayPaymentId"]
              .filter((k) => payment[k] !== undefined)
              .map((k) => [k, payment[k]])
          )
        : null;
      return ok({ appointment: data }, "Appointment fetched successfully");
    }

    // phoneSelfOrAdmin
    const user = currentUser(req);
    const me = currentPatient(req);
    if (!(user && user.isActive !== false)) {
      if (!me) throw fail(401, "Not authorized");
      if (me.phone !== id) throw fail(403, "Not authorized to access this resource");
    }
    const patient = findOne("Patient", (p) => p.phone === id);
    if (!patient) throw notFound("Patient");
    const appointments = sortBy(
      where("Appointment", { patient: String(patient._id), status: { $ne: "pending" } }),
      "-date"
    ).map((a) =>
      populateDoc(a, [
        ["patient", "Patient", "name phone"],
        ["clinic", "Clinic", "name code"],
        ["createdBy", "User", "name"],
        ["treatmentId", "TreatmentMaster", "name"],
        ["invoice", "Invoice", "invoiceNumber grandTotal amountPaid balanceDue paymentStatus"],
      ])
    );
    return ok({ appointments }, appointments.length ? "Appointments fetched successfully" : "No appointments yet");
  });

  // ---------- POST /appointments  (admin booking; also the public pay-at-clinic fallback)
  r.post("/appointments", (req) => {
    const user = currentUser(req);
    const b = req.body || {};
    const {
      patientId, name, phone, clinic, date, timeSlot, reason, type, isFree, opdFee: requestOpdFee, opdFeePaid,
      source, notes, visitType, treatmentId, treatmentName, fee, feeNotes, appointmentType, bookingType,
      paymentMethod: incomingPaymentMethod, parentAppointment, sessionNumber, sessionsPlanned,
      amountPaid: requestAmountPaid, originatingOpdAppointmentId,
    } = b;

    const urgency = bookingType || appointmentType || "regular";
    if (!["regular", "emergency"].includes(urgency)) throw fail(400, "bookingType must be 'regular' or 'emergency'");
    const isEmergency = urgency === "emergency";
    if (!clinic || !date || !timeSlot || !phone) throw fail(400, "Clinic, date and time slot are required");
    if (!reason) throw fail(400, "Reason for visit is required");
    if (!isObjectId(clinic)) throw fail(400, "Invalid clinic ID");

    let patient;
    if (patientId) {
      if (!isObjectId(patientId)) throw fail(400, "Invalid patient ID");
      patient = findById("Patient", patientId);
      if (!patient) throw notFound("Patient");
    } else {
      if (!name || !phone) throw fail(400, "Name and phone are required for new patient");
      patient = findOne("Patient", (p) => p.phone === phone) || newPatientDoc({ name, phone, registeredBy: user?._id });
    }

    validateAppointmentSlot({ clinic, date, timeSlot, bookingType: urgency, allowBackdate: canBackdate(user) });

    if ((visitType || "opd") === "opd") {
      const { start, end } = istDayRange(String(date).slice(0, 10));
      const requestedMin = slotMinutes(timeSlot);
      const nearby = where("Appointment", {
        patient: String(patient._id),
        visitType: "opd",
        date: { $gte: start, $lte: end },
        status: { $nin: ["cancelled"] },
      }).some((a) => Math.abs(slotMinutes(a.timeSlot) - requestedMin) <= 240);
      if (nearby) {
        throw fail(400, "This patient already has an appointment within 4 hours of this time. Please choose a different time.");
      }
    }

    // ----- treatment session branch
    if (visitType === "treatment_session") {
      if (!parentAppointment) throw fail(400, "parentAppointment is required for treatment session bookings");
      if (!isObjectId(parentAppointment)) throw fail(400, "Invalid parentAppointment ID");
      const parent = findById("Appointment", parentAppointment);
      if (!parent) throw fail(404, "Parent appointment not found");
      if (parent.visitType !== "treatment") {
        throw fail(400, "Parent appointment must be a treatment appointment (visitType='treatment')");
      }
      if (String(parent.patient) !== String(patient._id)) throw fail(400, "Session patient must match parent appointment patient");
      let finalSessionNumber = sessionNumber ? Number(sessionNumber) : null;
      if (!finalSessionNumber) {
        const last = sortBy(childSessions(parent._id, { status: { $ne: "cancelled" } }), "-sessionNumber")[0];
        finalSessionNumber = (last?.sessionNumber || 1) + 1;
      }
      const session = createAppointmentDoc({
        patient: parent.patient,
        clinic: parent.clinic,
        date,
        timeSlot,
        visitType: "treatment_session",
        parentAppointment: parent._id,
        sessionNumber: finalSessionNumber,
        treatmentName: parent.treatmentName || "",
        fee: 0,
        opdFee: 0,
        isFree: true,
        opdFeePaid: false,
        paymentStatus: "free",
        paymentMethod: "free",
        invoice: parent.invoice || null,
        status: "scheduled",
        notes,
        reason: reason || `Session ${finalSessionNumber}: ${parent.treatmentName || "Treatment"}`,
        source: source || "walk_in",
        type: type || "regular",
        appointmentType: isEmergency ? "emergency" : "regular",
        createdBy: user?._id,
      });
      const populated = populateDoc(session, [
        ["patient", "Patient", "name phone email"],
        ["clinic", "Clinic", "name"],
        ["parentAppointment", "Appointment", "treatmentName date"],
        ["invoice", "Invoice", "invoiceNumber grandTotal amountPaid balanceDue paymentStatus"],
      ]);
      return created(populated, "Treatment session appointment created");
    }

    // ----- fee calculation
    let appointmentIsFree = isFree === true || isFree === "true";
    let appointmentOpdFeePaid = opdFeePaid === true || opdFeePaid === "true";
    const apptVisitType = visitType === "treatment" ? "treatment" : "opd";
    const isCustom = apptVisitType === "treatment" && treatmentId === "other";
    const customName = String(treatmentName || "").trim();
    if (isCustom && !customName) throw fail(400, "A treatment name is required for a custom treatment");
    const hasValue = (v) => v !== undefined && v !== null && v !== "";

    let resolvedFee;
    let lineItemType;
    let lineItemDescription;
    if (appointmentIsFree) {
      resolvedFee = 0;
      appointmentOpdFeePaid = true;
      lineItemType = apptVisitType === "treatment" ? "treatment" : "opd_fee";
      lineItemDescription = apptVisitType === "treatment" ? (isCustom ? customName : "Treatment") : "OPD Consultation";
    } else if (apptVisitType === "treatment") {
      if (isCustom) {
        resolvedFee = hasValue(fee) ? Number(fee) : 0;
        lineItemDescription = customName;
      } else {
        if (!treatmentId || !isObjectId(treatmentId)) throw fail(400, "A treatment is required for a treatment visit");
        const tm = findById("TreatmentMaster", treatmentId);
        if (!tm) throw fail(404, "Treatment not found");
        resolvedFee = hasValue(fee) ? Number(fee) : Number(tm.price) || 0;
        lineItemDescription = tm.name;
      }
      if (!resolvedFee || resolvedFee <= 0) throw fail(400, "A valid treatment fee is required");
      lineItemType = "treatment";
    } else {
      const fees = feeSettings();
      resolvedFee = hasValue(requestOpdFee) ? Number(requestOpdFee) : isEmergency ? fees.opdFeeEmergency : fees.opdFeeRegular;
      lineItemType = "opd_fee";
      lineItemDescription = "OPD Consultation";
    }
    if (appointmentOpdFeePaid && !appointmentIsFree && resolvedFee <= 0) {
      throw fail(400, "Cannot mark payment as collected for a zero-fee appointment");
    }

    let originatingOpd = null;
    if (apptVisitType === "treatment") {
      if (!originatingOpdAppointmentId) throw fail(400, "An OPD visit must be linked to book a treatment");
      if (!isObjectId(originatingOpdAppointmentId)) throw fail(400, "Invalid originatingOpdAppointmentId");
      const opd = findById("Appointment", originatingOpdAppointmentId);
      if (!opd) throw fail(404, "Originating OPD appointment not found");
      if (opd.visitType !== "opd") throw fail(400, "originatingOpdAppointmentId must reference an OPD-type appointment");
      if (String(opd.patient) !== String(patient._id)) {
        throw fail(400, "Originating OPD appointment must belong to the same patient");
      }
      originatingOpd = originatingOpdAppointmentId;
    }

    const appointment = createAppointmentDoc({
      patient: patient._id,
      clinic,
      date,
      timeSlot,
      reason,
      type,
      appointmentType: isEmergency ? "emergency" : "regular",
      visitType: apptVisitType,
      ...(apptVisitType === "treatment" ? (isCustom ? { treatmentName: customName } : { treatmentId }) : {}),
      ...(apptVisitType === "treatment" && sessionsPlanned ? { sessionsPlanned: Number(sessionsPlanned) } : {}),
      ...(originatingOpd ? { originatingOpdAppointment: originatingOpd } : {}),
      fee: resolvedFee,
      feeNotes: feeNotes || undefined,
      opdFee: resolvedFee,
      isFree: appointmentIsFree,
      opdFeePaid: appointmentOpdFeePaid,
      paymentMethod: appointmentIsFree
        ? "free"
        : incomingPaymentMethod === "online"
          ? "online"
          : ADMIN_PAYMENT_METHODS.includes(incomingPaymentMethod)
            ? incomingPaymentMethod
            : "cash",
      paymentStatus: appointmentIsFree ? "free" : appointmentOpdFeePaid ? "paid" : "unpaid",
      source: source === "website" ? "online" : source || "walk_in",
      notes,
      createdBy: user?._id,
    });

    let invoiceId = null;
    let paymentLink = null;
    if (!appointmentIsFree && resolvedFee > 0) {
      const ALLOWED = ["treatment", "surgery", "test", "medicine", "other"];
      const items =
        apptVisitType === "treatment" && Array.isArray(b.items) && b.items.length > 0
          ? b.items.map((item) => ({
              itemType: ALLOWED.includes(item.itemType) ? item.itemType : "treatment",
              description: item.description?.trim() || lineItemDescription,
              unitPrice: Number(item.unitPrice) || 0,
              quantity: Number(item.quantity) || 1,
            }))
          : [{ itemType: lineItemType, description: lineItemDescription, unitPrice: resolvedFee }];
      const invoice = generateInvoice({
        patient,
        clinic,
        appointment: appointment._id,
        items,
        ...(b.discountPercent ? { discount: { percentage: Number(b.discountPercent) } } : {}),
        amountPaid: 0,
        paymentMethod: appointmentOpdFeePaid
          ? ADMIN_PAYMENT_METHODS.includes(incomingPaymentMethod) ? incomingPaymentMethod : "cash"
          : "pay-at-clinic",
        createdBy: user?._id,
      });
      invoiceId = invoice._id;
      appointment.invoice = invoice._id;
      if (incomingPaymentMethod === "razorpay") paymentLink = attachPaymentLink(appointment, invoice);
      if (appointmentOpdFeePaid) {
        createPayment({
          patient: patient._id,
          clinic,
          appointment: appointment._id,
          invoice: invoice._id,
          type: apptVisitType === "treatment" ? "treatment" : "opd_fee",
          amount: Number(requestAmountPaid ?? resolvedFee),
          paymentMode: ["cash", "card", "upi", "razorpay"].includes(incomingPaymentMethod) ? incomingPaymentMethod : "cash",
          status: "paid",
          receivedBy: user?._id,
          notes:
            apptVisitType === "treatment"
              ? `Treatment payment collected at booking — ${lineItemDescription}`
              : "OPD fee collected at admin walk-in booking",
        });
      }
    }

    return created(
      bookingSummary(appointment, patient, {
        visitType: appointment.visitType,
        appointmentType: appointment.appointmentType,
        fee: appointment.fee,
        opdFee: appointment.opdFee,
        isFree: appointment.isFree,
        opdFeePaid: appointment.opdFeePaid,
        invoiceId,
        invoiceError: null,
        paymentLink,
      }),
      "Appointment created successfully"
    );
  });

  // ---------- POST /appointments/book-free  (members)
  r.post("/appointments/book-free", (req) => {
    const patient = requirePatient(req);
    if (!hasActiveMembership(patient)) {
      throw fail(403, "An active membership is required to book a free OPD appointment");
    }
    const { clinic, date, timeSlot, reason, type, bookingType } = req.body || {};
    const urgency = bookingType || "regular";
    if (!["regular", "emergency"].includes(urgency)) throw fail(400, "bookingType must be 'regular' or 'emergency'");
    if (!clinic || !date || !timeSlot) throw fail(400, "Clinic, date, and time slot are required");
    if (!reason) throw fail(400, "Reason for visit is required");
    if (!isObjectId(clinic)) throw fail(400, "Invalid clinic ID");
    validateAppointmentSlot({ clinic, date, timeSlot, bookingType: urgency });
    const appointment = createAppointmentDoc({
      patient: patient._id,
      clinic,
      date,
      timeSlot,
      reason,
      type: type || "regular",
      appointmentType: urgency,
      visitType: "opd",
      opdFee: 0,
      fee: 0,
      isFree: true,
      opdFeePaid: true,
      paymentMethod: "free",
      paymentStatus: "free",
      source: "online",
    });
    return created(
      bookingSummary(appointment, patient, { opdFee: 0, isFree: true, opdFeePaid: true }),
      "Appointment booked successfully"
    );
  });

  // ---------- POST /appointments/initiate-booking  (public, step 1: hold + order)
  r.post("/appointments/initiate-booking", (req) => {
    const { name, phone, email, clinic, date, timeSlot, reason, type, bookingType } = req.body || {};
    const urgency = bookingType || "regular";
    if (!["regular", "emergency"].includes(urgency)) throw fail(400, "bookingType must be 'regular' or 'emergency'");
    if (!clinic || !date || !timeSlot || !phone || !reason) {
      throw fail(400, "clinic, date, timeSlot, phone and reason are required");
    }
    if (!isObjectId(clinic)) throw fail(400, "Invalid clinic ID");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw fail(400, "Invalid email format");
    validateAppointmentSlot({ clinic, date, timeSlot, bookingType: urgency });

    const fees = feeSettings();
    const amount = urgency === "emergency" ? fees.opdFeeEmergency : fees.opdFeeRegular;
    if (!amount || amount <= 0) throw fail(500, "OPD fee not configured");

    let patient = findOne("Patient", (p) => p.phone === phone);
    if (!patient && email) patient = findOne("Patient", (p) => p.email === String(email).toLowerCase());
    if (!patient) {
      if (!name) throw fail(400, "Name is required for new patient");
      patient = newPatientDoc({ name, phone, email });
    } else if (email && !patient.email) {
      patient.email = String(email).toLowerCase();
    }

    const orderId = fakeId("order");
    const receipt = `init_${Date.now()}`;
    const payment = createPayment({
      patient: patient._id,
      clinic,
      amount,
      paymentMode: "razorpay",
      type: "advance",
      status: "pending",
      razorpayOrderId: orderId,
      razorpayDetails: { receipt },
    });
    const apptId = newId();
    const appointment = createAppointmentDoc({
      _id: apptId,
      patient: patient._id,
      clinic,
      date,
      timeSlot,
      reason,
      type: type || "regular",
      appointmentType: urgency,
      opdFee: amount,
      paymentMethod: "online",
      paymentStatus: "unpaid",
      source: "online",
      status: "pending",
      pendingExpiry: new Date(Date.now() + PENDING_HOLD_MS).toISOString(),
      appointmentNumber: `PENDING-${apptId}`,
    });
    payment.appointment = appointment._id;

    return ok(
      {
        pendingAppointmentId: appointment._id,
        paymentId: payment._id,
        order: { id: orderId, amount: Math.round(amount * 100), currency: "INR" },
        key_id: "rzp_test_demo",
      },
      "Slot held. Complete payment to confirm."
    );
  });

  // ---------- POST /appointments/confirm-booking  (public, step 2)
  r.post("/appointments/confirm-booking", (req) => {
    const { pendingAppointmentId, paymentId } = req.body || {};
    if (!pendingAppointmentId || !isObjectId(pendingAppointmentId)) throw fail(400, "Valid pendingAppointmentId is required");
    if (!paymentId || !isObjectId(paymentId)) throw fail(400, "Valid paymentId is required");
    const appointment = findById("Appointment", pendingAppointmentId);
    if (!appointment) throw fail(404, "Booking hold not found");
    if (appointment.status !== "pending") throw fail(409, "This booking is already confirmed or cancelled");
    if (appointment.pendingExpiry && Date.parse(appointment.pendingExpiry) < Date.now()) {
      throw fail(410, "Booking hold expired — please start a new booking");
    }
    const payment = findById("Payment", paymentId);
    if (!payment) throw fail(404, "Payment record not found");
    if (String(payment.appointment) !== String(pendingAppointmentId)) {
      throw fail(400, "Payment does not match this booking hold");
    }
    // Demo: the simulated checkout always succeeds, so a still-pending payment is accepted.
    if (payment.status === "pending") {
      payment.status = "paid";
      payment.paidAt = nowIso();
      payment.razorpayPaymentId ??= fakeId("pay");
    }
    if (payment.status !== "paid") throw fail(400, `Payment not completed (status: ${payment.status})`);
    const patient = findById("Patient", appointment.patient);
    if (!patient) throw fail(500, "Patient not found");

    appointment.appointmentNumber = undefined;
    assignIdentifiers(appointment);
    Object.assign(appointment, {
      status: "scheduled",
      opdFeePaid: true,
      paymentStatus: "paid",
      pendingExpiry: null,
      updatedAt: nowIso(),
    });
    const invoice = generateInvoice({
      patient,
      clinic: appointment.clinic,
      appointment: appointment._id,
      items: [{ itemType: "opd_fee", description: "OPD Consultation", unitPrice: payment.amount }],
      amountPaid: payment.amount,
      paymentMethod: "online",
    });
    appointment.invoice = invoice._id;
    payment.settledInvoices = [
      { invoiceId: invoice._id, invoiceNumber: invoice.invoiceNumber, appliedAmount: payment.amount, previousAmountPaid: 0, _id: newId() },
    ];
    payment.updatedAt = nowIso();
    return created(
      bookingSummary(appointment, patient, { opdFee: appointment.opdFee, opdFeePaid: true, invoiceId: invoice._id }),
      "Appointment booked successfully"
    );
  });

  // ---------- POST /appointments/book-with-payment  (legacy)
  r.post("/appointments/book-with-payment", (req) => {
    const { paymentId, name, phone, email, clinic, date, timeSlot, reason, type, appointmentType, bookingType } = req.body || {};
    const urgency = bookingType || appointmentType || "regular";
    if (!["regular", "emergency"].includes(urgency)) throw fail(400, "bookingType must be 'regular' or 'emergency'");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw fail(400, "Invalid email format");
    if (!paymentId) throw fail(400, "Payment ID is required");
    const payment = findById("Payment", paymentId);
    if (!payment) throw fail(404, "Payment not found");
    if (payment.status === "pending") {
      payment.status = "paid";
      payment.paidAt = nowIso();
    }
    if (payment.status !== "paid") throw fail(400, `Payment not completed. Current status: ${payment.status}. Please try again.`);
    if (payment.appointment) throw fail(400, "Payment already used for an appointment");
    if (!clinic || !date || !timeSlot || !phone) throw fail(400, "Clinic, date, time slot and phone are required");
    if (!reason) throw fail(400, "Reason for visit is required");
    if (!isObjectId(clinic)) throw fail(400, "Invalid clinic ID");

    let patient = findOne("Patient", (p) => p.phone === phone);
    if (!patient && email) patient = findOne("Patient", (p) => p.email === String(email).toLowerCase());
    if (!patient) {
      if (!name) throw fail(400, "Name is required for new patient");
      patient = newPatientDoc({ name, phone, email });
    } else if (email && !patient.email) {
      patient.email = String(email).toLowerCase();
    }
    validateAppointmentSlot({ clinic, date, timeSlot, bookingType: urgency });
    const appointment = createAppointmentDoc({
      patient: patient._id,
      clinic,
      date,
      timeSlot,
      reason,
      type: type || "regular",
      appointmentType: urgency,
      opdFee: payment.amount,
      opdFeePaid: true,
      paymentMethod: "online",
      paymentStatus: "paid",
      source: "online",
    });
    payment.appointment = appointment._id;
    payment.patient = patient._id;
    const invoice = generateInvoice({
      patient,
      clinic,
      appointment: appointment._id,
      items: [{ itemType: "opd_fee", description: "OPD Consultation", unitPrice: payment.amount }],
      amountPaid: payment.amount,
      paymentMethod: "online",
    });
    appointment.invoice = invoice._id;
    payment.settledInvoices = [
      { invoiceId: invoice._id, invoiceNumber: invoice.invoiceNumber, appliedAmount: payment.amount, previousAmountPaid: 0, _id: newId() },
    ];
    return created(
      bookingSummary(appointment, patient, { opdFee: appointment.opdFee, opdFeePaid: true, invoiceId: invoice._id }),
      "Appointment booked successfully"
    );
  });

  // ---------- PATCH /appointments/:id
  r.patch("/appointments/:id", (req) => {
    const user = requireUser(req);
    const { id } = req.params;
    if (!isObjectId(id)) throw fail(400, "Invalid appointment ID");
    const appointment = getAppointmentOr404(id);
    const b = req.body || {};
    const {
      patient, clinic, date, timeSlot, type, appointmentType, visitType, treatmentId, treatmentName, fee, isFree,
      status, reason, notes, opdFee, opdFeePaid, source, checkInTime, startTime, endTime, paymentMethod,
      paymentStatus, sessionsPlanned,
    } = b;

    if (date || timeSlot) {
      const newDate = date || appointment.date;
      const newTimeSlot = timeSlot || appointment.timeSlot;
      if (date) {
        const newStart = istStartOfDay(date);
        const todayStart = istStartOfDay(istDateString());
        if (newStart < todayStart) {
          if (!canBackdate(user)) throw fail(400, "Cannot move an appointment to a past date");
          if (newStart < new Date(todayStart.getTime() - MIN_BACKDATE_DAYS * DAY_MS)) {
            throw fail(400, `Cannot backdate an appointment more than ${MIN_BACKDATE_DAYS} days`);
          }
        }
      }
      const urgency = appointmentType || appointment.appointmentType || "regular";
      const taken = countSlot({ clinic: appointment.clinic, date: newDate, timeSlot: newTimeSlot, excludeId: appointment._id });
      if (taken >= slotCapacityFor(urgency)) throw fail(409, "This time slot is fully booked");
      appointment.date = toDateIso(newDate);
      appointment.timeSlot = newTimeSlot;
    }

    const asRef = (v) => (v && typeof v === "object" ? String(v._id) : v);
    if (patient !== undefined) appointment.patient = asRef(patient);
    if (clinic !== undefined) appointment.clinic = asRef(clinic);
    if (type !== undefined) appointment.type = type;
    if (status !== undefined) appointment.status = status;
    if (reason !== undefined) appointment.reason = reason;
    if (notes !== undefined) appointment.notes = notes;
    if (opdFeePaid !== undefined) appointment.opdFeePaid = opdFeePaid;
    if (source !== undefined) appointment.source = source;
    if (checkInTime !== undefined) appointment.checkInTime = checkInTime;
    if (startTime !== undefined) appointment.startTime = startTime;
    if (endTime !== undefined) appointment.endTime = endTime;
    if (appointmentType !== undefined) appointment.appointmentType = appointmentType;
    if (visitType !== undefined) {
      appointment.visitType = visitType;
      if (visitType === "opd") {
        appointment.treatmentId = null;
        appointment.treatmentName = "";
      }
    }
    if (fee !== undefined) appointment.fee = appointment.opdFee = Number(fee);
    if (opdFee !== undefined) appointment.opdFee = appointment.fee = Number(opdFee);
    if (treatmentId !== undefined) appointment.treatmentId = treatmentId || null;
    if (treatmentName !== undefined) appointment.treatmentName = treatmentName || "";
    if (sessionsPlanned !== undefined) {
      const planned = Number(sessionsPlanned);
      if (!planned || planned < 1) throw fail(400, "sessionsPlanned must be a positive number");
      const booked = childSessions(appointment._id, { status: { $ne: "cancelled" } }).length + 1;
      if (planned < booked) throw fail(400, `Cannot set sessionsPlanned below the ${booked} sessions already booked`);
      appointment.sessionsPlanned = planned;
    }
    if (isFree !== undefined) {
      appointment.isFree = isFree;
      if (!paymentStatus) {
        if (isFree) {
          appointment.paymentStatus = "free";
          appointment.opdFeePaid = true;
        } else if (appointment.paymentStatus === "free") {
          appointment.paymentStatus = "unpaid";
          appointment.opdFeePaid = false;
        }
      }
    }
    const previousPaymentMethod = appointment.paymentMethod;
    if (paymentMethod !== undefined) {
      if (appointment.status === "completed") throw fail(400, "Cannot change payment method on a completed appointment");
      if (appointment.visitType === "treatment" && appointment.treatmentStatus) {
        throw fail(400, "Cannot change payment method on a closed treatment plan");
      }
      if (!["cash", "upi", "razorpay", "online", "free"].includes(paymentMethod)) throw fail(400, "Invalid payment method");
      appointment.paymentMethod = paymentMethod;
    }
    if (paymentStatus !== undefined) appointment.paymentStatus = paymentStatus;

    const needsSync =
      fee !== undefined || opdFee !== undefined || paymentStatus !== undefined || paymentMethod !== undefined || isFree !== undefined;
    if (needsSync && appointment.invoice && appointment.visitType !== "treatment_session") {
      const invoice = findById("Invoice", appointment.invoice);
      if (invoice) {
        let paymentDelta = 0;
        if ((fee !== undefined || opdFee !== undefined) && invoice.items?.length > 0) {
          invoice.items[0].unitPrice = appointment.isFree ? 0 : Number(fee !== undefined ? fee : opdFee);
          calculateInvoiceTotals(invoice);
        }
        const previousAmountPaid = invoice.amountPaid || 0;
        if (paymentStatus !== undefined || paymentMethod !== undefined || isFree !== undefined) {
          if (appointment.paymentStatus === "free") {
            invoice.amountPaid = invoice.grandTotal;
            invoice.paymentMethod = "free";
          } else if (appointment.paymentStatus === "paid") {
            invoice.amountPaid = invoice.grandTotal;
            paymentDelta = Math.max(0, invoice.amountPaid - previousAmountPaid);
          } else {
            invoice.amountPaid = 0;
          }
        }
        calculateInvoiceTotals(invoice);
        if (paymentDelta > 0) {
          createPayment({
            patient: invoice.patient,
            amount: paymentDelta,
            paymentMode: toPaymentMode(appointment.paymentMethod),
            type: appointment.visitType === "treatment" ? "treatment" : "opd_fee",
            status: "paid",
            settledInvoices: [
              { invoiceId: invoice._id, invoiceNumber: invoice.invoiceNumber, appliedAmount: paymentDelta, previousAmountPaid, _id: newId() },
            ],
            recordedBy: user._id,
          });
        }
      }
    }

    const chargeable =
      !appointment.isFree &&
      appointment.visitType !== "treatment_session" &&
      Number(appointment.fee ?? appointment.opdFee ?? 0) > 0;
    if (needsSync && !appointment.invoice && chargeable) {
      const amount = Number(appointment.fee ?? appointment.opdFee ?? 0);
      const invoice = generateInvoice({
        patient: appointment.patient,
        clinic: appointment.clinic,
        appointment: appointment._id,
        items: [
          {
            itemType: appointment.visitType === "treatment" ? "treatment" : "opd_fee",
            description: appointment.visitType === "treatment" ? appointment.treatmentName || "Treatment" : "OPD Consultation",
            unitPrice: amount,
          },
        ],
        amountPaid: 0,
        paymentMethod: appointment.opdFeePaid
          ? ["cash", "card", "upi", "razorpay"].includes(appointment.paymentMethod) ? appointment.paymentMethod : "cash"
          : "pay-at-clinic",
        createdBy: user._id,
      });
      appointment.invoice = invoice._id;
      appointment.invoiceError = { message: null, failedAt: null };
    }

    let paymentLink = null;
    if (paymentMethod === "razorpay" && previousPaymentMethod !== "razorpay" && appointment.invoice) {
      const invoice = findById("Invoice", appointment.invoice);
      if (invoice && invoice.grandTotal > 0) paymentLink = attachPaymentLink(appointment, invoice);
    }
    appointment.updatedAt = nowIso();

    const data = populate(
      {
        ...appointment,
        patient: patientJSON(findById("Patient", appointment.patient)) || null,
        clinic: findById("Clinic", appointment.clinic),
      },
      "createdBy",
      "User",
      "name"
    );
    if (paymentLink) data.paymentLink = paymentLink;
    return ok(data, "Appointment updated successfully");
  });

  // ---------- PATCH /appointments/:id/status
  r.patch("/appointments/:id/status", (req) => {
    const user = requireUser(req);
    const { id } = req.params;
    const { status, reason } = req.body || {};
    if (!isObjectId(id)) throw fail(400, "Invalid appointment ID");
    const appointment = getAppointmentOr404(id);
    const allowed = {
      scheduled: ["confirmed", "cancelled"],
      confirmed: ["checked_in", "cancelled", "no_show"],
      checked_in: ["in_progress", "cancelled"],
      in_progress: ["completed"],
      completed: [],
      cancelled: [],
      no_show: [],
    };
    if (!allowed[appointment.status]?.includes(status)) {
      throw fail(400, `Invalid status transition from ${appointment.status} to ${status}`);
    }
    appointment.status = status;
    if (status === "checked_in") appointment.checkInTime = nowIso();
    if (status === "in_progress") appointment.startTime = nowIso();
    if (status === "completed") appointment.endTime = nowIso();
    appointment.statusHistory = [
      ...(appointment.statusHistory || []),
      { status, ...(reason !== undefined ? { reason } : {}), changedAt: nowIso(), changedBy: user._id, _id: newId() },
    ];
    appointment.updatedAt = nowIso();
    return ok(appointment, "Appointment status updated successfully");
  });

  // ---------- POST /appointments/:id/check-in
  r.post("/appointments/:id/check-in", (req) => {
    const user = requireUser(req);
    const appointment = getAppointmentOr404(req.params.id);
    if (!["scheduled", "confirmed"].includes(appointment.status)) throw fail(400, "Appointment cannot be checked in");
    const { start, end } = istDayRange(istDateString());
    const at = Date.parse(appointment.date);
    if (at < start.getTime() || at > end.getTime()) throw fail(400, "Check-in allowed only for today's appointments");
    appointment.status = "checked_in";
    appointment.checkInTime = nowIso();
    appointment.statusHistory = [
      ...(appointment.statusHistory || []),
      { status: "checked_in", reason: "Patient arrived", changedAt: nowIso(), changedBy: user._id, _id: newId() },
    ];
    appointment.updatedAt = nowIso();
    return ok(appointment, "Patient checked in successfully");
  });

  // ---------- POST /appointments/:id/complete
  r.post("/appointments/:id/complete", (req) => {
    const user = requireUser(req);
    const appointment = getAppointmentOr404(req.params.id);
    const { clinicalNotes, prescriptions } = req.body || {};
    if (!["in_progress", "checked_in"].includes(appointment.status)) throw fail(400, "Appointment cannot be completed");
    appointment.status = "completed";
    appointment.endTime = nowIso();
    appointment.notes = [clinicalNotes && `Clinical Notes: ${clinicalNotes}`, prescriptions && `Prescriptions: ${prescriptions}`]
      .filter(Boolean)
      .join("\n");
    appointment.statusHistory = [
      ...(appointment.statusHistory || []),
      { status: "completed", reason: "Treatment completed", changedAt: nowIso(), changedBy: user._id, _id: newId() },
    ];
    appointment.updatedAt = nowIso();
    return ok(appointment, "Appointment completed successfully");
  });

  // ---------- POST /appointments/:id/cancel  (staff or the owning patient)
  r.post("/appointments/:id/cancel", (req) => {
    requireAppointmentAccess(req);
    const appointment = getAppointmentOr404(req.params.id);
    if (appointment.status === "cancelled") throw fail(400, "Appointment already cancelled");
    appointment.status = "cancelled";
    appointment.cancellationReason = req.body?.reason || "Cancelled by clinic";
    appointment.updatedAt = nowIso();
    return ok(
      populateDoc(appointment, [["patient", "Patient", "name phone email"], ["clinic", "Clinic", "name"]]),
      "Appointment cancelled successfully"
    );
  });

  // ---------- POST /appointments/:id/reschedule  (staff)
  r.post("/appointments/:id/reschedule", (req) => {
    const user = requireUser(req);
    const { id } = req.params;
    const { newDate, newTimeSlot, reason } = req.body || {};
    if (!newDate || !newTimeSlot) throw fail(400, "New date and new time slot are required");
    if (!isObjectId(id)) throw fail(400, "Invalid appointment ID");
    const appointment = getAppointmentOr404(id);
    if (["cancelled", "completed", "pending"].includes(appointment.status)) {
      throw fail(400, "This appointment cannot be rescheduled");
    }
    if (Number.isNaN(new Date(newDate).getTime())) throw fail(400, "Invalid date format");
    const todayStart = istStartOfDay(istDateString());
    const dayStart = istStartOfDay(newDate);
    if (canBackdate(user)) {
      if (dayStart < new Date(todayStart.getTime() - MIN_BACKDATE_DAYS * DAY_MS)) {
        throw fail(400, `Cannot backdate an appointment more than ${MIN_BACKDATE_DAYS} days`);
      }
    } else if (dayStart < todayStart) {
      throw fail(400, "Cannot reschedule to a past date");
    }
    if (dayStart.getTime() === todayStart.getTime()) {
      const { hour, minute } = istHourMinute();
      if (slotMinutes(newTimeSlot) <= hour * 60 + minute) throw fail(400, "This time slot has already passed");
    }
    const taken = countSlot({ clinic: appointment.clinic, date: newDate, timeSlot: newTimeSlot, excludeId: appointment._id });
    if (taken >= slotCapacityFor(appointment.appointmentType)) throw fail(409, "This time slot is fully booked");

    const fmt = (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    const note = `Rescheduled from ${fmt(appointment.date)} ${appointment.timeSlot} to ${fmt(newDate)} ${newTimeSlot}${reason ? ` — Reason: ${reason}` : ""}`;
    appointment.date = toDateIso(newDate);
    appointment.timeSlot = newTimeSlot;
    appointment.status = "scheduled";
    const key = istDateString(new Date(newDate));
    appointment.tokenNumber = nextDailyToken(appointment.clinic, key);
    appointment.tokenDateKey = key;
    appointment.notes = appointment.notes ? `${appointment.notes}\n${note}` : note;
    appointment.updatedAt = nowIso();
    return ok(populateDoc(appointment, [["patient", "Patient", "_id name"]]), "Appointment rescheduled successfully");
  });

  // ---------- POST /appointments/:id/close-treatment
  r.post("/appointments/:id/close-treatment", (req) => {
    const user = requireUser(req);
    const { id } = req.params;
    const { resolution, reason } = req.body || {};
    if (!reason || !String(reason).trim()) throw fail(400, "Reason is required to close a treatment plan");
    if (!["completed", "write_off", "refund"].includes(resolution)) {
      throw fail(400, "resolution must be completed, write_off, or refund");
    }
    if (!isObjectId(id)) throw fail(400, "Invalid appointment ID");
    const parent = getAppointmentOr404(id);
    if (parent.visitType !== "treatment") throw fail(400, "Can only close treatment appointments");
    if (["completed", "closed_early", "abandoned"].includes(parent.treatmentStatus)) throw fail(400, "Treatment is already closed");
    if (parent.status === "cancelled") throw fail(400, "Cannot close a cancelled appointment");
    const why = String(reason).trim();

    let sessionsCancelled = 0;
    for (const s of childSessions(parent._id, { status: "scheduled" })) {
      s.status = "cancelled";
      s.cancellationReason = `Treatment plan closed: ${why}`;
      s.updatedAt = nowIso();
      sessionsCancelled++;
    }
    const statusMap = { completed: "completed", write_off: "abandoned", refund: "closed_early" };
    parent.treatmentStatus = statusMap[resolution];
    parent.treatmentClosedAt = nowIso();
    parent.treatmentClosedReason = why;
    parent.treatmentHistory = [
      ...(parent.treatmentHistory || []),
      { action: "closed", resolution: statusMap[resolution], reason: why, performedBy: user._id, performedAt: nowIso(), _id: newId() },
    ];
    if (parent.status !== "completed") parent.status = "completed";
    parent.updatedAt = nowIso();

    const invoice = parent.invoice ? findById("Invoice", parent.invoice) : null;
    if (invoice && (resolution === "completed" || resolution === "write_off") && invoice.balanceDue > 0) {
      const original = invoice.balanceDue;
      invoice.amountPaid = invoice.grandTotal;
      invoice.notes =
        (invoice.notes ? invoice.notes + "\n" : "") +
        `[${nowIso()}] Treatment closed (${resolution}): ${why}. Outstanding ₹${original} written off.`;
      calculateInvoiceTotals(invoice);
    }
    return ok(
      {
        treatmentStatus: parent.treatmentStatus,
        sessionsCancelled,
        sessionsCompleted: childSessions(parent._id, { status: "completed" }).length,
        invoiceStatus: invoice?.paymentStatus || null,
      },
      "Treatment plan closed"
    );
  });

  // ---------- POST /appointments/:id/reopen-treatment
  r.post("/appointments/:id/reopen-treatment", (req) => {
    const user = requireUser(req);
    const { id } = req.params;
    const { reason } = req.body || {};
    if (!canBackdate(user)) throw fail(403, "Only admin or clinic manager can reopen a treatment");
    if (!isObjectId(id)) throw fail(400, "Invalid appointment ID");
    if (!reason || String(reason).trim().length < 10) {
      throw fail(400, "A reason of at least 10 characters is required to reopen a treatment");
    }
    const parent = getAppointmentOr404(id);
    if (parent.visitType !== "treatment") throw fail(400, "Can only reopen treatment appointments");
    if (!parent.treatmentStatus) throw fail(400, "Treatment is not closed");
    parent.treatmentStatus = null;
    parent.treatmentClosedAt = null;
    parent.treatmentHistory = [
      ...(parent.treatmentHistory || []),
      { action: "reopened", reason: String(reason).trim(), performedBy: user._id, performedAt: nowIso(), _id: newId() },
    ];
    parent.updatedAt = nowIso();
    return ok({ appointment: populateDoc(parent, [["patient", "Patient", "name phone"]]) }, "Treatment reopened");
  });

  // ---------- PATCH /appointments/:id/treatment-items
  r.patch("/appointments/:id/treatment-items", (req) => {
    const user = requireUser(req);
    const { id } = req.params;
    const { treatmentName, items, discountPercent, reason } = req.body || {};
    if (!isObjectId(id)) throw fail(400, "Invalid appointment ID");
    const appointment = getAppointmentOr404(id);
    if (appointment.visitType !== "treatment") {
      throw fail(400, "Only the parent treatment appointment's items can be edited, not individual sessions");
    }
    if (appointment.treatmentStatus) throw fail(400, "This treatment plan is already closed and can no longer be edited");
    if (!Array.isArray(items) || items.length === 0) throw fail(400, "At least one line item is required");
    const ALLOWED = ["treatment", "surgery", "test", "medicine", "other"];
    const cleanItems = items.map((item) => {
      const description = String(item.description || "").trim();
      const unitPrice = Number(item.unitPrice) || 0;
      if (!description || unitPrice <= 0) throw fail(400, "Each item needs a description and a fee greater than ₹0");
      return {
        itemType: ALLOWED.includes(item.itemType) ? item.itemType : "treatment",
        description,
        unitPrice,
        quantity: 1,
        amount: unitPrice,
        taxAmount: 0,
        total: unitPrice,
        discount: { percentage: 0, amount: 0 },
        taxRate: 0,
        _id: newId(),
      };
    });
    const subtotal = cleanItems.reduce((s, i) => s + i.unitPrice, 0);
    const discPct = Number(discountPercent) || 0;
    const grandTotal = Math.max(0, subtotal - Math.round((subtotal * discPct) / 100));
    if (!appointment.invoice) throw fail(400, "This treatment has no linked invoice to update");
    const invoice = findById("Invoice", appointment.invoice);
    if (!invoice) throw fail(404, "Linked invoice not found");
    const amountPaid = invoice.amountPaid || 0;
    const paymentStatus = amountPaid >= grandTotal && grandTotal > 0 ? "paid" : amountPaid > 0 ? "partial" : "unpaid";
    const now = nowIso();
    invoice.editHistory = [
      ...(invoice.editHistory || []),
      {
        editedAt: now,
        editedBy: user._id,
        reason: String(reason || "Treatment items edited").trim(),
        changes: {
          items: { from: invoice.items, to: cleanItems },
          discount: { from: invoice.discount, to: { percentage: discPct, amount: 0 } },
          grandTotal: { from: invoice.grandTotal, to: grandTotal },
        },
        _id: newId(),
      },
    ];
    Object.assign(invoice, {
      items: cleanItems,
      subtotal,
      totalTax: 0,
      discount: { percentage: discPct, amount: 0 },
      grandTotal,
      balanceDue: Math.max(0, grandTotal - amountPaid),
      paymentStatus,
      lastEditedAt: now,
      lastEditedBy: user._id,
      updatedAt: now,
    });
    appointment.fee = grandTotal;
    appointment.opdFee = grandTotal;
    if (treatmentName !== undefined && treatmentName !== null) appointment.treatmentName = String(treatmentName).trim();
    appointment.updatedAt = now;

    const updated = populateDoc(appointment, [
      ["patient", "Patient", "name phone email hasMembership currentDiscount"],
      ["clinic", "Clinic", "name code"],
      ["invoice", "Invoice", "invoiceNumber items subtotal discount totalTax grandTotal amountPaid balanceDue paymentStatus"],
      ["originatingOpdAppointment", "Appointment", "appointmentNumber"],
    ]);
    const data = { appointment: updated };
    if (grandTotal < amountPaid) data.warning = "New total is less than the amount already collected -- please review.";
    return ok(data, "Treatment items updated successfully");
  });

  // ---------- DELETE /appointments/:id
  r.delete("/appointments/:id", (req) => {
    requireUser(req);
    const { id } = req.params;
    if (!isObjectId(id)) throw fail(400, "Invalid appointment ID");
    const appointment = getAppointmentOr404(id);
    if (appointment.status !== "cancelled") throw fail(400, "Please cancel the appointment before deleting");
    remove("Appointment", id);
    return ok(null, "Appointment deleted permanently");
  });
}

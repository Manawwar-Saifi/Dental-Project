/**
 * Follow-up reminders + upload signature.
 * Ports src/modules/followups/followup.controller.js and
 * uploads/upload.controller.js#getUploadSignature.
 */
import { findById, insert, update } from "../core/db.js";
import { DemoError, created, ok, paginated } from "../core/http.js";
import { requirePatient } from "../core/auth.js";
import { istDayRange, paginate, populate, sortBy, where } from "../core/query.js";
import { isObjectId, istRange, notify, staff } from "../lib/access-common.js";

const error = (status, message) => new DemoError(status, message);

const formatIst = (date, time) => {
  const d = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
  return time ? `${d} at ${time}` : d;
};

const full = (reminder) =>
  populate(populate(reminder, "patient", "Patient", "name phone email"), "clinic", "Clinic", "name");

/** Mongoose casts followUpDate to a Date; store it as an ISO instant. */
const toIso = (value) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toISOString();
};

export default function register(r) {
  r.get("/followups/my", (req) => {
    const patient = requirePatient(req);
    const reminders = sortBy(
      where("FollowUpReminder", {
        patient: String(patient._id),
        status: { $in: ["scheduled", "sent"] },
        followUpDate: { $gte: istDayRange(new Date()).start },
      }),
      "followUpDate",
    ).map((x) => populate(x, "clinic", "Clinic", "name"));
    return ok({ reminders }, "Follow-ups fetched");
  });

  r.get("/followups", (req) => {
    staff(req);
    const { patient, status, upcoming, from, to } = req.query;
    const query = {};
    if (patient && isObjectId(patient)) query.patient = patient;
    if (status) query.status = status;
    if (from || to || upcoming === "true") {
      query.followUpDate = {};
      if (upcoming === "true") query.followUpDate.$gte = new Date();
      Object.assign(query.followUpDate, istRange(from, to));
    }
    const list = sortBy(where("FollowUpReminder", query), "followUpDate");
    const page = paginate(list, req.query, 20);
    return paginated(page.items.map(full), page);
  });

  r.post("/followups", (req) => {
    const user = staff(req, "appointments", "create");
    const { patient, clinic, followUpDate, time, reason } = req.body || {};
    if (!patient || !isObjectId(patient)) throw error(400, "A valid patient is required");
    if (!followUpDate) throw error(400, "Follow-up date is required");
    const patientDoc = findById("Patient", patient);
    if (!patientDoc) throw error(404, "Patient not found");

    const reminder = insert("FollowUpReminder", {
      patient: String(patient),
      clinic: clinic || patientDoc.preferredClinic || undefined,
      followUpDate: toIso(followUpDate),
      time: time || undefined,
      reason: reason || undefined,
      status: "scheduled",
      createdBy: String(user._id),
      __v: 0,
    });

    const whenStr = formatIst(followUpDate, time);
    const note = reason ? ` — ${reason}` : "";
    notify({
      recipientId: patient,
      recipientModel: "Patient",
      type: "appointment_reminder",
      title: "Follow-up scheduled",
      message: `A follow-up visit has been scheduled for ${whenStr}${note}. No payment is required to be reminded — fees apply only when you visit.`,
      createdBy: user._id,
    });
    notify({
      recipientId: user._id,
      recipientModel: "User",
      type: "appointment_reminder",
      title: "Follow-up reminder created",
      message: `Follow-up for ${patientDoc.name} scheduled on ${whenStr}${note}.`,
      createdBy: user._id,
    });

    return created({ reminder: full(reminder) }, "Follow-up reminder created");
  });

  r.patch("/followups/:id", (req) => {
    staff(req, "appointments", "edit");
    const { id } = req.params;
    if (!isObjectId(id)) throw error(400, "Invalid reminder ID");
    const reminder = findById("FollowUpReminder", id);
    if (!reminder) throw error(404, "Reminder not found");
    const patch = {};
    for (const f of ["followUpDate", "time", "reason", "clinic"]) {
      if (req.body?.[f] !== undefined) patch[f] = f === "followUpDate" ? toIso(req.body[f]) : req.body[f];
    }
    update("FollowUpReminder", id, patch);
    return ok({ reminder: full(reminder) }, "Reminder updated");
  });

  r.patch("/followups/:id/done", (req) => {
    staff(req, "appointments", "edit");
    const reminder = findById("FollowUpReminder", req.params.id);
    if (!reminder) throw error(404, "Reminder not found");
    update("FollowUpReminder", reminder._id, { status: "done" });
    return ok({ reminder }, "Marked as done");
  });

  r.patch("/followups/:id/cancel", (req) => {
    staff(req, "appointments", "edit");
    const reminder = findById("FollowUpReminder", req.params.id);
    if (!reminder) throw error(404, "Reminder not found");
    update("FollowUpReminder", reminder._id, { status: "cancelled" });
    return ok({ reminder }, "Reminder cancelled");
  });

  // ------------------------------------------------------------ uploads
  // Real uploads are bypassed in the demo build (utils/directUpload.js); this
  // only has to look like a Cloudinary signature.
  r.post("/uploads/signature", (req) => {
    staff(req);
    return ok(
      {
        signature: "demo-signature",
        timestamp: Math.round(Date.now() / 1000),
        folder: "dental-clinic/demo",
        apiKey: "demo",
        cloudName: "demo",
        expiresIn: 3600,
      },
      "Upload signature generated",
    );
  });
}

/**
 * Enquiry helpers: toJSON virtuals (id, isNew24h, daysSinceCreated), the
 * instance methods from enquiry.model.js, and the staff permission check
 * used by the enquiry and blog routes (checkPermission middleware).
 */
import { findOne, nowIso } from "../core/db.js";
import { DemoError } from "../core/http.js";
import { requireUser } from "../core/auth.js";
import { populate } from "../core/query.js";

const DAY_MS = 24 * 60 * 60 * 1000;

/** authProtect + checkPermission(module, action). Returns the User. */
export function requirePermission(req, module, action) {
  const user = requireUser(req);
  if (!action) return user;
  const perm = findOne("Permission", (p) => p.role === user.role && p.module === module);
  if (!perm || !perm[action]) {
    throw new DemoError(403, `No ${action} permission for ${module}`);
  }
  return user;
}

/** The app-wide gate in routes.js: blog_editor may only touch /blogs. */
export function blockBlogEditor(user) {
  if (user?.role === "blog_editor") {
    throw new DemoError(403, "Access restricted to blog management only");
  }
}

const withSubId = (item) => (item && item._id && typeof item === "object" ? { ...item, id: String(item._id) } : item);

/** Mongoose toJSON({ virtuals: true }) for an Enquiry document (populated or not). */
export function enquiryJSON(doc) {
  if (!doc) return doc;
  const createdMs = Date.parse(doc.createdAt);
  return {
    ...doc,
    notes: (doc.notes || []).map(withSubId),
    statusHistory: (doc.statusHistory || []).map(withSubId),
    id: String(doc._id),
    isNew24h: createdMs > Date.now() - DAY_MS,
    daysSinceCreated: Math.ceil(Math.abs(Date.now() - createdMs) / DAY_MS),
  };
}

/** enquiry.updateStatus(newStatus, userId, note) */
export function applyStatus(doc, status, userId, note) {
  const now = nowIso();
  doc.status = status;
  doc.statusHistory = [
    ...(doc.statusHistory || []),
    {
      status,
      changedAt: now,
      ...(userId ? { changedBy: String(userId) } : {}),
      note: note || `Status changed to ${status}`,
      _id: subId(),
    },
  ];
  if (status === "contacted") {
    doc.lastContactedAt = now;
    doc.followUpCount = (doc.followUpCount || 0) + 1;
  }
  doc.updatedAt = now;
  return doc;
}

let subCounter = Math.floor(Math.random() * 0xffff);
/** Fresh ObjectId for an embedded subdocument. */
export function subId() {
  const seconds = Math.floor(Date.now() / 1000).toString(16).padStart(8, "0");
  let random = "";
  for (let i = 0; i < 12; i++) random += Math.floor(Math.random() * 16).toString(16);
  subCounter = (subCounter + 1) % 0xffff;
  return seconds + random + subCounter.toString(16).padStart(4, "0");
}

/** ENQ-YYMMDD-XXXX (IST calendar day, serial = today's count + 1). */
export function nextEnquiryNumber(istDay, countToday) {
  const [y, m, d] = istDay.split("-");
  return `ENQ-${y.slice(-2)}${m}${d}-${String(countToday + 1).padStart(4, "0")}`;
}

/** Populate chain used by GET /enquiries/:id. */
export function populateDetail(doc) {
  let out = populate(doc, "treatment", "TreatmentPage", "title slug");
  out = populate(out, "assignedTo", "User", "name email phone");
  out = populate(out, "preferredClinic", "Clinic", "name address");
  out = populate(out, "convertedToPatient", "Patient", "name phone patientId");
  out = populate(out, "appointmentBooked", "Appointment", "appointmentNumber date");
  out = populate(out, "notes.addedBy", "User", "name");
  out = populate(out, "statusHistory.changedBy", "User", "name");
  return out;
}


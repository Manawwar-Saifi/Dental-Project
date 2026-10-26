/**
 * /enquiries — port of enquiries/enquiry.controller.js (+ model statics/methods).
 */
import { findById, insert, remove, nowIso } from "../core/db.js";
import { ok, created, fail, notFound, badRequest } from "../core/http.js";
import { currentUser } from "../core/auth.js";
import { where, sortBy, populate, populateAll, istDateString, istDayRange } from "../core/query.js";
import {
  requirePermission,
  blockBlogEditor,
  enquiryJSON,
  applyStatus,
  subId,
  nextEnquiryNumber,
  populateDetail,
} from "../lib/enquiries-shape.js";

/** authProtect (+ checkPermission) + the app-wide blog_editor block. */
const guard = (req, action) => {
  const user = requirePermission(req, "enquiries", action);
  blockBlogEditor(user);
  return user;
};

const getEnquiry = (id) => {
  const doc = findById("Enquiry", id);
  if (!doc) throw notFound("Enquiry");
  return doc;
};

const listPopulate = (list) => {
  let out = populateAll(list, "treatment", "TreatmentPage", "title slug");
  out = populateAll(out, "assignedTo", "User", "name email");
  out = populateAll(out, "preferredClinic", "Clinic", "name");
  return out;
};

const ACTIVE_EXCLUDED = ["converted", "not_interested", "invalid", "closed"];

export default function register(r) {
  // ---------------------------------------------------------------- public submit
  r.post("/enquiries", (req) => {
    blockBlogEditor(currentUser(req));
    const {
      name,
      phone,
      email,
      treatment,
      treatmentName,
      message,
      preferredDate,
      preferredTime,
      preferredClinic,
      source,
    } = req.body || {};

    const missing = [];
    if (!name || !String(name).trim()) missing.push("name: Name is required");
    if (!phone || !String(phone).trim()) missing.push("phone: Phone number is required");
    if (missing.length) return fail(500, `Enquiry validation failed: ${missing.join(", ")}`);

    const { start, end } = istDayRange();
    const countToday = where("Enquiry", { createdAt: { $gte: start, $lte: end } }).length;
    const now = nowIso();

    const doc = {
      enquiryNumber: nextEnquiryNumber(istDateString(), countToday),
      name: String(name).trim(),
      phone: String(phone).trim(),
      ...(email ? { email: String(email).trim().toLowerCase() } : {}),
      ...(treatment ? { treatment } : {}),
      ...(treatmentName ? { treatmentName } : {}),
      ...(message ? { message: String(message).trim() } : {}),
      ...(preferredDate ? { preferredDate: new Date(preferredDate).toISOString() } : {}),
      ...(preferredTime ? { preferredTime } : {}),
      ...(preferredClinic ? { preferredClinic } : {}),
      ...(source ? { source: { device: "unknown", ...source } } : {}),
      status: "new",
      statusHistory: [{ status: "new", changedAt: now, note: "Enquiry created", _id: subId() }],
      notes: [],
      followUpCount: 0,
      isUrgent: false,
      isSpam: false,
      __v: 0,
    };
    const saved = insert("Enquiry", doc);

    return created(
      {
        enquiry: {
          _id: saved._id,
          enquiryNumber: saved.enquiryNumber,
          name: saved.name,
          treatmentName: saved.treatmentName,
        },
      },
      "Enquiry submitted successfully. We will contact you soon!"
    );
  });

  // ---------------------------------------------------------------- lists & stats
  r.get("/enquiries", (req) => {
    guard(req, "view");
    const {
      status,
      treatment,
      assignedTo,
      dateFrom,
      dateTo,
      search,
      isSpam,
      isUrgent,
      page = 1,
      limit = 20,
      sortBy: sortField = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const query = {};
    if (status) query.status = status;
    if (treatment) query.treatment = treatment;
    if (assignedTo) query.assignedTo = assignedTo;
    if (isSpam !== undefined) query.isSpam = isSpam === "true";
    if (isUrgent !== undefined) query.isUrgent = isUrgent === "true";
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }
    if (search) {
      query.$or = ["name", "phone", "email", "enquiryNumber"].map((field) => ({
        [field]: { $regex: search, $options: "i" },
      }));
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const matched = sortBy(where("Enquiry", query), { [sortField]: sortOrder === "asc" ? 1 : -1 });
    const items = listPopulate(matched.slice(skip, skip + limitNum)).map(enquiryJSON);

    return ok({
      enquiries: items,
      pagination: {
        current: pageNum,
        pages: Math.ceil(matched.length / limitNum),
        total: matched.length,
        limit: limitNum,
      },
    });
  });

  r.get("/enquiries/stats", (req) => {
    guard(req);
    const { dateFrom, dateTo } = req.query;
    const match = {};
    if (dateFrom || dateTo) {
      match.createdAt = {};
      if (dateFrom) match.createdAt.$gte = new Date(dateFrom);
      if (dateTo) match.createdAt.$lte = new Date(dateTo);
    }
    const list = where("Enquiry", match);

    const group = (read) => {
      const counts = new Map();
      for (const doc of list) {
        const key = read(doc) ?? null;
        counts.set(key, (counts.get(key) || 0) + 1);
      }
      return [...counts.entries()].map(([_id, count]) => ({ _id, count }));
    };

    const byStatus = {};
    for (const { _id, count } of group((d) => d.status)) byStatus[_id || "unknown"] = count;
    const byTreatment = group((d) => d.treatmentName)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    const bySource = group((d) => d.source?.utm_source).sort((a, b) => b.count - a.count);

    return ok({ stats: { total: list.length, byStatus, byTreatment, bySource } });
  });

  r.get("/enquiries/today", (req) => {
    guard(req);
    const { start, end } = istDayRange();
    const enquiries = sortBy(where("Enquiry", { createdAt: { $gte: start, $lte: end } }), "-createdAt").map(
      enquiryJSON
    );
    return ok({ enquiries, count: enquiries.length });
  });

  r.get("/enquiries/pending-follow-ups", (req) => {
    const user = guard(req);
    const query = { nextFollowUp: { $lte: new Date() }, status: { $nin: ACTIVE_EXCLUDED } };
    if (user.role !== "admin") query.assignedTo = user._id;
    const enquiries = sortBy(where("Enquiry", query), "nextFollowUp").map(enquiryJSON);
    return ok({ enquiries, count: enquiries.length });
  });

  r.get("/enquiries/treatment/:treatmentId", (req) => {
    guard(req);
    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;
    const matched = sortBy(where("Enquiry", { treatment: req.params.treatmentId }), "-createdAt");
    const enquiries = populateAll(matched.slice(skip, skip + limitNum), "assignedTo", "User", "name").map(
      enquiryJSON
    );
    return ok({
      enquiries,
      pagination: { current: pageNum, pages: Math.ceil(matched.length / limitNum), total: matched.length },
    });
  });

  r.get("/enquiries/:id", (req) => {
    guard(req);
    const doc = getEnquiry(req.params.id);
    return ok({ enquiry: enquiryJSON(populateDetail(doc)) });
  });

  // ---------------------------------------------------------------- mutations
  r.patch("/enquiries/:id", (req) => {
    guard(req, "edit");
    const doc = getEnquiry(req.params.id);
    const allowed = ["name", "phone", "email", "message", "preferredDate", "preferredTime", "preferredClinic", "isUrgent"];
    for (const field of allowed) {
      if (req.body?.[field] !== undefined) doc[field] = req.body[field];
    }
    doc.updatedAt = nowIso();
    let out = populate(doc, "treatment", "TreatmentPage", "title slug");
    out = populate(out, "assignedTo", "User", "name email");
    return ok({ enquiry: enquiryJSON(out) }, "Enquiry updated successfully");
  });

  r.patch("/enquiries/:id/status", (req) => {
    const user = guard(req, "edit");
    const { status, note } = req.body || {};
    const doc = getEnquiry(req.params.id);
    const valid = ["new", "contacted", "appointment_scheduled", "visited", "converted", "not_interested", "invalid", "closed"];
    if (!valid.includes(status)) {
      return fail(500, `Enquiry validation failed: status: \`${status}\` is not a valid enum value for path \`status\`.`);
    }
    applyStatus(doc, status, user._id, note);
    return ok({ enquiry: enquiryJSON(doc) }, `Status updated to ${status}`);
  });

  r.patch("/enquiries/:id/assign", (req) => {
    guard(req, "edit");
    const { assignedTo } = req.body || {};
    const doc = getEnquiry(req.params.id);
    if (assignedTo) doc.assignedTo = String(assignedTo);
    else delete doc.assignedTo;
    doc.updatedAt = nowIso();
    return ok({ enquiry: enquiryJSON(populate(doc, "assignedTo", "User", "name email")) }, "Enquiry assigned successfully");
  });

  r.patch("/enquiries/:id/follow-up", (req) => {
    guard(req, "edit");
    const { nextFollowUp } = req.body || {};
    if (!nextFollowUp) return fail(400, "Follow-up date is required");
    const doc = getEnquiry(req.params.id);
    const date = new Date(nextFollowUp);
    if (Number.isNaN(date.getTime())) throw badRequest("Invalid follow-up date");
    doc.nextFollowUp = date.toISOString();
    doc.updatedAt = nowIso();
    return ok({ nextFollowUp: doc.nextFollowUp }, "Follow-up scheduled successfully");
  });

  r.patch("/enquiries/:id/spam", (req) => {
    guard(req, "edit");
    const { isSpam } = req.body || {};
    const doc = getEnquiry(req.params.id);
    doc.isSpam = isSpam !== undefined ? Boolean(isSpam) : true;
    doc.status = isSpam ? "invalid" : "new";
    doc.updatedAt = nowIso();
    return ok({ enquiry: enquiryJSON(doc) }, isSpam ? "Marked as spam" : "Removed spam flag");
  });

  r.patch("/enquiries/:id/convert", (req) => {
    const user = guard(req, "edit");
    const { patientId } = req.body || {};
    if (!patientId) return fail(400, "Patient ID is required");
    const doc = getEnquiry(req.params.id);
    const now = nowIso();
    doc.status = "converted";
    doc.convertedToPatient = String(patientId);
    doc.convertedAt = now;
    doc.statusHistory = [
      ...(doc.statusHistory || []),
      { status: "converted", changedAt: now, changedBy: String(user._id), note: "Converted to patient", _id: subId() },
    ];
    doc.updatedAt = now;
    return ok(
      { enquiry: enquiryJSON(populate(doc, "convertedToPatient", "Patient", "name phone patientId")) },
      "Enquiry marked as converted"
    );
  });

  r.post("/enquiries/:id/notes", (req) => {
    const user = guard(req, "edit");
    const { text } = req.body || {};
    if (!text || !String(text).trim()) return fail(400, "Note text is required");
    const doc = getEnquiry(req.params.id);
    doc.notes = [...(doc.notes || []), { text, addedBy: String(user._id), addedAt: nowIso(), _id: subId() }];
    doc.updatedAt = nowIso();
    const populated = populate(doc, "notes.addedBy", "User", "name");
    return ok({ notes: enquiryJSON(populated).notes }, "Note added successfully");
  });

  r.delete("/enquiries/:id", (req) => {
    guard(req, "delete");
    const removed = remove("Enquiry", req.params.id);
    if (!removed) throw notFound("Enquiry");
    return ok(null, "Enquiry deleted successfully");
  });
}


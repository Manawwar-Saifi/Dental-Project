/**
 * Patient reports / documents (backend: modules/reports/report.controller.js).
 *
 * The demo dataset's file URLs point at placeholder files under /demo/ in
 * public/. New uploads arrive as object URLs (utils/directUpload.js already
 * returns blob: URLs in the demo build), so they are stored as-is.
 */
import { all, findById, insert, remove, update } from "../core/db.js";
import { DemoError, badRequest, created, notFound, ok, paginated } from "../core/http.js";
import { requireUser } from "../core/auth.js";
import {
  findWhere,
  paginate,
  populate,
  sameId,
  searchFilter,
  sortBy,
  where,
} from "../core/query.js";
import {
  firstParam,
  isValidId,
  loadOr404,
  requireAnyAuth,
  toIso,
  withSubId,
} from "../lib/clinical-util.js";

const CATEGORIES = [
  "xray",
  "opg",
  "cbct",
  "lab_report",
  "prescription",
  "treatment_plan",
  "consent_form",
  "other",
];

const PREFIXES = {
  xray: "XRY",
  opg: "OPG",
  cbct: "CBT",
  lab_report: "LAB",
  prescription: "RX",
  treatment_plan: "TP",
  consent_form: "CF",
  other: "RPT",
};

/** Report.findAvailableReportNumber — PREFIX-YYMM-XXXX, walking past taken numbers. */
function nextReportNumber(category) {
  const date = new Date();
  const yy = date.getFullYear().toString().slice(-2);
  const mm = (date.getMonth() + 1).toString().padStart(2, "0");
  const fullPrefix = `${PREFIXES[category] || "RPT"}-${yy}${mm}-`;
  const taken = new Set(all("Report").map((r) => r.reportNumber));
  let n = [...taken].filter((num) => num?.startsWith(fullPrefix)).length + 1;
  let candidate;
  do {
    candidate = `${fullPrefix}${String(n++).padStart(4, "0")}`;
  } while (taken.has(candidate));
  return candidate;
}

const loadReport = (id) => loadOr404("Report", id, "Report", "Invalid report ID");

/** Patients may only see their own, visible reports. */
function assertPatientAccess(report, patient) {
  if (!patient) return;
  if (!sameId(report.patient, patient._id)) throw new DemoError(403, "Access denied");
  if (!report.isVisibleToPatient) throw new DemoError(403, "Report not available");
}

const populateBasic = (report, { clinic = true } = {}) => {
  let out = populate(report, "patient", "Patient", "name phone");
  if (clinic) out = populate(out, "clinic", "Clinic", "name code");
  return populate(out, "uploadedBy", "User", "name");
};

/** File metadata from a direct upload ({url, publicId, ...}) or a File object. */
function fileFromUpload(f, description = "") {
  return withSubId({
    url: f.url,
    publicId: f.publicId || `demo/${Date.now()}-${f.fileName || "file"}`,
    ...(f.fileName !== undefined && { fileName: f.fileName }),
    ...(f.fileSize !== undefined && { fileSize: Number(f.fileSize) || 0 }),
    ...(f.fileType !== undefined && { fileType: f.fileType }),
    ...(f.thumbnailUrl && { thumbnailUrl: f.thumbnailUrl }),
    description: f.description || description || "",
    uploadedAt: new Date().toISOString(),
  });
}

function fileFromBlob(file) {
  const url = URL.createObjectURL(file);
  const type = file.type || "application/octet-stream";
  return {
    url,
    publicId: `demo/${Date.now()}-${file.name}`,
    fileName: file.name,
    fileSize: file.size,
    fileType: type,
    ...(type.startsWith("image/") && { thumbnailUrl: url }),
  };
}

const parseMaybeJson = (value) => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
};

export default function register(r) {
  // ==================== LIST / READ ====================

  r.get("/reports", (req) => {
    requireUser(req);
    const q = req.query;
    const patient = firstParam(q.patient);
    const category = firstParam(q.category);
    const test = firstParam(q.test);
    const treatment = firstParam(q.treatment);
    const clinic = firstParam(q.clinic);
    const search = firstParam(q.search)?.trim();

    const filter = { isActive: true };
    if (patient && isValidId(patient)) filter.patient = patient;
    if (category) filter.category = category;
    if (test && isValidId(test)) filter.test = test;
    if (treatment && isValidId(treatment)) filter.treatment = treatment;
    if (clinic && isValidId(clinic)) filter.clinic = clinic;

    let list = where("Report", filter);
    // The backend ignores `search`; the admin table offers a search box, so
    // the demo matches report number / title / patient name.
    if (search) {
      const byText = searchFilter(search, ["reportNumber", "title"]);
      const patientIds = new Set(
        where("Patient", searchFilter(search, ["name", "phone"])).map((p) => String(p._id))
      );
      list = list.filter(
        (rep) => where([rep], byText).length > 0 || patientIds.has(String(rep.patient))
      );
    }

    const page = paginate(sortBy(list, "-createdAt"), q, 10);
    const items = page.items.map((rep) => {
      let out = populateBasic(rep);
      out = populate(out, "test", "Test", "testNumber");
      return populate(out, "treatment", "Treatment", "treatmentNumber");
    });
    return paginated(items, page);
  });

  r.get("/reports/number/:reportNumber", (req) => {
    requireUser(req);
    const report = findWhere("Report", { reportNumber: req.params.reportNumber });
    if (!report) throw notFound("Report");
    return ok({ report: populateBasic(report) }, "Report fetched successfully");
  });

  r.get("/reports/patient/:patientId", (req) => {
    const { patient } = requireAnyAuth(req);
    const { patientId } = req.params;
    if (!isValidId(patientId)) throw badRequest("Invalid patient ID");
    if (patient && String(patient._id) !== patientId) throw new DemoError(403, "Access denied");

    const category = firstParam(req.query.category);
    const isPatient = Boolean(patient) || firstParam(req.query.isPatient) === "true";
    const filter = { patient: patientId, isActive: true };
    if (isPatient) filter.isVisibleToPatient = true;
    if (category) filter.category = category;

    const reports = sortBy(where("Report", filter), "-createdAt").map((rep) =>
      populate(rep, "uploadedBy", "User", "name")
    );
    return ok({ reports }, "Patient reports fetched successfully");
  });

  // Routed to getPatientReportsByCategory, which groups all of the patient's reports.
  r.get("/reports/patient/:patientId/category/:category", (req) => {
    const { patient } = requireAnyAuth(req);
    const { patientId } = req.params;
    if (!isValidId(patientId)) throw badRequest("Invalid patient ID");
    if (patient && String(patient._id) !== patientId) throw new DemoError(403, "Access denied");

    const groups = {};
    for (const rep of where("Report", { patient: patientId, isActive: true })) {
      const group = (groups[rep.category] ??= { _id: rep.category, count: 0, reports: [] });
      group.count += 1;
      group.reports.push({
        _id: rep._id,
        title: rep.title,
        reportNumber: rep.reportNumber,
        createdAt: rep.createdAt,
      });
    }
    const reportsByCategory = sortBy(Object.values(groups), "_id");
    return ok({ reportsByCategory }, "Reports grouped by category fetched successfully");
  });

  r.get("/reports/:id", (req) => {
    const { patient } = requireAnyAuth(req);
    const raw = loadReport(req.params.id);
    assertPatientAccess(raw, patient);

    let report = populate(raw, "patient", "Patient", "name phone email");
    report = populate(report, "clinic", "Clinic", "name code");
    report = populate(report, "appointment", "Appointment");
    report = populate(report, "test", "Test");
    report = populate(report, "treatment", "Treatment");
    report = populate(report, "uploadedBy", "User", "name");
    return ok({ report }, "Report fetched successfully");
  });

  r.get("/reports/:id/download", (req) => {
    const { patient } = requireAnyAuth(req);
    const report = loadReport(req.params.id);
    assertPatientAccess(report, patient);

    const fileIndex = Number(firstParam(req.query.fileIndex)) || 0;
    const targetFile =
      report.files?.length > 0 ? report.files[fileIndex] || report.files[0] : report.file;
    if (!targetFile?.url && !targetFile?.publicId) {
      throw new DemoError(404, "No file found for this report");
    }

    return ok(
      {
        downloadUrl: targetFile.url,
        fileName: targetFile.fileName,
        fileType: targetFile.fileType,
        totalFiles: report.files?.length || (report.file?.url ? 1 : 0),
      },
      "Download URL generated"
    );
  });

  // ==================== MUTATIONS ====================

  r.post("/reports", (req) => {
    const user = requireUser(req);
    const body = req.body || {};
    const {
      patient,
      clinic,
      appointment,
      test,
      treatment,
      title,
      description,
      category,
      reportDate,
      isVisibleToPatient,
      notes,
      tags,
      descriptions,
    } = body;

    if (!patient || !title || !category) {
      throw badRequest("Patient, title and category are required");
    }
    if (!CATEGORIES.includes(category)) {
      throw badRequest(`\`${category}\` is not a valid enum value for path \`category\`.`);
    }

    // A. direct uploads: JSON `files` metadata; B. legacy multipart: File objects.
    let incoming = null;
    if (req.files?.length > 0) {
      incoming = req.files.map(fileFromBlob);
    } else if (body.files !== undefined) {
      const raw = parseMaybeJson(body.files);
      if (raw === undefined) throw badRequest("Invalid files payload");
      if (!Array.isArray(raw)) throw badRequest("files must be an array");
      if (raw.length > 10) throw badRequest("A report can have at most 10 files");
      if (raw.some((f) => !f || typeof f.url !== "string" || !f.url)) {
        throw badRequest("Each file needs a valid url");
      }
      incoming = raw;
    }
    if (!incoming || incoming.length === 0) throw badRequest("At least one file is required");

    if (!findById("Patient", patient)) throw notFound("Patient");

    let descriptionsArr = [];
    if (descriptions) {
      const parsed = Array.isArray(descriptions) ? descriptions : parseMaybeJson(descriptions);
      descriptionsArr = Array.isArray(parsed) ? parsed : [];
    }

    const files = incoming.map((f, i) => fileFromUpload(f, descriptionsArr[i]));
    const tagList = tags
      ? Array.isArray(tags)
        ? tags
        : String(tags)
            .split(",")
            .map((t) => t.trim())
      : [];

    const report = insert("Report", {
      reportNumber: nextReportNumber(category),
      title: String(title).trim(),
      ...(description !== undefined && { description }),
      category,
      patient,
      ...(clinic && { clinic }),
      ...(appointment && { appointment }),
      ...(test && { test }),
      ...(treatment && { treatment }),
      file: { fileType: "application/pdf" },
      files,
      uploadedBy: user._id,
      reportDate: toIso(reportDate) || new Date().toISOString(),
      // The backend only checks for the string "false"; honour a JSON false too.
      isVisibleToPatient: isVisibleToPatient !== "false" && isVisibleToPatient !== false,
      ...(notes !== undefined && { notes }),
      tags: tagList,
      isActive: true,
      __v: 0,
    });

    if (test && findById("Test", test)) update("Test", test, { report: report._id });

    return created({ report: populateBasic(report) }, "Report uploaded successfully");
  });

  r.patch("/reports/:id", (req) => {
    requireUser(req);
    const report = loadReport(req.params.id);
    const body = req.body || {};
    const patch = {};
    for (const field of [
      "title",
      "category",
      "description",
      "isVisibleToPatient",
      "notes",
      "tags",
      "reportDate",
    ]) {
      if (body[field] !== undefined) patch[field] = body[field];
    }
    if (patch.category !== undefined && !CATEGORIES.includes(patch.category)) {
      throw badRequest(`\`${patch.category}\` is not a valid enum value for path \`category\`.`);
    }
    if (patch.reportDate !== undefined) patch.reportDate = toIso(patch.reportDate) ?? null;
    if (patch.isVisibleToPatient !== undefined) {
      patch.isVisibleToPatient = patch.isVisibleToPatient !== false && patch.isVisibleToPatient !== "false";
    }

    const updated = update("Report", report._id, patch);
    return ok({ report: populateBasic(updated, { clinic: false }) }, "Report updated successfully");
  });

  r.delete("/reports/:id", (req) => {
    requireUser(req);
    const report = loadReport(req.params.id);
    if (firstParam(req.query.hardDelete) === "true") {
      remove("Report", report._id);
      return ok(null, "Report permanently deleted");
    }
    update("Report", report._id, { isActive: false });
    return ok(null, "Report deleted successfully");
  });

  r.post("/reports/:id/tags", (req) => {
    requireUser(req);
    const { tags } = req.body || {};
    if (!isValidId(req.params.id)) throw badRequest("Invalid report ID");
    if (!tags || !Array.isArray(tags)) throw badRequest("Tags array is required");
    const report = loadReport(req.params.id);
    const existing = report.tags || [];
    const updated = update("Report", report._id, {
      tags: [...existing, ...tags.filter((t) => !existing.includes(t))],
    });
    return ok({ report: updated }, "Tags added successfully");
  });

  r.patch("/reports/:id/visibility", (req) => {
    requireUser(req);
    const report = loadReport(req.params.id);
    const { isVisible } = req.body || {};
    const visible = isVisible === true || isVisible === "true";
    const updated = update("Report", report._id, { isVisibleToPatient: visible });
    return ok(
      { report: updated },
      `Report is now ${visible ? "visible" : "hidden"} to patient`
    );
  });

  // Backend stores the new file on the legacy singular `file`; the UI reads
  // files[] first, so the demo also replaces files[] to make the change show.
  r.put("/reports/:id/file", (req) => {
    requireUser(req);
    if (!isValidId(req.params.id)) throw badRequest("Invalid report ID");
    const blob = req.files?.[0];
    if (!blob) throw badRequest("New file is required");
    const report = loadReport(req.params.id);

    const meta = fileFromBlob(blob);
    const updated = update("Report", report._id, {
      file: meta,
      files: [fileFromUpload(meta, report.files?.[0]?.description || "")],
    });
    return ok(
      { report: populateBasic(updated, { clinic: false }) },
      "Report file replaced successfully"
    );
  });
}

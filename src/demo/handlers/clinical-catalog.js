/**
 * Treatment master + test master catalogs (backend: modules/treatments and
 * modules/tests, the "/master" routes). Patient treatment/test instances are
 * not handled here.
 */
import { all, insert, update } from "../core/db.js";
import { badRequest, created, DemoError, ok } from "../core/http.js";
import { requireUser } from "../core/auth.js";
import { countBy, findWhere, sortBy, where } from "../core/query.js";
import { firstParam, loadOr404, toNum } from "../lib/clinical-util.js";

const TREATMENT_CATEGORIES = [
  "preventive",
  "restorative",
  "endodontic",
  "periodontic",
  "prosthodontic",
  "orthodontic",
  "surgical",
  "cosmetic",
  "pediatric",
  "other",
];
const TEST_CATEGORIES = ["imaging", "lab", "diagnostic", "other"];

/** Shared list logic of getAllTreatmentTypes / getAllTestTypes. */
function listCatalog(model, query, { inactiveFilter }) {
  const active = firstParam(query.active) ?? "true";
  const category = firstParam(query.category);
  const sort = firstParam(query.sort) ?? "name";
  const order = firstParam(query.order) ?? "asc";

  const filter = {};
  if (active === "true") filter.isActive = true;
  if (inactiveFilter && active === "false") filter.isActive = false;
  if (category) filter.category = category;

  const field = ["name", "price", "createdAt"].includes(sort) ? sort : "name";
  const dir = ["name", "price", "createdAt"].includes(sort) && order === "desc" ? -1 : 1;
  return sortBy(where(model, filter), { [field]: dir });
}

function categoriesPayload(model, enumValues) {
  const counts = countBy(
    all(model).filter((doc) => doc.isActive !== false),
    "category"
  );
  return enumValues.map((value) => ({ value, count: counts[value] || 0 }));
}

function assertUnique(model, field, value, label, excludeId) {
  const existing = findWhere(model, { [field]: value });
  if (existing && String(existing._id) !== String(excludeId)) {
    throw new DemoError(409, `${label} with this ${field} already exists`);
  }
}

function applyAllowed(doc, body, fields, numeric = []) {
  const patch = {};
  for (const field of fields) {
    if (body[field] !== undefined) {
      patch[field] = numeric.includes(field) ? toNum(body[field]) : body[field];
    }
  }
  return patch;
}

export default function register(r) {
  // ==================== TREATMENT MASTER ====================

  // Read by the admin app and by the patient portal's Book Treatment page.
  r.get("/treatments/master", (req) =>
    ok(
      { treatmentTypes: listCatalog("TreatmentMaster", req.query, { inactiveFilter: false }) },
      "Treatment types fetched successfully"
    )
  );

  r.get("/treatments/categories", () =>
    ok(
      { categories: categoriesPayload("TreatmentMaster", TREATMENT_CATEGORIES) },
      "Treatment categories fetched successfully"
    )
  );

  r.get("/treatments/master/:id", (req) => {
    const treatmentType = loadOr404(
      "TreatmentMaster",
      req.params.id,
      "Treatment type",
      "Invalid treatment type ID"
    );
    return ok({ treatmentType }, "Treatment type fetched successfully");
  });

  r.post("/treatments/master", (req) => {
    requireUser(req);
    let { name, code, category, description, price, duration, sessionsRequired } = req.body || {};
    if (!name || !code || !category || price === undefined) {
      throw badRequest("Name, code, category and price are required");
    }
    name = String(name).trim();
    code = String(code).trim().toUpperCase();
    category = String(category).trim().toLowerCase();
    price = Number(price);
    if (Number.isNaN(price)) throw badRequest("Price must be a number");
    if (!TREATMENT_CATEGORIES.includes(category)) {
      throw badRequest(`\`${category}\` is not a valid enum value for path \`category\`.`);
    }
    assertUnique("TreatmentMaster", "code", code, "Treatment type");
    assertUnique("TreatmentMaster", "name", name, "Treatment type");

    const treatmentType = insert("TreatmentMaster", {
      name,
      code,
      category,
      ...(description !== undefined && { description }),
      price,
      duration: duration ? Number(duration) : 30,
      sessionsRequired: sessionsRequired ? Number(sessionsRequired) : 1,
      isActive: true,
      __v: 0,
    });
    return created({ treatmentType }, "Treatment type created successfully");
  });

  r.patch("/treatments/master/:id", (req) => {
    requireUser(req);
    const doc = loadOr404("TreatmentMaster", req.params.id, "Treatment type", "Invalid treatment type ID");
    const patch = applyAllowed(
      doc,
      req.body || {},
      ["name", "description", "price", "duration", "sessionsRequired", "isActive"],
      ["price", "duration", "sessionsRequired"]
    );
    if (patch.name) assertUnique("TreatmentMaster", "name", patch.name, "Treatment type", doc._id);
    const treatmentType = update("TreatmentMaster", doc._id, patch);
    return ok({ treatmentType }, "Treatment type updated successfully");
  });

  r.delete("/treatments/master/:id", (req) => {
    requireUser(req);
    const doc = loadOr404("TreatmentMaster", req.params.id, "Treatment type", "Invalid treatment type ID");
    update("TreatmentMaster", doc._id, { isActive: false });
    return ok(null, "Treatment type deactivated successfully");
  });

  // ==================== TEST MASTER ====================

  r.get("/tests/master", (req) => {
    requireUser(req);
    return ok(
      { testTypes: listCatalog("TestMaster", req.query, { inactiveFilter: true }) },
      "Test types fetched successfully"
    );
  });

  r.get("/tests/categories", () =>
    ok(
      { categories: categoriesPayload("TestMaster", TEST_CATEGORIES) },
      "Test categories fetched successfully"
    )
  );

  r.get("/tests/master/:id", (req) => {
    requireUser(req);
    const testType = loadOr404("TestMaster", req.params.id, "Test type", "Invalid test type ID");
    return ok({ testType }, "Test type fetched successfully");
  });

  r.post("/tests/master", (req) => {
    requireUser(req);
    let { name, code, category, description, price, isInHouse, referredLab, turnaroundTime } =
      req.body || {};
    if (!name || !code || !category || price === undefined) {
      throw badRequest("Name, code, category and price are required");
    }
    name = String(name).trim();
    code = String(code).trim().toUpperCase();
    category = String(category).trim().toLowerCase();
    price = Number(price);
    if (Number.isNaN(price)) throw badRequest("Price must be a number");
    if (!TEST_CATEGORIES.includes(category)) {
      throw badRequest(`\`${category}\` is not a valid enum value for path \`category\`.`);
    }
    assertUnique("TestMaster", "code", code, "Test type");
    assertUnique("TestMaster", "name", name, "Test type");

    const testType = insert("TestMaster", {
      name,
      code,
      category,
      ...(description !== undefined && { description }),
      price,
      isInHouse: isInHouse !== false,
      ...(referredLab !== undefined && { referredLab }),
      turnaroundTime: turnaroundTime ? Number(turnaroundTime) : 24,
      isActive: true,
      __v: 0,
    });
    return created({ testType }, "Test type created successfully");
  });

  // The backend route is PATCH; the admin app sends PUT. Serve both.
  const updateTestType = (req) => {
    requireUser(req);
    const doc = loadOr404("TestMaster", req.params.id, "Test type", "Invalid test type ID");
    const patch = applyAllowed(
      doc,
      req.body || {},
      ["name", "description", "price", "isInHouse", "referredLab", "turnaroundTime", "isActive"],
      ["price", "turnaroundTime"]
    );
    if (patch.name) assertUnique("TestMaster", "name", patch.name, "Test type", doc._id);
    const testType = update("TestMaster", doc._id, patch);
    return ok({ testType }, "Test type updated successfully");
  };
  r.patch("/tests/master/:id", updateTestType);
  r.put("/tests/master/:id", updateTestType);

  r.delete("/tests/master/:id", (req) => {
    requireUser(req);
    const doc = loadOr404("TestMaster", req.params.id, "Test type", "Invalid test type ID");
    update("TestMaster", doc._id, { isActive: false });
    return ok(null, "Test type deactivated successfully");
  });
}

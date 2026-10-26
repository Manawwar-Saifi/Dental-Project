/**
 * /memberships/* — port of src/modules/memberships/membership.controller.js.
 * Patient memberships are embedded in Patient documents (membership,
 * membershipHistory); MembershipPlan is the catalog.
 */
import { all, findById, insert, newId, nowIso, remove } from "../core/db.js";
import { currentPatient, requirePatient } from "../core/auth.js";
import { DemoError, badRequest, created, notFound, ok, paginated } from "../core/http.js";
import { findWhere, pageParams, sortBy, where } from "../core/query.js";
import {
  addMonths,
  blockBlogEditor,
  currentDiscount,
  hasMembership,
  isObjectId,
  manager,
  membershipWithHistoryUsers,
  membershipWithPlan,
  planJSON,
  populatePlanRef,
  recordMembershipPayment,
  staff,
} from "../lib/memberships-common.js";

const MIN_REASON_LENGTH = 10;

const DEFAULT_PLANS = [
  {
    name: "Implant Post Care",
    code: "IMP-PC",
    type: "individual",
    tier: "platinum",
    description: "Comprehensive one-year post-operative dental implant care plan.",
    price: 4500,
    discountPercentage: 30,
    maxMembers: 1,
    features: [
      "OPD for one year",
      "Oral Prophylaxis (twice a year)",
      "Two oral health kits in a year",
      "RVG for one year",
      "Post Operative Dental Implant Care",
    ],
    benefits: [
      { type: "free_service", description: "Free consultation and X-ray", freeService: { name: "Consultation & X-ray", quantity: 1 } },
    ],
    displayOrder: 1,
  },
  {
    name: "Cosmodentofacial Family Dental Plan",
    code: "CDF-FAM",
    type: "family",
    tier: "gold",
    description: "Complete family dental care with check-ups, cleaning and discounted cosmetic treatments",
    price: 4999,
    discountPercentage: 20,
    maxMembers: 4,
    features: [
      "Complete family dental check-up and cleaning",
      "Discounted rates on cosmetic and orthodontic treatments",
      "₹500 off per clinic visit",
      "30% off on surgery",
      "Free consultation and X-ray for the entire family",
    ],
    benefits: [
      { type: "discount", description: "20% off on all treatments", discountPercentage: 20 },
      { type: "free_service", description: "Free consultation and X-ray for family", freeService: { name: "Family Consultation", quantity: 4 } },
      { type: "priority_booking", description: "Priority appointment booking" },
    ],
    displayOrder: 2,
  },
  {
    name: "Individuals Plan",
    code: "IND-PLN",
    type: "individual",
    tier: "silver",
    description: "Comprehensive individual dental care package",
    price: 2000,
    discountPercentage: 15,
    maxMembers: 1,
    features: [
      "Comprehensive individual dental care package",
      "₹500 off per clinic visit",
      "30% off on surgery",
      "Free consultation and intraoral X-ray",
    ],
    benefits: [
      { type: "discount", description: "15% off on all treatments", discountPercentage: 15 },
      { type: "free_service", description: "Free consultation and intraoral X-ray", freeService: { name: "Consultation & X-ray", quantity: 1 } },
    ],
    displayOrder: 3,
  },
];

const PLAN_ENUMS = {
  type: ["individual", "family"],
  tier: ["silver", "gold", "platinum", "premium", "star"],
};

function validatePlan(plan) {
  for (const [field, values] of Object.entries(PLAN_ENUMS)) {
    if (plan[field] !== undefined && !values.includes(plan[field])) {
      throw badRequest(`\`${plan[field]}\` is not a valid enum value for path \`${field}\`.`);
    }
  }
  const pct = Number(plan.discountPercentage);
  if (plan.discountPercentage !== undefined && (pct < 0 || pct > 100)) {
    throw badRequest("Discount percentage must be between 0 and 100");
  }
}

const sortedPlans = (filter) => sortBy(where("MembershipPlan", filter), "displayOrder").map(planJSON);

/** The { patient: {...} } summary the patient-membership endpoints return. */
function patientSummary(patient, membership, overrides = {}) {
  return {
    _id: patient._id,
    name: patient.name,
    phone: patient.phone,
    membership,
    hasMembership: hasMembership(patient),
    currentDiscount: currentDiscount(patient),
    ...overrides,
  };
}

function loadPatient(patientId) {
  if (!isObjectId(patientId)) throw badRequest("Invalid patient ID");
  const patient = findById("Patient", patientId);
  if (!patient) throw notFound("Patient");
  return patient;
}

function loadActivePlan(planId) {
  if (!isObjectId(String(planId))) throw badRequest("Invalid plan ID");
  const plan = findById("MembershipPlan", planId);
  if (!plan) throw notFound("Membership plan");
  if (!plan.isActive) throw badRequest("This membership plan is no longer available");
  return plan;
}

const touch = (patient) => {
  patient.membershipHistory ??= [];
  // pre-save safety net: an active membership always means an active patient
  if (hasMembership(patient)) patient.isActive = true;
  patient.updatedAt = nowIso();
};

/** Archive the current membership (if any) and set a fresh active one. */
function activateMembership(patient, plan, startDate, archiveStatus = "expired") {
  patient.membershipHistory ??= [];
  if (patient.membership && patient.membership.plan) {
    patient.membershipHistory.push({ ...patient.membership, status: archiveStatus ?? patient.membership.status });
  }
  patient.membership = {
    plan: plan._id,
    planName: plan.name,
    discountPercent: plan.discountPercentage,
    startDate: new Date(startDate).toISOString(),
    expiryDate: addMonths(startDate, plan.durationMonths ?? 12).toISOString(),
    status: "active",
    statusHistory: [],
  };
  touch(patient);
}

const statusEntry = (action, reason, user) => ({
  action,
  ...(reason ? { reason } : {}),
  performedBy: user._id,
  performedAt: nowIso(),
  _id: newId(),
});

export default function register(r) {
  // ==================== PLANS ====================

  r.get("/memberships/plans", (req) => {
    blockBlogEditor(req);
    const { active = "true", type, tier } = req.query;
    if (req.query.grouped === "true") {
      const plans = sortedPlans({ isActive: true });
      return ok(
        {
          plans: {
            individual: plans.filter((p) => p.type === "individual"),
            family: plans.filter((p) => p.type === "family"),
          },
        },
        "Membership plans fetched successfully"
      );
    }
    const filter = {};
    if (active === "true") {
      filter.isActive = true;
      filter.discontinued = { $ne: true };
    }
    if (type) filter.type = type;
    if (tier) filter.tier = tier;
    return ok({ plans: sortedPlans(filter) }, "Membership plans fetched successfully");
  });

  r.get("/memberships/plans/subscriber-counts", (req) => {
    staff(req);
    const now = Date.now();
    const groups = {};
    for (const patient of all("Patient")) {
      const m = patient.membership;
      if (!m || m.status !== "active" || !m.plan || !(Date.parse(m.expiryDate) > now)) continue;
      (groups[String(m.plan)] ??= []).push({ _id: patient._id, name: patient.name });
    }
    const subscriberCounts = {};
    for (const [planId, list] of Object.entries(groups)) {
      subscriberCounts[planId] = {
        count: list.length,
        subscribers: list.slice(0, 10),
        hasMore: list.length > 10,
        moreCount: Math.max(0, list.length - 10),
      };
    }
    return ok({ subscriberCounts }, "Subscriber counts fetched successfully");
  });

  r.get("/memberships/plans/:id", (req) => {
    blockBlogEditor(req);
    if (!isObjectId(req.params.id)) throw badRequest("Invalid plan ID");
    const plan = findById("MembershipPlan", req.params.id);
    if (!plan) throw notFound("Membership plan");
    return ok({ plan: planJSON(plan) }, "Membership plan fetched successfully");
  });

  r.post("/memberships/plans", (req) => {
    staff(req, "create");
    let { name, code, type, tier, price, discountPercentage } = req.body;
    const { description, durationMonths, maxMembers, benefits, features, displayOrder } = req.body;
    if (!name || !code || !type || !tier || price === undefined || discountPercentage === undefined) {
      throw badRequest("Name, code, type, tier, price and discount percentage are required");
    }
    name = String(name).trim();
    code = String(code).trim().toUpperCase();
    type = String(type).trim().toLowerCase();
    tier = String(tier).trim().toLowerCase();
    price = Number(price);
    discountPercentage = Number(discountPercentage);
    if (Number.isNaN(price) || Number.isNaN(discountPercentage)) {
      throw badRequest("Price and discount percentage must be numbers");
    }
    if (findWhere("MembershipPlan", { code })) {
      throw new DemoError(409, "Membership plan with this code already exists");
    }
    if (findWhere("MembershipPlan", { name })) {
      throw new DemoError(409, "Duplicate field value: name. Please use another value.");
    }
    const doc = {
      name,
      code,
      type,
      tier,
      description,
      price,
      durationMonths: durationMonths ? Number(durationMonths) : 12,
      discountPercentage,
      maxMembers: maxMembers ? Number(maxMembers) : type === "family" ? 4 : 1,
      benefits: benefits || [],
      features: features || [],
      isActive: true,
      discontinued: false,
      displayOrder: displayOrder ? Number(displayOrder) : 0,
      __v: 0,
    };
    validatePlan(doc);
    const plan = insert("MembershipPlan", doc);
    return created({ plan: planJSON(plan) }, "Membership plan created successfully");
  });

  r.patch("/memberships/plans/:id", (req) => {
    staff(req, "edit");
    if (!isObjectId(req.params.id)) throw badRequest("Invalid plan ID");
    const plan = findById("MembershipPlan", req.params.id);
    if (!plan) throw notFound("Membership plan");
    const allowed = [
      "name",
      "description",
      "price",
      "durationMonths",
      "discountPercentage",
      "maxMembers",
      "benefits",
      "features",
      "displayOrder",
      "isActive",
      "discontinued",
    ];
    const numeric = ["price", "durationMonths", "discountPercentage", "maxMembers", "displayOrder"];
    const patch = {};
    for (const field of allowed) {
      if (req.body[field] === undefined) continue;
      patch[field] = numeric.includes(field) && req.body[field] !== null ? Number(req.body[field]) : req.body[field];
    }
    validatePlan({ ...plan, ...patch });
    if (patch.name && findWhere("MembershipPlan", { name: patch.name, _id: { $ne: plan._id } })) {
      throw new DemoError(409, "Duplicate field value: name. Please use another value.");
    }
    Object.assign(plan, patch, { updatedAt: nowIso() });
    return ok({ plan: planJSON(plan) }, "Membership plan updated successfully");
  });

  r.delete("/memberships/plans/:id", (req) => {
    staff(req, "delete");
    if (!isObjectId(req.params.id)) throw badRequest("Invalid plan ID");
    const plan = findById("MembershipPlan", req.params.id);
    if (!plan) throw notFound("Membership plan");
    plan.isActive = false;
    plan.updatedAt = nowIso();
    return ok(null, "Membership plan deactivated successfully");
  });

  r.post("/memberships/plans/seed", (req) => {
    staff(req, "create");
    const codes = DEFAULT_PLANS.map((p) => p.code);
    for (const plan of where("MembershipPlan", { code: { $nin: codes } })) remove("MembershipPlan", plan._id);
    for (const def of DEFAULT_PLANS) {
      const existing = findWhere("MembershipPlan", { code: def.code });
      if (existing) Object.assign(existing, JSON.parse(JSON.stringify(def)), { updatedAt: nowIso() });
      else {
        insert("MembershipPlan", {
          ...JSON.parse(JSON.stringify(def)),
          durationMonths: 12,
          isActive: true,
          discontinued: false,
          __v: 0,
        });
      }
    }
    return ok({ plans: sortedPlans({ isActive: true }) }, "Default membership plans seeded successfully");
  });

  // ==================== PATIENT MEMBERSHIPS ====================

  r.get("/memberships/my-plan", (req) => {
    blockBlogEditor(req);
    const patient = requirePatient(req);
    if (!patient.membership) {
      return ok({ hasMembership: false, currentMembership: null }, "No membership found");
    }
    const currentMembership = membershipWithPlan(patient.membership);
    if (!currentMembership.plan && currentMembership.planName) {
      const byName = findWhere("MembershipPlan", { name: currentMembership.planName });
      if (byName) currentMembership.plan = { ...byName };
    }
    return ok({ hasMembership: hasMembership(patient), currentMembership }, "Membership fetched successfully");
  });

  r.post("/memberships/purchase", (req) => {
    blockBlogEditor(req);
    const { planId, paymentId, name, phone, email } = req.body || {};
    let patient = currentPatient(req);

    if (!patient && phone) {
      patient = findWhere("Patient", { phone: String(phone) });
      if (!patient && email) patient = findWhere("Patient", { email: String(email).toLowerCase() });
      if (!patient) {
        if (!name) throw badRequest("Name is required for new patient");
        if (/\d/.test(name)) throw badRequest("Name cannot contain numbers");
        patient = insert("Patient", {
          phone: String(phone),
          ...(email ? { email: String(email).toLowerCase() } : {}),
          name: String(name).trim(),
          allergies: [],
          medicalHistory: [],
          membershipHistory: [],
          isActive: true,
          __v: 0,
        });
      }
    }

    if (!patient) throw badRequest("Patient information is required. Please provide name, phone, and email.");
    if (!planId) throw badRequest("Plan ID is required");
    const plan = loadActivePlan(planId);
    if (hasMembership(patient)) {
      throw badRequest("You already have an active membership. Please wait for it to expire or contact support.");
    }

    activateMembership(patient, plan, new Date());
    recordMembershipPayment({
      patient,
      description: plan.name,
      amount: plan.price,
      method: "online",
      paymentMode: "razorpay",
    });

    return ok(
      { patient: patientSummary(patient, membershipWithPlan(patient.membership)), paymentId },
      "Membership purchased successfully"
    );
  });

  r.post("/memberships/assign", (req) => {
    staff(req, "create");
    const { patientId, planId, paymentId } = req.body || {};
    if (!patientId || !planId) throw badRequest("Patient ID and Plan ID are required");
    if (!isObjectId(patientId)) throw badRequest("Invalid patient ID");
    if (!isObjectId(planId)) throw badRequest("Invalid plan ID");
    const patient = findById("Patient", patientId);
    if (!patient) throw notFound("Patient");
    const plan = loadActivePlan(planId);
    if (hasMembership(patient)) {
      throw badRequest("Patient already has an active membership. Please cancel or let it expire first.");
    }
    activateMembership(patient, plan, new Date());
    return ok(
      { patient: patientSummary(patient, membershipWithPlan(patient.membership)), paymentId },
      "Membership assigned successfully"
    );
  });

  r.post("/memberships/assign-manual", (req) => {
    const user = staff(req, "create");
    const { patientId, planId, planName, startDate, endDate, amountPaid, paymentMethod, notes } = req.body || {};
    if (!patientId || !isObjectId(patientId)) throw badRequest("A valid patient ID is required");
    const patient = findById("Patient", patientId);
    if (!patient) throw notFound("Patient");

    let resolvedPlanId = null;
    let resolvedPlanName = String(planName || "").trim();
    let discountPercent = 0;
    let durationMonths = 12;
    if (planId) {
      if (!isObjectId(planId)) throw badRequest("Invalid plan ID");
      const plan = findById("MembershipPlan", planId);
      if (!plan) throw notFound("Membership plan");
      if (!plan.isActive || plan.discontinued) throw badRequest("This plan is not active and cannot be assigned");
      resolvedPlanId = plan._id;
      if (!resolvedPlanName) resolvedPlanName = plan.name;
      discountPercent = plan.discountPercentage || 0;
      durationMonths = plan.durationMonths || 12;
    }
    if (!resolvedPlanName) throw badRequest("Please select a plan or enter a custom plan name");

    const start = startDate ? new Date(startDate) : new Date();
    const expiry = endDate ? new Date(endDate) : addMonths(start, durationMonths);
    if (Number.isNaN(start.getTime()) || Number.isNaN(expiry.getTime())) {
      throw badRequest("Invalid start or end date");
    }
    if (expiry <= start) throw badRequest("End date must be after the start date");
    if (paymentMethod && !["cash", "card", "upi", "bank_transfer", "online"].includes(paymentMethod)) {
      throw badRequest("Invalid payment method");
    }

    patient.membershipHistory ??= [];
    if (patient.membership && patient.membership.planName) {
      patient.membershipHistory.push({
        ...patient.membership,
        status: patient.membership.status === "active" ? "expired" : patient.membership.status,
      });
    }
    const paid = amountPaid !== undefined && amountPaid !== null && amountPaid !== "" ? Number(amountPaid) : undefined;
    const trimmedNotes = String(notes || "").trim();
    patient.membership = {
      plan: resolvedPlanId,
      planName: resolvedPlanName,
      discountPercent,
      startDate: start.toISOString(),
      expiryDate: expiry.toISOString(),
      status: "active",
      statusHistory: [],
      ...(paid !== undefined ? { amountPaid: paid } : {}),
      ...(paymentMethod ? { paymentMethod } : {}),
      assignedBy: user._id,
      ...(trimmedNotes ? { notes: trimmedNotes } : {}),
    };
    touch(patient);

    if (paid && paid > 0) {
      recordMembershipPayment({
        patient,
        description: resolvedPlanName || "Membership",
        amount: paid,
        method: paymentMethod,
        recordedBy: user._id,
      });
    }

    return ok({ patient: patientSummary(patient, { ...patient.membership }) }, "Membership assigned successfully");
  });

  r.post("/memberships/renew/:patientId", (req) => {
    staff(req, "edit");
    const patient = loadPatient(req.params.patientId);
    const { planId, paymentId } = req.body || {};
    if (!patient.membership || !patient.membership.plan) {
      throw badRequest("Patient does not have a membership to renew");
    }
    const plan = loadActivePlan(planId || patient.membership.plan);
    const startDate = hasMembership(patient) ? new Date(patient.membership.expiryDate) : new Date();
    activateMembership(patient, plan, startDate, null);
    return ok(
      { patient: patientSummary(patient, membershipWithPlan(patient.membership)), paymentId },
      "Membership renewed successfully"
    );
  });

  r.post("/memberships/cancel/:patientId", (req) => {
    const user = manager(req);
    if (!isObjectId(req.params.patientId)) throw badRequest("Invalid patient ID");
    const reason = String(req.body?.reason || "").trim();
    if (reason.length < MIN_REASON_LENGTH) {
      throw badRequest(`A reason of at least ${MIN_REASON_LENGTH} characters is required to cancel a membership`);
    }
    const patient = loadPatient(req.params.patientId);
    if (!patient.membership || !patient.membership.plan) throw badRequest("Patient does not have an active membership");
    if (patient.membership.status === "cancelled") throw badRequest("Membership is already cancelled");
    patient.membership.status = "cancelled";
    (patient.membership.statusHistory ??= []).push(statusEntry("cancelled", reason, user));
    touch(patient);
    return ok(
      {
        patient: patientSummary(patient, membershipWithHistoryUsers(patient.membership), {
          hasMembership: false,
          currentDiscount: 0,
        }),
      },
      "Membership cancelled successfully"
    );
  });

  r.post("/memberships/pause/:patientId", (req) => {
    const user = manager(req);
    if (!isObjectId(req.params.patientId)) throw badRequest("Invalid patient ID");
    const reason = String(req.body?.reason || "").trim();
    if (reason.length < MIN_REASON_LENGTH) {
      throw badRequest(`A reason of at least ${MIN_REASON_LENGTH} characters is required to pause a membership`);
    }
    const patient = loadPatient(req.params.patientId);
    if (!patient.membership || !patient.membership.plan) throw badRequest("Patient does not have an active membership");
    if (patient.membership.status !== "active") {
      throw badRequest(
        `Cannot pause a membership with status "${patient.membership.status}" -- only an active membership can be paused`
      );
    }
    patient.membership.status = "paused";
    patient.membership.pausedAt = nowIso();
    (patient.membership.statusHistory ??= []).push(statusEntry("paused", reason, user));
    touch(patient);
    return ok(
      {
        patient: patientSummary(patient, membershipWithHistoryUsers(patient.membership), {
          hasMembership: false,
          currentDiscount: 0,
        }),
      },
      "Membership paused successfully"
    );
  });

  r.post("/memberships/resume/:patientId", (req) => {
    const user = manager(req);
    const patient = loadPatient(req.params.patientId);
    if (!patient.membership || patient.membership.status !== "paused") {
      throw badRequest("Patient does not have a paused membership to resume");
    }
    patient.membership.status = "active";
    delete patient.membership.pausedAt;
    const reason = String(req.body?.reason || "").trim();
    (patient.membership.statusHistory ??= []).push(statusEntry("resumed", reason || undefined, user));
    touch(patient);
    return ok(
      { patient: patientSummary(patient, membershipWithHistoryUsers(patient.membership)) },
      "Membership resumed successfully"
    );
  });

  // ==================== MEMBER MANAGEMENT ====================

  r.get("/memberships/members", (req) => {
    staff(req);
    const { plan, expiringSoon } = req.query;
    const now = new Date();
    const filter = { "membership.status": "active", "membership.expiryDate": { $gt: now } };
    if (plan && isObjectId(plan)) filter["membership.plan"] = plan;
    if (expiringSoon === "true") {
      const in30 = new Date();
      in30.setDate(in30.getDate() + 30);
      filter["membership.expiryDate"] = { $gt: now, $lte: in30 };
    }
    const { page, limit, skip } = pageParams(req.query, 10);
    const list = sortBy(where("Patient", filter), "membership.expiryDate");
    const members = list.slice(skip, skip + limit).map((patient) => ({
      _id: patient._id,
      name: patient.name,
      phone: patient.phone,
      ...(patient.email !== undefined ? { email: patient.email } : {}),
      membership: { ...patient.membership, plan: populatePlanRef(patient.membership.plan, "name code type tier") },
      hasMembership: hasMembership(patient),
      currentDiscount: currentDiscount(patient),
      calculatedAge: null,
      id: String(patient._id),
    }));
    return paginated(members, { page, limit, total: list.length });
  });

  r.get("/memberships/stats", (req) => {
    staff(req);
    const now = Date.now();
    const in30 = new Date();
    in30.setDate(in30.getDate() + 30);
    const active = all("Patient").filter(
      (p) => p.membership?.status === "active" && Date.parse(p.membership.expiryDate) > now
    );
    const expiring = active.filter((p) => Date.parse(p.membership.expiryDate) <= in30.getTime());
    const byPlanMap = new Map();
    for (const p of active) {
      const key = p.membership.plan ? String(p.membership.plan) : null;
      if (!byPlanMap.has(key)) byPlanMap.set(key, { _id: key, count: 0, planName: p.membership.planName ?? null });
      byPlanMap.get(key).count += 1;
    }
    return ok(
      {
        stats: {
          totalActiveMembers: active.length,
          expiringWithin30Days: expiring.length,
          byPlan: [...byPlanMap.values()],
        },
      },
      "Membership statistics fetched successfully"
    );
  });
}

#!/usr/bin/env node
/**
 * DEMO DATASET GENERATOR
 * ======================
 *
 * Builds the JSON "database" used by the frontend-only portfolio demo
 * (src/demo/data/<ModelName>.json + _meta.json).
 *
 *   npm run demo:data          (= node scripts/demo-data/generate.mjs)
 *
 * Contract (see src/demo/core/db.js):
 *  - one file per Mongoose model, named exactly like mongoose.model("<Name>")
 *  - documents are RAW Mongo documents: 24-hex string ids, unpopulated refs,
 *    ISO-8601 UTC dates, createdAt/updatedAt/__v, embedded subdoc _ids,
 *    schema defaults filled in
 *  - everything a pre-save hook or controller would have computed (numbers,
 *    tokens, totals, balances, statuses, counters) is precomputed here
 *  - all dates are relative to ANCHOR ("today", IST). The mock shifts every
 *    date by (real today - ANCHOR) whole days at load time.
 *
 * Plain Node ESM, zero dependencies, seeded PRNG => byte-identical output on
 * every run. Sections below are ordered roughly like the clinic's history:
 * catalogs -> patients -> visits/billing -> clinical extras -> CRM -> content.
 * Tweak the COUNTS block (or a section) and re-run.
 */
import { mkdirSync, writeFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// ============================================================================
// 0. CONFIG
// ============================================================================
const ANCHOR = "2026-10-26"; // the dataset's "today" (IST calendar date, a Monday)
const ANCHOR_TIME = "12:15"; // IST wall-clock the data is frozen at (mid clinic day)
const HISTORY_START = "2026-04-27"; // first clinic day with patient activity
const SEED = 20261026;
const DEMO_PASSWORD = "Demo@123";
const DEMO_PASSWORD_HASH = "$2b$10$shGJneVlBAa1OUhFsPL9yOPnJV/0DVRRbeG/nRDyXtGG2LYvLyyhC"; // bcrypt("Demo@123")
const DEMO_PATIENT = { phone: "9876543210", email: "patient@example.com", otp: "123456" };

const COUNTS = {
  patients: 45, // including the scripted demo patient
  secondEpisodeChance: 0.33, // a patient comes back for a recall / new complaint
  enquiries: 60,
  externalIncome: 20,
  followUps: 30,
  tests: 40,
  labOrders: 25,
};

// Scales every expense amount so the P&L / Expenses screens show a healthy
// clinic for this small fictional patient base (1 = the "realistic" amounts below).
const EXPENSE_SCALE = 0.4;

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const OUT_DIR = join(ROOT, "src", "demo", "data");
const PUBLIC_DIR = join(ROOT, "public");

// ============================================================================
// 1. PRNG + small helpers
// ============================================================================
function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(SEED);
const idRng = mulberry32(SEED ^ 0x5eed);
const R = () => rng();
const int = (a, b) => a + Math.floor(R() * (b - a + 1));
const pick = (arr) => arr[Math.floor(R() * arr.length)];
const chance = (p) => R() < p;
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(R() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const weighted = (entries) => {
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let x = R() * total;
  for (const [v, w] of entries) {
    if ((x -= w) < 0) return v;
  }
  return entries[entries.length - 1][0];
};
const roundTo = (n, step) => Math.round(n / step) * step;
const assert = (cond, msg) => {
  if (!cond) throw new Error(`ASSERTION FAILED: ${msg}`);
};

// ============================================================================
// 2. Time helpers (everything is reasoned about in IST, stored as UTC ISO)
// ============================================================================
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const IST_OFFSET = 330 * MIN;

/** epoch ms for an IST wall-clock time on a YYYY-MM-DD date */
const istMs = (key, hm = "00:00", sec = 0, ms = 0) => {
  const [y, m, d] = key.split("-").map(Number);
  const [h, mi] = hm.split(":").map(Number);
  return Date.UTC(y, m - 1, d, h, mi, sec, ms) - IST_OFFSET;
};
const iso = (ms) => new Date(ms).toISOString();
const keyOf = (ms) => new Date(ms + IST_OFFSET).toISOString().slice(0, 10); // IST date
const hmOf = (ms) => new Date(ms + IST_OFFSET).toISOString().slice(11, 16); // IST HH:MM
const addDays = (key, n) => new Date(Date.parse(`${key}T00:00:00Z`) + n * DAY).toISOString().slice(0, 10);
const dow = (key) => new Date(`${key}T00:00:00Z`).getUTCDay(); // 0 = Sunday
const daysBetween = (a, b) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / DAY);
/** A bare "yyyy-mm-dd" posted from an <input type=date> -> Mongoose stores UTC midnight */
const dateOnly = (key) => `${key}T00:00:00.000Z`;
const jitter = (ms, maxSec = 59) => ms + int(0, maxSec) * 1000 + int(0, 999);
const yymm = (ms) => keyOf(ms).slice(2, 4) + keyOf(ms).slice(5, 7);
const yymmdd = (ms) => keyOf(ms).slice(2, 4) + keyOf(ms).slice(5, 7) + keyOf(ms).slice(8, 10);
const addMonthsMs = (ms, n) => {
  const d = new Date(ms + IST_OFFSET);
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.getTime() - IST_OFFSET;
};

const ANCHOR_NOW = istMs(ANCHOR, ANCHOR_TIME);
const isWorkingDay = (key) => dow(key) !== 0;
const nextWorkingDay = (key) => {
  let k = key;
  while (!isWorkingDay(k)) k = addDays(k, 1);
  return k;
};

/** createdAt values are kept unique per collection so every sort is deterministic */
const usedTimes = new Map();
function uniq(collection, ms) {
  let set = usedTimes.get(collection);
  if (!set) usedTimes.set(collection, (set = new Set()));
  let t = Math.round(ms);
  while (set.has(t)) t += 1;
  set.add(t);
  return t;
}

// ============================================================================
// 3. ObjectId factory: first 4 bytes = creation time (ids sort chronologically)
// ============================================================================
let oidCounter = 0x3a91c4;
function oid(ms) {
  const ts = Math.floor(ms / 1000).toString(16).padStart(8, "0");
  let mid = "";
  for (let i = 0; i < 10; i++) mid += Math.floor(idRng() * 16).toString(16);
  oidCounter = (oidCounter + 1) & 0xffffff;
  return ts + mid + oidCounter.toString(16).padStart(6, "0");
}

// ============================================================================
// 4. Static catalogs (names, places, phones)
// ============================================================================
const MALE = ["Rohan", "Amit", "Sandeep", "Vikas", "Rajesh", "Sunil", "Manoj", "Naveen", "Pardeep", "Ankit", "Rahul", "Sachin", "Gaurav", "Yogesh", "Harish", "Mohit", "Karan", "Vinod", "Ravinder", "Jitender", "Satish", "Kuldeep", "Anil", "Tarun", "Nitin", "Pawan", "Lokesh", "Dinesh", "Mukesh", "Surender", "Bhupender", "Hemant"];
const FEMALE = ["Priya", "Neha", "Anjali", "Sunita", "Meenu", "Sonia", "Komal", "Preeti", "Shalini", "Rekha", "Manisha", "Savita", "Jyoti", "Seema", "Asha", "Kiran", "Monika", "Sapna", "Rachna", "Babita", "Payal", "Renu", "Swati", "Poonam", "Geeta", "Mamta"];
const KIDS_M = ["Aarav", "Vihaan", "Ishaan", "Kabir", "Reyansh", "Arnav"];
const KIDS_F = ["Myra", "Anaya", "Saanvi", "Kiara", "Navya", "Aadhya"];
const SURNAMES = ["Dahiya", "Malik", "Hooda", "Sangwan", "Antil", "Rathee", "Gahlawat", "Sehrawat", "Dalal", "Khatri", "Saini", "Jangra", "Sharma", "Verma", "Gupta", "Aggarwal", "Bansal", "Goyal", "Mittal", "Chauhan", "Rana", "Tyagi", "Yadav", "Arora", "Chhikara", "Lather", "Narwal", "Punia", "Rohilla", "Panchal", "Bhardwaj", "Kundu", "Siwach", "Nandal", "Jakhar", "Dhankhar"];
const LOCALITIES = [
  ["Sector 14", "Sonipat", "131001"], ["Sector 15", "Sonipat", "131001"], ["Sector 23", "Sonipat", "131001"], ["Model Town", "Sonipat", "131001"],
  ["Kalupur Chungi", "Sonipat", "131001"], ["Jain Colony, Gohana Road", "Sonipat", "131001"], ["Shastri Colony", "Sonipat", "131001"], ["Ashok Vihar", "Sonipat", "131001"],
  ["Kamaspur", "Sonipat", "131001"], ["Devru Road", "Sonipat", "131001"], ["Sector 12", "Sonipat", "131001"], ["Bahalgarh Road", "Sonipat", "131021"],
  ["Murthal", "Murthal", "131027"], ["Main Bazaar", "Ganaur", "131101"], ["Rai Industrial Area", "Rai", "131029"], ["Old Bus Stand Road", "Gohana", "131301"],
  ["Sampla Road", "Kharkhoda", "131402"], ["Mahlana Road", "Sonipat", "131001"], ["Subhash Chowk", "Sonipat", "131001"], ["Sector 7", "Sonipat", "131001"],
];
const PHONE_PREFIXES = ["98", "97", "99", "88", "89", "70", "81", "93", "96", "95", "62", "63", "73", "78", "80", "90", "94", "87"];
const usedPhones = new Set([DEMO_PATIENT.phone]);
function phone() {
  for (;;) {
    let p = pick(PHONE_PREFIXES);
    while (p.length < 10) p += String(int(0, 9));
    if (!usedPhones.has(p) && !/(\d)\1{4}/.test(p)) {
      usedPhones.add(p);
      return p;
    }
  }
}
const usedNames = new Set();
function personName(gender, kid = false) {
  for (;;) {
    const first = kid ? pick(gender === "male" ? KIDS_M : KIDS_F) : pick(gender === "male" ? MALE : FEMALE);
    const n = `${first} ${pick(SURNAMES)}`;
    if (!usedNames.has(n)) {
      usedNames.add(n);
      return n;
    }
  }
}
const usedEmails = new Set([DEMO_PATIENT.email]);
function emailFor(name) {
  const base = name.toLowerCase().replace(/[^a-z ]/g, "").trim().replace(/\s+/g, ".");
  let e = `${base}@example.com`;
  let i = 2;
  while (usedEmails.has(e)) e = `${base}${i++}@example.com`;
  usedEmails.add(e);
  return e;
}
const TEETH_POST = ["16", "17", "26", "27", "36", "37", "46", "47", "15", "25", "35", "45"];
const TEETH_ANT = ["11", "12", "21", "22"];

// ============================================================================
// Collections (final raw documents, written at the end)
// ============================================================================
const DB = {
  User: [], Clinic: [], SystemSettings: [], Permission: [], TreatmentMaster: [], TestMaster: [],
  MembershipPlan: [], Lab: [], Patient: [], Appointment: [], Counter: [], Invoice: [], Payment: [],
  Treatment: [], Test: [], Report: [], LabOrder: [], FollowUpReminder: [], Enquiry: [],
  Notification: [], Blog: [], Expense: [], ExternalIncome: [],
};

// ============================================================================
// 5. USERS (one per role in the enum; admin@example.com MUST be the first admin
//    inserted: enquiry notifications go to User.findOne({ role: "admin" }))
// ============================================================================
const USER_SPECS = [
  { key: "arjun", name: "Dr. Arjun Malik", email: "admin@example.com", phone: "9812045673", role: "admin", at: "04-01 10:02", lastLogin: `${ANCHOR} 09:04` },
  { key: "kavita", name: "Dr. Kavita Rathee", email: "kavita.rathee@example.com", phone: "9896012347", role: "admin", at: "04-01 10:26", lastLogin: `${ANCHOR} 09:41` },
  { key: "sandeep", name: "Sandeep Dahiya", email: "clinic_manager@example.com", phone: "9729034518", role: "clinic_manager", at: "04-02 11:15", lastLogin: `${ANCHOR} 09:12` },
  { key: "pooja", name: "Pooja Kadian", email: "pooja.kadian@example.com", phone: "8901234765", role: "clinic_manager", at: "04-02 11:31", lastLogin: `${ANCHOR} 09:26` },
  { key: "ritu", name: "Ritu Sangwan", email: "user@example.com", phone: "7015823946", role: "user", at: "04-03 10:05", lastLogin: `${ANCHOR} 09:08`, smsAppointments: true },
  { key: "amit", name: "Amit Hooda", email: "amit.hooda@example.com", phone: "9467301258", role: "user", at: "04-03 10:22", lastLogin: `${ANCHOR} 09:22` },
  { key: "nisha", name: "Nisha Antil", email: "blog_editor@example.com", phone: "8295607134", role: "blog_editor", at: "04-06 12:40", lastLogin: "2026-10-23 15:47" },
  { key: "deepak", name: "Deepak Jangra", email: "deepak.jangra@example.com", phone: "9354718206", role: "user", at: "04-03 10:48", lastLogin: "2026-08-13 18:02", inactiveFrom: "2026-08-14 11:30" },
];
const U = {};
for (const s of USER_SPECS) {
  usedPhones.add(s.phone);
  usedEmails.add(s.email);
  const created = uniq("User", jitter(istMs(`2026-${s.at.split(" ")[0]}`, s.at.split(" ")[1])));
  const lastLogin = jitter(istMs(s.lastLogin.split(" ")[0], s.lastLogin.split(" ")[1]));
  const updated = s.inactiveFrom ? jitter(istMs(s.inactiveFrom.split(" ")[0], s.inactiveFrom.split(" ")[1])) : created + int(2, 9) * DAY;
  const doc = {
    _id: oid(created),
    name: s.name,
    email: s.email,
    phone: s.phone,
    password: DEMO_PASSWORD_HASH,
    role: s.role,
    isActive: !s.inactiveFrom,
    lastLogin: iso(lastLogin),
    notificationPreferences: {
      email: { appointments: true, payments: true, systemAlerts: true },
      sms: { appointments: !!s.smsAppointments, payments: false, systemAlerts: false },
    },
    createdAt: iso(created),
    updatedAt: iso(Math.max(updated, s.inactiveFrom ? updated : lastLogin)),
    __v: 0,
  };
  DB.User.push(doc);
  U[s.key] = { ...s, doc, _id: doc._id, inactiveAtMs: s.inactiveFrom ? updated : Infinity };
}
const STAFF_ACTIVE_AT = (key, ms) => ms < U[key].inactiveAtMs;

// ============================================================================
// 6. CLINICS + 7. SYSTEM SETTINGS
// ============================================================================
const CLINIC_SPECS = [
  { key: "US", name: "Dental Clinic - Sector 15", code: "US", street: "SCO 42, Main Market", area: "Sector 15", phone: "9812300415", at: "04-01 10:40", doctor: "arjun", desk: ["ritu", "ritu", "ritu", "sandeep", "sandeep", "arjun", "deepak"], manager: "sandeep" },
  { key: "UM", name: "Dental Clinic - Murthal Road", code: "UM", street: "First Floor, 118 Murthal Road, Near Gita Bhawan Chowk", area: "Murthal Road", phone: "9812300427", at: "04-01 10:47", doctor: "kavita", desk: ["amit", "amit", "amit", "pooja", "pooja", "kavita"], manager: "pooja" },
];
const C = {};
for (const s of CLINIC_SPECS) {
  usedPhones.add(s.phone);
  const created = uniq("Clinic", jitter(istMs(`2026-${s.at.split(" ")[0]}`, s.at.split(" ")[1])));
  const doc = {
    _id: oid(created),
    name: s.name,
    code: s.code,
    address: { street: s.street, area: s.area, city: "Sonipat", state: "Haryana", pincode: "131001" },
    phone: s.phone,
    isActive: true,
    createdAt: iso(created),
    updatedAt: iso(created + int(1, 3) * DAY + int(0, 5000)),
    __v: 0,
  };
  DB.Clinic.push(doc);
  C[s.key] = { ...s, doc, _id: doc._id };
}
/** staff member at the front desk of a clinic at a given time */
const deskUser = (clinicKey, ms) => {
  for (let i = 0; i < 8; i++) {
    const k = pick(C[clinicKey].desk);
    if (STAFF_ACTIVE_AT(k, ms)) return U[k];
  }
  return U[C[clinicKey].manager];
};

{
  const created = uniq("SystemSettings", jitter(istMs("2026-04-01", "10:51")));
  const updated = jitter(istMs("2026-04-04", "17:20"));
  const wh = (open, close, isOpen = true) => ({ open, close, isOpen });
  DB.SystemSettings.push({
    _id: oid(created),
    clinicName: "Dental Clinic",
    clinicPhone: "9812300415",
    clinicEmail: "hello@example.com",
    address: { street: "SCO 42, Main Market", area: "Sector 15", city: "Sonipat", state: "Haryana", pincode: "131001", country: "India" },
    workingHours: {
      monday: wh("09:30", "20:30"), tuesday: wh("09:30", "20:30"), wednesday: wh("09:30", "20:30"),
      thursday: wh("09:30", "20:30"), friday: wh("09:30", "20:30"), saturday: wh("09:30", "18:00"),
      sunday: wh("10:00", "14:00", false),
    },
    systemConfig: { timezone: "Asia/Kolkata", currency: "INR", language: "en", dateFormat: "DD/MM/YYYY", timeFormat: "12h" },
    backupSettings: { autoBackup: false, backupFrequency: "weekly" },
    feeSettings: { opdFeeRegular: 300, opdFeeEmergency: 500, consultationFee: 500, requirePaymentBeforeBooking: true },
    updatedBy: U.arjun._id,
    createdAt: iso(created),
    updatedAt: iso(updated),
    __v: 0,
  });
}
const FEES = { regular: 300, emergency: 500 };

// ============================================================================
// 8. PERMISSIONS (mirrors backend permission.constants.js DEFAULT_PERMISSION_MATRIX)
// ============================================================================
{
  const MODULES = ["dashboard", "patients", "enquiries", "appointments", "treatments", "treatment_catalog", "lab", "payments", "billing", "expenses", "external_income", "reports", "memberships", "blogs", "notifications", "clinics", "staff", "settings"];
  const T = { view: true, create: true, edit: true, delete: true };
  const F = { view: false, create: false, edit: false, delete: false };
  const matrix = {
    admin: Object.fromEntries(MODULES.map((m) => [m, T])),
    blog_editor: Object.fromEntries(MODULES.map((m) => [m, m === "blogs" ? T : F])),
    clinic_manager: Object.fromEntries(MODULES.map((m) => [m, m === "staff" || m === "settings" ? F : T])),
    user: {
      dashboard: T, patients: T, enquiries: T,
      appointments: { view: true, create: true, edit: true, delete: false },
      treatments: T, treatment_catalog: F, lab: T, payments: T,
      billing: { view: true, create: true, edit: true, delete: false },
      expenses: { view: true, create: true, edit: true, delete: false },
      external_income: { view: true, create: true, edit: true, delete: false },
      reports: T, memberships: T, blogs: F, notifications: T,
      clinics: { view: true, create: false, edit: false, delete: false },
      staff: F, settings: F,
    },
  };
  // seeded in one insertMany on 2026-04-01 (1 ms apart, like a bulk insert)
  let t = istMs("2026-04-01", "10:55", 12, 300);
  for (const [role, mods] of Object.entries(matrix)) {
    for (const [module, a] of Object.entries(mods)) {
      const ms = uniq("Permission", t++);
      DB.Permission.push({ _id: oid(ms), role, module, view: a.view, create: a.create, edit: a.edit, delete: a.delete, createdAt: iso(ms), updatedAt: iso(ms), __v: 0 });
    }
  }
}

// ============================================================================
// 9. TREATMENT MASTER (the 15 public-site treatments + 5 extras)
// ============================================================================
const TREATMENT_MASTER_SPECS = [
  ["Dental Implant", "IMPL", "prosthodontic", 30000, 90, 4, "Titanium posts placed in the jawbone as a permanent foundation for replacement teeth."],
  ["Root Canal Treatment (RCT)", "RCT", "endodontic", 5500, 60, 3, "Removes infected pulp, cleans and disinfects the canals, and seals the tooth to save it."],
  ["Wisdom Teeth", "WIS", "surgical", 4500, 45, 2, "Extraction of impacted or problematic third molars."],
  ["Clear Aligners", "ALGN", "orthodontic", 110000, 45, 6, "Custom, near-invisible removable trays that gradually straighten teeth."],
  ["Cosmetic Dental Bonding", "BOND", "cosmetic", 3000, 45, 1, "Tooth-coloured resin applied and cured to repair or improve a tooth's look."],
  ["Laser Dentistry", "LASER", "other", 6000, 30, 1, "Focused-light procedures with greater precision and faster recovery."],
  ["Kids Dentistry", "KIDS", "pediatric", 1500, 30, 1, "Child-focused oral care from infancy through the teen years."],
  ["Dental Crowns and Bridges", "CRWN", "restorative", 6500, 60, 2, "Fixed prosthetics that cover damaged teeth or fill gaps from missing ones."],
  ["Gum Disease Treatment", "GUM", "periodontic", 1500, 45, 1, "Treats periodontal infection that damages gum tissue and supporting bone."],
  ["Dental Filling", "FILL", "restorative", 1200, 30, 1, "Restores a decayed tooth to normal shape and function."],
  ["Dentures", "DENT", "prosthodontic", 18000, 60, 4, "Removable replacements for missing teeth and surrounding tissue."],
  ["Teeth Whitening", "WHTN", "cosmetic", 7000, 60, 1, "Professional lightening that removes stains and discoloration."],
  ["Mouth Ulcers", "ULCR", "other", 800, 20, 1, "Diagnosis and relief for painful canker sores and oral lesions."],
  ["Braces", "BRC", "orthodontic", 35000, 60, 12, "Fixed appliances that correct misaligned teeth and jaws over time."],
  ["Smile Makeover", "SMILE", "cosmetic", 65000, 90, 5, "Combined cosmetic procedures customised to redesign the smile."],
  ["Scaling & Polishing", "SCAL", "preventive", 1500, 40, 1, "Professional removal of plaque and tartar followed by polishing."],
  ["Tooth Extraction", "EXT", "surgical", 1000, 30, 1, "Simple removal of a badly damaged or mobile tooth."],
  ["Night Guard", "NGRD", "prosthodontic", 3500, 30, 2, "Custom hard acrylic guard that protects teeth from night-time grinding."],
  ["Pulpectomy (Kids)", "PULP", "pediatric", 2500, 45, 1, "Root canal treatment for milk teeth to keep them until natural exfoliation."],
  ["Fluoride Application", "FLUO", "preventive", 800, 15, 1, "Topical fluoride varnish to strengthen enamel and prevent cavities."],
];
const TM = {};
{
  let t = istMs("2026-04-02", "16:10");
  TREATMENT_MASTER_SPECS.forEach(([name, code, category, price, duration, sessionsRequired, description], i) => {
    const created = uniq("TreatmentMaster", jitter((t += int(40, 140) * 1000)));
    const inactive = code === "FLUO";
    const doc = {
      _id: oid(created), name, code, category, description, price, duration, sessionsRequired,
      isActive: !inactive,
      createdAt: iso(created),
      updatedAt: iso(inactive ? jitter(istMs("2026-07-18", "18:20")) : i % 4 === 0 ? created + int(3, 40) * DAY : created),
      __v: 0,
    };
    DB.TreatmentMaster.push(doc);
    TM[name] = doc;
  });
}

// ============================================================================
// 10. TEST MASTER
// ============================================================================
const TEST_MASTER_SPECS = [
  ["IOPA X-Ray (RVG)", "IOPA", "imaging", 200, true, null, 1, "Intra-oral periapical radiograph of one or two teeth using the in-clinic RVG sensor."],
  ["Bitewing X-Ray", "BWX", "imaging", 250, true, null, 1, "Detects cavities between back teeth and bone levels."],
  ["OPG (Panoramic X-Ray)", "OPG", "imaging", 500, true, null, 2, "Single panoramic view of both jaws, all teeth and the TMJ."],
  ["CBCT Scan (Single Jaw)", "CBCT1", "imaging", 2500, false, "Sonipat Diagnostic & Imaging Centre", 24, "3D cone-beam CT of one jaw for implant planning and impacted teeth."],
  ["CBCT Scan (Full Mouth)", "CBCT2", "imaging", 3500, false, "Sonipat Diagnostic & Imaging Centre", 24, "3D cone-beam CT of both jaws."],
  ["Fasting Blood Sugar", "FBS", "lab", 120, false, "Arogya Path Labs, Sonipat", 12, "Pre-surgical glucose screening."],
  ["HbA1c", "HBA1C", "lab", 500, false, "Arogya Path Labs, Sonipat", 24, "Three-month average blood glucose for diabetic patients."],
  ["Complete Blood Count", "CBC", "lab", 350, false, "Arogya Path Labs, Sonipat", 12, "Pre-operative blood count."],
  ["PT / INR", "PTINR", "lab", 450, false, "Arogya Path Labs, Sonipat", 24, "Clotting profile for patients on blood thinners before extraction or implant surgery."],
  ["Pulp Vitality Test", "PVT", "diagnostic", 300, true, null, 1, "Electric / cold test to check whether the tooth nerve is alive."],
];
const TSM = {};
{
  let t = istMs("2026-04-05", "15:30");
  for (const [name, code, category, price, isInHouse, referredLab, turnaroundTime, description] of TEST_MASTER_SPECS) {
    const created = uniq("TestMaster", jitter((t += int(30, 120) * 1000)));
    const doc = {
      _id: oid(created), name, code, category, description, price, isInHouse,
      ...(referredLab ? { referredLab } : {}),
      turnaroundTime, isActive: true,
      createdAt: iso(created), updatedAt: iso(created), __v: 0,
    };
    DB.TestMaster.push(doc);
    TSM[code] = doc;
  }
}

// ============================================================================
// 11. MEMBERSHIP PLANS (the backend's 3 default plans + one extra)
// ============================================================================
const PLAN_SPECS = [
  {
    key: "implant", name: "Implant Post Care", code: "IMP-PC", type: "individual", tier: "platinum", price: 4500, discountPercentage: 30, maxMembers: 1, displayOrder: 1,
    description: "Comprehensive one-year post-operative dental implant care plan.",
    features: ["OPD for one year", "Oral Prophylaxis (twice a year)", "Two oral health kits in a year", "RVG for one year", "Post Operative Dental Implant Care"],
    benefits: [{ type: "free_service", description: "Free consultation and X-ray", freeService: { name: "Consultation & X-ray", quantity: 1 } }],
  },
  {
    key: "family", name: "Cosmodentofacial Family Dental Plan", code: "CDF-FAM", type: "family", tier: "gold", price: 4999, discountPercentage: 20, maxMembers: 4, displayOrder: 2,
    description: "Complete family dental care with check-ups, cleaning and discounted cosmetic treatments",
    features: ["Complete family dental check-up and cleaning", "Discounted rates on cosmetic and orthodontic treatments", "₹500 off per clinic visit", "30% off on surgery", "Free consultation and X-ray for the entire family"],
    benefits: [
      { type: "discount", description: "20% off on all treatments", discountPercentage: 20 },
      { type: "free_service", description: "Free consultation and X-ray for family", freeService: { name: "Family Consultation", quantity: 4 } },
      { type: "priority_booking", description: "Priority appointment booking" },
    ],
  },
  {
    key: "individual", name: "Individuals Plan", code: "IND-PLN", type: "individual", tier: "silver", price: 2000, discountPercentage: 15, maxMembers: 1, displayOrder: 3,
    description: "Comprehensive individual dental care package",
    features: ["Comprehensive individual dental care package", "₹500 off per clinic visit", "30% off on surgery", "Free consultation and intraoral X-ray"],
    benefits: [
      { type: "discount", description: "15% off on all treatments", discountPercentage: 15 },
      { type: "free_service", description: "Free consultation and intraoral X-ray", freeService: { name: "Consultation & X-ray", quantity: 1 } },
    ],
  },
  {
    key: "women", name: "Women's Smile Care Plan", code: "WSC-PLN", type: "individual", tier: "gold", price: 2499, discountPercentage: 20, maxMembers: 1, displayOrder: 4,
    description: "A year of preventive and cosmetic dental care designed for women, including pregnancy-safe check-ups.",
    features: ["Unlimited OPD consultations for one year", "Two scaling & polishing sessions", "20% off on all treatments", "Pregnancy-safe dental check-ups", "Free intraoral X-ray"],
    benefits: [
      { type: "discount", description: "20% off on all treatments", discountPercentage: 20 },
      { type: "free_service", description: "Two scaling & polishing sessions", freeService: { name: "Scaling & Polishing", quantity: 2 } },
      { type: "priority_booking", description: "Priority evening slots" },
    ],
  },
];
const TERMS = "Membership is valid for 12 months from the date of activation and is non-transferable. Discounts apply to treatment charges only and cannot be combined with other offers. Lab charges, implants and orthodontic appliances are billed as per actuals. Fees once paid are non-refundable.";
const PLAN = {};
{
  let t = istMs("2026-04-03", "12:20");
  for (const s of PLAN_SPECS) {
    const created = uniq("MembershipPlan", jitter((t += int(3, 9) * MIN)));
    const doc = {
      _id: oid(created), name: s.name, code: s.code, type: s.type, tier: s.tier, description: s.description, terms: TERMS,
      price: s.price, durationMonths: 12, discountPercentage: s.discountPercentage, maxMembers: s.maxMembers,
      benefits: s.benefits, features: s.features, isActive: true, discontinued: false, displayOrder: s.displayOrder,
      createdAt: iso(created), updatedAt: iso(s.key === "women" ? jitter(istMs("2026-06-20", "13:05")) : created), __v: 0,
    };
    DB.MembershipPlan.push(doc);
    PLAN[s.key] = { ...s, doc, _id: doc._id };
  }
}

// ============================================================================
// 12. LABS (fictional dental labs with price lists)
// ============================================================================
const LAB_SPECS = [
  { key: "precision", name: "Precision Dental Lab", contactPerson: "Rakesh Bansal", address: "Plot 17, HSIIDC Industrial Area, Kundli, Sonipat", procedures: [
    ["PFM Crown", 600, "per_unit"], ["Zirconia Crown", 1800, "per_unit"], ["Temporary Crown", 250, "per_unit"], ["Night Guard (Hard Acrylic)", 900, "fixed"]] },
  { key: "ceramics", name: "Sonipat Dental Ceramics", contactPerson: "Manish Goyal", address: "23, Old DC Road, Sonipat", procedures: [
    ["PFM Crown", 550, "per_unit"], ["Zirconia 5yr", 1500, "per_unit"], ["Layered Zirconia", 2400, "per_unit"], ["E-max Veneer", 3500, "per_unit"]] },
  { key: "denture", name: "Haryana Denture Studio", contactPerson: "Vijay Panchal", address: "Shop 9, Gohana Road Market, Sonipat", procedures: [
    ["Complete Denture (per arch)", 1800, "per_arch"], ["Partial Denture", 150, "fixed_plus_per_unit", 600, "₹600 base + ₹150 per tooth"], ["Denture Reline", 700, "fixed"], ["Cast Partial Denture (RPD)", 2500, "fixed"]] },
  { key: "digident", name: "DigiDent Implant Lab", contactPerson: "Harsh Mittal", address: "Unit 4, Sector 37, Gurugram", procedures: [
    ["Screw Retained Implant PFM", 1400, "per_unit"], ["Cement Retained Implant PFM", 900, "per_unit"], ["Implant Zirconia (Monolith)", 2200, "per_unit"], ["DMLS Custom Abutment", 2400, "per_unit"], ["Implant Prosthetic Screw", 300, "per_unit"]] },
];
const LAB = {};
{
  let t = istMs("2026-04-05", "16:40");
  for (const s of LAB_SPECS) {
    const created = uniq("Lab", jitter((t += int(4, 12) * MIN)));
    const ph = phone();
    const doc = {
      _id: oid(created), name: s.name, contactPerson: s.contactPerson, phone: ph, address: s.address, status: "active",
      procedures: s.procedures.map(([name, price, pricingType, basePrice = 0, notes]) => ({
        name, price, basePrice, pricingType, ...(notes ? { notes } : {}), _id: oid(created),
      })),
      createdAt: iso(created), updatedAt: iso(created), __v: 0,
    };
    DB.Lab.push(doc);
    LAB[s.key] = { ...s, doc, _id: doc._id };
  }
}
const labProc = (labKey, name) => LAB[labKey].doc.procedures.find((p) => p.name === name);

// ============================================================================
// 13. PATIENTS
//     Registration dates are spread over the 6-month history with growth
//     (density rises towards today). Patient docs are serialised at the end
//     because memberships/updatedAt are decided while scheduling visits.
// ============================================================================
const HISTORY_DAYS = daysBetween(HISTORY_START, ANCHOR);
const P = []; // patient work objects

function makePatientProfile({ gender, kid = false, ageYears }) {
  const name = personName(gender, kid);
  const loc = pick(LOCALITIES);
  const hasEmail = !kid && chance(0.62);
  const dobMode = kid ? "dob" : weighted([["dob", 0.62], ["age", 0.22], ["none", 0.16]]);
  const p = { name, gender, phone: phone(), kid, ageYears };
  if (hasEmail) p.email = emailFor(name);
  if (dobMode === "dob") {
    const y = 2026 - ageYears;
    p.dateOfBirth = dateOnly(`${y}-${String(int(1, 12)).padStart(2, "0")}-${String(int(1, 28)).padStart(2, "0")}`);
  } else if (dobMode === "age") p.age = ageYears;
  if (chance(0.82)) {
    const house = chance(0.5) ? `H.No. ${int(12, 1890)}` : `House ${int(1, 450)}`;
    p.address = { street: `${house}, ${loc[0]}`, city: loc[1], state: "Haryana", pincode: loc[2] };
  }
  if (chance(0.55)) p.bloodGroup = weighted([["B+", 30], ["O+", 28], ["A+", 20], ["AB+", 8], ["B-", 4], ["O-", 4], ["A-", 4], ["AB-", 2]]);
  p.allergies = chance(0.18) ? [pick(["Penicillin", "Sulfa drugs", "Latex", "Ibuprofen", "Lignocaine (mild)"])] : [];
  p.medicalHistory = [];
  if (ageYears > 45 && chance(0.45)) p.medicalHistory.push(pick(["Type 2 diabetes", "Hypertension", "Hypothyroidism"]));
  if (ageYears > 55 && chance(0.3)) p.medicalHistory.push(pick(["On blood thinners (aspirin)", "Cardiac stent (2019)"]));
  if (chance(0.06)) p.medicalHistory.push("Asthma");
  if (chance(0.4) || kid) {
    const rel = kid ? pick(["Father", "Mother"]) : pick(["Spouse", "Father", "Mother", "Brother", "Son", "Daughter"]);
    const relGender = ["Father", "Brother", "Son"].includes(rel) ? "male" : ["Mother", "Daughter"].includes(rel) ? "female" : gender === "male" ? "female" : "male";
    p.emergencyContact = { name: `${pick(relGender === "male" ? MALE : FEMALE)} ${name.split(" ")[1]}`, phone: phone(), relation: rel };
  }
  return p;
}

// --- the scripted demo patient (index 0) -----------------------------------
const demoPatient = {
  name: "Rohan Mehra", gender: "male", phone: DEMO_PATIENT.phone, email: DEMO_PATIENT.email, ageYears: 35,
  dateOfBirth: dateOnly("1991-03-14"),
  address: { street: "H.No. 1123, Sector 14", city: "Sonipat", state: "Haryana", pincode: "131001" },
  bloodGroup: "B+", allergies: ["Penicillin"], medicalHistory: ["Mild hypertension"],
  emergencyContact: { name: "Simran Mehra", phone: "9812765430", relation: "Spouse" },
  notes: "Prefers evening appointments. Demo account for the patient portal.",
  isDemo: true,
};
usedNames.add(demoPatient.name);
usedPhones.add(demoPatient.emergencyContact.phone);

// registration day index with growth: CDF ~ x^1.7
const regDays = [];
for (let i = 0; i < COUNTS.patients - 1; i++) regDays.push(Math.floor(Math.pow(R(), 1 / 1.7) * (HISTORY_DAYS - 1)));
regDays.sort((a, b) => a - b);

P.push({ ...demoPatient, regKey: "2026-05-12", clinicKey: "US" });
for (let i = 0; i < regDays.length; i++) {
  const kid = chance(0.1);
  const gender = chance(0.52) ? "male" : "female";
  const ageYears = kid ? int(5, 12) : weighted([[int(16, 25), 18], [int(26, 40), 38], [int(41, 55), 28], [int(56, 72), 16]]);
  const prof = makePatientProfile({ gender, kid, ageYears });
  let regKey = nextWorkingDay(addDays(HISTORY_START, regDays[i]));
  if (regKey >= ANCHOR) regKey = addDays(ANCHOR, -2); // keep first visits in the past
  P.push({ ...prof, regKey, clinicKey: chance(0.62) ? "US" : "UM" });
}
P.forEach((p, i) => {
  p.idx = i;
  p.membership = null; // decided below
  p.membershipHistory = [];
  p.events = []; // [ms] modifications -> updatedAt
});

// ============================================================================
// 14. SCHEDULING ENGINE: appointments, invoices, payments
// ============================================================================
const SLOTS_WEEKDAY = [];
for (let h = 9; h <= 20; h++) for (const m of ["00", "30"]) SLOTS_WEEKDAY.push(`${String(h).padStart(2, "0")}:${m}`);
SLOTS_WEEKDAY.splice(0, 1); // 09:30 .. 20:30
SLOTS_WEEKDAY.pop();
const SLOTS_SAT = SLOTS_WEEKDAY.filter((s) => s <= "17:30");
const takenSlots = new Set(); // "date|slot" unique across BOTH clinics => deterministic {date,timeSlot} sorts
const slotsFor = (key) => (dow(key) === 6 ? SLOTS_SAT : SLOTS_WEEKDAY);

/** Reserve a free slot on/after `key` (optionally after a time). Never lands on ANCHOR unless allowed. */
function reserveSlot(key, { after = null, prefer = null, allowAnchor = false, maxShift = 20 } = {}) {
  let k = nextWorkingDay(key);
  for (let shift = 0; shift < maxShift; shift++) {
    if (k === ANCHOR && !allowAnchor) {
      k = nextWorkingDay(addDays(k, 1));
      continue;
    }
    let slots = slotsFor(k).filter((s) => !after || s > after);
    if (prefer === "morning") slots = [...shuffle(slots.filter((s) => s < "13:00")), ...shuffle(slots.filter((s) => s >= "13:00"))];
    else if (prefer === "evening") slots = [...shuffle(slots.filter((s) => s >= "16:00")), ...shuffle(slots.filter((s) => s < "16:00"))];
    else if (prefer === "exact") slots = slots.slice(0, 1);
    else slots = shuffle(slots);
    for (const s of slots) {
      if (!takenSlots.has(`${k}|${s}`)) {
        takenSlots.add(`${k}|${s}`);
        return { key: k, slot: s };
      }
    }
    k = nextWorkingDay(addDays(k, 1));
    after = null;
  }
  throw new Error(`no slot near ${key}`);
}
function reserveExact(key, slot) {
  assert(!takenSlots.has(`${key}|${slot}`), `slot taken ${key} ${slot}`);
  takenSlots.add(`${key}|${slot}`);
  return { key, slot };
}

const APPTS = [];
const INVOICES = [];
const PAYMENTS = [];
const EVENTS = []; // notification-worthy events, materialised in section 22

const touch = (obj, ms) => {
  obj.updatedMs = Math.max(obj.updatedMs || 0, ms);
};

/** active membership discount for a patient at a given instant (mirrors patient.currentDiscount) */
function memberDiscountAt(p, ms) {
  const m = p.membership;
  if (!m) return 0;
  if (ms < m.assignedMs || ms < m.startMs || ms >= m.expiryMs) return 0;
  if (m.endedMs && ms >= m.endedMs) return 0; // cancelled / paused at that time
  return m.discountPercent || 0;
}
const isMemberAt = (p, ms) => memberDiscountAt(p, ms) > 0;

// ---- invoices --------------------------------------------------------------
function newInvoice({ p, clinicKey, appt = null, items, discountPct = 0, paymentMethod, createdBy = null, createdMs, applyMember = true, notes }) {
  const createdAt = uniq("Invoice", createdMs);
  const pct = applyMember ? memberDiscountAt(p, createdMs) : 0;
  const inv = {
    _id: oid(createdAt), p, clinicKey, appt, createdMs: createdAt, updatedMs: createdAt,
    items: items.map((it) => ({
      itemType: it.itemType, description: it.description, quantity: it.quantity || 1, unitPrice: it.unitPrice,
      discount: { percentage: it.discountPct ?? pct, amount: 0 }, taxRate: 0,
      ...(it.itemRef ? { itemRef: it.itemRef, itemRefModel: it.itemRefModel } : {}),
      _id: oid(createdAt),
    })),
    discount: { percentage: discountPct, amount: 0 },
    paymentMethod, createdBy, notes, events: [], cancelled: null, voided: null, issuedMs: null, writeOff: null,
    editHistory: [],
  };
  INVOICES.push(inv);
  return inv;
}
function invoiceTotals(inv) {
  let subtotal = 0;
  for (const it of inv.items) {
    let amount = it.unitPrice * it.quantity;
    if (it.discount.percentage > 0) amount -= (amount * it.discount.percentage) / 100;
    if (it.discount.amount > 0) amount -= it.discount.amount;
    it.amount = Math.max(0, amount);
    it.taxAmount = (it.amount * it.taxRate) / 100;
    it.total = it.amount + it.taxAmount;
    subtotal += it.amount;
  }
  let disc = subtotal;
  if (inv.discount.percentage > 0) disc -= (disc * inv.discount.percentage) / 100;
  if (inv.discount.amount > 0) disc -= inv.discount.amount;
  return { subtotal, totalTax: 0, grandTotal: Math.max(0, Math.round(disc)) };
}
const grandTotal = (inv) => invoiceTotals(inv).grandTotal;
/** amount paid so far (as of `ms`, or all applications) */
function paidSoFar(inv, ms = Infinity) {
  let s = 0;
  for (const e of inv.events) if (e.ms <= ms) s += e.delta;
  return s;
}
const balanceOf = (inv, ms = Infinity) => Math.max(0, grandTotal(inv) - paidSoFar(inv, ms));

// ---- payments --------------------------------------------------------------
let paymentSeq = 0;
function newPayment(fields) {
  const createdMs = uniq("Payment", fields.createdMs);
  const pay = { ...fields, createdMs, updatedMs: fields.updatedMs || createdMs, _id: oid(createdMs), seq: paymentSeq++ };
  PAYMENTS.push(pay);
  return pay;
}
const UPI_REF = () => `${int(4, 6)}${String(int(0, 99999999999)).padStart(11, "0")}`;
/** Booking-time collection (createAppointment): Payment.create({...invoice}) + post-save hook */
function payAtBooking({ appt, inv, amount, mode, ms, typeLabel }) {
  const pay = newPayment({
    kind: "booking", p: appt.p, clinicKey: appt.clinicKey, appt, invoiceLink: inv, amount, paymentMode: mode,
    type: typeLabel === "treatment" ? "treatment" : "opd_fee", status: "paid", receivedBy: appt.createdBy,
    notes: typeLabel === "treatment" ? `Treatment payment collected at booking — ${appt.treatmentName}` : "OPD fee collected at admin walk-in booking",
    createdMs: ms,
  });
  inv.events.push({ ms: pay.createdMs + 15, delta: amount, pay, kind: "hook" });
  touch(inv, pay.createdMs + 15);
  return pay;
}
/** POST /payments/admin/collect (per-invoice collect, settledInvoices linkage) */
function collect({ inv, amount, mode, ms, by, appt = null, notes }) {
  assert(amount > 0, "collect amount > 0");
  assert(amount <= balanceOf(inv, ms) + 0.01, `collect exceeds balance on ${inv._id}`);
  const pay = newPayment({
    kind: "collect", p: inv.p, appt, amount, paymentMode: mode, type: "invoice_payment", status: "paid",
    paidMs: ms, recordedBy: by, notes, referenceNumber: mode === "upi" && chance(0.55) ? UPI_REF() : mode === "card" && chance(0.6) ? `APPR${int(100000, 999999)}` : undefined,
    settled: [{ inv, applied: amount, _id: null }], createdMs: ms,
  });
  pay.settled[0]._id = oid(pay.createdMs);
  inv.events.push({ ms: pay.createdMs - 5, delta: amount, pay, kind: "settle" });
  touch(inv, pay.createdMs - 5);
  return pay;
}

// ---- appointments ----------------------------------------------------------
function newAppointment(a) {
  const createdMs = uniq("Appointment", a.createdMs);
  const appt = {
    type: "regular", appointmentType: "regular", visitType: "opd", parent: null, sessionNumber: null, sessionsPlanned: null,
    treatmentStatus: null, treatmentClosedMs: null, treatmentClosedReason: null, originatingOpd: null, treatmentHistory: [],
    status: "scheduled", cancellationReason: "", opdFeePaid: false, isFree: false, paymentMethod: "cash", paymentStatus: "unpaid",
    source: "walk_in", invoice: null, notes: undefined, createdBy: null,
    ...a,
    createdMs,
    numberingMs: a.numberingMs || createdMs,
  };
  appt._id = oid(createdMs);
  appt.updatedMs = createdMs;
  APPTS.push(appt);
  appt.p.appts = appt.p.appts || [];
  appt.p.appts.push(appt);
  // dispatchBookingNotifications(): clinic + patient booking e-mails ~1-3 s later
  const mailMs = createdMs + int(900, 2900);
  appt.mail = { clinicEmailSentAt: mailMs, ...(appt.p.email ? { patientEmailSentAt: mailMs } : { patientEmailError: "No patient email" }) };
  touch(appt, mailMs);
  return appt;
}
const slotStartMs = (appt) => istMs(appt.key, appt.slot);

const OPD_SOURCES = [["walk_in", 52], ["phone", 30], ["online", 18]];

/**
 * Book an OPD visit the way the real flows do:
 *  - walk_in / phone  : admin createAppointment (auto-invoice unless free)
 *  - online (non member): public initiate-booking + confirm-booking (Razorpay, prepaid)
 *  - online (member)  : patient portal book-free (isFree, no invoice)
 */
function bookOpd(p, { key, slot, source, createdMs, reason, emergency = false, followUp = false, payNow = null, clinicKey = p.clinicKey, by: byOverride = null }) {
  const ms = createdMs;
  const member = isMemberAt(p, ms);
  // members pay the discounted invoice later (booking-time Payment would record the undiscounted fee)
  if (member) payNow = null;
  const by = source === "online" ? null : byOverride || deskUser(clinicKey, ms);
  const base = { p, clinicKey, key, slot, reason, source, createdMs: ms, createdBy: by, type: followUp ? "follow_up" : "regular", appointmentType: emergency ? "emergency" : "regular" };
  let appt;
  if (member && !emergency) {
    // members: free OPD (portal book-free when online, admin "free" toggle otherwise)
    appt = newAppointment({ ...base, fee: 0, opdFee: 0, isFree: true, opdFeePaid: true, paymentMethod: "free", paymentStatus: "free" });
    if (source === "online") appt.createdBy = null;
    return appt;
  }
  const fee = emergency ? FEES.emergency : FEES.regular;
  if (source === "online") {
    // initiate-booking (pending hold + Razorpay order) -> confirm-booking a couple of minutes later
    const confirmMs = ms + int(70, 240) * 1000;
    appt = newAppointment({ ...base, opdFee: fee, feeUnset: true, opdFeePaid: true, paymentMethod: "online", paymentStatus: "paid", numberingMs: confirmMs });
    appt.mail.clinicEmailSentAt = confirmMs + int(900, 2500);
    if (appt.mail.patientEmailSentAt) appt.mail.patientEmailSentAt = appt.mail.clinicEmailSentAt;
    touch(appt, appt.mail.clinicEmailSentAt);
    const inv = newInvoice({ p, clinicKey, appt, items: [{ itemType: "opd_fee", description: "OPD Consultation", unitPrice: fee }], paymentMethod: "online", createdMs: confirmMs + 120, applyMember: false });
    appt.invoice = inv;
    const pay = newPayment({
      kind: "online", p, clinicKey, appt, amount: fee, paymentMode: "razorpay", type: "advance", status: "paid", createdMs: ms - int(2, 6) * 1000,
      paidMs: confirmMs - int(4, 15) * 1000, updatedMs: confirmMs + 260,
      razorpayOrderId: `order_${rzpId()}`, razorpayPaymentId: `pay_${rzpId()}`, razorpaySignature: hex64(), receipt: `init_${ms - int(2, 6) * 1000}`,
      settled: [{ inv, applied: fee, _id: oid(confirmMs + 260) }],
    });
    inv.events.push({ ms: inv.createdMs, delta: fee, pay, kind: "settle", initial: true });
    EVENTS.push({ kind: "appointment_confirmation", p, appt, ms: confirmMs + 400 });
    return appt;
  }
  // admin booking (walk_in / phone)
  const paidAtBooking = payNow; // "cash" | "upi" | null
  appt = newAppointment({
    ...base, fee, opdFee: fee, opdFeePaid: !!paidAtBooking, paymentMethod: paidAtBooking || "cash", paymentStatus: paidAtBooking ? "paid" : "unpaid",
  });
  const inv = newInvoice({
    p, clinicKey, appt, items: [{ itemType: "opd_fee", description: "OPD Consultation", unitPrice: fee }],
    paymentMethod: paidAtBooking ? paidAtBooking : "pay-at-clinic", createdBy: by, createdMs: ms + int(30, 90),
  });
  appt.invoice = inv;
  touch(appt, inv.createdMs + 20);
  if (paidAtBooking) payAtBooking({ appt, inv, amount: grandTotal(inv), mode: paidAtBooking, ms: inv.createdMs + int(40, 120), typeLabel: "opd" });
  return appt;
}
const RZP_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
function rzpId() {
  let s = "";
  for (let i = 0; i < 14; i++) s += RZP_CHARS[Math.floor(R() * RZP_CHARS.length)];
  return s;
}
function hex64() {
  let s = "";
  for (let i = 0; i < 64; i++) s += "0123456789abcdef"[Math.floor(R() * 16)];
  return s;
}

/** visit happened: staff flips the status (PATCH /appointments/:id {status}) */
function completeVisit(appt, status = "completed") {
  const endMs = slotStartMs(appt) + int(20, 45) * MIN + int(0, 59_999);
  appt.status = status;
  touch(appt, endMs);
  appt.doneMs = endMs;
  return endMs;
}
function cancelVisit(appt, ms, reason, byPatient = false) {
  appt.status = "cancelled";
  appt.cancellationReason = reason;
  touch(appt, ms);
  EVENTS.push({ kind: "appointment_cancellation", p: appt.p, appt, ms: ms + 40 });
  if (appt.invoice && paidSoFar(appt.invoice) === 0 && !byPatient) {
    cancelInvoice(appt.invoice, ms + int(3, 30) * MIN, deskUser(appt.clinicKey, ms), "Appointment cancelled");
  }
}
function cancelInvoice(inv, ms, by, reason) {
  inv.cancelled = { ms, by: by._id, reason };
  touch(inv, ms);
}

// ---- treatment plan templates ---------------------------------------------
const tooth = (arr) => pick(arr);
const PLAN_TEMPLATES = {
  scaling: { w: 13, name: "Gum Disease Treatment", sessions: 1, reasons: ["Bleeding gums while brushing", "Bad breath and tartar deposits", "Routine dental check-up"], sameDay: 0.7,
    items: () => [{ description: "Scaling & Polishing (full mouth)", unitPrice: pick([1200, 1500, 1500, 1800]) }] },
  deepclean: { w: 4, name: "Gum Disease Treatment", sessions: 2, gap: [7, 10], reasons: ["Loose teeth and swollen gums", "Gum recession and bleeding"],
    items: () => [{ description: "Deep Scaling & Root Planing - Upper Arch", unitPrice: 2500 }, { description: "Deep Scaling & Root Planing - Lower Arch", unitPrice: 2500 }] },
  filling: { w: 12, name: "Dental Filling", sessions: 1, reasons: ["Sensitivity to cold drinks", "Food lodgement between teeth", "Black spot on back tooth"], sameDay: 0.6,
    items: () => { const t = shuffle(TEETH_POST); return Array.from({ length: chance(0.35) ? 2 : 1 }, (_, i) => ({ description: `Composite Filling - Tooth ${t[i]}`, unitPrice: pick([1000, 1200, 1500]) })); } },
  rct: { w: 12, name: "Root Canal Treatment (RCT)", reasons: ["Toothache in lower back tooth", "Severe toothache at night", "Swelling and pain in upper tooth"], gap: [6, 9], lab: "crown",
    build: () => { const t = tooth(TEETH_POST); const crown = chance(0.75); const zir = crown && chance(0.3);
      const items = [{ description: `Root Canal Treatment - Tooth ${t}`, unitPrice: pick([4500, 5000, 5500, 6000]) }];
      if (crown) items.push({ description: `${zir ? "Zirconia" : "PFM"} Crown - Tooth ${t}`, unitPrice: zir ? pick([11000, 12000]) : pick([5500, 6000, 6500]) });
      return { items, sessions: crown ? 4 : 3, tooth: t, crown: crown ? (zir ? "Zirconia Crown" : "PFM Crown") : null }; } },
  extraction: { w: 5, name: "Tooth Extraction", custom: true, sessions: 1, reasons: ["Broken tooth", "Mobile tooth causing pain"], sameDay: 0.8,
    items: () => [{ description: `Simple Extraction - Tooth ${tooth(TEETH_POST)}`, unitPrice: pick([800, 1000, 1200]), itemType: "surgery" }] },
  wisdom: { w: 5, name: "Wisdom Teeth", sessions: 2, gap: [7, 8], reasons: ["Swelling near wisdom tooth", "Pain behind last molar"],
    items: () => [{ description: `Surgical Extraction - Tooth ${pick(["38", "48"])}`, unitPrice: pick([4500, 5000, 6000]), itemType: "surgery" }] },
  crown: { w: 4, name: "Dental Crowns and Bridges", sessions: 2, gap: [7, 10], reasons: ["Broken front tooth", "Missing tooth replacement"], lab: "crown",
    build: () => chance(0.5)
      ? { items: [{ description: "3-Unit PFM Bridge (Teeth 14-16)", unitPrice: pick([15000, 16500, 18000]) }], sessions: 3, crown: "PFM Crown", units: 3 }
      : { items: [{ description: `Zirconia Crown - Tooth ${tooth(TEETH_ANT)}`, unitPrice: pick([11000, 12000]) }], sessions: 2, crown: "Zirconia Crown", units: 1 } },
  kids: { w: 5, name: "Kids Dentistry", kidsOnly: true, reasons: ["Cavity in child's tooth", "Child's first dental check-up", "Pain in milk tooth"],
    build: () => pick([
      { items: [{ description: "Pit & Fissure Sealants (4 teeth)", unitPrice: 2000 }, { description: "Fluoride Application", unitPrice: 800 }], sessions: 1 },
      { items: [{ description: `Pulpotomy - Tooth ${pick(["74", "75", "84", "85"])}`, unitPrice: 2500 }, { description: "Stainless Steel Crown", unitPrice: 2000 }], sessions: 2 },
      { items: [{ description: "GIC Filling (2 teeth)", unitPrice: 1600 }], sessions: 1 },
    ]) },
  whitening: { w: 3, name: "Teeth Whitening", sessions: 1, reasons: ["Yellow teeth / stains", "Wants brighter smile before wedding"],
    items: () => [{ description: "In-office Teeth Whitening", unitPrice: pick([6500, 7000, 8000]) }] },
  implant: { w: 4, name: "Dental Implant", sessions: 4, gaps: [[9, 12], [70, 85], [8, 12]], reasons: ["Missing tooth replacement", "Extracted tooth - wants fixed replacement"], minAge: 30, lab: "implant",
    items: () => { const t = pick(["36", "46", "26", "16"]); return [{ description: `Dental Implant (Osstem) - Tooth ${t}`, unitPrice: pick([28000, 30000, 32000]) }, { description: `Implant Crown (PFM) - Tooth ${t}`, unitPrice: 8000 }]; } },
  aligners: { w: 3, name: "Clear Aligners", sessions: 6, gap: [21, 28], reasons: ["Crooked teeth consultation", "Gap between front teeth"], maxAge: 40,
    items: () => [{ description: "Clear Aligners - Full Arch (Upper & Lower)", unitPrice: pick([95000, 110000, 125000]) }] },
  braces: { w: 3, name: "Braces", sessions: 8, gap: [26, 32], reasons: ["Crooked teeth consultation", "Forwardly placed upper teeth"], maxAge: 30,
    items: () => (chance(0.7) ? [{ description: "Metal Braces - Full Mouth", unitPrice: pick([32000, 35000]) }] : [{ description: "Ceramic Braces - Full Mouth", unitPrice: 45000 }]) },
  dentures: { w: 2, name: "Dentures", sessions: 4, gap: [5, 7], reasons: ["Difficulty chewing - missing teeth", "Denture consultation"], minAge: 55, lab: "denture",
    items: () => [{ description: "Complete Denture (Upper & Lower)", unitPrice: pick([16000, 18000, 20000]) }] },
  bonding: { w: 2, name: "Cosmetic Dental Bonding", sessions: 1, reasons: ["Gap between front teeth", "Chipped front tooth"], maxAge: 45,
    items: () => [{ description: "Composite Bonding - Teeth 11, 21", unitPrice: 6000 }] },
  laser: { w: 2, name: "Laser Dentistry", sessions: 1, reasons: ["Dark gums", "Gum overgrowth"],
    items: () => [{ description: "Laser Gum Depigmentation (Upper & Lower)", unitPrice: 7000 }] },
  ulcer: { w: 2, name: "Mouth Ulcers", sessions: 1, reasons: ["Mouth ulcer not healing", "Recurrent mouth ulcers"], sameDay: 0.9,
    items: () => [{ description: "Laser Ulcer Therapy", unitPrice: 1500 }] },
  nightguard: { w: 1, name: "Night Guard", custom: true, sessions: 2, gap: [7, 7], reasons: ["Teeth grinding at night", "Jaw pain in the morning"], lab: "nightguard",
    items: () => [{ description: "Occlusal Night Guard (Hard Acrylic)", unitPrice: 3500, itemType: "other" }] },
};
const OPD_ONLY_REASONS = ["Routine dental check-up", "Sensitivity to cold drinks", "Second opinion for treatment plan", "Mouth ulcer since a week", "Jaw clicking while chewing", "Bad breath", "Follow-up review", "Bleeding gums while brushing"];

function chooseTemplate(p) {
  const pool = Object.entries(PLAN_TEMPLATES).filter(([k, t]) => {
    if (t.kidsOnly) return p.kid;
    if (p.kid) return ["filling", "extraction"].includes(k);
    if (t.minAge && p.ageYears < t.minAge) return false;
    if (t.maxAge && p.ageYears > t.maxAge) return false;
    return true;
  });
  // late-history growth: more big-ticket plans in the last 3 months
  return weighted(pool.map(([k, t]) => [k, t.w]));
}

const PLANS = []; // treatment plan work objects

/**
 * Create a treatment plan: parent appointment (session 1) booked at the end of the
 * originating OPD visit, plus the session chain. Sessions are booked one at a time
 * at the end of the previous visit (exactly like "Book next session" in the UI).
 */
function startPlan(p, opd, tplKey, opts = {}) {
  const tpl = PLAN_TEMPLATES[tplKey];
  const built = tpl.build ? tpl.build() : { items: tpl.items(), sessions: tpl.sessions };
  const items = opts.items || built.items;
  const sessionsPlanned = opts.sessionsPlanned || built.sessions || tpl.sessions || 1;
  const manualDiscount = opts.discountPct ?? (chance(0.12) ? pick([5, 10]) : 0);
  const bookedMs = opts.bookedMs || opd.doneMs + int(2, 9) * MIN;
  // treatment date: same day after the OPD, or a few days later
  let first;
  if (opts.first) first = opts.first;
  else if (chance(tpl.sameDay ?? 0.25)) first = reserveSlot(opd.key, { after: hmOf(bookedMs + 10 * MIN) });
  else first = reserveSlot(addDays(opd.key, int(1, 6)), { prefer: p.ageYears > 50 ? "morning" : null });
  const subtotal = items.reduce((s, it) => s + it.unitPrice, 0);
  const fee = Math.max(0, subtotal - Math.round((subtotal * manualDiscount) / 100));
  const by = opts.by || deskUser(opd.clinicKey, bookedMs);
  const parent = newAppointment({
    p, clinicKey: opd.clinicKey, key: first.key, slot: first.slot, visitType: "treatment", treatmentName: tpl.name,
    sessionsPlanned, originatingOpd: opd, fee, opdFee: fee, reason: tpl.name, source: "walk_in", createdMs: bookedMs, createdBy: by,
    paymentMethod: "cash", paymentStatus: "unpaid",
  });
  const inv = newInvoice({
    p, clinicKey: opd.clinicKey, appt: parent,
    items: items.map((it) => ({ itemType: it.itemType || "treatment", description: it.description, unitPrice: it.unitPrice })),
    discountPct: manualDiscount, paymentMethod: "pay-at-clinic", createdBy: by, createdMs: bookedMs + int(30, 90),
  });
  parent.invoice = inv;
  touch(parent, inv.createdMs + 25);
  const plan = { p, tplKey, tpl, parent, inv, sessions: [parent], sessionsPlanned, built, clinicKey: opd.clinicKey, opd };
  // advance at booking
  const gt = grandTotal(inv);
  const advance = opts.advance !== undefined ? opts.advance : gt <= 2500 ? (chance(0.45) ? gt : 0) : chance(0.62) ? Math.min(gt, Math.max(500, roundTo(gt * (0.2 + R() * 0.25), 500))) : 0;
  if (advance > 0) {
    const mode = opts.advanceMode || (chance(0.5) ? "upi" : "cash");
    parent.opdFeePaid = true;
    parent.paymentStatus = "paid";
    parent.paymentMethod = mode;
    inv.paymentMethod = mode;
    payAtBooking({ appt: parent, inv, amount: advance, mode, ms: inv.createdMs + int(40, 120), typeLabel: "treatment" });
  }
  PLANS.push(plan);
  return plan;
}
function bookSession(plan, at, bookedMs, by) {
  const n = plan.sessions.length + 1;
  const s = newAppointment({
    p: plan.p, clinicKey: plan.clinicKey, key: at.key, slot: at.slot, visitType: "treatment_session", parent: plan.parent,
    sessionNumber: n, treatmentName: plan.parent.treatmentName, fee: 0, opdFee: 0, isFree: true, opdFeePaid: false,
    paymentStatus: "free", paymentMethod: "free", invoice: plan.inv, reason: `Session ${n} — ${plan.parent.treatmentName}`,
    source: "walk_in", createdMs: bookedMs, createdBy: by,
  });
  plan.sessions.push(s);
  return s;
}
function nextGap(plan, idx) {
  const tpl = plan.tpl;
  if (tpl.gaps) {
    const g = tpl.gaps[Math.min(idx, tpl.gaps.length - 1)];
    return int(g[0], g[1]);
  }
  const g = tpl.gap || [7, 10];
  return int(g[0], g[1]);
}

/**
 * Walk a plan forward through time: complete past visits, take payments, book
 * the next session, stop at ANCHOR (future sessions stay "scheduled").
 * `stopAfter` -> stale/abandoned behaviour.
 */
function runPlan(plan, { stopAfter = null, payStyle = "normal", closeChance = 0.85 } = {}) {
  const gt = grandTotal(plan.inv);
  let i = 0;
  for (;;) {
    const visit = plan.sessions[i];
    const visitStart = slotStartMs(visit);
    if (visitStart >= ANCHOR_NOW) break; // future visit: leave scheduled
    const endMs = completeVisit(visit);
    // payment at this visit
    const bal = balanceOf(plan.inv, endMs);
    const isLast = i + 1 >= plan.sessionsPlanned;
    if (bal > 0 && payStyle !== "none") {
      const by = deskUser(plan.clinicKey, endMs);
      let amt = 0;
      if (isLast) amt = chance(payStyle === "dues" ? 0 : 0.88) ? bal : roundTo(bal * 0.5, 100);
      else if (chance(0.62)) amt = Math.min(bal, Math.max(500, roundTo(gt / plan.sessionsPlanned + (R() - 0.5) * gt * 0.1, 500)));
      if (amt > 0) collect({ inv: plan.inv, amount: amt, mode: weighted([["upi", 46], ["cash", 36], ["card", 18]]), ms: endMs + int(2, 8) * MIN, by, appt: visit, notes: isLast ? (amt === bal ? "Balance cleared" : undefined) : chance(0.4) ? `Session ${i + 1} payment` : undefined });
    }
    if (isLast) break;
    if (stopAfter !== null && i + 1 >= stopAfter) break;
    // book next session at the end of this visit
    const gap = nextGap(plan, i);
    const at = reserveSlot(addDays(visit.key, gap), { prefer: chance(0.5) ? "evening" : null });
    bookSession(plan, at, endMs + int(3, 12) * MIN, deskUser(plan.clinicKey, endMs));
    i++;
  }
  const doneAll = plan.sessions.length >= plan.sessionsPlanned && plan.sessions.every((s) => s.status === "completed");
  if (doneAll && balanceOf(plan.inv) === 0 && chance(closeChance)) {
    const last = plan.sessions[plan.sessions.length - 1];
    closePlan(plan, "completed", pick(["All sessions completed, patient satisfied", "Treatment completed successfully", "Final restoration done, review in 6 months", "Completed as planned"]), last.doneMs + int(10, 40) * MIN);
  }
  return plan;
}
const RESOLUTION_STATUS = { completed: "completed", write_off: "abandoned", refund: "closed_early" };
function closePlan(plan, resolution, reason, ms, by = null) {
  const parent = plan.parent;
  const actor = by || U[C[plan.clinicKey].doctor];
  parent.treatmentStatus = RESOLUTION_STATUS[resolution];
  parent.treatmentClosedMs = ms;
  parent.treatmentClosedReason = reason;
  parent.treatmentHistory.push({ action: "closed", resolution: RESOLUTION_STATUS[resolution], reason, performedBy: actor._id, performedMs: ms, _id: oid(ms) });
  if (parent.status !== "completed") parent.status = "completed";
  touch(parent, ms);
  for (const s of plan.sessions) {
    if (s.visitType === "treatment_session" && s.status === "scheduled") {
      s.status = "cancelled";
      s.cancellationReason = `Treatment plan closed: ${reason}`;
      touch(s, ms + 5);
    }
  }
  if (resolution === "completed" || resolution === "write_off") {
    const bal = balanceOf(plan.inv, ms);
    if (bal > 0) {
      plan.inv.writeOff = { ms: ms + 20, reason, resolution, outstanding: bal };
      plan.inv.intentional = "write-off (amountPaid set to grandTotal without a Payment)";
      plan.inv.events.push({ ms: ms + 20, delta: bal, kind: "writeoff" });
      touch(plan.inv, ms + 20);
    }
  }
  plan.closed = resolution;
}

// ---- memberships (assign-manual, the only membership flow used here) -------
function assignMembership(p, { planKey, ms, by, amountPaid, method, startKey = null, endKey = null, notes, legacy = false }) {
  const plan = planKey ? PLAN[planKey] : null;
  const startMs = startKey ? Date.parse(dateOnly(startKey)) : ms;
  const expiryMs = endKey ? Date.parse(dateOnly(endKey)) : addMonthsMs(startMs, 12);
  if (p.membership) {
    const prev = p.membership;
    p.membershipHistory.push({ ...prev, status: prev.status === "active" ? "expired" : prev.status });
  }
  p.membership = {
    planKey, plan: plan ? plan._id : null, planName: plan ? plan.name : notes, discountPercent: plan ? plan.discountPercentage : 0,
    startMs, expiryMs, status: "active", statusHistory: [], amountPaid, paymentMethod: method, assignedBy: by._id, notes: legacy ? notes : notes, assignedMs: ms,
  };
  p.events.push(ms);
  if (amountPaid > 0) {
    const inv = newInvoice({ p, clinicKey: p.clinicKey, items: [{ itemType: "membership", description: plan.name, unitPrice: amountPaid }], paymentMethod: { cash: "cash", card: "card", upi: "upi", bank_transfer: "online", online: "online" }[method], createdBy: by._id, createdMs: ms + int(40, 120), applyMember: false });
    const pay = newPayment({
      kind: "membership", p, amount: amountPaid, paymentMode: { cash: "cash", card: "card", upi: "upi", bank_transfer: "netbanking", online: "razorpay" }[method],
      type: "membership", status: "paid", recordedBy: by._id, createdMs: inv.createdMs + int(30, 90), settled: [{ inv, applied: amountPaid, _id: null }],
    });
    pay.settled[0]._id = oid(pay.createdMs);
    inv.events.push({ ms: inv.createdMs, delta: amountPaid, pay, kind: "settle", initial: true });
    p.membership.invoice = inv;
  }
  EVENTS.push({ kind: "membership_activated", p, ms: ms + 300, planName: p.membership.planName, startMs, expiryMs });
}

// ============================================================================
// 14a. The scripted DEMO PATIENT (rich history for the patient portal)
// ============================================================================
const DEMO = P[0];
const demoTimeline = {};
{
  const p = DEMO;
  const ritu = U.ritu;
  p.createdMs = jitter(istMs("2026-05-12", "10:02"));
  p.createdVia = "admin";
  // 2026-05-12 OPD walk-in, paid cash at booking
  const opd1 = bookOpd(p, { ...reserveExact("2026-05-12", "10:30"), source: "walk_in", createdMs: jitter(istMs("2026-05-12", "10:05")), reason: "Severe toothache in lower left back tooth", payNow: "cash", by: ritu });
  completeVisit(opd1);
  demoTimeline.opd1 = opd1;
  // RCT + PFM crown on 36, 4 sessions
  const rct = startPlan(p, opd1, "rct", {
    items: [{ description: "Root Canal Treatment - Tooth 36", unitPrice: 5500 }, { description: "PFM Crown - Tooth 36", unitPrice: 6500 }],
    sessionsPlanned: 4, discountPct: 0, first: reserveExact("2026-05-14", "18:00"), bookedMs: jitter(istMs("2026-05-12", "11:04")), by: ritu, advance: 3000, advanceMode: "cash",
  });
  rct.built = { crown: "PFM Crown", tooth: "36" };
  rct.demo = true;
  demoTimeline.rct = rct;
  // walk the RCT manually so payments are exact
  const s1 = rct.parent;
  let end = completeVisit(s1);
  let s2 = bookSession(rct, reserveExact("2026-05-21", "18:30"), end + 6 * MIN, ritu);
  end = completeVisit(s2);
  collect({ inv: rct.inv, amount: 3000, mode: "upi", ms: end + 4 * MIN, by: ritu, appt: s2, notes: "Session 2 payment" });
  const s3 = bookSession(rct, reserveExact("2026-05-29", "18:00"), end + 9 * MIN, ritu);
  end = completeVisit(s3);
  demoTimeline.crownOrderMs = end + 25 * MIN;
  const s4 = bookSession(rct, reserveExact("2026-06-10", "19:00"), end + 7 * MIN, ritu);
  end = completeVisit(s4);
  collect({ inv: rct.inv, amount: 6000, mode: "card", ms: end + 5 * MIN, by: ritu, appt: s4, notes: "Balance cleared" });
  closePlan(rct, "completed", "Crown cemented on 36, RCT complete", end + 18 * MIN, U.arjun);
  demoTimeline.rctEnd = end;
  // membership: Individuals Plan bought at the desk on 2026-06-02 (UPI)
  assignMembership(p, { planKey: "individual", ms: jitter(istMs("2026-06-02", "17:40")), by: ritu, amountPaid: 2000, method: "upi", notes: "Joined after RCT consultation" });
  // 2026-08-18 routine check-up booked by the patient on the portal (free for members)
  const opd2 = bookOpd(p, { ...reserveExact("2026-08-18", "17:30"), source: "online", createdMs: jitter(istMs("2026-08-15", "21:12")), reason: "Routine check-up and cleaning", followUp: true });
  demoTimeline.opd2 = opd2;
  completeVisit(opd2);
  const scal = startPlan(p, opd2, "scaling", {
    items: [{ description: "Scaling & Polishing (full mouth)", unitPrice: 1500 }], sessionsPlanned: 1, discountPct: 0,
    first: reserveExact("2026-08-18", "18:30"), bookedMs: jitter(istMs("2026-08-18", "18:04")), by: ritu, advance: 0,
  });
  end = completeVisit(scal.parent);
  collect({ inv: scal.inv, amount: grandTotal(scal.inv), mode: "upi", ms: end + 6 * MIN, by: ritu, appt: scal.parent });
  closePlan(scal, "completed", "Scaling done, oral hygiene instructions given", end + 15 * MIN, U.arjun);
  // 2026-10-05 aligner consultation (member -> free OPD, phone booking)
  const opd3 = bookOpd(p, { ...reserveExact("2026-10-05", "18:00"), source: "phone", createdMs: jitter(istMs("2026-10-03", "12:20")), reason: "Crooked lower front teeth - aligner consultation", by: ritu });
  completeVisit(opd3);
  demoTimeline.opd3 = opd3;
  const aligners = startPlan(p, opd3, "aligners", {
    items: [{ description: "Clear Aligners - Full Arch (Upper & Lower)", unitPrice: 110000 }], sessionsPlanned: 6, discountPct: 0,
    first: reserveExact("2026-10-12", "17:00"), bookedMs: jitter(istMs("2026-10-05", "18:41")), by: ritu, advance: 30000, advanceMode: "upi",
  });
  end = completeVisit(aligners.parent);
  demoTimeline.alignerStart = end;
  const today = bookSession(aligners, reserveExact(ANCHOR, "16:00"), end + 8 * MIN, ritu);
  demoTimeline.alignerToday = today;
  demoTimeline.aligners = aligners;
  // upcoming: wisdom-tooth review booked by the patient on the portal (free)
  const opd4 = bookOpd(p, { ...reserveExact("2026-10-31", "11:00"), source: "online", createdMs: jitter(istMs("2026-10-24", "22:05")), reason: "Mild pain near lower right wisdom tooth" });
  demoTimeline.upcoming = opd4;
}

// ============================================================================
// 14b. Random history for everyone else
// ============================================================================
const SPECIAL = { stale: 2, abandoned: 1, refund: 1 };
const MEMBERSHIP_METHODS = ["cash", "upi", "upi", "card", "bank_transfer"];
function joinMembership(p, ms, by, tplKey) {
  const planKey = weighted([["individual", 50], ["family", 22], ["women", p.gender === "female" ? 25 : 0], ["implant", tplKey === "implant" ? 60 : 0]]);
  assignMembership(p, { planKey, ms, by, amountPaid: PLAN[planKey].price, method: pick(MEMBERSHIP_METHODS) });
}
function settleOpdAfterVisit(opd, end, prob = 0.9) {
  if (opd.invoice && paidSoFar(opd.invoice) === 0 && chance(prob)) {
    collect({ inv: opd.invoice, amount: grandTotal(opd.invoice), mode: weighted([["cash", 52], ["upi", 48]]), ms: end + int(1, 6) * MIN, by: deskUser(opd.clinicKey, end), appt: opd });
  }
}
for (const p of P.slice(1)) {
  // ---- registration & first OPD -------------------------------------------
  let source = weighted(OPD_SOURCES);
  const at = reserveSlot(p.regKey, { prefer: p.ageYears > 55 ? "morning" : p.ageYears < 40 && source !== "walk_in" ? "evening" : null });
  const visitMs = slotStartMs(at);
  if (source === "walk_in" && visitMs - 40 * MIN > ANCHOR_NOW) source = "phone"; // cannot walk in in the future
  let createdMs;
  if (source === "walk_in") createdMs = jitter(visitMs - int(8, 35) * MIN);
  else {
    const bookKey = addDays(at.key, -int(1, 5));
    createdMs = jitter(istMs(bookKey, source === "online" ? pick(["07:40", "08:55", "13:20", "21:10", "22:35", "16:05"]) : pick(["10:20", "11:45", "15:10", "17:35", "19:05"])));
    if (createdMs > ANCHOR_NOW) createdMs = jitter(ANCHOR_NOW - int(30, 180) * MIN);
  }
  p.createdVia = source === "online" ? "online" : source === "walk_in" && chance(0.5) ? "admin" : "quickadd";
  p.createdMs = p.createdVia === "admin" ? createdMs - int(2, 6) * MIN : createdMs - int(20, 90) * 1000;
  p.registeredBy = p.createdVia === "quickadd" ? deskUser(p.clinicKey, p.createdMs) : null;

  const tplKey = chance(0.68) ? chooseTemplate(p) : null;
  const tpl = tplKey ? PLAN_TEMPLATES[tplKey] : null;
  const reason = tpl ? pick(tpl.reasons) : pick(OPD_ONLY_REASONS);
  // ~12% of adults join a membership plan at the desk before their first consult (OPD then free)
  if (!p.kid && source === "walk_in" && chance(0.12)) joinMembership(p, createdMs - int(1, 4) * MIN, deskUser(p.clinicKey, createdMs), tplKey);
  const payNow = source === "walk_in" ? (chance(0.72) ? pick(["cash", "upi"]) : null) : source === "phone" && chance(0.1) ? "upi" : null;
  const opd = bookOpd(p, { key: at.key, slot: at.slot, source, createdMs, reason, payNow, emergency: chance(0.06) });

  // ---- what happened at the visit ----------------------------------------
  if (visitMs < ANCHOR_NOW) {
    const r = R();
    if (source !== "walk_in" && r < 0.09) {
      const end = completeVisit(opd, "no_show");
      if (opd.invoice && chance(0.65)) cancelInvoice(opd.invoice, end + int(1, 4) * HOUR, deskUser(opd.clinicKey, end), "Patient did not turn up");
      continue;
    }
    if (source === "phone" && r < 0.22) {
      cancelVisit(opd, jitter(visitMs - int(2, 20) * HOUR), pick(["Patient requested cancellation", "Patient unwell, will call back", "Out of station", "Clash with office timings"]));
      continue;
    }
    const end = completeVisit(opd);
    settleOpdAfterVisit(opd, end);
    // ~18% more join after the consultation (to get the treatment discount)
    if (!p.kid && !p.membership && chance(tplKey ? 0.22 : 0.08)) joinMembership(p, end + int(5, 15) * MIN, deskUser(p.clinicKey, end), tplKey);
    if (tplKey) {
      const plan = startPlan(p, opd, tplKey, { bookedMs: end + int(16, 30) * MIN });
      const startedDaysAgo = daysBetween(plan.parent.key, ANCHOR);
      if (SPECIAL.stale > 0 && ["braces", "aligners", "implant"].includes(tplKey) && startedDaysAgo > 115) {
        SPECIAL.stale--;
        plan.special = "stale";
        runPlan(plan, { stopAfter: 2 });
      } else if (SPECIAL.refund > 0 && ["braces", "aligners", "implant", "dentures"].includes(tplKey) && startedDaysAgo > 35) {
        SPECIAL.refund--;
        plan.special = "refund";
        runPlan(plan, { stopAfter: 3 });
      } else if (SPECIAL.abandoned > 0 && tplKey === "rct" && startedDaysAgo > 25 && startedDaysAgo < 80) {
        SPECIAL.abandoned--;
        plan.special = "abandoned";
        runPlan(plan, { stopAfter: 2 });
      } else {
        runPlan(plan, { payStyle: chance(0.1) ? "dues" : "normal" });
      }
    }
  }
  // ---- second episode (recall / new complaint) ----------------------------
  if (chance(COUNTS.secondEpisodeChance)) {
    const lastKey = (p.appts || []).reduce((m, a) => (a.key > m ? a.key : m), p.regKey);
    const k2 = addDays(lastKey, int(25, 95));
    if (k2 >= addDays(ANCHOR, 18)) continue;
    let src2 = weighted([["phone", 45], ["walk_in", 35], ["online", 20]]);
    const at2 = reserveSlot(k2, { prefer: p.ageYears < 40 ? "evening" : null });
    const v2 = slotStartMs(at2);
    if (src2 === "walk_in" && v2 > ANCHOR_NOW) src2 = "phone";
    let created2 = src2 === "walk_in" ? jitter(v2 - int(8, 30) * MIN) : jitter(istMs(addDays(at2.key, -int(1, 4)), pick(["10:40", "12:15", "16:50", "18:25", "21:40"])));
    if (created2 > ANCHOR_NOW) created2 = jitter(ANCHOR_NOW - int(40, 200) * MIN);
    const tpl2 = chance(0.42) ? (p.kid ? "kids" : pick(["scaling", "filling", "filling", "whitening", "scaling"])) : null;
    const opd2 = bookOpd(p, {
      key: at2.key, slot: at2.slot, source: src2, createdMs: created2,
      reason: tpl2 ? pick(PLAN_TEMPLATES[tpl2].reasons) : pick(["Routine dental check-up", "6-month recall check-up", "Follow-up review", "Sensitivity after treatment"]),
      followUp: true, payNow: src2 === "walk_in" && chance(0.7) ? pick(["cash", "upi"]) : null,
    });
    if (v2 < ANCHOR_NOW) {
      if (src2 === "phone" && chance(0.08)) completeVisit(opd2, "no_show");
      else {
        const end2 = completeVisit(opd2);
        settleOpdAfterVisit(opd2, end2, 0.88);
        if (tpl2) runPlan(startPlan(p, opd2, tpl2, { bookedMs: end2 + int(16, 30) * MIN }));
      }
    }
  }
}

// ---- the special plans: abandoned / refunded / stale ------------------------
for (const plan of PLANS.filter((pl) => pl.special === "abandoned")) {
  // patient stopped coming: the booked session 3 is cancelled at closure
  const last = plan.sessions[plan.sessions.length - 1];
  const at = reserveSlot(addDays(last.key, int(6, 8)));
  bookSession(plan, at, last.doneMs + 6 * MIN, deskUser(plan.clinicKey, last.doneMs));
  const closeMs = jitter(istMs(addDays(at.key, int(1, 3)), "12:30"));
  if (closeMs < ANCHOR_NOW) closePlan(plan, "write_off", "Patient shifted to Delhi, will complete treatment there", closeMs, U[C[plan.clinicKey].manager]);
}
// guarantee one "closed early + refund" plan even if no template matched above
if (SPECIAL.refund > 0) {
  const cand = PLANS.find((pl) => !pl.p.isDemo && !pl.closed && !pl.special && pl.sessionsPlanned >= 3 && pl.sessions.length >= 2 && pl.sessions.every((x) => x.status === "completed") && pl.inv.events.some((e) => e.pay && e.pay.kind === "collect") && daysBetween(pl.parent.key, ANCHOR) > 20);
  if (cand) { cand.special = "refund"; SPECIAL.refund--; }
}
for (const plan of PLANS.filter((pl) => pl.special === "refund")) {
  const last = plan.sessions[plan.sessions.length - 1];
  const closeMs = jitter(istMs(nextWorkingDay(addDays(last.key, int(5, 12))), "13:10"));
  if (closeMs < ANCHOR_NOW) {
    closePlan(plan, "refund", "Patient relocating to Bengaluru - treatment discontinued, unused amount refunded", closeMs, U.arjun);
    plan.refundMs = closeMs + int(10, 40) * MIN;
  }
}

// ============================================================================
// 14c. Legacy & lifecycle memberships (expired / expiring / renewed / paused / cancelled)
// ============================================================================
{
  const pool = shuffle(P.filter((p) => !p.kid && !p.isDemo && !p.membership && p.appts && p.appts[0].doneMs));
  const take = () => pool.shift();
  const firstDone = (p) => p.appts[0].doneMs + int(5, 20) * MIN;
  const legacy = (p, planKey, start, end, ms) =>
    assignMembership(p, { planKey, ms, by: U[C[p.clinicKey].manager], amountPaid: undefined, method: undefined, startKey: start, endKey: end, notes: "Migrated from paper membership register" });
  // migrated paper-register members (no amount -> no invoice/payment); already expired
  for (const [start, end] of [["2025-08-20", "2026-08-20"], ["2025-09-12", "2026-09-12"], ["2025-10-02", "2026-10-02"]]) {
    const p = take();
    legacy(p, "individual", start, end, firstDone(p));
  }
  // migrated & still valid, expiring within 30 days of ANCHOR
  {
    const p = take();
    legacy(p, "family", "2025-11-12", "2026-11-12", firstDone(p));
  }
  // renewed: expired legacy record moved to membershipHistory, new paid plan
  {
    const p = take();
    legacy(p, "individual", "2025-07-01", "2026-07-01", firstDone(p));
    const planKey = p.gender === "female" ? "women" : "individual";
    assignMembership(p, { planKey, ms: jitter(istMs("2026-09-08", "17:15")), by: U[C[p.clinicKey].manager], amountPaid: PLAN[planKey].price, method: "upi", notes: "Renewed after expiry" });
  }
  // paused (benefits suspended)
  {
    const p = take();
    assignMembership(p, { planKey: "individual", ms: firstDone(p), by: U[C[p.clinicKey].manager], amountPaid: 2000, method: "cash" });
    const pausedMs = jitter(istMs(addDays(ANCHOR, -12), "16:20"));
    Object.assign(p.membership, { status: "paused", pausedMs, endedMs: pausedMs });
    p.membership.statusHistory.push({ action: "paused", reason: "Patient travelling abroad for 3 months", performedBy: U[C[p.clinicKey].manager]._id, performedMs: pausedMs, _id: oid(pausedMs) });
    p.events.push(pausedMs);
  }
  // cancelled
  {
    const p = take();
    assignMembership(p, { planKey: "family", ms: firstDone(p), by: U[C[p.clinicKey].manager], amountPaid: 4999, method: "upi" });
    const cancelMs = jitter(istMs(addDays(ANCHOR, -6), "12:05"));
    Object.assign(p.membership, { status: "cancelled", endedMs: cancelMs });
    p.membership.statusHistory.push({ action: "cancelled", reason: "Duplicate membership - family already covered under spouse's plan", performedBy: U.arjun._id, performedMs: cancelMs, _id: oid(cancelMs) });
    p.events.push(cancelMs);
  }
}

// ============================================================================
// 15. TODAY (ANCHOR) + UPCOMING BOOKINGS
// ============================================================================
const todayPlan = [];
{
  const nonMembers = shuffle(P.filter((p) => !p.isDemo && !p.membership && !p.kid && (p.appts || []).length > 0 && p.appts.every((a) => a.key < ANCHOR)));
  const newcomer = (clinicKey) => {
    const prof = makePatientProfile({ gender: chance(0.5) ? "male" : "female", ageYears: int(22, 50) });
    const p = { ...prof, regKey: ANCHOR, clinicKey, idx: P.length, membership: null, membershipHistory: [], events: [] };
    P.push(p);
    return p;
  };
  // 1) 09:30 walk-in newcomer, paid cash, completed -> 4) same patient: scaling 11:30, in progress
  {
    const p = newcomer("US");
    const at = reserveExact(ANCHOR, "09:30");
    const created = jitter(istMs(ANCHOR, "09:14"));
    p.createdMs = created - 3 * MIN;
    p.createdVia = "admin";
    const opd = bookOpd(p, { ...at, source: "walk_in", createdMs: created, reason: "Bleeding gums while brushing", payNow: "cash", allowAnchor: true });
    completeVisit(opd);
    const plan = startPlan(p, opd, "scaling", { first: reserveExact(ANCHOR, "11:30"), bookedMs: jitter(istMs(ANCHOR, "10:06")), items: [{ description: "Scaling & Polishing (full mouth)", unitPrice: 1500 }], sessionsPlanned: 1, discountPct: 0, advance: 0 });
    plan.parent.status = "in_progress";
    touch(plan.parent, jitter(istMs(ANCHOR, "11:36")));
    todayPlan.push(opd, plan.parent);
  }
  // 2) 10:00 RCT session 2 for a plan started last Monday, completed + collected
  {
    const p = nonMembers.shift();
    const opdAt = reserveSlot(addDays(ANCHOR, -7), { prefer: "morning" });
    const opd = bookOpd(p, { ...opdAt, source: "phone", createdMs: jitter(istMs(addDays(ANCHOR, -9), "11:50")), reason: "Severe toothache at night", followUp: true });
    const end = completeVisit(opd);
    collect({ inv: opd.invoice, amount: grandTotal(opd.invoice), mode: "upi", ms: end + 3 * MIN, by: U.ritu, appt: opd });
    const plan = startPlan(p, opd, "rct", { first: reserveSlot(opdAt.key, { after: hmOf(slotStartMs(opdAt) + 70 * MIN) }), advance: 2000, advanceMode: "upi", items: [{ description: "Root Canal Treatment - Tooth 46", unitPrice: 5500 }, { description: "PFM Crown - Tooth 46", unitPrice: 6000 }], sessionsPlanned: 4, discountPct: 0 });
    plan.built = { crown: "PFM Crown", tooth: "46" };
    const e1 = completeVisit(plan.parent);
    const s2 = bookSession(plan, reserveExact(ANCHOR, "10:00"), e1 + 7 * MIN, U.ritu);
    const e2 = completeVisit(s2);
    collect({ inv: plan.inv, amount: 3000, mode: "upi", ms: e2 + 4 * MIN, by: U.ritu, appt: s2, notes: "Session 2 payment" });
    bookSession(plan, reserveSlot(addDays(ANCHOR, 6), { prefer: "morning" }), e2 + 9 * MIN, U.ritu);
    todayPlan.push(s2);
  }
  // 3) 10:30 online-booked OPD (Razorpay prepaid, booked 3 days ago), completed
  {
    const p = nonMembers.shift();
    const opd = bookOpd(p, { ...reserveExact(ANCHOR, "10:30"), clinicKey: "UM", source: "online", createdMs: jitter(istMs(addDays(ANCHOR, -3), "21:47")), reason: "Sensitivity to cold drinks", followUp: true });
    completeVisit(opd);
    todayPlan.push(opd);
  }
  // 5) 12:00 walk-in at Murthal Road, checked in, will pay after the visit
  {
    const p = newcomer("UM");
    const created = jitter(istMs(ANCHOR, "11:41"));
    p.createdMs = created - 50 * 1000;
    p.createdVia = "quickadd";
    p.registeredBy = U.amit;
    const opd = bookOpd(p, { ...reserveExact(ANCHOR, "12:00"), source: "walk_in", createdMs: created, reason: "Broken tooth while eating", payNow: null });
    opd.createdBy = U.amit;
    opd.status = "checked_in";
    touch(opd, jitter(istMs(ANCHOR, "11:58")));
    todayPlan.push(opd);
  }
  // 6) 12:30 phone booking, confirmed
  {
    const p = nonMembers.shift();
    const opd = bookOpd(p, { ...reserveExact(ANCHOR, "12:30"), source: "phone", createdMs: jitter(istMs(addDays(ANCHOR, -2), "17:25")), reason: "Food lodgement between teeth", followUp: true });
    opd.status = "confirmed";
    touch(opd, jitter(istMs(ANCHOR, "09:20")));
    todayPlan.push(opd);
  }
  // 7) 16:00 demo patient's aligner session 2 (already booked on 2026-10-12)
  todayPlan.push(demoTimeline.alignerToday);
  // 8) 17:30 emergency phone booking made this morning
  {
    const p = nonMembers.shift();
    const opd = bookOpd(p, { ...reserveExact(ANCHOR, "17:30"), clinicKey: "UM", source: "phone", createdMs: jitter(istMs(ANCHOR, "10:12")), reason: "Swelling on face and severe pain since last night", emergency: true });
    todayPlan.push(opd);
  }
  // 9) 18:00 phone booking cancelled by the patient this morning
  {
    const p = nonMembers.shift();
    const opd = bookOpd(p, { ...reserveExact(ANCHOR, "18:00"), source: "phone", createdMs: jitter(istMs(addDays(ANCHOR, -3), "12:40")), reason: "Routine dental check-up", followUp: true });
    cancelVisit(opd, jitter(istMs(ANCHOR, "11:05")), "Patient called to cancel - out of town");
    todayPlan.push(opd);
  }
  // 10) 19:00 braces adjustment for an ongoing braces plan (Murthal Road)
  {
    const p = shuffle(P.filter((x) => !x.isDemo && !x.kid && x.ageYears <= 30 && (x.appts || []).length && x.appts.every((a) => a.key < addDays(ANCHOR, -60))))[0];
    const opdAt = reserveSlot(addDays(ANCHOR, -64));
    const opd = bookOpd(p, { ...opdAt, clinicKey: "UM", source: "phone", createdMs: jitter(istMs(addDays(opdAt.key, -2), "18:40")), reason: "Crooked teeth consultation", followUp: true });
    const end = completeVisit(opd);
    if (opd.invoice && paidSoFar(opd.invoice) === 0) collect({ inv: opd.invoice, amount: grandTotal(opd.invoice), mode: "cash", ms: end + 3 * MIN, by: U.amit, appt: opd });
    const plan = startPlan(p, opd, "braces", { items: [{ description: "Metal Braces - Full Mouth", unitPrice: 35000 }], sessionsPlanned: 8, discountPct: 0, advance: 10000, advanceMode: "upi", first: reserveSlot(addDays(opd.key, 2), { prefer: "evening" }) });
    const e1 = completeVisit(plan.parent);
    const s2 = bookSession(plan, reserveSlot(addDays(plan.parent.key, 28), { prefer: "evening" }), e1 + 8 * MIN, U.amit);
    const e2 = completeVisit(s2);
    collect({ inv: plan.inv, amount: 5000, mode: "upi", ms: e2 + 4 * MIN, by: U.amit, appt: s2, notes: "Monthly adjustment payment" });
    const s3 = bookSession(plan, reserveExact(ANCHOR, "19:00"), e2 + 9 * MIN, U.amit);
    todayPlan.push(s3);
  }
}
// upcoming OPD bookings in the next ~3 weeks (phone + online, existing & new patients)
{
  const existing = shuffle(P.filter((p) => !p.isDemo && (p.appts || []).length && p.appts.every((a) => a.key < ANCHOR)));
  for (let i = 0; i < 9; i++) {
    const isNew = i % 3 === 2;
    const clinicKey = chance(0.6) ? "US" : "UM";
    let p;
    if (isNew) {
      const prof = makePatientProfile({ gender: chance(0.5) ? "male" : "female", ageYears: int(19, 60) });
      p = { ...prof, regKey: ANCHOR, clinicKey, idx: P.length, membership: null, membershipHistory: [], events: [] };
      P.push(p);
    } else p = existing.shift();
    const src = isNew ? (chance(0.5) ? "online" : "phone") : weighted([["phone", 60], ["online", 40]]);
    const at = reserveSlot(addDays(ANCHOR, int(1, 20)), { prefer: chance(0.5) ? "evening" : null });
    const created = jitter(istMs(addDays(ANCHOR, -int(0, 4)), pick(["08:10", "09:35", "10:50", "11:40"])));
    if (isNew) {
      p.createdMs = created - int(20, 80) * 1000;
      p.createdVia = src === "online" ? "online" : "quickadd";
      p.registeredBy = src === "online" ? null : deskUser(clinicKey, created);
    }
    const reason = isNew ? pick(["Toothache in upper back tooth", "Crooked teeth consultation", "Missing tooth replacement", "Yellow teeth / stains", "Bleeding gums while brushing"]) : pick(["6-month recall check-up", "Routine dental check-up", "Sensitivity after treatment", "Review of old filling"]);
    const opd = bookOpd(p, { ...at, clinicKey, source: src, createdMs: created, reason, followUp: !isNew });
    if (daysBetween(ANCHOR, at.key) <= 2 && chance(0.6)) {
      opd.status = "confirmed";
      touch(opd, jitter(istMs(ANCHOR, "09:45")));
    }
  }
}

// one refunded advance: phone booking prepaid by UPI, then cancelled by the patient
{
  const p = shuffle(P.filter((x) => !x.isDemo && !x.membership && (x.appts || []).length && x.appts.every((a) => a.key < addDays(ANCHOR, -40))))[0];
  const at = reserveSlot(addDays(ANCHOR, -int(18, 30)));
  const created = jitter(istMs(addDays(at.key, -3), "12:10"));
  const opd = bookOpd(p, { ...at, source: "phone", createdMs: created, reason: "Routine dental check-up", payNow: "upi", followUp: true });
  const cancelMs = jitter(istMs(addDays(at.key, -1), "18:30"));
  cancelVisit(opd, cancelMs, "Patient requested cancellation - fee refunded", true);
  const pay = PAYMENTS.find((x) => x.appt === opd && x.kind === "booking");
  const refundMs = cancelMs + int(10, 40) * MIN;
  pay.status = "refunded";
  pay.refund = { amount: pay.amount, refundedMs: refundMs, refundedBy: U.ritu._id, reason: "Appointment cancelled by patient" };
  pay.updatedMs = refundMs;
  // offline refund on a payment with `invoice` set -> invoice.amountPaid -= refund
  opd.invoice.events.push({ ms: refundMs + 30, delta: -pay.amount, kind: "refund" });
  touch(opd.invoice, refundMs + 30);
  opd.invoice.wasPaid = true;
  opd.invoice.intentional = "offline refund reduced stored amountPaid; refunded Payment still counts in live recompute";
  cancelInvoice(opd.invoice, refundMs + int(3, 9) * MIN, U.ritu, "Appointment cancelled, fee refunded");
}
// partial goodwill refund for the closed-early (refund) plan
for (const plan of PLANS.filter((pl) => pl.special === "refund" && pl.refundMs)) {
  const pay = [...PAYMENTS].reverse().find((x) => x.kind === "collect" && x.settled?.[0]?.inv === plan.inv) || PAYMENTS.find((x) => x.kind === "booking" && x.invoiceLink === plan.inv);
  if (pay) {
    const amt = Math.min(pay.amount, roundTo(pay.amount * 0.6, 500) || pay.amount);
    pay.status = "refunded";
    pay.refund = { amount: amt, refundedMs: plan.refundMs, refundedBy: U.arjun._id, reason: "Unused orthodontic sessions refunded on discontinuation" };
    pay.updatedMs = plan.refundMs;
    if (pay.kind === "booking") {
      plan.inv.intentional = "offline refund reduced stored amountPaid";
      plan.inv.events.push({ ms: plan.refundMs + 30, delta: -amt, kind: "refund" });
      touch(plan.inv, plan.refundMs + 30);
    }
  }
}
// one reversed admin payment (recorded on the wrong mode, reversed, re-collected)
{
  const inv = INVOICES.find((iv) => !iv.cancelled && iv.appt && iv.appt.visitType !== "treatment_session" && paidSoFar(iv) === 0 && iv.appt.status === "completed" && !iv.p.isDemo && slotStartMs(iv.appt) > ANCHOR_NOW - 60 * DAY);
  if (inv) {
    const visit = inv.appt;
    const ms = visit.doneMs + 5 * MIN;
    const by = deskUser(inv.clinicKey, ms);
    const amt = Math.min(grandTotal(inv), 1500);
    if (!visit.doneMs) throw new Error("reversal visit not done");
    const wrong = newPayment({ kind: "record", p: inv.p, amount: amt, paymentMode: "card", type: "invoice_payment", status: "paid", paidMs: ms, recordedBy: by._id, createdMs: ms, settled: [{ inv, applied: amt, _id: null }] });
    wrong.settled[0]._id = oid(wrong.createdMs);
    inv.events.push({ ms: wrong.createdMs - 5, delta: amt, pay: wrong, kind: "settle" });
    const revMs = ms + int(6, 15) * MIN;
    wrong.status = "reversed";
    wrong.reversal = { reason: "Card payment declined at terminal - recorded by mistake", ms: revMs, by: by._id };
    wrong.updatedMs = revMs;
    inv.events.push({ ms: revMs, delta: -amt, kind: "reverse" });
    inv.wasPaid = true;
    collect({ inv, amount: amt, mode: "upi", ms: revMs + int(2, 5) * MIN, by: by._id ? by : by, appt: visit, notes: "Re-collected by UPI after card decline" });
  }
}
// one edited treatment invoice (PATCH /appointments/:id/treatment-items)
{
  const plan = PLANS.find((pl) => pl.tplKey === "implant" && !pl.closed && pl.parent.status === "completed");
  if (plan) {
    const ms = plan.parent.doneMs + int(30, 90) * MIN;
    const before = JSON.parse(JSON.stringify(plan.inv.items));
    const beforeTotals = invoiceTotals(plan.inv);
    const added = { description: "Bone Graft (Bio-Oss 0.5g) - Tooth site", unitPrice: 9000, itemType: "treatment" };
    plan.inv.items = [...plan.inv.items.map((it) => ({ itemType: it.itemType, description: it.description, unitPrice: it.unitPrice })), added].map((it) => ({
      itemType: it.itemType, description: it.description, quantity: 1, unitPrice: it.unitPrice, discount: { percentage: 0, amount: 0 }, taxRate: 0, _id: oid(ms),
    }));
    const pct = plan.inv.discount.percentage;
    const before2 = { items: before, discount: { ...plan.inv.discount }, grandTotal: beforeTotals.grandTotal };
    plan.inv.discount = { percentage: pct, amount: 0 };
    plan.inv.edited = { ms, by: U.kavita._id, reason: "Bone graft added after CBCT review", before: before2 };
    touch(plan.inv, ms);
    const gt = grandTotal(plan.inv);
    plan.parent.fee = gt;
    plan.parent.opdFee = gt;
    touch(plan.parent, ms + 15);
  }
}

// ============================================================================
// 16. FINALISE APPOINTMENTS: tokens, numbers, counters
// ============================================================================
{
  // token series: per clinic, per IST date of the moment the number was assigned
  const byNumbering = [...APPTS].sort((a, b) => a.numberingMs - b.numberingMs);
  const counters = new Map();
  const usedNumbers = new Set();
  for (const a of byNumbering) {
    const clinic = C[a.clinicKey];
    const dk = keyOf(a.numberingMs);
    const cKey = `${clinic._id}:${dk}`;
    let c = counters.get(cKey);
    if (!c) counters.set(cKey, (c = { _id: cKey, clinicId: clinic._id, dateKey: dk, seq: 0, firstMs: a.numberingMs, lastMs: a.numberingMs }));
    c.seq += 1;
    c.lastMs = a.numberingMs;
    a.tokenDateKey = dk;
    a.tokenNumber = c.seq;
    // CODE-YYMMDD-HHMM of the real booking minute (IST), walk forward on collision
    for (let i = 0; i < 10; i++) {
      const t = a.numberingMs + i * MIN;
      const cand = `${clinic.code}-${yymmdd(a.numberingMs)}-${hmOf(t).replace(":", "")}`;
      if (!usedNumbers.has(cand)) {
        usedNumbers.add(cand);
        a.appointmentNumber = cand;
        break;
      }
    }
    assert(a.appointmentNumber, "appointment number");
  }
  for (const c of counters.values()) {
    DB.Counter.push({ _id: c._id, clinicId: c.clinicId, dateKey: c.dateKey, seq: c.seq, createdAt: iso(c.firstMs + 3), updatedAt: iso(c.lastMs + 3), __v: 0 });
  }
  DB.Counter.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

// ============================================================================
// 18. TESTS + REPORTS (imaging / lab work ordered at visits, uploaded files)
// ============================================================================
const FILES = {
  xray: { url: "/demo/xray-iopa.svg", publicId: "demo/xray-iopa", fileName: "IOPA_RVG.svg", fileType: "image/svg+xml", thumb: true },
  opg: { url: "/demo/opg-panoramic.svg", publicId: "demo/opg-panoramic", fileName: "OPG_Panoramic.svg", fileType: "image/svg+xml", thumb: true },
  cbct: { url: "/demo/cbct-scan.svg", publicId: "demo/cbct-scan", fileName: "CBCT_Axial.svg", fileType: "image/svg+xml", thumb: true },
  lab_report: { url: "/demo/lab-report.pdf", publicId: "demo/lab-report", fileName: "Lab_Report.pdf", fileType: "application/pdf" },
  prescription: { url: "/demo/prescription.pdf", publicId: "demo/prescription", fileName: "Prescription.pdf", fileType: "application/pdf" },
  treatment_plan: { url: "/demo/treatment-plan.pdf", publicId: "demo/treatment-plan", fileName: "Treatment_Plan.pdf", fileType: "application/pdf" },
  consent_form: { url: "/demo/consent-form.pdf", publicId: "demo/consent-form", fileName: "Consent_Form.pdf", fileType: "application/pdf" },
};
const fileSize = (url) => statSync(join(PUBLIC_DIR, url)).size;
const TESTS = [];
const REPORTS = [];
function orderTest(p, appt, code, { ms, by, status = "completed", resultSummary, resultValues, withReport = null } = {}) {
  const tm = TSM[code];
  const created = uniq("Test", ms);
  const pct = memberDiscountAt(p, ms);
  const t = {
    _id: oid(created), p, appt, tm, clinicKey: appt.clinicKey, createdMs: created, updatedMs: created, status, by,
    price: tm.price, discount: { percentage: pct, amount: 0, reason: pct ? "Membership discount" : "" },
    resultSummary, resultValues,
  };
  t.finalAmount = Math.max(0, Math.round(tm.price - (tm.price * pct) / 100));
  if (status === "sample_collected" || status === "processing" || status === "completed") t.sampleMs = created + int(5, 40) * MIN;
  if (status === "completed") {
    t.resultMs = created + (tm.isInHouse ? int(15, 50) * MIN : int(18, 30) * HOUR);
    t.updatedMs = t.resultMs;
  } else if (status === "processing" || status === "sample_collected") t.updatedMs = t.sampleMs;
  if (status === "cancelled") {
    t.notes = "Cancelled: Patient declined the test";
    t.updatedMs = created + int(10, 60) * MIN;
  }
  TESTS.push(t);
  if (withReport && status === "completed") {
    const r = uploadReport(p, { category: withReport, appt, test: t, ms: t.resultMs + int(5, 30) * MIN, by, title: `${tm.name} - ${p.name}` });
    t.report = r;
    t.updatedMs = r.createdMs + 50;
  }
  return t;
}
const REPORT_TITLES = {
  xray: ["IOPA X-Ray", "Post-op IOPA", "Pre-op IOPA"],
  opg: ["OPG - Full Mouth", "Panoramic X-Ray"],
  cbct: ["CBCT - Implant Planning", "CBCT - Impacted Third Molar"],
  lab_report: ["Pre-surgical Blood Report", "Blood Sugar Report"],
  prescription: ["Prescription", "Post-procedure Prescription"],
  treatment_plan: ["Treatment Plan & Estimate"],
  consent_form: ["Consent Form - Surgical Procedure", "Consent Form - Implant Surgery"],
};
function uploadReport(p, { category, appt, test = null, ms, by, title, visible = true, notes, tags }) {
  const created = uniq("Report", ms);
  const f = FILES[category];
  const r = {
    _id: oid(created), p, category, appt, test, clinicKey: appt?.clinicKey || p.clinicKey, createdMs: created, by,
    title: title || pick(REPORT_TITLES[category]),
    reportKey: appt ? appt.key : keyOf(created),
    visible, notes, tags: tags || [],
    files: [{ url: f.url, publicId: f.publicId, fileName: f.fileName, fileSize: fileSize(f.url), fileType: f.fileType, ...(f.thumb ? { thumbnailUrl: f.url } : {}), description: "", uploadedMs: created - int(1, 8) * 1000, _id: oid(created) }],
  };
  REPORTS.push(r);
  return r;
}
{
  // demo patient: OPG + IOPA + prescription + aligner records
  const d = demoTimeline;
  orderTest(DEMO, d.opd1, "OPG", { ms: d.opd1.doneMs - 12 * MIN, by: U.arjun, resultSummary: "Deep carious lesion with periapical radiolucency on 36. Other teeth healthy. Lower third molars partially erupted.", withReport: "opg" });
  orderTest(DEMO, d.rct.parent, "IOPA", { ms: d.rct.parent.doneMs - 30 * MIN, by: U.arjun, resultSummary: "Working length radiograph 36 - canals negotiated to apex.", withReport: "xray" });
  orderTest(DEMO, d.rct.sessions[2], "IOPA", { ms: d.rct.sessions[2].doneMs - 10 * MIN, by: U.arjun, resultSummary: "Post-obturation IOPA 36 - well condensed fill, no voids.", withReport: "xray" });
  uploadReport(DEMO, { category: "prescription", appt: d.opd1, ms: d.opd1.doneMs + 4 * MIN, by: U.arjun, title: "Prescription - Toothache 36" });
  orderTest(DEMO, d.opd3, "OPG", { ms: d.opd3.doneMs - 15 * MIN, by: U.kavita, resultSummary: "Mild crowding in lower anterior region. No pathology. Suitable for aligner therapy.", withReport: "opg" });
  uploadReport(DEMO, { category: "treatment_plan", appt: d.aligners.parent, ms: d.alignerStart + 12 * MIN, by: U.kavita, title: "Clear Aligner Treatment Plan", tags: ["aligners", "orthodontic"] });
  uploadReport(DEMO, { category: "consent_form", appt: d.aligners.parent, ms: d.alignerStart + 14 * MIN, by: U.kavita, title: "Consent Form - Clear Aligner Therapy" });
}
{
  // everyone else: imaging at OPD visits for RCT/implant/wisdom/crown plans, labs before surgery
  const candidates = PLANS.filter((pl) => !pl.p.isDemo && ["rct", "implant", "wisdom", "crown", "dentures", "extraction", "aligners", "braces"].includes(pl.tplKey) && pl.opd.status === "completed");
  for (const pl of candidates) {
    if (TESTS.length >= COUNTS.tests - 4) break;
    const opd = pl.opd;
    const ms = opd.doneMs - int(8, 20) * MIN;
    const by = U[C[pl.clinicKey].doctor];
    if (["rct", "crown"].includes(pl.tplKey)) {
      orderTest(pl.p, opd, chance(0.7) ? "IOPA" : "BWX", { ms, by, resultSummary: pick(["Periapical radiolucency noted, RCT advised.", "Deep caries approaching pulp.", "Fractured crown, root intact."]), withReport: "xray" });
    } else if (pl.tplKey === "implant") {
      orderTest(pl.p, opd, "CBCT1", { ms, by, resultSummary: "Adequate bone width (6.8 mm) and height (11 mm) at the implant site.", withReport: "cbct" });
      if (pl.p.ageYears > 45) orderTest(pl.p, opd, "HBA1C", { ms: ms + 2 * MIN, by, resultSummary: "HbA1c within acceptable range for surgery.", resultValues: [{ parameter: "HbA1c", value: String((5.4 + R() * 1.6).toFixed(1)), unit: "%", normalRange: "< 5.7", isAbnormal: false }], withReport: "lab_report" });
      uploadReport(pl.p, { category: "consent_form", appt: pl.parent, ms: slotStartMs(pl.parent) - int(5, 20) * MIN, by, title: "Consent Form - Implant Surgery" });
    } else if (["wisdom", "extraction"].includes(pl.tplKey)) {
      orderTest(pl.p, opd, "OPG", { ms, by, resultSummary: pick(["Mesioangular impaction of 38.", "Horizontally impacted 48 close to the canal.", "Grossly decayed tooth, extraction indicated."]), withReport: "opg" });
      if (pl.p.medicalHistory.some((m) => m.includes("blood thinners"))) orderTest(pl.p, opd, "PTINR", { ms: ms + 2 * MIN, by, resultSummary: "INR 1.1 - safe for extraction.", resultValues: [{ parameter: "INR", value: "1.1", unit: "", normalRange: "0.8 - 1.2", isAbnormal: false }], withReport: "lab_report" });
    } else if (["aligners", "braces"].includes(pl.tplKey)) {
      orderTest(pl.p, opd, "OPG", { ms, by, resultSummary: "All permanent teeth present, mild crowding. Fit for orthodontic treatment.", withReport: "opg" });
      uploadReport(pl.p, { category: "treatment_plan", appt: pl.parent, ms: slotStartMs(pl.parent) - int(10, 30) * MIN, by, title: "Orthodontic Treatment Plan" });
    } else if (pl.tplKey === "dentures") {
      orderTest(pl.p, opd, "FBS", { ms, by, resultSummary: "Fasting sugar slightly raised.", resultValues: [{ parameter: "Fasting Blood Sugar", value: String(int(108, 128)), unit: "mg/dL", normalRange: "70 - 100", isAbnormal: true }], withReport: "lab_report" });
    }
  }
  // recent tests still in progress / cancelled
  const recent = APPTS.filter((a) => a.visitType === "opd" && a.status === "completed" && !a.p.isDemo && daysBetween(a.key, ANCHOR) <= 3).slice(0, 4);
  const states = ["processing", "sample_collected", "ordered", "cancelled"];
  recent.forEach((a, i) => orderTest(a.p, a, ["CBC", "FBS", "CBCT1", "PVT"][i], { ms: a.doneMs - 6 * MIN, by: U[C[a.clinicKey].doctor], status: states[i] }));
  // prescriptions after some OPD visits / extractions
  const rxVisits = shuffle(APPTS.filter((a) => a.status === "completed" && !a.p.isDemo && (a.visitType === "opd" || a.p.appts.length > 2))).slice(0, 12);
  for (const a of rxVisits) uploadReport(a.p, { category: "prescription", appt: a, ms: a.doneMs + int(1, 6) * MIN, by: U[C[a.clinicKey].doctor], visible: !chance(0.08), notes: chance(0.2) ? "Internal: patient allergic to penicillin - prescribed alternative" : undefined });
}

// ============================================================================
// 19. LAB ORDERS (crowns, bridges, dentures, implant crowns, night guards)
// ============================================================================
const LAB_ORDERS = [];
function labOrder({ p, labKey, items, ms, doctor, expectedDays, delivered = null, status = null, payments = [], notes, archived = false }) {
  const created = uniq("LabOrder", ms);
  const o = { _id: oid(created), p, labKey, createdMs: created, updatedMs: created, doctor, notes, archived, payments: [] };
  o.items = items.map(([name, qty]) => {
    const proc = labProc(labKey, name);
    const it = { procedure: name, quantity: qty, unitPrice: proc.price, basePrice: proc.basePrice || 0, pricingType: proc.pricingType, _id: oid(created) };
    it.totalPrice = it.pricingType === "fixed" ? it.unitPrice : it.pricingType === "fixed_plus_per_unit" ? it.basePrice + qty * it.unitPrice : qty * it.unitPrice;
    return it;
  });
  o.totalAmount = o.items.reduce((s, it) => s + it.totalPrice, 0);
  o.expectedKey = keyOf(created + expectedDays * DAY);
  if (delivered) {
    o.deliveryStatus = "delivered";
    o.deliveredMs = delivered;
    touch(o, delivered);
  } else o.deliveryStatus = status || "pending";
  if (o.deliveryStatus === "in_progress") touch(o, created + int(1, 3) * DAY);
  if (o.deliveryStatus === "rejected") touch(o, created + int(4, 6) * DAY);
  for (const [frac, whenMs, method] of payments) {
    const amt = frac === "rest" ? o.totalAmount - o.payments.reduce((s, x) => s + x.amount, 0) : roundTo(o.totalAmount * frac, 50);
    if (amt <= 0 || whenMs > ANCHOR_NOW) continue;
    o.payments.push({ amount: amt, dateMs: whenMs, method, _id: oid(whenMs) });
    touch(o, whenMs);
  }
  if (archived) touch(o, (o.updatedMs || created) + int(1, 5) * DAY);
  LAB_ORDERS.push(o);
  return o;
}
{
  const DOCTOR_NAME = (clinicKey) => U[C[clinicKey].doctor].name;
  // demo patient's PFM crown
  labOrder({ p: DEMO, labKey: "precision", items: [["PFM Crown", 1]], ms: demoTimeline.crownOrderMs, doctor: "Dr. Arjun Malik", expectedDays: 7, delivered: jitter(istMs("2026-06-05", "15:20")), payments: [["rest", jitter(istMs("2026-06-05", "15:40")), "UPI"]], notes: "Shade A2, tooth 36" });
  const needLab = PLANS.filter((pl) => !pl.p.isDemo && ["rct", "crown", "dentures", "implant", "nightguard", "bonding"].includes(pl.tplKey) && (pl.tplKey !== "rct" || pl.built?.crown));
  for (const pl of needLab) {
    if (LAB_ORDERS.length >= COUNTS.labOrders) break;
    // order is placed at the impression visit (2nd-to-last session, or the only one)
    const idx = Math.max(0, Math.min(pl.sessions.length - 1, pl.sessionsPlanned - 2));
    const visit = pl.sessions[idx];
    if (!visit || visit.status !== "completed") continue;
    const ms = visit.doneMs + int(15, 50) * MIN;
    if (ms > ANCHOR_NOW) continue;
    const age = (ANCHOR_NOW - ms) / DAY;
    let labKey, items, expectedDays;
    if (pl.tplKey === "dentures") { labKey = "denture"; items = [["Complete Denture (per arch)", 2]]; expectedDays = 6; }
    else if (pl.tplKey === "implant") { labKey = "digident"; items = [["Screw Retained Implant PFM", 1], ["Implant Prosthetic Screw", 1]]; expectedDays = 8; }
    else if (pl.tplKey === "nightguard") { labKey = "precision"; items = [["Night Guard (Hard Acrylic)", 1]]; expectedDays = 5; }
    else if (pl.tplKey === "bonding") continue;
    else if (pl.built?.crown === "Zirconia Crown") { labKey = chance(0.5) ? "ceramics" : "precision"; items = [[labKey === "ceramics" ? "Zirconia 5yr" : "Zirconia Crown", pl.built.units || 1]]; expectedDays = 7; }
    else { labKey = chance(0.55) ? "precision" : "ceramics"; items = [["PFM Crown", pl.built?.units || 1]]; expectedDays = 6; }
    let delivered = null, status = null;
    if (age > expectedDays + 2) delivered = ms + int(expectedDays - 1, expectedDays + 2) * DAY + int(2, 8) * HOUR;
    else if (age > 2) status = chance(0.7) ? "in_progress" : "pending";
    else status = "pending";
    if (delivered && delivered > ANCHOR_NOW) { delivered = null; status = "in_progress"; }
    const pays = [];
    if (delivered) {
      if (chance(0.75)) pays.push(["rest", delivered + int(1, 20) * HOUR, pick(["Cash", "UPI", "Bank Transfer"])]);
      else pays.push([0.5, delivered + int(1, 20) * HOUR, "UPI"]);
    } else if (chance(0.3)) pays.push([0.5, ms + int(1, 2) * DAY, "Cash"]);
    labOrder({ p: pl.p, labKey, items, ms, doctor: DOCTOR_NAME(pl.clinicKey), expectedDays, delivered, status, payments: pays, notes: chance(0.5) ? pick(["Shade A2", "Shade A3", "Shade B1", "Rush - patient travelling", "Match adjacent tooth contour"]) : undefined, archived: !!delivered && age > 120 && chance(0.6) });
  }
  // one rejected remake, one overdue order
  const rej = LAB_ORDERS.find((o) => o.deliveryStatus === "delivered" && !o.p.isDemo && !o.archived);
  if (rej) {
    rej.deliveryStatus = "rejected";
    rej.notes = "Shade mismatch - remake requested";
    delete rej.deliveredMs;
    rej.payments = [];
    rej.updatedMs = rej.createdMs + 5 * DAY + int(1, 5) * HOUR;
  }
}

// ============================================================================
// 20. FOLLOW-UP REMINDERS
// ============================================================================
const FOLLOWUPS = [];
function followUp(p, { clinicKey, createdMs, dateKey, time, reason, by, status }) {
  const created = uniq("FollowUpReminder", createdMs);
  const f = { _id: oid(created), p, clinicKey, createdMs: created, updatedMs: created, dateKey, time, reason, by, status };
  FOLLOWUPS.push(f);
  EVENTS.push({ kind: "followup_created", p, f, ms: created + 200 });
  return f;
}
{
  // demo patient: a done post-RCT review and an upcoming aligner check
  const fA = followUp(DEMO, { clinicKey: "US", createdMs: demoTimeline.rctEnd + 20 * MIN, dateKey: "2026-07-10", time: "18:00", reason: "Post-RCT review of 36", by: U.ritu, status: "done" });
  fA.updatedMs = jitter(istMs("2026-07-10", "18:40"));
  followUp(DEMO, { clinicKey: "US", createdMs: demoTimeline.alignerStart + 16 * MIN, dateKey: "2026-11-23", time: "17:30", reason: "Aligner tray change & progress check", by: U.ritu, status: "scheduled" });

  const REASONS = {
    rct: "Review after root canal treatment", implant: "Implant osseointegration review", wisdom: "Post-extraction check", extraction: "Post-extraction check",
    scaling: "6-month scaling recall", deepclean: "Gum health re-evaluation", aligners: "Aligner tray change", braces: "Braces adjustment reminder",
    kids: "Child fluoride re-application", filling: "Check filling and sensitivity", dentures: "Denture comfort review", crown: "Crown review",
    whitening: "Whitening touch-up review", laser: "Laser healing review", ulcer: "Ulcer healing review", bonding: "Bonding polish review", nightguard: "Night guard fit check",
  };
  const pool = shuffle(PLANS.filter((pl) => !pl.p.isDemo && pl.sessions[pl.sessions.length - 1].status === "completed"));
  for (const pl of pool) {
    if (FOLLOWUPS.length >= COUNTS.followUps) break;
    const last = pl.sessions[pl.sessions.length - 1];
    const createdMs = last.doneMs + int(8, 25) * MIN;
    if (createdMs > ANCHOR_NOW) continue;
    const gapDays = ["scaling", "kids"].includes(pl.tplKey) ? int(150, 180) : int(7, 45);
    const dk = nextWorkingDay(addDays(last.key, gapDays));
    const by = deskUser(pl.clinicKey, createdMs);
    const time = chance(0.7) ? pick(["10:00", "11:30", "12:00", "16:30", "17:00", "18:00"]) : undefined;
    const rel = daysBetween(ANCHOR, dk);
    let status;
    let updatedMs = null;
    if (rel < 0) {
      // past: mostly done, some never actioned (overdue), a couple cancelled
      const r = R();
      if (r < 0.66) { status = "done"; updatedMs = jitter(istMs(dk, "13:00") + int(0, 6) * HOUR); }
      else if (r < 0.88) status = "scheduled"; // overdue - nobody marked it
      else { status = "cancelled"; updatedMs = jitter(istMs(addDays(dk, -int(1, 3)), "12:00")); }
    } else if (rel <= 1) {
      // the in-process scheduler (lead 1 day) already sent today's/tomorrow's reminders at boot
      status = "sent";
    } else status = "scheduled";
    const f = followUp(pl.p, { clinicKey: pl.clinicKey, createdMs, dateKey: dk, time, reason: REASONS[pl.tplKey] || "Follow-up review", by, status });
    if (updatedMs && updatedMs > f.createdMs && updatedMs < ANCHOR_NOW) f.updatedMs = updatedMs;
    else if (updatedMs) f.updatedMs = f.createdMs + 2 * HOUR;
  }
  // make sure "today/tomorrow" has sent reminders: pull two scheduled ones in
  const sentNow = FOLLOWUPS.filter((f) => f.status === "sent").length;
  const futureSched = FOLLOWUPS.filter((f) => f.status === "scheduled" && f.dateKey > addDays(ANCHOR, 1) && !f.p.isDemo);
  for (let i = sentNow; i < 2 && futureSched.length; i++) {
    const f = futureSched.shift();
    f.dateKey = i === 0 ? ANCHOR : addDays(ANCHOR, 1);
    if (dow(f.dateKey) === 0) f.dateKey = addDays(f.dateKey, 1);
    f.status = "sent";
  }
  const bootMs = jitter(istMs(ANCHOR, "08:02"), 20); // backend restart this morning -> scheduler run
  for (const f of FOLLOWUPS.filter((x) => x.status === "sent")) {
    f.reminderSentMs = bootMs + int(1, 900);
    f.updatedMs = f.reminderSentMs + 5;
    EVENTS.push({ kind: "followup_reminder", p: f.p, f, ms: f.reminderSentMs - 40 });
  }
}

// ============================================================================
// 21. ENQUIRIES (public website forms -> CRM pipeline)
// ============================================================================
const ENQUIRIES = [];
{
  const PAGES = [
    ["/treatments/dental-implant", "Treatment Page", "Dental Implant"], ["/treatments/root-canal-treatment-rct", "Treatment Page", "Root Canal Treatment (RCT)"],
    ["/treatments/clear-aligners", "Treatment Page", "Clear Aligners"], ["/treatments/braces", "Treatment Page", "Braces"], ["/treatments/teeth-whitening", "Treatment Page", "Teeth Whitening"],
    ["/treatments/wisdom-teeth", "Treatment Page", "Wisdom Teeth"], ["/treatments/kids-dentistry", "Treatment Page", "Kids Dentistry"], ["/treatments/smile-makeover", "Treatment Page", "Smile Makeover"],
    ["/treatments/dentures", "Treatment Page", "Dentures"], ["/", "Popup Form", "General Enquiry"], ["/plans", "Popup Form", "Membership Plans"], ["/contact", "Contact Page", "Appointment Enquiry"],
    ["/contact", "Contact Page", "Treatment Cost Enquiry"], ["/sonipat", "Popup Form", "General Enquiry"],
  ];
  const MESSAGES = [
    "What is the cost of a single implant? I have a missing lower molar.", "Can I get an appointment this Saturday evening?", "My son is 12 and his teeth are crooked. Do you do braces for kids?",
    "Is RCT painful? I have pain in my upper tooth since 3 days.", "Do you accept card payments and is there EMI for aligners?", "Please call me back after 5 PM.",
    "I want teeth whitening before my sister's wedding next month.", "Is the family plan valid for my parents also?", "Do you open on Sundays?", "Need a second opinion on an implant quote I received.",
  ];
  const STATUS_FLOW = [["new", 10], ["contacted", 12], ["appointment_scheduled", 6], ["visited", 5], ["converted", 10], ["not_interested", 8], ["invalid", 3], ["closed", 5]];
  const staff = [U.ritu, U.amit, U.sandeep, U.pooja];
  const convertible = shuffle(P.filter((p) => !p.isDemo && p.createdMs > istMs(HISTORY_START, "00:00") + 3 * DAY && p.createdMs < ANCHOR_NOW));
  const days = [];
  for (let i = 0; i < COUNTS.enquiries - 4; i++) days.push(Math.floor(Math.pow(R(), 1 / 1.8) * (HISTORY_DAYS - 1)));
  days.sort((a, b) => a - b);
  const times = days.map((d) => addDays(HISTORY_START, d));
  // 4 today (before ANCHOR_TIME) + recent burst
  times.push(ANCHOR, ANCHOR, ANCHOR, addDays(ANCHOR, -1));
  times.forEach((k, i) => {
    let ms;
    if (k === ANCHOR) ms = jitter(istMs(ANCHOR, pick(["07:12", "08:40", "09:55", "10:48", "11:20"])));
    else ms = jitter(istMs(k, pick(["08:15", "10:05", "12:40", "14:25", "17:50", "20:10", "22:30", "23:05"])));
    const ageDays = (ANCHOR_NOW - ms) / DAY;
    let status = ageDays < 2 ? "new" : weighted(STATUS_FLOW);
    if (status === "new" && ageDays > 20) status = pick(["contacted", "not_interested", "closed"]);
    const [page, referrer, treatmentName] = pick(PAGES);
    let conv = null;
    if (status === "converted") {
      conv = convertible.find((p) => p.createdMs > ms && p.createdMs - ms < 12 * DAY && !p.fromEnquiry);
      if (!conv) status = "visited";
      else conv.fromEnquiry = true;
    }
    const gender = chance(0.5) ? "male" : "female";
    const name = conv ? conv.name : personName(gender);
    const e = {
      createdMs: uniq("Enquiry", ms), name, phone: conv ? conv.phone : phone(), email: conv ? conv.email : chance(0.55) ? emailFor(name) : referrer === "Popup Form" ? "" : undefined,
      treatmentName, message: referrer === "Contact Page" || chance(0.25) ? pick(MESSAGES) : undefined,
      source: { page, referrer, device: "unknown" }, status: "new", statusHistory: [], notes: [], followUpCount: 0, conv,
      isUrgent: chance(0.07), isSpam: false,
    };
    e._id = oid(e.createdMs);
    e.statusHistory.push({ status: "new", changedMs: e.createdMs + 3, note: "Enquiry created", _id: oid(e.createdMs) });
    let t = e.createdMs;
    const step = (st, note, by, gapH) => {
      t += gapH * HOUR + int(0, 3_599_999);
      if (t > ANCHOR_NOW - 10 * MIN) t = ANCHOR_NOW - int(10, 60) * MIN;
      e.status = st;
      e.statusHistory.push({ status: st, changedMs: t, changedBy: by._id, note, _id: oid(t) });
      if (st === "contacted") { e.lastContactedMs = t; e.followUpCount += 1; }
      e.updatedMs = t;
    };
    const by = pick(staff);
    if (status !== "new") {
      e.assignedTo = by;
      e.assignedMs = e.createdMs + int(1, 8) * HOUR;
      if (status === "invalid" && chance(0.6)) {
        // marked spam via PATCH /:id/spam -> no history entry
        e.isSpam = true;
        e.status = "invalid";
        e.updatedMs = e.createdMs + int(2, 20) * HOUR;
      } else {
        step("contacted", pick(["Called, explained treatment and cost", "Called - asked to call back in the evening", "Shared estimate on WhatsApp", "Spoke to patient, will visit this week"]), by, int(1, 18));
        if (["appointment_scheduled", "visited", "converted", "closed"].includes(status)) step("appointment_scheduled", "Appointment booked", by, int(2, 30));
        if (["visited", "converted"].includes(status)) step("visited", "Patient visited the clinic", by, int(24, 96));
        if (status === "converted") {
          t = Math.max(t, e.conv.createdMs + int(1, 5) * HOUR);
          e.status = "converted";
          e.convertedMs = Math.min(t, ANCHOR_NOW - 5 * MIN);
          e.statusHistory.push({ status: "converted", changedMs: e.convertedMs, changedBy: by._id, note: "Converted to patient", _id: oid(e.convertedMs) });
          e.updatedMs = e.convertedMs;
        }
        if (status === "not_interested") step("not_interested", pick(["Found the cost too high", "Already getting treated elsewhere", "Will think about it later"]), by, int(24, 120));
        if (status === "closed") step("closed", pick(["Treatment done, closing lead", "No response after 3 calls", "Patient will contact when ready"]), by, int(48, 200));
        if (status === "invalid") step("invalid", "Wrong number", by, int(1, 30));
      }
      if (["contacted", "appointment_scheduled"].includes(e.status)) {
        // next follow-up: some overdue (pending follow-ups list), some upcoming
        const fk = chance(0.45) ? addDays(ANCHOR, -int(1, 6)) : addDays(ANCHOR, int(1, 7));
        e.nextFollowUpMs = istMs(fk, pick(["11:00", "12:30", "16:00", "17:30"]));
        if (e.nextFollowUpMs < e.createdMs) e.nextFollowUpMs = e.createdMs + 2 * DAY;
        e.updatedMs = Math.max(e.updatedMs || 0, Math.min(ANCHOR_NOW - 30 * MIN, (e.lastContactedMs || e.createdMs) + 5 * MIN));
      }
      if (chance(0.55) || e.status === "contacted") {
        const noteMs = Math.min(ANCHOR_NOW - 20 * MIN, (e.lastContactedMs || e.createdMs + 3 * HOUR) + int(1, 30) * MIN);
        e.notes.push({ text: pick(["Patient prefers a call after 6 PM", "Asked for EMI options", "Interested in the family membership plan", "Shared clinic location on WhatsApp", "Comparing quotes from two clinics", "Wants Dr. Kavita for consultation"]), addedBy: by._id, addedMs: noteMs, _id: oid(noteMs) });
        e.updatedMs = Math.max(e.updatedMs || 0, noteMs);
      }
    }
    e.updatedMs = Math.max(e.updatedMs || e.createdMs, e.assignedMs || 0);
    ENQUIRIES.push(e);
    EVENTS.push({ kind: "enquiry", e, ms: e.createdMs + int(150, 600) });
  });
  // enquiry numbers: ENQ-YYMMDD-#### (per IST day, by creation order)
  const perDay = new Map();
  for (const e of [...ENQUIRIES].sort((a, b) => a.createdMs - b.createdMs)) {
    const dk = yymmdd(e.createdMs);
    const n = (perDay.get(dk) || 0) + 1;
    perDay.set(dk, n);
    e.enquiryNumber = `ENQ-${dk}-${String(n).padStart(4, "0")}`;
  }
}

// ============================================================================
// 22. NOTIFICATIONS (side effects of the flows above + admin broadcasts)
//     Older admin-side notifications are assumed cleared (deleted) by staff:
//     only the last ~30 days of enquiry / follow-up staff alerts are kept.
// ============================================================================
const NOTIFS = [];
function notif(n) {
  const created = uniq("Notification", n.ms);
  const doc = { ...n, createdMs: created, _id: oid(created) };
  NOTIFS.push(doc);
  return doc;
}
const READ_AFTER = (ms, unreadIfNewerThanDays = 4) => {
  const age = (ANCHOR_NOW - ms) / DAY;
  if (age < unreadIfNewerThanDays && chance(0.75)) return null;
  if (chance(0.12)) return null;
  return Math.min(ANCHOR_NOW - 5 * MIN, ms + int(1, 40) * HOUR);
};
// exactly what the backend renders (followup formatIst / toLocaleDateString("en-IN") on an IST server)
const fmtIstDate = (ms) => new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric" }).format(new Date(ms));
const enIN = (ms) => new Date(ms).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });
const KEEP_STAFF_ALERTS_FROM = ANCHOR_NOW - 30 * DAY;
for (const ev of EVENTS.sort((a, b) => a.ms - b.ms)) {
  if (ev.ms > ANCHOR_NOW) continue;
  const base = { ms: ev.ms };
  switch (ev.kind) {
    case "appointment_confirmation": {
      notif({ ...base, title: "Appointment Confirmed", message: `Your appointment #${ev.appt.appointmentNumber} has been confirmed. Token: ${ev.appt.tokenNumber}`, type: "appointment_confirmation", recipient: ev.p, recipientModel: "Patient", sendEmail: true, appointment: ev.appt, processed: true, readMs: READ_AFTER(ev.ms) });
      break;
    }
    case "appointment_cancellation": {
      const reason = ev.appt.cancellationReason;
      notif({ ...base, title: "Appointment Cancelled", message: `Your appointment #${ev.appt.appointmentNumber} has been cancelled.${reason ? ` Reason: ${reason}` : ""}`, type: "appointment_cancellation", recipient: ev.p, recipientModel: "Patient", sendEmail: true, appointment: ev.appt, processed: true, readMs: READ_AFTER(ev.ms) });
      break;
    }
    case "membership_activated": {
      notif({ ...base, title: "Membership Plan Activated", message: `Your ${ev.planName} membership has been activated. Valid from ${enIN(ev.startMs)} to ${enIN(ev.expiryMs)}. Enjoy your benefits!`, type: "membership_renewal", recipient: ev.p, recipientModel: "Patient", sendEmail: true, processed: true, readMs: READ_AFTER(ev.ms) });
      break;
    }
    case "followup_created": {
      const when = `${fmtIstDate(Date.parse(dateOnly(ev.f.dateKey)))}${ev.f.time ? ` at ${ev.f.time}` : ""}`;
      const note = ev.f.reason ? ` — ${ev.f.reason}` : "";
      notif({ ...base, title: "Follow-up scheduled", message: `A follow-up visit has been scheduled for ${when}${note}. No payment is required to be reminded — fees apply only when you visit.`, type: "appointment_reminder", recipient: ev.p, recipientModel: "Patient", createdBy: ev.f.by, readMs: READ_AFTER(ev.ms) });
      if (ev.ms >= KEEP_STAFF_ALERTS_FROM) {
        notif({ ms: ev.ms + 7, title: "Follow-up reminder created", message: `Follow-up for ${ev.p.name} scheduled on ${when}${note}.`, type: "appointment_reminder", recipient: ev.f.by, recipientModel: "User", createdBy: ev.f.by, readMs: READ_AFTER(ev.ms, 2) });
      }
      break;
    }
    case "followup_reminder": {
      const when = `${fmtIstDate(Date.parse(dateOnly(ev.f.dateKey)))}${ev.f.time ? ` at ${ev.f.time}` : ""}`;
      const note = ev.f.reason ? ` — ${ev.f.reason}` : "";
      notif({ ...base, title: "Follow-up visit reminder", message: `This is a reminder for your upcoming follow-up visit on ${when}${note}. No payment is needed for this reminder — fees apply only when you visit.`, type: "appointment_reminder", recipient: ev.p, recipientModel: "Patient", sendEmail: true, processed: true, createdBy: ev.f.by, readMs: null });
      notif({ ms: ev.ms + 30, title: "Follow-up due reminder", message: `Follow-up for ${ev.p.name} is due on ${when}${note}.`, type: "appointment_reminder", recipient: ev.f.by, recipientModel: "User", sendEmail: true, processed: true, createdBy: ev.f.by, readMs: null });
      break;
    }
    case "enquiry": {
      if (ev.ms < KEEP_STAFF_ALERTS_FROM) break;
      const e = ev.e;
      notif({ ...base, title: "New Enquiry Received", message: `New enquiry from ${e.name} (${e.phone})${e.treatmentName ? ` for ${e.treatmentName}` : ""}`, type: "general", recipient: U.arjun, recipientModel: "User", readMs: READ_AFTER(ev.ms, 3) });
      break;
    }
    default:
      break;
  }
}
// admin-sent notifications (POST /notifications/send, send-bulk, payment reminder)
{
  const d = demoTimeline;
  notif({ ms: jitter(istMs("2026-06-05", "16:05")), title: "Your crown is ready", message: "Hi Rohan, your PFM crown for tooth 36 has arrived from the lab. Your cementation visit is confirmed for 10 June at 7:00 PM.", type: "treatment_update", priority: "normal", recipient: DEMO, recipientModel: "Patient", sendWhatsapp: true, adminSent: true, createdBy: U.ritu, appointment: d.rct.sessions[3], readMs: jitter(istMs("2026-06-05", "19:30")) });
  notif({ ms: jitter(istMs("2026-10-05", "19:10")), title: "OPG report uploaded", message: "Your OPG X-ray report from 05 Oct 2026 is now available in the Reports section of your patient portal.", type: "test_result", priority: "low", recipient: DEMO, recipientModel: "Patient", sendEmail: true, adminSent: true, createdBy: U.kavita, readMs: jitter(istMs("2026-10-06", "08:15")) });
  // promotional campaign to a selected list (send-bulk, recipientType "selected")
  const promoMs = jitter(istMs("2026-10-15", "11:00"));
  const promoList = [DEMO, ...shuffle(P.filter((p) => !p.isDemo && p.createdMs < promoMs && !p.kid)).slice(0, 9)];
  promoList.forEach((p, i) => notif({ ms: promoMs + i * 37, title: "Diwali Smile Offer", message: "Celebrate Diwali with a brighter smile! Get 20% off on teeth whitening and a free check-up for your family till 10 November. Book from your patient portal.", type: "promotional", priority: "low", recipient: p, recipientModel: "Patient", bulk: true, adminSent: true, createdBy: U.arjun, readMs: p.isDemo ? null : READ_AFTER(promoMs) }));
  // payment reminder for the demo patient's pending OPG invoice is added in section 23a
  // staff announcements
  notif({ ms: jitter(istMs("2026-10-19", "09:05")), title: "Clinic timings for Dussehra", message: "Both clinics will close at 2:00 PM on Tuesday, 20 October for Dussehra. Please reschedule evening appointments.", type: "general", priority: "high", recipient: U.ritu, recipientModel: "User", adminSent: true, createdBy: U.arjun, readMs: jitter(istMs("2026-10-19", "09:40")) });
  notif({ ms: jitter(istMs("2026-10-19", "09:06")), title: "Clinic timings for Dussehra", message: "Both clinics will close at 2:00 PM on Tuesday, 20 October for Dussehra. Please reschedule evening appointments.", type: "general", priority: "high", recipient: U.amit, recipientModel: "User", adminSent: true, createdBy: U.arjun, readMs: jitter(istMs("2026-10-19", "10:02")) });
}

// ============================================================================
// 23a. Manual invoices (POST /billing/invoices: test / medicine / other items)
// ============================================================================
{
  // demo patient: OPG on 2026-10-05 billed separately, issued, still unpaid
  const opgTest = TESTS.find((t) => t.p === DEMO && t.tm.code === "OPG" && t.appt === demoTimeline.opd3);
  const ms = demoTimeline.opd3.doneMs + 9 * MIN;
  const inv = newInvoice({ p: DEMO, clinicKey: "US", items: [{ itemType: "test", description: "OPG (Panoramic X-Ray)", unitPrice: 500, itemRef: opgTest._id, itemRefModel: "Test" }], paymentMethod: undefined, createdBy: U.ritu, createdMs: ms, notes: "OPG taken for aligner workup" });
  inv.issuedMs = ms + 2 * MIN;
  touch(inv, inv.issuedMs);
  inv.manual = true;
  demoTimeline.opgInvoice = inv;
  // others: medicines kits / reports billed separately
  const visits = shuffle(APPTS.filter((a) => a.status === "completed" && !a.p.isDemo && a.visitType !== "treatment_session" && slotStartMs(a) > ANCHOR_NOW - 100 * DAY)).slice(0, 8);
  visits.forEach((a, i) => {
    const kind = i % 3;
    const items = kind === 0 ? [{ itemType: "medicine", description: "Post-extraction care kit (antibiotic, analgesic, mouthwash)", unitPrice: 350 }]
      : kind === 1 ? [{ itemType: "test", description: "OPG (Panoramic X-Ray)", unitPrice: 500 }]
      : [{ itemType: "other", description: "Sensitivity toothpaste & soft brush kit", unitPrice: 250 }, { itemType: "medicine", description: "Desensitizing gel", unitPrice: 180 }];
    const ims = a.doneMs + int(4, 12) * MIN;
    const by = deskUser(a.clinicKey, ims);
    const m = newInvoice({ p: a.p, clinicKey: a.clinicKey, items, paymentMethod: undefined, createdBy: by, createdMs: ims });
    m.manual = true;
    if (i < 5) collect({ inv: m, amount: grandTotal(m), mode: pick(["cash", "upi"]), ms: ims + int(2, 6) * MIN, by, notes: undefined });
    else if (i === 5) { m.issuedMs = ims + 3 * MIN; touch(m, m.issuedMs); }
  });
  // one phantom duplicate invoice, voided
  const dupOf = INVOICES.find((iv) => iv.appt && iv.appt.visitType === "opd" && iv.appt.status === "completed" && slotStartMs(iv.appt) > ANCHOR_NOW - 45 * DAY && !iv.appt.p.isDemo);
  if (dupOf) {
    const dms = dupOf.createdMs + 1300;
    const dup = newInvoice({ p: dupOf.p, clinicKey: dupOf.clinicKey, appt: dupOf.appt, items: dupOf.items.map((it) => ({ itemType: it.itemType, description: it.description, unitPrice: it.unitPrice, discountPct: it.discount.percentage })), paymentMethod: "pay-at-clinic", createdBy: dupOf.createdBy, createdMs: dms });
    const vms = dupOf.updatedMs + int(1, 3) * HOUR;
    dup.voided = { ms: vms, by: U[C[dupOf.clinicKey].manager]._id, reason: "Duplicate invoice created by a double-click while booking" };
    touch(dup, vms);
  }
  // payment reminder (POST /notifications/reminder/payment) for the demo OPG invoice
  notif({ ms: jitter(istMs(addDays(ANCHOR, -3), "12:30")), title: "Payment Reminder", message: `You have a pending payment of ₹${grandTotal(inv)} for invoice ${"__OPG_INVOICE_NUMBER__"}. Please make the payment at your earliest convenience.`, type: "payment_reminder", priority: "normal", recipient: DEMO, recipientModel: "Patient", sendSms: true, invoice: inv, staticReminder: true, readMs: null });
}
// pending payments from the patient portal "Pay at clinic" treatment booking
const PENDING_PAY = [];
{
  const ppl = shuffle(P.filter((p) => !p.isDemo && !p.kid && p.createdMs < ANCHOR_NOW - 5 * DAY)).slice(0, 3);
  ppl.forEach((p, i) => {
    const tm = [TM["Teeth Whitening"], TM["Scaling & Polishing"], TM["Dental Filling"]][i];
    const ms = jitter(istMs(addDays(ANCHOR, -int(1, 6)), pick(["20:15", "21:40", "13:05"])));
    const pct = memberDiscountAt(p, ms);
    const finalAmount = Math.max(1, Math.round(tm.price * (1 - pct / 100)));
    const note = pct > 0 ? `Treatment: ${tm.name} (${pct}% member discount on ₹${tm.price})` : `Treatment: ${tm.name}`;
    newPayment({ kind: "pending", p, amount: finalAmount, paymentMode: "cash", type: "treatment", status: "pending", treatmentType: tm._id, treatmentName: tm.name, notes: `Pay at clinic — ${note}`, createdMs: ms });
    notif({ ms: ms + 300, title: "Treatment Booked", message: `Your treatment "${tm.name}" is booked. Please pay ₹${finalAmount} at the clinic.`, type: "payment_received", recipient: p, recipientModel: "Patient", readMs: chance(0.5) ? ms + int(1, 10) * HOUR : null });
  });
}

// ============================================================================
// 23. BLOGS (8 published + 2 drafts, real-looking Tiptap HTML)
// ============================================================================
const BLOGS = [];
{
  const P_ = (t) => `<p>${t}</p>`;
  const UL = (items) => `<ul>${items.map((i) => `<li><p>${i}</p></li>`).join("")}</ul>`;
  const OL = (items) => `<ol>${items.map((i) => `<li><p>${i}</p></li>`).join("")}</ol>`;
  const TABLE = (head, rows) => `<table><tbody><tr>${head.map((h) => `<th colspan="1" rowspan="1"><p>${h}</p></th>`).join("")}</tr>${rows.map((r) => `<tr>${r.map((c) => `<td colspan="1" rowspan="1"><p>${c}</p></td>`).join("")}</tr>`).join("")}</tbody></table>`;
  const QUOTE = (t) => `<blockquote><p>${t}</p></blockquote>`;
  const H2 = (t) => `<h2>${t}</h2>`;
  const H3 = (t) => `<h3>${t}</h3>`;
  const POSTS = [
    {
      title: "Root Canal Treatment: What Really Happens in the Chair",
      slug: "root-canal-treatment-what-really-happens", category: "Treatments", cover: "/images/root-canal.png", alt: "Illustration of a tooth during root canal treatment",
      tags: ["root canal", "rct", "tooth pain", "endodontics"], focus: "root canal treatment", author: "arjun", published: "2026-05-18 10:30", views: 842,
      excerpt: "Root canal treatment has a scary reputation it no longer deserves. Here is a step-by-step look at what actually happens, how long it takes, and how to look after the tooth afterwards.",
      content: [
        P_("Few dental words cause as much worry as <strong>root canal</strong>. Most of that fear comes from stories about treatment done decades ago. With modern anaesthesia, rotary instruments and digital X-rays, a root canal today feels very similar to getting a large filling."),
        H2("Why would I need a root canal?"),
        P_("Inside every tooth is a soft core called the pulp, which contains nerves and blood vessels. When deep decay, a crack or repeated dental work lets bacteria reach the pulp, it becomes inflamed or infected. Common warning signs include:"),
        UL(["Lingering pain with hot or cold drinks", "Throbbing toothache that wakes you up at night", "Swelling or a small pimple on the gum near the tooth", "A tooth that has turned darker than its neighbours"]),
        H2("The procedure, step by step"),
        OL(["<strong>Diagnosis:</strong> we take an IOPA X-ray and test the nerve to confirm the pulp cannot heal on its own.", "<strong>Anaesthesia:</strong> the area is numbed completely before we start.", "<strong>Cleaning and shaping:</strong> the infected pulp is removed and the canals are disinfected and shaped with fine instruments.", "<strong>Filling the canals:</strong> the clean canals are sealed with a rubber-like material called gutta-percha.", "<strong>Restoring the tooth:</strong> a filling and, for back teeth, a crown protects the tooth from fracture."]),
        P_("Most root canals are completed in two or three visits of 45 to 60 minutes each."),
        H2("Root canal or extraction?"),
        TABLE(["", "Root canal + crown", "Extraction + implant"], [["Keeps natural tooth", "Yes", "No"], ["Typical visits", "3 - 4", "4 - 5 over 3 months"], ["Approximate cost", "₹10,000 - ₹18,000", "₹35,000 - ₹45,000"], ["Chewing feel", "Natural", "Very close to natural"]]),
        QUOTE("Saving your own tooth is almost always the best option. Nothing we make in a lab bites quite like the tooth you were born with."),
        H2("Aftercare tips"),
        UL(["Avoid chewing hard food on the treated side until the crown is fitted", "Take the prescribed medicines for the full course", "Brush and floss normally - the tooth can still get decay at the margins", "Come back for the crown on time; an uncrowned molar can crack"]),
        P_("If you have a toothache that will not go away, book an appointment early. The sooner an infected tooth is treated, the simpler the treatment."),
      ],
      faqs: [["Is a root canal painful?", "<p>No. The tooth is fully numbed, and most patients say it feels like a long filling. Mild soreness for a day or two afterwards is normal.</p>"], ["Do I really need a crown after a root canal?", "<p>For molars and premolars, yes. A root-canal-treated back tooth becomes brittle and can split under chewing forces without a crown.</p>"]],
    },
    {
      title: "Dental Implants vs Bridges: Which Is Right for You?",
      slug: "dental-implants-vs-bridges", category: "Treatments", cover: "/images/dental-implant.png", alt: "Dental implant next to natural teeth",
      tags: ["dental implant", "bridge", "missing tooth"], focus: "dental implants", author: "kavita", published: "2026-06-09 11:00", views: 615,
      excerpt: "Missing a tooth? Implants and bridges both restore your smile, but they differ in cost, longevity and how they affect neighbouring teeth. Here is how to choose.",
      content: [
        P_("Losing a tooth affects more than your smile. Neighbouring teeth slowly drift into the gap, the opposite tooth over-erupts and the jawbone in that area starts to shrink. Replacing the tooth early protects the rest of your mouth."),
        H2("What is a dental implant?"),
        P_("An implant is a small titanium screw placed in the jawbone where the root used to be. After it fuses with the bone (usually 8 to 12 weeks), a crown is fixed on top. It stands on its own and does not need support from other teeth."),
        H2("What is a bridge?"),
        P_("A bridge uses the teeth on either side of the gap as anchors. Those teeth are trimmed and capped, and a false tooth is suspended between them. It is fixed in about two visits."),
        H2("Side-by-side comparison"),
        TABLE(["Factor", "Implant", "Bridge"], [["Treatment time", "3 - 4 months", "1 - 2 weeks"], ["Neighbouring teeth", "Untouched", "Trimmed for crowns"], ["Expected life", "20+ years with care", "10 - 15 years"], ["Bone preservation", "Yes", "No"], ["Cost (single tooth)", "₹30,000 - ₹45,000", "₹15,000 - ₹20,000"]]),
        H3("Who is a good candidate for implants?"),
        UL(["Adults with healthy gums and enough bone (checked with a CBCT scan)", "Non-smokers, or smokers willing to stop during healing", "Patients with controlled diabetes"]),
        QUOTE("If the teeth next to the gap are healthy and untouched, an implant lets you replace the missing tooth without drilling into good teeth."),
        P_("Both options work well when planned properly. During your consultation we will look at your X-rays, bone levels and budget and recommend what will last longest for you."),
      ],
      faqs: [["How long does an implant take?", "<p>Usually 3 to 4 months from surgery to the final crown, because the implant needs time to fuse with the bone.</p>"], ["Is implant surgery painful?", "<p>It is done under local anaesthesia. Most patients are back at work the next day with mild swelling controlled by painkillers.</p>"]],
    },
    {
      title: "7 Daily Habits for Healthier Gums",
      slug: "7-daily-habits-for-healthier-gums", category: "Oral Hygiene", cover: "/images/gum-deases-treatment.png", alt: "Healthy pink gums and clean teeth",
      tags: ["gum disease", "oral hygiene", "bleeding gums"], focus: "healthy gums", author: "nisha", authorName: "Dr. Kavita Rathee", published: "2026-07-02 09:00", views: 903,
      excerpt: "Bleeding gums are not normal. These seven simple habits take a few minutes a day and can stop gum disease before it starts.",
      content: [
        P_("Gum disease is the most common reason adults lose teeth, yet it is almost entirely preventable. The early stage, gingivitis, is fully reversible - if you catch it in time."),
        H2("The 7 habits"),
        OL(["<strong>Brush twice for two minutes</strong> with a soft brush, angled at 45 degrees towards the gumline.", "<strong>Clean between teeth daily</strong> with floss or interdental brushes - a brush alone misses about a third of the tooth surface.", "<strong>Do not skip the night brush.</strong> Saliva flow drops during sleep, so bacteria do more damage overnight.", "<strong>Use fluoride toothpaste</strong> and spit, do not rinse, so the fluoride stays on your teeth.", "<strong>Cut down on sugary snacks between meals</strong>, especially sticky sweets and packaged juices.", "<strong>Stop smoking and gutkha.</strong> Tobacco hides gum bleeding while the disease silently gets worse.", "<strong>Get a professional cleaning every six months</strong> to remove hardened tartar you cannot brush away."]),
        H2("Warning signs to watch for"),
        UL(["Gums that bleed while brushing or flossing", "Bad breath that does not go away", "Gums pulling away from the teeth", "Teeth that feel loose or have started to shift"]),
        QUOTE("Healthy gums do not bleed. If yours do, that is your body asking for help - not a reason to brush less."),
        P_("If you notice any of these signs, a simple scaling and polishing session is often all it takes to get your gums back on track."),
      ],
      faqs: [["Should I stop brushing if my gums bleed?", "<p>No. Keep brushing gently. Bleeding usually reduces within a week of good cleaning; if it does not, see a dentist.</p>"], ["How often do I need scaling?", "<p>For most people every six months. Smokers, diabetics and people with braces may need it every three to four months.</p>"]],
    },
    {
      title: "Clear Aligners for Adults: A Complete Guide",
      slug: "clear-aligners-for-adults-complete-guide", category: "Treatments", cover: "/images/clear-aligner.png", alt: "Transparent clear aligner tray",
      tags: ["clear aligners", "orthodontics", "invisible braces"], focus: "clear aligners", author: "kavita", published: "2026-07-21 10:15", views: 1184,
      excerpt: "Straight teeth without metal brackets. Here is how clear aligners work, how long treatment takes, what it costs, and the habits that make treatment succeed.",
      content: [
        P_("More adults than ever are straightening their teeth, and clear aligners are a big reason why. They are nearly invisible, removable and comfortable - but they only work if you wear them properly."),
        H2("How do aligners work?"),
        P_("After a digital scan, a series of custom trays is made. Each tray moves your teeth a fraction of a millimetre. You switch to a new tray every one to two weeks, and the teeth gradually move into place."),
        H2("Who can get aligners?"),
        UL(["Mild to moderate crowding", "Gaps between teeth", "Some bite problems such as overbite and crossbite", "Relapse after braces in childhood"]),
        H3("What a typical journey looks like"),
        OL(["Consultation, OPG and digital scan", "Treatment plan with a 3D preview of your final smile", "Attachments placed and first trays fitted", "Reviews every 3 to 6 weeks", "Retainers once the teeth are in position"]),
        QUOTE("Aligners move teeth only while they are in your mouth. Twenty-two hours a day is not a suggestion - it is the treatment."),
        H2("Tips for success"),
        UL(["Remove trays to eat and drink anything other than water", "Brush before putting the trays back in", "Keep the case with you - most lost trays are wrapped in a tissue", "Wear your retainers as advised after treatment"]),
        P_("Treatment typically takes 9 to 15 months. At your consultation we can tell you whether aligners or fixed braces will give you the better result."),
      ],
      faqs: [["Are aligners better than braces?", "<p>For mild to moderate cases they give similar results with better comfort and looks. Complex bite corrections may still need fixed braces.</p>"], ["Do aligners hurt?", "<p>You may feel pressure for a day or two with each new tray. That means the teeth are moving.</p>"], ["Is EMI available?", "<p>Yes, the aligner package can be paid in instalments over the course of treatment.</p>"]],
    },
    {
      title: "Your Child's First Dental Visit: A Parent's Checklist",
      slug: "childs-first-dental-visit-checklist", category: "Oral Hygiene", cover: "/images/kid-dentistry.png", alt: "Child smiling in the dental chair",
      tags: ["kids dentistry", "children", "parenting"], focus: "child's first dental visit", author: "nisha", published: "2026-08-04 09:30", views: 497,
      excerpt: "The first dental visit should happen by your child's first birthday. Here is how to prepare, what we check, and how to make it a positive experience.",
      content: [
        P_("Milk teeth may fall out eventually, but they hold space for permanent teeth, help children chew and speak clearly, and decay in them can be painful. Starting dental visits early makes them routine instead of scary."),
        H2("When should the first visit be?"),
        P_("Ideally within six months of the first tooth appearing, and no later than the first birthday."),
        H2("Before the visit"),
        UL(["Book a morning slot when your child is fresh", "Talk about the dentist positively - avoid words like 'hurt' or 'injection'", "Bring a favourite toy for comfort", "Note any habits such as thumb sucking or bottle feeding at night"]),
        H2("What happens during the check-up"),
        OL(["A gentle look at teeth, gums and bite - often on the parent's lap", "Advice on brushing technique and the right amount of toothpaste", "Fluoride application if needed", "A plan for the next visit, usually every six months"]),
        QUOTE("A child who has only ever had happy dental visits grows into an adult who is not afraid of the dentist."),
        P_("Sealants and fluoride are simple, painless ways to prevent cavities in children. Ask us about them at your next visit."),
      ],
      faqs: [["How much toothpaste should a toddler use?", "<p>A smear the size of a grain of rice until age three, then a pea-sized amount.</p>"], ["Is thumb sucking harmful?", "<p>It is normal in infants, but if it continues beyond four or five years it can affect the bite. We can suggest gentle ways to stop the habit.</p>"]],
    },
    {
      title: "Wisdom Teeth Removal: Recovery Tips That Actually Help",
      slug: "wisdom-teeth-removal-recovery-tips", category: "Treatments", cover: "/images/wisdom-teeth.png", alt: "X-ray illustration of an impacted wisdom tooth",
      tags: ["wisdom teeth", "extraction", "oral surgery"], focus: "wisdom teeth removal", author: "arjun", published: "2026-08-27 10:00", views: 732,
      excerpt: "Most people are back to normal within a week of wisdom tooth surgery. These practical tips help you heal faster and avoid a painful dry socket.",
      content: [
        P_("Wisdom teeth usually appear between 17 and 25 years of age. When there is not enough room, they get stuck (impacted) and can cause pain, swelling and decay in the tooth in front."),
        H2("The first 24 hours"),
        UL(["Bite on the gauze for 45 minutes after surgery", "Use an ice pack on the cheek - 10 minutes on, 10 minutes off", "Eat cold, soft food like curd, kheer or ice cream", "Do not spit, rinse forcefully or drink through a straw"]),
        H2("Days 2 to 7"),
        OL(["Start warm salt-water rinses after meals", "Take painkillers on time, not after the pain becomes severe", "Brush the other teeth gently; clean near the wound carefully", "Return for suture removal or review after a week"]),
        QUOTE("The blood clot in the socket is your natural bandage. Everything you do in the first two days is about protecting it."),
        H2("When to call us"),
        UL(["Pain that increases after the third day", "Swelling that keeps growing after 48 hours", "Fever or a bad taste from the socket", "Bleeding that does not stop with firm pressure"]),
        P_("With the right care, wisdom tooth removal is a routine procedure and most patients return to work in two to three days."),
      ],
      faqs: [["What is a dry socket?", "<p>It happens when the blood clot is dislodged, exposing the bone. It causes throbbing pain around day three and is easily treated with a medicated dressing.</p>"], ["Do all wisdom teeth need removal?", "<p>No. Fully erupted, healthy wisdom teeth that you can clean well can stay. We advise removal only when they cause problems.</p>"]],
    },
    {
      title: "How Laser Dentistry Makes Treatment More Comfortable",
      slug: "how-laser-dentistry-makes-treatment-comfortable", category: "Treatments", cover: "/images/laser-dentistry.png", alt: "Dental laser being used on gums",
      tags: ["laser dentistry", "gum depigmentation", "painless dentistry"], focus: "laser dentistry", author: "kavita", published: "2026-09-16 11:30", views: 388,
      excerpt: "Lasers let us treat gums and soft tissue with less bleeding, fewer stitches and faster healing. Here is where they help most.",
      content: [
        P_("A dental laser is a precise beam of light that can cut, shape or disinfect soft tissue. Because it seals blood vessels as it works, there is very little bleeding and usually no need for stitches."),
        H2("Where lasers help"),
        UL(["<strong>Gum depigmentation</strong> - lightening dark gums for a more even smile", "<strong>Gum contouring</strong> - correcting a 'gummy' smile", "<strong>Mouth ulcers</strong> - quick pain relief and faster healing", "<strong>Gum disease</strong> - disinfecting deep pockets alongside cleaning"]),
        H2("Benefits for patients"),
        OL(["Less need for injections in many procedures", "Minimal bleeding and swelling", "Faster healing with lower infection risk", "Shorter appointments"]),
        QUOTE("For many of our anxious patients, the laser is the difference between avoiding treatment and actually getting it done."),
        P_("Lasers are not a replacement for every instrument, but where they fit, they make dental care noticeably more comfortable."),
      ],
      faqs: [["Is laser treatment safe?", "<p>Yes. Dental lasers are used at controlled settings and both patient and dentist wear protective glasses.</p>"]],
    },
    {
      title: "From Hiding My Smile to Loving It: A Patient Story",
      slug: "from-hiding-my-smile-to-loving-it", category: "Patient Stories", cover: "/images/cosmatic-dental-bonding.png", alt: "Before and after of cosmetic bonding on front teeth",
      tags: ["patient story", "cosmetic bonding", "smile"], focus: "cosmetic bonding", author: "nisha", authorName: "Dental Clinic Team", published: "2026-10-08 10:00", views: 271,
      excerpt: "A college student who stopped smiling in photos because of a gap and a chipped front tooth shares how a single bonding appointment changed that.",
      content: [
        P_("<em>Shared with the patient's permission. Name changed for privacy.</em>"),
        P_("Meera, a 21-year-old college student from Sonipat, had a small gap between her front teeth and a chipped edge from a fall in school. \"I had mastered the closed-mouth smile,\" she told us. \"In every group photo I was the one not showing teeth.\""),
        H2("The consultation"),
        P_("She expected to be told she needed braces or veneers. After examining her teeth, we suggested composite bonding: a tooth-coloured material sculpted directly onto the teeth, with no drilling and no injections."),
        H2("Treatment day"),
        OL(["Shade matched to her natural teeth", "Gap closed and chipped edge rebuilt in layers", "Shaped and polished to a natural shine"]),
        P_("The whole appointment took about an hour and a half."),
        QUOTE("I kept checking the mirror in the auto on the way home. I had not smiled like that since school."),
        H2("Looking after bonding"),
        UL(["Avoid biting directly into very hard food with the front teeth", "Limit tea and coffee in the first 48 hours", "Get the bonding polished at routine check-ups"]),
        P_("Not every smile needs an expensive makeover. Sometimes a small, conservative change makes the biggest difference."),
      ],
      faqs: [],
    },
    {
      title: "Teeth Whitening Myths You Should Stop Believing",
      slug: "teeth-whitening-myths", category: "General", cover: "/images/banner2.png", alt: "Bright white smile",
      tags: ["teeth whitening", "myths", "cosmetic dentistry"], focus: "teeth whitening", author: "nisha", draft: true, views: 0,
      excerpt: "Charcoal powder, lemon and baking soda are all over social media. Here is what actually whitens teeth safely - and what damages them.",
      content: [
        P_("Draft - to be reviewed by Dr. Kavita before publishing."),
        H2("Myth 1: Charcoal toothpaste whitens teeth"),
        P_("Charcoal mostly scrubs off surface stains and can wear down enamel over time, making teeth look more yellow in the long run."),
        H2("Myth 2: Whitening damages enamel"),
        P_("Professional whitening gels used under supervision do not damage enamel. Temporary sensitivity is common and settles within a few days."),
        UL(["Lemon and baking soda - acidic and abrasive, avoid", "Whitening strips - mild results, follow instructions", "In-office whitening - fastest, most predictable results"]),
        QUOTE("If it fizzes, burns or scratches, it does not belong on your teeth."),
      ],
      faqs: [["How long does whitening last?", "<p>Usually 1 to 2 years depending on tea, coffee and tobacco use.</p>"]],
    },
    {
      title: "Crowns and Bridges: How Long Do They Last?",
      slug: "crowns-and-bridges-how-long-do-they-last", category: "Treatments", cover: "/images/dental-crown-and-bridges.png", alt: "Dental crown and bridge models",
      tags: ["crowns", "bridges", "restorative"], focus: "dental crown", author: "arjun", draft: true, views: 0,
      excerpt: "A well-made crown can last 15 years or more. Here is what affects its lifespan and how to make yours last.",
      content: [
        P_("Crowns and bridges are among the most durable dental restorations, but they are not maintenance-free."),
        H2("Materials compared"),
        UL(["PFM (porcelain fused to metal) - strong and economical", "Zirconia - very strong, metal-free, good for back teeth", "E-max - the most natural look for front teeth"]),
        H2("What shortens a crown's life"),
        OL(["Decay at the edge of the crown", "Grinding and clenching at night", "Using teeth to open packets or bottles"]),
      ],
      faqs: [],
    },
  ];
  const computeReadTime = (html) => Math.max(1, Math.ceil(html.replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter(Boolean).length / 200));
  for (const post of POSTS) {
    const content = post.content.join("");
    let createdMs, publishedMs = null, updatedMs;
    if (post.draft) {
      createdMs = jitter(istMs(addDays(ANCHOR, -int(4, 15)), "15:20"));
      updatedMs = createdMs + int(1, 3) * DAY + int(0, 5) * HOUR;
      if (updatedMs > ANCHOR_NOW) updatedMs = ANCHOR_NOW - int(1, 5) * HOUR;
    } else {
      const [d, t] = post.published.split(" ");
      publishedMs = jitter(istMs(d, t));
      createdMs = publishedMs - int(1, 4) * DAY - int(1, 6) * HOUR;
      updatedMs = publishedMs + int(0, 2) * HOUR;
    }
    const created = uniq("Blog", createdMs);
    BLOGS.push({
      _id: oid(created), title: post.title, slug: post.slug, excerpt: post.excerpt, content, coverImage: post.cover,
      author: U[post.author]._id, authorName: post.authorName || "", status: post.draft ? "draft" : "published",
      scheduledPublishAt: null, publishedAt: publishedMs ? iso(publishedMs) : null, views: post.views, tags: post.tags,
      seoTitle: `${post.title}`.slice(0, 60), seoDescription: post.excerpt.slice(0, 155), category: post.category,
      readTimeMinutes: computeReadTime(content), canonicalUrl: "", coverImageAlt: post.alt, ogImage: "", ogTitle: "", ogDescription: "",
      focusKeyword: post.focus, faqs: post.faqs.map(([question, answer]) => ({ question, answer, _id: oid(created) })),
      createdAt: iso(created), updatedAt: iso(updatedMs), __v: 0,
    });
  }
}

// ============================================================================
// 24. EXPENSES + EXTERNAL INCOME
// ============================================================================
{
  const months = ["2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10"];
  const add = (key, category, description, amount, paymentMode, spentKey, recordedKey, vendor, clinicKey, notes) => {
    const ms = jitter(istMs(key, pick(["10:20", "12:45", "16:30", "19:10"])) + int(0, 1) * DAY);
    if (ms > ANCHOR_NOW) return null;
    const created = uniq("Expense", ms);
    amount = Math.max(100, Math.round((amount * EXPENSE_SCALE) / 100) * 100);
    const e = {
      _id: oid(created), date: dateOnly(key), category, description, amount, paymentMode,
      spentBy: U[spentKey]._id, recordedBy: U[recordedKey]._id, ...(vendor && ["lab", "materials", "equipment", "marketing"].includes(category) ? { vendor } : {}),
      ...(clinicKey ? { clinic: C[clinicKey]._id } : {}), ...(notes ? { notes } : {}),
      isVoided: false, createdAt: iso(created), updatedAt: iso(created), __v: 0,
    };
    DB.Expense.push(e);
    return e;
  };
  for (const m of months) {
    add(`${m}-01`, "rent", `Clinic rent - Sector 15 (${m})`, 22000, "net_banking", "arjun", "sandeep", null, "US");
    add(`${m}-02`, "rent", `Clinic rent - Murthal Road (${m})`, 18000, "net_banking", "arjun", "pooja", null, "UM");
    if (m !== "2026-10" || true) {
      const payKey = `${m}-0${pick(["5", "6", "7"])}`;
      add(payKey, "salaries", `Staff salaries - Sector 15 (${m})`, 28000 + (m >= "2026-08" ? 2000 : 0), "net_banking", "arjun", "arjun", null, "US");
      add(payKey, "salaries", `Staff salaries - Murthal Road (${m})`, 22000 + (m >= "2026-09" ? 1500 : 0), "net_banking", "kavita", "pooja", null, "UM");
    }
    add(`${m}-${pick(["10", "11", "12"])}`, "utilities", "Electricity bill - both clinics", int(70, 98) * 100, "upi", "sandeep", "sandeep", null, null);
    add(`${m}-${pick(["14", "15"])}`, "utilities", "Internet & phone lines", 1800, "upi", "sandeep", "sandeep", null, null, "Airtel broadband + 2 landlines");
    add(`${m}-${pick(["08", "09", "18", "19"])}`, "materials", pick(["Composite kits, bonding agent & etchant", "Endo files, GP points & sealer", "Impression material & disposables", "Gloves, masks, suction tips & sterilisation pouches"]), int(85, 180) * 100, pick(["upi", "card"]), pick(["sandeep", "pooja"]), pick(["sandeep", "pooja"]), pick(["Dentsply Dealer - Delhi", "Sonipat Dental Depot", "DentalKart"]), pick(["US", "UM"]));
    add(`${m}-${pick(["20", "21", "22"])}`, "marketing", pick(["Google Ads - local search campaign", "Instagram & Facebook promotion", "Pamphlets for school dental camp"]), pick([6000, 8000, 10000]), "card", "arjun", "arjun", pick(["Google Ads", "Meta Ads", "Shree Printers, Sonipat"]), null);
    add(`${m}-${pick(["24", "25", "26"])}`, "other", pick(["Pantry, tea & housekeeping supplies", "RO water service & cleaning", "Courier charges for lab work"]), int(12, 32) * 100, "cash", pick(["ritu", "amit"]), pick(["ritu", "amit"]), null, pick(["US", "UM"]));
  }
  add("2026-05-20", "equipment", "Class B autoclave (22 L)", 85000, "cheque", "arjun", "arjun", "Sonipat Dental Depot", "UM", "Installed at Murthal Road clinic");
  add("2026-08-11", "equipment", "Intraoral camera with software", 38000, "card", "kavita", "kavita", "DentalKart", "US");
  add("2026-09-29", "materials", "Clear aligner case-start kit (attachment templates)", 6500, "upi", "kavita", "pooja", "Aligner Studio India", "UM");
  add("2026-07-14", "lab", "Aligner trays outsourced - 2 cases", 24000, "net_banking", "kavita", "kavita", "Aligner Studio India", "UM", "Not billed through lab orders");
  add("2026-10-03", "equipment", "Replacement LED curing light", 9500, "upi", "sandeep", "sandeep", "DentalKart", "US");
  // edit + void examples
  const edited = DB.Expense.find((e) => e.category === "utilities" && e.date.startsWith("2026-09"));
  if (edited) {
    const ems = Date.parse(edited.createdAt) + int(1, 3) * DAY;
    edited.amount += 600;
    edited.editedBy = U.arjun._id;
    edited.editedAt = iso(ems);
    edited.updatedAt = iso(ems + 4);
  }
  const voided = add("2026-10-16", "other", "Pantry supplies (duplicate entry)", 1450, "cash", "ritu", "ritu", null, "US");
  if (voided) {
    const vms = Date.parse(voided.createdAt) + int(2, 6) * HOUR;
    voided.isVoided = true;
    voided.voidedAt = iso(vms);
    voided.voidedBy = U.sandeep._id;
    voided.voidReason = "Entered twice by mistake";
    voided.updatedAt = iso(vms + 3);
  }
  DB.Expense.sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const CLINICS_EXT = ["Smile Care Dental, Panipat", "City Dental Centre, Rohtak", "Gohana Dental Hospital", "Shree Krishna Multispeciality Hospital, Sonipat", "Bright Smiles Dental, Kundli"];
  const WORK = [["Implant surgery (2 units)", 18000, 26000], ["Surgical extraction of impacted 38 & 48", 6000, 9000], ["Full mouth rehabilitation consultation", 3000, 5000], ["Implant placement (single, guided)", 12000, 16000], ["RCT on referral (molar, re-treatment)", 4000, 6500], ["Sinus lift + implant", 22000, 30000]];
  for (let i = 0; i < COUNTS.externalIncome; i++) {
    const dayIdx = Math.floor(Math.pow(R(), 1 / 1.4) * (HISTORY_DAYS - 2));
    const key = nextWorkingDay(addDays(HISTORY_START, dayIdx));
    const [treatment, lo, hi] = pick(WORK);
    const staffDoc = chance(0.8);
    const doc = staffDoc ? pick([U.arjun, U.kavita]) : null;
    const ms = jitter(istMs(addDays(key, int(0, 1)), pick(["19:30", "20:45", "21:15"])));
    if (ms > ANCHOR_NOW) continue;
    const created = uniq("ExternalIncome", ms);
    const rec = {
      _id: oid(created), date: dateOnly(key), amount: roundTo(int(lo, hi), 500), doctor: doc ? doc._id : null,
      doctorName: doc ? "" : pick(["Dr. Manish Gahlawat (visiting oral surgeon)", "Dr. Sneha Arora (visiting endodontist)"]),
      clinicName: pick(CLINICS_EXT), treatment, notes: chance(0.35) ? pick(["Paid by bank transfer", "TDS deducted at source", "Referral case", "Cheque received"]) : "",
      recordedBy: (doc ? doc : U.arjun)._id, isVoided: false, voidedAt: null, voidedBy: null, voidReason: "",
      createdAt: iso(created), updatedAt: iso(created), __v: 0,
    };
    DB.ExternalIncome.push(rec);
  }
  DB.ExternalIncome.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const v = DB.ExternalIncome[Math.floor(DB.ExternalIncome.length / 2)];
  const vms = Date.parse(v.createdAt) + int(1, 2) * DAY;
  Object.assign(v, { isVoided: true, voidedAt: iso(vms), voidedBy: U.arjun._id, voidReason: "Duplicate of an earlier entry for the same case", updatedAt: iso(vms + 2) });
}

// ============================================================================
// 17. FINALISE INVOICES + PAYMENTS (numbers, running balances, statuses)
// ============================================================================
{
  const sorted = [...INVOICES].sort((a, b) => a.createdMs - b.createdMs);
  const perMonth = new Map();
  for (const inv of sorted) {
    const prefix = `INV-${yymm(inv.createdMs)}-`;
    const n = (perMonth.get(prefix) || 0) + 1;
    perMonth.set(prefix, n);
    inv.invoiceNumber = `${prefix}${String(n).padStart(4, "0")}`;
  }
  // running amountPaid -> previousAmountPaid for each settlement
  for (const inv of INVOICES) {
    inv.events.sort((a, b) => a.ms - b.ms);
    let running = 0;
    for (const e of inv.events) {
      if (e.kind === "settle") {
        const entry = e.pay.settled.find((s) => s.inv === inv);
        entry.previous = e.initial ? 0 : running;
      }
      running += e.delta;
      if (running > 0) inv.wasPaid = true;
    }
    inv.amountPaid = running;
  }
  const usedPayNos = new Set();
  for (const pay of [...PAYMENTS].sort((a, b) => a.createdMs - b.createdMs)) {
    for (;;) {
      const ddmm = keyOf(pay.createdMs).slice(8, 10) + keyOf(pay.createdMs).slice(5, 7);
      const cand = `PAY-${ddmm}-${int(1000, 9999)}`;
      if (!usedPayNos.has(cand)) {
        usedPayNos.add(cand);
        pay.paymentNumber = cand;
        break;
      }
    }
  }
}

// ============================================================================
// 25. SERIALISE work objects -> raw documents
// ============================================================================
const id = (o) => (o ? o._id : undefined);
const userId = (u) => (u ? u._id || u : undefined);
const clean = (obj) => {
  for (const k of Object.keys(obj)) if (obj[k] === undefined) delete obj[k];
  return obj;
};

// ---- patients ----
for (const p of P) {
  assert(p.createdMs, `patient ${p.name} has no createdMs`);
  p.createdMs = uniq("Patient", p.createdMs);
  p._id = oid(p.createdMs);
}
// appointments/invoices reference patients by object -> ids resolved now
const memDoc = (m) =>
  clean({
    plan: m.plan || undefined, planName: m.planName, discountPercent: m.discountPercent, startDate: iso(m.startMs), expiryDate: iso(m.expiryMs),
    status: m.status, pausedAt: m.pausedMs ? iso(m.pausedMs) : undefined,
    // membershipSchema is { _id: false } -> its nested statusHistory entries get no _id either
    statusHistory: m.statusHistory.map((h) => clean({ action: h.action, reason: h.reason, performedBy: h.performedBy, performedAt: iso(h.performedMs) })),
    amountPaid: m.amountPaid, paymentMethod: m.paymentMethod, assignedBy: m.assignedBy, notes: m.notes,
  });
for (const p of P) {
  const lastTouch = Math.max(p.createdMs, ...(p.events || []).filter((x) => x <= ANCHOR_NOW));
  const isActive = !p.inactive;
  DB.Patient.push(clean({
    _id: p._id, phone: p.phone, email: p.email, password: DEMO_PASSWORD_HASH,
    loginOtp: { attempts: 0, sendCount: 0 },
    name: p.name, gender: p.gender, dateOfBirth: p.dateOfBirth, age: p.age, address: p.address, bloodGroup: p.bloodGroup,
    allergies: p.allergies || [], medicalHistory: p.medicalHistory || [], emergencyContact: p.emergencyContact,
    membership: p.membership ? memDoc(p.membership) : undefined,
    membershipHistory: p.membershipHistory.map(memDoc),
    preferredClinic: C[p.clinicKey]._id, registeredBy: p.registeredBy ? p.registeredBy._id : undefined,
    isActive, notes: p.notes,
    createdAt: iso(p.createdMs), updatedAt: iso(lastTouch), __v: 0,
  }));
}
// a few patients deactivated (no active membership, nothing upcoming)
{
  const now = ANCHOR_NOW;
  const cands = shuffle(DB.Patient.filter((d) => {
    const p = P.find((x) => x._id === d._id);
    return !p.isDemo && !(p.membership && p.membership.status === "active" && p.membership.expiryMs > now) && (p.appts || []).every((a) => slotStartMs(a) < now - 30 * DAY);
  })).slice(0, 3);
  for (const d of cands) {
    d.isActive = false;
    d.notes = pick(["Moved out of Sonipat", "Duplicate record - merged with family member's file", "Requested to deactivate account"]);
    d.updatedAt = iso(Math.max(Date.parse(d.updatedAt), ANCHOR_NOW - int(5, 25) * DAY));
  }
}

// ---- appointments ----
for (const a of APPTS.sort((x, y) => x.createdMs - y.createdMs)) {
  const doc = {
    _id: a._id, appointmentNumber: a.appointmentNumber, patient: a.p._id, clinic: C[a.clinicKey]._id, date: dateOnly(a.key), timeSlot: a.slot,
    tokenNumber: a.tokenNumber, tokenDateKey: a.tokenDateKey, type: a.type, appointmentType: a.appointmentType, visitType: a.visitType,
    parentAppointment: a.parent ? a.parent._id : null, sessionNumber: a.sessionNumber, sessionsPlanned: a.sessionsPlanned,
    treatmentStatus: a.treatmentStatus, treatmentClosedAt: a.treatmentClosedMs ? iso(a.treatmentClosedMs) : null, treatmentClosedReason: a.treatmentClosedReason,
    originatingOpdAppointment: a.originatingOpd ? a.originatingOpd._id : null,
    treatmentHistory: a.treatmentHistory.map((h) => clean({ action: h.action, resolution: h.resolution, reason: h.reason, performedBy: h.performedBy, performedAt: iso(h.performedMs), _id: h._id })),
    treatmentName: a.treatmentName,
    fee: a.feeUnset ? undefined : a.fee,
    invoice: a.invoice ? a.invoice._id : undefined,
    status: a.status, pendingExpiry: null, reason: a.reason, notes: a.notes, cancellationReason: a.cancellationReason, statusHistory: [],
    opdFee: a.opdFee ?? 300, opdFeePaid: a.opdFeePaid, isFree: a.isFree, paymentMethod: a.paymentMethod,
    paymentLinkUrl: null, paymentLinkId: null, paymentLinkStatus: null, invoiceError: { message: null, failedAt: null },
    paymentStatus: a.paymentStatus, createdBy: a.createdBy ? a.createdBy._id : undefined, source: a.source, reminderSent: false,
    notifications: clean({ clinicEmailSentAt: iso(a.mail.clinicEmailSentAt), patientEmailSentAt: a.mail.patientEmailSentAt ? iso(a.mail.patientEmailSentAt) : undefined, patientEmailError: a.mail.patientEmailError }),
    createdAt: iso(a.createdMs), updatedAt: iso(Math.min(a.updatedMs, Math.max(a.createdMs, ANCHOR_NOW))), __v: 0,
  };
  DB.Appointment.push(clean(doc));
}

// ---- invoices ----
for (const inv of INVOICES.sort((a, b) => a.createdMs - b.createdMs)) {
  const { subtotal, totalTax, grandTotal: gt } = invoiceTotals(inv);
  const amountPaid = inv.amountPaid;
  let paymentStatus = amountPaid >= gt ? "paid" : amountPaid > 0 ? "partial" : "unpaid";
  let status;
  if (inv.cancelled) status = "cancelled";
  else if (paymentStatus === "paid") status = "paid";
  else if (paymentStatus === "partial") status = "partially_paid";
  else status = inv.issuedMs || inv.wasPaid ? "sent" : "draft";
  if (gt === 0 && amountPaid === 0) { paymentStatus = "paid"; if (!inv.cancelled) status = "paid"; }
  let notes = inv.notes;
  if (inv.writeOff) {
    notes = `${notes ? `${notes}\n` : ""}[${iso(inv.writeOff.ms - 20)}] Treatment closed (${inv.writeOff.resolution}): ${inv.writeOff.reason}. Outstanding ₹${inv.writeOff.outstanding} written off.`;
  }
  const doc = {
    _id: inv._id, invoiceNumber: inv.invoiceNumber, patient: inv.p._id, clinic: inv.clinicKey ? C[inv.clinicKey]._id : undefined,
    appointment: inv.appt ? inv.appt._id : undefined, invoiceDate: iso(inv.createdMs - int(1, 4)), dueDate: iso(inv.createdMs + 7 * DAY - int(0, 3)),
    items: inv.items.map((it) => clean({ itemType: it.itemType, itemRef: it.itemRef, itemRefModel: it.itemRefModel, description: it.description, quantity: it.quantity, unitPrice: it.unitPrice, discount: it.discount, taxRate: it.taxRate, amount: it.amount, taxAmount: it.taxAmount, total: it.total, _id: it._id })),
    subtotal, discount: inv.discount, totalTax, grandTotal: gt, amountPaid, balanceDue: Math.max(0, gt - amountPaid),
    status, paymentStatus, paymentMethod: inv.paymentMethod, notes, createdBy: userId(inv.createdBy),
    cancelledAt: inv.cancelled ? iso(inv.cancelled.ms) : undefined, cancelledBy: inv.cancelled ? inv.cancelled.by : undefined,
    isVoided: !!inv.voided, voidedAt: inv.voided ? iso(inv.voided.ms) : null, voidedBy: inv.voided ? inv.voided.by : null, voidReason: inv.voided ? inv.voided.reason : null,
    lastEditedAt: inv.edited ? iso(inv.edited.ms) : null, lastEditedBy: inv.edited ? inv.edited.by : null,
    editHistory: inv.edited ? [{ editedAt: iso(inv.edited.ms), editedBy: inv.edited.by, reason: inv.edited.reason, changes: { items: { from: inv.edited.before.items, to: inv.items.map((it) => clean({ itemType: it.itemType, description: it.description, unitPrice: it.unitPrice, quantity: 1, amount: it.unitPrice, taxAmount: 0, total: it.unitPrice })) }, discount: { from: inv.edited.before.discount, to: inv.discount }, grandTotal: { from: inv.edited.before.grandTotal, to: gt } }, _id: oid(inv.edited.ms) }] : [],
    cancellationReason: inv.cancelled ? inv.cancelled.reason : undefined,
    paymentLink: { id: null, shortUrl: null, status: null, createdAt: null, paidAt: null },
    createdAt: iso(inv.createdMs), updatedAt: iso(Math.max(inv.createdMs, inv.updatedMs)), __v: 0,
  };
  DB.Invoice.push(clean(doc));
}
// payment reminder notification needs the final invoice number
for (const n of NOTIFS) if (n.staticReminder) n.message = n.message.replace("__OPG_INVOICE_NUMBER__", n.invoice.invoiceNumber);

// ---- payments ----
for (const pay of PAYMENTS.sort((a, b) => a.createdMs - b.createdMs)) {
  const settled = (pay.settled || []).map((s) => ({ invoiceId: s.inv._id, invoiceNumber: s.inv.invoiceNumber, appliedAmount: s.applied, previousAmountPaid: s.previous ?? 0, _id: s._id }));
  const refundDefaults = { razorpayError: null, manualMethod: null, confirmedManuallyAt: null, confirmedManuallyBy: null, exceedsCollectedAmount: false };
  const doc = {
    _id: pay._id, paymentNumber: pay.paymentNumber, patient: pay.p._id, invoice: pay.invoiceLink ? pay.invoiceLink._id : undefined,
    appointment: pay.appt ? pay.appt._id : undefined, treatmentType: pay.treatmentType, treatmentName: pay.treatmentName,
    clinic: pay.clinicKey ? C[pay.clinicKey]._id : undefined, amount: pay.amount, paymentMode: pay.paymentMode, status: pay.status, type: pay.type,
    paidAt: pay.paidMs ? iso(pay.paidMs) : undefined,
    razorpayOrderId: pay.razorpayOrderId, razorpayPaymentId: pay.razorpayPaymentId, razorpaySignature: pay.razorpaySignature,
    razorpayDetails: pay.receipt ? { receipt: pay.receipt } : undefined,
    referenceNumber: pay.referenceNumber, receivedBy: pay.receivedBy ? pay.receivedBy._id : undefined,
    refund: pay.refund ? clean({ amount: pay.refund.amount, refundedAt: iso(pay.refund.refundedMs), refundedBy: pay.refund.refundedBy, reason: pay.refund.reason, ...refundDefaults }) : refundDefaults,
    notes: pay.notes, settledInvoices: settled, recordedBy: userId(pay.recordedBy),
    reversed: pay.status === "reversed",
    reversalReason: pay.reversal ? pay.reversal.reason : undefined, reversedAt: pay.reversal ? iso(pay.reversal.ms) : undefined, reversedBy: pay.reversal ? pay.reversal.by : undefined,
    createdAt: iso(pay.createdMs), updatedAt: iso(Math.max(pay.createdMs, pay.updatedMs)), __v: 0,
  };
  DB.Payment.push(clean(doc));
}

// ---- tests ----
{
  const perMonth = new Map();
  for (const t of TESTS.sort((a, b) => a.createdMs - b.createdMs)) {
    const prefix = `TST-${yymm(t.createdMs)}-`;
    const n = (perMonth.get(prefix) || 0) + 1;
    perMonth.set(prefix, n);
    DB.Test.push(clean({
      _id: t._id, testNumber: `${prefix}${String(n).padStart(4, "0")}`, patient: t.p._id, testType: t.tm._id, clinic: C[t.clinicKey]._id,
      appointment: t.appt ? t.appt._id : undefined, status: t.status, orderedDate: iso(t.createdMs - int(1, 9)),
      sampleCollectedDate: t.sampleMs && t.status !== "ordered" ? iso(t.sampleMs) : undefined, resultDate: t.resultMs ? iso(t.resultMs) : undefined,
      price: t.price, discount: t.discount, finalAmount: t.finalAmount, resultSummary: t.status === "completed" ? t.resultSummary : undefined,
      resultValues: (t.status === "completed" && t.resultValues ? t.resultValues : []).map((v) => ({ ...v, _id: oid(t.resultMs) })),
      report: t.report ? t.report._id : undefined, notes: t.notes, orderedBy: t.by._id,
      createdAt: iso(t.createdMs), updatedAt: iso(Math.min(t.updatedMs, ANCHOR_NOW)), __v: 0,
    }));
  }
}
// ---- reports ----
{
  const PREFIX = { xray: "XRY", opg: "OPG", cbct: "CBT", lab_report: "LAB", prescription: "RX", treatment_plan: "TP", consent_form: "CF", other: "RPT" };
  const perPrefix = new Map();
  for (const r of REPORTS.sort((a, b) => a.createdMs - b.createdMs)) {
    const prefix = `${PREFIX[r.category]}-${yymm(r.createdMs)}-`;
    const n = (perPrefix.get(prefix) || 0) + 1;
    perPrefix.set(prefix, n);
    DB.Report.push(clean({
      _id: r._id, reportNumber: `${prefix}${String(n).padStart(4, "0")}`, title: r.title, description: undefined, category: r.category,
      patient: r.p._id, clinic: C[r.clinicKey]._id, appointment: r.appt ? r.appt._id : undefined, test: r.test ? r.test._id : undefined,
      file: { fileType: "application/pdf" },
      files: r.files.map((f) => clean({ url: f.url, publicId: f.publicId, fileName: f.fileName, fileSize: f.fileSize, fileType: f.fileType, thumbnailUrl: f.thumbnailUrl, description: f.description, uploadedAt: iso(f.uploadedMs), _id: f._id })),
      uploadedBy: r.by._id, reportDate: dateOnly(r.reportKey), isVisibleToPatient: r.visible, notes: r.notes, tags: r.tags, isActive: true,
      createdAt: iso(r.createdMs), updatedAt: iso(r.createdMs), __v: 0,
    }));
  }
}
// ---- lab orders ----
{
  const perMonth = new Map();
  for (const o of LAB_ORDERS.sort((a, b) => a.createdMs - b.createdMs)) {
    const prefix = `LO-${yymm(o.createdMs)}-`;
    const n = (perMonth.get(prefix) || 0) + 1;
    perMonth.set(prefix, n);
    const amountPaid = o.payments.reduce((s, x) => s + x.amount, 0);
    const paymentStatus = o.totalAmount > 0 && amountPaid >= o.totalAmount ? "paid" : amountPaid > 0 ? "partially_paid" : "unpaid";
    DB.LabOrder.push(clean({
      _id: o._id, orderNumber: `${prefix}${String(n).padStart(4, "0")}`, lab: LAB[o.labKey]._id, patient: o.p._id, doctor: o.doctor,
      items: o.items, totalAmount: o.totalAmount, amountPaid, balanceDue: Math.max(0, o.totalAmount - amountPaid), paymentStatus,
      paymentHistory: o.payments.map((x) => ({ amount: x.amount, date: iso(x.dateMs), method: x.method, _id: x._id })),
      deliveryStatus: o.deliveryStatus, archived: o.archived, orderDate: iso(o.createdMs - int(1, 9)), expectedDelivery: dateOnly(o.expectedKey),
      deliveredDate: o.deliveredMs ? iso(o.deliveredMs) : undefined, notes: o.notes, createdBy: deskUser(o.p.clinicKey, o.createdMs)._id,
      createdAt: iso(o.createdMs), updatedAt: iso(Math.min(Math.max(o.createdMs, o.updatedMs), ANCHOR_NOW)), __v: 0,
    }));
  }
}
// ---- follow-ups ----
for (const f of FOLLOWUPS.sort((a, b) => a.createdMs - b.createdMs)) {
  DB.FollowUpReminder.push(clean({
    _id: f._id, patient: f.p._id, clinic: C[f.clinicKey]._id, followUpDate: dateOnly(f.dateKey), time: f.time, reason: f.reason, status: f.status,
    reminderSentAt: f.reminderSentMs ? iso(f.reminderSentMs) : undefined, createdBy: f.by._id,
    createdAt: iso(f.createdMs), updatedAt: iso(Math.min(Math.max(f.createdMs, f.updatedMs), ANCHOR_NOW)), __v: 0,
  }));
}
// ---- enquiries ----
for (const e of ENQUIRIES.sort((a, b) => a.createdMs - b.createdMs)) {
  DB.Enquiry.push(clean({
    _id: e._id, enquiryNumber: e.enquiryNumber, name: e.name, phone: e.phone, email: e.email, treatmentName: e.treatmentName, message: e.message,
    source: e.source, status: e.status,
    statusHistory: e.statusHistory.map((h) => clean({ status: h.status, changedAt: iso(h.changedMs), changedBy: h.changedBy, note: h.note, _id: h._id })),
    assignedTo: e.assignedTo ? e.assignedTo._id : undefined,
    notes: e.notes.map((n) => ({ text: n.text, addedBy: n.addedBy, addedAt: iso(n.addedMs), _id: n._id })),
    nextFollowUp: e.nextFollowUpMs ? iso(e.nextFollowUpMs) : undefined, followUpCount: e.followUpCount,
    lastContactedAt: e.lastContactedMs ? iso(e.lastContactedMs) : undefined,
    convertedToPatient: e.conv && e.status === "converted" ? e.conv._id : undefined, convertedAt: e.convertedMs ? iso(e.convertedMs) : undefined,
    isUrgent: e.isUrgent, isSpam: e.isSpam,
    createdAt: iso(e.createdMs), updatedAt: iso(Math.min(Math.max(e.createdMs, e.updatedMs || 0), ANCHOR_NOW)), __v: 0,
  }));
}
// ---- notifications ----
for (const n of NOTIFS.sort((a, b) => a.createdMs - b.createdMs)) {
  const recip = n.recipient;
  const hasEmail = !!(recip && recip.email) || !!(recip && recip.doc && recip.doc.email);
  const processedMs = n.processed || n.adminSent || n.bulk ? n.createdMs + int(80, 900) : null;
  const emailSent = n.sendEmail && processedMs && hasEmail;
  const readMs = n.readMs && n.readMs > n.createdMs ? n.readMs : null;
  const doc = {
    _id: n._id, title: n.title, message: n.message, type: n.type, priority: n.priority || "normal",
    recipientType: n.recipientModel === "Patient" ? "patient" : "user", recipient: recip._id, recipientModel: n.recipientModel,
    sendSms: !!n.sendSms, sendEmail: !!n.sendEmail, sendWhatsapp: !!n.sendWhatsapp, showInApp: true,
    smsStatus: { sent: false }, emailStatus: emailSent ? { sent: true, sentAt: iso(processedMs - 40) } : { sent: false }, whatsappStatus: { sent: false },
    isRead: !!readMs, readAt: readMs ? iso(readMs) : undefined,
    appointment: n.appointment ? n.appointment._id : undefined, invoice: n.invoice ? n.invoice._id : undefined,
    scheduledFor: n.adminSent && !n.bulk ? null : undefined,
    isProcessed: !!processedMs, processedAt: processedMs ? iso(processedMs) : undefined,
    createdBy: n.createdBy ? n.createdBy._id : undefined,
    createdAt: iso(n.createdMs), updatedAt: iso(Math.min(Math.max(n.createdMs, readMs || 0, processedMs || 0), ANCHOR_NOW)), __v: 0,
  };
  DB.Notification.push(clean(doc));
}
// ---- labs/blogs already raw; sort the rest by creation ----
DB.Blog.push(...BLOGS.sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
DB.Patient.sort((a, b) => a.createdAt.localeCompare(b.createdAt));

// ============================================================================
// 26. CONSISTENCY ASSERTIONS
// ============================================================================
{
  const byId = (coll) => new Map(DB[coll].map((d) => [d._id, d]));
  const pats = byId("Patient");
  const appts = byId("Appointment");
  const invs = byId("Invoice");
  for (const [name, docs] of Object.entries(DB)) {
    const ids = new Set();
    const created = new Set();
    for (const d of docs) {
      assert(!ids.has(d._id), `${name} duplicate _id ${d._id}`);
      ids.add(d._id);
      if (name !== "Counter" && d.createdAt) {
        assert(!created.has(d.createdAt), `${name} duplicate createdAt ${d.createdAt}`);
        created.add(d.createdAt);
        assert(Date.parse(d.createdAt) <= ANCHOR_NOW, `${name} ${d._id} created in the future ${d.createdAt}`);
        assert(Date.parse(d.updatedAt) >= Date.parse(d.createdAt), `${name} ${d._id} updatedAt < createdAt`);
        assert(Date.parse(d.updatedAt) <= ANCHOR_NOW, `${name} ${d._id} updated in the future ${d.updatedAt}`);
      }
    }
  }
  // appointments
  const slotKeys = new Set();
  const tokenKeys = new Set();
  for (const a of DB.Appointment) {
    assert(pats.has(a.patient), `appt ${a._id} patient`);
    const k = `${a.date}|${a.timeSlot}`;
    assert(!slotKeys.has(k), `duplicate date/slot ${k}`);
    slotKeys.add(k);
    const tk = `${a.clinic}|${a.tokenDateKey}|${a.tokenNumber}`;
    assert(!tokenKeys.has(tk), `duplicate token ${tk}`);
    tokenKeys.add(tk);
    if (a.invoice) assert(invs.has(a.invoice), `appt ${a._id} invoice missing`);
    if (a.parentAppointment) assert(appts.get(a.parentAppointment)?.visitType === "treatment", `session parent ${a._id}`);
    if (a.visitType === "treatment") assert(appts.get(a.originatingOpdAppointment)?.visitType === "opd", `treatment origin ${a._id}`);
    assert(dow(a.date.slice(0, 10)) !== 0, `appointment on a Sunday ${a._id}`);
  }
  // invoices <-> payments money consistency (live recompute == stored)
  const INTENTIONAL = new Set(INVOICES.filter((i) => i.intentional).map((i) => i._id));
  const realPaid = new Map();
  for (const p of DB.Payment) {
    if (!["paid", "refunded", "refund_pending"].includes(p.status)) continue;
    if (p.settledInvoices.length) for (const s of p.settledInvoices) realPaid.set(s.invoiceId, (realPaid.get(s.invoiceId) || 0) + s.appliedAmount);
    else if (p.invoice) realPaid.set(p.invoice, (realPaid.get(p.invoice) || 0) + p.amount);
  }
  let mismatches = 0;
  for (const inv of DB.Invoice) {
    const live = realPaid.get(inv._id) || 0;
    if (live !== inv.amountPaid) {
      mismatches++;
      if (!INTENTIONAL.has(inv._id)) {
        throw new Error(`invoice ${inv.invoiceNumber} stored amountPaid ${inv.amountPaid} != payments ${live}`);
      }
    }
    assert(inv.balanceDue === Math.max(0, inv.grandTotal - inv.amountPaid), `balance ${inv.invoiceNumber}`);
  }
  // counters agree with tokens
  for (const c of DB.Counter) {
    const max = Math.max(...DB.Appointment.filter((a) => a.clinic === c.clinicId && a.tokenDateKey === c.dateKey).map((a) => a.tokenNumber));
    assert(max === c.seq, `counter ${c._id}`);
  }
  globalThis.__intentionalMismatches = mismatches;
}

// ============================================================================
// 27. WRITE FILES
// ============================================================================
mkdirSync(OUT_DIR, { recursive: true });
let totalBytes = 0;
const summary = [];
for (const [name, docs] of Object.entries(DB)) {
  const json = `${JSON.stringify(docs, null, 2)}\n`;
  writeFileSync(join(OUT_DIR, `${name}.json`), json);
  totalBytes += Buffer.byteLength(json);
  summary.push([name, docs.length, Buffer.byteLength(json)]);
}
const meta = {
  anchorDate: ANCHOR,
  anchorTimeIST: ANCHOR_TIME,
  timezone: "Asia/Kolkata",
  generatedBy: "scripts/demo-data/generate.mjs",
  demoAccounts: {
    password: DEMO_PASSWORD,
    staff: USER_SPECS.map((s) => ({ role: s.role, name: s.name, email: s.email, phone: s.phone, isActive: !s.inactiveFrom, _id: U[s.key]._id })),
    patient: { name: DEMO.name, phone: DEMO_PATIENT.phone, email: DEMO_PATIENT.email, password: DEMO_PASSWORD, otp: DEMO_PATIENT.otp, _id: DEMO._id },
  },
  counts: Object.fromEntries(summary.map(([n, c]) => [n, c])),
};
writeFileSync(join(OUT_DIR, "_meta.json"), `${JSON.stringify(meta, null, 2)}\n`);

const fmt = (n) => `${(n / 1024).toFixed(0)} KB`;
console.log(`Demo dataset written to ${OUT_DIR}`);
for (const [n, c, b] of summary) console.log(`  ${n.padEnd(18)} ${String(c).padStart(4)} docs  ${fmt(b).padStart(7)}`);
console.log(`  ${"TOTAL".padEnd(18)} ${String(summary.reduce((s, x) => s + x[1], 0)).padStart(4)} docs  ${fmt(totalBytes).padStart(7)}`);
console.log(`  (invoices whose stored amountPaid intentionally differs from the Payment ledger: ${globalThis.__intentionalMismatches})`);

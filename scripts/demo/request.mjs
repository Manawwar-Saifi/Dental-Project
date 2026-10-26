/**
 * Call the demo mock API from Node — no browser or backend needed.
 *
 *   node scripts/demo/request.mjs GET "/patients?page=1&limit=5" --as admin
 *   node scripts/demo/request.mjs GET /patients/me --as patient
 *   node scripts/demo/request.mjs POST /auth/login --body "{\"email\":\"admin@example.com\",\"password\":\"Demo@123\"}"
 *
 * Options:
 *   --as admin|patient|<staff email>|<patient phone>   send a demo token for that account
 *   --body <json>                                       request body
 *   --no-shift                                          keep the dataset's anchor dates (no shift to today)
 *
 * Also importable: `const server = await loadDemoServer(); await server.request({...})`.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const demoDir = path.join(root, "src", "demo");

const importFile = (file) => import(pathToFileURL(file).href);

/** Build the same server the browser uses, from the files on disk. */
export async function loadDemoServer({ shiftDates = true } = {}) {
  const { createDemoServer } = await importFile(path.join(demoDir, "core", "server.js"));

  const data = {};
  let meta = {};
  const dataDir = path.join(demoDir, "data");
  for (const name of fs.readdirSync(dataDir).filter((f) => f.endsWith(".json"))) {
    const json = JSON.parse(fs.readFileSync(path.join(dataDir, name), "utf8"));
    if (name === "_meta.json") meta = json;
    else data[name.slice(0, -".json".length)] = json;
  }

  const handlers = [];
  const handlerDir = path.join(demoDir, "handlers");
  if (fs.existsSync(handlerDir)) {
    for (const name of fs.readdirSync(handlerDir).filter((f) => f.endsWith(".js")).sort()) {
      const module = await importFile(path.join(handlerDir, name));
      if (typeof module.default === "function") handlers.push(module.default);
    }
  }

  const today = shiftDates || !meta.anchorDate ? new Date() : new Date(`${meta.anchorDate}T06:30:00.000Z`);
  const server = createDemoServer({ data, meta, handlers, today });
  const db = await importFile(path.join(demoDir, "core", "db.js"));
  const { makeToken } = await importFile(path.join(demoDir, "core", "auth.js"));

  /** Demo bearer token for "admin", "patient", a staff email or a patient phone/email. */
  server.tokenFor = (who) => {
    const accounts = meta.demoAccounts || {};
    if (who === "admin") who = accounts.admin?.email || "admin@example.com";
    if (who === "patient") who = accounts.patient?.phone || "9876543210";
    const user = db.all("User").find((u) => u.email === who);
    if (user) return makeToken("admin", user._id);
    const patient = db.all("Patient").find((p) => p.phone === who || p.email === who);
    if (patient) return makeToken("patient", patient._id);
    throw new Error(`No demo account matches "${who}"`);
  };
  server.meta = meta;
  return server;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const args = process.argv.slice(2);
  const option = (name) => {
    const index = args.indexOf(name);
    return index === -1 ? undefined : args.splice(index, 2)[1];
  };
  const noShift = args.includes("--no-shift");
  if (noShift) args.splice(args.indexOf("--no-shift"), 1);
  const as = option("--as");
  const body = option("--body");
  const [method = "GET", url = "/"] = args;

  const server = await loadDemoServer({ shiftDates: !noShift });
  const headers = as ? { Authorization: `Bearer ${server.tokenFor(as)}` } : {};
  const result = await server.request({ method, url, headers, data: body });
  console.log(`${result.status}`);
  console.log(
    result.body instanceof Blob
      ? `<Blob ${result.body.type} ${result.body.size} bytes>`
      : JSON.stringify(result.body, null, 2)
  );
}

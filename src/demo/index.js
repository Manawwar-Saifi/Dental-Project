/**
 * Browser entry for the demo build. Loaded lazily by src/api/axios.js only
 * when IS_DEMO is set, so the dataset never ships in the normal build.
 *
 * Picks up every src/demo/data/*.json collection and every
 * src/demo/handlers/*.js module automatically, and exposes an axios adapter
 * that answers requests from the in-memory mock instead of the network.
 */
import { AxiosError, AxiosHeaders } from "axios";
import { createDemoServer } from "./core/server.js";

const dataModules = import.meta.glob("./data/*.json", { eager: true, import: "default" });
const handlerModules = import.meta.glob("./handlers/*.js", { eager: true });

const data = {};
let meta = {};
for (const [file, json] of Object.entries(dataModules)) {
  const name = file.slice(file.lastIndexOf("/") + 1, -".json".length);
  if (name === "_meta") meta = json;
  else data[name] = json;
}

const handlers = Object.values(handlerModules)
  .map((module) => module.default)
  .filter((register) => typeof register === "function");

const server = createDemoServer({ data, meta, handlers });

// A little latency so loading states look like the real app.
const MIN_LATENCY_MS = 150;
const MAX_LATENCY_MS = 450;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function demoAdapter(config) {
  const started = Date.now();
  const headers = config.headers?.toJSON ? config.headers.toJSON() : { ...config.headers };
  const result = await server.request({
    method: config.method,
    url: config.url,
    params: config.params,
    data: config.data,
    headers,
  });
  const latency = MIN_LATENCY_MS + Math.random() * (MAX_LATENCY_MS - MIN_LATENCY_MS);
  await sleep(Math.max(0, latency - (Date.now() - started)));

  let body = result.body;
  if (config.responseType === "blob" && !(body instanceof Blob)) {
    body = new Blob([JSON.stringify(body)], { type: "application/json" });
  }

  const response = {
    data: body,
    status: result.status,
    statusText: String(result.status),
    headers: AxiosHeaders.from(result.headers || {}),
    config,
    request: {},
  };

  const validateStatus = config.validateStatus;
  if (!validateStatus || validateStatus(result.status)) return response;
  throw new AxiosError(
    `Request failed with status code ${result.status}`,
    result.status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST,
    config,
    response.request,
    response,
  );
}

export const demoMeta = meta;

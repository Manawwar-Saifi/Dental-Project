/**
 * Response helpers for demo handlers. They mirror the backend's ApiResponse
 * (src/utils/ApiResponse.js) and error middleware so the frontend sees the
 * exact same envelopes: { success, message, data } and, for lists,
 * { success, message, data, pagination }.
 *
 * A handler returns one of these, or a plain object (sent as a 200 JSON body
 * as-is, for controllers that call res.json() with a custom shape), or throws
 * a DemoError.
 */

const RESPONSE = Symbol("demoResponse");

export class DemoError extends Error {
  constructor(status, message, errors = null) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

export const respond = (status, body, headers = {}) => ({
  [RESPONSE]: true,
  status,
  body,
  headers,
});

export const isResponse = (value) => Boolean(value && value[RESPONSE]);

export const ok = (data = null, message = "Success") =>
  respond(200, { success: true, message, data });

export const created = (data = null, message = "Created successfully") =>
  respond(201, { success: true, message, data });

/** Same shape as ApiResponse.paginated. */
export const paginated = (data, { page, limit, total }, message = "Success") => {
  const totalPages = Math.ceil(total / limit);
  return respond(200, {
    success: true,
    message,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  });
};

export const fail = (status, message = "Error", errors = null) =>
  respond(status, { success: false, message, errors });

/** Throwable shortcuts matching the backend's AppError subclasses. */
export const badRequest = (message = "Bad request", errors = null) =>
  new DemoError(400, message, errors);
export const unauthorized = (message = "Not authorized") => new DemoError(401, message);
export const forbidden = (message = "Forbidden") => new DemoError(403, message);
export const notFound = (resource = "Resource") =>
  new DemoError(404, `${resource} not found`);

export const NOT_IN_DEMO_MESSAGE = "This action isn't available in the demo.";

/** For actions the demo deliberately doesn't simulate; shows as a normal error toast. */
export const notInDemo = (message = NOT_IN_DEMO_MESSAGE) => new DemoError(400, message);

/**
 * A file download (CSV/PDF export, etc). `content` is a Blob or string.
 * Requests made with responseType "blob" receive it as a Blob.
 */
export const file = (content, { filename = "download", type = "application/octet-stream" } = {}) =>
  respond(200, content instanceof Blob ? content : new Blob([content], { type }), {
    "content-type": type,
    "content-disposition": `attachment; filename="${filename}"`,
  });

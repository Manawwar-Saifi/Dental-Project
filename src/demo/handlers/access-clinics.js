/**
 * Clinic locations. Ports src/modules/clinics/clinic.controller.js.
 * GET /clinics is public (patient booking, clinic store).
 */
import { findById, insert, remove, update } from "../core/db.js";
import { DemoError, created, ok } from "../core/http.js";
import { sortBy, where } from "../core/query.js";
import { blockBlogEditor, staff } from "../lib/access-common.js";

const error = (status, message) => new DemoError(status, message);

export default function register(r) {
  r.get("/clinics", (req) => {
    blockBlogEditor(req);
    const query = {};
    if (req.query.isActive !== undefined) query.isActive = req.query.isActive === "true";
    const clinics = sortBy(where("Clinic", query), "name");
    return ok({ clinics }, "Clinics fetched successfully");
  });

  // Commented out in the backend router, but the frontend api exposes it.
  r.get("/clinics/:id", (req) => {
    blockBlogEditor(req);
    const clinic = findById("Clinic", req.params.id);
    if (!clinic) throw error(404, "Clinic not found");
    return ok({ clinic }, "Clinic fetched successfully");
  });

  r.post("/clinics", (req) => {
    staff(req, "clinics", "create");
    const { name, address, phone } = req.body || {};
    if (!name) throw error(400, "Clinic name is required");
    if (!phone) throw error(400, "Clinic phone number is required");
    const clinic = insert("Clinic", {
      name: String(name).trim(),
      ...(address && { address }),
      phone,
      isActive: true,
      __v: 0,
    });
    return created({ clinic }, "Clinic created successfully");
  });

  r.patch("/clinics/:id", (req) => {
    staff(req, "clinics", "edit");
    const clinic = findById("Clinic", req.params.id);
    if (!clinic) throw error(404, "Clinic not found");
    const patch = {};
    for (const field of ["name", "address", "phone", "appointmentSettings", "isActive"]) {
      if (req.body?.[field] !== undefined) patch[field] = req.body[field];
    }
    update("Clinic", clinic._id, patch);
    return ok({ clinic }, "Clinic updated successfully");
  });

  r.delete("/clinics/:id", (req) => {
    staff(req, "clinics", "delete");
    const clinic = findById("Clinic", req.params.id);
    if (!clinic) throw error(404, "Clinic not found");
    update("Clinic", clinic._id, { isActive: false });
    return ok(null, "Clinic deactivated successfully");
  });

  r.delete("/clinics/:id/permanent", (req) => {
    staff(req, "clinics", "delete");
    const clinic = findById("Clinic", req.params.id);
    if (!clinic) throw error(404, "Clinic not found");
    remove("Clinic", clinic._id);
    return ok(null, "Clinic deleted permanently");
  });
}

/**
 * Permission matrix. Ports src/modules/permissions/permission.controller.js.
 */
import { insert, update } from "../core/db.js";
import { DemoError, ok } from "../core/http.js";
import { requireUser } from "../core/auth.js";
import { findWhere, sortBy, where } from "../core/query.js";
import { staffWithRole } from "../lib/access-common.js";

export default function register(r) {
  // Every staff role (blog_editor included) needs its own rows for the sidebar.
  r.get("/permissions/mine", (req) => {
    const user = requireUser(req);
    const permissions = sortBy(where("Permission", { role: user.role }), "module");
    return ok({ role: user.role, permissions }, "Your permissions fetched successfully");
  });

  r.get("/permissions", (req) => {
    staffWithRole(req, "admin");
    const permissions = sortBy(where("Permission", {}), "role module");
    return ok({ permissions }, "Permission matrix fetched successfully");
  });

  r.patch("/permissions/:role/:module", (req) => {
    staffWithRole(req, "admin");
    const { role, module } = req.params;
    const { view, create, edit, delete: del } = req.body || {};
    const set = {};
    if (view !== undefined) set.view = !!view;
    if (create !== undefined) set.create = !!create;
    if (edit !== undefined) set.edit = !!edit;
    if (del !== undefined) set.delete = !!del;
    if (Object.keys(set).length === 0) {
      throw new DemoError(400, "At least one of view/create/edit/delete is required");
    }
    const existing = findWhere("Permission", { role, module });
    const permission = existing
      ? update("Permission", existing._id, set)
      : insert("Permission", { role, module, view: false, create: false, edit: false, delete: false, __v: 0, ...set });
    return ok({ permission }, "Permission updated successfully");
  });
}

import api from "../axios";

/**
 * Admin Permissions API
 * Backend: /api/permissions
 */

/** Current user's own role's permission rows -- any authenticated staff user. */
export const getMyPermissions = () =>
  api.get("/permissions/mine").then((res) => res.data);

/** Full matrix -- admin-only. */
export const getAllPermissions = () =>
  api.get("/permissions").then((res) => res.data);

/** Update one role+module's action flags -- admin-only. */
export const updatePermission = (role, module, data) =>
  api.patch(`/permissions/${role}/${module}`, data).then((res) => res.data);

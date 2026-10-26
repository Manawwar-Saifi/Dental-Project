/**
 * Staff users. Ports src/modules/users/user.controller.js.
 */
import { all, findById, insert, remove, update } from "../core/db.js";
import { DemoError, created, ok, paginated } from "../core/http.js";
import { requireUser } from "../core/auth.js";
import { escapeRegex, findWhere, paginate, pick, sortBy, where } from "../core/query.js";
import { cleanUser, hasPermission, isObjectId, passwordMatches, setPassword, staff } from "../lib/access-common.js";

const error = (status, message) => new DemoError(status, message);

const userOut = (user) => cleanUser(user);

export default function register(r) {
  // blogs.view permission; reachable by blog_editor (exempt from the lockdown).
  r.get("/users/blog-authors", (req) => {
    const user = requireUser(req);
    if (!hasPermission(user.role, "blogs", "view")) {
      throw error(403, "No view permission for blogs");
    }
    const authors = sortBy(
      where("User", { role: { $in: ["admin", "blog_editor", "clinic_manager"] }, isActive: true }),
      "name",
    ).map((u) => pick(u, "_id name email"));
    return ok({ authors }, "Blog authors fetched successfully");
  });

  r.get("/users", (req) => {
    staff(req);
    const { search, isActive } = req.query;
    const query = {};
    if (isActive !== undefined) query.isActive = isActive === "true";
    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      query.$or = [{ name: regex }, { email: regex }, { phone: regex }];
    }
    const list = sortBy(where("User", query), "-createdAt");
    const page = paginate(list, req.query, 10);
    return paginated(page.items.map(userOut), page);
  });

  r.get("/users/me", (req) => {
    const user = staff(req);
    return ok({ user: userOut(user) }, "Profile fetched successfully");
  });

  r.patch("/users/me", (req) => {
    const user = staff(req);
    const { name, email, phone } = req.body || {};
    if (email && email !== user.email) {
      const taken = all("User").some((u) => u.email === email.toLowerCase() && String(u._id) !== String(user._id));
      if (taken) throw error(400, "Email is already in use");
      user.email = email.toLowerCase();
    }
    if (phone && phone !== user.phone) {
      const taken = all("User").some((u) => u.phone === phone && String(u._id) !== String(user._id));
      if (taken) throw error(400, "Phone number is already in use");
      user.phone = phone;
    }
    if (name) user.name = name;
    update("User", user._id, {});
    return ok({ user: userOut(user) }, "Profile updated successfully");
  });

  r.patch("/users/me/password", (req) => {
    const user = staff(req);
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) throw error(400, "Please provide current and new password");
    if (newPassword.length < 6) throw error(400, "New password must be at least 6 characters");
    if (!passwordMatches("User", user._id, currentPassword)) throw error(401, "Current password is incorrect");
    setPassword("User", user._id, newPassword);
    return ok(null, "Password changed successfully");
  });

  r.get("/users/:id", (req) => {
    staff(req);
    const user = findById("User", req.params.id);
    if (!user) throw error(404, "User not found");
    return ok({ user: userOut(user) }, "User fetched successfully");
  });

  r.post("/users", (req) => {
    staff(req, "staff", "create");
    const { name, email, phone, password, role } = req.body || {};
    if (!name || !email || !phone || !password) {
      throw error(400, "Please provide name, email, phone, and password");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw error(400, "Please provide a valid email address");
    if (!/^[6-9]\d{9}$/.test(phone)) throw error(400, "Please provide a valid 10-digit phone number");
    if (String(password).length < 6) throw error(400, "Password must be at least 6 characters");
    if (findWhere("User", { email: email.toLowerCase() })) throw error(400, "Email is already registered");
    if (findWhere("User", { phone })) throw error(400, "Phone number is already registered");

    const user = insert("User", {
      name,
      email: email.toLowerCase(),
      phone,
      role: role || "admin",
      isActive: true,
      notificationPreferences: {
        email: { appointments: true, payments: true, systemAlerts: true },
        sms: { appointments: false, payments: false, systemAlerts: false },
      },
      __v: 0,
    });
    setPassword("User", user._id, password);
    return created({ user: userOut(user) }, "User created successfully");
  });

  r.patch("/users/:id", (req) => {
    staff(req, "staff", "edit");
    const { id } = req.params;
    const { name, email, phone, isActive, role } = req.body || {};
    const user = findById("User", id);
    if (!user) throw error(404, "User not found");

    if (email && email.toLowerCase() !== user.email) {
      const taken = all("User").some((u) => u.email === email.toLowerCase() && String(u._id) !== String(id));
      if (taken) throw error(400, "Email is already in use");
      user.email = email.toLowerCase();
    }
    if (phone && phone !== user.phone) {
      const taken = all("User").some((u) => u.phone === phone && String(u._id) !== String(id));
      if (taken) throw error(400, "Phone number is already in use");
      user.phone = phone;
    }
    if (name !== undefined) user.name = name;
    if (isActive !== undefined) user.isActive = isActive;
    if (role !== undefined) user.role = role;
    if (req.body?.password) setPassword("User", user._id, req.body.password);
    update("User", id, {});
    return ok({ user: userOut(user) }, "User updated successfully");
  });

  r.patch("/users/:id/reactivate", (req) => {
    staff(req, "staff", "edit");
    const user = findById("User", req.params.id);
    if (!user) throw error(404, "User not found");
    update("User", user._id, { isActive: true });
    return ok({ user: userOut(user) }, "User reactivated successfully");
  });

  r.delete("/users/:id", (req) => {
    const me = staff(req, "staff", "delete");
    const user = findById("User", req.params.id);
    if (!user) throw error(404, "User not found");
    if (String(me._id) === String(req.params.id)) throw error(400, "You cannot delete your own account");
    update("User", user._id, { isActive: false });
    return ok(null, "User deactivated successfully");
  });

  r.delete("/users/:id/permanent", (req) => {
    const me = staff(req, "staff", "delete");
    const { id } = req.params;
    if (!isObjectId(id)) throw error(400, "Invalid user ID");
    if (String(me._id) === String(id)) throw error(400, "You cannot permanently delete your own account");
    if (!findById("User", id)) throw error(404, "User not found");
    remove("User", id);
    return ok(null, "User deleted permanently");
  });
}

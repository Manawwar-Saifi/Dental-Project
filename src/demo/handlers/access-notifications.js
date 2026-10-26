/**
 * Notifications (staff + patient inboxes, admin views, manual sends).
 * Ports src/modules/notifications/notification.controller.js.
 *
 * Staff vs patient is decided by the token type (anyAuth): a staff token reads
 * recipientModel "User" rows for that user, a patient token "Patient" rows.
 */
import { all, findById, remove, nowIso } from "../core/db.js";
import { DemoError, created, ok, paginated } from "../core/http.js";
import { asId, count, paginate, populate, sortBy, where } from "../core/query.js";
import {
  anyAuth,
  createNotification,
  isObjectId,
  istRange,
  markProcessed,
  populateRecipient,
  staff,
} from "../lib/access-common.js";

const error = (status, message) => new DemoError(status, message);

function ownedBy(auth, notification) {
  return (
    notification.recipientModel === auth.recipientModel &&
    asId(notification.recipient) === auth.recipientId
  );
}

function loadOwned(req) {
  const auth = anyAuth(req);
  const { id } = req.params;
  if (!isObjectId(id)) throw error(400, "Invalid notification ID");
  const notification = findById("Notification", id);
  if (!notification) throw error(404, "Notification not found");
  if (!ownedBy(auth, notification)) throw error(403, "Access denied");
  return notification;
}

const listPopulate = (n) => {
  let out = populate(n, "appointment", "Appointment", "date timeSlot");
  out = populate(out, "invoice", "Invoice", "invoiceNumber grandTotal");
  out = populate(out, "treatment", "Treatment", "treatmentNumber");
  return out;
};

export default function register(r) {
  // ------------------------------------------------------------ admin views
  r.get("/notifications/admin/all", (req) => {
    staff(req);
    const { type, recipientType, from, to } = req.query;
    const query = {};
    if (type) query.type = type;
    if (recipientType) query.recipientType = recipientType;
    if (from || to) query.createdAt = istRange(from, to);

    const list = sortBy(where("Notification", query), "-createdAt");
    const page = paginate(list, req.query, 20);
    const items = page.items.map((n) =>
      populate(populateRecipient(n, "name phone email"), "createdBy", "User", "name"),
    );
    return paginated(items, page);
  });

  r.get("/notifications/admin/stats", (req) => {
    staff(req);
    const { from, to } = req.query;
    const range = istRange(from, to);
    const startDate = range.$gte || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = range.$lte || new Date();

    const inRange = where("Notification", { createdAt: { $gte: startDate, $lte: endDate } });
    const groups = new Map();
    for (const n of inRange) {
      const g = groups.get(n.type) || { _id: n.type, total: 0, read: 0, smsSent: 0, emailSent: 0 };
      g.total += 1;
      if (n.isRead) g.read += 1;
      if (n.smsStatus?.sent) g.smsSent += 1;
      if (n.emailStatus?.sent) g.emailSent += 1;
      groups.set(n.type, g);
    }
    const byType = [...groups.values()];
    const stats = {
      total: byType.reduce((s, x) => s + x.total, 0),
      read: byType.reduce((s, x) => s + x.read, 0),
      smsSent: byType.reduce((s, x) => s + x.smsSent, 0),
      emailSent: byType.reduce((s, x) => s + x.emailSent, 0),
      byType,
    };
    return ok({ stats, dateRange: { from: startDate, to: endDate } }, "Notification statistics fetched successfully");
  });

  r.post("/notifications/send", (req) => {
    const user = staff(req, "notifications", "create");
    const b = req.body || {};
    if (!b.recipientType || !b.type || !b.title || !b.message) {
      throw error(400, "Recipient type, notification type, title and message are required");
    }
    let recipientModel;
    if (b.recipientType === "patient") {
      recipientModel = "Patient";
      if (b.recipientId && !findById("Patient", b.recipientId)) throw error(404, "Patient not found");
    } else if (b.recipientType === "user") {
      recipientModel = "User";
      if (b.recipientId && !findById("User", b.recipientId)) throw error(404, "User not found");
    }
    const notification = createNotification({
      title: b.title,
      message: b.message,
      type: b.type,
      priority: b.priority || "normal",
      recipientType: b.recipientType,
      recipient: b.recipientId,
      recipientModel,
      sendSms: b.sendSms || false,
      sendEmail: b.sendEmail || false,
      sendWhatsapp: b.sendWhatsapp || false,
      showInApp: b.showInApp !== false,
      scheduledFor: b.scheduledFor ? new Date(b.scheduledFor).toISOString() : null,
      appointment: b.appointment,
      invoice: b.invoice,
      treatment: b.treatment,
      metadata: b.metadata,
      createdBy: String(user._id),
    });
    if (!b.scheduledFor) markProcessed(notification);
    return created({ notification }, "Notification sent successfully");
  });

  r.post("/notifications/send-bulk", (req) => {
    const user = staff(req, "notifications", "create");
    const b = req.body || {};
    if (!b.recipientType || !b.type || !b.title || !b.message) {
      throw error(400, "Recipient type, notification type, title and message are required");
    }
    let recipients;
    let recipientModel;
    if (b.recipientType === "all_patients") {
      recipients = where("Patient", { isActive: true }).map((p) => p._id);
      recipientModel = "Patient";
    } else if (b.recipientType === "all_users") {
      recipients = where("User", { isActive: true }).map((u) => u._id);
      recipientModel = "User";
    } else if (b.recipientType === "selected" && Array.isArray(b.recipientIds) && b.recipientIds.length > 0) {
      recipients = b.recipientIds.map(String);
      recipientModel = b.recipientModel || "Patient";
    } else {
      throw error(400, "Invalid recipient type or no recipients selected");
    }
    const recipientType =
      b.recipientType === "all_patients" ? "patient" : b.recipientType === "all_users" ? "user" : "patient";
    const notifications = recipients.map((id) =>
      markProcessed(
        createNotification({
          title: b.title,
          message: b.message,
          type: b.type,
          priority: b.priority || "normal",
          recipientType,
          recipient: String(id),
          recipientModel,
          sendSms: b.sendSms || false,
          sendEmail: b.sendEmail || false,
          sendWhatsapp: b.sendWhatsapp || false,
          showInApp: b.showInApp !== false,
          createdBy: String(user._id),
        }),
      ),
    );
    return ok(
      { sentCount: notifications.length, notifications: notifications.slice(0, 5) },
      `${notifications.length} notifications sent successfully`,
    );
  });

  r.post("/notifications/reminder/appointment", (req) => {
    staff(req, "notifications", "create");
    const { appointmentId, patientId } = req.body || {};
    if (!appointmentId || !patientId) throw error(400, "Appointment ID and Patient ID are required");
    const appointment = findById("Appointment", appointmentId);
    if (!appointment) throw error(404, "Appointment not found");
    const patient = findById("Patient", patientId);
    if (!patient) throw error(404, "Patient not found");
    const notification = markProcessed(
      createNotification({
        title: "Appointment Reminder",
        message: `Your appointment is scheduled for ${new Date(appointment.date).toLocaleDateString()} at ${appointment.timeSlot}. Please arrive 10 minutes early.`,
        type: "appointment_reminder",
        recipientType: "patient",
        recipient: String(patient._id),
        recipientModel: "Patient",
        sendSms: true,
        sendWhatsapp: true,
        showInApp: true,
        appointment: String(appointment._id),
        priority: "high",
      }),
    );
    return created({ notification }, "Appointment reminder sent successfully");
  });

  r.post("/notifications/reminder/payment", (req) => {
    staff(req, "notifications", "create");
    const { invoiceId, patientId } = req.body || {};
    if (!invoiceId || !patientId) throw error(400, "Invoice ID and Patient ID are required");
    const invoice = findById("Invoice", invoiceId);
    if (!invoice) throw error(404, "Invoice not found");
    const patient = findById("Patient", asId(patientId));
    if (!patient) throw error(404, "Patient not found");
    const notification = markProcessed(
      createNotification({
        title: "Payment Reminder",
        message: `You have a pending payment of ₹${invoice.balanceDue} for invoice ${invoice.invoiceNumber}. Please make the payment at your earliest convenience.`,
        type: "payment_reminder",
        recipientType: "patient",
        recipient: String(patient._id),
        recipientModel: "Patient",
        sendSms: true,
        showInApp: true,
        invoice: String(invoice._id),
        priority: "normal",
      }),
    );
    return created({ notification }, "Payment reminder sent successfully");
  });

  // ------------------------------------------------------------ own inbox
  r.get("/notifications", (req) => {
    const auth = anyAuth(req);
    const { read, type } = req.query;
    const query = { recipient: auth.recipientId, recipientModel: auth.recipientModel, showInApp: true };
    if (read !== undefined) query.isRead = read === "true";
    if (type) query.type = type;
    const list = sortBy(where("Notification", query), "-createdAt");
    const page = paginate(list, req.query, 20);
    return paginated(page.items.map(listPopulate), page);
  });

  r.get("/notifications/unread-count", (req) => {
    const auth = anyAuth(req);
    const n = count("Notification", {
      recipient: auth.recipientId,
      recipientModel: auth.recipientModel,
      isRead: false,
      showInApp: true,
    });
    return ok({ count: n }, "Unread count fetched successfully");
  });

  r.get("/notifications/unread", (req) => {
    const auth = anyAuth(req);
    const notifications = sortBy(
      where("Notification", {
        recipient: auth.recipientId,
        recipientModel: auth.recipientModel,
        isRead: false,
        showInApp: true,
      }),
      "-createdAt",
    );
    return ok({ notifications }, "Unread notifications fetched successfully");
  });

  r.patch("/notifications/mark-all-read", (req) => {
    const auth = anyAuth(req);
    const now = nowIso();
    let modifiedCount = 0;
    for (const n of all("Notification")) {
      if (n.recipientModel === auth.recipientModel && asId(n.recipient) === auth.recipientId && !n.isRead) {
        n.isRead = true;
        n.readAt = now;
        n.updatedAt = now;
        modifiedCount += 1;
      }
    }
    return ok({ modifiedCount }, "All notifications marked as read");
  });

  r.get("/notifications/:id", (req) => {
    const notification = loadOwned(req);
    let out = populate(notification, "appointment", "Appointment");
    out = populate(out, "invoice", "Invoice");
    out = populate(out, "treatment", "Treatment");
    out = populate(out, "createdBy", "User", "name");
    return ok({ notification: out }, "Notification fetched successfully");
  });

  r.patch("/notifications/:id/read", (req) => {
    const notification = loadOwned(req);
    notification.isRead = true;
    notification.readAt = nowIso();
    notification.updatedAt = nowIso();
    return ok({ notification }, "Notification marked as read");
  });

  r.patch("/notifications/:id/unread", (req) => {
    const notification = loadOwned(req);
    notification.isRead = false;
    notification.readAt = null;
    notification.updatedAt = nowIso();
    return ok({ notification }, "Notification marked as unread");
  });

  r.delete("/notifications/:id", (req) => {
    const notification = loadOwned(req);
    remove("Notification", notification._id);
    return ok(null, "Notification deleted successfully");
  });
}

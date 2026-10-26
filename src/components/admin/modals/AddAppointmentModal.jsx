/**
 * Add Appointment Modal
 *
 * Form modal to create a new appointment.
 * Fields reordered to Date/Time/Type/Reason single row for tablet admin UX — 2026-07-03
 */
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  MenuItem,
  IconButton,
  CircularProgress,
  Autocomplete,
  Checkbox,
  FormControlLabel,
  Switch,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
  Divider,
  Chip,
  Paper,
} from "@mui/material";
import { toast } from "react-toastify";
import Grid from "@mui/material/Grid";
import CloseIcon from "@mui/icons-material/Close";
import EventIcon from "@mui/icons-material/Event";
import AddIcon from "@mui/icons-material/Add";
import DownloadIcon from "@mui/icons-material/Download";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import AppointmentSlipPreviewModal from "../../AppointmentSlipPreviewModal";
import { useAppointmentMutations, useAppointments } from "../../../hooks/admin/useAppointments";
import { usePatientActiveContext } from "../../../hooks/admin/usePatients";
import { useAdminPaymentMutations } from "../../../hooks/admin/usePayments";
import { searchPatients, createPatient } from "../../../api/admin/patients.api";
import { getClinics } from "../../../api/admin/clinics.api";
import { getFeeSettings } from "../../../api/admin/settings.api";
import { getAvailableSlots } from "../../../api/admin/appointments.api";
import {
  MAX_DATE,
  todayStr,
  dateGuards,
  isPastSlotForDate,
} from "../../../utils/dateInput";
import { generateTimeSlots } from "../../../utils/timeSlots";
import StyledTextField from "../shared/StyledTextField";
import PaymentMethodSelector from "../shared/PaymentMethodSelector";
import PaymentLinkDisplay from "../shared/PaymentLinkDisplay";
import { TREATMENT_NAME_OPTIONS, TREATMENT_NAME_OTHER } from "../../../constants/treatmentNames";

// Admin (this modal only) may backdate a walk-in entry up to this many days.
// The shared dateInput.js util stays today-forward for every other picker,
// including the patient-facing booking form -- this override is local.
const MIN_BACKDATE_DAYS = 10;
const minBackdateStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - MIN_BACKDATE_DAYS);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const isBeyondBackdateWindow = (value) => !!value && value < minBackdateStr();
/**
 * Appointment type options
 */
// Consolidated with the old separate "Urgency" radio group -- selecting
// "Emergency" here also drives appointmentType (the field the emergency
// slot-capacity check, 2 regular/3 emergency per day, actually reads).
// `type`'s enum already supports "emergency" on the backend, so both
// fields stay in sync with zero backend changes needed.
const typeOptions = [
  { value: "regular", label: "Regular" },
  { value: "emergency", label: "Emergency" },
];

/**
 * Treatment line-item category options — same underlying itemType enum as
 * CreateInvoiceModal, minus OPD Fee/Membership (not relevant to a treatment
 * booking's line items) and with Treatment included (the default here).
 */
const treatmentItemTypeOptions = [
  { value: "treatment", label: "Treatment" },
  { value: "surgery", label: "Surgery" },
  { value: "test", label: "Test" },
  { value: "medicine", label: "Medicine" },
  { value: "other", label: "Other" },
];

/**
 * Source options
 */
const sourceOptions = [
  { value: "walk_in", label: "Walk-in" },
  { value: "phone", label: "Phone" },
  { value: "online", label: "Online" },
  { value: "app", label: "App" },
];

/**
 * Time slots — admin can book up to 10 PM (doctor works late evenings)
 */
const timeSlots = generateTimeSlots("09:00", "22:00");

const formatCurrency = (val) => `₹${(Number(val) || 0).toLocaleString("en-IN")}`;

// Factory so every reset gets today's date fresh (not the module-load date).
const getInitialFormState = () => ({
  patient: null,
  clinic: null,
  date: todayStr(),
  timeSlot: "",
  type: "regular",
  appointmentType: "regular", // urgency: "regular" | "emergency"
  reason: "",
  source: "walk_in",
  notes: "",
  opdFee: 300,
  isFree: false,
  // Visit type & treatment fields
  visitType: "opd", // "opd" | "treatment" | "treatment_session"
  treatmentName: "",
  fee: "",
  treatmentItems: [{ description: "", unitPrice: "", itemType: "treatment" }], // multi-line-item fee breakdown (treatment path only)
  treatmentDiscountPercent: 0, // single % discount on the treatmentItems total
  parentAppointment: null,
  sessionNumber: null,
  sessionsPlanned: null,
  treatmentPaymentAmount: null, // partial advance for treatment bookings (null = full fee)
  // Session payment (Fix 5)
  collectSessionPayment: false,
  sessionPaymentAmount: 0,
  sessionPaymentMode: "cash",
  selectedTreatmentInvoiceId: null,
  selectedTreatmentInvoiceBalance: 0,
  originatingOpdAppointment: null, // optional link to a prior OPD visit (treatment mode only)
});

const AddAppointmentModal = ({ open, onClose, onSuccess, prefillData = null, initialVisitType = null }) => {
  const [formData, setFormData] = useState(getInitialFormState());
  const [patientSearch, setPatientSearch] = useState("");
  const [patientOptions, setPatientOptions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [clinicLoading, setClinicLoading] = useState(false);
  const [clinics, setClinics] = useState([]);
  const [feeSettings, setFeeSettings] = useState({
    opdFeeRegular: 300,
    opdFeeEmergency: 500,
    consultationFee: 500,
  });
  const [, setFeeLoading] = useState(false);
  // null = not fetched yet (no clinic+date); otherwise array of open "HH:MM" slots
  const [availableSlots, setAvailableSlots] = useState(null);
  // "Other" treatment popup dialog state.
  // Replaces the old treatmentNameMode + inline-field approach, which was
  // intermittently broken because treatmentNameToChoice("") returned the
  // TREATMENT_NAME_OTHER sentinel, making the Select appear to show "Other"
  // selected on fresh open while the inline field stayed hidden (treatmentNameMode
  // was null), with no way to open it (MUI Select won't fire onChange for the
  // already-selected value).
  const [otherTreatmentDialogOpen, setOtherTreatmentDialogOpen] = useState(false);
  const [otherTreatmentInput, setOtherTreatmentInput] = useState(""); // dialog text-field working copy
  const [previousTreatment, setPreviousTreatment] = useState(""); // formData.treatmentName before clicking "Other"
  const [customTreatmentName, setCustomTreatmentName] = useState(""); // saved custom name (from dialog Save)
  const { createAppointment, isCreating } = useAppointmentMutations();
  const { collectPayment: collectPaymentMutation } = useAdminPaymentMutations();

  // Appointment data after successful booking (drives success banner + slip download)
  const [bookedAppointment, setBookedAppointment] = useState(null);

  // FIX 1: Add patient popup state
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [newPatient, setNewPatient] = useState({ name: "", phone: "", email: "", age: "", gender: "" });
  const [addingPatient, setAddingPatient] = useState(false);

  // FIX 3: Payment method state
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [feeCollected, setFeeCollected] = useState(false);
  const [slipPreviewOpen, setSlipPreviewOpen] = useState(false);

  // Active treatment context — fires when a patient is selected
  const patientId = formData.patient?._id;
  const { data: contextData } = usePatientActiveContext(patientId);
  const activeTreatments = contextData?.data?.activeTreatments || [];

  // Recent OPD visits for this patient — powers the optional "Link to a
  // previous OPD visit" dropdown in treatment mode. Filters by the exact
  // `patient` ObjectId (backend query param), not a phone-search regex --
  // an exact match eliminates any risk of a fuzzy/substring match pulling
  // in another patient's OPD visits. queryKey includes patientId, so the
  // query correctly refetches/clears whenever the selected patient changes,
  // never lingering with a previous patient's stale results.
  const isTreatmentMode = formData.visitType === "treatment";
  const canFetchOpdHistory = isTreatmentMode && !!patientId;
  const { data: opdHistoryData } = useAppointments(
    { visitType: "opd", patient: patientId || "", limit: 25 },
    { enabled: canFetchOpdHistory }
  );
  const patientOpdAppointments = canFetchOpdHistory
    ? (opdHistoryData?.data || []).filter((a) => a.patient?._id === patientId)
    : [];

  // Active-membership discount for the selected patient (server re-verifies it).
  const membership = formData.patient?.membership;
  const isActiveMember =
    membership?.status === "active" &&
    (!membership.expiryDate || new Date(membership.expiryDate) > new Date());
  const discountPercent = isActiveMember ? membership.discountPercent || 0 : 0;

  // Treatment line items — sum, manual discount %, and post-discount total.
  const treatmentSubtotal = formData.treatmentItems.reduce(
    (sum, item) => sum + (Number(item.unitPrice) || 0),
    0,
  );
  const treatmentDiscountAmount = Math.round(
    (treatmentSubtotal * (Number(formData.treatmentDiscountPercent) || 0)) / 100,
  );
  const treatmentTotal = Math.max(0, treatmentSubtotal - treatmentDiscountAmount);

  // Effective value for the Treatment Name Select.  A controlled MUI Select
  // must always hold a value that matches one of its <MenuItem> values.
  // "" → shows "Select a treatment" placeholder (displayEmpty + renderValue).
  // TREATMENT_NAME_OTHER → "Other (custom name)" item is highlighted; when
  //   customTreatmentName is set, renderValue replaces it with that name.
  // anything else → standard preset matched by value.
  const selectTreatmentValue =
    TREATMENT_NAME_OPTIONS.includes(formData.treatmentName)
      ? formData.treatmentName
      : customTreatmentName
      ? TREATMENT_NAME_OTHER
      : "";

  const addTreatmentItem = () =>
    setFormData((prev) => ({
      ...prev,
      treatmentItems: [...prev.treatmentItems, { description: "", unitPrice: "", itemType: "treatment" }],
    }));

  const removeTreatmentItem = (index) => {
    if (formData.treatmentItems.length <= 1) {
      toast.error("At least one item is required");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      treatmentItems: prev.treatmentItems.filter((_, i) => i !== index),
    }));
  };

  const updateTreatmentItem = (index, field, value) =>
    setFormData((prev) => ({
      ...prev,
      treatmentItems: prev.treatmentItems.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    }));

  // Effective base fee for this visit (before membership discount).
  const isSessionMode = formData.visitType === "treatment_session";
  const baseFee = formData.isFree || isSessionMode
    ? 0
    : formData.visitType === "treatment"
    ? treatmentTotal
    : Number(formData.opdFee) || 0;
  const discountedFee =
    discountPercent > 0 ? Math.max(0, Math.round(baseFee * (1 - discountPercent / 100))) : baseFee;

  // Derived OPD default (feeSettings x urgency) — used to pre-fill the editable
  // fee field and to detect when a manual override differs from it.
  const derivedOpdDefault =
    formData.appointmentType === "emergency" ? feeSettings.opdFeeEmergency : feeSettings.opdFeeRegular;
  const opdFeeDiffersFromDefault =
    formData.visitType === "opd" &&
    !formData.isFree &&
    Number(formData.opdFee) !== Number(derivedOpdDefault);

  // Reset (or prefill from a Clone Treatment / Book Next Session action)
  // whenever the modal opens. Cloning only copies the WHAT/WHO (treatment
  // name/items/sessions/patient) — date, time, and payment are always left
  // blank for the admin to set fresh. `initialVisitType` is a lighter-weight
  // default (e.g. from the active Appointments/Treatments tab) that only sets
  // the starting Visit Type — it does NOT show the "Cloned from…" banner and
  // is ignored whenever prefillData is also provided.
  useEffect(() => {
    if (open && prefillData) {
      setFormData({ ...getInitialFormState(), ...prefillData });
    } else if (open && initialVisitType) {
      setFormData({ ...getInitialFormState(), visitType: initialVisitType });
    } else if (open) {
      setFormData(getInitialFormState());
    }
    // bookedAppointment (the success-screen data) was previously ONLY
    // cleared in handleClose -- any reopen path that doesn't go through it
    // (e.g. Book Next Session / Clone Treatment re-triggering this same
    // modal instance while a PRIOR booking's success screen was still
    // showing, since the parent's prefillData/open props change without an
    // explicit close in between) left the old confirmation displayed while
    // the new booking's form silently loaded underneath it -- matching the
    // "confirmation lags by one booking" symptom. Reset it in lockstep with
    // formData on every open, not just on explicit close.
    if (open) setBookedAppointment(null);
    // Reset "Other" treatment popup state on every open. Also handle the
    // prefill case: if the incoming treatmentName is a custom (non-preset)
    // name, restore customTreatmentName so renderValue can display it.
    if (open) {
      setOtherTreatmentDialogOpen(false);
      setOtherTreatmentInput("");
      setPreviousTreatment("");
      const incomingName = prefillData?.treatmentName || "";
      setCustomTreatmentName(
        incomingName && !TREATMENT_NAME_OPTIONS.includes(incomingName)
          ? incomingName
          : "",
      );
    }
  }, [open, prefillData, initialVisitType]);

  // Fetch slot availability whenever clinic + date are both chosen, so full and
  // past slots can be disabled in the dropdown.
  useEffect(() => {
    const clinicId = formData.clinic?._id;
    if (!open || !clinicId || !formData.date) {
      setAvailableSlots(null);
      return;
    }
    let active = true;
    getAvailableSlots(clinicId, formData.date)
      .then((res) => {
        if (!active) return;
        const slots = res?.data?.availableSlots || [];
        setAvailableSlots(slots);
        // Clear the selected slot if it is no longer available
        setFormData((prev) =>
          prev.timeSlot && !slots.includes(prev.timeSlot)
            ? { ...prev, timeSlot: "" }
            : prev,
        );
      })
      .catch(() => {
        if (active) setAvailableSlots([]);
      });
    return () => {
      active = false;
    };
  }, [open, formData.clinic, formData.date]);

  // Fetch clinics and fee settings when modal opens
  useEffect(() => {
    if (!open) return;

    const fetchClinics = async () => {
      setClinicLoading(true);
      try {
        const res = await getClinics();
        console.log("CLINICS 👉", res.data);
        setClinics(res.data);
      } catch (err) {
        console.error("Failed to fetch clinics", err);
        setClinics([]);
      } finally {
        setClinicLoading(false);
      }
    };

    const fetchFeeSettings = async () => {
      setFeeLoading(true);
      try {
        const res = await getFeeSettings();
        if (res.data?.fees) {
          setFeeSettings(res.data.fees);
          // Set initial OPD fee based on settings
          setFormData((prev) => ({
            ...prev,
            opdFee: res.data.fees.opdFeeRegular,
          }));
        }
      } catch (err) {
        console.error("Failed to fetch fee settings", err);
      } finally {
        setFeeLoading(false);
      }
    };

    fetchClinics();
    fetchFeeSettings();
  }, [open]);

  // FIX 2: Auto-select Delhi Road clinic once the list loads
  useEffect(() => {
    if (clinics.length > 0 && !formData.clinic) {
      const defaultClinic = clinics.find(
        (c) =>
          c.name?.toLowerCase().includes("delhi road") ||
          c.name?.toLowerCase().includes("delhi"),
      );
      if (defaultClinic) setFormData((prev) => ({ ...prev, clinic: defaultClinic }));
    }
  }, [clinics]);

  // Update OPD fee when urgency (regular/emergency) changes
  useEffect(() => {
    if (formData.isFree) return; // Don't change if marked as free

    const newFee = formData.appointmentType === "emergency"
      ? feeSettings.opdFeeEmergency
      : feeSettings.opdFeeRegular;

    setFormData((prev) => ({
      ...prev,
      opdFee: newFee,
    }));
  }, [formData.appointmentType, feeSettings, formData.isFree]);

  // Membership auto-free: active membership + OPD → automatically set free,
  // and reset back when the patient/visit no longer qualifies (e.g. admin
  // switches to a non-member patient while still on OPD) — otherwise isFree
  // stays stuck at true and the visit never gets charged (revenue leak).
  // formData.isFree is read directly (not in the dep array) so this only acts
  // on an actual patient/visitType transition, not on every render — that way
  // a manual Free-toggle override for a non-member is left alone.
  useEffect(() => {
    if (!open) return;
    const m = formData.patient?.membership;
    const isMember =
      m?.status === "active" && (!m.expiryDate || new Date(m.expiryDate) > new Date());
    const shouldBeFree = isMember && formData.visitType === "opd";

    if (formData.isFree === shouldBeFree) return;

    if (shouldBeFree) {
      setFormData((prev) => ({ ...prev, isFree: true, opdFee: 0 }));
      setPaymentMethod("free");
    } else {
      const defaultFee =
        formData.appointmentType === "emergency" ? feeSettings.opdFeeEmergency : feeSettings.opdFeeRegular;
      setFormData((prev) => ({
        ...prev,
        isFree: false,
        opdFee: prev.visitType === "opd" ? defaultFee : prev.opdFee,
      }));
      setPaymentMethod("cash");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.patient, formData.visitType, open]);

  /**
   * Search patients
   */
  const handlePatientSearch = async (query) => {
    if (!query || query.length < 2) {
      setPatientOptions([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await searchPatients(query);
      setPatientOptions(response.data?.patients || []);
    } catch (error) {
      console.error("Patient search failed:", error);
      setPatientOptions([]);
    } finally {
      setSearchLoading(false);
    }
  };

  /**
   * One-click: configure formData for a treatment session booking
   */
  const handleContinueTreatment = (treatment) => {
    setFormData((prev) => ({
      ...prev,
      visitType: "treatment_session",
      parentAppointment: treatment.parentAppointmentId,
      sessionNumber: treatment.nextSessionNumber,
      treatmentName: treatment.treatmentName,
      fee: 0,
      isFree: true,
      opdFeePaid: false,
      opdFee: 0,
      reason: `Session ${treatment.nextSessionNumber} — ${treatment.treatmentName}`,
      collectSessionPayment: false,
      sessionPaymentAmount: treatment.suggestedPaymentPerSession || 0,
      sessionPaymentMode: "cash",
      selectedTreatmentInvoiceId: treatment.invoice?._id || null,
      selectedTreatmentInvoiceBalance: treatment.invoice?.balanceDue || 0,
    }));
    setPaymentMethod("cash");
    setFeeCollected(false);
  };

  /**
   * Exit session mode and reset to standard booking flow
   */
  const handleCancelSessionMode = () => {
    setFormData((prev) => ({
      ...prev,
      visitType: "opd",
      parentAppointment: null,
      sessionNumber: null,
      sessionsPlanned: null,
      treatmentName: "",
      fee: "",
      treatmentPaymentAmount: null,
      isFree: false,
      opdFee: feeSettings.opdFeeRegular,
      reason: "",
      collectSessionPayment: false,
      sessionPaymentAmount: 0,
      sessionPaymentMode: "cash",
      selectedTreatmentInvoiceId: null,
      selectedTreatmentInvoiceBalance: 0,
    }));
    setCustomTreatmentName("");
  };

  /**
   * Handle input change
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Date field: admin may backdate up to MIN_BACKDATE_DAYS (walk-in logged
  // late); anything further back is rejected same as before.
  const handleDateChange = (e) => {
    const value = e.target.value;
    if (isBeyondBackdateWindow(value)) {
      setErrors((prev) => ({
        ...prev,
        date: `Cannot backdate more than ${MIN_BACKDATE_DAYS} days`,
      }));
      setFormData((prev) => ({ ...prev, date: todayStr(), timeSlot: "" }));
      return;
    }
    setErrors((prev) => ({ ...prev, date: "" }));
    setFormData((prev) => ({ ...prev, date: value }));
  };

  /**
   * Validate form
   */
  const validateForm = () => {
    const newErrors = {};

    if (!formData.patient) {
      newErrors.patient = "Patient is required";
    }
    if (!formData.date) {
      newErrors.date = "Date is required";
    }
    if (!formData.timeSlot) {
      newErrors.timeSlot = "Time slot is required";
    }
    if (formData.visitType === "opd" && !formData.reason.trim()) {
      newErrors.reason = "Reason is required";
    }
    if (!formData.clinic) {
      newErrors.clinic = "Clinic is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submit — accepts optional paymentOverrides (e.g. { opdFeePaid: true })
   * injected after a successful Razorpay payment.
   */
  const handleSubmit = (paymentOverrides = {}) => {
    if (!validateForm()) return;

    if (formData.visitType === "treatment") {
      if (!formData.treatmentName.trim()) {
        setErrors((prev) => ({ ...prev, treatmentName: "Enter the treatment name" }));
        return;
      }
      if (!formData.isFree) {
        const hasInvalidItem = formData.treatmentItems.some(
          (item) => !item.description.trim() || !Number(item.unitPrice) || Number(item.unitPrice) <= 0,
        );
        if (hasInvalidItem) {
          setErrors((prev) => ({ ...prev, treatmentItems: "Each item needs a description and a fee greater than ₹0" }));
          return;
        }
        setErrors((prev) => ({ ...prev, treatmentItems: "" }));
      }
      if (!formData.originatingOpdAppointment) {
        toast.error("Please select the OPD visit this treatment originated from");
        return;
      }
    }

    if (formData.visitType === "treatment_session") {
      if (!formData.parentAppointment) {
        toast.error("Session must be linked to a parent treatment appointment.");
        return;
      }
    }

    const appointmentData = {
      // Backend createAppointment expects `patientId` (existing patient) and
      // requires `phone` in its top-level validation — send both.
      patientId: formData.patient._id,
      phone: formData.patient.phone,
      name: formData.patient.name,
      clinic: formData.clinic._id,
      date: formData.date,
      timeSlot: formData.timeSlot,
      type: formData.type,
      appointmentType: formData.appointmentType,
      reason: formData.visitType === "treatment"
        ? (formData.treatmentName.trim() || formData.reason)
        : formData.reason,
      source: formData.source,
      notes: formData.notes || undefined,
      visitType: formData.visitType,
      isFree: formData.isFree,
      opdFeePaid: formData.isFree || feeCollected,
      paymentMethod: formData.isFree ? "free" : paymentMethod,
      ...(formData.visitType === "treatment"
        ? {
            treatmentId: "other",
            treatmentName: formData.treatmentName.trim(),
            fee: formData.isFree ? 0 : treatmentTotal,
            ...(!formData.isFree
              ? {
                  items: formData.treatmentItems.map((item) => ({
                    description: item.description.trim(),
                    unitPrice: Number(item.unitPrice),
                    itemType: item.itemType || "treatment",
                  })),
                  ...(Number(formData.treatmentDiscountPercent) > 0
                    ? { discountPercent: Number(formData.treatmentDiscountPercent) }
                    : {}),
                }
              : {}),
            ...(formData.sessionsPlanned ? { sessionsPlanned: formData.sessionsPlanned } : {}),
            ...(feeCollected && !formData.isFree && formData.treatmentPaymentAmount != null
              ? { amountPaid: Number(formData.treatmentPaymentAmount) }
              : {}),
            ...(formData.originatingOpdAppointment
              ? { originatingOpdAppointmentId: formData.originatingOpdAppointment }
              : {}),
          }
        : formData.visitType === "treatment_session"
        ? {
            parentAppointment: formData.parentAppointment,
            sessionNumber: formData.sessionNumber,
            treatmentName: formData.treatmentName,
          }
        : {
            opdFee: formData.isFree ? 0 : Number(formData.opdFee),
          }),
      ...paymentOverrides,
    };

    // Capture session payment fields before async reset
    const shouldCollectPayment =
      formData.visitType === "treatment_session" &&
      formData.collectSessionPayment &&
      formData.sessionPaymentAmount > 0 &&
      formData.selectedTreatmentInvoiceId;
    const capturedInvoiceId = formData.selectedTreatmentInvoiceId;
    const capturedAmount = formData.sessionPaymentAmount;
    const capturedMode = formData.sessionPaymentMode;

    createAppointment(appointmentData, {
      onSuccess: async (response) => {
        const token = response?.data?.tokenNumber;

        // The booking is deliberately kept even when auto-invoice generation
        // fails -- but it must never read as a clean success. Without an
        // invoice this appointment can't be billed or collected against, and
        // it won't show up in Billing at all. Surfaced loudly here (long
        // autoClose) plus persisted server-side for the Dashboard alert.
        if (response?.data?.warning || response?.data?.invoiceError) {
          toast.error(
            response.data.warning ||
              "Appointment booked, but invoice generation failed — please contact support.",
            { autoClose: 15000 }
          );
        }
        // Build slip object from formData (before reset) + server response
        const slipData = {
          ...response?.data,
          date: formData.date,
          timeSlot: formData.timeSlot,
          clinic: formData.clinic,
          reason: formData.reason,
          patient: {
            ...response?.data?.patient,
            name: formData.patient?.name,
            phone: formData.patient?.phone,
            age: formData.patient?.age,
            gender: formData.patient?.gender,
            address: formData.patient?.address,
          },
        };
        setBookedAppointment(slipData);
        setFormData(getInitialFormState());
        setPatientOptions([]);
        setPaymentMethod("cash");
        setFeeCollected(false);
        onSuccess?.(response);

        // Collect session payment (after session appointment created successfully)
        if (shouldCollectPayment) {
          try {
            const collectRes = await collectPaymentMutation({
              invoiceId: capturedInvoiceId,
              amount: capturedAmount,
              mode: capturedMode,
              // Links this Payment to THIS specific session, so the Treatments
              // tab's session timeline can show what was collected at this
              // session rather than the shared invoice's cumulative total.
              appointmentId: response?.data?.appointmentId,
            });
            if (capturedMode === "razorpay") {
              // Merge the generated link onto the already-set success-banner
              // state -- reuses the SAME PaymentLinkDisplay block below that
              // booking-time razorpay already renders, no new UI needed.
              const paymentLink = collectRes?.data?.paymentLink;
              setBookedAppointment((prev) => (prev ? { ...prev, paymentLink } : prev));
              toast.success(
                `Session booked${token ? ` — Token #${token}` : ""} — Razorpay payment link generated`,
              );
            } else {
              toast.success(
                `Session booked${token ? ` — Token #${token}` : ""} + ₹${capturedAmount.toLocaleString("en-IN")} payment recorded`,
              );
            }
          } catch {
            toast.success(token ? `Session booked — Token #${token}` : "Session booked");
            toast.warning("Payment could not be recorded — collect via session detail");
          }
        } else {
          toast.success(token ? `Appointment booked — Token #${token}` : "Appointment booked");
        }
        // Modal stays open to show success banner; user closes it manually
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Failed to create appointment",
        );
      },
    });
  };

  /**
   * Handle modal close
   */
  const handleClose = () => {
    if (!isCreating) {
      setFormData(getInitialFormState());
      setPatientOptions([]);
      setErrors({});
      setShowAddPatient(false);
      setNewPatient({ name: "", phone: "", email: "", age: "", gender: "" });
      setPaymentMethod("cash");
      setFeeCollected(false);
      setBookedAppointment(null);
      setOtherTreatmentDialogOpen(false);
      setOtherTreatmentInput("");
      setPreviousTreatment("");
      setCustomTreatmentName("");
      onClose();
    }
  };

  /**
   * Fee / Payment Method summary -- single source of truth shared between
   * the OPD/Appointment branch and the Treatment branch (Part 4: "don't
   * duplicate the component/logic between the two branches"). Rendered in
   * different POSITIONS depending on visit type (see the two Grid usages
   * below), but this is the one place its content is defined.
   */
  const paymentMethodPaper = (
    <Paper variant="outlined" className="p-3 bg-gray-50">
      <Box className="flex justify-between items-center py-1">
        <Typography variant="caption" className="text-gray-600">
          {formData.visitType === "treatment"
            ? formData.treatmentName.trim() || "Treatment fee"
            : "Appointment / Consultation fee"}
        </Typography>
        {discountPercent > 0 && !formData.isFree ? (
          <Box className="flex items-center gap-2">
            <span className="font-numbers text-gray-400 line-through text-[13px]">
              {formatCurrency(baseFee)}
            </span>
            <span className="font-numbers font-semibold text-accent">
              {formatCurrency(discountedFee)}
            </span>
          </Box>
        ) : (
          <span className="font-numbers font-semibold">
            {formData.isFree ? "Free" : formatCurrency(baseFee)}
          </span>
        )}
      </Box>
      {discountPercent > 0 && !formData.isFree && (
        <Box className="flex justify-between items-center py-1">
          <Typography variant="caption" className="text-gray-500">
            Membership discount
          </Typography>
          <Chip size="small" color="warning" label={`${discountPercent}% off`} sx={{ height: 18, fontWeight: 700 }} />
        </Box>
      )}
      <Divider className="my-2.5" />
      <Box className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 py-0.5 mt-2">
        {formData.visitType === "treatment" && !formData.isFree && (
          <Box className="flex items-center gap-1">
            <TextField
              label="Discount %"
              type="number"
              value={formData.treatmentDiscountPercent}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, treatmentDiscountPercent: e.target.value }))
              }
              size="small"
              inputProps={{ min: 0, max: 100 }}
              sx={{ width: 110, "& .MuiInputBase-root": { height: 30 } }}
            />
          </Box>
        )}
        <Box className="flex items-center gap-1">
          <Typography variant="caption" className="text-gray-500">Method:</Typography>
          {formData.isFree ? (
            <Chip size="small" variant="outlined" label="Free" sx={{ height: 20 }} />
          ) : (
            <PaymentMethodSelector
              value={paymentMethod}
              onChange={(method) => {
                setPaymentMethod(method);
                // Razorpay generates a link paid LATER by the patient -- it can
                // never be "collected" at booking time, so force the checkbox off.
                if (method === "razorpay") setFeeCollected(false);
              }}
            />
          )}
        </Box>
      </Box>
      {/* Free toggle (below method, above payment collected) */}
      <Box sx={{ mt: 1 }}>
        <FormControlLabel
          control={
            <Switch
              checked={formData.isFree}
              onChange={(e) => {
                const isFree = e.target.checked;
                const defaultFee = formData.appointmentType === "emergency"
                  ? feeSettings.opdFeeEmergency
                  : feeSettings.opdFeeRegular;
                setFormData((prev) => ({
                  ...prev,
                  isFree,
                  opdFee: isFree ? 0 : defaultFee,
                }));
                if (isFree) { setPaymentMethod("cash"); setFeeCollected(false); }
              }}
              color="success"
              size="small"
            />
          }
          label={<Typography variant="body2" sx={{ fontSize: "0.8rem" }}>Free</Typography>}
        />
      </Box>

      {!formData.isFree && paymentMethod === "razorpay" && (
        <Typography variant="caption" sx={{ display: "block", color: "#2563eb", fontSize: "0.7rem", mt: 1 }}>
          A Razorpay payment link will be generated on booking and sent via WhatsApp — payment is collected later by the patient, not now.
        </Typography>
      )}

      {!formData.isFree && paymentMethod !== "razorpay" && (
        <Box className="flex flex-col gap-1 mt-2">
          <FormControlLabel
            control={
              <Checkbox
                checked={feeCollected}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setFeeCollected(checked);
                  if (checked && formData.visitType === "treatment") {
                    setFormData((prev) => ({
                      ...prev,
                      treatmentPaymentAmount: treatmentTotal,
                    }));
                  }
                }}
                size="small"
                sx={{ py: 0.5, color: "#059669", "&.Mui-checked": { color: "#059669" } }}
              />
            }
            label={
              <Typography variant="caption" sx={{ color: feeCollected ? "#059669" : "text.secondary", fontWeight: feeCollected ? 600 : 400 }}>
                Payment collected
              </Typography>
            }
            sx={{ m: 0 }}
          />
          {formData.visitType === "treatment" && feeCollected && (
            <TextField
              label="Amount collected (₹)"
              type="number"
              value={formData.treatmentPaymentAmount ?? ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, treatmentPaymentAmount: Number(e.target.value) }))
              }
              size="small"
              inputProps={{ min: 0, max: treatmentTotal || 999999 }}
              helperText={`Treatment total: ₹${treatmentTotal.toLocaleString("en-IN")}. Enter full or partial advance.`}
              sx={{ maxWidth: 220, "& .MuiFormHelperText-root": { visibility: "visible !important" } }}
            />
          )}
        </Box>
      )}
    </Paper>
  );

  return (
    <>
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      slotProps={{ paper: { className: "rounded-xl" } }}
    >
      {/* Header — slim title bar */}
      <DialogTitle className="bg-linear-to-r from-indigo-600 to-indigo-700 text-white" sx={{ py: 1.25, px: 2 }}>
        <Box className="flex items-center justify-between">
          <Box className="flex items-center gap-2">
            <EventIcon className="text-white" fontSize="small" />
            <Typography variant="subtitle1" className="font-bold text-white">
              Book New Appointment
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleClose} disabled={isCreating}>
            <CloseIcon className="text-white" fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* Content — compact, helper texts muted/smaller */}
      <DialogContent
        sx={{
          px: 2,
          pt: 1.25,
          pb: 1.25,
          "& .MuiFormHelperText-root": {
            fontSize: "0.7rem",
            lineHeight: 1.3,
            mt: 0.25,
            mb: 0,
            minHeight: 0,
            visibility: "hidden",
          },
          "& .MuiInputBase-root": { height: "40px", fontSize: "13px" },
          "& .notes-field .MuiInputBase-root": { height: "auto" },
          "& .MuiInputBase-input": { fontSize: "13px", paddingTop: "5px", paddingBottom: "5px" },
          "& .MuiInputLabel-root": { fontSize: "13px" },
          "& .MuiAutocomplete-root .MuiInputBase-root": { height: "40px" },
          "& .MuiAutocomplete-input": { paddingTop: "2px !important", paddingBottom: "2px !important" },
          "& .MuiSelect-select": { paddingTop: "8px", paddingBottom: "8px" },
        }}
        className="mt-5"
      >
        {/* Cloned-treatment banner — shown while the prefilled form is still open */}
        {prefillData && !bookedAppointment && (
          <Box
            sx={{
              border: "1px solid #bfdbfe",
              borderRadius: "8px",
              backgroundColor: "#eff6ff",
              px: 1.5,
              py: 1,
              mb: 1.5,
            }}
          >
            <Typography variant="caption" sx={{ color: "#1e40af", fontWeight: 600 }}>
              Cloned from a previous treatment — review and adjust before booking
            </Typography>
          </Box>
        )}

        {/* Success banner — shown after booking, replaces the form */}
        {bookedAppointment && (
          <Box
            sx={{
              border: "1px solid #d1fae5",
              borderRadius: "10px",
              backgroundColor: "#f0fdf4",
              p: 3,
              textAlign: "center",
            }}
          >
            <CheckCircleIcon sx={{ fontSize: 48, color: "#059669", mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#065f46", mb: 0.5 }}>
              Appointment Booked!
            </Typography>
            {bookedAppointment.tokenNumber && (
              <Typography variant="body2" sx={{ color: "#047857", mb: 0.5 }}>
                Token <strong>#{bookedAppointment.tokenNumber}</strong>
              </Typography>
            )}
            {bookedAppointment.appointmentNumber && (
              <Typography variant="body2" sx={{ color: "#6b7280", mb: 2 }}>
                {bookedAppointment.appointmentNumber}
              </Typography>
            )}
            <Button
              variant="outlined"
              size="small"
              startIcon={<DownloadIcon />}
              onClick={() => setSlipPreviewOpen(true)}
              sx={{
                textTransform: "none",
                borderColor: "#f59e0b",
                color: "#f59e0b",
                "&:hover": { borderColor: "#d97706", backgroundColor: "#fffbeb" },
              }}
            >
              Preview & Download Slip
            </Button>

            {/* Razorpay Payment Link -- only present when this booking's
                payment method was "razorpay". Always shows the link (manual-
                copy fallback) plus the REAL WhatsApp send outcome from the
                booking response, never assumed successful. */}
            {bookedAppointment.paymentLink && (
              <PaymentLinkDisplay
                shortUrl={bookedAppointment.paymentLink.shortUrl}
                whatsappSent={bookedAppointment.paymentLink.whatsappSent}
                error={bookedAppointment.paymentLink.error}
              />
            )}

            <Typography variant="caption" sx={{ display: "block", color: "#9ca3af", mt: 2 }}>
              Close this dialog to book another appointment.
            </Typography>
          </Box>
        )}

        {/* mt on the container guarantees a gap below the purple header
            (MUI zeroes DialogContent padding-top right after DialogTitle). */}
        {!bookedAppointment && (
        <Grid container spacing={1.25} sx={{ mt: 0.75 }}>

          {/* ─── ROW 1: Patient + Clinic ─── */}
          <Grid size={{ xs: 12, sm: 7 }}>
            <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
              <Box sx={{ flex: "1 1 75%", maxWidth: "75%" }}>
                <Autocomplete
                  options={patientOptions}
                  getOptionLabel={(option) => `${option.name} (${option.phone})`}
                  value={formData.patient}
                  onChange={(_, value) =>
                    setFormData((prev) => ({ ...prev, patient: value }))
                  }
                  onInputChange={(_, value) => {
                    setPatientSearch(value);
                    handlePatientSearch(value);
                  }}
                  loading={searchLoading}
                  renderOption={(props, option) => {
                    const { key, ...optionProps } = props;
                    return (
                      <li key={key} {...optionProps}>
                        <Box sx={{ display: "flex", flexDirection: "column", py: 0.25 }}>
                          <Typography sx={{ fontSize: "13px", fontWeight: 600, color: "#1a1a1a" }}>
                            {option.name}
                          </Typography>
                          <Typography sx={{ fontSize: "13px", fontWeight: 700, color: "#0d1b4a" }}>
                            📞 {option.phone}
                          </Typography>
                        </Box>
                      </li>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Search Patient"
                      placeholder="Search by name or phone number"
                      error={!!errors.patient}
                      helperText={errors.patient}
                      required
                      size="small"
                    />
                  )}
                  noOptionsText={
                    patientSearch.length < 2
                      ? "Type at least 2 characters"
                      : "No patient found"
                  }
                />
              </Box>
              {/* Always visible/reachable regardless of how many search results
                  are showing -- rendered outside the Autocomplete's dropdown
                  Paper entirely (a sibling Box, not a descendant of the
                  Autocomplete), so it can never get pushed out of view by
                  matching results (previously lived inside noOptionsText,
                  which MUI only renders when there are zero matches). Now
                  positioned beside Search Patient (~25% width) instead of on
                  its own line below. Round 2: switched from outlined to a
                  FILLED orange button (#f59e0b bg / white text) to match the
                  same solid-orange convention used by "Book Session #" below
                  in this modal -- NOTE: the "Book Appointment" submit button
                  in the footer is actually indigo (bg-indigo-600, matches the
                  header), not orange, so #f59e0b was kept as the intended
                  "standard orange" rather than matched to that button. */}
              <Button
                size="small"
                variant="contained"
                onClick={() => setShowAddPatient(true)}
                sx={{
                  flex: "0 0 25%",
                  maxWidth: "25%",
                  height: 40,
                  fontSize: "11px",
                  textTransform: "none",
                  backgroundColor: "#f59e0b",
                  color: "#fff",
                  px: 0.5,
                  boxShadow: "none",
                  "&:hover": { backgroundColor: "#d97706", boxShadow: "none" },
                }}
              >
                + Add Patient
              </Button>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: 5 }}>
            <Autocomplete
              options={clinics}
              getOptionLabel={(option) =>
                `${option.name}${option.address?.city ? ` - ${option.address.city}` : ""}`
              }
              value={formData.clinic}
              onChange={(_, value) =>
                setFormData((prev) => ({ ...prev, clinic: value }))
              }
              loading={clinicLoading}
              isOptionEqualToValue={(opt, val) => opt._id === val?._id}
              getOptionDisabled={(option) => !option.isActive}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Clinic"
                  placeholder="Choose clinic"
                  required
                  size="small"
                  error={!!errors.clinic}
                  helperText={errors.clinic || "Inactive clinics are disabled"}
                />
              )}
            />
          </Grid>
          {formData.patient && (
            <Grid size={{ xs: 12 }} sx={{ mt: -1 }}>
              <Typography sx={{ fontSize: "12px", fontWeight: 600, color: "#0d1b4a" }}>
                Selected: {formData.patient.name} — {formData.patient.phone}
              </Typography>
            </Grid>
          )}
          {/* ─── ACTIVE TREATMENT BANNER ─── */}
          {!isSessionMode && activeTreatments.length > 0 && (
            <Grid size={{ xs: 12 }}>
              <Box
                sx={{
                  border: "1px solid #fde68a",
                  borderRadius: 2,
                  backgroundColor: "#fffbeb",
                  p: 1.5,
                }}
              >
                <Typography sx={{ fontSize: "12px", fontWeight: 700, color: "#92400e", mb: 1 }}>
                  Active Treatments
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {activeTreatments.map((t) => (
                    <Box
                      key={t.parentAppointmentId}
                      sx={{
                        border: "1px solid #fcd34d",
                        borderRadius: 1.5,
                        px: 1.5,
                        py: 1,
                        backgroundColor: "#fff",
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.5,
                        minWidth: 200,
                      }}
                    >
                      <Typography sx={{ fontSize: "12px", fontWeight: 700, color: "#1a1a1a" }}>
                        {t.treatmentName}
                      </Typography>
                      {t.sessionsPlanned ? (
                        <Typography sx={{ fontSize: "11px", color: "#6b7280" }}>
                          Session {t.sessionsBooked} of {t.sessionsPlanned} · {t.sessionsRemaining} remaining
                        </Typography>
                      ) : (
                        <Typography sx={{ fontSize: "11px", color: "#6b7280" }}>
                          {t.sessionsBooked} session{t.sessionsBooked === 1 ? "" : "s"} booked · Next: #{t.nextSessionNumber}
                        </Typography>
                      )}
                      {t.invoice && (
                        t.isPaidInFull ? (
                          <Typography sx={{ fontSize: "11px", color: "#059669", fontWeight: 600 }}>
                            ✓ Fully paid · ₹{(t.invoice.grandTotal || 0).toLocaleString("en-IN")}
                          </Typography>
                        ) : (
                          <Typography sx={{ fontSize: "11px", color: "#dc2626" }}>
                            {t.invoice.invoiceNumber} · ₹{(t.invoice.balanceDue || 0).toLocaleString("en-IN")} outstanding of ₹{(t.invoice.grandTotal || 0).toLocaleString("en-IN")}
                          </Typography>
                        )
                      )}
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleContinueTreatment(t)}
                        sx={{
                          mt: 0.5,
                          fontSize: "11px",
                          textTransform: "none",
                          height: 26,
                          backgroundColor: "#f59e0b",
                          "&:hover": { backgroundColor: "#d97706" },
                        }}
                      >
                        Book Session #{t.nextSessionNumber}
                      </Button>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Grid>
          )}

          {/* ─── ROW 2: Date → Time → Appointment Type → Booking Source ─── */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              label="Appointment Date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleDateChange}
              error={!!errors.date}
              helperText={errors.date}
              required
              size="small"
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: minBackdateStr(), max: MAX_DATE, ...dateGuards }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            {/* Admin can book at ANY minute -- not restricted to the 30-min
                slot boundaries patients use. Native time input, not a
                dropdown; the patient-facing BookAppointment.jsx form is
                untouched and keeps its 30-min Select. */}
            <TextField
              fullWidth
              type="time"
              label="Time"
              name="timeSlot"
              value={formData.timeSlot}
              onChange={handleChange}
              error={!!errors.timeSlot}
              helperText={errors.timeSlot || "Any time -- not limited to 30-min slots"}
              required
              size="small"
              InputLabelProps={{ shrink: true }}
              inputProps={{ step: 60 }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              label="Appointment Type"
              name="type"
              value={formData.type}
              onChange={(e) => {
                const value = e.target.value;
                setFormData((prev) => ({ ...prev, type: value, appointmentType: value }));
              }}
              select
              size="small"
              // "Emergency" (the longest option) was touching/overlapping the
              // select box's border -- this modal's DialogContent sx above
              // only overrides top/bottom padding on .MuiSelect-select, so
              // horizontal clearance still fell back to MUI's default, which
              // gets squeezed at this field's narrow md=3 column width. Give
              // it an explicit right-padding floor (clearing the dropdown
              // arrow) and a minWidth floor so it never compresses below the
              // "Emergency" label's rendered width.
              sx={{
                minWidth: 150,
                "& .MuiSelect-select": {
                  pr: "34px !important",
                  whiteSpace: "nowrap",
                },
              }}
            >
              {typeOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              label="Booking Source"
              name="source"
              value={formData.source}
              onChange={handleChange}
              select
              size="small"
            >
              {sourceOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* ─── Reason for Visit (own row, OPD/Appointment mode only) ─── */}
          {formData.visitType === "opd" && (
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Reason for Visit"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              error={!!errors.reason}
              helperText={errors.reason}
              required
              size="small"
              placeholder="e.g., Tooth pain, Cleaning"
            />
          </Grid>
          )}

          {/* ─── SECTION DIVIDER ─── */}
          <Grid size={{ xs: 12 }}>
            <Divider />
          </Grid>

          {/* Membership notice */}
          {isActiveMember && formData.visitType === "opd" && (
            <Grid size={{ xs: 12 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  px: 1,
                  py: 0.75,
                  bgcolor: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: 1,
                }}
              >
                <CheckCircleIcon sx={{ fontSize: 14, color: "#059669" }} />
                <Typography variant="caption" sx={{ color: "#059669", fontWeight: 600 }}>
                  Patient has {membership?.planName || "an active membership"} — Appointment is free
                </Typography>
              </Box>
            </Grid>
          )}

          {/* ─── ROW 4a: Visit Type + Fee/Method summary -- combined into one
              row (Fix 3). Previously Visit Type sat alone in its own
              full-width row, then the Fee/Method Paper sat in a separate row
              below it; merging them reclaims the vertical space Visit Type
              used to occupy on its own, since the Fee summary Paper is
              already the taller of the two. Treatment mode: the Fee/Method
              Paper no longer shares this row (Part 5 reorder -- it now
              renders after Fee Items/Subtotal/Total further down), so this
              box goes full-width instead of sharing sm:5/md:4. ─── */}
          <Grid size={{ xs: 12, sm: isTreatmentMode ? 12 : 5, md: isTreatmentMode ? 12 : 4 }}>
            <Box
              sx={{
                border: "1px solid #e5e7eb",
                borderRadius: 2,
                p: 1.25,
                bgcolor: "#fafafa",
                height: "100%",
              }}
            >
              {/* Visit Type */}
              {isSessionMode ? (
                <Box>
                  <Typography sx={{ fontSize: "0.7rem", fontWeight: 600, color: "#374151", mb: 0.5 }}>
                    Visit Type
                  </Typography>
                  <Chip
                    label={`Treatment Session #${formData.sessionNumber}`}
                    size="small"
                    sx={{
                      backgroundColor: "#f59e0b",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: "0.75rem",
                      height: 26,
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{ display: "block", fontSize: "0.65rem", color: "#6b7280", mt: 0.5 }}
                  >
                    {formData.treatmentName} · Session linked to parent appointment · No charge
                  </Typography>
                  <Button
                    size="small"
                    onClick={handleCancelSessionMode}
                    sx={{ p: 0, mt: 0.5, fontSize: "0.65rem", textTransform: "none", color: "#dc2626", minWidth: 0 }}
                  >
                    Cancel session mode
                  </Button>
                </Box>
              ) : (
                <FormControl>
                  <FormLabel className="text-xs font-semibold text-gray-700" sx={{ "&.Mui-focused": { color: "inherit" } }}>
                    Visit Type
                  </FormLabel>
                  <RadioGroup
                    row
                    value={formData.visitType}
                    onChange={(e) => {
                      const newVisitType = e.target.value;
                      if (newVisitType === "treatment") {
                        setPaymentMethod("cash");
                        setFeeCollected(false);
                        if (isActiveMember && formData.isFree) {
                          const defaultFee =
                            formData.appointmentType === "emergency"
                              ? feeSettings.opdFeeEmergency
                              : feeSettings.opdFeeRegular;
                          setFormData((prev) => ({
                            ...prev,
                            visitType: "treatment",
                            isFree: false,
                            opdFee: defaultFee,
                          }));
                          return;
                        }
                      }
                      setFormData((prev) => ({
                        ...prev,
                        visitType: newVisitType,
                        ...(newVisitType === "opd"
                          ? { treatmentName: "", fee: "", treatmentItems: [{ description: "", unitPrice: "", itemType: "treatment" }], treatmentDiscountPercent: 0 }
                          : {}),
                      }));
                      if (newVisitType === "opd") setCustomTreatmentName("");
                    }}
                    sx={{ "& .MuiFormControlLabel-label": { fontSize: "0.8rem" }, "& .MuiFormControlLabel-root": { mr: 1 } }}
                  >
                    <FormControlLabel value="opd" control={<Radio size="small" />} label="Appointment" />
                    <FormControlLabel value="treatment" control={<Radio size="small" />} label="Treatment" />
                  </RadioGroup>
                </FormControl>
              )}

              {/* Round 2 Fix 2: OPD Fee override -- moved here, stacked
                  directly below the Visit Type radios, instead of living in
                  its own separate full-width row further down. Investigated
                  first: this is a genuine EDITABLE OVERRIDE input (bound to
                  formData.opdFee via name="opdFee" + the shared handleChange
                  setter, with a "Reset to default" affordance when it
                  diverges from the feeSettings-derived default) -- it is NOT
                  a duplicate of the Fee Summary Paper beside it. That Paper
                  is a READ-ONLY computed display: its `baseFee` is derived
                  FROM this same formData.opdFee value (see baseFee/
                  discountedFee above), then has the membership discount
                  applied on top for display. One is the source input, the
                  other is a downstream read-only total -- distinct purposes,
                  not redundant. */}
              {!isSessionMode && formData.visitType === "opd" && (
                <Box sx={{ mt: 1.25 }}>
                  <TextField
                    fullWidth
                    label={
                      formData.isFree
                        ? "Appointment Fee — Free (Membership)"
                        : `Appointment Fee (₹) — ${formData.appointmentType === "emergency" ? "Emergency" : "Regular"}`
                    }
                    name="opdFee"
                    type="number"
                    value={formData.opdFee}
                    onChange={handleChange}
                    size="small"
                    disabled={formData.isFree}
                    inputProps={{ min: 0 }}
                  />
                  {formData.isFree ? (
                    <Typography
                      variant="caption"
                      sx={{ display: "block", color: "#059669", fontSize: "0.65rem", mt: 0.25 }}
                    >
                      Membership benefit — cannot be overridden
                    </Typography>
                  ) : (
                    opdFeeDiffersFromDefault && (
                      <Button
                        size="small"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, opdFee: derivedOpdDefault }))
                        }
                        startIcon={<RestartAltIcon sx={{ fontSize: 14 }} />}
                        sx={{ textTransform: "none", fontSize: "0.65rem", mt: 0.25, p: 0, minWidth: 0 }}
                      >
                        Reset to default
                      </Button>
                    )
                  )}
                  {formData.appointmentType === "emergency" && (
                    <Typography variant="caption" className="text-red-600 font-medium" sx={{ fontSize: "0.7rem", display: "block", mt: 0.25 }}>
                      Emergency Appointment fee applied (₹{feeSettings.opdFeeEmergency}).
                    </Typography>
                  )}
                </Box>
              )}

              {/* Round 2 Fix 3: Notes -- moved here too, so it stacks
                  compactly right below the fee box (or directly below the
                  radios in treatment/session mode, which has no fee box) in
                  this same left column, instead of occupying its own
                  separate full-width row. Still rows=2 (unchanged from
                  round 1 -- was NOT reverted to a taller field). Shown for
                  every visit mode (opd/treatment/session), matching its old
                  unconditional placement. */}
              <Box sx={{ mt: 1.25 }}>
                <TextField
                  className="notes-field"
                  fullWidth
                  label="Notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  multiline
                  rows={2}
                  size="small"
                  placeholder="Additional notes..."
                />
              </Box>
            </Box>
          </Grid>

          {/* Fee / Payment Method summary -- shared between OPD and Treatment
              (single source of truth, see paymentMethodPaper below). Position
              differs by visit type: OPD keeps it here beside Visit Type;
              Treatment mode renders it further down, AFTER Treatment Name/
              Sessions/OPD-link/Fee-Items/Subtotal/Total (Part 5 reorder --
              admin needs to know WHAT the treatment is and costs before
              deciding how to collect payment for it). */}
          {!isSessionMode && !isTreatmentMode && (
          <Grid size={{ xs: 12, sm: 7, md: 8 }}>
            {paymentMethodPaper}
          </Grid>
          )}

          {/* ─── ROW 4b: Treatment-mode-only detail fields (Treatment
              name/sessions/OPD-link) -- kept as its own full-width row,
              since these fields (especially Treatment Name + line items)
              need the extra horizontal room. Round 2: the OPD Fee override
              that used to live here was moved up into the Visit Type column
              (Fix 2), and this whole Grid item is now gated on treatment
              mode only -- previously it always rendered (as an empty
              bordered/padded box with zero children) in Appointment/session
              mode once the fee box moved out, which would have wasted a row
              of vertical space for nothing. ─── */}
          {!isSessionMode && formData.visitType === "treatment" && (
          <Grid size={{ xs: 12 }}>
            <Box
              sx={{
                border: "1px solid #e5e7eb",
                borderRadius: 2,
                p: 1.25,
                display: "flex",
                flexWrap: "wrap",
                gap: 1.5,
                alignItems: "flex-start",
                bgcolor: "#fafafa",
              }}
            >
              {/* Urgency radio group removed -- consolidated into the
                  Appointment Type dropdown above (Regular/Emergency), which
                  now sets appointmentType directly. */}

              {/* Treatment name + Sessions planned */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, flex: "1 1 100%" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                    <Box sx={{ flex: "1 1 70%", maxWidth: { md: "70%" } }}>
                      <StyledTextField
                        select
                        fullWidth
                        label="Treatment Name"
                        value={selectTreatmentValue}
                        SelectProps={{
                          displayEmpty: true,
                          renderValue: (val) => {
                            if (!val) return <em style={{ color: "#9ca3af" }}>Select a treatment</em>;
                            if (val === TREATMENT_NAME_OTHER)
                              return customTreatmentName || "Other (custom name)";
                            return val;
                          },
                        }}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === TREATMENT_NAME_OTHER) {
                            // Save what we had before clicking "Other" so Cancel can revert
                            setPreviousTreatment(formData.treatmentName);
                            // Pre-fill dialog with the current custom name (if any)
                            setOtherTreatmentInput(customTreatmentName);
                            setOtherTreatmentDialogOpen(true);
                            // formData.treatmentName is unchanged until dialog Save
                          } else {
                            setCustomTreatmentName("");
                            setFormData((prev) => ({ ...prev, treatmentName: value }));
                          }
                          if (errors.treatmentName) setErrors((prev) => ({ ...prev, treatmentName: "" }));
                        }}
                        required
                        size="small"
                        error={!!errors.treatmentName}
                        helperText={errors.treatmentName}
                      >
                        {TREATMENT_NAME_OPTIONS.map((name) => (
                          <MenuItem key={name} value={name}>
                            {name}
                          </MenuItem>
                        ))}
                        <MenuItem value={TREATMENT_NAME_OTHER}>Other (custom name)</MenuItem>
                      </StyledTextField>
                    </Box>
                    <Box sx={{ flex: "0 0 auto", minWidth: 190 }}>
                      <TextField
                        fullWidth
                        label="Sessions planned"
                        type="number"
                        value={formData.sessionsPlanned || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            sessionsPlanned: e.target.value ? Number(e.target.value) : null,
                          }))
                        }
                        size="small"
                        inputProps={{ min: 1, max: 50 }}
                        placeholder="e.g. 4"
                      />
                    </Box>
                  </Box>
                </Box>

              <Box sx={{ flex: "1 1 100%" }}>
                  <Autocomplete
                    options={patientOpdAppointments}
                    value={
                      patientOpdAppointments.find(
                        (a) => a._id === formData.originatingOpdAppointment
                      ) || null
                    }
                    getOptionLabel={(opt) =>
                      opt
                        ? `${opt.appointmentNumber || "OPD"} — ${
                            opt.date ? new Date(opt.date).toLocaleDateString("en-IN") : ""
                          } — ${opt.reason || ""}`
                        : ""
                    }
                    isOptionEqualToValue={(opt, val) => opt._id === val._id}
                    onChange={(_, value) =>
                      setFormData((prev) => ({
                        ...prev,
                        originatingOpdAppointment: value?._id || null,
                      }))
                    }
                    disabled={!formData.patient}
                    noOptionsText={
                      formData.patient
                        ? "No OPD visits found for this patient"
                        : "Select a patient first"
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        size="small"
                        required
                        label="Link to the OPD visit this treatment originated from *"
                        placeholder="Search this patient's OPD visits…"
                        error={!formData.originatingOpdAppointment && !!formData.patient}
                      />
                    )}
                  />
              </Box>

            </Box>
            {formData.appointmentType === "emergency" && (
              <Typography variant="caption" className="text-gray-500" sx={{ fontSize: "0.7rem", display: "block", mt: 0.5 }}>
                Flagged emergency — treatment fee unchanged.
              </Typography>
            )}
          </Grid>
          )}

          {/* ─── TREATMENT LINE ITEMS + DISCOUNT (parent treatment path only) ─── */}
          {!isSessionMode && formData.visitType === "treatment" && (
            <Grid size={{ xs: 12 }}>
              <Box className="flex items-center justify-between mb-1.5">
                <Typography variant="caption" className="font-semibold text-gray-700">
                  Fee Items
                </Typography>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={addTreatmentItem}
                  variant="outlined"
                  sx={{ textTransform: "none", fontSize: "12px", height: 28 }}
                >
                  Add Item
                </Button>
              </Box>

              {formData.treatmentItems.map((item, index) => (
                <Box
                  key={index}
                  sx={{ border: "1px solid #e5e7eb", borderRadius: "6px", p: 1.25, mb: 1 }}
                >
                  <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap" }}>
                    <TextField
                      select
                      label="Category"
                      value={item.itemType || "treatment"}
                      onChange={(e) => updateTreatmentItem(index, "itemType", e.target.value)}
                      size="small"
                      sx={{ flex: "0 0 auto", minWidth: 120 }}
                    >
                      {treatmentItemTypeOptions.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      label="Description"
                      value={item.description}
                      onChange={(e) => updateTreatmentItem(index, "description", e.target.value)}
                      size="small"
                      placeholder="e.g., Root Canal"
                      sx={{ flex: "1 1 200px", minWidth: 160 }}
                    />
                    <TextField
                      label="Amount (₹)"
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => updateTreatmentItem(index, "unitPrice", e.target.value)}
                      size="small"
                      inputProps={{ min: 0, step: 50 }}
                      sx={{ flex: "0 0 auto", minWidth: 130 }}
                    />
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => removeTreatmentItem(index)}
                      disabled={formData.treatmentItems.length <= 1}
                      sx={{ p: 0.5 }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              ))}
              {errors.treatmentItems && (
                <Typography variant="caption" className="text-red-600" sx={{ display: "block", mb: 1 }}>
                  {errors.treatmentItems}
                </Typography>
              )}

              <Box sx={{ mt: 1.5, p: 1.5, borderRadius: "6px", bgcolor: "#f9fafb" }}>
                <Box className="flex justify-between items-center">
                  <Typography variant="caption" className="text-gray-600">Subtotal</Typography>
                  <span className="font-numbers text-[13px]">{formatCurrency(treatmentSubtotal)}</span>
                </Box>
                {Number(formData.treatmentDiscountPercent) > 0 && (
                  <Box className="flex justify-between items-center mt-0.5">
                    <Typography variant="caption" className="text-gray-600">
                      Discount ({Number(formData.treatmentDiscountPercent)}%)
                    </Typography>
                    <span className="font-numbers text-[13px] text-red-600">
                      -{formatCurrency(treatmentDiscountAmount)}
                    </span>
                  </Box>
                )}
                <Divider className="my-1" />
                <Box className="flex justify-between items-center">
                  <Typography variant="caption" className="font-semibold text-gray-800">Total</Typography>
                  <span className="font-numbers font-semibold text-[13px]">{formatCurrency(treatmentTotal)}</span>
                </Box>
              </Box>
            </Grid>
          )}

          {/* ─── Discount % / Payment Method / Free toggle / Payment collected
              -- LAST in Treatment mode (Part 5 reorder). Same shared
              paymentMethodPaper as OPD mode, just rendered here instead of
              up in ROW 4a, so admin sees WHAT the treatment is and costs
              before deciding how to collect payment for it. ─── */}
          {!isSessionMode && isTreatmentMode && (
          <Grid size={{ xs: 12 }}>
            {paymentMethodPaper}
          </Grid>
          )}

          {/* ─── SESSION PAYMENT (optional, treatment_session only, hidden when nothing to collect) ─── */}
          {isSessionMode && formData.selectedTreatmentInvoiceBalance > 0 && (
            <Grid size={{ xs: 12 }}>
              <Box
                sx={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 2,
                  px: 2,
                  py: 1.5,
                  bgcolor: "#fafafa",
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.collectSessionPayment}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, collectSessionPayment: e.target.checked, sessionPaymentAmount: 0 }))
                      }
                      size="small"
                      color="success"
                      sx={{ py: 0.5 }}
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
                      Collect session payment now
                    </Typography>
                  }
                />
                {formData.collectSessionPayment && (
                  <Box sx={{ mt: 1, display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "flex-end" }}>
                    <Typography
                      variant="caption"
                      sx={{ display: "block", color: "#6b7280", width: "100%", mt: -0.5 }}
                    >
                      Recording against parent invoice · Outstanding: ₹{(formData.selectedTreatmentInvoiceBalance || 0).toLocaleString("en-IN")}
                    </Typography>
                    <TextField
                      label="Amount (₹)"
                      type="number"
                      value={formData.sessionPaymentAmount || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, sessionPaymentAmount: Number(e.target.value) }))
                      }
                      size="small"
                      inputProps={{ min: 0, max: formData.selectedTreatmentInvoiceBalance || 999999 }}
                      sx={{ width: 140 }}
                    />
                    <Box>
                      <Typography variant="caption" sx={{ color: "#6b7280", display: "block", mb: 0.5 }}>
                        Method
                      </Typography>
                      <PaymentMethodSelector
                        value={formData.sessionPaymentMode}
                        onChange={(method) =>
                          setFormData((prev) => ({ ...prev, sessionPaymentMode: method }))
                        }
                      />
                    </Box>
                  </Box>
                )}
                {formData.collectSessionPayment && formData.sessionPaymentMode === "razorpay" && (
                  <Typography variant="caption" sx={{ display: "block", color: "#2563eb", fontSize: "0.7rem", mt: 1 }}>
                    A Razorpay payment link will be generated for this amount and sent via WhatsApp after the session is booked — payment is collected later by the patient, not now.
                  </Typography>
                )}
              </Box>
            </Grid>
          )}

        </Grid>
        )}
      </DialogContent>

      {/* Actions — slim sticky footer with a top divider */}
      <DialogActions
        className="px-4 py-2 bg-gray-50"
        sx={{ borderTop: 1, borderColor: "divider" }}
      >
        <Button onClick={handleClose} color="inherit" disabled={isCreating}>
          {bookedAppointment ? "Close" : "Cancel"}
        </Button>

        {/* FIX 3 & 4: Conditional submit button (hidden after booking) */}
        {!bookedAppointment && (
          <Button
            variant="contained"
            onClick={() => handleSubmit()}
            disabled={isCreating}
            className="bg-indigo-600 hover:bg-indigo-700"
            startIcon={isCreating ? <CircularProgress size={16} /> : <AddIcon />}
          >
            {isCreating ? "Booking..." : "Book Appointment"}
          </Button>
        )}
      </DialogActions>
    </Dialog>

    {/* Add New Patient popup -- opens as a small Dialog instead of expanding
        inline within the booking form, matching the Reopen Treatment /
        Void Invoice dialog pattern used elsewhere in admin. */}
    <Dialog
      open={showAddPatient}
      onClose={() => {
        if (!addingPatient) {
          setShowAddPatient(false);
          setNewPatient({ name: "", phone: "", email: "", age: "", gender: "" });
        }
      }}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <AddIcon color="warning" fontSize="small" />
        Add New Patient
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 0.5 }}>
          <TextField
            label="Full Name *"
            size="small"
            fullWidth
            value={newPatient.name}
            onChange={(e) => setNewPatient((p) => ({ ...p, name: e.target.value }))}
            disabled={addingPatient}
          />
          <TextField
            label="Phone *"
            size="small"
            fullWidth
            value={newPatient.phone}
            onChange={(e) => setNewPatient((p) => ({ ...p, phone: e.target.value }))}
            inputProps={{ maxLength: 10 }}
            placeholder="10-digit mobile"
            disabled={addingPatient}
          />
          <TextField
            label="Email"
            size="small"
            fullWidth
            value={newPatient.email}
            onChange={(e) => setNewPatient((p) => ({ ...p, email: e.target.value }))}
            disabled={addingPatient}
          />
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              label="Age"
              type="number"
              size="small"
              sx={{ flex: 1 }}
              value={newPatient.age}
              onChange={(e) => setNewPatient((p) => ({ ...p, age: e.target.value }))}
              inputProps={{ min: 0, max: 130 }}
              disabled={addingPatient}
            />
            <TextField
              select
              label="Gender"
              size="small"
              sx={{ flex: 1 }}
              value={newPatient.gender}
              onChange={(e) => setNewPatient((p) => ({ ...p, gender: e.target.value }))}
              disabled={addingPatient}
            >
              <MenuItem value="male">Male</MenuItem>
              <MenuItem value="female">Female</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </TextField>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={() => {
            setShowAddPatient(false);
            setNewPatient({ name: "", phone: "", email: "", age: "", gender: "" });
          }}
          color="inherit"
          disabled={addingPatient}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={!newPatient.name || !newPatient.phone || addingPatient}
          startIcon={addingPatient ? <CircularProgress size={14} color="inherit" /> : <AddIcon />}
          onClick={async () => {
            setAddingPatient(true);
            try {
              const result = await createPatient({
                name: newPatient.name,
                phone: newPatient.phone,
                email: newPatient.email || undefined,
                gender: newPatient.gender || undefined,
                age: newPatient.age ? Number(newPatient.age) : undefined,
              });
              const created = result.data?.patient || result.patient || result;
              setFormData((prev) => ({ ...prev, patient: created }));
              setShowAddPatient(false);
              setNewPatient({ name: "", phone: "", email: "", age: "", gender: "" });
              toast.success(`Patient ${created.name} added`);
            } catch (err) {
              console.error("Add patient error:", err);
              toast.error(err.response?.data?.message || "Failed to add patient");
            }
            setAddingPatient(false);
          }}
          sx={{ backgroundColor: "#f59e0b", "&:hover": { backgroundColor: "#d97706" } }}
        >
          {addingPatient ? "Adding..." : "Add & Select"}
        </Button>
      </DialogActions>
    </Dialog>

    {/* "Enter treatment name" popup — opens when admin selects "Other" from
        the Treatment Name dropdown.  On Save the custom name is stored in
        both customTreatmentName (for renderValue display) and
        formData.treatmentName (for the API payload).  On Cancel the dropdown
        reverts to previousTreatment (whatever was selected before "Other"). */}
    <Dialog
      open={otherTreatmentDialogOpen}
      onClose={() => {
        // Cancel: revert dropdown to the value it had before "Other" was clicked
        setFormData((prev) => ({ ...prev, treatmentName: previousTreatment }));
        setOtherTreatmentInput("");
        setOtherTreatmentDialogOpen(false);
      }}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>Enter treatment name</DialogTitle>
      {/* pt via "&&" (specificity 0-2-0) overrides MUI's sibling rule
          .MuiDialogTitle-root + .MuiDialogContent-root { padding-top: 0 }
          which is also 0-2-0 — with equal specificity, the sx rule wins
          because Emotion inserts it after the theme stylesheet.
          Without this, the effective pt is 0 and overflow-y:auto clips
          the top ~5px of the shrunk outlined label. */}
      <DialogContent sx={{ "&&": { pt: 2.5 } }}>
        <StyledTextField
          autoFocus
          label="Treatment name"
          size="small"
          fullWidth
          value={otherTreatmentInput}
          onChange={(e) => setOtherTreatmentInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && otherTreatmentInput.trim()) {
              setCustomTreatmentName(otherTreatmentInput.trim());
              setFormData((prev) => ({ ...prev, treatmentName: otherTreatmentInput.trim() }));
              setOtherTreatmentDialogOpen(false);
            }
          }}
          placeholder="e.g., Root planing"
          sx={{ mt: 0.5 }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          color="inherit"
          onClick={() => {
            setFormData((prev) => ({ ...prev, treatmentName: previousTreatment }));
            setOtherTreatmentInput("");
            setOtherTreatmentDialogOpen(false);
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={!otherTreatmentInput.trim()}
          onClick={() => {
            setCustomTreatmentName(otherTreatmentInput.trim());
            setFormData((prev) => ({ ...prev, treatmentName: otherTreatmentInput.trim() }));
            setOtherTreatmentDialogOpen(false);
          }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>

    <AppointmentSlipPreviewModal
      open={slipPreviewOpen}
      onClose={() => setSlipPreviewOpen(false)}
      appointment={bookedAppointment}
    />
    </>
  );
};

export default AddAppointmentModal;

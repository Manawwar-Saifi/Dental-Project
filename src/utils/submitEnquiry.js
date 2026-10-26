import api from "../api/axios";
import { toast } from "react-toastify";

const submitEnquiry = async ({ name, email, phone, treatment, pagePath, pageLabel }) => {
  if (!name?.trim() || !phone?.trim()) {
    toast.info("Please fill Name and Phone");
    return false;
  }

  try {
    await api.post("/enquiries", {
      name,
      phone,
      email,
      treatmentName: treatment || "General Enquiry",
      source: {
        page: pagePath,
        referrer: pageLabel || pagePath,
      },
    });
    toast.success("Enquiry submitted! We will contact you soon.");
    return true;
  } catch {
    toast.error("Something went wrong. Please try again.");
    return false;
  }
};

export default submitEnquiry;

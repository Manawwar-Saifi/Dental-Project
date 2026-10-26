/**
 * Public clinic contact details — single source for the primary phone number.
 *
 * Same number shown in the site header/footer (+91 8708362763). New UI
 * (e.g. the mobile bottom bar) imports from here instead of re-hardcoding it.
 */
export const PRIMARY_PHONE_E164 = "918708362763"; // E.164 without "+"
export const PRIMARY_PHONE_TEL = `tel:+${PRIMARY_PHONE_E164}`;
export const WHATSAPP_URL = `https://wa.me/${PRIMARY_PHONE_E164}`;

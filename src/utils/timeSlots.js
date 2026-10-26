/**
 * Shared time slot generator for appointment booking.
 *
 * Callers control the actual bookable range by passing startTime/endTime —
 * admin modals pass a later endTime (clinic works late evenings), patient
 * booking passes an earlier endTime.
 */
export const generateTimeSlots = (startTime = "09:00", endTime = "22:00", interval = 30) => {
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);

  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  const slots = [];
  for (let mins = startMinutes; mins < endMinutes; mins += interval) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }
  return slots;
};

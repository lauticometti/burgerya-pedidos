import React from "react";
import { getAvailableSlotsMin30, minutesToHHMM } from "../../utils/timeSlots";

export default function useCarritoTimeSlots(whenMode, whenSlot, setWhenSlot) {
  const [availableSlots, setAvailableSlots] = React.useState(
    getAvailableSlotsMin30(),
  );

  // Refresh available slots every minute
  React.useEffect(() => {
    const id = setInterval(
      () => setAvailableSlots(getAvailableSlotsMin30()),
      60 * 1000,
    );
    return () => clearInterval(id);
  }, []);

  // Auto-select first available slot when "Más tarde" is chosen
  React.useEffect(() => {
    if (whenMode === "Más tarde" && !whenSlot && availableSlots.length) {
      setWhenSlot(minutesToHHMM(availableSlots[0]));
    }
  }, [whenMode, whenSlot, availableSlots, setWhenSlot]);

  const slotOptions = availableSlots.map((m) => ({
    value: minutesToHHMM(m),
    label: minutesToHHMM(m),
  }));

  return {
    availableSlots,
    slotOptions,
  };
}

import React from "react";
import { getAvailableSlotsMin30, minutesToHHMM } from "../../utils/timeSlots";
import { useStoreStatus } from "../../utils/storeClosedMode";

export default function useCarritoTimeSlots(whenMode, whenSlot, setWhenSlot) {
  // Mismo reloj que el resto de la web: se recalcula en cada minuto y al
  // volver a la pestaña (useStoreStatus), asi nunca ofrece horarios pasados.
  const { dateKey, minutes } = useStoreStatus();
  const availableSlots = React.useMemo(
    () => getAvailableSlotsMin30(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dateKey, minutes],
  );

  // Auto-select first available slot when "Más tarde" is chosen
  React.useEffect(() => {
    if (whenMode === "Mas tarde" && !whenSlot && availableSlots.length) {
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

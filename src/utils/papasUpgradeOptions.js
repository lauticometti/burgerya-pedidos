import {
  getUnavailableReason,
  isItemUnavailable,
} from "./availability";

export function buildPapasMejoras(papas = []) {
  const cheddar = papas.find((item) => item.id === "cheddar_liq");
  const bacon = papas.find((item) => item.id === "papas_bacon");

  const cheddarUnavailable = isItemUnavailable(cheddar);
  const baconUnavailable = isItemUnavailable(bacon);

  const cheddarSolo = cheddar
    ? {
        ...cheddar,
        id: "papas_cheddar",
        name: "Cheddar",
        price: cheddar.price || 1500,
        isAvailable: cheddarUnavailable ? 0 : 1,
        unavailableReason: cheddarUnavailable
          ? getUnavailableReason(cheddar)
          : undefined,
      }
    : null;

  const cheddarBacon =
    cheddar && bacon
      ? {
          ...cheddar,
          id: "papas_cheddar_bacon",
          name: "Cheddar y bacon",
          price: (cheddar.price || 0) + (bacon.price || 0) || 3000,
          isAvailable: cheddarUnavailable || baconUnavailable ? 0 : 1,
          unavailableReason: cheddarUnavailable
            ? getUnavailableReason(cheddar)
            : baconUnavailable
              ? getUnavailableReason(bacon)
              : undefined,
        }
      : null;

  return [cheddarSolo, cheddarBacon].filter(Boolean);
}

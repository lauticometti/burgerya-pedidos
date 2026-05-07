import {
  getUnavailableReason,
  isItemUnavailable,
} from "./availability";

export function buildPapasMejoras(papas = []) {
  const bacon = papas.find((item) => item.id === "papas_bacon");
  if (!bacon) return [];

  const baconUnavailable = isItemUnavailable(bacon);

  return [
    {
      ...bacon,
      id: "papas_bacon",
      name: "Bacon",
      price: bacon.price || 1500,
      isAvailable: baconUnavailable ? 0 : 1,
      unavailableReason: baconUnavailable ? getUnavailableReason(bacon) : undefined,
    },
  ];
}

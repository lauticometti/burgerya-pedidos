export const PROMO_OPTIONS = [
  { tier: "BASICA", label: "Basica", rank: 1 },
  { tier: "PREMIUM", label: "Premium", rank: 2 },
  { tier: "DELUXE", label: "Deluxe", rank: 3 },
];

export const ORDERED_PROMO_OPTIONS = [...PROMO_OPTIONS].sort(
  (a, b) => a.rank - b.rank,
);

export const TIER_LABELS = {
  BASICA: "de la promo basica:",
  PREMIUM: "de la promo premium:",
  DELUXE: "de la promo deluxe:",
};

export const TIER_ORDER = ["BASICA", "PREMIUM", "DELUXE"];

export function getStepHelp(step) {
  if (step === 1) return "Elegi el tipo de promo.";
  if (step === 2) return "Defini cuantas burgers queres.";
  if (step === 3) return "Elegi tamano doble o triple.";
  return "Selecciona las burgers para completar la promo.";
}

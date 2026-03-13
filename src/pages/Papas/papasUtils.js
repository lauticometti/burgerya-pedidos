import {
  getUnavailableReason,
  isItemUnavailable,
} from "../../utils/availability";

export function indexPapasById(list = []) {
  return list.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});
}

function getPrice(papasById, id) {
  return papasById[id]?.price ?? 0;
}

function getAvailability(papasById, id) {
  const item = papasById[id];
  return {
    isAvailable: !isItemUnavailable(item),
    unavailableReason: getUnavailableReason(item),
  };
}

export function buildPapasBase(papasById) {
  return [
    {
      id: "papas_chicas",
      label: "Papas chicas",
      size: "chica",
      basePrice: getPrice(papasById, "porcion_extra"),
    },
    {
      id: "papas_grandes",
      label: "Papas grandes",
      size: "grande",
      basePrice: getPrice(papasById, "porcion_grande_solas"),
    },
  ];
}

export function buildPapasOptionsBySize(papasById) {
  const baseChica = getPrice(papasById, "porcion_extra");
  const baseGrande = getPrice(papasById, "porcion_grande_solas");
  const cheddarPrice = getPrice(papasById, "cheddar_liq");
  const baconPrice = getPrice(papasById, "papas_bacon");

  const cheddarAvailability = getAvailability(papasById, "cheddar_liq");
  const baconAvailability = getAvailability(papasById, "papas_bacon");
  const grandeCheddarAvailability = getAvailability(papasById, "porcion_grande_cheddar");
  const grandeCheddarBaconAvailability = getAvailability(
    papasById,
    "porcion_grande_cheddar_bacon",
  );

  const grandeCheddarPrice =
    getPrice(papasById, "porcion_grande_cheddar") || baseGrande + cheddarPrice;
  const grandeCheddarBaconPrice =
    getPrice(papasById, "porcion_grande_cheddar_bacon") ||
    baseGrande + cheddarPrice + baconPrice;

  const cheddarBaconAvailability = {
    isAvailable: cheddarAvailability.isAvailable && baconAvailability.isAvailable,
    unavailableReason: !cheddarAvailability.isAvailable
      ? cheddarAvailability.unavailableReason
      : !baconAvailability.isAvailable
      ? baconAvailability.unavailableReason
      : undefined,
  };

  return {
    chica: [
      {
        id: "solas",
        label: "Solas",
        price: baseChica,
        ...getAvailability(papasById, "porcion_extra"),
      },
      {
        id: "cheddar",
        label: "Con cheddar",
        price: baseChica + cheddarPrice,
        ...cheddarAvailability,
      },
      {
        id: "cheddar_bacon",
        label: "Con cheddar (incluye bacon)",
        price: baseChica + cheddarPrice + baconPrice,
        ...cheddarBaconAvailability,
      },
    ],
    grande: [
      {
        id: "solas",
        label: "Solas",
        price: baseGrande,
        ...getAvailability(papasById, "porcion_grande_solas"),
      },
      {
        id: "cheddar",
        label: "Con cheddar",
        price: grandeCheddarPrice,
        ...grandeCheddarAvailability,
      },
      {
        id: "cheddar_bacon",
        label: "Con cheddar (incluye bacon)",
        price: grandeCheddarBaconPrice,
        ...grandeCheddarBaconAvailability,
      },
    ],
  };
}

export function buildPapasCartItem(size, option) {
  if (!size || !option) return null;

  const sizeLabel = size === "chica" ? "Papas chicas" : "Papas grandes";
  const optionLabel = option.label.charAt(0).toLowerCase() + option.label.slice(1);
  const name = `${sizeLabel} ${optionLabel}`;

  return {
    key: `papas:${size}:${option.id}`,
    name,
    qty: 1,
    unitPrice: option.price,
    meta: { type: "papas", size, option: option.id },
  };
}

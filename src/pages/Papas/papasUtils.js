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
  return {
    chica: [
      {
        id: "solas",
        label: "Solas",
        price: getPrice(papasById, "porcion_extra"),
      },
      {
        id: "cheddar",
        label: "Con cheddar",
        price:
          getPrice(papasById, "porcion_extra") + getPrice(papasById, "cheddar_liq"),
        ...getAvailability(papasById, "cheddar_liq"),
      },
      {
        id: "cheddar_bacon",
        label: "Con cheddar y bacon",
        price:
          getPrice(papasById, "porcion_extra") +
          getPrice(papasById, "cheddar_liq") +
          getPrice(papasById, "papas_bacon"),
        ...getAvailability(papasById, "cheddar_liq"),
      },
    ],
    grande: [
      {
        id: "solas",
        label: "Solas",
        price: getPrice(papasById, "porcion_grande_solas"),
      },
      {
        id: "cheddar",
        label: "Con cheddar",
        price: getPrice(papasById, "porcion_grande_cheddar"),
        ...getAvailability(papasById, "porcion_grande_cheddar"),
      },
      {
        id: "cheddar_bacon",
        label: "Con cheddar y bacon",
        price: getPrice(papasById, "porcion_grande_cheddar_bacon"),
        ...getAvailability(papasById, "porcion_grande_cheddar_bacon"),
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

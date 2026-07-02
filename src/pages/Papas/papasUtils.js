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
      img: papasById["porcion_grande_solas"]?.img || null,
    },
  ];
}

export function buildPapasOptionsBySize(papasById) {
  const baseChica = getPrice(papasById, "porcion_extra");
  const baseGrande = getPrice(papasById, "porcion_grande_solas");

  return {
    chica: [
      {
        id: "sola",
        label: "Papas chicas",
        price: baseChica,
        ...getAvailability(papasById, "porcion_extra"),
      },
    ],
    grande: [
      {
        id: "sola",
        label: "Papas grandes",
        price: baseGrande,
        ...getAvailability(papasById, "porcion_grande_solas"),
      },
    ],
  };
}

export function buildPapasCartItem(size, option) {
  if (!size || !option) return null;

  const name = size === "chica" ? "Papas chicas" : "Papas grandes";

  return {
    key: `papas:${size}`,
    name,
    qty: 1,
    unitPrice: option.price,
    meta: { type: "papas", size, option: option.id },
  };
}

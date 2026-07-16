// TEMP ARGENTINA MATCH DAY: mapeo visual de nombres (Argentina vs. Inglaterra).
// Solo afecta cómo se muestra el nombre en pantalla. No toca ids, precios,
// datos ni el texto del pedido de WhatsApp.

// Flag única: poner en true para reactivar el mapeo de nombres el próximo partido.
export const ARGENTINA_NAMES_CAMPAIGN = false;

// name original (tal cual burger.name en menu.js) → nombre argentino a mostrar.
const ARGENTINA_NAME_MAP = {
  BBQueen: "Reina del Asado",
  Smoklahoma: "Con Cebolla Ahumada",
  Cheese: "Queso",
  Bacon: "Panceta",
  American: "La Argenta",
  Lautiboom: "Lautibomba",
};

// Devuelve el nombre argentino para un nombre original, o null si no aplica
// (campaña apagada, o la burger no tiene mapeo).
export function getArgentinaName(originalName) {
  if (!ARGENTINA_NAMES_CAMPAIGN) return null;
  return ARGENTINA_NAME_MAP[originalName] || null;
}

// Lista [original, argentino] para mostrar el mapeo completo (ej. en el
// aviso de la home). Vacía si la campaña está apagada.
export function getArgentinaNameEntries() {
  if (!ARGENTINA_NAMES_CAMPAIGN) return [];
  return Object.entries(ARGENTINA_NAME_MAP);
}

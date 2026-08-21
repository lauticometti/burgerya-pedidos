import { formatMoney } from "./formatMoney";
import { getCategory } from "./itemGrouping";
import { getArgentinaName } from "./argentinaNames";
import {
  getSizeLabel,
  // formatComboGroup, // sin uso: la seccion COMBOS C/ COCA nunca se imprime
  formatPromoPicks,
  formatItemModifiers,
} from "./whatsappFormatters";

// Nombre a usar en el mensaje de WhatsApp: el argentino directo (sin tachado,
// esto es texto plano) si hay mapeo vigente, si no el nombre original.
function displayName(name) {
  return getArgentinaName(name) || name;
}

// El resto del mensaje va en minúsculas, pero el nombre de la burger debe
// arrancar con mayúscula (ej. "1 La argenta doble", no "1 la argenta doble").
function capitalize(text) {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

export function buildWhatsAppText({
  name,
  address,
  cross,
  pay,
  payCashAmount = null,
  payTransferAmount = null,
  deliveryMode,
  notes,
  items,
  total,
  couponCode,
  discountAmount = 0,
  totalBefore,
  whenMode,
  whenSlot,
}) {
  const lines = [];
  if (deliveryMode === "Retiro") {
    lines.push("RETIRO");
  }
  const nameWithTime = whenMode === "Mas tarde" && whenSlot
    ? `${name} (PARA ${whenSlot})`
    : name;
  lines.push(nameWithTime);
  lines.push("");

  if (notes && notes.trim()) {
    lines.push("ACLARACIONES");
    lines.push(notes.trim());
    lines.push("");
  }

  // OJO: una seccion solo sale si getCategory() (utils/itemGrouping.js) devuelve
  // su key para algun item del carrito. Estado real de cada una:
  //
  //   promos  → DADA DE BAJA (2026-08-14). Ya no se pueden agregar promos: la
  //             ruta /promos y el link del TopNav estan comentados. Se deja el
  //             render porque el carrito persiste en localStorage
  //             ("burgerya:cart:v1") y un cliente con carrito viejo todavia
  //             puede tener una promo adentro.
  //   combos  → CODIGO MUERTO. getCategory() NUNCA devuelve "combos": los items
  //             con meta.type === "combo" caen en el default y salen bajo
  //             BURGERS. Ademas pages/Combos no esta ruteada, o sea que ni
  //             siquiera se pueden agregar. Este titulo no se imprimio nunca.
  //             Va comentado para no confundir a quien lea la comanda.
  //   el resto → vivas y en uso.
  const groupOrder = [
    { key: "promos", title: "PROMOS" },
    // { key: "combos", title: "COMBOS C/ COCA" },
    { key: "burgers", title: "BURGERS" },
    { key: "papas", title: "PAPAS EXTRA" },
    { key: "dips", title: "EXTRAS" },
    { key: "bebidas", title: "BEBIDAS" },
  ];

  let hasGroup = false;
  const separator = "--------";
  for (const group of groupOrder) {
    const groupItems = items.filter((item) => getCategory(item) === group.key);
    if (!groupItems.length) continue;

    if (hasGroup) lines.push(separator);
    lines.push(group.title);
    hasGroup = true;

    // Rama inalcanzable: getCategory() nunca devuelve "combos" (ver groupOrder).
    // Queda comentada junto con formatComboGroup() en whatsappFormatters.js.
    // if (group.key === "combos") {
    //   lines.push(...formatComboGroup(groupItems));
    //   continue;
    // }

    for (const it of groupItems) {
      if (
        it.meta?.type === "dip" ||
        (it.meta?.type === "papas" && it.key?.startsWith("papas:dip_"))
      ) {
        // Extras/dips destacados
        const sizeLabel = getSizeLabel(it);
        const sizeSuffix = sizeLabel ? ` ${sizeLabel}` : "";
        lines.push(` ${it.qty} ${displayName(it.name).toUpperCase()}${sizeSuffix}`);
        if (it.note?.trim()) {
          lines.push(`  Aclaracion: ${it.note.trim()}`);
        }
        continue;
      }

      if (it.meta?.type === "promo") {
        const qtyPrefix = it.qty > 1 ? `${it.qty} ` : "";
        lines.push(`${qtyPrefix}${capitalize(displayName(it.name).toLowerCase())}:`);
        if (it.meta?.description) {
          lines.push(`  Incluye: ${it.meta.description}`);
        }
        if (it.meta?.kitchenItems?.length) {
          const kitchenLine = it.meta.kitchenItems
            .map((item) => `${item.qty * it.qty} ${item.label}`)
            .join(" + ");
          lines.push(`  Cocina: ${kitchenLine}`);
        }
      } else {
        const sizeLabel = it.meta?.burgerId === "cheese_promo" ? null : getSizeLabel(it);
        const sizeSuffix = sizeLabel ? ` ${sizeLabel}` : "";
        lines.push(`${it.qty} ${capitalize(displayName(it.name).toLowerCase())}${sizeSuffix}`);
      }

      if (it.removedIngredients?.length) {
        it.removedIngredients.forEach((removal) => {
          const label = removal.label || removal.name || removal.id || removal;
          lines.push(`- Sin ${label}`);
        });
      }

      if (it.meta?.picks?.length) {
        lines.push(...formatPromoPicks(it.meta.picks, it.meta?.type));
      } else {
        lines.push(...formatItemModifiers(it));
      }
      if (it.note?.trim()) {
        lines.push(`  Aclaracion: ${it.note.trim()}`);
      }
    }
  }

  lines.push("");
  if (deliveryMode !== "Retiro") {
    lines.push(address);
    if (cross && cross.trim()) {
      lines.push(cross.trim());
    }
    lines.push("");
  }
  const subtotal = totalBefore || total;
  if (discountAmount > 0 && couponCode) {
    lines.push(`Subtotal: ${formatMoney(subtotal)}`);
    lines.push(`Codigo ${couponCode}: -${formatMoney(discountAmount)}`);
  }
  if (pay === "Mixto" && payCashAmount != null && payTransferAmount != null) {
    lines.push(`${formatMoney(total)} (Efectivo ${formatMoney(payCashAmount)} + Transferencia ${formatMoney(payTransferAmount)})`);
  } else {
    lines.push(`${formatMoney(total)} ${pay}`);
  }
  return encodeURIComponent(lines.join("\n"));
}

import { formatMoney } from "./formatMoney";
import { getCategory } from "./itemGrouping";
import { getArgentinaName } from "./argentinaNames";
import { buildMapsLink } from "./checkoutTotals";
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

// `totals` es el objeto de computeCheckoutTotals (utils/checkoutTotals): los
// montos del mensaje son EXACTAMENTE los mismos que ve el cliente en pantalla.
// `location` ({ lat, lng }) son las coordenadas confirmadas del delivery.
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
  totals,
  couponCode,
  // Promo TEDEBEMOSUNA ({ code, lineKey }): marca en la comanda cuál doble va
  // triple sin cargo y suma la línea de promo en el bloque de totales.
  freeMeatPromo = null,
  whenMode,
  whenSlot,
  location = null,
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
      } else if (it.meta?.isCokePromo) {
        // Coca de promo: mostrar el label especial con todo en mayúsculas
        const promoLabel = it.meta?.cokePromoLabel || it.name;
        lines.push(`${it.qty} ${promoLabel}`);
      } else {
        const sizeLabel = it.meta?.burgerId === "cheese_promo" ? null : getSizeLabel(it);
        const sizeSuffix = sizeLabel ? ` ${sizeLabel}` : "";
        lines.push(`${it.qty} ${capitalize(displayName(it.name).toLowerCase())}${sizeSuffix}`);
        if (freeMeatPromo && it.key === freeMeatPromo.lineKey) {
          lines.push(
            it.qty > 1
              ? `  🎁 +1 carne GRATIS: 1 de las ${it.qty} va TRIPLE`
              : "  🎁 +1 carne GRATIS: va TRIPLE",
          );
        }
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
  lines.push(...formatDeliveryBlock({ deliveryMode, address, cross, location }));
  lines.push(
    ...formatTotalsBlock({
      deliveryMode,
      totals,
      couponCode,
      freeMeatPromo,
      pay,
      payCashAmount,
      payTransferAmount,
    }),
  );
  return encodeURIComponent(lines.join("\n"));
}

// "Calle A y Calle B" -> "Entre Calle A y Calle B" (si el cliente ya escribio
// "entre ..." no se duplica).
function formatCross(cross) {
  const text = String(cross ?? "").trim();
  if (!text) return null;
  return /^entre\b/i.test(text) ? `Entre${text.slice(5)}` : `Entre ${text}`;
}

// Bloque de entrega (solo Delivery): direccion tal cual la eligio/escribio el
// cliente, entrecalles si hay, y SIEMPRE el link con las coordenadas
// confirmadas cuando existen. Si no hay calle (GPS / pin sin reverse), no se
// inventa una direccion: el link del mapa es la ubicacion.
function formatDeliveryBlock({ deliveryMode, address, cross, location }) {
  if (deliveryMode !== "Delivery") return [];
  const lines = [];
  const mapsLink = buildMapsLink(location);
  const addressText = String(address ?? "").trim();
  if (addressText) {
    lines.push(addressText);
  } else if (mapsLink) {
    lines.push("Sin calle/altura: ver mapa");
  }
  const crossText = formatCross(cross);
  if (crossText) lines.push(crossText);
  if (mapsLink) lines.push(`Mapa: ${mapsLink}`);
  if (lines.length) lines.push("");
  return lines;
}

function formatPayment(pay, grandTotal, payCashAmount, payTransferAmount) {
  if (pay === "Mixto" && payCashAmount != null && payTransferAmount != null) {
    return `${formatMoney(grandTotal)} (Efectivo ${formatMoney(payCashAmount)} + Transferencia ${formatMoney(payTransferAmount)})`;
  }
  return `${formatMoney(grandTotal)} ${pay}`;
}

// Resumen financiero en un solo bloque: Subtotal, [Descuento], [Envio], Total.
// Retiro sin descuento queda como siempre: solo el total con la forma de pago.
function formatTotalsBlock({ deliveryMode, totals, couponCode, freeMeatPromo, pay, payCashAmount, payTransferAmount }) {
  const { productsSubtotal, discountAmount, deliveryFee, grandTotal } = totals;
  const isDelivery = deliveryMode === "Delivery";
  const hasDiscount = discountAmount > 0;
  const lines = [];
  if (isDelivery || hasDiscount) {
    lines.push(`Subtotal: ${formatMoney(productsSubtotal)}`);
  }
  if (hasDiscount) {
    const label = couponCode ? `Descuento ${couponCode}` : "Descuento";
    lines.push(`${label}: -${formatMoney(discountAmount)}`);
  }
  if (freeMeatPromo) {
    lines.push(`🎁 Promo ${freeMeatPromo.code}: +1 carne GRATIS`);
  }
  if (isDelivery) {
    lines.push(`Envío: ${formatMoney(deliveryFee)}`);
  }
  lines.push(`Total: ${formatPayment(pay, grandTotal, payCashAmount, payTransferAmount)}`);
  return lines;
}

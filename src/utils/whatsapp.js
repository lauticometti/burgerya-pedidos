import { formatMoney } from "./formatMoney";
import { getCategory } from "./itemGrouping";
import {
  getSizeLabel,
  formatComboGroup,
  formatPromoPicks,
  formatItemModifiers,
} from "./whatsappFormatters";

export function buildWhatsAppText({
  name,
  address,
  cross,
  pay,
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

  const groupOrder = [
    { key: "promos", title: "PROMOS" },
    { key: "combos", title: "COMBOS C/ COCA" },
    { key: "burgers", title: "BURGERS" },
    { key: "papas", title: "PAPAS" },
    { key: "dips", title: "EXTRAS" },
    { key: "bebidas", title: "BEBIDAS" },
  ];

  let hasGroup = false;
  const separator = "--------";
  for (const group of groupOrder) {
    const groupItems = items.filter((item) => getCategory(item) === group.key);
    if (!groupItems.length) continue;

    if (hasGroup) lines.push(separator);
    const isExtras = group.key === "dips";
    lines.push(isExtras ? `${group.title} ⚠️` : group.title);
    hasGroup = true;

    if (group.key === "combos") {
      lines.push(...formatComboGroup(groupItems));
      continue;
    }

    for (const it of groupItems) {
      if (it.meta?.type === "papas" && it.key?.startsWith("papas:dip_")) {
        // Extras/dips destacados
        const sizeLabel = getSizeLabel(it);
        const sizeSuffix = sizeLabel ? ` ${sizeLabel}` : "";
        lines.push(` ⚠️ ${it.qty} ${it.name.toUpperCase()}${sizeSuffix}`);
        if (it.note?.trim()) {
          lines.push(`  Aclaracion: ${it.note.trim()}`);
        }
        continue;
      }

      if (it.meta?.type === "promo") {
        const qtyPrefix = it.qty > 1 ? `${it.qty} ` : "";
        lines.push(`${qtyPrefix}${it.name.toLowerCase()}:`);
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
        const sizeLabel = getSizeLabel(it);
        const sizeSuffix = sizeLabel ? ` ${sizeLabel}` : "";
        lines.push(`${it.qty} ${it.name.toLowerCase()}${sizeSuffix}`);
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
  lines.push(`${formatMoney(total)} ${pay}`);
  return encodeURIComponent(lines.join("\n"));
}

import { formatMoney } from "./formatMoney";

export function buildWhatsAppText({
  name,
  address,
  cross,
  pay,
  deliveryMode,
  when,
  items,
  total,
  couponCode,
  discountAmount = 0,
  totalBefore,
}) {
  const lines = [];
  const isLater = typeof when === "string" && when.startsWith("Para mas tarde");
  const timeLabel = isLater ? when.replace("Para mas tarde", "PARA").trim() : "";
  const header = isLater ? `${name} - ${timeLabel}` : name;
  if (deliveryMode === "Retiro") {
    lines.push("RETIRO");
  }
  lines.push(header);
  lines.push("");

  function getSizeLabel(item) {
    if (item.meta?.size === "doble") return item.qty > 1 ? "dobles" : "doble";
    if (item.meta?.size === "triple") return item.qty > 1 ? "triples" : "triple";
    if (item.meta?.size === "simple") return item.qty > 1 ? "simples" : "simple";
    return "";
  }

  function getCategory(item) {
    if (item.meta?.type === "promo") return "promos";
    if (item.meta?.type === "combo") return "combos";
    if (item.meta?.type === "papas" && item.key?.startsWith("papas:dip_"))
      return "dips";
    if (item.meta?.type === "papas") return "papas";
    if (item.meta?.type === "bebida") return "bebidas";
    return "burgers";
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
      const bySize = new Map();
      for (const it of groupItems) {
        const size = it.meta?.size || "simple";
        if (!bySize.has(size)) bySize.set(size, { total: 0, burgers: new Map() });
        const bucket = bySize.get(size);
        bucket.total += it.qty;
        const name = (it.meta?.comboTitle || it.name || "").replace(/^combo\s*/i, "").trim();
        const burgerLabel = (it.meta?.burgerName || it.name?.split("·")[1] || it.name || "").trim();
        const key = burgerLabel.toLowerCase();
        bucket.burgers.set(key, {
          label: burgerLabel || name,
          qty: (bucket.burgers.get(key)?.qty || 0) + it.qty,
        });
      }

      const sizeLabels = {
        simple: { singular: "simple", plural: "simples" },
        doble: { singular: "doble", plural: "dobles" },
        triple: { singular: "triple", plural: "triples" },
      };

      for (const [size, data] of bySize.entries()) {
        const labelSet = sizeLabels[size] || { singular: size, plural: `${size}s` };
        const sizeLabel = data.total === 1 ? labelSet.singular : labelSet.plural;
        lines.push(`${data.total} ${sizeLabel}:`);
        for (const burger of data.burgers.values()) {
          const qtyPrefix = burger.qty > 1 ? `${burger.qty} ` : "1 ";
          lines.push(` · ${qtyPrefix}${burger.label.toUpperCase()}`);
        }
      }
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

      if (it.meta?.picks?.length) {
        const countByName = it.meta.picks.reduce((acc, pick) => {
          const key = (pick.name || pick.id || "").toLowerCase();
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {});
        const hasRepeats = Object.values(countByName).some((count) => count > 1);
        const promoQueue = new Map();

        for (const pick of it.meta.picks) {
          const pickName = pick.name || pick.id || "";
          const extrasKey = (pick.extras || [])
            .map((extra) => extra.name)
            .join("|")
            .toLowerCase();
          const papasKey = (pick.papas || [])
            .map((extra) => extra.name)
            .join("|")
            .toLowerCase();
          const noteKey = (pick.note || "").trim().toLowerCase();
          const baseKey = pickName.toLowerCase();
          const groupKey = hasRepeats
            ? `${baseKey}__${extrasKey}__${papasKey}__${noteKey}`
            : `${baseKey}__${promoQueue.size}`;

          if (!promoQueue.has(groupKey)) {
            promoQueue.set(groupKey, { name: pickName, picks: [pick] });
          } else {
            promoQueue.get(groupKey).picks.push(pick);
          }
        }

        for (const pickGroup of promoQueue.values()) {
          const qtyPrefix = `${pickGroup.picks.length} `;
          const pickLine = ` · ${qtyPrefix}${pickGroup.name.toUpperCase()}`;
          lines.push(pickLine);
          const joiner = it.meta?.type === "promo" ? " / " : " + ";

          const samplePick = pickGroup.picks[0];
          if (samplePick.extras?.length) {
            lines.push(
              `  Agregados: ${samplePick.extras
                .map((extra) => extra.name)
                .join(joiner)}`,
            );
          }
          if (samplePick.papas?.length) {
            lines.push(
              `  Mejorar papas: ${samplePick.papas
                .map((extra) => extra.name)
                .join(joiner)}`,
            );
          }
          if (samplePick.note?.trim()) {
            lines.push(`  Aclaracion: ${samplePick.note.trim()}`);
          }
        }
      } else {
        const joiner = it.meta?.type === "promo" ? " / " : " + ";
        if (it.extras?.length) {
          lines.push(
            `  Agregados: ${it.extras.map((extra) => extra.name).join(joiner)}`,
          );
        }
        if (it.papas?.length) {
          lines.push(
            `  Mejorar papas: ${it.papas.map((extra) => extra.name).join(joiner)}`,
          );
        }
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

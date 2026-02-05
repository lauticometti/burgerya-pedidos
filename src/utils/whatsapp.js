import { formatMoney } from "./formatMoney";

export function buildWhatsAppText({
  name,
  address,
  cross,
  pay,
  when,
  items,
  total,
  orderId,
}) {
  const safeOrderId = orderId || "1";
  const lines = [];
  const isLater = typeof when === "string" && when.startsWith("Para más tarde");
  const timeLabel = isLater
    ? when.replace("Para más tarde", "PARA").trim()
    : "";
  const header = isLater ? `${name} - ${timeLabel}` : name;
  lines.push(`#${safeOrderId}`);
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
    if (item.meta?.type === "papas" && item.key?.startsWith("papas:dip_"))
      return "dips";
    if (item.meta?.type === "papas") return "papas";
    return "burgers";
  }

  const groupOrder = [
    { key: "promos", title: "PROMOS" },
    { key: "burgers", title: "BURGERS" },
    { key: "papas", title: "PAPAS" },
    { key: "dips", title: "DIPS" },
  ];

  let hasGroup = false;
  for (const group of groupOrder) {
    const groupItems = items.filter((item) => getCategory(item) === group.key);
    if (!groupItems.length) continue;

    if (hasGroup) lines.push("");
    lines.push(group.title);
    hasGroup = true;

    for (const it of groupItems) {
      if (it.meta?.type === "promo") {
        lines.push(`${it.name.toLowerCase()}:`);
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
          const qtyPrefix = hasRepeats ? `${pickGroup.picks.length} ` : "";
          lines.push(`* ${qtyPrefix}${pickGroup.name.toUpperCase()}`.trim());
          const joiner = it.meta?.type === "promo" ? " / " : " + ";

          const samplePick = pickGroup.picks[0];
          if (samplePick.extras?.length) {
            lines.push(
              `    Agregados: ${samplePick.extras
                .map((extra) => extra.name)
                .join(joiner)}`,
            );
          }
          if (samplePick.papas?.length) {
            lines.push(
              `    Mejorar papas: ${samplePick.papas
                .map((extra) => extra.name)
                .join(joiner)}`,
            );
          }
          if (samplePick.note?.trim()) {
            lines.push(`    Aclaración: ${samplePick.note.trim()}`);
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
        lines.push(`  Aclaración: ${it.note.trim()}`);
      }
    }
  }

  lines.push("");
  lines.push(address);
  if (cross && cross.trim()) {
    lines.push(cross.trim());
  }

  lines.push("");
  lines.push(`${formatMoney(total)} ${pay}`);
  return encodeURIComponent(lines.join("\n"));
}

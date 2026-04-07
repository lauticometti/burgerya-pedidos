/**
 * WhatsApp message formatters for different item types
 * Extracted from buildWhatsAppText to reduce complexity
 */

/**
 * Get size label for an item (simple, doble, triple)
 */
export function getSizeLabel(item) {
  if (item.meta?.size === "doble") return item.qty > 1 ? "dobles" : "doble";
  if (item.meta?.size === "triple") return item.qty > 1 ? "triples" : "triple";
  if (item.meta?.size === "simple") return item.qty > 1 ? "simples" : "simple";
  return "";
}

/**
 * Format combo items (groupable by size)
 */
export function formatComboGroup(items) {
  const lines = [];
  const bySize = new Map();

  for (const it of items) {
    const size = it.meta?.size || "simple";
    if (!bySize.has(size)) bySize.set(size, { total: 0, burgers: new Map() });
    const bucket = bySize.get(size);
    bucket.total += it.qty;

    const name = (it.meta?.comboTitle || it.name || "")
      .replace(/^combo\s*/i, "")
      .trim();
    const burgerLabel = (
      it.meta?.burgerName ||
      it.name?.split("·")[1] ||
      it.name ||
      ""
    ).trim();

    const removalLabels = (it.removedIngredients || [])
      .map((rem) => rem.label || rem.name || rem.id || rem)
      .filter(Boolean);
    const removalKey = removalLabels.join("|").toLowerCase();
    const key = removalKey
      ? `${burgerLabel.toLowerCase()}__rm__${removalKey}`
      : burgerLabel.toLowerCase();

    const entry = bucket.burgers.get(key) || {
      label: burgerLabel || name,
      qty: 0,
      notes: [],
      removed: removalLabels,
    };
    entry.qty += it.qty;
    entry.removed = removalLabels;

    const noteText = (it.note || "").trim();
    if (noteText) {
      const noteKey = noteText.toLowerCase();
      const existing = entry.notes.find((n) => n.key === noteKey);
      if (existing) existing.qty += it.qty;
      else entry.notes.push({ key: noteKey, text: noteText, qty: it.qty });
    }
    bucket.burgers.set(key, entry);
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

      if (burger.removed?.length) {
        burger.removed.forEach((removal) => {
          lines.push(`    - Sin ${removal}`);
        });
      }
      if (burger.notes?.length) {
        burger.notes.forEach((note) => {
          const noteQtyPrefix = note.qty > 1 ? `${note.qty}× ` : "";
          lines.push(`    Aclaracion: ${noteQtyPrefix}${note.text}`);
        });
      }
    }
  }

  return lines;
}

/**
 * Format promo picks (with deduplication)
 */
export function formatPromoPicks(picks, itemType) {
  const lines = [];
  const countByName = picks.reduce((acc, pick) => {
    const key = (pick.name || pick.id || "").toLowerCase();
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const hasRepeats = Object.values(countByName).some((count) => count > 1);
  const promoQueue = new Map();

  picks.forEach((pick, idx) => {
    const pickName = pick.name || pick.id || "";
    const extrasKey = (pick.extras || [])
      .map((extra) => extra.name)
      .sort()
      .join("|")
      .toLowerCase();
    const papasKey = (pick.papas || [])
      .map((extra) => extra.name)
      .sort()
      .join("|")
      .toLowerCase();
    const removedKey = (pick.removedIngredients || [])
      .map((rem) => rem.label || rem.name || rem.id || rem)
      .sort()
      .join("|")
      .toLowerCase();
    const noteKey = (pick.note || "").trim().toLowerCase();
    const baseKey = pickName.toLowerCase();
    const signature = `${baseKey}__${extrasKey}__${papasKey}__${removedKey}__${noteKey}`;
    const groupKey = hasRepeats ? signature : `${signature}__${idx}`;

    if (!promoQueue.has(groupKey)) {
      promoQueue.set(groupKey, { name: pickName, picks: [pick] });
    } else {
      promoQueue.get(groupKey).picks.push(pick);
    }
  });

  const joiner = itemType === "promo" ? " / " : " + ";

  for (const pickGroup of promoQueue.values()) {
    const qtyPrefix = `${pickGroup.picks.length} `;
    const pickLine = ` · ${qtyPrefix}${pickGroup.name.toUpperCase()}`;
    lines.push(pickLine);

    const samplePick = pickGroup.picks[0];
    if (samplePick.removedIngredients?.length) {
      samplePick.removedIngredients.forEach((removal) => {
        const label = removal.label || removal.name || removal.id || removal;
        lines.push(`  - Sin ${label}`);
      });
    }
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

  return lines;
}

/**
 * Format extra modifiers for an item (extras, papas)
 */
export function formatItemModifiers(item) {
  const lines = [];
  const joiner = item.meta?.type === "promo" ? " / " : " + ";

  if (item.extras?.length) {
    lines.push(`  Agregados: ${item.extras.map((extra) => extra.name).join(joiner)}`);
  }
  if (item.papas?.length) {
    lines.push(
      `  Mejorar papas: ${item.papas.map((extra) => extra.name).join(joiner)}`,
    );
  }

  return lines;
}

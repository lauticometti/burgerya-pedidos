/**
 * Sub-components for displaying item modifications
 * Extracted from CartItemCard to reduce complexity
 */

import styles from "./CartItemCard.module.css";

/**
 * Display removed ingredients list
 */
export function RemovedIngredientsList({ items }) {
  if (!items?.length) return null;

  return (
    <div className={styles.removedList}>
      {items.map((rem) => (
        <div key={rem.id || rem.label} className={styles.removedLine}>
          - Sin {rem.label || rem.id}
        </div>
      ))}
    </div>
  );
}

/**
 * Display extras/adds list
 */
export function ExtrasList({ items, joiner = " + " }) {
  if (!items?.length) return null;

  return (
    <div className={styles.metaSmall}>
      Agregados: {items.map((extra) => extra.name).join(joiner)}
    </div>
  );
}

/**
 * Display papas upgrades
 */
export function PapasList({ items, joiner = " + " }) {
  if (!items?.length) return null;

  return (
    <div className={styles.metaSmall}>
      Mejorar papas: {items.map((extra) => extra.name).join(joiner)}
    </div>
  );
}

/**
 * Display item note/observation
 */
export function ItemNote({ text }) {
  if (!text?.trim()) return null;

  return (
    <div className={styles.metaSmall}>
      Aclaración: {text.trim()}
    </div>
  );
}

/**
 * Display all modifiers for an item
 */
export function ItemModifiersDisplay({
  removedIngredients = [],
  extras = [],
  papas = [],
  note = "",
  joiner = " + ",
}) {
  return (
    <>
      <RemovedIngredientsList items={removedIngredients} />
      <ExtrasList items={extras} joiner={joiner} />
      <PapasList items={papas} joiner={joiner} />
      <ItemNote text={note} />
    </>
  );
}

/**
 * Sub-components for displaying item modifications
 * Extracted from CartItemCard to reduce complexity
 */

import styles from "./CartItemCard.module.css";
import { FRIES_UPGRADE_LABELS } from "../../utils/friesUpgrade";

/**
 * Display removed ingredients list
 */
export function RemovedIngredientsList({ items }) {
  if (!items?.length) return null;

  return (
    <div className={styles.metaSmall}>
      Sin: {items.map((rem) => rem.label || rem.id).join(", ")}
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
 * Display papas upgrades — "Papas mejoradas: Cheddar + Bacon".
 * Va aparte de ExtrasList a proposito: lo que se le suma a las papas incluidas
 * no es lo mismo que lo que se le suma a la burger.
 */
export function PapasList({ items, joiner = " + " }) {
  if (!items?.length) return null;

  return (
    <div className={styles.metaSmall}>
      {FRIES_UPGRADE_LABELS.cartLine}:{" "}
      {items.map((extra) => extra.name).join(joiner)}
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

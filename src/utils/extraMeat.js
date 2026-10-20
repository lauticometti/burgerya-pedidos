// Tope de "Carne c/cheddar" (extra) por burger: el cliente puede agregar
// todas las que quiera, hasta sumar un total de MAX_TOTAL_PATTIES carnes
// contando la/s que ya trae el talle elegido. Una simple admite mas extras
// que una triple porque ya arranca con menos carne adentro.
export const EXTRA_MEAT_ID = "carne_cheddar";

export const MAX_TOTAL_PATTIES = 6;

const BASE_PATTIES_BY_SIZE = { simple: 1, doble: 2, triple: 3 };

// Tamaño desconocido (ej. promos viejas sin size): asume el minimo (1 carne
// de base), el escenario mas permisivo, para no bloquear sin querer.
export function getMaxExtraMeat(size) {
  const base = BASE_PATTIES_BY_SIZE[size] ?? 1;
  return Math.max(0, MAX_TOTAL_PATTIES - base);
}

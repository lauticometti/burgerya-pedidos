// Agrupa agregados repetidos (ej. 3x "Carne c/cheddar") para que las listas
// de extras no repitan el mismo nombre una vez por unidad: "Carne c/cheddar
// x3 + Cheddar" en vez de "Carne c/cheddar + Carne c/cheddar + Carne
// c/cheddar + Cheddar". Conserva el orden del primer agregado de cada nombre.
export function formatExtrasNames(extras = [], joiner = " + ") {
  const order = [];
  const counts = new Map();
  for (const extra of extras || []) {
    const name = extra?.name ?? extra?.id;
    if (!name) continue;
    if (!counts.has(name)) {
      counts.set(name, 0);
      order.push(name);
    }
    counts.set(name, counts.get(name) + 1);
  }
  return order
    .map((name) => (counts.get(name) > 1 ? `${name} x${counts.get(name)}` : name))
    .join(joiner);
}

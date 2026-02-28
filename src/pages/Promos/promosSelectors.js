export function indexBurgersById(list) {
  return list.reduce((acc, burger) => {
    acc[burger.id] = burger;
    return acc;
  }, {});
}

export function groupAllowedBurgers(list, allowedTiers = []) {
  const grouped = { BASICA: [], PREMIUM: [], DELUXE: [] };
  list.forEach((burger) => {
    if (allowedTiers.includes(burger.tier)) {
      grouped[burger.tier].push(burger);
    }
  });
  return grouped;
}

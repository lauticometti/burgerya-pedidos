export function formatPickNames(picks = []) {
  return picks
    .map((pick) => {
      if (typeof pick === "string") return pick;
      if (pick?.name) return pick.name;
      if (pick?.id) return pick.id;
      return String(pick);
    })
    .join(" / ");
}


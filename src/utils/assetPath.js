export function resolvePublicPath(pathname = "") {
  if (!pathname) return pathname;
  if (pathname.startsWith("http")) return pathname;
  if (pathname.startsWith("data:")) return pathname;
  if (!pathname.startsWith("/")) return pathname;
  const base = import.meta.env.BASE_URL || "/";
  return `${base}${pathname.slice(1)}`;
}

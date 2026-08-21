import { NavLink } from "react-router-dom";
import styles from "./TopNav.module.css";

const LINKS = [
  { to: "/", label: "Menu", ariaLabel: "Menu" },
  // PROMOS DADAS DE BAJA (2026-08-14). Este era el unico camino clickeable que
  // quedaba: la home no muestra TopNav (usa SectionNav), pero /envios y /papas si,
  // asi que desde el link de envios se llegaba a Promos en 2 clicks.
  // Para reactivar: descomentar aca y la ruta en src/App.jsx.
  // { to: "/promos", label: "Promos" },
  { to: "/papas", label: "Papas y mas" },
];

export default function TopNav() {
  return (
    <nav className={styles.nav} aria-label="Navegacion principal">
      {LINKS.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          aria-label={link.ariaLabel}
          className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ""}`}>
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}

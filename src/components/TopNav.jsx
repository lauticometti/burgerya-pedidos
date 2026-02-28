import { NavLink } from "react-router-dom";
import styles from "./TopNav.module.css";

const LINKS = [
  { to: "/", label: "Menu", ariaLabel: "Menu" },
  { to: "/promos", label: "Promos" },
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
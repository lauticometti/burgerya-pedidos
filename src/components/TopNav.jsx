import { NavLink } from "react-router-dom";
import styles from "./TopNav.module.css";

const LINKS = [
  { to: "/", label: "Inicio" },
  { to: "/burgers", label: "Burgers" },
  { to: "/promos", label: "Promos" },
  { to: "/papas", label: "Papas y más" },
];

export default function TopNav() {
  return (
    <nav className={styles.nav} aria-label="Navegación principal">
      {LINKS.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) =>
            `${styles.link} ${isActive ? styles.active : ""}`
          }>
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}

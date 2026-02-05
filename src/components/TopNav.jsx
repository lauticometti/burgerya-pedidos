import { NavLink } from "react-router-dom";
import styles from "./TopNav.module.css";

const LINKS = [
  { to: "/", label: "Inicio", ariaLabel: "Inicio", isHome: true },
  { to: "/burgers", label: "Burgers" },
  { to: "/promos", label: "Promos" },
  { to: "/papas", label: "Papas y más" },
];

function HomeIcon() {
  return (
    <svg
      className={styles.homeIcon}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false">
      <path d="M12 3 2.5 11h2v9h6v-6h3v6h6v-9h2L12 3z" />
    </svg>
  );
}

export default function TopNav() {
  return (
    <nav className={styles.nav} aria-label="Navegación principal">
      {LINKS.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          aria-label={link.ariaLabel}
          className={({ isActive }) =>
            `${styles.link} ${link.isHome ? styles.homeLink : ""} ${
              isActive ? styles.active : ""
            }`
          }>
          {link.isHome ? <HomeIcon /> : link.label}
        </NavLink>
      ))}
    </nav>
  );
}

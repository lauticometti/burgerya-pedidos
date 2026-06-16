import styles from "./SectionNav.module.css";

const SECTIONS = [
  { id: "burgers", label: "Burgers" },
  { id: "papas", label: "Papas" },
  { id: "dips", label: "Dips" },
  { id: "bebidas", label: "Bebidas" },
  { id: "cervezas", label: "Cervezas" },
];

export default function SectionNav({ active, onSelect }) {
  return (
    <nav className={styles.nav} aria-label="Navegacion por secciones">
      {SECTIONS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          className={`${styles.chip} ${active === id ? styles.chipActive : ""}`}
          onClick={() => onSelect(id)}
          aria-current={active === id ? "true" : undefined}>
          {label}
        </button>
      ))}
    </nav>
  );
}

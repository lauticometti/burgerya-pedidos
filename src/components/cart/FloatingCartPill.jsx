import React from "react";
import { Link } from "react-router-dom";
import { formatMoney } from "../../utils/formatMoney";
import styles from "./FloatingCartPill.module.css";

function BagIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false">
      <path
        d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="3"
        y1="6"
        x2="21"
        y2="6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M16 10a4 4 0 01-8 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function FloatingCartPill({ total, itemCount, visible }) {
  if (!visible) return null;

  return (
    <Link to="/carrito" className={styles.pill} aria-label={`Ver pedido — ${formatMoney(total)}`}>
      <span className={styles.icon}>
        <BagIcon />
      </span>
      <span className={styles.label}>Ver pedido</span>
      <span className={styles.divider} aria-hidden="true" />
      <span className={styles.total}>{formatMoney(total)}</span>
      <span className={styles.badge} aria-label={`${itemCount} items`}>
        {itemCount > 9 ? "9+" : itemCount}
      </span>
    </Link>
  );
}

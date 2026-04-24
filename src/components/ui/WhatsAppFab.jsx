import React from "react";
import { useLocation } from "react-router-dom";
import { WHATSAPP_NUMBER } from "../../data/menu";
import styles from "./WhatsAppFab.module.css";

const DEFAULT_MESSAGE = "Hola! Queria consultar por un pedido";
const HIDDEN_PATHS = new Set(["/carrito", "/dbadmin"]);

export default function WhatsAppFab() {
  const { pathname } = useLocation();

  if (HIDDEN_PATHS.has(pathname)) return null;

  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(DEFAULT_MESSAGE)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={styles.fab}
      aria-label="Consultar por WhatsApp"
      data-event="wa-fab-click">
      <img
        src="/whatsapp.svg"
        alt=""
        className={styles.icon}
        aria-hidden="true"
      />
    </a>
  );
}

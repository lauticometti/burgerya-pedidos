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
      <svg
        className={styles.icon}
        viewBox="0 0 32 32"
        aria-hidden="true"
        focusable="false">
        <path
          fill="currentColor"
          d="M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 0 1-.315-.1c-.802-.402-1.504-.817-2.163-1.426-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 0 1-.073-.215c0-.33.99-.945.99-1.49 0-.143-.73-2.09-.832-2.335-.143-.372-.214-.487-.6-.487-.187 0-.36-.043-.53-.043-.302 0-.53.115-.746.315-.688.645-1.032 1.318-1.06 2.264v.114c-.015.99.472 1.977 1.017 2.78 1.23 1.82 2.506 3.41 4.554 4.34.616.287 2.035.91 2.722.91.8 0 2.45-.477 2.45-1.978 0-.602-1.26-1.09-1.436-1.09zM16.08 6.5C10.66 6.5 6.24 10.92 6.24 16.34c0 1.9.53 3.76 1.534 5.36L6.14 26.47l4.84-1.62a9.844 9.844 0 0 0 5.1 1.42c5.42 0 9.84-4.42 9.84-9.84 0-5.42-4.42-9.93-9.84-9.93zm0 17.98a8.09 8.09 0 0 1-4.39-1.28l-.32-.18-3.14 1.05 1.04-3.04-.2-.33a8.14 8.14 0 1 1 7.01 3.78zM16.08 4.5c-6.54 0-11.84 5.3-11.84 11.84 0 2.08.54 4.1 1.57 5.9L4 28l5.9-1.76a11.84 11.84 0 0 0 5.78 1.47h.01c6.54 0 11.85-5.3 11.85-11.84 0-3.17-1.23-6.14-3.47-8.38A11.77 11.77 0 0 0 16.08 4.5z"
        />
      </svg>
    </a>
  );
}

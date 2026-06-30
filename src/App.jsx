import { Routes, Route } from "react-router-dom";
import ToastHost from "./components/ToastHost/ToastHost";
import WhatsAppFab from "./components/ui/WhatsAppFab";
import Menu from "./pages/Menu/Menu";
import Promos from "./pages/Promos/Promos";
import Carrito from "./pages/Carrito/Carrito";
import Papas from "./pages/Papas/Papas";
import Admin from "./pages/Admin/Admin";
import Envios from "./pages/Envios/Envios";

// Para reactivar el sitio: cambiar MAINTENANCE_MODE a false
const MAINTENANCE_MODE = false;

// Cierre especial — para desactivar: cambiar EVENT_MODE_ACTIVE a false
const EVENT_MODE_ACTIVE = true;

function EventPage() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f0f0f",
        color: "#fff",
        padding: "2.5rem 1.25rem 3rem",
        fontFamily: "inherit",
        boxSizing: "border-box",
        maxWidth: "480px",
        margin: "0 auto",
        gap: 0,
      }}>

      {/* Logo */}
      <img
        src="/logo.png"
        alt="Burger Ya"
        style={{ width: 64, marginBottom: "2rem" }}
        onError={(e) => { e.target.style.display = "none"; }}
      />

      {/* Aviso en rojo */}
      <div style={{
        background: "#FF3131",
        borderRadius: "10px",
        padding: "1.5rem 1.75rem",
        textAlign: "center",
        marginBottom: "1.5rem",
        width: "100%",
        boxSizing: "border-box",
      }}>
        <p style={{
          fontSize: "clamp(1.1rem, 5vw, 1.35rem)",
          fontWeight: 900,
          color: "#fff",
          margin: "0 0 0.5rem",
          lineHeight: 1.25,
          letterSpacing: "-0.01em",
        }}>
          Este martes no abrimos.
        </p>
        <p style={{
          fontSize: "clamp(1rem, 4.5vw, 1.2rem)",
          fontWeight: 700,
          color: "#fff",
          margin: 0,
          lineHeight: 1.3,
        }}>
          Volvemos miércoles mediodía y noche.
        </p>
      </div>

      {/* CTA WhatsApp */}
      <a
        href="https://wa.me/5491134158607"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "block",
          width: "100%",
          padding: "1rem",
          background: "#25D366",
          color: "#fff",
          fontWeight: 900,
          fontSize: "1rem",
          borderRadius: "8px",
          textDecoration: "none",
          textAlign: "center",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          boxSizing: "border-box",
        }}>
        Escribinos por WhatsApp
      </a>

    </div>
  );
}

function MaintenancePage() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f0f0f",
        color: "#fff",
        textAlign: "center",
        padding: "2rem",
        gap: "1.25rem",
        fontFamily: "inherit",
      }}>
      <img
        src="/logo.png"
        alt="Burger Ya"
        style={{ width: 80, marginBottom: "0.25rem" }}
        onError={(e) => {
          e.target.style.display = "none";
        }}
      />
      <h1
        style={{
          fontSize: "clamp(1.5rem, 5vw, 2rem)",
          fontWeight: 800,
          margin: 0,
          letterSpacing: "-0.02em",
          lineHeight: 1.2,
        }}>
        Burger Ya vuelve en unas horas
      </h1>
      <p
        style={{
          fontSize: "clamp(0.9rem, 3vw, 1rem)",
          color: "#999",
          margin: 0,
          maxWidth: 340,
          lineHeight: 1.6,
        }}>
        Estamos actualizando el sistema de pedidos.
      </p>
      <a
        href="https://wa.me/5491134158607"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          marginTop: "0.5rem",
          display: "inline-block",
          padding: "0.75rem 1.5rem",
          background: "#fff",
          color: "#0f0f0f",
          fontWeight: 700,
          fontSize: "0.95rem",
          borderRadius: "999px",
          textDecoration: "none",
          letterSpacing: "0.01em",
        }}>
        Para pedir, escribinos por WhatsApp
      </a>
    </div>
  );
}

export default function App() {
  if (MAINTENANCE_MODE) return <MaintenancePage />;
  if (EVENT_MODE_ACTIVE) return <EventPage />;

  return (
    <>
      <ToastHost />
      <Routes>
        <Route path="/" element={<Menu />} />
        <Route path="/promos" element={<Promos />} />
        <Route path="/carrito" element={<Carrito />} />
        <Route path="/papas" element={<Papas />} />
        <Route path="/envios" element={<Envios />} />
        <Route path="/dbadmin" element={<Admin />} />
      </Routes>
      <WhatsAppFab />
    </>
  );
}

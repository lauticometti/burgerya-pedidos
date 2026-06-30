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

// Dia de la Hamburguesa — para desactivar: cambiar EVENT_MODE_ACTIVE a false
const EVENT_MODE_ACTIVE = false;

function EventPage() {
  const block = {
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: "12px",
    padding: "1.25rem 1.5rem",
    textAlign: "left",
  };
  const label = {
    fontSize: "0.7rem",
    fontWeight: 700,
    letterSpacing: "0.12em",
    color: "#FFC62A",
    textTransform: "uppercase",
    marginBottom: "0.4rem",
  };
  const title = { fontSize: "1rem", fontWeight: 700, color: "#fff", margin: "0 0 0.2rem" };
  const sub = { fontSize: "0.85rem", color: "#aaa", margin: 0 };

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
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

      {/* Titulo evento */}
      <div style={{ marginBottom: "0.75rem" }}>
        <span style={{
          display: "inline-block",
          fontSize: "0.7rem",
          fontWeight: 700,
          letterSpacing: "0.14em",
          color: "#FF3131",
          textTransform: "uppercase",
          marginBottom: "0.6rem",
        }}>
          28 de mayo
        </span>
      </div>
      <h1 style={{
        fontSize: "clamp(1.75rem, 8vw, 2.5rem)",
        fontWeight: 900,
        margin: "0 0 1rem",
        letterSpacing: "-0.02em",
        lineHeight: 1.1,
        textAlign: "center",
        color: "#FFC62A",
      }}>
        HOY ES EL DIA<br />DE LA HAMBURGUESA
      </h1>

      {/* Mensaje principal */}
      <p style={{
        fontSize: "clamp(0.95rem, 4vw, 1.1rem)",
        color: "#ccc",
        margin: "0 0 0.5rem",
        textAlign: "center",
        lineHeight: 1.6,
        maxWidth: 320,
      }}>
        Hoy no tomamos pedidos por la web.
      </p>
      <p style={{
        fontSize: "clamp(1rem, 4.5vw, 1.15rem)",
        fontWeight: 700,
        color: "#fff",
        margin: "0 0 0.35rem",
        textAlign: "center",
      }}>
        Te esperamos en Burger Ya.
      </p>

      {/* Direccion */}
      <p style={{
        fontSize: "0.9rem",
        color: "#FFC62A",
        fontWeight: 600,
        margin: "0 0 2rem",
        textAlign: "center",
        letterSpacing: "0.02em",
      }}>
        Malaspina 1602, Hurlingham
      </p>

      {/* Bloques de horario */}
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "2rem" }}>

        <div style={{ ...block, borderColor: "#FF3131", borderWidth: "1px" }}>
          <p style={{ ...label, color: "#FF3131" }}>Desde las 20 hs</p>
          <p style={title}>Burger Ya x DrinksT6</p>
          <p style={sub}>burgers · tragos · musica · en la esquina</p>
        </div>

      </div>

      {/* CTA principal */}
      <a
        href="https://maps.google.com/?q=Malaspina+1602+Hurlingham+Buenos+Aires"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "block",
          width: "100%",
          padding: "1rem",
          background: "#FFC62A",
          color: "#0f0f0f",
          fontWeight: 900,
          fontSize: "1rem",
          borderRadius: "8px",
          textDecoration: "none",
          textAlign: "center",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          marginBottom: "0.75rem",
          boxSizing: "border-box",
        }}>
        VENI AL LOCAL
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

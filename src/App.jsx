import { Routes, Route } from "react-router-dom";
import ToastHost from "./components/ToastHost/ToastHost";
import WhatsAppFab from "./components/ui/WhatsAppFab";
import Menu from "./pages/Menu/Menu";
import Promos from "./pages/Promos/Promos";
import Carrito from "./pages/Carrito/Carrito";
import Papas from "./pages/Papas/Papas";
import Admin from "./pages/Admin/Admin";
import Envios from "./pages/Envios/Envios";

const MAINTENANCE_MODE = true;

function MaintenancePage() {
  return (
    <div style={{
      minHeight: "100dvh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "#111",
      color: "#fff",
      textAlign: "center",
      padding: "2rem",
      gap: "1rem",
    }}>
      <img
        src="/logo.png"
        alt="Burger Ya"
        style={{ width: 90, marginBottom: "0.5rem" }}
        onError={(e) => { e.target.style.display = "none"; }}
      />
      <h1 style={{ fontSize: "1.6rem", fontWeight: 700, margin: 0 }}>
        Estamos en mantenimiento
      </h1>
      <p style={{ fontSize: "1rem", color: "#aaa", margin: 0, maxWidth: 320 }}>
        Volvemos a las <strong style={{ color: "#fff" }}>15:00 hs</strong>.
        <br />Disculpa las molestias.
      </p>
    </div>
  );
}

export default function App() {
  if (MAINTENANCE_MODE) {
    return <MaintenancePage />;
  }

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



import { Routes, Route } from "react-router-dom";
import ToastHost from "./components/ToastHost/ToastHost";
import WhatsAppFab from "./components/ui/WhatsAppFab";
import Menu from "./pages/Menu/Menu";
import Promos from "./pages/Promos/Promos";
import Carrito from "./pages/Carrito/Carrito";
import Papas from "./pages/Papas/Papas";
import Admin from "./pages/Admin/Admin";
import Envios from "./pages/Envios/Envios";

export default function App() {
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



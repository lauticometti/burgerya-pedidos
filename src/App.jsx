import { Routes, Route } from "react-router-dom";
import ToastHost from "./components/ToastHost/ToastHost";
import Burgers from "./pages/Burgers/Burgers";
import Promos from "./pages/Promos/Promos";
import Combos from "./pages/Combos/Combos";
import Carrito from "./pages/Carrito/Carrito";
import Papas from "./pages/Papas/Papas";
import Admin from "./pages/Admin/Admin";
import Envios from "./pages/Envios/Envios";
import { papas } from "./data/menu";
import { useCart } from "./store/useCart";
import useCartPromotions from "./hooks/useCartPromotions";

function PromoWatcher() {
  const cart = useCart();
  useCartPromotions(cart, { papasList: papas });
  return null;
}

export default function App() {
  return (
    <>
      <ToastHost />
      <PromoWatcher />
      <Routes>
        <Route path="/" element={<Burgers />} />
        <Route path="/promos" element={<Promos />} />
        <Route path="/combos" element={<Combos />} />
        <Route path="/carrito" element={<Carrito />} />
        <Route path="/papas" element={<Papas />} />
        <Route path="/envios" element={<Envios />} />
        <Route path="/dbadmin" element={<Admin />} />
      </Routes>
    </>
  );
}



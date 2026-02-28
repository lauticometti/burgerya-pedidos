import { Routes, Route } from "react-router-dom";
import ToastHost from "./components/ToastHost/ToastHost";
import Burgers from "./pages/Burgers/Burgers";
import Promos from "./pages/Promos/Promos";
import Carrito from "./pages/Carrito/Carrito";
import Papas from "./pages/Papas/Papas";

export default function App() {
  return (
    <>
      <ToastHost />
      <Routes>
        <Route path="/" element={<Burgers />} />
        <Route path="/promos" element={<Promos />} />
        <Route path="/carrito" element={<Carrito />} />
        <Route path="/papas" element={<Papas />} />
      </Routes>
    </>
  );
}



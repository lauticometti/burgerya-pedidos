import { Routes, Route } from "react-router-dom";
import ToastHost from "./components/ToastHost/ToastHost";
import Home from "./pages/Home";
import Burgers from "./pages/Burgers/Burgers";
import Promos from "./pages/Promos";
import Checkout from "./pages/Checkout";
import Extras from "./pages/Extras";
import Papas from "./pages/Papas/Papas";

export default function App() {
  return (
    <>
      <ToastHost />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/burgers" element={<Burgers />} />
        <Route path="/promos" element={<Promos />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/extras" element={<Extras />} />
        <Route path="/papas" element={<Papas />} />
      </Routes>
    </>
  );
}

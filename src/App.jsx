import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import ToastHost from "./components/ToastHost/ToastHost";
import MovingNoticeGate from "./components/notice/MovingNoticeGate";
import Home from "./pages/Home/Home";
import Burgers from "./pages/Burgers/Burgers";
import Promos from "./pages/Promos/Promos";
import Carrito from "./pages/Carrito/Carrito";
import Papas from "./pages/Papas/Papas";

const MOVING_NOTICE_SESSION_KEY = "burgerya-moving-notice-seen";

export default function App() {
  const [showMovingNotice, setShowMovingNotice] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.sessionStorage.getItem(MOVING_NOTICE_SESSION_KEY) !== "1";
  });

  const handleDismissMovingNotice = () => {
    setShowMovingNotice(false);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(MOVING_NOTICE_SESSION_KEY, "1");
    }
  };

  return (
    <>
      <ToastHost />
      {showMovingNotice ? (
        <MovingNoticeGate onContinue={handleDismissMovingNotice} />
      ) : null}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/burgers" element={<Burgers />} />
        <Route path="/promos" element={<Promos />} />
        <Route path="/carrito" element={<Carrito />} />
        <Route path="/papas" element={<Papas />} />
      </Routes>
    </>
  );
}



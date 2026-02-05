import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { CartProvider } from "./store/CartProvider.jsx";
import "./styles/global.module.css";

const baseUrl = import.meta.env.BASE_URL;
const basename = baseUrl === "/" ? "/" : baseUrl.replace(/\/$/, "");

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <CartProvider>
        <App />
      </CartProvider>
    </BrowserRouter>
  </React.StrictMode>,
);

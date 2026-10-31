import React from "react";

// Red de seguridad: sin esto, cualquier error sin atrapar en el render deja
// la pantalla completamente en blanco (React desmonta todo el árbol), sin
// ningún aviso para quien está mirando. Con esto al menos se ve un mensaje
// y un botón para reintentar, en vez de una pantalla muerta.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("Error sin atrapar en la app:", error, info?.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          padding: 24,
          textAlign: "center",
          background: "#0b0b0b",
          color: "#f5f5f5",
          fontFamily: "sans-serif",
        }}>
        <p style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
          Algo salió mal al cargar la página.
        </p>
        <p style={{ fontSize: 14, opacity: 0.75, margin: 0, maxWidth: 320 }}>
          Probá recargar. Si sigue sin funcionar, escribinos por WhatsApp para hacer el pedido.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            padding: "10px 20px",
            borderRadius: 10,
            border: "none",
            background: "#ffc62a",
            color: "#0b0b0b",
            fontWeight: 800,
            fontSize: 15,
            cursor: "pointer",
          }}>
          Recargar
        </button>
      </div>
    );
  }
}

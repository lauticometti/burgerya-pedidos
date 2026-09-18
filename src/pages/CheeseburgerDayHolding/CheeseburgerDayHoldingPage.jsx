export default function CheeseburgerDayHoldingPage() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        background: "#0b0b0b",
        color: "#f5f5f5",
        padding: "0.8rem 1rem 1.5rem",
        fontFamily: "inherit",
        boxSizing: "border-box",
        maxWidth: "520px",
        margin: "0 auto",
      }}>

      {/* Logo */}
      <img
        src="/favicon.svg"
        alt="Burger Ya"
        style={{ width: 52, marginBottom: "0.8rem", opacity: 0.95 }}
        onError={(e) => { e.target.style.display = "none"; }}
      />

      {/* Título principal + Subtítulo */}
      <h1
        style={{
          fontSize: "clamp(1.8rem, 8.5vw, 2.6rem)",
          fontWeight: 900,
          margin: "0 0 0.2rem",
          letterSpacing: "-0.025em",
          lineHeight: 1.05,
          textAlign: "center",
          color: "#ffc62a",
          textTransform: "uppercase",
        }}>
        Cheeseburger<br />Day
      </h1>

      <p
        style={{
          fontSize: "clamp(0.85rem, 3vw, 0.95rem)",
          color: "#ccc",
          margin: "0.3rem 0 0.8rem",
          textAlign: "center",
          lineHeight: 1.3,
          fontWeight: 600,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
        }}>
        Solo Cheese · Solo Doble
      </p>

      {/* Imagen de la Cheese */}
      <div
        style={{
          width: "100%",
          maxWidth: "240px",
          marginBottom: "0.7rem",
          display: "flex",
          justifyContent: "center",
          minHeight: "160px",
        }}>
        <img
          src="/burgers/cheese.svg"
          alt="Cheese Doble + Papas"
          style={{
            width: "100%",
            height: "auto",
            objectFit: "contain",
          }}
          onError={(e) => { e.target.style.display = "none"; }}
        />
      </div>

      {/* Nombre y precio del producto */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "0.9rem",
          width: "100%",
        }}>
        <p
          style={{
            fontSize: "clamp(0.8rem, 2.5vw, 0.9rem)",
            color: "#ccc",
            margin: "0 0 0.15rem",
            fontWeight: 600,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}>
          Cheese Doble + Papas
        </p>
        <p
          style={{
            fontSize: "clamp(1.75rem, 8vw, 2.8rem)",
            fontWeight: 900,
            margin: "0",
            color: "#ffc62a",
            letterSpacing: "-0.02em",
          }}>
          $10.000
        </p>
      </div>

      {/* Opciones de retiro y delivery */}
      <div
        style={{
          width: "100%",
          display: "flex",
          gap: "0.8rem",
          justifyContent: "center",
          marginBottom: "0.8rem",
          fontSize: "clamp(0.75rem, 2vw, 0.85rem)",
        }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ margin: "0 0 0.1rem", fontWeight: 700, color: "#ffc62a" }}>
            RETIRO
          </p>
          <p style={{ margin: 0, color: "#aaa", fontSize: "0.85em" }}>
            Desde 1
          </p>
        </div>
        <div
          style={{
            width: "1px",
            backgroundColor: "rgba(255, 255, 255, 0.15)",
          }}
        />
        <div style={{ textAlign: "center" }}>
          <p style={{ margin: "0 0 0.1rem", fontWeight: 700, color: "#ffc62a" }}>
            DELIVERY
          </p>
          <p style={{ margin: 0, color: "#aaa", fontSize: "0.85em" }}>
            Desde 2
          </p>
        </div>
      </div>

      {/* Horario de pedidos + Mensaje */}
      <p
        style={{
          fontSize: "clamp(0.9rem, 2.8vw, 1.05rem)",
          fontWeight: 800,
          margin: "0 0 0.2rem",
          textAlign: "center",
          color: "#fff",
          letterSpacing: "0.02em",
          textTransform: "uppercase",
        }}>
        Pedidos desde 19:30
      </p>

      <p
        style={{
          fontSize: "0.75rem",
          color: "#999",
          margin: "0 0 0.9rem",
          textAlign: "center",
          fontStyle: "italic",
          maxWidth: 280,
        }}>
        En unos minutos habilitamos los pedidos.
      </p>

      {/* Lema final */}
      <p
        style={{
          fontSize: "clamp(1rem, 3.2vw, 1.25rem)",
          fontWeight: 800,
          margin: "0",
          textAlign: "center",
          color: "#ffc62a",
          letterSpacing: "0.03em",
          textTransform: "uppercase",
          lineHeight: 1.25,
        }}>
        Hasta donde dé la cocina
      </p>

    </div>
  );
}

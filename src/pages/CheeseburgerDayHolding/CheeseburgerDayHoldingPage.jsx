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
        padding: "1.5rem 1rem 2rem",
        fontFamily: "inherit",
        boxSizing: "border-box",
        maxWidth: "520px",
        margin: "0 auto",
        gap: "0.5rem",
      }}>

      {/* Logo pequeño */}
      <img
        src="/logo.png"
        alt="Burger Ya"
        style={{ width: 56, marginBottom: "1rem" }}
        onError={(e) => { e.target.style.display = "none"; }}
      />

      {/* Título principal */}
      <h1
        style={{
          fontSize: "clamp(1.75rem, 8.5vw, 2.8rem)",
          fontWeight: 900,
          margin: "0 0 0.3rem",
          letterSpacing: "-0.025em",
          lineHeight: 1.1,
          textAlign: "center",
          color: "#ffc62a",
          textTransform: "uppercase",
        }}>
        Cheeseburger<br />Day
      </h1>

      {/* Subtítulo */}
      <p
        style={{
          fontSize: "clamp(0.95rem, 3.5vw, 1.15rem)",
          color: "#ccc",
          margin: "0 0 1.5rem",
          textAlign: "center",
          lineHeight: 1.4,
          fontWeight: 600,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
        }}>
        Solo Cheese.<br />Solo Doble.
      </p>

      {/* Imagen de la Cheese */}
      <div
        style={{
          width: "100%",
          maxWidth: "300px",
          marginBottom: "1.5rem",
          display: "flex",
          justifyContent: "center",
        }}>
        <img
          src="/burgers/cheese-simple-promo.png"
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
          marginBottom: "1.75rem",
          width: "100%",
        }}>
        <p
          style={{
            fontSize: "clamp(0.9rem, 2.8vw, 1rem)",
            color: "#ccc",
            margin: "0 0 0.4rem",
            fontWeight: 600,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}>
          Cheese Doble + Papas
        </p>
        <p
          style={{
            fontSize: "clamp(2rem, 9vw, 3.2rem)",
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
          gap: "1rem",
          justifyContent: "center",
          marginBottom: "1.75rem",
          fontSize: "clamp(0.85rem, 2.5vw, 0.95rem)",
        }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ margin: "0 0 0.2rem", fontWeight: 700, color: "#ffc62a" }}>
            RETIRO
          </p>
          <p style={{ margin: 0, color: "#aaa", fontSize: "0.9em" }}>
            Desde 1 combo
          </p>
        </div>
        <div
          style={{
            width: "1px",
            backgroundColor: "rgba(255, 255, 255, 0.15)",
          }}
        />
        <div style={{ textAlign: "center" }}>
          <p style={{ margin: "0 0 0.2rem", fontWeight: 700, color: "#ffc62a" }}>
            DELIVERY
          </p>
          <p style={{ margin: 0, color: "#aaa", fontSize: "0.9em" }}>
            Desde 2 combos
          </p>
        </div>
      </div>

      {/* Horario de pedidos */}
      <p
        style={{
          fontSize: "clamp(1rem, 3vw, 1.25rem)",
          fontWeight: 800,
          margin: "0 0 1rem",
          textAlign: "center",
          color: "#fff",
          letterSpacing: "0.02em",
          textTransform: "uppercase",
        }}>
        Pedidos desde 19:30
      </p>

      {/* Mensaje temporal */}
      <p
        style={{
          fontSize: "0.85rem",
          color: "#999",
          margin: "0 0 1.5rem",
          textAlign: "center",
          fontStyle: "italic",
          maxWidth: 280,
        }}>
        En unos minutos habilitamos los pedidos.
      </p>

      {/* Lema final */}
      <p
        style={{
          fontSize: "clamp(1.1rem, 3.5vw, 1.4rem)",
          fontWeight: 800,
          margin: "0",
          textAlign: "center",
          color: "#ffc62a",
          letterSpacing: "0.03em",
          textTransform: "uppercase",
          lineHeight: 1.3,
        }}>
        Hasta donde dé<br />la cocina.
      </p>

    </div>
  );
}

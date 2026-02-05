import { Link } from "react-router-dom";
import Button from "../ui/Button";
import styles from "./CarritoHeader.module.css";

export default function CarritoHeader({ onClear }) {
  return (
    <div className={styles.header}>
      <div className={styles.left}>
        <Link to="/">
          <Button>Volver</Button>
        </Link>
        <Button onClick={onClear}>Vaciar</Button>
      </div>
    </div>
  );
}





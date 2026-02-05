import Card from "../ui/Card";
import StepDots from "../ui/StepDots";
import styles from "./PromoStepCard.module.css";

export default function PromoStepCard({ step, total = 4, helpText }) {
  return (
    <Card className={styles.card}>
      <div className={styles.meta}>
        Paso {step}/{total} - Seguís {total} pasos rápidos para armar tu promo.
        Te guiamos.
      </div>
      <StepDots total={total} active={step} />
      <div className={styles.help}>{helpText}</div>
    </Card>
  );
}


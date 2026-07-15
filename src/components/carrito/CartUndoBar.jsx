import Button from "../ui/Button";
import ProductName from "../ui/ProductName";

export default function CartUndoBar({
  label,
  onUndo,
  className,
  textClassName,
  buttonClassName,
}) {
  return (
    <div className={className}>
      <div className={textClassName}>
        Se eliminó{" "}
        {label ? (
          <ProductName inline name={label.name} suffix={label.suffix} />
        ) : (
          ""
        )}
        .
      </div>
      <Button size="xs" className={buttonClassName} onClick={onUndo}>
        Deshacer
      </Button>
    </div>
  );
}

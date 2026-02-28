import Button from "../ui/Button";

export default function CartUndoBar({
  label,
  onUndo,
  className,
  textClassName,
  buttonClassName,
}) {
  return (
    <div className={className}>
      <div className={textClassName}>Se eliminó {label}.</div>
      <Button size="xs" className={buttonClassName} onClick={onUndo}>
        Deshacer
      </Button>
    </div>
  );
}

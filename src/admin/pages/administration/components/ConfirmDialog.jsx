import { Button, Dialog, DialogActions } from "../../../ui";

/*
 * Confirmação de ação destrutiva. O botão repete o verbo do
 * título ("Excluir horário"), nunca um "Confirmar" genérico.
 */
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = title,
  onCancel,
  onConfirm,
}) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <DialogActions>
          <Button onClick={onCancel}>Cancelar</Button>

          <Button variant="primary" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </DialogActions>
      }
    >
      <p className="text-sm text-ink">{description}</p>
    </Dialog>
  );
}

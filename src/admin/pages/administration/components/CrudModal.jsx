import { Button, Dialog, DialogActions } from "../../../ui";

export default function CrudModal({
  open,
  title,
  children,
  onClose,
  onSave,
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>

          <Button variant="primary" onClick={onSave}>
            Salvar
          </Button>
        </DialogActions>
      }
    >
      <div className="space-y-5">{children}</div>
    </Dialog>
  );
}

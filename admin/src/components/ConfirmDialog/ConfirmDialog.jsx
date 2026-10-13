import Modal from '../Modal/Modal.jsx';
import Button from '../Button/Button.jsx';

const ConfirmDialog = ({ open, title = 'Are you sure?', message, confirmLabel = 'Confirm', danger = true, busy = false, onConfirm, onCancel }) => (
  <Modal
    open={open}
    title={title}
    onClose={onCancel}
    footer={
      <>
        <Button variant="ghost" onClick={onCancel} disabled={busy}>Cancel</Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={busy}>{confirmLabel}</Button>
      </>
    }
  >
    <p className="muted">{message}</p>
  </Modal>
);

export default ConfirmDialog;

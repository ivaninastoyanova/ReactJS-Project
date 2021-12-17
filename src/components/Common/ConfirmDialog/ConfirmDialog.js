import { Modal, Button } from 'react-bootstrap';
import "./ConfirmDialog.css";

const ConfirmDialog = ({
    show,
    onClose,
    onSave,
}) => {
    return (
        <Modal dialogClassName="modal-container" show={show} onHide={onClose}>
            <Modal.Header dialogClassName="modal-header" >
                <Modal.Title dialogClassName="modal-title">Confirm Dialog</Modal.Title>
            </Modal.Header>

            <Modal.Body dialogClassName="modal-text-container">
                <p dialogClassName="modal-text">Are you sure you want to delete this recipe?</p>
            </Modal.Body>

            <Modal.Footer dialogClassName="modal-footer">
                <Button  dialogClassName="modal-cancel" variant="secondary" onClick={onClose}>Cancel</Button>
                <Button dialogClassName="modal-delete" variant="primary" onClick={onSave}>Delete</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ConfirmDialog;


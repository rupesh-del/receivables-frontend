import React from "react";
import Modal from "react-modal"; // Make sure to install react-modal
import "./styles/modal.css"; // Add your styles for the modal

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm }) => {
  return (
    <Modal isOpen={isOpen} onRequestClose={onClose} className="modal" overlayClassName="overlay">
      <h2>Confirm Deletion</h2>
      <p>Are you sure you want to delete this invoice?</p>
      <button onClick={onConfirm}>Yes, Delete</button>
      <button onClick={onClose}>Cancel</button>
    </Modal>
  );
};

export default DeleteConfirmationModal;
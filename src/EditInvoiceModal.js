import React, { useState, useEffect } from "react";
import Modal from "react-modal"; // Make sure to install react-modal
import "./styles/modal.css"; // Add your styles for the modal

const EditInvoiceModal = ({ isOpen, onClose, invoice, onSubmit }) => {
  const [item, setItem] = useState("");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (invoice) {
      setItem(invoice.item);
      setAmount(invoice.amount);
    }
  }, [invoice]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...invoice, item, amount });
  };

  return (
    <Modal isOpen={isOpen} onRequestClose={onClose} className="modal" overlayClassName="overlay">
      <h2>Edit Invoice</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Item:</label>
          <input
            type="text"
            value={item}
            onChange={(e) => setItem(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Amount:</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
        <button type="submit">Save Changes</button>
        <button type="button" onClick={onClose}>Cancel</button>
      </form>
    </Modal>
  );
};

export default EditInvoiceModal;
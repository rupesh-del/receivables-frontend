import React from "react";
import axios from "axios";

Modal.setAppElement("#root"); // ✅ Fixes the warning

const DeleteInvoiceModal = ({ invoice, onClose, fetchInvoices }) => {
  const handleDelete = async () => {
    try {
      await axios.delete(`https://receivables-api.onrender.com/invoices/${invoice.id}`);
      fetchInvoices();
      onClose();
    } catch (error) {
      console.error("Error deleting invoice:", error);
    }
  };

  return (
    <div className="modal">
      <h2>Confirm Delete</h2>
      <p>Are you sure you want to delete invoice {invoice.invoice_number}?</p>
      <button onClick={handleDelete}>Yes, Delete</button>
      <button onClick={onClose}>Cancel</button>
    </div>
  );
};

export default DeleteInvoiceModal;

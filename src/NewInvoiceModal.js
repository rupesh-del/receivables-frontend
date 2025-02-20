import React, { useState } from "react";
import "./styles/NewInvoiceModal.css";

const NewInvoiceModal = ({ isOpen, onClose, onSubmit, clients }) => {
  const [invoices, setInvoices] = useState([
    {
      client_id: "",
      invoice_number: generateInvoiceNumber(),
      item: "",
      amount: "",
      due_date: "",
    },
  ]);

  // Function to generate a unique invoice number
  function generateInvoiceNumber() {
    return `INV-${Math.floor(Math.random() * 90000) + 10000}`;
  }

  // Handle input changes for each invoice
  const handleChange = (index, e) => {
    const { name, value } = e.target;
    const updatedInvoices = [...invoices];
    updatedInvoices[index][name] = value;
    setInvoices(updatedInvoices);
  };

  // Add a new invoice entry (Limit to 5)
  const addMoreInvoices = () => {
    if (invoices.length < 5) {
      setInvoices([
        ...invoices,
        {
          client_id: "",
          invoice_number: generateInvoiceNumber(),
          item: "",
          amount: "",
          due_date: "",
        },
      ]);
    }
  };

  // Remove an invoice entry
  const removeInvoice = (index) => {
    const updatedInvoices = invoices.filter((_, i) => i !== index);
    setInvoices(updatedInvoices);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit(invoices);
    onClose(); // ✅ Close modal after submission
  };

  // Prevent rendering when modal is not active
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>New Invoice</h3>

        <form onSubmit={handleSubmit}>
          {invoices.map((invoice, index) => (
            <div key={index} className="invoice-group">
              <select name="client_id" value={invoice.client_id} onChange={(e) => handleChange(index, e)}>
                <option value="">Select Client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.full_name} ({client.address})
                  </option>
                ))}
              </select>

              <input type="text" name="invoice_number" value={invoice.invoice_number} readOnly />
              <input type="text" name="item" placeholder="Item Description" value={invoice.item} onChange={(e) => handleChange(index, e)} />
              <input type="number" name="amount" placeholder="Amount" value={invoice.amount} onChange={(e) => handleChange(index, e)} />
              <input type="date" name="due_date" value={invoice.due_date} onChange={(e) => handleChange(index, e)} />

              {index > 0 && (
                <button type="button" className="remove-btn" onClick={() => removeInvoice(index)}>
                  ❌ Remove
                </button>
              )}
            </div>
          ))}

          {invoices.length < 5 && (
            <button type="button" className="add-more-btn" onClick={addMoreInvoices}>
              ➕ Add More
            </button>
          )}

          <button type="submit" className="submit-btn">Add Invoice(s)</button>
          <button type="button" className="close-btn" onClick={onClose}>Cancel</button>
        </form>
      </div>
    </div>
  );
};

export default NewInvoiceModal;

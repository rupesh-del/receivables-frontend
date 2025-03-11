import React, { useState, useEffect } from "react";
import "./styles/NewPaymentModal.css";
import Select from "react-select";

const NewPaymentModal = ({ isOpen, onClose, selectedInvoices = [] }) => {
  const [clients, setClients] = useState([]);
  const [allInvoices, setAllInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState("");
  const [mode, setMode] = useState("Cash");
  const [amount, setAmount] = useState("");
  const [payments, setPayments] = useState([]);

  // ✅ Fetch Clients (Once)
  useEffect(() => {
    fetch("https://receivables-api.onrender.com/clients")
      .then((res) => res.json())
      .then(setClients)
      .catch((err) => console.error("❌ Error fetching clients:", err));
  }, []);

  // ✅ Fetch Invoices (Once)
  useEffect(() => {
    fetch("https://receivables-api.onrender.com/invoices")
      .then((res) => res.json())
      .then(setAllInvoices)
      .catch((err) => console.error("❌ Error fetching invoices:", err));
  }, []);

  // ✅ Update filtered invoices when client changes
  useEffect(() => {
    if (!selectedClient) {
      setFilteredInvoices([]);
      return;
    }

    const clientInvoices = allInvoices.filter(
      (inv) => inv.client_id === Number(selectedClient)
    );

    const unpaidInvoices = clientInvoices.filter((inv) => {
      const balanceOutstanding = (inv.amount || 0) - (inv.total_paid || 0);
      return balanceOutstanding > 0;
    });

    setFilteredInvoices(unpaidInvoices);
    setPayments([]); // ✅ Reset payments when client changes
  }, [selectedClient, allInvoices]);

  // ✅ Auto-fill invoices when modal opens (Only for preselected invoices)
  useEffect(() => {
    if (!selectedInvoices.length || !allInvoices.length) return;

    const firstInvoice = allInvoices.find((inv) => inv.id === selectedInvoices[0]);

    if (firstInvoice) {
      setSelectedClient(firstInvoice.client_id);

      setPayments(
        selectedInvoices.map((invoiceId) => {
          const invoice = allInvoices.find((inv) => inv.id === invoiceId);
          return invoice
            ? {
                invoice_id: invoice.id,
                mode: "Cash",
                amount: invoice.amount - (invoice.total_paid || 0),
              }
            : null;
        }).filter(Boolean)
      );
    }
  }, [selectedInvoices, allInvoices]);

  // ✅ Auto-fill amount when selecting an invoice
  useEffect(() => {
    if (!selectedInvoice) return;
    
    const invoice = filteredInvoices.find((inv) => inv.id === Number(selectedInvoice));
    if (invoice) {
      const balanceOutstanding = invoice.amount - (invoice.total_paid || 0);
      setAmount(balanceOutstanding); // ✅ Auto-fill amount but keep editable
    }
  }, [selectedInvoice, filteredInvoices]);

  // ✅ Update Payment Amount (Editable)
  const updatePaymentAmount = (index, newAmount) => {
    setPayments((prevPayments) =>
      prevPayments.map((payment, i) =>
        i === index ? { ...payment, amount: parseFloat(newAmount) || 0 } : payment
      )
    );
  };

  // ✅ Add Payment (Manually)
  const addPayment = () => {
    if (!selectedInvoice || !amount || amount <= 0) {
      alert("Please enter a valid amount and select an invoice.");
      return;
    }
  
    // Check if invoice already exists in payments
    const existingPaymentIndex = payments.findIndex(p => p.invoice_id === Number(selectedInvoice));
  
    if (existingPaymentIndex !== -1) {
      alert("This invoice has already been added for payment.");
      return;
    }
  
    // Add new payment entry
    setPayments(prev => [
      ...prev,
      {
        invoice_id: Number(selectedInvoice),
        mode,
        amount: parseFloat(amount)
      }
    ]);
  
    // Reset input fields for next entry
    setSelectedInvoice("");
    setAmount("");
  };
  

  // ✅ Submit Payments to Backend
  const submitPayments = async () => {
    if (payments.length === 0) {
      alert("Please add at least one payment before submitting.");
      return;
    }
  
    try {
      const response = await fetch("https://receivables-api.onrender.com/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payments),
      });
  
      const result = await response.json();
  
      if (!response.ok) {
        console.error("❌ API Error:", result);
        alert(`Error: ${result.error || "Failed to submit payments."}`);
        return;
      }
  
      alert("Payments successfully added!");
      handleClose();
    } catch (error) {
      console.error("❌ Network or API Error:", error);
      alert("A network error occurred while adding payments.");
    }
  };
  
  const refreshInvoices = async () => {
    try {
      const res = await fetch("https://receivables-api.onrender.com/invoices");
      const updatedInvoices = await res.json();
      setAllInvoices(updatedInvoices); // ✅ Update state with new invoices
    } catch (err) {
      console.error("❌ Error refreshing invoices:", err);
    }
  };
  
  // ✅ Reset Modal on Close
  const handleClose = () => {
    setSelectedClient("");
    setSelectedInvoice("");
    setMode("Cash");
    setAmount("");
    setPayments([]);
  
    refreshInvoices(); // ✅ Refresh invoices after closing modal
  
    onClose();
  };
  
  const clientOptions = clients.map(({ id, full_name }) => ({
    value: id,
    label: full_name,
  }));

  const removePayment = (index) => {
    setPayments(prev => prev.filter((_, i) => i !== index));
  };
  
  return isOpen ? (
    <div className="modal-overlay active">
      <div className="modal-content">
        <h3>New Payment</h3>
  
        <div className="popup-body">
          {/* ✅ Searchable Client Lookup */}
          <label className="modal-label">Client:</label>
          <Select
            options={clientOptions}
            value={clientOptions.find((option) => option.value === selectedClient)}
            onChange={(selectedOption) => setSelectedClient(selectedOption?.value || "")}
            placeholder="Search & Select Client"
            isClearable
          />
  
          {/* ✅ Invoice Selection (Filtered by Client) */}
          <label>Invoice:</label>
          <select 
          className="invoice-dropdown"
  value={selectedInvoice} 
  onChange={(e) => setSelectedInvoice(e.target.value)} 
  disabled={!selectedClient || filteredInvoices.length === 0}
>
  <option value="">Select Invoice</option>
  {filteredInvoices.map(({ id, invoice_number, amount, total_paid }) => {
    const balanceOutstanding = amount - (total_paid || 0);

    // ✅ Check if the invoice is already added to payments
    const isAlreadySelected = payments.some(payment => payment.invoice_id === id);

    return (
      <option key={id} value={id} disabled={isAlreadySelected}>
        {invoice_number} (Remaining: ${balanceOutstanding.toFixed(2)}) {isAlreadySelected ? " - (Already Selected)" : ""}
      </option>
    );
  })}
</select>
  
          {/* ✅ Mode of Payment */}
          <label>Mode of Payment:</label>
          <select className="payment-mode-dropdown" value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="Cash">Cash💵</option>
            <option value="MMG">MMG📱</option>
            <option value="Bank">Bank🏦</option>
            <option value="Other">Other🔃</option>
          </select>
  
          {/* ✅ Payment Amount */}
          <label>Amount:</label>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount" />
  
          <button className="add-payment-btn" onClick={addPayment}>
            Add Payment
          </button>
        </div>
  {/* ✅ List Added Payments Before Submission */}
{payments.length > 0 && (
  <div className="payment-list">
    <h4>Payments to be Submitted💵:</h4>
    <ul>
      {payments.map(({ invoice_id, mode, amount }, index) => (
        <li key={index}>
          <strong>Invoice:</strong> {invoice_id} | <strong>Mode:</strong> {mode} | <strong>Amount:</strong> ${amount}
          <button onClick={() => removePayment(index)} className="remove-btn">❌</button>
        </li>
      ))}
    </ul>
  </div>
)}

        {/* ✅ Footer Buttons */}
        <div className="popup-footer">
{/* ✅ Footer Buttons Proper Layout */}
<div className="modal-buttons">
  <button className="submit-payment-btn" onClick={submitPayments}>Submit Payments✔️</button>
  <button className="cancel-btn" onClick={handleClose}>Cancel❌</button>
</div>
        </div>
      </div>
    </div>
  ) : null;
};

export default NewPaymentModal;
import React, { useState, useEffect } from "react";
import "./styles/NewPaymentModal.css";

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

    setPayments((prev) => [
      ...prev,
      { invoice_id: Number(selectedInvoice), mode, amount: parseFloat(amount) },
    ]);

    setSelectedInvoice("");
    setAmount("");
  };

  // ✅ Submit Payments to Backend
  const submitPayments = async () => {
    if (!payments.length) {
      alert("Please add at least one payment.");
      return;
    }

    try {
      const response = await fetch("https://receivables-api.onrender.com/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payments.map(payment => ({
          invoice_id: payment.invoice_id,
          mode: payment.mode,
          amount: parseFloat(payment.amount),
        }))),
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

  // ✅ Reset Modal on Close
  const handleClose = () => {
    setSelectedClient("");
    setSelectedInvoice("");
    setMode("Cash");
    setAmount("");
    setPayments([]);
    onClose();
  };

  return isOpen ? (
    <div className="popup">
      <div className="popup-content">
        <h3>New Payment</h3>

        {/* ✅ Client Selection (Now Editable) */}
        <label>Client:</label>
        <select
          value={selectedClient}
          onChange={(e) => setSelectedClient(e.target.value)}
        >
          <option value="">Select Client</option>
          {clients.map(({ id, full_name }) => (
            <option key={id} value={id}>
              {full_name}
            </option>
          ))}
        </select>

        {/* ✅ Auto-Filled Invoices */}
        {payments.length > 0 && (
          <div className="payment-list">
            <h4>Pending Payments:</h4>
            <ul>
              {payments.map(({ invoice_id, mode, amount }, index) => (
                <li key={index}>
                  Invoice: {invoice_id} | Mode: {mode} | Amount: 
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => updatePaymentAmount(index, e.target.value)}
                    className="amount-input"
                  />
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ✅ Invoice Selection (Filtered by Client) */}
        <label>Invoice:</label>
        <select
          value={selectedInvoice}
          onChange={(e) => setSelectedInvoice(e.target.value)}
          disabled={!selectedClient || filteredInvoices.length === 0}
        >
          <option value="">Select Invoice</option>
          {filteredInvoices.map(({ id, invoice_number, amount, total_paid }) => {
            const balanceOutstanding = amount - (total_paid || 0);
            return (
              <option key={id} value={id}>
                {invoice_number} (Remaining: ${balanceOutstanding.toFixed(2)})
              </option>
            );
          })}
        </select>

        {/* ✅ Payment Mode Selection */}
        <label>Mode of Payment:</label>
        <select value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="Cash">Cash</option>
          <option value="MMG">MMG</option>
          <option value="Bank">Bank</option>
          <option value="Other">Other</option>
        </select>

        {/* ✅ Payment Amount (Auto-filled & Editable) */}
        <label>Amount:</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount"
        />

        {/* ✅ Add Payment Button */}
        <button className="add-more-btn" onClick={addPayment}>
          Add Payment
        </button>

        {/* ✅ Submit & Close Buttons */}
        <button className="submit-btn" onClick={submitPayments}>
          Submit Payments
        </button>
        <button className="close-btn" onClick={handleClose}>
          Cancel
        </button>
      </div>
    </div>
  ) : null;
};

export default NewPaymentModal;

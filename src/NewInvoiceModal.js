import React, { useState, useEffect } from "react";
import "./styles/NewInvoiceModal.css";

const NewInvoiceModal = ({ isOpen, onClose, onSubmit, clients, }) => {
  console.log("🟢 NewInvoiceModal Rendered | isOpen:", isOpen);

  // ✅ Initial State
  const initialInvoice = {
    client_id: "", // ✅ No more auto-filling with clientId
    client_name: "", // ✅ No pre-filled client name
    invoice_number: generateInvoiceNumber(),
    item: "",
    amount: "",
    due_date: "",
  };
  
  
  const [invoices, setInvoices] = useState([initialInvoice]);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState(""); // ✅ Track search input per invoice
  const [filteredClients, setFilteredClients] = useState([]); // ✅ Store matched clients
  const [selectedClient, setSelectedClient] = useState(null); // ✅ Chosen client

  useEffect(() => {
    console.log("📢 Modal Visibility Changed | isOpen:", isOpen);
    if (!isOpen) {
      console.log("🔄 Resetting Modal State...");
      setInvoices([initialInvoice]); // ✅ Reset to initial state when closing
      setError(""); // ✅ Clear errors
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredClients([]); // ✅ Clear results if empty
    } else {
      const matches = clients.filter(client =>
        client.full_name.toLowerCase().includes(searchQuery.toLowerCase()) // ✅ Match dynamically
      );
      setFilteredClients(matches);
    }
  }, [searchQuery, clients]);
  

  // ✅ Generate Unique Invoice Number
  function generateInvoiceNumber() {
    return `INV-${Math.floor(Math.random() * 90000) + 10000}`;
  }

  // ✅ Prevent rendering when modal is closed
  if (!isOpen) {
    console.log("❌ Modal is closed, returning null...");
    return null;
  }

  console.log("✅ Modal is Open! Rendering Invoice Form...");

  // ✅ Handle input changes for each invoice
  const handleChange = (index, e) => {
    const { name, value } = e.target;
    const updatedInvoices = [...invoices];
    updatedInvoices[index][name] = value;
    setInvoices(updatedInvoices);
  };

  // ✅ Add a new invoice entry (Limit to 5)
  const addMoreInvoices = () => {
    if (invoices.length < 5) {
      const newInvoice = {
        client_id: "",
        invoice_number: generateInvoiceNumber(),
        item: "",
        amount: "",
        due_date: "",
      };
      setInvoices([...invoices, newInvoice]);
      console.log("➕ Added new invoice:", newInvoice);
    }
  };

  // ✅ Remove an invoice entry
  const removeInvoice = (index) => {
    const updatedInvoices = invoices.filter((_, i) => i !== index);
    setInvoices(updatedInvoices);
    console.log("❌ Removed Invoice at index:", index);
  };

// ✅ Handle form submission
const handleSubmit = async (e) => {
  e.preventDefault();

  console.log("🚀 Submitting Invoices:", invoices);

  // Validate input fields
  if (invoices.some(inv => !inv.client_id || !inv.item || !inv.amount || !inv.due_date)) {
    setError("⚠️ All fields are required for each invoice.");
    console.log("❌ Validation Failed: Missing Fields");
    return;
  }

  // ✅ REMOVE `invoice_number` BEFORE SENDING
  const cleanedInvoices = invoices.map(({ client_id, item, amount, due_date, status }) => ({
    client_id,
    item,
    amount: Number(amount),  // ✅ Ensure `amount` is a number
    due_date,
    status: status || "Pending" // ✅ Default status if not provided
  }));

  console.log("📤 FINAL CLEANED DATA TO API:", JSON.stringify(cleanedInvoices, null, 2)); // ✅ Debugging

  try {
    console.log("📤 Sending Invoices to API...");
    await onSubmit(cleanedInvoices);
    console.log("✅ Submission Successful! Closing Modal...");
    setError("");

    // ✅ Reset State After Submission
    setInvoices([initialInvoice]);  
    onClose();
  } catch (error) {
    console.error("❌ Submission Failed:", error);
    setError("⚠️ Error submitting invoices. Please try again.");
  }
};

const handleSearch = (index, query) => {
  if (!clients || !Array.isArray(clients) || clients.length === 0) {
    console.warn("❌ Clients data is not available yet. Skipping search.");
    return; // ✅ Prevents running filter on an empty or undefined array
  }

  setInvoices(prevInvoices =>
    prevInvoices.map((invoice, i) =>
      i === index ? { ...invoice, client_name: query } : invoice
    )
  );

  if (query.trim() === "") {
    setFilteredClients([]); // ✅ Clear results if empty
    return;
  }

  const matches = clients.filter(client =>
    client.full_name.toLowerCase().includes(query.toLowerCase())
  );
  setFilteredClients(matches);
};


const selectClient = (index, client) => {
  setInvoices(prevInvoices =>
    prevInvoices.map((invoice, i) =>
      i === index
        ? { ...invoice, client_id: client.id, client_name: client.full_name }
        : invoice
    )
  );
  setFilteredClients([]); // ✅ Hide dropdown after selection
};


  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>New Invoice</h3>
        {error && <p style={{ color: "red", fontWeight: "bold" }}>{error}</p>}

        <form onSubmit={handleSubmit}>
          {invoices.map((invoice, index) => (
            <div key={index} className="invoice-group">
{/* ✅ Client Search Input (Per Invoice) */}
<input
  type="text"
  placeholder="Search Client by Name"
  value={invoices[index].client_name || ""}
  onChange={(e) => handleSearch(index, e.target.value)}
/>


{/* ✅ Display Search Results (Only for the Active Invoice) */}
{filteredClients.length > 0 && (
  <ul className="client-results">
    {filteredClients.map((client) => (
      <li key={client.id} onClick={() => selectClient(index, client)}>
        {client.full_name} ({client.address})
      </li>
    ))}
  </ul>
)}


{/* ✅ Show Selected Client (Read-Only) */}
{selectedClient && (
  <p>
    <strong>Selected Client:</strong> {selectedClient.full_name}  
    <button type="button" onClick={() => setSelectedClient(null)}>❌ Change</button>
  </p>
)}

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

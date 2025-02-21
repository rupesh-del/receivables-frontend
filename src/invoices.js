import React, { useState, useEffect } from "react";
import NewInvoiceModal from "./NewInvoiceModal";
import NewPaymentModal from "./NewPaymentModal";
import "./styles/invoices.css";
import { FaEdit, FaTrash, FaPlus, FaSearch, FaMoneyBill } from "react-icons/fa";
import EditInvoiceModal from "./EditInvoiceModal";
import DeleteConfirmationModal from "./DeleteConfirmationModal";

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [payments, setPayments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editInvoice, setEditInvoice] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [selectedInvoices, setSelectedInvoices] = useState([]);


  
  // ✅ Fetch Clients
  useEffect(() => {
    fetch("https://receivables-api.onrender.com/clients")
      .then((res) => res.json())
      .then(setClients)
      .catch((err) => console.error("❌ Error fetching clients:", err));
  }, []);

  // ✅ Fetch Invoices
  useEffect(() => {
    fetch("https://receivables-api.onrender.com/invoices")
      .then((res) => res.json())
      .then(setInvoices)
      .catch((err) => console.error("❌ Error fetching invoices:", err));
  }, []);

  // ✅ Fetch Payments
  useEffect(() => {
    fetch("https://receivables-api.onrender.com/payments")
      .then((res) => res.json())
      .then(setPayments)
      .catch((err) => console.error("❌ Error fetching payments:", err));
  }, []);

  // ✅ Calculate Invoice Status
  const getInvoiceStatus = (invoice) => {
    const dueDate = new Date(invoice.due_date);
    const today = new Date();
    const invoicePayments = payments.filter((p) => p.invoice_number === invoice.invoice_number);
    const totalPaid = invoicePayments.reduce((sum, p) => sum + Number(p.amount), 0);
    if (totalPaid >= Number(invoice.amount)) return "Paid";
    if (dueDate < today) return "Overdue";
    return "Outstanding";
  };

  // ✅ Toggle Invoice Selection
  const toggleInvoiceSelection = (invoiceId) => {
    setSelectedInvoices((prev) =>
      prev.includes(invoiceId)
        ? prev.filter((id) => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };

// ✅ Add Multiple Invoices (Frontend)
const addInvoice = async (invoiceList) => {
  console.log("📤 Sending to API:", JSON.stringify(invoiceList, null, 2)); // ✅ LOG THIS

  if (invoiceList.length < 1 || invoiceList.length > 5) {
    alert("You can add between 1 to 5 invoices at a time.");
    return;
  }

  try {
    const response = await fetch("https://receivables-api.onrender.com/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invoiceList),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to add invoices.");
    }

    const newInvoices = await response.json();
    console.log("✅ Invoices Added Successfully:", newInvoices);

    setInvoices((prevInvoices) => [...prevInvoices, ...newInvoices]);
    setShowPopup(false);
  } catch (error) {
    console.error("❌ Error adding invoices:", error);
    alert(`Error: ${error.message}`);
  }
};



  // ✅ Edit Invoice
  const updateInvoice = async (updatedInvoice) => {  // ✅ Accept updated invoice from modal
    if (!updatedInvoice) return;
  
    try {
      console.log("📤 Sending Update Request for Invoice:", updatedInvoice);
  
      const response = await fetch(
        `https://receivables-api.onrender.com/invoices/${updatedInvoice.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ item: updatedInvoice.item, amount: updatedInvoice.amount }),
        }
      );
  
      if (!response.ok) throw new Error("Failed to update invoice.");
  
      setInvoices((prevInvoices) =>
        prevInvoices.map((inv) =>
          inv.id === updatedInvoice.id
            ? { ...inv, item: updatedInvoice.item, amount: updatedInvoice.amount }
            : inv
        )
      );
      setShowEditPopup(false);
      console.log("✅ Invoice Updated Successfully!");
    } catch (error) {
      console.error("❌ Error updating invoice:", error);
      alert(`Error: ${error.message}`);
    }
  };
  
  

  // ✅ Delete Invoice
  const deleteInvoice = async () => {
    if (!deleteId) return;
  
    try {
      console.log("🗑️ Sending Delete Request for Invoice ID:", deleteId);
  
      const response = await fetch(
        `https://receivables-api.onrender.com/invoices/${deleteId}`,
        { method: "DELETE" }
      );
  
      if (!response.ok) throw new Error("Failed to delete invoice.");
  
      setInvoices((prevInvoices) => prevInvoices.filter((inv) => inv.id !== deleteId));
      setShowDeleteConfirm(false);
      console.log("✅ Invoice Deleted Successfully!");
    } catch (error) {
      console.error("❌ Error deleting invoice:", error);
      alert(`Error: ${error.message}`);
    }
  };
  

  return (
    <div className="page-container">
      <div className="content-wrapper">
        <div className="content-box">
          <div className="invoices-header">
            <h2>Invoices</h2>
            <div className="search-container">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <button className="new-invoice-btn" onClick={() => {
    console.log("🟢 Open Invoice Modal Clicked"); 
    setShowPopup(true);
}}>
  <FaPlus /> New Invoice
</button>

            {selectedInvoices.length > 0 && (
              <button className="add-payment-btn" onClick={() => setShowPaymentPopup(true)}>
                <FaMoneyBill /> Add Payment
              </button>
            )}
          </div>

          <table className="invoices-table">
            <thead>
              <tr>
                <th></th>
                <th>Client Name</th>
                <th>Invoice Number</th>
                <th>Item</th>
                <th>Amount / Status</th>
                <th>Due Date</th>
                <th>Date Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
  {invoices
    .filter((invoice) => {
      const invoiceNumber = invoice.invoice_number?.toLowerCase() || "";
      const clientName = clients.find((c) => c.id === invoice.client_id)?.full_name.toLowerCase() || "";
      const item = invoice.item?.toLowerCase() || "";
      const status = getInvoiceStatus(invoice).toLowerCase();

      return (
        invoiceNumber.includes(searchTerm.toLowerCase()) ||
        clientName.includes(searchTerm.toLowerCase()) ||
        item.includes(searchTerm.toLowerCase()) ||
        status.includes(searchTerm.toLowerCase())
      );
    })
    .map((invoice) => {
      const status = getInvoiceStatus(invoice);
                return (
                  <tr key={invoice.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedInvoices.includes(invoice.id)}
                        onChange={() => toggleInvoiceSelection(invoice.id)}
                      />
                    </td>
                    <td>{clients.find((c) => c.id === invoice.client_id)?.full_name || "Unknown"}</td>
                    <td>{invoice.invoice_number}</td>
                    <td>{invoice.item || "N/A"}</td>
                    <td>
                      ${invoice.amount} <span className={`status ${status.toLowerCase()}`}>{status}</span>
                    </td>
                    <td>{new Date(invoice.due_date).toLocaleDateString()}</td>
                    <td>{invoice.date_created ? new Date(invoice.date_created).toLocaleDateString() : "N/A"}</td>
                    <td>
                    <button
  className="edit-btn"
  onClick={() => {
    console.log("✏️ Edit button clicked for Invoice:", invoice);
    setEditInvoice(invoice);
    setShowEditPopup(true);
    setTimeout(() => {
      console.log("🔵 showEditPopup:", showEditPopup); // ✅ Log updated state
    }, 100);
  }}
>
  <FaEdit />
</button>


<button
  className="delete-btn"
  onClick={() => {
    console.log("🗑️ Delete button clicked for Invoice ID:", invoice.id);
    setDeleteId(invoice.id);   // ✅ Set the invoice to be deleted
    setShowDeleteConfirm(true); // ✅ Open the modal
  }}
>
  <FaTrash />
</button>

                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
{/* ✅ Edit Invoice Modal */}
{showEditPopup && (
  <EditInvoiceModal
    isOpen={showEditPopup}
    onClose={() => {
      console.log("❌ Closing Edit Modal");
      setShowEditPopup(false);
    }}
    invoice={editInvoice}
    onSubmit={updateInvoice}
  />
)}

{/* ✅ Delete Confirmation Modal */}
<DeleteConfirmationModal
  isOpen={showDeleteConfirm}
  onClose={() => setShowDeleteConfirm(false)}
  onConfirm={deleteInvoice} // ✅ Ensure this function exists
/>

<NewInvoiceModal 
  isOpen={showPopup} 
  onClose={() => {
    console.log("❌ Closing Modal"); 
    setShowPopup(false);
  }} 
  clients={clients} 
  onSubmit={addInvoice} 
/>
      <NewPaymentModal isOpen={showPaymentPopup} onClose={() => setShowPaymentPopup(false)} selectedInvoices={selectedInvoices} />
    </div>
  );
};

export default Invoices;

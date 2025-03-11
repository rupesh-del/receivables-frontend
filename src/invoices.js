import React, { useState, useEffect } from "react";
import NewInvoiceModal from "./NewInvoiceModal";
import NewPaymentModal from "./NewPaymentModal";
import "./styles/invoices.css";
import { FaEdit, FaTrash, FaPlus, FaSearch, FaMoneyBill } from "react-icons/fa";
import EditInvoiceModal from "./EditInvoiceModal";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";



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
  console.log("📤 Sending to API:", JSON.stringify(invoiceList, null, 2));

  if (!Array.isArray(invoiceList) || invoiceList.length === 0 || invoiceList.length > 5) {
    alert("You can add between 1 to 5 invoices at a time.");
    return;
  }

  // ✅ Ensure correct data types
  const formattedInvoices = invoiceList.map(inv => ({
    client_id: Number(inv.client_id),  // Ensure INTEGER
    item: inv.item ? inv.item.toString() : "Unknown",  // Ensure STRING
    amount: parseFloat(inv.amount),  // Convert to FLOAT
    due_date: new Date(inv.due_date).toISOString().slice(0, 10),  // Convert to YYYY-MM-DD
    status: inv.status || "Pending"  // Default to "Pending"
  }));

  try {
    const response = await fetch("https://receivables-api.onrender.com/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formattedInvoices),  // Ensure it's always an array
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
  
  const updateInvoice = async (updatedInvoice) => {
    try {
      const response = await fetch(
        `https://receivables-api.onrender.com/invoices/${updatedInvoice.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedInvoice),
        }
      );
  
      if (!response.ok) throw new Error("Failed to update invoice.");
  
      const newInvoiceData = await response.json();
  
      // ✅ Update state with the modified invoice
      setInvoices((prevInvoices) =>
        prevInvoices.map((invoice) =>
          invoice.id === updatedInvoice.id ? newInvoiceData : invoice
        )
      );
  
      setShowEditPopup(false);
      console.log("✅ Invoice Updated Successfully:", newInvoiceData);
    } catch (error) {
      console.error("❌ Error updating invoice:", error);
      alert(`Error: ${error.message}`);
    }
  };
  
// ✅ Export selected invoices as PDF
const exportSelectedInvoices = () => {
  if (selectedInvoices.length === 0) {
    alert("Please select at least one invoice to export.");
    return;
  }

  selectedInvoices.forEach((invoiceId) => {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    const client = clients.find(c => c.id === invoice.client_id) || { full_name: "Unknown" };
    const invoicePayments = payments.filter(p => p.invoice_number === invoice.invoice_number);
    const totalPaid = invoicePayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const balanceDue = invoice.amount - totalPaid;

    const invoiceHtml = `
      <div style="padding:40px; font-family:sans-serif; max-width: 800px; margin:auto;">
        
        <!-- ✅ Company Header & Logo -->
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <h2 style="margin:0;">RC'S TOP-UP & BILLING ENTITY</h2>
            <p style="margin:0;">22 Belle Plaine<br/>Wakenaam 3<br/>5926627987</p>
          </div>
          <div>
            <img src="${window.location.origin}/logo.png" alt="Company Logo" style="height:80px;">
          </div>
        </div>

        <!-- ✅ Client & Invoice Details -->
        <div style="margin-top:20px; display:flex; justify-content:space-between;">
          <div>
            <strong>${client.full_name}</strong>
          </div>
          <div style="text-align:right;">
            <table>
              <tr><td><strong>Invoice Number:</strong></td><td>${invoice.invoice_number}</td></tr>
              <tr><td><strong>Date of Issue:</strong></td><td>${new Date(invoice.date_created).toLocaleDateString()}</td></tr>
              <tr><td><strong>Due Date:</strong></td><td>${new Date(invoice.due_date).toLocaleDateString()}</td></tr>
              <tr style="color:green; font-size:16px;"><td><strong>Amount Due (GYD):</strong></td><td><strong>$${balanceDue.toFixed(2)}</strong></td></tr>
            </table>
          </div>
        </div>

        <!-- ✅ Invoice Table -->
        <table style="width:100%; margin-top:20px; border-collapse:collapse;">
          <thead>
            <tr style="border-bottom:2px solid green;">
              <th align="left" style="padding:8px;">Description</th>
              <th align="right" style="padding:8px;">Rate</th>
              <th align="center" style="padding:8px;">Qty</th>
              <th align="right" style="padding:8px;">Line Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding:8px;">${invoice.item || 'N/A'}</td>
              <td align="right" style="padding:8px;">$${Number(invoice.amount).toFixed(2)}</td>
              <td align="center" style="padding:8px;">1</td>
              <td align="right" style="padding:8px;">$${Number(invoice.amount).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <!-- ✅ Price Breakdown -->
        <div style="margin-top:20px; text-align:right;">
          <table style="width:100%; border-collapse:collapse;">
            <tr><td><strong>Subtotal</strong></td><td align="right">$${Number(invoice.amount).toFixed(2)}</td></tr>
            <tr><td><strong>Tax</strong></td><td align="right">$0.00</td></tr>
            <tr style="border-top:2px solid #ddd;"><td><strong>Total</strong></td><td align="right"><strong>$${Number(invoice.amount).toFixed(2)}</strong></td></tr>
            <tr><td><strong>Amount Paid</strong></td><td align="right">$${totalPaid.toFixed(2)}</td></tr>
            <tr style="color:green; font-size:16px;"><td><strong>Amount Due (GYD)</strong></td><td align="right"><strong>$${balanceDue.toFixed(2)}</strong></td></tr>
          </table>
        </div>

        <!-- ✅ Terms & Conditions -->
        <div style="margin-top:30px; font-size:12px;">
          <strong>Terms</strong><br/>
          Kindly make all Cheques payable in the company's name.<br/>
          The terms of this invoice are valid for 30 Days.<br/>
          This company reserves the right to charge interest as it sees fit for long outstanding accounts.
        </div>

      </div>
    `;

    // ✅ Convert to PDF with Letter Size (8.5 x 11 inches)
    const invoiceElement = document.createElement("div");
    invoiceElement.innerHTML = invoiceHtml;
    document.body.appendChild(invoiceElement);

    html2canvas(invoiceElement, {
      scale: 2, // ✅ Keeps high quality
      backgroundColor: "#ffffff", // ✅ Ensures no transparency issues
      useCORS: true, // ✅ Loads external images properly
    }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
    
      // ✅ Ensure PDF is Letter-Sized (8.5 x 11 inches)
      const pdf = new jsPDF({ format: "letter", unit: "in", orientation: "portrait" });
    
      const pdfWidth = 8.5; // Letter Width (inches)
      const pdfHeight = 11; // Letter Height (inches)
    
      const imgWidth = pdfWidth - 0.5; // ✅ Keeps small margin
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
      // ✅ Ensure Image Fits Within PDF Bounds
      const yOffset = (pdfHeight - imgHeight) / 2; // Centers vertically
    
      pdf.addImage(imgData, "PNG", 0.25, yOffset, imgWidth, imgHeight);
      pdf.save(`Invoice_${invoice.invoice_number}.pdf`);
      console.log("✅ PDF Successfully Saved with Image!");

      document.body.removeChild(invoiceElement);
    });
  });
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
<button className="export-btn" onClick={exportSelectedInvoices}>
  Export Selected as PDF
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

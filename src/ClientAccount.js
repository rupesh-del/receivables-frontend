import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./styles/ClientAccount.css";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import InvoiceModal from "./NewPaymentModal"; // ✅ Import Invoice Modal
import PaymentModal from "./NewInvoiceModal"; // ✅ Import Payment Modal


const ClientAccount = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);


  // ✅ Fetch Client Details
  useEffect(() => {
    const fetchClient = async () => {
      try {
        const response = await fetch(`https://receivables-api.onrender.com/clients/${clientId}`);
        if (!response.ok) throw new Error("Client not found");
        const data = await response.json();
        setClient(data);
      } catch (error) {
        console.error("Error fetching client:", error);
        setClient(null);
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [clientId]);

// ✅ Fetch Invoices for a Specific Client (Frontend Filtering)
const applyDateFilter = () => {
  if (!startDate || !endDate) return;

  const filteredInvoices = invoices.filter(invoice => {
    const invoiceDate = new Date(invoice.date_created);
    return invoiceDate >= new Date(startDate) && invoiceDate <= new Date(endDate);
  });

  const filteredPayments = payments.filter(payment => {
    const paymentDate = new Date(payment.payment_date);
    return paymentDate >= new Date(startDate) && paymentDate <= new Date(endDate);
  });

  setInvoices(filteredInvoices);
  setPayments(filteredPayments);
};


// ✅ Fetch Payments for a Specific Client (Frontend Filtering)
const fetchPaymentsForClient = async (clientId) => {
  try {
    const response = await fetch("https://receivables-api.onrender.com/payments");
    if (!response.ok) throw new Error("Error fetching payments");

    const allPayments = await response.json();

    // ✅ Fetch client's invoices first to get the invoice numbers
    const clientInvoices = await fetchInvoicesForClient(clientId);
    const clientInvoiceNumbers = clientInvoices.map(invoice => invoice.invoice_number); // Extract invoice numbers

    // ✅ Filter payments based on the invoice numbers
    const clientPayments = allPayments.filter(payment =>
      clientInvoiceNumbers.includes(payment.invoice_number)
    );

    return clientPayments;
  } catch (error) {
    console.error("❌ Error fetching payments:", error);
    return [];
  }
};

const exportToPDF = () => {
  const input = document.getElementById("client-account");
  
  if (!input) {
    console.error("❌ Error: The client-account container was not found.");
    return;
  }

  // ✅ Hide buttons before capturing PDF
  document.querySelectorAll(".export-btn, .back-btn").forEach(btn => {
    btn.style.display = "none";
  });

  html2canvas(input).then((canvas) => {
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF();
    pdf.addImage(imgData, "PNG", 10, 10, 190, 0);
    pdf.save(`${client.full_name}_Account_Report.pdf`);

    // ✅ Restore buttons after PDF is generated
    document.querySelectorAll(".export-btn, .back-btn").forEach(btn => {
      btn.style.display = "block";
    });
  }).catch((error) => {
    console.error("❌ PDF Export Error:", error);
  });
};


const fetchInvoicesForClient = async (clientId) => {
  try {
    const response = await fetch("https://receivables-api.onrender.com/invoices"); 
    if (!response.ok) throw new Error("Error fetching invoices");
    
    const allInvoices = await response.json();
    const clientInvoices = allInvoices.filter(invoice => invoice.client_id.toString() === clientId);

    return clientInvoices;
  } catch (error) {
    console.error("❌ Error fetching invoices:", error);
    return [];
  }
};


// ✅ Fetch and Update Invoices & Payments for the Current Client
const fetchInvoicesAndPayments = async (clientId) => {  // ✅ Pass clientId as a parameter
  try {
    if (!clientId) {
      console.error("❌ No clientId provided.");
      return;
    }

    const clientInvoices = await fetchInvoicesForClient(clientId);
    const clientPayments = await fetchPaymentsForClient(clientId);

    setInvoices(clientInvoices);
    setPayments(clientPayments);
  } catch (error) {
    console.error("Error fetching invoices/payments:", error);
  }
};

// ✅ Ensure function runs inside useEffect when clientId changes
useEffect(() => {
  fetchInvoicesAndPayments(clientId);  // ✅ Pass clientId to the function
}, [clientId]);


  // ✅ Dynamically Calculate Invoice Status
  const getInvoiceStatus = (invoice) => {
    const dueDate = new Date(invoice.due_date);
    const today = new Date();

    // Find all payments for this invoice
    const invoicePayments = payments.filter((payment) => payment.invoice_number === invoice.invoice_number);
    const totalPaid = invoicePayments.reduce((sum, payment) => sum + Number(payment.amount), 0);

    if (totalPaid >= Number(invoice.amount)) return "Paid";
    if (dueDate < today) return "Overdue";
    return "Outstanding";
  };

  // ✅ Dynamically Calculate Total Outstanding Balance
  const totalInvoices = invoices.reduce((sum, invoice) => sum + Number(invoice.amount), 0);
  const totalPayments = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const totalOutstanding = totalInvoices - totalPayments;

  // ✅ Display Loading State
  if (loading) {
    return (
      <div className="page-container">
        <div className="content-wrapper">
          <div className="content-box">
            <h2>Loading Client Data...</h2>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Handle "Client Not Found"
  if (!client) {
    return (
      <div className="page-container">
        <div className="content-wrapper">
          <div className="content-box">
            <h2>Client Not Found</h2>
            <button className="back-btn" onClick={() => navigate("/clients")}>
              ← Back to Clients
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" id="client-account">
      <div className="content-wrapper">
        <div className="content-box">
          {/* ✅ Client Information */}
          <h2>{client.full_name}'s Account</h2>
          <p><strong>Address:</strong> {client.address}</p>
          <p><strong>Contact:</strong> {client.contact}</p>
{/* ✅ Date Range Picker */}
<div className="date-filter">
  <label>Filter by Date Range:</label>
  <input
    type="date"
    value={startDate}
    onChange={(e) => setStartDate(e.target.value)}
  />
  <input
    type="date"
    value={endDate}
    onChange={(e) => setEndDate(e.target.value)}
  />
  <button onClick={applyDateFilter}>Apply</button>
</div>

          {/* ✅ Invoices Table */}
          <h3>Invoices</h3>
          <table className="client-table">
            <thead>
              <tr>
                <th>Invoice Number</th>
                <th>Date</th>
                <th>Amount ($)</th>
                <th>Due Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length > 0 ? (
                invoices.map((invoice) => {
                  const status = getInvoiceStatus(invoice);
                  return (
                    <tr key={invoice.id}>
                      <td>{invoice.invoice_number}</td>
                      <td>{new Date(invoice.date_created).toLocaleDateString("en-US")}</td>
                      <td>${Number(invoice.amount).toFixed(2)}</td>
                      <td>{new Date(invoice.due_date).toLocaleDateString("en-US")}</td>
                      <td>
                        <span className={`status ${status.toLowerCase()}`}>{status}</span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan="5">No invoices found</td></tr>
              )}
            </tbody>
          </table>

          {/* ✅ Payments Table */}
          <h3>Payments</h3>
          <table className="client-table">
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Date</th>
                <th>Amount ($)</th>
                <th>Mode</th>
              </tr>
            </thead>
            <tbody>
              {payments.length > 0 ? (
                payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>{payment.id}</td>
                    <td>{payment.payment_date ? new Date(payment.payment_date).toLocaleDateString("en-US") : "N/A"}</td>
                    <td>${Number(payment.amount).toFixed(2)}</td>
                    <td>{payment.mode}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="4">No payments found</td></tr>
              )}
            </tbody>
          </table>

          {/* ✅ Total Outstanding Summary */}
          <h3 className="total-outstanding">
            Total Outstanding: ${totalOutstanding.toFixed(2)}
          </h3>
{/* ✅ Export as PDF Button */}
<button className="export-btn" onClick={exportToPDF}>
  📄 Export as PDF
</button>

          {/* ✅ Back Button */}
          <button className="back-btn" onClick={() => navigate("/clients")}>
            ← Back to Clients
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientAccount;

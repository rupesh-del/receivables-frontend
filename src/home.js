import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // ✅ Correct import for navigation
import "./styles/home.css";
import { FaPlus, FaUser, FaFileInvoice, FaMoneyBill } from "react-icons/fa";

const Home = () => {
  const navigate = useNavigate(); // ✅ Correct React Router navigation
  const [clients, setClients] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [showNewMenu, setShowNewMenu] = useState(false);

  // ✅ Fetch Clients
  useEffect(() => {
    fetch("https://receivables-api.onrender.com/clients")
      .then((res) => res.json())
      .then((data) => setClients(data))
      .catch((err) => console.error("❌ Error fetching clients:", err));
  }, []);

  // ✅ Fetch Invoices
  useEffect(() => {
    fetch("https://receivables-api.onrender.com/invoices")
      .then((res) => res.json())
      .then((data) => setInvoices(data))
      .catch((err) => console.error("❌ Error fetching invoices:", err));
  }, []);

  // ✅ Fetch Payments
  useEffect(() => {
    fetch("https://receivables-api.onrender.com/payments")
      .then((res) => res.json())
      .then((data) => setPayments(data))
      .catch((err) => console.error("❌ Error fetching payments:", err));
  }, []);

  // ✅ Function to Determine Invoice Status
  const getInvoiceStatus = (invoice) => {
    const dueDate = new Date(invoice.due_date);
    const today = new Date();

    // Find all payments made for this invoice
    const invoicePayments = payments.filter(
      (payment) => payment.invoice_number === invoice.invoice_number
    );

    // Calculate total paid amount
    const totalPaid = invoicePayments.reduce((sum, payment) => sum + Number(payment.amount), 0);

    if (totalPaid >= Number(invoice.amount)) return "Paid";
    if (dueDate < today) return "Overdue";
    return "Outstanding";
  };

  // ✅ Calculate Dashboard Stats
  const totalOverdue = invoices
    .filter((invoice) => getInvoiceStatus(invoice) === "Overdue")
    .reduce((sum, invoice) => sum + Number(invoice.amount), 0);

  const totalOutstanding = invoices
    .filter((invoice) => getInvoiceStatus(invoice) === "Outstanding")
    .reduce((sum, invoice) => sum + Number(invoice.amount), 0);

  const totalPayments = payments.reduce((sum, pay) => sum + Number(pay.amount), 0);

  // ✅ Get Recently Active Clients
  const recentClients = clients.slice(-5).reverse(); // Last 5 clients engaged

  return (
    <div className="home-container">
      {/* Header */}
      <div className="home-header">
        <h1>Welcome to RCS Receivables</h1>
        <div className="new-menu">
          <button className="new-button" onClick={() => setShowNewMenu(!showNewMenu)}>
            <FaPlus /> New
          </button>
          {showNewMenu && (
            <div className="new-dropdown">
              <button onClick={() => navigate("/clients")}><FaUser /> New Client</button>
              <button onClick={() => navigate("/invoices")}><FaFileInvoice /> New Invoice</button>
              <button onClick={() => navigate("/payments")}><FaMoneyBill /> New Payment</button>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card overdue">
          <h3>Overdue</h3>
          <p>${totalOverdue.toFixed(2)}</p>
        </div>
        <div className="summary-card outstanding">
          <h3>Outstanding</h3>
          <p>${totalOutstanding.toFixed(2)}</p>
        </div>
        <div className="summary-card payments">
          <h3>Payments</h3>
          <p>${totalPayments.toFixed(2)}</p>
        </div>
      </div>

      {/* Recent Clients */}
      <div className="recent-clients">
        <h2>Recently Active Clients</h2>
        <ul>
          {recentClients.length > 0 ? (
            recentClients.map((client) => (
              <li key={client.id} onClick={() => navigate(`/clients/${client.id}`)}>
                {client.full_name}
              </li>
            ))
          ) : (
            <p>No recent clients</p>
          )}
        </ul>
      </div>
    </div>
  );
};

export default Home;

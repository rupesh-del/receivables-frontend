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

  const getInvoiceStatus = (invoice) => {
    const dueDate = new Date(invoice.due_date);
    const today = new Date();
  
    // Get all payments for this invoice
    const invoicePayments = payments.filter(
      (payment) => payment.invoice_number === invoice.invoice_number
    );
  
    // Calculate total paid amount
    const totalPaid = invoicePayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  
    const remainingBalance = Number(invoice.amount) - totalPaid;
  
    if (remainingBalance <= 0) return "Paid"; // Fully paid invoice
    if (dueDate < today) return "Overdue"; // Invoice past due date with balance remaining
    return "Outstanding"; // Future due date with balance remaining
  };  

  // ✅ Calculate Dashboard Stats
  const totalOverdue = invoices
  .filter((invoice) => getInvoiceStatus(invoice) === "Overdue")
  .reduce((sum, invoice) => {
    const invoicePayments = payments.filter(
      (payment) => payment.invoice_number === invoice.invoice_number
    );

    const totalPaid = invoicePayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const remainingBalance = Number(invoice.amount) - totalPaid;

    return sum + (remainingBalance > 0 ? remainingBalance : 0);
  }, 0);


  const totalOutstanding = invoices
  .filter((invoice) => getInvoiceStatus(invoice) === "Outstanding")
  .reduce((sum, invoice) => {
    const invoicePayments = payments.filter(
      (payment) => payment.invoice_number === invoice.invoice_number
    );

    const totalPaid = invoicePayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const remainingBalance = Number(invoice.amount) - totalPaid;

    return sum + (remainingBalance > 0 ? remainingBalance : 0);
  }, 0);

  const totalPayments = payments.reduce((sum, pay) => sum + Number(pay.amount), 0);


  // ✅ Get Recently Active Clients
  const getClientLastInteraction = (clientId) => {
    // Get the latest invoice date for this client
    const lastInvoice = invoices
      .filter((invoice) => invoice.client_id === clientId)
      .reduce((latest, invoice) => (new Date(invoice.date) > new Date(latest.date) ? invoice : latest), { date: "2000-01-01" });
  
    // Get the latest payment date for this client
    const lastPayment = payments
      .filter((payment) => payment.client_id === clientId)
      .reduce((latest, payment) => (new Date(payment.date) > new Date(latest.date) ? payment : latest), { date: "2000-01-01" });
  
    // Get the most recent interaction
    return new Date(lastInvoice.date) > new Date(lastPayment.date) ? lastInvoice.date : lastPayment.date;
  };
  
  // Sort clients by most recent interaction
  const recentClients = [...clients]
    .sort((a, b) => new Date(getClientLastInteraction(b.id)) - new Date(getClientLastInteraction(a.id)))
    .slice(0, 5);
  

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
          <p>${totalOverdue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        <div className="summary-card outstanding">
          <h3>Outstanding</h3>
          <p>${totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        <div className="summary-card payments">
          <h3>Payments</h3>
          <p>${totalPayments.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
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

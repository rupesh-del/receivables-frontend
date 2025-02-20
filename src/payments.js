import React, { useState, useEffect } from "react";
import NewPaymentModal from "./NewPaymentModal";
import "./styles/payments.css";
import { FaPlus } from "react-icons/fa";

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null); // Track expanded row

  // ✅ Fetch Payments from API
  const fetchPayments = () => {
    fetch("https://receivables-api.onrender.com/payments")
      .then((res) => res.json())
      .then((data) => {
        setPayments(data);
      })
      .catch((err) => console.error("❌ Error fetching payments:", err));
  };

  // ✅ Fetch Payments on Mount
  useEffect(() => {
    fetchPayments();
  }, []);

  // ✅ Toggle Row Expansion
  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  return (
    <div className="page-container">
      <div className="content-wrapper">
        <div className="content-box">
          <div className="payments-header">
            <h2>Payments</h2>
            <button className="new-payment-btn" onClick={() => setShowModal(true)}>
              <FaPlus /> New Payment
            </button>
          </div>

          <table className="payments-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Invoice Paid</th>
                <th>Date of Payment</th>
                <th>Mode</th>
                <th>Amount Paid</th>
                <th>Balance Outstanding</th>
              </tr>
            </thead>
            <tbody>
              {payments.length > 0 ? (
                payments.map((payment) => (
                  <React.Fragment key={payment.id}>
                    <tr
                      onClick={() => toggleRow(payment.id)}
                      className={expandedRow === payment.id ? "expanded-row" : ""}
                      style={{ cursor: "pointer" }}
                    >
                      <td>{payment.client || "Unknown"}</td>
                      <td>{payment.invoice_number || "N/A"}</td>
                      <td>
                        {payment.payment_date
                          ? new Date(payment.payment_date).toLocaleDateString("en-US")
                          : "N/A"}
                      </td>
                      <td>{payment.mode || "N/A"}</td>
                      <td>${Number(payment.amount || 0).toFixed(2)}</td>
                      <td>${Number(payment.balance_outstanding || 0).toFixed(2)}</td>
                    </tr>

                    {/* Expandable Row for Details */}
                    {expandedRow === payment.id && (
                      <tr className="payment-details-row">
                        <td colSpan="6">
                          <div className="payment-details">
                            <p><strong>Payment ID:</strong> {payment.id}</p>
                            <p><strong>Client:</strong> {payment.client}</p>
                            <p><strong>Invoice Number:</strong> {payment.invoice_number}</p>
                            <p><strong>Mode of Payment:</strong> {payment.mode}</p>
                            <p><strong>Amount Paid:</strong> ${Number(payment.amount || 0).toFixed(2)}</p>
                            <p><strong>Balance Outstanding:</strong> ${Number(payment.balance_outstanding || 0).toFixed(2)}</p>
                            <p><strong>Date of Payment:</strong> {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString("en-US") : "N/A"}</p>
                            <p><strong>Remarks:</strong> {payment.remarks || "None"}</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="no-payments">No payments recorded</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Payment Modal */}
      <NewPaymentModal 
        isOpen={showModal} 
        onClose={() => {
          setShowModal(false);
          fetchPayments(); // ✅ Refresh payments after closing modal
        }} 
      />
    </div>
  );
};

export default Payments;

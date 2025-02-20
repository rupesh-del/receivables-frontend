import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { CSVLink } from "react-csv";
import "./styles/reports.css";

const Reports = () => {
  const [reportType, setReportType] = useState("outstanding");
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ✅ API URL
  const API_BASE_URL = "https://receivables-api.onrender.com/reports";

  // ✅ Fetch Report Data
  const fetchReportData = async () => {
    if (!reportType) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/${reportType}`);
      if (!response.ok) throw new Error(`Server error ${response.status}`);

      const data = await response.json();
      console.log("Fetched Report Data:", data); // Debugging

      setReportData(data);
    } catch (error) {
      console.error("❌ Error fetching report:", error);
      setError("Failed to fetch report data.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Calculate Totals
  const totalOutstanding = reportData.reduce((sum, row) => sum + (Number(row.totalowed) || 0), 0);
  const totalOwed = reportData.reduce((sum, row) => sum + (Number(row.totalowed) || 0), 0);
  const totalPaid = reportData.reduce((sum, row) => sum + (Number(row.totalpaid) || 0), 0);

  // ✅ Export to PDF
  const exportToPDF = () => {
    if (reportData.length === 0) return;

    const doc = new jsPDF();
    doc.text("RCS Receivables - Report", 14, 10);

    let tableHeader = [];
    let tableRows = [];

    if (reportType === "outstanding") {
      tableHeader = [["Client Name", "Total Outstanding"]];
      tableRows = reportData.map((row) => [row.full_name, `$${Number(row.totalowed || 0).toFixed(2)}`]);
      tableRows.push(["Total", `$${totalOutstanding.toFixed(2)}`]);
    } else if (reportType === "payments") {
      tableHeader = [["Client Name", "Payment Date", "Mode", "Amount"]];
      tableRows = reportData.map((row) => [
        row.client_name,
        new Date(row.payment_date).toLocaleDateString(),
        row.mode,
        `$${Number(row.amount || 0).toFixed(2)}`,
      ]);
    } else if (reportType === "overall") {
      tableHeader = [["Client Name", "Invoices", "Total Owed", "Total Paid"]];
      tableRows = reportData.map((row) => [
        row.full_name,
        row.invoices,
        `$${Number(row.totalowed || 0).toFixed(2)}`,
        `$${Number(row.totalpaid || 0).toFixed(2)}`,
      ]);
      tableRows.push(["Total", "", `$${totalOwed.toFixed(2)}`, `$${totalPaid.toFixed(2)}`]);
    }

    doc.autoTable({
      head: tableHeader,
      body: tableRows,
      startY: 20,
    });

    doc.save(`${reportType}-report.pdf`);
  };

  // ✅ Export to CSV
  const generateCSVData = () => {
    if (reportData.length === 0) return [];

    let csvData = [];

    if (reportType === "outstanding") {
      csvData = reportData.map((row) => ({
        "Client Name": row.full_name,
        "Total Outstanding": `$${Number(row.totalowed || 0).toFixed(2)}`,
      }));
      csvData.push({ "Client Name": "Total", "Total Outstanding": `$${totalOutstanding.toFixed(2)}` });
    } else if (reportType === "payments") {
      csvData = reportData.map((row) => ({
        "Client Name": row.client_name,
        "Payment Date": new Date(row.payment_date).toLocaleDateString(),
        "Mode": row.mode,
        "Amount": `$${Number(row.amount || 0).toFixed(2)}`,
      }));
    } else if (reportType === "overall") {
      csvData = reportData.map((row) => ({
        "Client Name": row.full_name,
        "Invoices": row.invoices,
        "Total Owed": `$${Number(row.totalowed || 0).toFixed(2)}`,
        "Total Paid": `$${Number(row.totalpaid || 0).toFixed(2)}`,
      }));
      csvData.push({
        "Client Name": "Total",
        "Invoices": "",
        "Total Owed": `$${totalOwed.toFixed(2)}`,
        "Total Paid": `$${totalPaid.toFixed(2)}`,
      });
    }

    return csvData;
  };

  return (
    <div className="reports-container">
      <h2>Reports</h2>

      {/* ✅ Report Type Selector */}
      <div className="report-controls">
        <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
          <option value="outstanding">Clients with Outstanding Amounts</option>
          <option value="payments">Clients and Payments</option>
          <option value="overall">Overall Report</option>
        </select>

        {/* ✅ Generate Report Button */}
        <button className="generate-btn" onClick={fetchReportData}>
          Generate Report
        </button>
      </div>

      {/* ✅ Error Handling */}
      {error && <p className="error-message">{error}</p>}

      {/* ✅ Export Buttons */}
      {reportData.length > 0 && (
        <div className="export-buttons">
          <CSVLink data={generateCSVData()} filename={`${reportType}-report.csv`}>
            <button className="export-csv">Export CSV</button>
          </CSVLink>
          <button className="export-pdf" onClick={exportToPDF}>
            Export PDF
          </button>
        </div>
      )}

      {/* ✅ Report Table */}
      <table className="reports-table">
  <thead>
    <tr>
      <th>Client Name</th>
      {reportType === "outstanding" && <th>Total Outstanding</th>}
      {reportType === "payments" && (
        <>
          <th>Payment Date</th>
          <th>Mode</th>
          <th>Amount</th>
        </>
      )}
      {reportType === "overall" && (
        <>
          <th>Invoices</th>
          <th>Total Owed</th>
          <th>Total Paid</th>
        </>
      )}
    </tr>
  </thead>

  <tbody>
  {loading ? (
    <tr>
      <td colSpan="5" className="loading-text">Loading...</td>
    </tr>
  ) : reportData.length > 0 ? (
    reportData.map((data, index) => (
      <tr key={index}>
        <td>{data.full_name || data.client_name || "N/A"}</td>
        {reportType === "payments" && (
          <>
            <td>{new Date(data.payment_date).toLocaleDateString()}</td>
            <td>{data.mode}</td>
            <td>${Number(data.amount || 0).toFixed(2)}</td>
          </>
        )}
        {reportType === "outstanding" && <td>${Number(data.totalowed || 0).toFixed(2)}</td>}
        {reportType === "overall" && (
          <>
            <td>${Number(data.invoices || 0).toFixed(2)}</td>
            <td>${Number(data.totalowed || 0).toFixed(2)}</td>
            <td>${Number(data.totalpaid || 0).toFixed(2)}</td>
          </>
        )}
      </tr>
    ))
  ) : (
    <tr>
      <td colSpan="5" className="no-data-text">No data available.</td>
    </tr>
  )}
</tbody>

  {/* ✅ Footer Row for Totals */}
  {reportData.length > 0 && (
    <tfoot>
      <tr className="total-row">
        <td><strong>Total</strong></td>
        {reportType === "outstanding" && (
          <td><strong>${reportData.reduce((sum, data) => sum + Number(data.totalowed || 0), 0).toFixed(2)}</strong></td>
        )}
        {reportType === "payments" && (
          <>
            <td colSpan="2"></td> {/* Empty columns for alignment */}
            <td><strong>${reportData.reduce((sum, data) => sum + Number(data.amount || 0), 0).toFixed(2)}</strong></td>
          </>
        )}
        {reportType === "overall" && (
          <>
            <td><strong>${reportData.reduce((sum, data) => sum + Number(data.invoices || 0), 0).toFixed(2)}</strong></td>
            <td><strong>${reportData.reduce((sum, data) => sum + Number(data.totalowed || 0), 0).toFixed(2)}</strong></td>
            <td><strong>${reportData.reduce((sum, data) => sum + Number(data.totalpaid || 0), 0).toFixed(2)}</strong></td>
          </>
        )}
      </tr>
    </tfoot>
  )}
</table>
    </div>
  );
};

export default Reports;

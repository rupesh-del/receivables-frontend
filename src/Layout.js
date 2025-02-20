import React from "react";
import { Outlet, Link } from "react-router-dom";
import "./styles/home.css"; // Keep styles for sidebar & header

const Layout = () => {
  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <h1>RCS RECEIVABLES</h1>
        <span className="date-display">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </span>
      </header>

      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <nav aria-label="Main Navigation">
          <ul>
            <li><Link to="/" aria-label="Go to Home">🏠 Home</Link></li>  
            <li><Link to="/clients" aria-label="Go to Clients">👤 Clients</Link></li>
            <li><Link to="/invoices" aria-label="Go to Invoices">🧾 Invoices</Link></li>
            <li><Link to="/payments" aria-label="Go to Payments">💳 Payments</Link></li>
            <li><Link to="/reports" aria-label="Go to Reports">📊 Reports</Link></li>
            <li><Link to="/settings" aria-label="Go to Settings">⚙️ Settings</Link></li>
          </ul>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="content">
        <Outlet /> {/* ✅ This makes sure navigation works */}
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>RCS ALL RIGHTS RESERVED © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};

export default Layout;

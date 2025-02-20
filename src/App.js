import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./Layout";
import Home from "./home";
import Clients from "./clients";
import Invoices from "./invoices";
import Payments from "./payments";
import Reports from "./reports";
import Settings from "./setting";
import ClientAccount from "./ClientAccount";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          {/* ✅ No need to pass clients as props */}
          <Route path="clients" element={<Clients />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="payments" element={<Payments />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          {/* ✅ Clients will be fetched directly inside ClientAccount.js */}
          <Route path="clients/:clientId" element={<ClientAccount />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;

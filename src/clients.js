import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./styles/clients.css";

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [newClient, setNewClient] = useState({
    full_name: "",
    address: "",
    contact: "",
  });

  const navigate = useNavigate();
  const API_URL = "https://receivables-api.onrender.com/clients";

  // ✅ Fetch Clients from Backend
  useEffect(() => {
    fetch(API_URL)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Server responded with ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log("Fetched Clients:", data);
        setClients(data);
        setFilteredClients(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching clients:", err);
        setError("Failed to fetch clients.");
        setLoading(false);
      });
  }, []);

  // ✅ Handle input changes
  const handleChange = (e) => {
    setNewClient({ ...newClient, [e.target.name]: e.target.value });
  };

  // ✅ Search Clients
  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    setFilteredClients(
      clients.filter((client) => client.full_name.toLowerCase().includes(query))
    );
  };

  // ✅ Save (Add/Edit) Client
  const saveClient = () => {
    if (newClient.full_name && newClient.address && newClient.contact) {
      if (editingClient) {
        fetch(`${API_URL}/${editingClient.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newClient),
        })
          .then(() => {
            setClients((prevClients) =>
              prevClients.map((client) =>
                client.id === editingClient.id ? newClient : client
              )
            );
            setFilteredClients((prevClients) =>
              prevClients.map((client) =>
                client.id === editingClient.id ? newClient : client
              )
            );
          })
          .catch((err) => console.error("Error updating client:", err));
      } else {
        fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newClient),
        })
          .then((res) => res.json())
          .then((data) => {
            setClients([...clients, data]);
            setFilteredClients([...clients, data]);
          })
          .catch((err) => console.error("Error adding client:", err));
      }

      setNewClient({ full_name: "", address: "", contact: "" });
      setEditingClient(null);
      setShowPopup(false);
    }
  };

  // ✅ Delete Client
  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this client?")) {
      fetch(`${API_URL}/${id}`, { method: "DELETE" })
        .then(() => {
          const updatedClients = clients.filter((client) => client.id !== id);
          setClients(updatedClients);
          setFilteredClients(updatedClients);
        })
        .catch((err) => console.error("Error deleting client:", err));
    }
  };

  // ✅ Navigate to Client Account
  const handleClientClick = (clientId) => {
    navigate(`/clients/${clientId}`);
  };

  return (
    <div className="page-container">
      <div className="content-wrapper">
        <div className="content-box">
          {/* ✅ Clients Header */}
          <div className="clients-header">
            <h2>Clients</h2>
            <input
              type="text"
              placeholder="Search clients..."
              value={searchQuery}
              onChange={handleSearch}
              className="search-box"
            />
            <button className="new-client-btn" onClick={() => setShowPopup(true)}>
              + New Client
            </button>
          </div>

          {/* ✅ Error Handling */}
          {error && <p className="error-message">{error}</p>}

          {/* ✅ Loading Indicator */}
          {loading ? (
            <p>Loading clients...</p>
          ) : (
            <table className="clients-table">
<thead>
  <tr>
    <th>Full Name</th>
    <th>Address</th>
    <th>Contact</th>
    <th>Balance</th> {/* ✅ Add this new column */}
    <th>Actions</th>
  </tr>
</thead>

<tbody>
  {filteredClients.length > 0 ? (
    filteredClients.map((client) => (
      <tr key={client.id} onClick={() => handleClientClick(client.id)}>
        <td>{client.full_name}</td>
        <td>{client.address}</td>
        <td>{client.contact}</td>
        <td style={{ fontWeight: "bold", color: client.balance > 0 ? "red" : "green" }}>
          ${client.balance.toFixed(2)}
        </td> {/* ✅ Add this line to display balance */}
        <td>
          <button
            className="edit-btn"
            onClick={(e) => {
              e.stopPropagation(); // Prevents row click event
              setEditingClient(client);
              setShowPopup(true); // Open the edit popup
            }}
          >
            Edit
          </button>
          <button className="delete-btn" onClick={() => handleDelete(client.id)}>
            Delete
          </button>
        </td>
      </tr>
    ))
  ) : (
    <tr>
      <td colSpan="5" style={{ textAlign: "center", padding: "15px", color: "#888" }}>
        No clients found
      </td>
    </tr>
  )}
</tbody>

            </table>
          )}
        </div>
      </div>

      {/* ✅ Popup Form */}
      {showPopup && (
        <div className="popup">
          <div className="popup-content">
            <h3>{editingClient ? "Edit Client" : "Add New Client"}</h3>
            <input
              type="text"
              name="full_name"
              placeholder="Full Name"
              value={newClient.full_name}
              onChange={handleChange}
            />
            <input
              type="text"
              name="address"
              placeholder="Address"
              value={newClient.address}
              onChange={handleChange}
            />
            <input
              type="text"
              name="contact"
              placeholder="Contact Number"
              value={newClient.contact}
              onChange={handleChange}
            />
            <button onClick={saveClient}>{editingClient ? "Update Client" : "Add Client"}</button>
            <button className="close-btn" onClick={() => setShowPopup(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;

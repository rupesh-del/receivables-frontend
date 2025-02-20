import React, { useEffect, useState } from "react";
import "./styles/settings.css"; // Import CSS file

const Settings = () => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [newSetting, setNewSetting] = useState("");

  // Fetch settings from backend
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("https://receivables-api.onrender.com/settings");
        if (!response.ok) {
          throw new Error("Failed to fetch settings");
        }
        const data = await response.json();
        setSettings(data);
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Handle input change
  const handleInputChange = (e) => {
    setNewSetting(e.target.value);
  };

  // Update settings in backend
  const updateSettings = async () => {
    try {
      const response = await fetch("https://receivables-api.onrender.com/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setting_value: newSetting }),
      });

      if (!response.ok) {
        throw new Error("Failed to update settings");
      }

      const updatedData = await response.json();
      setSettings(updatedData);
      setNewSetting(""); // Reset input field
    } catch (error) {
      console.error("Error updating settings:", error);
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-content">
        <h2>Application Settings</h2>

        {/* Show loading indicator */}
        {loading ? (
          <p>Loading settings...</p>
        ) : (
          <div>
            <p><strong>Current Setting:</strong> {settings.setting_value || "Not Set"}</p>

            {/* Input field to update settings */}
            <input
              type="text"
              placeholder="Enter new setting..."
              value={newSetting}
              onChange={handleInputChange}
            />
            <button onClick={updateSettings}>Update Settings</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;

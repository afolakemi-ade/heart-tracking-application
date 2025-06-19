import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = ({ setIsAuthenticated }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (username === "demo" && password === "demo123") {
    await setIsAuthenticated(true); // Wait for state update
    localStorage.setItem("isAuthenticated", "true");
    navigate("/HeartTrackingApp", { replace: true });
  } else {
    setError("Invalid credentials");
  }
};

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>CardioFola Login</h2>
        {error && <p style={styles.error}>{error}</p>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={styles.input}
              placeholder="Enter demo"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="Enter demo123"
            />
          </div>

          <button type="submit" style={styles.button}>
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    width: "100vw", // Add this to ensure full width
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    padding: "20px",
    boxSizing: "border-box", // Ensure padding doesn't affect dimensions
    margin: 0, // Remove default margin
    position: "fixed", // Fix to viewport
    top: 0,
    left: 0,
    overflow: "auto", // Allow scrolling if content is taller than viewport
  },
  card: {
    background: "white",
    borderRadius: "15px",
    padding: "30px",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
    width: "100%",
    maxWidth: "400px",
    margin: "20px", // Add some margin on mobile
  
  // ... rest of your styles remain the same ...
  },
  title: {
    textAlign: "center",
    color: "#2c3e50",
    marginBottom: "30px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
  },
  formGroup: {
    marginBottom: "20px",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    fontWeight: "600",
    color: "#555",
  },
  input: {
    width: "100%",
    padding: "12px 15px",
    border: "2px solid #e1e8ed",
    borderRadius: "8px",
    fontSize: "1rem",
    background: "#fafafa",
    transition: "all 0.3s ease",
    boxSizing: "border-box",
    color: "black",
  },
  button: {
    width: "100%",
    padding: "15px",
    background: "linear-gradient(135deg, #3498db, #9b59b6)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginTop: "10px",
  },
  error: {
    color: "#e74c3c",
    textAlign: "center",
    marginBottom: "20px",
  },
};

export default Login;

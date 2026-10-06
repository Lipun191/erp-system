import { useState } from "react";
import axios from "axios";

import Enquiries from "./enquiries";
import Quotations from "./quotations";
import SalesOrders from "./salesorders";
import Inventory from "./inventory";

const API_URL = "http://127.0.0.1:8000";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [message, setMessage] = useState("");
  const [page, setPage] = useState("dashboard");

  // =========================
  // LOGIN
  // =========================

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const formData = new URLSearchParams();

      formData.append("username", email);
      formData.append("password", password);

      const response = await axios.post(
        `${API_URL}/auth/login`,
        formData,
        {
          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",
          },
        }
      );

      localStorage.setItem(
        "access_token",
        response.data.access_token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(response.data.user)
      );

      setUser(response.data.user);
      setPage("dashboard");
      setMessage("Login successful!");
    } catch (error) {
      setMessage(
        error.response?.data?.detail ||
          "Login failed"
      );
    }
  };

  // =========================
  // LOGOUT
  // =========================

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");

    setUser(null);
    setEmail("");
    setPassword("");
    setPage("dashboard");
    setMessage("");
  };

  // =========================
  // LOGIN PAGE
  // =========================

  if (!user) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#f3f4f6",
        }}
      >
        <form
          onSubmit={handleLogin}
          style={{
            width: "350px",
            padding: "30px",
            background: "white",
            borderRadius: "12px",
            boxShadow:
              "0 4px 20px rgba(0,0,0,0.1)",
          }}
        >
          <h1
            style={{
              textAlign: "center",
            }}
          >
            ERP System
          </h1>

          <h2
            style={{
              textAlign: "center",
            }}
          >
            Login
          </h2>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            required
            style={inputStyle}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            required
            style={inputStyle}
          />

          <button
            type="submit"
            style={buttonStyle}
          >
            Login
          </button>

          {message && (
            <p
              style={{
                textAlign: "center",
                marginTop: "15px",
              }}
            >
              {message}
            </p>
          )}
        </form>
      </div>
    );
  }

  // =========================
  // ENQUIRIES PAGE
  // =========================

  if (page === "enquiries") {
    return (
      <PageLayout
        user={user}
        setPage={setPage}
        handleLogout={handleLogout}
      >
        <Enquiries />
      </PageLayout>
    );
  }

  // =========================
  // QUOTATIONS PAGE
  // =========================

  if (page === "quotations") {
    return (
      <PageLayout
        user={user}
        setPage={setPage}
        handleLogout={handleLogout}
      >
        <Quotations />
      </PageLayout>
    );
  }

  // =========================
  // SALES ORDERS PAGE
  // =========================

  if (page === "salesorders") {
    return (
      <PageLayout
        user={user}
        setPage={setPage}
        handleLogout={handleLogout}
      >
        <SalesOrders />
      </PageLayout>
    );
  }

  // =========================
  // INVENTORY PAGE
  // =========================

  if (page === "inventory") {
    return (
      <PageLayout
        user={user}
        setPage={setPage}
        handleLogout={handleLogout}
      >
        <Inventory />
      </PageLayout>
    );
  }

  // =========================
  // DASHBOARD
  // =========================

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f3f4f6",
      }}
    >
      <nav style={navStyle}>
        <h2>ERP System</h2>

        <div>
          <span
            style={{
              marginRight: "20px",
            }}
          >
            {user.name} ({user.role})
          </span>

          <button
            onClick={handleLogout}
            style={logoutButtonStyle}
          >
            Logout
          </button>
        </div>
      </nav>

      <main
        style={{
          padding: "30px",
        }}
      >
        <h1>Dashboard</h1>

        <p>
          Welcome,{" "}
          <strong>{user.name}</strong>
        </p>

        <div style={cardContainerStyle}>
          {/* ENQUIRIES */}
          <DashboardCard
            title="Enquiries"
            description="Manage customer enquiries"
            onClick={() =>
              setPage("enquiries")
            }
          />

          {/* QUOTATIONS */}
          <DashboardCard
            title="Quotations"
            description="Create and manage quotations"
            onClick={() =>
              setPage("quotations")
            }
          />

          {/* SALES ORDERS */}
          <DashboardCard
            title="Sales Orders"
            description="Manage sales orders"
            onClick={() =>
              setPage("salesorders")
            }
          />

          {/* INVENTORY */}
          <DashboardCard
            title="Inventory"
            description="View product inventory"
            onClick={() =>
              setPage("inventory")
            }
          />
        </div>

        {/* USER INFORMATION */}

        <div style={userBoxStyle}>
          <h2>Logged-in User</h2>

          <p>
            <strong>Name:</strong>{" "}
            {user.name}
          </p>

          <p>
            <strong>Email:</strong>{" "}
            {user.email}
          </p>

          <p>
            <strong>Role:</strong>{" "}
            {user.role}
          </p>
        </div>
      </main>
    </div>
  );
}

// =========================
// COMMON PAGE LAYOUT
// =========================

function PageLayout({
  user,
  setPage,
  handleLogout,
  children,
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f3f4f6",
      }}
    >
      <nav style={navStyle}>
        <h2>ERP System</h2>

        <div>
          <span
            style={{
              marginRight: "20px",
            }}
          >
            {user.name} ({user.role})
          </span>

          <button
            onClick={() =>
              setPage("dashboard")
            }
            style={navButtonStyle}
          >
            Dashboard
          </button>

          <button
            onClick={handleLogout}
            style={logoutButtonStyle}
          >
            Logout
          </button>
        </div>
      </nav>

      <main
        style={{
          padding: "30px",
        }}
      >
        {children}
      </main>
    </div>
  );
}

// =========================
// DASHBOARD CARD
// =========================

function DashboardCard({
  title,
  description,
  onClick,
}) {
  return (
    <div style={cardStyle}>
      <h2>{title}</h2>

      <p
        style={{
          color: "#666",
        }}
      >
        {description}
      </p>

      <button
        onClick={onClick}
        style={buttonStyle}
      >
        Open
      </button>
    </div>
  );
}

// =========================
// STYLES
// =========================

const inputStyle = {
  width: "100%",
  padding: "12px",
  marginBottom: "15px",
  boxSizing: "border-box",
  border: "1px solid #ccc",
  borderRadius: "6px",
};

const buttonStyle = {
  padding: "10px 20px",
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
};

const navStyle = {
  background: "#1e3a8a",
  color: "white",
  padding: "15px 30px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const navButtonStyle = {
  padding: "8px 15px",
  marginRight: "10px",
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
};

const logoutButtonStyle = {
  padding: "8px 15px",
  background: "#dc2626",
  color: "white",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
};

const cardContainerStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "20px",
  marginTop: "30px",
};

const cardStyle = {
  background: "white",
  padding: "25px",
  borderRadius: "10px",
  boxShadow:
    "0 2px 10px rgba(0,0,0,0.08)",
};

const userBoxStyle = {
  marginTop: "30px",
  padding: "20px",
  background: "white",
  borderRadius: "10px",
  boxShadow:
    "0 2px 10px rgba(0,0,0,0.08)",
};

export default App;
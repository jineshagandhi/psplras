import React, { useState } from "react";
import Login from "./pages/Login";
import StudentDashboard from "./pages/StudentDashboard";
import FacultyDashboard from "./pages/FacultyDashboard";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  const [user, setUser] = useState(null);

  const handleLogin = (userData) => setUser(userData);
  const handleLogout = () => { localStorage.clear(); setUser(null); };

  if (!user) return <Login onLogin={handleLogin} />;

  const renderDashboard = () => {
    switch (user.role) {
     case "student":
    return <StudentDashboard prn={user.prn || user.username} name={user.name} />;
      case "faculty":
        return <FacultyDashboard facultyId={user.faculty_id} name={user.name} />;
      case "admin":
        return <AdminDashboard name={user.name} />;
      default:
        return <div>Unknown role</div>;
    }
  };

  const roleColors = {
    student: "#3498db",
    faculty: "#2ecc71",
    admin: "#9b59b6"
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4f8" }}>
      <nav style={styles.navbar}>
        <div style={styles.navBrand}>
          📊 <span style={{ fontWeight: "700" }}>CAS</span>
        </div>
        <div style={styles.navRight}>
          <span style={{
            background: roleColors[user.role],
            color: "white",
            padding: "4px 12px",
            borderRadius: "12px",
            fontSize: "12px",
            fontWeight: "600",
            marginRight: "16px",
            textTransform: "capitalize",
          }}>
            {user.role}
          </span>
          <span style={{ color: "#ccc", marginRight: "16px", fontSize: "14px" }}>
            {user.name}
          </span>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>
      <main style={styles.main}>{renderDashboard()}</main>
    </div>
  );
}

const styles = {
  navbar: {
    background: "#1e3a5f",
    padding: "14px 28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
  },
  navBrand: { color: "white", fontSize: "18px" },
  navRight: { display: "flex", alignItems: "center" },
  logoutBtn: {
    background: "rgba(255,255,255,0.15)",
    border: "1px solid rgba(255,255,255,0.3)",
    color: "white",
    padding: "6px 16px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
  },
  main: { padding: "10px 0" },
};

export default App;
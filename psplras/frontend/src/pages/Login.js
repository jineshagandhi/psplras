import React, { useState } from "react";
import { loginUser } from "../api";

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await loginUser(username, password);
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("name", data.name);
      localStorage.setItem("prn", data.prn || "");
      localStorage.setItem("faculty_id", data.faculty_id || "");
      onLogin(data);
    } catch (err) {
      setError("Invalid PRN/username or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    if (role === "student") { setUsername("S1032233841"); setPassword("student123"); }
    if (role === "faculty") { setUsername("faculty1");    setPassword("faculty123"); }
    if (role === "admin")   { setUsername("admin");       setPassword("admin123"); }
  };

  return (
    <div style={styles.page}>
      <div style={styles.left}>
        <div style={styles.leftContent}>
          <div style={styles.icon}>🎓</div>
          <h1 style={styles.leftTitle}>College Administration System</h1>
          <p style={styles.leftDesc}>
            Track academic progress, identify weak areas, and get personalized
            learning recommendations — all in one place.
          </p>
        </div>
      </div>

      <div style={styles.right}>
        <div style={styles.formBox}>
          <h2 style={styles.signInTitle}>Sign in</h2>
          <p style={styles.signInDesc}>Enter your credentials to access your dashboard</p>

          <form onSubmit={handleLogin}>
            <div style={styles.field}>
              <label style={styles.label}>PRN / Username</label>
              <input
                id="username"
                style={styles.input}
                type="text"
                placeholder="Enter PRN (students) or username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Password</label>
              <div style={styles.passwordWrapper}>
                <input
                  id="password"
                  style={{ ...styles.input, paddingRight: "44px" }}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <span style={styles.eyeBtn} onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? "🙈" : "👁️"}
                </span>
              </div>
            </div>

            {error && <p id="loginError" style={styles.error}>{error}</p>}

            <button id="loginBtn" style={styles.signInBtn} type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div style={styles.demoSection}>
            <p style={styles.demoLabel}>Demo accounts</p>
            <div style={styles.demoRow}>
              {["student", "faculty", "admin"].map((role) => (
                <button
                  key={role}
                  style={styles.demoBtn}
                  onClick={() => fillDemo(role)}
                  type="button"
                >
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </button>
              ))}
            </div>
            <div style={styles.credBox}>
              <p>🎓 Student PRN: <strong>S1032233841</strong> / student123</p>
              <p>👨‍🏫 Faculty: <strong>faculty1</strong> / faculty123</p>
              <p>⚙️ Admin: <strong>admin</strong> / admin123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { display: "flex", minHeight: "100vh" },
  left: {
    width: "45%", background: "#2563eb", display: "flex",
    alignItems: "center", justifyContent: "center", padding: "60px 50px",
  },
  leftContent: { color: "white", maxWidth: "380px" },
  icon: { fontSize: "48px", marginBottom: "32px", display: "block" },
  leftTitle: {
    fontSize: "36px", fontWeight: "800", lineHeight: "1.2",
    marginBottom: "20px", color: "white",
  },
  leftDesc: { fontSize: "16px", lineHeight: "1.7", color: "rgba(255,255,255,0.85)" },
  right: {
    width: "55%", background: "#f3f4f6", display: "flex",
    alignItems: "center", justifyContent: "center", padding: "60px 40px",
  },
  formBox: { width: "100%", maxWidth: "460px" },
  signInTitle: { fontSize: "28px", fontWeight: "700", color: "#111", marginBottom: "8px" },
  signInDesc: { fontSize: "14px", color: "#666", marginBottom: "32px" },
  field: { marginBottom: "20px" },
  label: { display: "block", fontSize: "14px", fontWeight: "600", color: "#333", marginBottom: "8px" },
  input: {
    width: "100%", padding: "12px 16px", border: "1.5px solid #ddd",
    borderRadius: "10px", fontSize: "15px", background: "white",
    boxSizing: "border-box", outline: "none", color: "#333",
  },
  passwordWrapper: { position: "relative" },
  eyeBtn: {
    position: "absolute", right: "14px", top: "50%",
    transform: "translateY(-50%)", cursor: "pointer", fontSize: "16px",
  },
  signInBtn: {
    width: "100%", padding: "14px", background: "#2563eb", color: "white",
    border: "none", borderRadius: "10px", fontSize: "16px", fontWeight: "700",
    cursor: "pointer", marginTop: "8px", letterSpacing: "0.3px",
  },
  error: { color: "#e74c3c", fontSize: "13px", marginBottom: "12px", textAlign: "center" },
  demoSection: { marginTop: "32px" },
  demoLabel: { fontSize: "13px", color: "#888", marginBottom: "12px" },
  demoRow: { display: "flex", gap: "12px", marginBottom: "16px" },
  demoBtn: {
    flex: 1, padding: "10px", border: "1.5px solid #ddd", borderRadius: "10px",
    background: "white", fontSize: "14px", fontWeight: "600", cursor: "pointer", color: "#333",
  },
  credBox: {
    background: "#f0f7ff", borderRadius: "10px", padding: "14px",
    fontSize: "13px", color: "#444", lineHeight: "2",
  },
};

export default Login;
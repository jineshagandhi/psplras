import React, { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { getStudentAnalysis, getMLRecommendations } from "../api";

const GRADE_COLORS = {
  Distinction: "#2563eb",
  Merit: "#f59e0b",
  Pass: "#10b981",
  "At-Risk": "#ef4444",
};

const PLATFORM_ICONS = {
  YouTube: "▶",
  NPTEL: "🎓",
  GeeksforGeeks: "💻",
  Coursera: "📜",
  "Khan Academy": "🏫",
};

function StudentDashboard({ prn, name }) {
  const [data, setData] = useState(null);
  const [mlData, setMlData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mlLoading, setMlLoading] = useState(true);
  const [error, setError] = useState("");
  const [activePage, setActivePage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [subjectFilter, setSubjectFilter] = useState("All Subjects");
  const [showProfile, setShowProfile] = useState(false);
  const [resTab, setResTab] = useState("recommended");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getStudentAnalysis(prn);
        setData(result);
      } catch (e) {
        setError("Failed to load data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [prn]);

  useEffect(() => {
    const fetchML = async () => {
      try {
        const result = await getMLRecommendations(prn);
        setMlData(result);
      } catch (e) {
        console.log("ML recommendations not available", e);
      } finally {
        setMlLoading(false);
      }
    };
    fetchML();
  }, [prn]);

  if (loading) return (
    <div style={styles.fullCenter}>
      <div style={styles.spinner} />
      <p style={{ color: "#64748b", marginTop: "16px" }}>Loading your dashboard...</p>
    </div>
  );
  if (error) return <div style={styles.fullCenter}>{error}</div>;
  if (!data || data.error) return <div style={styles.fullCenter}>No data found.</div>;

  const subjects = data.subject_summary.map(s => s.subject_name);
  const filteredAttendance = subjectFilter === "All Subjects"
    ? data.subject_summary
    : data.subject_summary.filter(s => s.subject_name === subjectFilter);

  const att = data.attendance;
  const attPct = att?.percentage || 0;
  const riskLevel = attPct >= 80 ? "Low" : attPct >= 65 ? "Medium" : "High";
  const riskColor = attPct >= 80 ? "#22c55e" : attPct >= 65 ? "#f59e0b" : "#ef4444";

  // Change 2: Removed "Late" from donut data
  const donutData = [
    { name: "Present", value: Math.round(attPct), color: "#22c55e" },
    { name: "Absent", value: Math.round(100 - attPct), color: "#ef4444" },
  ];

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "⊞" },
    { id: "attendance", label: "Attendance", icon: "📅" },
    { id: "resources", label: "Resources", icon: "📖" },
    { id: "report", label: "Report", icon: "📋" },
    { id: "profile", label: "Profile", icon: "👤" },
  ];

  const mlRisk = mlData?.risk_assessment;
  const riskScoreColor = mlRisk?.risk_score >= 60 ? "#ef4444"
    : mlRisk?.risk_score >= 30 ? "#f59e0b" : "#22c55e";
  const performanceScore = mlRisk ? Math.round(100 - mlRisk.risk_score) : null;
  const performanceLabel = mlRisk?.risk_label === "Low Risk" ? "On Track"
    : mlRisk?.risk_label === "Moderate Risk" ? "Needs Attention" : "Needs Support";
  const studentStatus = mlData?.cluster_info?.cluster_label === "High Performer" ? "🌟 Excellent"
    : mlData?.cluster_info?.cluster_label === "Needs Support" ? "📈 Improving"
    : "✅ On Track";

  return (
    <div style={styles.layout}>
      {/* SIDEBAR */}
      <div style={{ ...styles.sidebar, width: sidebarOpen ? "260px" : "64px" }}>
        <div style={styles.sidebarTop}>
          <div style={styles.sidebarBrand}>
            <div style={styles.brandIconBox}>🎓</div>
            {sidebarOpen && (
              <div>
                {/* Change 1: PSPLRAS → CAS */}
                <div style={styles.brandName}>CAS</div>
                <div style={styles.brandSub}>Student Portal</div>
              </div>
            )}
          </div>
          <nav style={styles.nav}>
            {navItems.map((item) => (
              <button key={item.id}
                style={{
                  ...styles.navBtn,
                  background: activePage === item.id
                    ? "linear-gradient(135deg, #2563eb, #1d4ed8)"
                    : "transparent",
                  color: activePage === item.id ? "white" : "#94a3b8",
                  justifyContent: sidebarOpen ? "flex-start" : "center",
                  boxShadow: activePage === item.id
                    ? "0 4px 12px rgba(37,99,235,0.4)" : "none",
                }}
                onClick={() => setActivePage(item.id)}>
                <span style={{ fontSize: "18px" }}>{item.icon}</span>
                {sidebarOpen && <span style={{ marginLeft: "12px" }}>{item.label}</span>}
                {item.id === "resources" && mlData?.total_recommendations > 0 && sidebarOpen && (
                  <span style={{
                    marginLeft: "auto", background: "#ef4444", color: "white",
                    borderRadius: "10px", fontSize: "10px", padding: "2px 6px", fontWeight: "700"
                  }}>
                    {mlData.total_recommendations}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div style={styles.sidebarBottom}>
          <button style={styles.collapseBtn} onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? "◀" : "▶"}
          </button>
          {sidebarOpen && (
            <>
              <div style={styles.userInfo}>
                <div style={styles.userAvatar}>{name?.charAt(0) || "S"}</div>
                <div>
                  <div style={{ color: "white", fontSize: "13px", fontWeight: "600" }}>{name}</div>
                  <div style={{ color: "#64748b", fontSize: "11px" }}>{prn}</div>
                </div>
              </div>
              <button style={styles.logoutSideBtn}
                onClick={() => { localStorage.clear(); window.location.reload(); }}>
                ↪ Logout
              </button>
            </>
          )}
        </div>
      </div>

      {/* MAIN */}
      <div style={{ ...styles.main, marginLeft: sidebarOpen ? "260px" : "64px" }}>
        {/* Topbar */}
        <div style={styles.topbar}>
          <h1 style={styles.pageTitle}>
            {navItems.find(n => n.id === activePage)?.icon}{" "}
            {activePage.charAt(0).toUpperCase() + activePage.slice(1)}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {mlRisk && (
              <div style={{
                background: riskScoreColor + "20",
                border: `1px solid ${riskScoreColor}`,
                borderRadius: "20px", padding: "4px 14px",
                fontSize: "12px", fontWeight: "700", color: riskScoreColor
              }}>
                {performanceLabel}
              </div>
            )}
            <button
              onClick={() => { setLoading(true); }}
              style={styles.refreshBtn}>
              🔄 Refresh
            </button>
            <span style={styles.topbarName} onClick={() => setShowProfile(!showProfile)}>
              {name} ▾
            </span>
          </div>
        </div>

        {/* Profile dropdown */}
        {showProfile && (
          <div style={styles.profileDropdown}>
            {[
              { label: "PRN", value: prn },
              { label: "Name", value: name },
              { label: "Department", value: "Computer Science & Engineering" },
              { label: "Semester", value: "4" },
              { label: "Class", value: "CSE-SEM4-A" },
              { label: "Status", value: studentStatus },
            ].map((row, i) => (
              <div key={i} style={styles.profileRow}>
                <span style={styles.profileLabel}>{row.label}</span>
                <span style={styles.profileValue}>{row.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* ══════════════ DASHBOARD PAGE ══════════════ */}
        {activePage === "dashboard" && (
          <div>
            <div style={styles.infoBar}>
              <span><span style={styles.infoLabel}>PRN: </span><strong>{prn}</strong></span>
              <span style={styles.infoDivider}>|</span>
              <span><span style={styles.infoLabel}>Dept: </span><strong>CSE</strong></span>
              <span style={styles.infoDivider}>|</span>
              <span><span style={styles.infoLabel}>Semester: </span><strong>4</strong></span>
              <span style={styles.infoDivider}>|</span>
              <span><span style={styles.infoLabel}>Status: </span>
                <strong style={{ color: riskScoreColor }}>{studentStatus}</strong>
              </span>
            </div>

            <div style={styles.kpiRow}>
              <KpiCard label="Overall %" value={`${data.statistics.mean}%`}
                icon="📊" color="#2563eb" bg="#eff6ff" />
              <KpiCard label="Attendance" value={`${attPct}%`}
                icon="📅" color={riskColor} bg={riskColor + "15"}
                sub={`Risk: ${riskLevel}`} subColor={riskColor} />
              <KpiCard label="Performance Score"
                value={performanceScore ? `${performanceScore}%` : `${data.statistics.mean}%`}
                icon="🎯" color={riskScoreColor} bg={riskScoreColor + "15"}
                sub={performanceLabel} subColor={riskScoreColor} />
              <KpiCard label="Subjects" value={data.subject_summary.length}
                icon="📘" color="#8b5cf6" bg="#f5f3ff" sub="Semester 4" />
            </div>

            <div style={styles.chartsRow}>
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Subject-wise Performance</h3>
                <p style={styles.cardSub}>Marks out of 100</p>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={data.subject_summary} margin={{ bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="subject_name" tick={{ fontSize: 10 }}
                      tickFormatter={(v) => v.split(" ").slice(0, 2).join(" ")}
                      angle={-20} textAnchor="end" />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                      {data.subject_summary.map((s, i) => (
                        <Cell key={i} fill={GRADE_COLORS[s.grade] || "#2563eb"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={styles.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <h3 style={styles.cardTitle}>Attendance Overview</h3>
                    <p style={styles.cardSub}>Overall: {attPct}%</p>
                  </div>
                  <select style={styles.filterSelect} value={subjectFilter}
                    onChange={(e) => setSubjectFilter(e.target.value)}>
                    <option>All Subjects</option>
                    {subjects.map((s, i) => <option key={i}>{s}</option>)}
                  </select>
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={filteredAttendance} margin={{ bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="subject_name" tick={{ fontSize: 10 }}
                      tickFormatter={(v) => v.split(" ").slice(0, 2).join(" ")}
                      angle={-20} textAnchor="end" />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={() => [`${attPct}%`, "Attendance"]} />
                    <Bar dataKey={() => attPct} name="Attendance" radius={[6, 6, 0, 0]}>
                      {filteredAttendance.map((_, i) => (
                        <Cell key={i} fill={attPct >= 80 ? "#22c55e" : attPct >= 65 ? "#f59e0b" : "#ef4444"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ ATTENDANCE PAGE ══════════════ */}
        {activePage === "attendance" && (
          <div style={styles.chartsRow}>
            {/* Change 3: Lecture-based detailed attendance table */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Attendance Summary</h3>
              <p style={styles.cardSub}>Overall: {attPct}%</p>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHead}>
                    <th style={styles.th}>#</th>
                    <th style={styles.th}>Subject</th>
                    <th style={styles.th}>Total Lectures</th>
                    <th style={styles.th}>Attended</th>
                    <th style={styles.th}>Missed</th>
                    <th style={styles.th}>%</th>
                    <th style={styles.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.subject_summary.map((s, i) => {
                    // Calculate lecture numbers based on attendance percentage
                    const totalLectures = 40;
                    const attended = Math.round((attPct / 100) * totalLectures);
                    const missed = totalLectures - attended;
                    const color = attPct >= 80 ? "#22c55e"
                      : attPct >= 65 ? "#f59e0b" : "#ef4444";
                    return (
                      <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>
                        <td style={{ ...styles.td, color: "#64748b" }}>{i + 1}</td>
                        <td style={{ ...styles.td, fontWeight: "600" }}>{s.subject_name}</td>
                        <td style={styles.td}>{totalLectures}</td>
                        <td style={{ ...styles.td, color: "#22c55e", fontWeight: "700" }}>
                          {attended}
                        </td>
                        <td style={{ ...styles.td, color: "#ef4444", fontWeight: "700" }}>
                          {missed}
                        </td>
                        <td style={{ ...styles.td, color, fontWeight: "700" }}>{attPct}%</td>
                        <td style={styles.td}>
                          <span style={badgeStyle(
                            attPct >= 80 ? "green" : attPct >= 65 ? "yellow" : "red"
                          )}>
                            {attPct >= 80 ? "✅ Good"
                              : attPct >= 65 ? "⚠️ Warning" : "❌ Critical"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {/* Lectures needed to reach 75% */}
              {attPct < 75 && (
                <div style={{ ...styles.alertYellow, marginTop: "16px" }}>
                  📊 You need to attend{" "}
                  <strong>
                    {Math.ceil((0.75 * 40 * data.subject_summary.length - (attPct / 100) * 40 * data.subject_summary.length) / (1 - 0.75))}
                  </strong>{" "}
                  more lectures to reach 75% attendance.
                </div>
              )}
            </div>

            {/* Donut chart — Change 2: only Present & Absent */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Attendance Breakdown</h3>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <PieChart width={260} height={260}>
                  <Pie data={donutData} cx="50%" cy="50%"
                    innerRadius={65} outerRadius={105} dataKey="value">
                    {donutData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </div>
              <div style={{ display: "flex", gap: "20px", justifyContent: "center", marginTop: "8px" }}>
                {donutData.map((d, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
                    <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: d.color }} />
                    <span>{d.name} ({d.value}%)</span>
                  </div>
                ))}
              </div>
              {att?.risk_level === "Critical" && (
                <div style={{ ...styles.alertRed, marginTop: "20px" }}>
                  ⚠️ <strong>Critical:</strong> Below 65% — you are at risk!
                </div>
              )}
              {att?.risk_level === "Warning" && (
                <div style={{ ...styles.alertYellow, marginTop: "20px" }}>
                  ⚠️ <strong>Warning:</strong> Between 65–80% — please improve.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════ RESOURCES PAGE ══════════════ */}
        {activePage === "resources" && (
          <div>
            <div style={styles.resTabRow}>
              <button
                style={{ ...styles.resTab, ...(resTab === "recommended" ? styles.resTabActive : {}) }}
                onClick={() => setResTab("recommended")}>
                ⭐ Recommended for You
                {mlData?.total_recommendations > 0 && (
                  <span style={styles.resBadge}>{mlData.total_recommendations}</span>
                )}
              </button>
              <button
                style={{ ...styles.resTab, ...(resTab === "all" ? styles.resTabActive : {}) }}
                onClick={() => setResTab("all")}>
                📚 All Resources
              </button>
            </div>

            {resTab === "recommended" && (
              <div>
                {mlLoading ? (
                  <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                    ⏳ Finding best resources for you...
                  </div>
                ) : mlData?.ml_recommendations?.length > 0 ? (
                  <div>
                    <p style={{ color: "#64748b", fontSize: "13px", marginBottom: "20px" }}>
                      These resources are picked based on your performance — subjects you need the most help with come first.
                    </p>
                    <div style={styles.mlGrid}>
                      {mlData.ml_recommendations.map((r, i) => (
                        <ResourceCard key={i} rec={r} rank={i + 1} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={styles.emptyState}>
                    <div style={{ fontSize: "48px", marginBottom: "12px" }}>🎉</div>
                    <div style={{ fontWeight: "700", fontSize: "18px", color: "#0f172a" }}>
                      You're doing great in all subjects!
                    </div>
                    <div style={{ color: "#64748b", marginTop: "8px" }}>
                      No specific recommendations right now. Keep it up!
                    </div>
                  </div>
                )}
              </div>
            )}

            {resTab === "all" && (
              <div>
                <p style={{ color: "#64748b", fontSize: "13px", marginBottom: "16px" }}>
                  All resources added by your teachers
                </p>
                {data.recommendations.length > 0 ? (
                  <div style={styles.resourceGrid}>
                    {data.recommendations.map((r, i) => (
                      <div key={i} style={styles.resourceCard}>
                        <div style={styles.platformTag}>
                          {PLATFORM_ICONS[r.platform] || "🔗"} {r.platform}
                        </div>
                        <p style={{ fontWeight: "700", fontSize: "15px", margin: "8px 0 4px" }}>
                          {r.title}
                        </p>
                        <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "16px" }}>
                          {r.subject}
                        </p>
                        <a href={r.url} target="_blank" rel="noreferrer" style={styles.resourceLink}>
                          Open Resource ↗
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: "#64748b" }}>No resources added yet.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ══════════════ REPORT PAGE ══════════════ */}
        {/* Change 4: Weak subjects moved here from attendance page */}
        {activePage === "report" && (
          <div>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>📋 Performance Report</h3>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHead}>
                    <th style={styles.th}>Subject</th>
                    <th style={styles.th}>Score</th>
                    <th style={styles.th}>Grade</th>
                    <th style={styles.th}>Semester</th>
                  </tr>
                </thead>
                <tbody>
                  {data.subject_summary.map((s, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>
                      <td style={styles.td}>{s.subject_name}</td>
                      <td style={styles.td}>
                        <div style={styles.scoreBar}>
                          <div style={{
                            ...styles.scoreBarFill,
                            width: `${s.score}%`,
                            background: GRADE_COLORS[s.grade] || "#2563eb"
                          }} />
                          <span style={{ marginLeft: "8px", fontWeight: "600" }}>{s.score}%</span>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={gradeBadge(s.grade)}>{s.grade}</span>
                      </td>
                      <td style={styles.td}>{s.semester}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={styles.statsRow}>
                <StatPill label="Average" value={`${data.statistics.mean}%`} color="#2563eb" />
                <StatPill label="Highest" value={`${data.statistics.highest}%`} color="#22c55e" />
                <StatPill label="Lowest" value={`${data.statistics.lowest}%`} color="#ef4444" />
                <StatPill label="Std Dev" value={`${data.statistics.std_dev}`} color="#8b5cf6" />
              </div>
            </div>

            {/* Weak subjects — moved from attendance page */}
            {data.weak_subjects.length > 0 && (
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>⚠️ Subjects Needing Attention</h3>
                <p style={styles.cardSub}>You need to improve in these subjects</p>
                {data.weak_subjects.map((ws, i) => (
                  <div key={i} style={styles.weakCard}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span style={{ color: "#ef4444", fontWeight: "700", fontSize: "14px" }}>
                        {ws.subject_name}
                      </span>
                      <span style={badgeStyle("red")}>Needs Work</span>
                    </div>
                    <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "8px" }}>
                      Your Score: <strong>{ws.score}</strong> · Passing: 40 · You need{" "}
                      <strong>{40 - ws.score} more points</strong>
                    </div>
                    <div style={styles.progressBg}>
                      <div style={{
                        ...styles.progressFill,
                        width: `${ws.score}%`,
                        background: "#ef4444"
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════ PROFILE PAGE ══════════════ */}
        {activePage === "profile" && (
          <div style={styles.card}>
            <div style={styles.profileHeader}>
              <div style={styles.profileAvatar}>{name?.charAt(0) || "S"}</div>
              <div>
                <h2 style={{ margin: 0, color: "#0f172a" }}>{name}</h2>
                <p style={{ color: "#64748b", margin: "4px 0 0" }}>{prn}</p>
                <span style={{
                  display: "inline-block", marginTop: "8px",
                  background: riskScoreColor + "20",
                  color: riskScoreColor,
                  border: `1px solid ${riskScoreColor}`,
                  borderRadius: "20px", padding: "3px 12px",
                  fontSize: "12px", fontWeight: "700"
                }}>
                  {studentStatus}
                </span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {[
                { label: "Full Name", value: name },
                { label: "PRN", value: prn },
                { label: "Department", value: "Computer Science & Engineering" },
                { label: "Semester", value: "4" },
                { label: "Class", value: "CSE-SEM4-A" },
                { label: "Overall Average", value: `${data.statistics.mean}%` },
                { label: "Attendance", value: `${attPct}%` },
                { label: "Attendance Status", value: riskLevel === "Low" ? "✅ Good" : riskLevel === "Medium" ? "⚠️ Warning" : "❌ Critical" },
                { label: "Performance Score", value: performanceScore ? `${performanceScore}%` : `${data.statistics.mean}%` },
                { label: "Overall Status", value: performanceLabel },
              ].map((row, i) => (
                <div key={i} style={styles.profileDataRow}>
                  <span style={styles.profileDataLabel}>{row.label}</span>
                  <span style={styles.profileDataValue}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Resource Card ─────────────────────────────────────────

function ResourceCard({ rec, rank }) {
  const urgencyColor = rec.urgency >= 0.4 ? "#ef4444"
    : rec.urgency >= 0.2 ? "#f59e0b" : "#22c55e";
  const urgencyLabel = rec.urgency >= 0.4 ? "High Priority"
    : rec.urgency >= 0.2 ? "Medium Priority" : "Good to Study";
  const pointsNeeded = Math.round(rec.gap_from_mean);

  return (
    <div style={styles.mlCard}>
      <div style={styles.mlRank}>#{rank}</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
        <div style={{
          background: urgencyColor + "15", color: urgencyColor,
          border: `1px solid ${urgencyColor}`,
          borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: "700"
        }}>
          {urgencyLabel}
        </div>
        <div style={{
          background: "#2563eb15", color: "#2563eb",
          borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: "700"
        }}>
          {rec.confidence_score}% match
        </div>
      </div>
      <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {rec.subject_name}
      </div>
      <p style={{ fontWeight: "700", fontSize: "15px", color: "#0f172a", margin: "0 0 4px" }}>
        {rec.title}
      </p>
      <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 12px" }}>
        {PLATFORM_ICONS[rec.platform] || "🔗"} {rec.platform}
      </p>
      <div style={styles.mlScoreRow}>
        <div style={styles.mlScoreItem}>
          <span style={styles.mlScoreLabel}>Your Score</span>
          <span style={{ ...styles.mlScoreValue, color: rec.student_score < 40 ? "#ef4444" : "#f59e0b" }}>
            {rec.student_score}%
          </span>
        </div>
        <div style={styles.mlScoreItem}>
          <span style={styles.mlScoreLabel}>Need to Improve</span>
          <span style={{ ...styles.mlScoreValue, color: "#ef4444" }}>
            +{pointsNeeded} pts
          </span>
        </div>
      </div>
      <div style={styles.mlReason}>💡 {rec.recommendation_reason}</div>
      <a href={rec.url} target="_blank" rel="noreferrer" style={styles.mlBtn}>
        Start Learning ↗
      </a>
    </div>
  );
}

// ── Helper Components ─────────────────────────────────────

function KpiCard({ label, value, icon, color, bg, sub, subColor }) {
  return (
    <div style={{ ...styles.kpiCard, borderTop: `3px solid ${color}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={styles.kpiLabel}>{label}</p>
          <p style={{ ...styles.kpiValue, color }}>{value}</p>
          {sub && <p style={{ fontSize: "12px", color: subColor || "#64748b", marginTop: "4px" }}>{sub}</p>}
        </div>
        <div style={{ background: bg, borderRadius: "10px", padding: "10px", fontSize: "20px" }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function StatPill({ label, value, color }) {
  return (
    <div style={{
      background: color + "10", border: `1px solid ${color}20`,
      borderRadius: "10px", padding: "12px 20px", textAlign: "center"
    }}>
      <div style={{ fontSize: "12px", color: "#64748b" }}>{label}</div>
      <div style={{ fontSize: "20px", fontWeight: "700", color }}>{value}</div>
    </div>
  );
}

function gradeBadge(grade) {
  const colors = { Distinction: "#2563eb", Merit: "#f59e0b", Pass: "#10b981", "At-Risk": "#ef4444" };
  const c = colors[grade] || "#64748b";
  return {
    background: c + "15", color: c, border: `1px solid ${c}`,
    borderRadius: "20px", padding: "3px 10px", fontSize: "12px", fontWeight: "700"
  };
}

function badgeStyle(type) {
  const map = {
    green: { bg: "#dcfce7", color: "#16a34a" },
    yellow: { bg: "#fef9c3", color: "#ca8a04" },
    red: { bg: "#fee2e2", color: "#dc2626" },
  };
  const { bg, color } = map[type] || map.green;
  return {
    background: bg, color, borderRadius: "20px",
    padding: "3px 10px", fontSize: "12px", fontWeight: "600"
  };
}

const styles = {
  layout: { display: "flex", minHeight: "100vh", background: "#f8fafc" },
  sidebar: {
    background: "#0f172a", display: "flex", flexDirection: "column",
    justifyContent: "space-between", transition: "width 0.3s",
    overflow: "hidden", minHeight: "100vh", position: "fixed",
    left: 0, top: 0, zIndex: 100,
  },
  sidebarTop: { padding: "20px 0" },
  sidebarBrand: {
    display: "flex", alignItems: "center", gap: "12px",
    padding: "0 16px 24px 16px", borderBottom: "1px solid #1e293b",
  },
  brandIconBox: {
    fontSize: "24px", background: "#2563eb", borderRadius: "10px",
    padding: "6px 10px", flexShrink: 0
  },
  brandName: { color: "white", fontWeight: "800", fontSize: "15px" },
  brandSub: { color: "#64748b", fontSize: "11px" },
  nav: { padding: "16px 8px", display: "flex", flexDirection: "column", gap: "4px" },
  navBtn: {
    display: "flex", alignItems: "center", padding: "10px 14px",
    borderRadius: "10px", border: "none", cursor: "pointer",
    fontSize: "14px", fontWeight: "500", width: "100%", transition: "all 0.2s",
  },
  sidebarBottom: { padding: "16px", borderTop: "1px solid #1e293b" },
  collapseBtn: {
    background: "transparent", border: "none", color: "#64748b",
    cursor: "pointer", fontSize: "14px", marginBottom: "12px",
    width: "100%", textAlign: "right",
  },
  userInfo: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" },
  userAvatar: {
    width: "36px", height: "36px", borderRadius: "50%",
    background: "linear-gradient(135deg, #2563eb, #7c3aed)",
    color: "white", display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: "700", fontSize: "14px", flexShrink: 0,
  },
  logoutSideBtn: {
    background: "transparent", border: "none", color: "#64748b",
    cursor: "pointer", fontSize: "13px"
  },
  main: { flex: 1, padding: "24px 32px", transition: "margin-left 0.3s" },
  topbar: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    marginBottom: "24px", paddingBottom: "16px", borderBottom: "1px solid #e2e8f0",
  },
  pageTitle: { fontSize: "22px", fontWeight: "700", color: "#0f172a" },
  refreshBtn: {
    background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: "8px",
    padding: "6px 14px", cursor: "pointer", fontSize: "13px",
    fontWeight: "600", color: "#0f172a"
  },
  topbarName: {
    fontWeight: "700", color: "#0f172a", cursor: "pointer", fontSize: "14px",
    padding: "6px 14px", borderRadius: "8px",
    background: "#f1f5f9", border: "1px solid #e2e8f0",
  },
  profileDropdown: {
    background: "white", borderRadius: "12px", padding: "20px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)", marginBottom: "20px",
    border: "1px solid #e2e8f0", maxWidth: "500px",
  },
  profileRow: {
    display: "flex", justifyContent: "space-between",
    padding: "8px 0", borderBottom: "1px solid #f0f0f0", fontSize: "14px"
  },
  profileLabel: { color: "#64748b" },
  profileValue: { fontWeight: "600", color: "#0f172a" },
  infoBar: {
    background: "white", borderRadius: "10px", padding: "12px 20px",
    marginBottom: "20px", display: "flex", gap: "16px", flexWrap: "wrap",
    fontSize: "13px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    border: "1px solid #e2e8f0", alignItems: "center",
  },
  infoLabel: { color: "#64748b" },
  infoDivider: { color: "#cbd5e1" },
  kpiRow: { display: "flex", gap: "16px", marginBottom: "20px", flexWrap: "wrap" },
  kpiCard: {
    flex: 1, minWidth: "180px", background: "white", borderRadius: "14px",
    padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0",
  },
  kpiLabel: { fontSize: "12px", color: "#64748b", marginBottom: "6px" },
  kpiValue: { fontSize: "26px", fontWeight: "700", margin: 0 },
  chartsRow: { display: "flex", gap: "20px", flexWrap: "wrap", marginBottom: "20px" },
  card: {
    flex: 1, minWidth: "300px", background: "white", borderRadius: "14px",
    padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    border: "1px solid #e2e8f0", marginBottom: "20px",
  },
  cardTitle: { fontSize: "16px", fontWeight: "700", color: "#0f172a", marginBottom: "4px" },
  cardSub: { fontSize: "13px", color: "#64748b", marginBottom: "16px" },
  filterSelect: {
    padding: "6px 12px", border: "1px solid #e2e8f0",
    borderRadius: "8px", fontSize: "13px", background: "white"
  },
  table: { width: "100%", borderCollapse: "collapse" },
  tableHead: { background: "#f8fafc" },
  th: {
    padding: "12px", textAlign: "left", fontWeight: "600",
    fontSize: "12px", color: "#64748b", borderBottom: "1px solid #e2e8f0"
  },
  td: { padding: "12px", fontSize: "14px", borderBottom: "1px solid #f0f0f0" },
  weakCard: {
    background: "#fff5f5", border: "1px solid #fecaca",
    borderRadius: "10px", padding: "14px", marginBottom: "12px"
  },
  progressBg: { background: "#fee2e2", borderRadius: "4px", height: "6px" },
  progressFill: { height: "6px", borderRadius: "4px" },
  alertRed: {
    background: "#fef2f2", border: "1px solid #fca5a5",
    borderRadius: "8px", padding: "12px", fontSize: "13px"
  },
  alertYellow: {
    background: "#fffbeb", border: "1px solid #fcd34d",
    borderRadius: "8px", padding: "12px", fontSize: "13px"
  },
  resTabRow: { display: "flex", gap: "8px", marginBottom: "20px" },
  resTab: {
    padding: "10px 20px", border: "1.5px solid #e2e8f0", borderRadius: "10px",
    background: "white", cursor: "pointer", fontWeight: "600", fontSize: "14px",
    color: "#64748b", display: "flex", alignItems: "center", gap: "8px",
  },
  resTabActive: { background: "#2563eb", color: "white", border: "1.5px solid #2563eb" },
  resBadge: {
    background: "#ef4444", color: "white", borderRadius: "10px",
    fontSize: "10px", padding: "2px 7px", fontWeight: "700",
  },
  mlGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px"
  },
  mlCard: {
    background: "white", borderRadius: "14px", padding: "20px",
    border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    position: "relative",
  },
  mlRank: {
    position: "absolute", top: "-10px", left: "16px",
    background: "#0f172a", color: "white", borderRadius: "20px",
    padding: "2px 10px", fontSize: "11px", fontWeight: "700",
  },
  mlScoreRow: { display: "flex", gap: "12px", marginBottom: "12px" },
  mlScoreItem: { flex: 1, background: "#f8fafc", borderRadius: "8px", padding: "8px 12px" },
  mlScoreLabel: { display: "block", fontSize: "11px", color: "#64748b", marginBottom: "2px" },
  mlScoreValue: { fontSize: "18px", fontWeight: "700" },
  mlReason: {
    background: "#f0f7ff", borderRadius: "8px", padding: "8px 12px",
    fontSize: "12px", color: "#2563eb", marginBottom: "14px",
  },
  mlBtn: {
    display: "block", textAlign: "center",
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "white", padding: "10px", borderRadius: "8px",
    fontWeight: "600", fontSize: "13px", textDecoration: "none",
  },
  resourceGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "16px"
  },
  resourceCard: {
    background: "white", borderRadius: "12px", padding: "20px",
    border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  },
  platformTag: {
    display: "inline-block", background: "#f1f5f9", color: "#475569",
    borderRadius: "6px", padding: "3px 10px", fontSize: "12px", fontWeight: "600",
  },
  resourceLink: {
    color: "#2563eb", fontWeight: "600", fontSize: "13px", textDecoration: "none"
  },
  emptyState: { textAlign: "center", padding: "60px 20px" },
  statsRow: { display: "flex", gap: "12px", marginTop: "20px", flexWrap: "wrap" },
  scoreBar: { display: "flex", alignItems: "center" },
  scoreBarFill: { height: "6px", borderRadius: "4px", minWidth: "4px" },
  profileHeader: {
    display: "flex", alignItems: "center", gap: "20px",
    marginBottom: "24px", paddingBottom: "20px", borderBottom: "1px solid #f0f0f0"
  },
  profileAvatar: {
    width: "64px", height: "64px", borderRadius: "50%",
    background: "linear-gradient(135deg, #2563eb, #7c3aed)",
    color: "white", display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: "800", fontSize: "24px",
  },
  profileDataRow: { display: "flex", padding: "12px 0", borderBottom: "1px solid #f8fafc" },
  profileDataLabel: { width: "200px", color: "#64748b", fontSize: "14px" },
  profileDataValue: { fontWeight: "600", fontSize: "14px", color: "#0f172a" },
  fullCenter: {
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", minHeight: "100vh"
  },
  spinner: {
    width: "40px", height: "40px", border: "4px solid #e2e8f0",
    borderTop: "4px solid #2563eb", borderRadius: "50%",
    animation: "spin 0.8s linear infinite"
  },
};

export default StudentDashboard;
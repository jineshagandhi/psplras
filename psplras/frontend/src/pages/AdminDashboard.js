import React, { useState, useEffect } from "react";
import {
  createStudent, createFaculty, createClass,
  assignFaculty, getAdminOverview, getClasses,
  getFacultyList, getClassAnalysis, addResource
} from "../api";

function AdminDashboard({ name }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [overview, setOverview] = useState(null);
  const [classAnalysis, setClassAnalysis] = useState(null);
  const [selectedClass, setSelectedClass] = useState("CSE-SEM4-A");

  const [studentForm, setStudentForm] = useState({ prn: "", password: "", name: "", semester: "", branch: "", class_id: "" });
  const [facultyForm, setFacultyForm] = useState({ username: "", password: "", name: "", faculty_id: "" });
  const [classForm, setClassForm] = useState({ class_id: "", name: "", branch: "", semester: "" });
  const [assignForm, setAssignForm] = useState({ faculty_id: "", class_id: "", subject_code: "", subject_name: "" });
  const [resourceForm, setResourceForm] = useState({ subject_code: "", subject_name: "", title: "", platform: "", url: "" });

  const showMsg = (msg) => { setMessage(msg); setError(""); setTimeout(() => setMessage(""), 4000); };
  const showErr = (msg) => { setError(msg); setMessage(""); };

  useEffect(() => { loadOverview(); }, []);
  useEffect(() => { if (selectedClass) loadClassAnalysis(selectedClass); }, [selectedClass]);

  const loadOverview = async () => {
    try {
      const data = await getAdminOverview();
      setOverview(data);
    } catch (e) { showErr("Failed to load overview"); }
  };

  const loadClassAnalysis = async (classId) => {
    try {
      const data = await getClassAnalysis(classId);
      setClassAnalysis(data);
    } catch (e) { console.log("Class analysis error", e); }
  };

  const handleCreateStudent = async () => {
    try {
      if (!studentForm.prn || !studentForm.name || !studentForm.class_id) { showErr("Fill all fields!"); return; }
     await createStudent({
     prn: studentForm.prn,
     password: studentForm.password,
    name: studentForm.name,
    semester: parseInt(studentForm.semester),
    branch: studentForm.branch,
    class_id: studentForm.class_id
    });
      showMsg(`✅ Student ${studentForm.name} with PRN ${studentForm.prn} created!`);
      setStudentForm({ prn: "", password: "", name: "", semester: "", branch: "", class_id: "" });
      loadOverview();
    } catch (e) { showErr("❌ " + (e.response?.data?.detail || "Error")); }
  };

  const handleCreateFaculty = async () => {
    try {
      if (!facultyForm.username || !facultyForm.faculty_id) { showErr("Fill all fields!"); return; }
      await createFaculty(facultyForm);
      showMsg(`✅ Faculty ${facultyForm.name} created!`);
      setFacultyForm({ username: "", password: "", name: "", faculty_id: "" });
      loadOverview();
    } catch (e) { showErr("❌ " + (e.response?.data?.detail || "Error")); }
  };

  const handleCreateClass = async () => {
    try {
      if (!classForm.class_id) { showErr("Fill all fields!"); return; }
      await createClass({ ...classForm, semester: parseInt(classForm.semester) });
      showMsg(`✅ Class ${classForm.class_id} created!`);
      setClassForm({ class_id: "", name: "", branch: "", semester: "" });
      loadOverview();
    } catch (e) { showErr("❌ " + (e.response?.data?.detail || "Error")); }
  };

  const handleAssignFaculty = async () => {
    try {
      if (!assignForm.faculty_id || !assignForm.class_id || !assignForm.subject_code) { showErr("Fill all fields!"); return; }
      await assignFaculty(assignForm);
      showMsg("✅ Faculty assigned successfully!");
      setAssignForm({ faculty_id: "", class_id: "", subject_code: "", subject_name: "" });
      loadOverview();
    } catch (e) { showErr("❌ " + (e.response?.data?.detail || "Error")); }
  };

  const handleAddResource = async () => {
    try {
      if (!resourceForm.subject_code || !resourceForm.url) { showErr("Fill all fields!"); return; }
      await addResource(resourceForm);
      showMsg("✅ Resource added!");
      setResourceForm({ subject_code: "", subject_name: "", title: "", platform: "", url: "" });
    } catch (e) { showErr("❌ " + (e.response?.data?.detail || "Error")); }
  };

  const tabs = [
    { id: "overview", label: "📊 Overview" },
    { id: "student", label: "👤 Add Student" },
    { id: "faculty", label: "🎓 Add Faculty" },
    { id: "class", label: "🏫 Add Class" },
    { id: "assign", label: "📋 Assign Faculty" },
    { id: "analysis", label: "📈 Class Analysis" },
    { id: "resources", label: "📚 Resources" },
  ];

  return (
    <div style={styles.page}>
      <h2 style={styles.heading}>Admin Panel ⚙️</h2>
      <p style={{ color: "#666", marginBottom: "20px" }}>Welcome, {name}</p>

      {message && <div id="adminSuccess" style={styles.success}>{message}</div>}
      {error && <div id="adminError" style={styles.errorBox}>{error}</div>}

      <div style={styles.tabs}>
        {tabs.map((t) => (
          <button key={t.id}
            style={{ ...styles.tab, ...(activeTab === t.id ? styles.activeTab : {}) }}
            onClick={() => setActiveTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {activeTab === "overview" && overview && (
        <div>
          <div style={styles.cardRow}>
            <KpiCard label="Total Students" value={overview.total_students} color="#3498db" />
            <KpiCard label="Total Faculty" value={overview.total_faculty} color="#2ecc71" />
            <KpiCard label="Total Classes" value={overview.total_classes} color="#9b59b6" />
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>🏫 Classes</h3>
            <table style={styles.table}>
              <thead><tr style={styles.tableHead}>
                <th style={styles.th}>Class ID</th>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Branch</th>
                <th style={styles.th}>Semester</th>
              </tr></thead>
              <tbody>
                {overview.classes.map((c, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f8f9fa" }}>
                    <td style={styles.td}>{c.class_id}</td>
                    <td style={styles.td}>{c.name}</td>
                    <td style={styles.td}>{c.branch}</td>
                    <td style={styles.td}>{c.semester}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>🎓 Faculty Assignments</h3>
            <table style={styles.table}>
              <thead><tr style={styles.tableHead}>
                <th style={styles.th}>Faculty</th>
                <th style={styles.th}>Class</th>
                <th style={styles.th}>Subject</th>
              </tr></thead>
              <tbody>
                {overview.assignments.map((a, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f8f9fa" }}>
                    <td style={styles.td}>{a.faculty_name}</td>
                    <td style={styles.td}>{a.class_id}</td>
                    <td style={styles.td}>{a.subject_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD STUDENT */}
      {activeTab === "student" && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>👤 Create New Student</h3>
          <p style={{ fontSize: "13px", color: "#888", marginBottom: "20px" }}>
            PRN is the unique identifier for each student. It will be used as their login ID.
          </p>
          <div style={styles.grid}>
            <FormRow id="studentName" label="Full Name" value={studentForm.name}
              onChange={(v) => setStudentForm({ ...studentForm, name: v })}
              placeholder="e.g. Gaurvi Jain" />
            <FormRow id="studentPrn" label="PRN (Unique)" value={studentForm.prn}
              onChange={(v) => setStudentForm({ ...studentForm, prn: v })}
              placeholder="e.g. S1032233841" />
            <FormRow id="studentPassword" label="Password" value={studentForm.password} type="password"
              onChange={(v) => setStudentForm({ ...studentForm, password: v })}
              placeholder="Set login password" />
            <FormRow id="studentClassId" label="Class ID" value={studentForm.class_id}
              onChange={(v) => setStudentForm({ ...studentForm, class_id: v })}
              placeholder="e.g. CSE-SEM4-A" />
            <FormRow id="studentSemester" label="Semester" value={studentForm.semester} type="number"
              onChange={(v) => setStudentForm({ ...studentForm, semester: v })}
              placeholder="e.g. 4" />
            <FormRow id="studentBranch" label="Branch" value={studentForm.branch}
              onChange={(v) => setStudentForm({ ...studentForm, branch: v })}
              placeholder="e.g. CSE" />
          </div>
          <div style={styles.infoBox}>
            💡 Student will login using their <strong>PRN</strong> as username.
          </div>
          <button id="createStudentBtn" style={styles.submitBtn} onClick={handleCreateStudent}>
            Create Student
          </button>
        </div>
      )}

      {/* ADD FACULTY */}
      {activeTab === "faculty" && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>🎓 Create New Faculty</h3>
          <div style={styles.grid}>
            <FormRow label="Full Name" value={facultyForm.name}
              onChange={(v) => setFacultyForm({ ...facultyForm, name: v })}
              placeholder="e.g. Prof. Joshi" />
            <FormRow label="Faculty ID" value={facultyForm.faculty_id}
              onChange={(v) => setFacultyForm({ ...facultyForm, faculty_id: v })}
              placeholder="e.g. FAC004" />
            <FormRow label="Username" value={facultyForm.username}
              onChange={(v) => setFacultyForm({ ...facultyForm, username: v })}
              placeholder="e.g. faculty4" />
            <FormRow label="Password" value={facultyForm.password} type="password"
              onChange={(v) => setFacultyForm({ ...facultyForm, password: v })}
              placeholder="Set password" />
          </div>
          <button style={styles.submitBtn} onClick={handleCreateFaculty}>
            Create Faculty
          </button>
        </div>
      )}

      {/* ADD CLASS */}
      {activeTab === "class" && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>🏫 Create New Class</h3>
          <div style={styles.grid}>
            <FormRow label="Class ID" value={classForm.class_id}
              onChange={(v) => setClassForm({ ...classForm, class_id: v })}
              placeholder="e.g. CSE-SEM4-B" />
            <FormRow label="Class Name" value={classForm.name}
              onChange={(v) => setClassForm({ ...classForm, name: v })}
              placeholder="e.g. CSE Semester 4 Division B" />
            <FormRow label="Branch" value={classForm.branch}
              onChange={(v) => setClassForm({ ...classForm, branch: v })}
              placeholder="e.g. CSE" />
            <FormRow label="Semester" value={classForm.semester} type="number"
              onChange={(v) => setClassForm({ ...classForm, semester: v })}
              placeholder="e.g. 4" />
          </div>
          <button style={styles.submitBtn} onClick={handleCreateClass}>
            Create Class
          </button>
        </div>
      )}

      {/* ASSIGN FACULTY */}
      {activeTab === "assign" && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>📋 Assign Faculty to Subject</h3>
          <div style={styles.grid}>
            <FormRow label="Faculty ID" value={assignForm.faculty_id}
              onChange={(v) => setAssignForm({ ...assignForm, faculty_id: v })}
              placeholder="e.g. FAC001" />
            <FormRow label="Class ID" value={assignForm.class_id}
              onChange={(v) => setAssignForm({ ...assignForm, class_id: v })}
              placeholder="e.g. CSE-SEM4-A" />
            <FormRow label="Subject Code" value={assignForm.subject_code}
              onChange={(v) => setAssignForm({ ...assignForm, subject_code: v })}
              placeholder="e.g. CS401" />
            <FormRow label="Subject Name" value={assignForm.subject_name}
              onChange={(v) => setAssignForm({ ...assignForm, subject_name: v })}
              placeholder="e.g. Data Structures" />
          </div>
          <div style={styles.infoBox}>
            <strong>Available Faculty:</strong><br />
            {overview?.faculty?.map(f => `${f.faculty_id} - ${f.name}`).join(" | ")}
          </div>
          <button style={styles.submitBtn} onClick={handleAssignFaculty}>
            Assign Faculty
          </button>
        </div>
      )}

  {/* CLASS ANALYSIS */}
{activeTab === "analysis" && (
  <div>
    <div style={styles.formCard}>
      <h3 style={styles.formTitle}>📈 Class-wise Analysis</h3>
      <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "16px" }}>
        <label style={{ fontWeight: "600" }}>Select Class:</label>
        <input
          style={{ padding: "8px 14px", border: "1.5px solid #ddd", borderRadius: "8px", fontSize: "14px" }}
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          placeholder="e.g. CSE-SEM4-A"
        />
      </div>

      {classAnalysis && !classAnalysis.error && (
        <div>
          {/* ── KPI Cards ── */}
          <div style={styles.cardRow}>
            <KpiCard label="Distinction" value={classAnalysis.grade_distribution?.Distinction || 0} color="#2ecc71" />
            <KpiCard label="Merit" value={classAnalysis.grade_distribution?.Merit || 0} color="#3498db" />
            <KpiCard label="Pass" value={classAnalysis.grade_distribution?.Pass || 0} color="#f39c12" />
            <KpiCard label="At-Risk" value={classAnalysis.grade_distribution?.["At-Risk"] || 0} color="#e74c3c" />
          </div>

          {/* ── Charts Row 1: Grade Donut + Subject Avg Bar ── */}
          <div style={{ display: "flex", gap: "16px", marginBottom: "20px", flexWrap: "wrap" }}>

            {/* Grade Distribution Donut */}
            <div style={{ ...styles.section, flex: "1 1 260px", marginBottom: 0 }}>
              <h4 style={styles.chartTitle}>🎯 Grade Distribution</h4>
              <p style={styles.chartSub}>Overall student grade breakdown</p>
              {(() => {
                const grades = [
                  { label: "Distinction", color: "#2ecc71" },
                  { label: "Merit", color: "#3498db" },
                  { label: "Pass", color: "#f39c12" },
                  { label: "At-Risk", color: "#e74c3c" },
                ];
                const total = grades.reduce((s, g) => s + (classAnalysis.grade_distribution?.[g.label] || 0), 0) || 1;
                const size = 180, r = 54, cx = 90, cy = 90;
                const circ = 2 * Math.PI * r;
                let offset = circ / 4;
                return (
                  <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
                    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f0f0f0" strokeWidth="22" />
                      {grades.filter(g => (classAnalysis.grade_distribution?.[g.label] || 0) > 0).map((g, i) => {
                        const val = (classAnalysis.grade_distribution?.[g.label] || 0) / total * 100;
                        const dash = (val / 100) * circ;
                        const cur = offset;
                        offset -= dash;
                        return (
                          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
                            stroke={g.color} strokeWidth="22"
                            strokeDasharray={`${dash} ${circ - dash}`}
                            strokeDashoffset={cur} strokeLinecap="butt" />
                        );
                      })}
                      <text x={cx} y={cy - 6} textAnchor="middle" fontSize="11" fill="#888">Total</text>
                      <text x={cx} y={cy + 12} textAnchor="middle" fontSize="20" fontWeight="700" fill="#1e3a5f">{total}</text>
                    </svg>
                    <div>
                      {grades.map((g, i) => {
                        const val = classAnalysis.grade_distribution?.[g.label] || 0;
                        const pct = Math.round(val / total * 100);
                        return (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                            <div style={{ width: "12px", height: "12px", borderRadius: "3px", background: g.color, flexShrink: 0 }} />
                            <span style={{ fontSize: "13px", color: "#555", minWidth: "80px" }}>{g.label}</span>
                            <span style={{ fontSize: "13px", fontWeight: "700", color: g.color }}>{val}</span>
                            <span style={{ fontSize: "11px", color: "#aaa" }}>({pct}%)</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Subject Average Bar Chart */}
            <div style={{ ...styles.section, flex: "2 1 340px", marginBottom: 0 }}>
              <h4 style={styles.chartTitle}>📘 Subject-wise Average Score</h4>
              <p style={styles.chartSub}>Class mean score per subject</p>
              {(() => {
                const data = classAnalysis.subject_stats || [];
                const max = Math.max(...data.map(d => d.mean), 1);
                return (
                  <div>
                    {data.map((s, i) => {
                      const color = s.mean >= 75 ? "#2ecc71" : s.mean >= 50 ? "#f39c12" : "#e74c3c";
                      return (
                        <div key={i} style={{ marginBottom: "14px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                            <span style={{ fontSize: "13px", fontWeight: "600", color: "#333" }}>
                              {s.subject_name?.length > 28 ? s.subject_name.slice(0, 28) + "…" : s.subject_name}
                            </span>
                            <span style={{ fontSize: "13px", fontWeight: "700", color }}>{s.mean}%</span>
                          </div>
                          <div style={{ background: "#f0f0f0", borderRadius: "6px", height: "10px" }}>
                            <div style={{ width: `${(s.mean / 100) * 100}%`, background: color, height: "10px", borderRadius: "6px", transition: "width 0.4s" }} />
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "3px" }}>
                            <span style={{ fontSize: "11px", color: "#e74c3c" }}>Low: {s.min}%</span>
                            <span style={{ fontSize: "11px", color: "#2ecc71" }}>High: {s.max}%</span>
                          </div>
                        </div>
                      );
                    })}
                    <div style={{ display: "flex", gap: "16px", marginTop: "8px" }}>
                      {[["#2ecc71", "≥75% Good"], ["#f39c12", "50–74% Average"], ["#e74c3c", "<50% Poor"]].map(([c, l], i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "#888" }}>
                          <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: c }} />{l}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* ── Charts Row 2: At-Risk per Subject + Score Range ── */}
          <div style={{ display: "flex", gap: "16px", marginBottom: "20px", flexWrap: "wrap" }}>

            {/* At-Risk Count per Subject */}
            <div style={{ ...styles.section, flex: "1 1 300px", marginBottom: 0 }}>
              <h4 style={styles.chartTitle}>⚠️ At-Risk Students per Subject</h4>
              <p style={styles.chartSub}>Number of students scoring below passing threshold</p>
              {(() => {
                const data = classAnalysis.subject_stats || [];
                const atRisk = classAnalysis.at_risk_by_subject || {};
                const maxVal = Math.max(...data.map(s => atRisk[s.subject_name] || 0), 1);
                return (
                  <div>
                    {data.map((s, i) => {
                      const val = atRisk[s.subject_name] || 0;
                      const pct = (val / maxVal) * 100;
                      return (
                        <div key={i} style={{ marginBottom: "14px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                            <span style={{ fontSize: "13px", fontWeight: "600", color: "#333" }}>
                              {s.subject_name?.length > 24 ? s.subject_name.slice(0, 24) + "…" : s.subject_name}
                            </span>
                            <span style={{
                              background: val > 0 ? "#ffeaea" : "#eaffea",
                              color: val > 0 ? "#e74c3c" : "#27ae60",
                              borderRadius: "12px", padding: "2px 10px",
                              fontSize: "12px", fontWeight: "700"
                            }}>{val} students</span>
                          </div>
                          <div style={{ background: "#f0f0f0", borderRadius: "6px", height: "8px" }}>
                            <div style={{ width: `${pct}%`, background: val > 2 ? "#e74c3c" : val > 0 ? "#f39c12" : "#2ecc71", height: "8px", borderRadius: "6px" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Score Range Chart (Min/Max/Mean per subject) */}
            <div style={{ ...styles.section, flex: "1 1 300px", marginBottom: 0 }}>
              <h4 style={styles.chartTitle}>📊 Score Range per Subject</h4>
              <p style={styles.chartSub}>Min, average, and max score spread</p>
              {(() => {
                const data = classAnalysis.subject_stats || [];
                return (
                  <div style={{ overflowX: "auto" }}>
                    <svg width="100%" viewBox={`0 0 ${Math.max(data.length * 72, 300)} 160`} style={{ minWidth: `${Math.max(data.length * 72, 300)}px` }}>
                      {[0, 25, 50, 75, 100].map(v => (
                        <g key={v}>
                          <line x1="28" y1={130 - v * 1.1} x2={data.length * 72 + 10} y2={130 - v * 1.1}
                            stroke="#f0f0f0" strokeWidth="1" strokeDasharray="4,4" />
                          <text x="24" y={133 - v * 1.1} textAnchor="end" fontSize="9" fill="#aaa">{v}</text>
                        </g>
                      ))}
                      {data.map((s, i) => {
                        const x = 40 + i * 72;
                        const minY = 130 - s.min * 1.1;
                        const maxY = 130 - s.max * 1.1;
                        const meanY = 130 - s.mean * 1.1;
                        return (
                          <g key={i}>
                            {/* Range line */}
                            <line x1={x} y1={minY} x2={x} y2={maxY} stroke="#ddd" strokeWidth="4" strokeLinecap="round" />
                            {/* Min dot */}
                            <circle cx={x} cy={minY} r="5" fill="#e74c3c" />
                            {/* Max dot */}
                            <circle cx={x} cy={maxY} r="5" fill="#2ecc71" />
                            {/* Mean diamond */}
                            <rect x={x - 5} y={meanY - 5} width="10" height="10"
                              fill="#3498db" transform={`rotate(45 ${x} ${meanY})`} />
                            <text x={x} y={148} textAnchor="middle" fontSize="9" fill="#666">
                              {s.subject_name?.length > 8 ? s.subject_name.slice(0, 8) + "…" : s.subject_name}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                    <div style={{ display: "flex", gap: "16px", marginTop: "4px", flexWrap: "wrap" }}>
                      {[["#2ecc71", "Max"], ["#3498db", "Mean (◆)"], ["#e74c3c", "Min"]].map(([c, l], i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "#888" }}>
                          <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: c }} />{l}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* ── Pass Rate Gauge Row ── */}
          <div style={{ ...styles.section, marginBottom: "20px" }}>
            <h4 style={styles.chartTitle}>✅ Pass Rate per Subject</h4>
            <p style={styles.chartSub}>Percentage of students who passed (score ≥ 40) in each subject</p>
            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", justifyContent: "center", paddingTop: "8px" }}>
              {(classAnalysis.subject_stats || []).map((s, i) => {
                const total = (classAnalysis.grade_distribution?.Distinction || 0) +
                  (classAnalysis.grade_distribution?.Merit || 0) +
                  (classAnalysis.grade_distribution?.Pass || 0) +
                  (classAnalysis.grade_distribution?.["At-Risk"] || 0) || 1;
                const atRisk = classAnalysis.at_risk_by_subject?.[s.subject_name] || 0;
                const passRate = Math.round(((total - atRisk) / total) * 100);
                const color = passRate >= 80 ? "#2ecc71" : passRate >= 60 ? "#f39c12" : "#e74c3c";
                const r = 32, circ = 2 * Math.PI * r;
                const dash = (passRate / 100) * circ;
                return (
                  <div key={i} style={{ textAlign: "center", minWidth: "90px" }}>
                    <svg width="84" height="84" viewBox="0 0 84 84">
                      <circle cx="42" cy="42" r={r} fill="none" stroke="#f0f0f0" strokeWidth="10" />
                      <circle cx="42" cy="42" r={r} fill="none" stroke={color} strokeWidth="10"
                        strokeDasharray={`${dash} ${circ - dash}`}
                        strokeDashoffset={circ / 4} strokeLinecap="round" />
                      <text x="42" y="47" textAnchor="middle" fontSize="13" fontWeight="700" fill={color}>{passRate}%</text>
                    </svg>
                    <div style={{ fontSize: "11px", color: "#555", fontWeight: "600", marginTop: "4px", maxWidth: "84px", wordBreak: "break-word" }}>
                      {s.subject_name?.length > 12 ? s.subject_name.slice(0, 12) + "…" : s.subject_name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Raw Data Table ── */}
          <div style={styles.section}>
            <h4 style={styles.chartTitle}>📋 Subject Score Details</h4>
            <table style={styles.table}>
              <thead><tr style={styles.tableHead}>
                <th style={styles.th}>Subject</th>
                <th style={styles.th}>Mean</th>
                <th style={styles.th}>Highest</th>
                <th style={styles.th}>Lowest</th>
                <th style={styles.th}>At-Risk Count</th>
                <th style={styles.th}>Status</th>
              </tr></thead>
              <tbody>
                {classAnalysis.subject_stats?.map((s, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f8f9fa" }}>
                    <td style={{ ...styles.td, fontWeight: "600" }}>{s.subject_name}</td>
                    <td style={{ ...styles.td, color: s.mean >= 75 ? "#2ecc71" : s.mean >= 50 ? "#f39c12" : "#e74c3c", fontWeight: "700" }}>{s.mean}%</td>
                    <td style={{ ...styles.td, color: "#2ecc71", fontWeight: "600" }}>{s.max}%</td>
                    <td style={{ ...styles.td, color: "#e74c3c", fontWeight: "600" }}>{s.min}%</td>
                    <td style={styles.td}>{classAnalysis.at_risk_by_subject?.[s.subject_name] || 0}</td>
                    <td style={styles.td}>
                      <span style={{
                        background: s.mean >= 75 ? "#eaffea" : s.mean >= 50 ? "#fff8e6" : "#ffeaea",
                        color: s.mean >= 75 ? "#27ae60" : s.mean >= 50 ? "#d68910" : "#c0392b",
                        borderRadius: "12px", padding: "3px 12px", fontSize: "12px", fontWeight: "700"
                      }}>
                        {s.mean >= 75 ? "✅ Good" : s.mean >= 50 ? "⚠️ Average" : "🔴 Poor"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Attendance At-Risk Table ── */}
          {classAnalysis.attendance_at_risk?.length > 0 && (
            <div style={styles.section}>
              <h4 style={{ color: "#e74c3c", marginBottom: "4px", fontSize: "15px", fontWeight: "700" }}>⚠️ Attendance At-Risk Students</h4>
              <p style={styles.chartSub}>Students with dangerously low attendance</p>
              <table style={styles.table}>
                <thead><tr style={styles.tableHead}>
                  <th style={styles.th}>PRN</th>
                  <th style={styles.th}>Attendance %</th>
                  <th style={styles.th}>Visual</th>
                  <th style={styles.th}>Risk Level</th>
                </tr></thead>
                <tbody>
                  {classAnalysis.attendance_at_risk.map((s, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f8f9fa" }}>
                      <td style={{ ...styles.td, fontWeight: "600" }}>{s.prn}</td>
                      <td style={{ ...styles.td, fontWeight: "700", color: s.risk_level === "Critical" ? "#e74c3c" : "#f39c12" }}>{s.percentage}%</td>
                      <td style={styles.td}>
                        <div style={{ background: "#f0f0f0", borderRadius: "4px", height: "8px", width: "120px" }}>
                          <div style={{ width: `${s.percentage}%`, background: s.risk_level === "Critical" ? "#e74c3c" : "#f39c12", height: "8px", borderRadius: "4px" }} />
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          background: s.risk_level === "Critical" ? "#e74c3c" : "#f39c12",
                          color: "white", padding: "3px 12px", borderRadius: "10px", fontSize: "12px", fontWeight: "700"
                        }}>
                          {s.risk_level === "Critical" ? "🔴 Critical" : "🟡 Warning"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  </div>
)}
      {/* RESOURCES */}
      {activeTab === "resources" && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>📚 Add Learning Resource</h3>
          <div style={styles.grid}>
            <FormRow label="Subject Code" value={resourceForm.subject_code}
              onChange={(v) => setResourceForm({ ...resourceForm, subject_code: v })}
              placeholder="e.g. CS401" />
            <FormRow label="Subject Name" value={resourceForm.subject_name}
              onChange={(v) => setResourceForm({ ...resourceForm, subject_name: v })}
              placeholder="e.g. Data Structures" />
            <FormRow label="Title" value={resourceForm.title}
              onChange={(v) => setResourceForm({ ...resourceForm, title: v })}
              placeholder="e.g. DSA by Abdul Bari" />
            <FormRow label="Platform" value={resourceForm.platform}
              onChange={(v) => setResourceForm({ ...resourceForm, platform: v })}
              placeholder="e.g. YouTube" />
          </div>
          <FormRow label="URL" value={resourceForm.url}
            onChange={(v) => setResourceForm({ ...resourceForm, url: v })}
            placeholder="https://..." />
          <button style={styles.submitBtn} onClick={handleAddResource}>
            Add Resource
          </button>
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, value, color }) {
  return (
    <div style={{ ...styles.kpiCard, borderTop: `4px solid ${color}` }}>
      <p style={styles.kpiLabel}>{label}</p>
      <p style={{ ...styles.kpiValue, color }}>{value}</p>
    </div>
  );
}

function FormRow({ label, value, onChange, placeholder, type = "text", id }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <label style={{ display: "block", fontWeight: "600", marginBottom: "6px", fontSize: "14px" }}>
        {label}
      </label>
      <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #ddd", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box" }} />
    </div>
  );
}

const styles = {
  page: { padding: "24px", maxWidth: "1000px", margin: "0 auto" },
  heading: { fontSize: "24px", color: "#1e3a5f", marginBottom: "4px" },
  tabs: { display: "flex", gap: "8px", marginBottom: "24px", flexWrap: "wrap" },
  tab: { padding: "8px 16px", border: "1.5px solid #ddd", borderRadius: "8px", background: "white", cursor: "pointer", fontWeight: "600", fontSize: "13px" },
  activeTab: { background: "#1e3a5f", color: "white", border: "1.5px solid #1e3a5f" },
  formCard: { background: "white", borderRadius: "12px", padding: "28px", boxShadow: "0 2px 10px rgba(0,0,0,0.08)", marginBottom: "20px" },
  formTitle: { fontSize: "16px", fontWeight: "700", color: "#1e3a5f", marginBottom: "8px" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" },
  submitBtn: { background: "#1e3a5f", color: "white", border: "none", borderRadius: "8px", padding: "12px 28px", fontSize: "15px", fontWeight: "600", cursor: "pointer", marginTop: "8px" },
  success: { background: "#eaffea", border: "1px solid #2ecc71", borderRadius: "8px", padding: "12px 18px", marginBottom: "16px", color: "#27ae60", fontWeight: "600" },
  errorBox: { background: "#ffeaea", border: "1px solid #e74c3c", borderRadius: "8px", padding: "12px 18px", marginBottom: "16px", color: "#c0392b", fontWeight: "600" },
  infoBox: { background: "#f0f7ff", borderRadius: "8px", padding: "12px 16px", fontSize: "13px", marginBottom: "16px", color: "#333" },
  section: { background: "white", borderRadius: "12px", padding: "20px", marginBottom: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.08)" },
  sectionTitle: { fontSize: "16px", marginBottom: "16px", color: "#1e3a5f" },
  cardRow: { display: "flex", gap: "16px", marginBottom: "20px", flexWrap: "wrap" },
  kpiCard: { flex: 1, minWidth: "140px", background: "white", borderRadius: "10px", padding: "18px", boxShadow: "0 2px 10px rgba(0,0,0,0.08)", textAlign: "center" },
  kpiLabel: { fontSize: "12px", color: "#888", marginBottom: "8px", fontWeight: "600" },
  kpiValue: { fontSize: "28px", fontWeight: "700", margin: 0 },
  table: { width: "100%", borderCollapse: "collapse" },
  tableHead: { background: "#f0f4f8" },
  th: { padding: "12px", textAlign: "left", fontWeight: "600", fontSize: "13px", color: "#555" },
  td: { padding: "12px", fontSize: "14px", borderBottom: "1px solid #f0f0f0" },
  chartTitle: { fontSize: "14px", fontWeight: "700", color: "#1e3a5f", marginBottom: "4px" },
chartSub: { fontSize: "12px", color: "#888", marginBottom: "16px" },
};

export default AdminDashboard;
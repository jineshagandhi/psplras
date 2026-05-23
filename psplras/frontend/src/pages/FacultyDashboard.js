import React, { useState, useEffect, useRef } from "react";
import { getMyAssignments, getClassStudents, facultyAddMarks, facultyAddAttendance, getFacultyAnalysis } from "../api";

// ── Chart helpers (pure SVG, no external deps) ────────────────────────────────

function BarChart({ data, color = "#2563eb", height = 140 }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  const barW = Math.max(20, Math.floor(400 / data.length) - 8);
  const chartW = data.length * (barW + 8);
  const padLeft = 28;
  const padTop = 20;
  return (
    <svg width="100%" viewBox={`0 0 ${chartW + padLeft} ${height + padTop + 36}`} style={{ overflow: "visible" }}>
      {[0, 25, 50, 75, 100].map(v => (
        <g key={v}>
          <line x1={padLeft} y1={padTop + height - (v / max) * height} x2={chartW + padLeft} y2={padTop + height - (v / max) * height}
            stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4,4" />
          <text x={padLeft - 4} y={padTop + height - (v / max) * height + 4} textAnchor="end" fontSize="9" fill="#94a3b8">{v}</text>
        </g>
      ))}
      {data.map((d, i) => {
        const bh = Math.max(2, (d.value / max) * height);
        const x = padLeft + i * (barW + 8);
        const barColor = d.color || (d.value >= 75 ? "#22c55e" : d.value >= 50 ? "#f59e0b" : "#ef4444");
        return (
          <g key={i}>
            <rect x={x} y={padTop + height - bh} width={barW} height={bh}
              fill={d.color || color} rx={4} opacity={0.85} />
            <text x={x + barW / 2} y={padTop + height - bh - 5} textAnchor="middle" fontSize="10" fontWeight="600" fill="#374151">
              {d.value}
            </text>
            <text x={x + barW / 2} y={padTop + height + 18} textAnchor="middle" fontSize="9" fill="#64748b">
              {d.label?.length > 8 ? d.label.slice(0, 8) + "…" : d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function DonutChart({ segments, size = 120 }) {
  const r = Math.round(size * 0.32);
  const cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  let offset = circ / 4;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e2e8f0" strokeWidth="16" />
      {segments.filter(s => s.value > 0).map((seg, i) => {
        const dash = (seg.value / 100) * circ;
        const currentOffset = offset;
        offset -= dash;
        return (
          <circle key={i} cx={cx} cy={cy} r={r}
            fill="none" stroke={seg.color} strokeWidth="16"
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={currentOffset}
            strokeLinecap="butt"
          />
        );
      })}
    </svg>
  );
}

function LineSparkline({ scores, width = 180, height = 50, color = "#2563eb" }) {
  if (!scores || scores.length < 2) return null;
  const max = Math.max(...scores, 1);
  const pts = scores.map((v, i) => {
    const x = (i / (scores.length - 1)) * width;
    const y = height - (v / max) * height;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      {scores.map((v, i) => {
        const x = (i / (scores.length - 1)) * width;
        const y = height - (v / max) * height;
        return <circle key={i} cx={x} cy={y} r={3} fill={color} />;
      })}
    </svg>
  );
}
function RadarChart({ subjects, scores, size = 200 }) {
  if (!subjects || subjects.length === 0) return null;

  // For 2 or fewer subjects, render a simple styled bar chart instead
  if (subjects.length < 3) {
    return (
      <div style={{ width: "100%", padding: "8px 0" }}>
        {subjects.map((sub, i) => {
          const score = scores[i] || 0;
          const color = score >= 75 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
          return (
            <div key={i} style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "12px", fontWeight: "600", color: "#374151" }}>
                  {sub.length > 22 ? sub.slice(0, 22) + "…" : sub}
                </span>
                <span style={{ fontSize: "12px", fontWeight: "700", color }}>{score}%</span>
              </div>
              <div style={{ background: "#e2e8f0", borderRadius: "6px", height: "10px" }}>
                <div style={{ width: `${score}%`, background: color, height: "10px", borderRadius: "6px", transition: "width 0.4s" }} />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Full radar for 3+ subjects
  const cx = size / 2, cy = size / 2;
  const r = size * 0.36;
  const n = subjects.length;
  const angles = subjects.map((_, i) => (i / n) * 2 * Math.PI - Math.PI / 2);
  const axisPoints = angles.map(a => ({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }));
  const rings = [0.25, 0.5, 0.75, 1.0];
  const scorePoints = angles.map((a, i) => {
    const val = (scores[i] || 0) / 100;
    return { x: cx + r * val * Math.cos(a), y: cy + r * val * Math.sin(a) };
  });
  const polyPoints = scorePoints.map(p => `${p.x},${p.y}`).join(" ");

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {rings.map((ring, ri) => {
        const ringPts = angles.map(a =>
          `${cx + r * ring * Math.cos(a)},${cy + r * ring * Math.sin(a)}`
        ).join(" ");
        return <polygon key={ri} points={ringPts} fill="none" stroke="#e2e8f0" strokeWidth="1" strokeDasharray={ri < 3 ? "3,3" : "none"} />;
      })}
      {axisPoints.map((pt, i) => (
        <line key={i} x1={cx} y1={cy} x2={pt.x} y2={pt.y} stroke="#e2e8f0" strokeWidth="1" />
      ))}
      <polygon points={polyPoints} fill="#2563eb22" stroke="#2563eb" strokeWidth="2" strokeLinejoin="round" />
      {scorePoints.map((pt, i) => (
        <circle key={i} cx={pt.x} cy={pt.y} r={4} fill="#2563eb" stroke="white" strokeWidth="1.5" />
      ))}
      {scorePoints.map((pt, i) => (
        <text key={i} x={pt.x} y={pt.y - 7} textAnchor="middle" fontSize="9" fontWeight="700" fill="#1d4ed8">{scores[i]}</text>
      ))}
      {axisPoints.map((pt, i) => {
        const labelX = cx + (r + 18) * Math.cos(angles[i]);
        const labelY = cy + (r + 18) * Math.sin(angles[i]);
        const label = subjects[i]?.length > 10 ? subjects[i].slice(0, 10) + "…" : subjects[i];
        return <text key={i} x={labelX} y={labelY + 4} textAnchor="middle" fontSize="9" fontWeight="600" fill="#475569">{label}</text>;
      })}
    </svg>
  );
}

// ── Grade helpers ─────────────────────────────────────────────────────────────
function gradeColor(grade) {
  const colors = { Distinction: "#22c55e", Merit: "#2563eb", Pass: "#f59e0b", "At-Risk": "#ef4444" };
  return colors[grade] || "#ccc";
}
function gradeBadge(grade) {
  const c = gradeColor(grade);
  return { background: c + "20", color: c, border: `1px solid ${c}`, borderRadius: "20px", padding: "3px 10px", fontSize: "12px", fontWeight: "700" };
}
function attPillStyle(color) {
  return { background: color + "15", color, border: `1px solid ${color}`, borderRadius: "20px", padding: "4px 12px", fontSize: "12px", fontWeight: "700" };
}
function markAllBtnStyle(color) {
  return { background: color + "15", color, border: `1px solid ${color}`, borderRadius: "8px", padding: "8px 16px", cursor: "pointer", fontSize: "13px", fontWeight: "600" };
}

// ── CSV & Print download helpers ──────────────────────────────────────────────
function downloadCSV(filename, rows) {
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
  a.download = filename; a.click();
}

function downloadJSON(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
  a.download = filename; a.click();
}

function printSection(ref) {
  const content = ref.current?.innerHTML;
  if (!content) return;
  const w = window.open("", "_blank");
  w.document.write(`<html><head><title>Report</title>
    <style>
      body { font-family: sans-serif; padding: 24px; color: #0f172a; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
      th, td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; font-size: 13px; }
      th { background: #f8fafc; font-weight: 700; }
      h2, h3 { color: #1d4ed8; }
      .badge { padding: 2px 10px; border-radius: 12px; font-size: 12px; }
      @media print { .no-print { display: none; } }
    </style></head><body>${content}</body></html>`);
  w.document.close();
  setTimeout(() => { w.print(); }, 300);
}
// ── Additional chart components ───────────────────────────────────────────────

function HorizontalBar({ label, value, max = 100, color = "#2563eb", showValue = true }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ marginBottom: "10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
        <span style={{ fontSize: "12px", color: "#374151", fontWeight: "600" }}>{label}</span>
        {showValue && <span style={{ fontSize: "12px", fontWeight: "700", color }}>{value}%</span>}
      </div>
      <div style={{ background: "#e2e8f0", borderRadius: "6px", height: "10px" }}>
        <div style={{ width: `${pct}%`, background: color, height: "10px", borderRadius: "6px", transition: "width 0.5s" }} />
      </div>
    </div>
  );
}

function MiniDonut({ value, color, size = 80, label }) {
  const r = 28, cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <div style={{ textAlign: "center" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeDashoffset={circ / 4}
          strokeLinecap="round" />
        <text x={cx} y={cy + 5} textAnchor="middle" fontSize="12" fontWeight="800" fill={color}>{value}%</text>
      </svg>
      <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>{label}</div>
    </div>
  );
}

function GroupedBarChart({ subjects, students, studentScores, height = 160 }) {
  if (!subjects.length || !students.length) return null;
  const colors = ["#2563eb", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];
  const barW = 14;
  const groupGap = 20;
  const barGap = 2;
  const groupW = students.length * (barW + barGap) + groupGap;
  const chartW = subjects.length * groupW;
  const padLeft = 32;
  const padTop = 16;

  return (
    <div style={{ overflowX: "auto" }}>
      <svg width="100%" viewBox={`0 0 ${chartW + padLeft + 10} ${height + padTop + 50}`} style={{ minWidth: `${Math.max(chartW + padLeft, 300)}px` }}>
        {[0, 25, 50, 75, 100].map(v => (
          <g key={v}>
            <line x1={padLeft} y1={padTop + height - (v / 100) * height}
              x2={chartW + padLeft} y2={padTop + height - (v / 100) * height}
              stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4,4" />
            <text x={padLeft - 4} y={padTop + height - (v / 100) * height + 4}
              textAnchor="end" fontSize="8" fill="#94a3b8">{v}</text>
          </g>
        ))}
        {subjects.map((sub, si) => {
          const gx = padLeft + si * groupW;
          return (
            <g key={si}>
              {students.map((st, sti) => {
                const score = studentScores[st.prn]?.[si] || 0;
                const bh = Math.max(2, (score / 100) * height);
                const x = gx + sti * (barW + barGap);
                const color = colors[sti % colors.length];
                return (
                  <g key={sti}>
                    <rect x={x} y={padTop + height - bh} width={barW} height={bh}
                      fill={color} rx={3} opacity={0.85} />
                    <text x={x + barW / 2} y={padTop + height - bh - 4}
                      textAnchor="middle" fontSize="8" fontWeight="700" fill="#374151">{score}</text>
                  </g>
                );
              })}
              <text x={gx + (students.length * (barW + barGap)) / 2}
                y={padTop + height + 16} textAnchor="middle" fontSize="9" fill="#64748b">
                {sub.length > 10 ? sub.slice(0, 10) + "…" : sub}
              </text>
            </g>
          );
        })}
        {/* Legend */}
        {students.map((st, i) => (
          <g key={i}>
            <rect x={padLeft + i * 90} y={padTop + height + 28} width={8} height={8}
              fill={colors[i % colors.length]} rx={2} />
            <text x={padLeft + i * 90 + 12} y={padTop + height + 36}
              fontSize="9" fill="#374151">
              {st.name?.split(" ")[0] || st.prn}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function HeatMapChart({ subjects, students, studentScores }) {
  if (!subjects.length || !students.length) return null;
  const cellW = Math.max(60, Math.floor(480 / subjects.length));
  const cellH = 40;
  const labelW = 100;

  const getColor = (score) => {
    if (score >= 75) return "#22c55e";
    if (score >= 60) return "#84cc16";
    if (score >= 40) return "#f59e0b";
    return "#ef4444";
  };

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ borderCollapse: "collapse", minWidth: "400px" }}>
        <thead>
          <tr>
            <th style={{ width: labelW, padding: "8px", fontSize: "11px", color: "#64748b", textAlign: "left" }}>Student</th>
            {subjects.map((s, i) => (
              <th key={i} style={{ width: cellW, padding: "6px 4px", fontSize: "10px", color: "#64748b", textAlign: "center", fontWeight: "600" }}>
                {s.length > 8 ? s.slice(0, 8) + "…" : s}
              </th>
            ))}
            <th style={{ padding: "6px 8px", fontSize: "11px", color: "#64748b", textAlign: "center" }}>Avg</th>
          </tr>
        </thead>
        <tbody>
          {students.map((st, si) => {
            const scores = studentScores[st.prn] || subjects.map(() => 0);
            const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
            return (
              <tr key={si}>
                <td style={{ padding: "6px 8px", fontSize: "12px", fontWeight: "600", color: "#374151" }}>
                  {st.name?.split(" ")[0] || st.prn}
                </td>
                {scores.map((score, sci) => (
                  <td key={sci} style={{
                    padding: "0", textAlign: "center", width: cellW,
                  }}>
                    <div style={{
                      background: getColor(score) + "30",
                      border: `2px solid ${getColor(score)}`,
                      margin: "2px", borderRadius: "6px", padding: "8px 4px",
                    }}>
                      <div style={{ fontSize: "13px", fontWeight: "800", color: getColor(score) }}>{score}</div>
                    </div>
                  </td>
                ))}
                <td style={{ padding: "4px 8px", textAlign: "center" }}>
                  <div style={{
                    background: getColor(avg), color: "white",
                    borderRadius: "20px", padding: "3px 10px",
                    fontSize: "12px", fontWeight: "700", display: "inline-block"
                  }}>{avg}%</div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function StudentRadarMini({ subjects, scores, size = 180, color = "#2563eb" }) {
  if (!subjects || subjects.length < 3) return null;
  const cx = size / 2, cy = size / 2;
  const r = size * 0.35;
  const n = subjects.length;
  const angles = subjects.map((_, i) => (i / n) * 2 * Math.PI - Math.PI / 2);
  const axisPoints = angles.map(a => ({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }));
  const rings = [0.25, 0.5, 0.75, 1.0];
  const scorePoints = angles.map((a, i) => {
    const val = (scores[i] || 0) / 100;
    return { x: cx + r * val * Math.cos(a), y: cy + r * val * Math.sin(a) };
  });
  const polyPoints = scorePoints.map(p => `${p.x},${p.y}`).join(" ");
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {rings.map((ring, ri) => {
        const pts = angles.map(a =>
          `${cx + r * ring * Math.cos(a)},${cy + r * ring * Math.sin(a)}`
        ).join(" ");
        return <polygon key={ri} points={pts} fill="none" stroke="#e2e8f0" strokeWidth="1" />;
      })}
      {axisPoints.map((pt, i) => (
        <line key={i} x1={cx} y1={cy} x2={pt.x} y2={pt.y} stroke="#e2e8f0" strokeWidth="1" />
      ))}
      <polygon points={polyPoints} fill={color + "22"} stroke={color} strokeWidth="2" strokeLinejoin="round" />
      {scorePoints.map((pt, i) => (
        <circle key={i} cx={pt.x} cy={pt.y} r={3} fill={color} stroke="white" strokeWidth="1.5" />
      ))}
      {axisPoints.map((pt, i) => {
        const lx = cx + (r + 16) * Math.cos(angles[i]);
        const ly = cy + (r + 16) * Math.sin(angles[i]);
        const label = subjects[i]?.length > 8 ? subjects[i].slice(0, 8) + "…" : subjects[i];
        return <text key={i} x={lx} y={ly + 4} textAnchor="middle" fontSize="8" fontWeight="600" fill="#475569">{label}</text>;
      })}
    </svg>
  );
}
// ── These must be defined BEFORE ReportsPage ─────────────────────────────────

function StatPill({ label, value, color }) {
  return (
    <div style={{ background: color + "12", borderRadius: "8px", padding: "6px 10px", textAlign: "center", minWidth: "60px" }}>
      <div style={{ fontSize: "10px", color: "#94a3b8" }}>{label}</div>
      <div style={{ fontWeight: "700", color, fontSize: "14px" }}>{value}</div>
    </div>
  );
}

const rptTitle = { fontSize: "16px", fontWeight: "700", color: "#0f172a", marginBottom: "16px" };

function dlBtnStyle(color) {
  return {
    background: color + "10", color, border: `1.5px solid ${color}`,
    borderRadius: "8px", padding: "7px 14px", cursor: "pointer",
    fontSize: "12px", fontWeight: "600", whiteSpace: "nowrap"
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// REPORTS PAGE
// ══════════════════════════════════════════════════════════════════════════════
function ReportsPage({ analysis, assignments, students, facultyId, name }) {
  const [reportTab, setReportTab] = useState("class");
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [radarStudent, setRadarStudent] = useState(null);
  const printRef = useRef(null);

  const subjects = Array.from(
    new Map(
      (analysis?.subjects || []).map(s => [`${s.subject_code}_${s.class_id}`, s])
    ).values()
  );
  const uniqueClasses = [...new Set(assignments.map(a => a.class_id))];

  const classSummary = uniqueClasses.map(classId => {
    const classSubjects = subjects.filter(s => s.class_id === classId);
    const allScores = classSubjects.flatMap(s => s.student_scores?.map(st => st.score) || []);
    const avg = allScores.length ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0;
    const atRisk = classSubjects.reduce((acc, s) => acc + (s.at_risk_count || 0), 0);
    const distinction = classSubjects.reduce((acc, s) => acc + (s.distinction_count || 0), 0);
    return { classId, subjects: classSubjects.length, students: students.length, avg, atRisk, distinction };
  });

  const studentSummary = students.map(st => {
    const scores = subjects.flatMap(s => s.student_scores?.filter(ss => ss.prn === st.prn) || []);
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b.score, 0) / scores.length) : 0;
    const grades = scores.map(s => s.grade);
    const dominantGrade = grades.sort((a, b) =>
      grades.filter(g => g === b).length - grades.filter(g => g === a).length)[0] || "—";
    return { ...st, avg, grades, dominantGrade, subjectCount: scores.length };
  });

  // Build studentScores map: { prn: [score per subject in order] }
  const studentScoresMap = {};
  students.forEach(st => {
    studentScoresMap[st.prn] = subjects.map(sub => {
      const found = sub.student_scores?.find(x => x.prn === st.prn);
      return found ? found.score : 0;
    });
  });

  const subjectNames = subjects.map(s => s.subject_name);

  const downloadCSV = (filename, rows) => {
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = filename; a.click();
  };

  const downloadJSON = (filename, data) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = filename; a.click();
  };

  const printSection = (ref) => {
    const content = ref.current?.innerHTML;
    if (!content) return;
    const w = window.open("", "_blank");
    w.document.write(`<html><head><title>Report</title>
      <style>body{font-family:sans-serif;padding:24px;color:#0f172a}table{width:100%;border-collapse:collapse;margin-bottom:16px}th,td{border:1px solid #e2e8f0;padding:8px 12px;text-align:left;font-size:13px}th{background:#f8fafc;font-weight:700}h2,h3{color:#1d4ed8}@media print{.no-print{display:none}}</style>
      </head><body>${content}</body></html>`);
    w.document.close();
    setTimeout(() => { w.print(); }, 300);
  };

  return (
    <div>
      {/* Tabs + Download toolbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", gap: "8px", background: "#f1f5f9", borderRadius: "10px", padding: "4px" }}>
          {[
            { id: "class", label: "🏫 Class-wise" },
            { id: "subject", label: "📘 Subject-wise" },
            { id: "student", label: "👤 Student-wise" },
            { id: "visual", label: "📊 Visualize" },
          ].map(tab => (
            <button key={tab.id} onClick={() => setReportTab(tab.id)}
              style={{
                padding: "8px 16px", borderRadius: "8px", border: "none", cursor: "pointer",
                fontSize: "13px", fontWeight: "600", transition: "all 0.2s",
                background: reportTab === tab.id ? "white" : "transparent",
                color: reportTab === tab.id ? "#2563eb" : "#64748b",
                boxShadow: reportTab === tab.id ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
              }}>
              {tab.label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button onClick={() => printSection(printRef)} style={dlBtnStyle("#64748b")}>🖨️ Print</button>
          <button onClick={() => downloadCSV("class_report.csv", [
            ["Class", "Subjects", "Students", "Avg", "At-Risk", "Distinction"],
            ...classSummary.map(c => [c.classId, c.subjects, c.students, c.avg + "%", c.atRisk, c.distinction])
          ])} style={dlBtnStyle("#2563eb")}>⬇️ Class CSV</button>
          <button onClick={() => downloadCSV("student_report.csv", [
            ["PRN", "Name", "Branch", "Semester", "Avg", "Grade"],
            ...studentSummary.map(s => [s.prn, s.name, s.branch, s.semester, s.avg + "%", s.dominantGrade])
          ])} style={dlBtnStyle("#22c55e")}>⬇️ Student CSV</button>
          <button onClick={() => downloadJSON("full_report.json", { faculty: { id: facultyId, name }, classSummary, subjects, studentSummary })} style={dlBtnStyle("#f59e0b")}>⬇️ Full JSON</button>
        </div>
      </div>

      <div ref={printRef}>

        {/* ══ CLASS-WISE ══════════════════════════════════════════════════ */}
        {reportTab === "class" && (
          <div>
            <h3 style={rptTitle}>🏫 Class-wise Report</h3>

            {/* KPI cards */}
            <div style={{ display: "flex", gap: "16px", marginBottom: "20px", flexWrap: "wrap" }}>
              {classSummary.map((c, i) => (
                <div key={i} style={{ ...styles.kpiCard, flex: "1 1 220px", borderTop: "3px solid #2563eb" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <span style={{ fontWeight: "800", fontSize: "15px", color: "#0f172a" }}>{c.classId}</span>
                    <span style={{ background: "#eff6ff", color: "#2563eb", borderRadius: "8px", padding: "2px 10px", fontSize: "11px", fontWeight: "700" }}>
                      {c.subjects} subjects
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    <StatPill label="Avg" value={c.avg + "%"} color="#2563eb" />
                    <StatPill label="Students" value={c.students} color="#22c55e" />
                    <StatPill label="At-Risk" value={c.atRisk} color="#ef4444" />
                    <StatPill label="Distinction" value={c.distinction} color="#8b5cf6" />
                  </div>
                </div>
              ))}
            </div>

            {/* Table */}
            <div style={styles.formCard}>
              <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a", marginBottom: "12px" }}>Class Score Distribution</h4>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHead}>
                    {["Class", "Subjects", "Students", "Avg Score", "At-Risk", "Distinction", "Status"].map(h => (
                      <th key={h} style={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {classSummary.map((c, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>
                      <td style={{ ...styles.td, fontWeight: "700" }}>{c.classId}</td>
                      <td style={styles.td}>{c.subjects}</td>
                      <td style={styles.td}>{c.students}</td>
                      <td style={styles.td}>
                        <strong style={{ color: c.avg >= 75 ? "#22c55e" : c.avg >= 50 ? "#f59e0b" : "#ef4444" }}>{c.avg}%</strong>
                      </td>
                      <td style={styles.td}><span style={gradeBadge("At-Risk")}>{c.atRisk}</span></td>
                      <td style={styles.td}><span style={gradeBadge("Distinction")}>{c.distinction}</span></td>
                      <td style={styles.td}>
                        <span style={gradeBadge(c.avg >= 75 ? "Distinction" : c.avg >= 50 ? "Merit" : "At-Risk")}>
                          {c.avg >= 75 ? "✅ Good" : c.avg >= 50 ? "⚠️ Average" : "🔴 At-Risk"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Charts below class table ── */}
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginTop: "4px" }}>
              {/* Subject average horizontal bars */}
              <div style={{ ...styles.formCard, flex: "1 1 320px" }}>
                <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a", marginBottom: "16px" }}>
                  📊 Subject Average Performance
                </h4>
                <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "14px" }}>Average score per subject in this class</p>
                {subjects.map((s, i) => {
                  const color = s.mean >= 75 ? "#22c55e" : s.mean >= 50 ? "#f59e0b" : "#ef4444";
                  return <HorizontalBar key={i} label={s.subject_name} value={s.mean} max={100} color={color} />;
                })}
              </div>

              {/* Grade split donut per subject */}
              <div style={{ ...styles.formCard, flex: "1 1 320px" }}>
                <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a", marginBottom: "16px" }}>
                  🎯 At-Risk vs Distinction per Subject
                </h4>
                <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "16px" }}>Each circle = one subject</p>
                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center" }}>
                  {subjects.map((s, i) => {
                    const total = s.student_scores?.length || 1;
                    const distPct = Math.round((s.distinction_count / total) * 100);
                    const riskPct = Math.round((s.at_risk_count / total) * 100);
                    return (
                      <div key={i} style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "11px", color: "#374151", fontWeight: "700", marginBottom: "4px" }}>
                          {s.subject_name.length > 12 ? s.subject_name.slice(0, 12) + "…" : s.subject_name}
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <MiniDonut value={distPct} color="#22c55e" size={70} label="Dist%" />
                          <MiniDonut value={riskPct} color="#ef4444" size={70} label="Risk%" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pass rate bar */}
              <div style={{ ...styles.formCard, flex: "1 1 280px" }}>
                <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a", marginBottom: "16px" }}>
                  ✅ Pass Rate per Subject
                </h4>
                <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "14px" }}>% of students who scored ≥ 40</p>
                {subjects.map((s, i) => {
                  const total = s.student_scores?.length || 1;
                  const passed = s.student_scores?.filter(st => st.score >= 40).length || 0;
                  const passRate = Math.round((passed / total) * 100);
                  const color = passRate >= 80 ? "#22c55e" : passRate >= 60 ? "#f59e0b" : "#ef4444";
                  return <HorizontalBar key={i} label={s.subject_name} value={passRate} max={100} color={color} />;
                })}
              </div>
            </div>
          </div>
        )}

        {/* ══ SUBJECT-WISE ════════════════════════════════════════════════ */}
        {reportTab === "subject" && (
          <div>
            <h3 style={rptTitle}>📘 Subject-wise Report</h3>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "20px" }}>
              <button onClick={() => setSelectedSubject(null)}
                style={{ ...markAllBtnStyle(selectedSubject === null ? "#2563eb" : "#64748b"), fontSize: "12px", padding: "6px 14px" }}>
                All Subjects
              </button>
              {subjects.map((s, i) => (
                <button key={i} onClick={() => setSelectedSubject(i)}
                  style={{ ...markAllBtnStyle(selectedSubject === i ? "#2563eb" : "#64748b"), fontSize: "12px", padding: "6px 14px" }}>
                  {s.subject_name}
                </button>
              ))}
            </div>

            {(selectedSubject !== null ? [subjects[selectedSubject]] : subjects).map((s, i) => (
              <div key={i} style={{ ...styles.subjectCard, marginBottom: "16px" }}>
                <div style={styles.subjectHeader}>
                  <div>
                    <h3 style={{ margin: 0, color: "#0f172a", fontSize: "15px", fontWeight: "700" }}>{s.subject_name}</h3>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>{s.class_id}</span>
                  </div>
                  <span style={styles.classTag}>{s.class_id}</span>
                </div>

                <div style={styles.subKpiRow}>
                  <SubKpi label="Class Average" value={`${s.mean}%`} color="#2563eb" />
                  <SubKpi label="Highest" value={`${s.highest}%`} color="#22c55e" />
                  <SubKpi label="Lowest" value={`${s.lowest}%`} color="#ef4444" />
                  <SubKpi label="At-Risk" value={s.at_risk_count} color="#f59e0b" />
                  <SubKpi label="Distinction" value={s.distinction_count} color="#8b5cf6" />
                  <SubKpi label="Pass Rate"
                    value={s.student_scores?.length
                      ? Math.round(s.student_scores.filter(st => st.score >= 40).length / s.student_scores.length * 100) + "%"
                      : "—"}
                    color="#0ea5e9" />
                </div>

                {/* Student score table */}
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tableHead}>
                      {["#", "PRN", "Score", "Grade", "Progress", "Status"].map(h => <th key={h} style={styles.th}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {s.student_scores?.sort((a, b) => b.score - a.score).map((st, j) => (
                      <tr key={j} style={{ background: j % 2 === 0 ? "#fff" : "#f8fafc" }}>
                        <td style={{ ...styles.td, color: "#94a3b8", fontSize: "12px" }}>{j + 1}</td>
                        <td style={styles.td}>{st.prn}</td>
                        <td style={styles.td}><strong style={{ color: gradeColor(st.grade) }}>{st.score}%</strong></td>
                        <td style={styles.td}><span style={gradeBadge(st.grade)}>{st.grade}</span></td>
                        <td style={styles.td}>
                          <div style={styles.progressBg}>
                            <div style={{ ...styles.progressFill, width: `${st.score}%`, background: gradeColor(st.grade) }} />
                          </div>
                        </td>
                        <td style={styles.td}>
                          <span style={{ fontSize: "13px" }}>
                            {st.score >= 75 ? "✅" : st.score >= 50 ? "⚠️" : "🔴"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}

        {/* ══ STUDENT-WISE ════════════════════════════════════════════════ */}
        {reportTab === "student" && (
          <div>
            <h3 style={rptTitle}>👤 Student-wise Report</h3>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "20px" }}>
              <button onClick={() => setSelectedStudent(null)}
                style={{ ...markAllBtnStyle(selectedStudent === null ? "#2563eb" : "#64748b"), fontSize: "12px", padding: "6px 14px" }}>
                All Students
              </button>
              {students.map((s, i) => (
                <button key={i} onClick={() => setSelectedStudent(s.prn)}
                  style={{ ...markAllBtnStyle(selectedStudent === s.prn ? "#2563eb" : "#64748b"), fontSize: "12px", padding: "6px 14px" }}>
                  {s.name}
                </button>
              ))}
            </div>

            {selectedStudent === null ? (
              <div>
                {/* Student overview cards */}
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "20px" }}>
                  {studentSummary.map((s, i) => {
                    const statusColor = s.avg >= 75 ? "#22c55e" : s.avg >= 50 ? "#f59e0b" : "#ef4444";
                    return (
                      <div key={i} onClick={() => setSelectedStudent(s.prn)}
                        style={{ flex: "1 1 180px", background: "white", borderRadius: "12px", padding: "16px", border: "1px solid #e2e8f0", cursor: "pointer", borderTop: `3px solid ${statusColor}`, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                          <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: `linear-gradient(135deg, ${statusColor}, ${statusColor}aa)`, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "13px" }}>
                            {s.name?.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontWeight: "700", fontSize: "13px", color: "#0f172a" }}>{s.name}</div>
                            <div style={{ fontSize: "11px", color: "#94a3b8" }}>{s.prn}</div>
                          </div>
                        </div>
                        <div style={{ fontSize: "24px", fontWeight: "800", color: statusColor }}>{s.avg}%</div>
                        <span style={gradeBadge(s.dominantGrade)}>{s.dominantGrade}</span>
                      </div>
                    );
                  })}
                </div>
{/* Charts side by side */}
<div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "16px"  }}>

  {/* ── Chart 1: Grouped bar ── */}
  <div style={{ ...styles.formCard, flex: "1 1 250px", marginBottom: 0 }}>
    <h4 style={{ fontSize: "14px", fontWeight: "500", color: "#0f172a", marginBottom: "4px" }}>
      📊 Student Comparison — All Subjects
    </h4>
    <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "16px" }}>
      Each group = one subject. Each bar = one student.
    </p>
    <GroupedBarChart
      subjects={subjectNames}
      students={students}
      studentScores={studentScoresMap}
      height={40}
    />
    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "12px" }}>
      {students.map((st, i) => {
        const colors = ["#2563eb", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
            <div style={{ width: "7px", height: "8px", borderRadius: "2px", background: colors[i % colors.length] }} />
            {st.name}
          </div>
        );
      })}
    </div>
  </div>

  {/* ── Chart 2: Heat map ── */}
  <div style={{ ...styles.formCard, flex: "1 1 300px", marginBottom: 0 }}>
    <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a", marginBottom: "4px" }}>
      🌡️ Performance Heat Map
    </h4>
    <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "16px" }}>
      Green = strong, Yellow = average, Red = needs attention.
    </p>
    <HeatMapChart
      subjects={subjectNames}
      students={students}
      studentScores={studentScoresMap}
    />
    <div style={{ display: "flex", gap: "12px", marginTop: "12px", flexWrap: "wrap" }}>
      {[["#22c55e", "≥75% Distinction"], ["#84cc16", "60–74% Merit"], ["#f59e0b", "40–59% Pass"], ["#ef4444", "<40% At-Risk"]].map(([c, l], i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#64748b" }}>
          <div style={{ width: "12px", height: "12px", borderRadius: "3px", background: c + "40", border: `2px solid ${c}` }} />
          {l}
        </div>
      ))}
    </div>
  </div>

</div>
                {/* Summary table */}
                <div style={styles.formCard}>
                  <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a", marginBottom: "12px" }}>All Students Overview</h4>
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.tableHead}>
                        {["#", "PRN", "Name", "Branch", "Semester", "Avg Score", "Grade", "Status"].map(h => <th key={h} style={styles.th}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {studentSummary.sort((a, b) => b.avg - a.avg).map((s, i) => (
                        <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc", cursor: "pointer" }}
                          onClick={() => setSelectedStudent(s.prn)}>
                          <td style={{ ...styles.td, color: "#94a3b8", fontSize: "12px" }}>{i + 1}</td>
                          <td style={{ ...styles.td, color: "#64748b", fontSize: "12px" }}>{s.prn}</td>
                          <td style={{ ...styles.td, fontWeight: "600" }}>{s.name}</td>
                          <td style={styles.td}>{s.branch}</td>
                          <td style={styles.td}>{s.semester}</td>
                          <td style={styles.td}>
                            <strong style={{ color: s.avg >= 75 ? "#22c55e" : s.avg >= 50 ? "#f59e0b" : "#ef4444" }}>{s.avg}%</strong>
                          </td>
                          <td style={styles.td}><span style={gradeBadge(s.dominantGrade)}>{s.dominantGrade}</span></td>
                          <td style={styles.td}>{s.avg >= 75 ? "✅ Good" : s.avg >= 50 ? "⚠️ Average" : "🔴 At-Risk"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* ── Single student detail with 2 charts ── */
              (() => {
                const st = studentSummary.find(s => s.prn === selectedStudent);
                if (!st) return null;
                const stScores = subjects.map(sub => {
                  const ss = sub.student_scores?.find(x => x.prn === st.prn);
                  return ss ? { subject: sub.subject_name, class_id: sub.class_id, score: ss.score, grade: ss.grade } : null;
                }).filter(Boolean);
                const scoreValues = stScores.map(s => s.score);
                const subjectLabels = stScores.map(s => s.subject);
                const statusColor = st.avg >= 75 ? "#22c55e" : st.avg >= 50 ? "#f59e0b" : "#ef4444";

                return (
                  <div>
                    <button onClick={() => setSelectedStudent(null)}
                      style={{ ...markAllBtnStyle("#64748b"), fontSize: "12px", marginBottom: "16px", padding: "6px 14px" }}>
                      ← Back to All Students
                    </button>

                    {/* Student header card */}
                    <div style={{ ...styles.formCard, borderTop: `3px solid ${statusColor}`, marginBottom: "16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
                        <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: `linear-gradient(135deg, #2563eb, #7c3aed)`, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "22px" }}>
                          {st.name?.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: "800", fontSize: "18px", color: "#0f172a" }}>{st.name}</div>
                          <div style={{ fontSize: "13px", color: "#64748b" }}>{st.prn} · {st.branch} · Sem {st.semester}</div>
                        </div>
                        <div style={{ marginLeft: "auto", textAlign: "right" }}>
                          <div style={{ fontSize: "32px", fontWeight: "800", color: statusColor }}>{st.avg}%</div>
                          <span style={gradeBadge(st.dominantGrade)}>{st.dominantGrade}</span>
                        </div>
                      </div>

                      {/* Stats row */}
                      <div style={styles.subKpiRow}>
                        <SubKpi label="Subjects" value={stScores.length} color="#2563eb" />
                        <SubKpi label="Avg Score" value={st.avg + "%"} color={statusColor} />
                        <SubKpi label="Highest" value={(Math.max(...scoreValues, 0)) + "%"} color="#22c55e" />
                        <SubKpi label="Lowest" value={(Math.min(...scoreValues, 100)) + "%"} color="#ef4444" />
                      </div>

                      {/* Score table */}
                      <table style={styles.table}>
                        <thead>
                          <tr style={styles.tableHead}>
                            {["Subject", "Score", "Grade", "Progress"].map(h => <th key={h} style={styles.th}>{h}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {stScores.map((sc, j) => (
                            <tr key={j} style={{ background: j % 2 === 0 ? "#fff" : "#f8fafc" }}>
                              <td style={{ ...styles.td, fontWeight: "600" }}>{sc.subject}</td>
                              <td style={styles.td}><strong style={{ color: gradeColor(sc.grade) }}>{sc.score}%</strong></td>
                              <td style={styles.td}><span style={gradeBadge(sc.grade)}>{sc.grade}</span></td>
                              <td style={styles.td}>
                                <div style={styles.progressBg}>
                                  <div style={{ ...styles.progressFill, width: sc.score + "%", background: gradeColor(sc.grade) }} />
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* ── Chart 1: Horizontal bar — this student's scores ── */}
                    <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "16px" }}>
                      <div style={{ ...styles.formCard, flex: "1 1 300px", marginBottom: 0 }}>
                        <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a", marginBottom: "4px" }}>
                          📊 Subject Score Breakdown
                        </h4>
                        <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "16px" }}>
                          {st.name}'s score in each subject vs 100
                        </p>
                        {stScores.map((sc, i) => (
                          <HorizontalBar
                            key={i}
                            label={sc.subject.length > 20 ? sc.subject.slice(0, 20) + "…" : sc.subject}
                            value={sc.score}
                            max={100}
                            color={gradeColor(sc.grade)}
                          />
                        ))}
                        {/* Class avg line reference */}
                        <div style={{ marginTop: "12px", padding: "10px 12px", background: "#f0f7ff", borderRadius: "8px", fontSize: "12px", color: "#2563eb" }}>
                          📌 Class average per subject shown for reference:
                          {subjects.map((s, i) => (
                            <span key={i} style={{ display: "inline-block", margin: "4px 6px 0 0", background: "#dbeafe", borderRadius: "6px", padding: "2px 8px", fontSize: "11px" }}>
                              {s.subject_name.length > 10 ? s.subject_name.slice(0, 10) + "…" : s.subject_name}: <strong>{s.mean}%</strong>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* ── Chart 2: Radar — this student ── */}
                      <div style={{ ...styles.formCard, flex: "1 1 280px", marginBottom: 0 }}>
                        <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a", marginBottom: "4px" }}>
                          🕸️ Subject Strength Radar
                        </h4>
                        <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "12px" }}>
                          Each axis = one subject. Bigger shape = stronger performance.
                        </p>
                        <div style={{ display: "flex", justifyContent: "center" }}>
                          {subjectLabels.length >= 3 ? (
                            <StudentRadarMini
                              subjects={subjectLabels}
                              scores={scoreValues}
                              size={200}
                              color={statusColor}
                            />
                          ) : (
                            <div style={{ textAlign: "center", color: "#94a3b8", padding: "40px 0" }}>
                              <div style={{ fontSize: "32px" }}>📊</div>
                              <div style={{ fontSize: "12px", marginTop: "8px" }}>Need 3+ subjects for radar</div>
                            </div>
                          )}
                        </div>
                        {/* Strength/weakness summary */}
                        <div style={{ marginTop: "12px" }}>
                          {stScores.length > 0 && (() => {
                            const best = stScores.reduce((a, b) => a.score > b.score ? a : b);
                            const worst = stScores.reduce((a, b) => a.score < b.score ? a : b);
                            return (
                              <div style={{ display: "flex", gap: "8px" }}>
                                <div style={{ flex: 1, background: "#f0fdf4", borderRadius: "8px", padding: "10px 12px", border: "1px solid #bbf7d0" }}>
                                  <div style={{ fontSize: "10px", color: "#16a34a", fontWeight: "700", marginBottom: "2px" }}>💪 STRONGEST</div>
                                  <div style={{ fontSize: "12px", fontWeight: "700", color: "#0f172a" }}>{best.subject}</div>
                                  <div style={{ fontSize: "14px", fontWeight: "800", color: "#22c55e" }}>{best.score}%</div>
                                </div>
                                <div style={{ flex: 1, background: "#fff5f5", borderRadius: "8px", padding: "10px 12px", border: "1px solid #fecaca" }}>
                                  <div style={{ fontSize: "10px", color: "#dc2626", fontWeight: "700", marginBottom: "2px" }}>⚠️ NEEDS WORK</div>
                                  <div style={{ fontSize: "12px", fontWeight: "700", color: "#0f172a" }}>{worst.subject}</div>
                                  <div style={{ fontSize: "14px", fontWeight: "800", color: "#ef4444" }}>{worst.score}%</div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        )}

        {/* ══ VISUALIZE ════════════════════════════════════════════════════ */}
        {reportTab === "visual" && (
          <div>
            <h3 style={rptTitle}>📊 Visual Analytics</h3>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "20px" }}>
              <div style={{ ...styles.formCard, flex: "1 1 360px" }}>
                <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a", marginBottom: "16px" }}>📘 Subject Average Scores</h4>
                <BarChart data={subjects.map(s => ({ label: s.subject_name, value: s.mean || 0 }))} color="#2563eb" height={100} />
              </div>
              <div style={{ ...styles.formCard, flex: "1 1 350px" }}>
                <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a", marginBottom: "12px" }}>🎯 Grade Distribution</h4>
                {(() => {
                  const allScores = subjects.flatMap(s => s.student_scores || []);
                  const grades = ["Distinction", "Merit", "Pass", "At-Risk"];
                  const total = allScores.length || 1;
                  const segs = grades.map(g => ({ label: g, color: gradeColor(g), value: Math.round(allScores.filter(s => s.grade === g).length / total * 100) }));
                  return (
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <DonutChart segments={segs} size={200} />
                      <div>
                        {segs.map((seg, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: seg.color }} />
                            <span style={{ fontSize: "12px", color: "#374151" }}>{seg.label}</span>
                            <span style={{ fontSize: "12px", fontWeight: "700", color: seg.color, marginLeft: "auto", paddingLeft: "16px" }}>{seg.value}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "20px" }}>
              <div style={{ ...styles.formCard, flex: "1 1 340px", marginBottom: 0 }}>
                <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a", marginBottom: "16px" }}>👥 Student Average Comparison</h4>
                <BarChart data={studentSummary.map(s => ({ label: s.name?.split(" ")[0] || s.prn, value: s.avg, color: s.avg >= 75 ? "#22c55e" : s.avg >= 50 ? "#f59e0b" : "#ef4444" }))} height={100} />
              </div>
              <div style={{ ...styles.formCard, flex: "1 1 300px", marginBottom: 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                  <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a", margin: 0 }}>🕸️ Student Radar</h4>
                  <select value={radarStudent || ""} onChange={e => setRadarStudent(e.target.value || null)}
                    style={{ ...styles.select, width: "auto", fontSize: "12px", padding: "6px 10px" }}>
                    <option value="">— Pick student —</option>
                    {studentSummary.map((s, i) => <option key={i} value={s.prn}>{s.name}</option>)}
                  </select>
                </div>
                {radarStudent ? (() => {
                  const st = studentSummary.find(s => s.prn === radarStudent);
                  const radarScores = subjects.map(sub => sub.student_scores?.find(x => x.prn === radarStudent)?.score || 0);
                  return (
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <RadarChart subjects={subjectNames} scores={radarScores} size={200} />
                    </div>
                  );
                })() : (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "180px", color: "#94a3b8" }}>
                    <div style={{ fontSize: "32px" }}>🕸️</div>
                    <div style={{ fontSize: "13px", marginTop: "8px" }}>Select a student above</div>
                  </div>
                )}
              </div>
            </div>

            {/* Sparklines */}
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              {subjects.map((s, i) => {
                const sortedScores = [...(s.student_scores || [])].sort((a, b) => a.score - b.score);
                return (
                  <div key={i} style={{ ...styles.formCard, flex: "1 1 280px" }}>
                    <div style={{ fontWeight: "700", fontSize: "13px", color: "#0f172a", marginBottom: "4px" }}>{s.subject_name}</div>
                    <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "10px" }}>{s.class_id}</div>
                    <LineSparkline scores={sortedScores.map(st => st.score)} color="#2563eb" />
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
                      <span style={{ fontSize: "11px", color: "#ef4444" }}>Low: {s.lowest}%</span>
                      <span style={{ fontSize: "11px", color: "#2563eb" }}>Avg: {s.mean}%</span>
                      <span style={{ fontSize: "11px", color: "#22c55e" }}>High: {s.highest}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
// ── Helper Components ──────────────────────────────────────────────────────────
function KpiCard({ label, value, color, bg, icon }) {
  return (
    <div style={{ ...styles.kpiCard, borderTop: `3px solid ${color}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={styles.kpiLabel}>{label}</p>
          <p style={{ ...styles.kpiValue, color }}>{value}</p>
        </div>
        <div style={{ background: bg, borderRadius: "10px", padding: "10px", fontSize: "20px" }}>{icon}</div>
      </div>
    </div>
  );
}

function SubKpi({ label, value, color }) {
  return (
    <div style={{ flex: 1, minWidth: "100px", background: "#f8fafc", borderRadius: "10px", padding: "12px", textAlign: "center", border: "1px solid #e2e8f0" }}>
      <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "4px" }}>{label}</div>
      <div style={{ fontSize: "20px", fontWeight: "700", color }}>{value}</div>
    </div>
  );
}
// ══════════════════════════════════════════════════════════════════════════════
// MAIN FACULTY DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
function FacultyDashboard({ facultyId, name }) {
  const [activePage, setActivePage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [assignments, setAssignments] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [students, setStudents] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [selectedClass, setSelectedClass] = useState("");
  const [attSaved, setAttSaved] = useState(false);
  const [attView, setAttView] = useState("mark"); // "mark" or "analysis"
  const [attendanceDate, setAttendanceDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [marksForm, setMarksForm] = useState({
    prn: "", subject_code: "", subject_name: "", score: "", semester: "4", class_id: ""
  });

  const showMsg = (msg) => { setMessage(msg); setError(""); setTimeout(() => setMessage(""), 4000); };
  const showErr = (msg) => { setError(msg); setMessage(""); };

  useEffect(() => { loadData(); }, [facultyId]);

  const loadData = async () => {
    try {
      const a = await getMyAssignments();
      const uniqueAssignments = Array.from(
        new Map(a.map(x => [`${x.subject_code}_${x.class_id}`, x])).values()
      );
      setAssignments(uniqueAssignments);
      if (a.length > 0) {
        const classId = a[0].class_id;
        setSelectedClass(classId);
        const s = await getClassStudents(classId);
        const unique = Array.from(new Map(s.map(st => [st.prn, st])).values());
        setStudents(unique);
        const init = {};
        unique.forEach(st => { init[st.prn] = "present"; });
        setAttendanceMap(init);
      }
      const fa = await getFacultyAnalysis(facultyId);
      if (fa && fa.subjects) {
        fa.subjects = Array.from(
          new Map(fa.subjects.map(s => [`${s.subject_code}_${s.class_id}`, s])).values()
        );
      }
      setAnalysis(fa);
    } catch (e) { showErr("Failed to load data"); }
  };

  const handleAddMarks = async () => {
    try {
      if (!marksForm.prn || !marksForm.score || !marksForm.subject_code) {
        showErr("Fill all fields!"); return;
      }
      await facultyAddMarks({
        prn: marksForm.prn, subject_code: marksForm.subject_code,
        subject_name: marksForm.subject_name, score: parseFloat(marksForm.score),
        semester: parseInt(marksForm.semester), class_id: marksForm.class_id
      });
      showMsg("✅ Marks updated!");
      setMarksForm({ prn: "", subject_code: "", subject_name: "", score: "", semester: "4", class_id: "" });
      loadData();
    } catch (e) { showErr("❌ " + (e.response?.data?.detail || "Error")); }
  };

  const handleSaveAttendance = async () => {
    try {
      const classId = selectedClass || assignments[0]?.class_id;
      for (const [prn, status] of Object.entries(attendanceMap)) {
        await facultyAddAttendance({
          prn, percentage: status === "present" ? 100 : 0, class_id: classId
        });
      }
      setAttSaved(true);
      showMsg(`✅ Attendance saved for ${attendanceDate}!`);
      setTimeout(() => setAttSaved(false), 3000);
    } catch (e) { showErr("❌ Failed to save attendance"); }
  };

  const toggleAttendance = (prn) => {
    setAttendanceMap(prev => ({
      ...prev, [prn]: prev[prn] === "present" ? "absent" : "present"
    }));
    setAttSaved(false);
  };

  const markAll = (status) => {
    const updated = {};
    students.forEach(s => { updated[s.prn] = status; });
    setAttendanceMap(updated);
    setAttSaved(false);
  };

  const presentCount = Object.values(attendanceMap).filter(v => v === "present").length;
  const absentCount = Object.values(attendanceMap).filter(v => v === "absent").length;
  const uniqueClasses = [...new Set(assignments.map(a => a.class_id))];

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "⊞" },
    { id: "marks", label: "Enter Marks", icon: "📝" },
    { id: "attendance", label: "Attendance", icon: "📅" },
    { id: "students", label: "My Students", icon: "👥" },
    { id: "reports", label: "Reports & Analytics", icon: "📊" },
  ];

  const formattedDate = new Date(attendanceDate).toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });

  return (
    <div style={styles.layout}>
      {/* SIDEBAR */}
      <div style={{ ...styles.sidebar, width: sidebarOpen ? "260px" : "64px" }}>
        <div style={styles.sidebarScrollArea}>
          <div style={styles.sidebarBrand}>
            <div style={styles.brandIconBox}>🎓</div>
            {sidebarOpen && (
              <div>
                <div style={styles.brandName}>CAS</div>
                <div style={styles.brandSub}>Faculty Portal</div>
              </div>
            )}
          </div>

          <nav style={styles.nav}>
            {navItems.map((item) => (
              <button key={item.id}
                style={{
                  ...styles.navBtn,
                  background: activePage === item.id
                    ? "linear-gradient(135deg, #2563eb, #1d4ed8)" : "transparent",
                  color: activePage === item.id ? "white" : "#94a3b8",
                  justifyContent: sidebarOpen ? "flex-start" : "center",
                  boxShadow: activePage === item.id
                    ? "0 4px 12px rgba(37,99,235,0.4)" : "none",
                }}
                onClick={() => setActivePage(item.id)}>
                <span style={{ fontSize: "18px" }}>{item.icon}</span>
                {sidebarOpen && <span style={{ marginLeft: "12px" }}>{item.label}</span>}
              </button>
            ))}
          </nav>

          {sidebarOpen && (
            <div style={styles.sidebarSection}>
              <div style={styles.sidebarSectionTitle}>MY SUBJECTS</div>
              {assignments.map((a, i) => (
                <div key={i} style={styles.assignItem}>
                  <div style={styles.assignDot} />
                  <div>
                    <div style={{ color: "white", fontSize: "12px", fontWeight: "600" }}>
                      {a.subject_name}
                    </div>
                    <div style={{ color: "#64748b", fontSize: "11px" }}>{a.class_id}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fixed bottom */}
        <div style={styles.sidebarBottom}>
          <button style={styles.collapseBtn} onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? "◀" : "▶"}
          </button>
          {sidebarOpen && (
            <>
              {showProfile && (
                <div style={styles.profileDropdown}>
                  <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "700", letterSpacing: "1px", marginBottom: "10px" }}>
                    FACULTY INFO
                  </div>
                  {[
                    { label: "Name", value: name },
                    { label: "Faculty ID", value: facultyId },
                    { label: "Role", value: "Faculty" },
                    { label: "Subjects", value: assignments.length },
                    { label: "Class", value: uniqueClasses.join(", ") || "—" },
                  ].map((row, i) => (
                    <div key={i} style={styles.profileRow}>
                      <span style={styles.profileLabel}>{row.label}</span>
                      <span style={styles.profileValue}>{row.value}</span>
                    </div>
                  ))}
                </div>
              )}
              <div style={styles.facultyNameBtn} onClick={() => setShowProfile(!showProfile)}>
                <div style={styles.userAvatar}>{name?.charAt(0) || "F"}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: "white", fontSize: "13px", fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {name}
                  </div>
                  <div style={{ color: "#64748b", fontSize: "11px" }}>Faculty · {facultyId}</div>
                </div>
                <span style={{ color: "#64748b", fontSize: "12px", flexShrink: 0 }}>
                  {showProfile ? "▼" : "▲"}
                </span>
              </div>
              <button style={styles.logoutBtn}
                onClick={() => { localStorage.clear(); window.location.reload(); }}>
                ↪ Logout
              </button>
            </>
          )}
        </div>
      </div>

      {/* MAIN */}
      <div style={{ ...styles.main, marginLeft: sidebarOpen ? "260px" : "64px" }}>
        <div style={styles.topbar}>
          <h1 style={styles.pageTitle}>
            {navItems.find(n => n.id === activePage)?.icon}{" "}
            {navItems.find(n => n.id === activePage)?.label}
          </h1>
          <div style={{ fontSize: "14px", color: "#64748b" }}>
            Welcome, <strong style={{ color: "#0f172a" }}>{name}</strong>
          </div>
        </div>

        {message && <div id="facultySuccess" style={styles.success}>{message}</div>}
        {error && <div id="facultyError" style={styles.errorBox}>{error}</div>}

        {/* ══ DASHBOARD ══ */}
        {activePage === "dashboard" && analysis && !analysis.error && (
          <div>
            <div style={styles.kpiRow}>
              <KpiCard label="Total Subjects" value={assignments.length} color="#2563eb" bg="#eff6ff" icon="📚" />
              <KpiCard label="Total Students" value={students.length} color="#22c55e" bg="#dcfce7" icon="👥" />
              <KpiCard label="Classes" value={uniqueClasses.length} color="#8b5cf6" bg="#f5f3ff" icon="🏫" />
              <KpiCard label="At-Risk Students"
                value={analysis.subjects?.reduce((acc, s) => acc + s.at_risk_count, 0) || 0}
                color="#ef4444" bg="#fee2e2" icon="⚠️" />
            </div>

            <div style={{ background: "linear-gradient(135deg, #1e3a5f, #2563eb)", borderRadius: "14px", padding: "20px 24px", marginBottom: "24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <div style={{ color: "white", fontWeight: "700", fontSize: "15px" }}>📊 Reports & Analytics</div>
                <div style={{ color: "#93c5fd", fontSize: "13px", marginTop: "4px" }}>
                  Class-wise, subject-wise, student-wise reports with charts and downloads
                </div>
              </div>
              <button onClick={() => setActivePage("reports")}
                style={{ background: "white", color: "#2563eb", border: "none", borderRadius: "8px", padding: "10px 20px", fontWeight: "700", cursor: "pointer", fontSize: "13px" }}>
                View Reports →
              </button>
            </div>

            {analysis.subjects?.map((s, i) => (
              <div key={i} style={styles.subjectCard}>
                <div style={styles.subjectHeader}>
                  <div>
                    <h3 style={{ margin: 0, color: "#0f172a", fontSize: "16px" }}>{s.subject_name}</h3>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>{s.class_id}</span>
                  </div>
                  <span style={styles.classTag}>{s.class_id}</span>
                </div>
                <div style={styles.subKpiRow}>
                  <SubKpi label="Class Average" value={`${s.mean}%`} color="#2563eb" />
                  <SubKpi label="Highest" value={`${s.highest}%`} color="#22c55e" />
                  <SubKpi label="Lowest" value={`${s.lowest}%`} color="#ef4444" />
                  <SubKpi label="At-Risk" value={s.at_risk_count} color="#f59e0b" />
                  <SubKpi label="Distinction" value={s.distinction_count} color="#8b5cf6" />
                </div>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tableHead}>
                      <th style={styles.th}>PRN</th>
                      <th style={styles.th}>Score</th>
                      <th style={styles.th}>Grade</th>
                      <th style={styles.th}>Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.student_scores?.map((st, j) => (
                      <tr key={j} style={{ background: j % 2 === 0 ? "#fff" : "#f8fafc" }}>
                        <td style={styles.td}>{st.prn}</td>
                        <td style={styles.td}><strong>{st.score}%</strong></td>
                        <td style={styles.td}><span style={gradeBadge(st.grade)}>{st.grade}</span></td>
                        <td style={styles.td}>
                          <div style={styles.progressBg}>
                            <div style={{ ...styles.progressFill, width: `${st.score}%`, background: gradeColor(st.grade) }} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}

        {/* ══ MARKS ══ */}
        {activePage === "marks" && (
          <div style={styles.formCard}>
            <h3 style={styles.formTitle}>📝 Enter Student Marks</h3>
            <div style={styles.infoBox}>
              <strong>Your subjects:</strong>{" "}
              {assignments.map(a => `${a.subject_code} - ${a.subject_name}`).join(" | ")}
            </div>
            <div style={styles.grid}>
              <div style={{ marginBottom: "16px" }}>
                <label style={styles.label}>Subject</label>
                <select id="marksSubject" style={styles.select} value={marksForm.subject_code}
                  onChange={(e) => {
                    const found = assignments.find(a => a.subject_code === e.target.value);
                    if (found) setMarksForm({
                      ...marksForm,
                      subject_code: found.subject_code,
                      subject_name: found.subject_name,
                      class_id: found.class_id
                    });
                  }}>
                  <option value="">Select Subject</option>
                  {assignments.map((a, i) => (
                    <option key={i} value={a.subject_code}>
                      {a.subject_name} ({a.class_id})
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={styles.label}>Student</label>
                <select id="marksStudent" style={styles.select} value={marksForm.prn}
                  onChange={(e) => setMarksForm({ ...marksForm, prn: e.target.value })}>
                  <option value="">Select Student</option>
                  {students.map((s, i) => (
                    <option key={i} value={s.prn}>{s.name} — {s.prn}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={styles.label}>Score (0–100)</label>
                <input id="marksScore" type="number" value={marksForm.score}
                  onChange={(e) => setMarksForm({ ...marksForm, score: e.target.value })}
                  placeholder="e.g. 78" style={styles.input} />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={styles.label}>Semester</label>
                <input id="marksSemester" type="number" value={marksForm.semester}
                  onChange={(e) => setMarksForm({ ...marksForm, semester: e.target.value })}
                  placeholder="e.g. 4" style={styles.input} />
              </div>
            </div>
            <button id="submitMarksBtn" style={styles.submitBtn} onClick={handleAddMarks}>Submit Marks</button>
          </div>
        )}

{/* ══ ATTENDANCE ══ */}
        {activePage === "attendance" && (
          <div>
            {/* Toggle buttons */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
              <button
                onClick={() => setAttView("mark")}
                style={{
                  padding: "10px 20px", borderRadius: "10px", border: "none",
                  cursor: "pointer", fontWeight: "600", fontSize: "14px",
                  background: attView === "mark"
                    ? "linear-gradient(135deg, #2563eb, #1d4ed8)" : "#f1f5f9",
                  color: attView === "mark" ? "white" : "#64748b",
                  boxShadow: attView === "mark" ? "0 4px 12px rgba(37,99,235,0.3)" : "none"
                }}>
                📅 Mark Attendance
              </button>
              <button
                onClick={() => setAttView("analysis")}
                style={{
                  padding: "10px 20px", borderRadius: "10px", border: "none",
                  cursor: "pointer", fontWeight: "600", fontSize: "14px",
                  background: attView === "analysis"
                    ? "linear-gradient(135deg, #2563eb, #1d4ed8)" : "#f1f5f9",
                  color: attView === "analysis" ? "white" : "#64748b",
                  boxShadow: attView === "analysis" ? "0 4px 12px rgba(37,99,235,0.3)" : "none"
                }}>
                📊 Attendance Analysis
              </button>
            </div>

            {/* ── MARK ATTENDANCE ── */}
            {attView === "mark" && (
              <div style={styles.formCard}>
                <h3 style={styles.formTitle}>📅 Mark Attendance</h3>
                <div style={{ display: "flex", gap: "20px", alignItems: "flex-end", marginBottom: "20px", flexWrap: "wrap" }}>
                  <div>
                    <label style={styles.label}>📆 Date</label>
                    <input type="date" value={attendanceDate}
                      onChange={(e) => { setAttendanceDate(e.target.value); setAttSaved(false); }}
                      style={{ ...styles.input, width: "200px" }} />
                  </div>
                  <div>
                    <label style={styles.label}>🏫 Class</label>
                    <select style={{ ...styles.select, width: "200px" }} value={selectedClass}
                      onChange={async (e) => {
                        setSelectedClass(e.target.value);
                        const s = await getClassStudents(e.target.value);
                        const unique = Array.from(new Map(s.map(st => [st.prn, st])).values());
                        setStudents(unique);
                        const init = {};
                        unique.forEach(st => { init[st.prn] = "present"; });
                        setAttendanceMap(init);
                        setAttSaved(false);
                      }}>
                      {uniqueClasses.map((c, i) => <option key={i} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <div style={attPillStyle("#22c55e")}>✅ Present: {presentCount}</div>
                    <div style={attPillStyle("#ef4444")}>❌ Absent: {absentCount}</div>
                    <div style={attPillStyle("#64748b")}>
                      📊 {students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0}%
                    </div>
                  </div>
                </div>

                <div style={styles.dateBanner}>
                  <span style={{ fontSize: "16px" }}>📅</span>
                  <div>
                    <div style={{ fontWeight: "700", color: "#0f172a", fontSize: "14px" }}>
                      Attendance for: {formattedDate}
                    </div>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>
                      Class: {selectedClass} · {students.length} students
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
                  <button style={markAllBtnStyle("#22c55e")} onClick={() => markAll("present")}>
                    ✅ Mark All Present
                  </button>
                  <button style={markAllBtnStyle("#ef4444")} onClick={() => markAll("absent")}>
                    ❌ Mark All Absent
                  </button>
                </div>

                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tableHead}>
                      <th style={styles.th}>#</th>
                      <th style={styles.th}>PRN</th>
                      <th style={styles.th}>Name</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s, i) => {
                      const isPresent = attendanceMap[s.prn] === "present";
                      return (
                        <tr key={i} style={{
                          background: isPresent ? "#f0fdf4" : "#fff5f5",
                          borderBottom: "1px solid #f0f0f0",
                          transition: "background 0.2s"
                        }}>
                          <td style={styles.td}>{i + 1}</td>
                          <td style={{ ...styles.td, color: "#64748b", fontSize: "12px" }}>{s.prn}</td>
                          <td style={{ ...styles.td, fontWeight: "600" }}>{s.name}</td>
                          <td style={styles.td}>
                            <span style={{
                              background: isPresent ? "#dcfce7" : "#fee2e2",
                              color: isPresent ? "#16a34a" : "#dc2626",
                              borderRadius: "20px", padding: "4px 14px",
                              fontSize: "12px", fontWeight: "700", display: "inline-block"
                            }}>
                              {isPresent ? "✅ Present" : "❌ Absent"}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <button onClick={() => toggleAttendance(s.prn)}
                              style={{
                                background: isPresent ? "#fee2e2" : "#dcfce7",
                                color: isPresent ? "#dc2626" : "#16a34a",
                                border: `1px solid ${isPresent ? "#fca5a5" : "#86efac"}`,
                                borderRadius: "8px", padding: "6px 16px",
                                cursor: "pointer", fontSize: "12px", fontWeight: "600"
                              }}>
                              Mark {isPresent ? "Absent" : "Present"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div style={{ marginTop: "20px", display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                  <button style={styles.submitBtn} onClick={handleSaveAttendance}>
                    💾 Save Attendance for {attendanceDate}
                  </button>
                  {attSaved && (
                    <span style={{ color: "#22c55e", fontWeight: "600", fontSize: "14px" }}>
                      ✅ Saved successfully!
                    </span>
                  )}
                </div>
                <div style={{ ...styles.infoBox, marginTop: "16px" }}>
                  🟢 Satisfactory: ≥ 80% &nbsp;|&nbsp; 🟡 Warning: 65–79% &nbsp;|&nbsp; 🔴 Critical: &lt; 65%
                </div>
              </div>
            )}

            {/* ── ATTENDANCE ANALYSIS ── */}
            {attView === "analysis" && (
              <div>
                {/* KPI Cards */}
                <div style={{ display: "flex", gap: "16px", marginBottom: "20px", flexWrap: "wrap" }}>
                  {(() => {
                    const total = students.length;
                    const presentNow = Object.values(attendanceMap).filter(v => v === "present").length;
                    const absentNow = total - presentNow;
                    const pct = total > 0 ? Math.round((presentNow / total) * 100) : 0;
                    const attColor = pct >= 80 ? "#22c55e" : pct >= 65 ? "#f59e0b" : "#ef4444";
                    return (
                      <>
                        <div style={{ ...styles.kpiCard, flex: "1 1 150px", borderTop: "3px solid #2563eb" }}>
                          <p style={styles.kpiLabel}>Total Students</p>
                          <p style={{ ...styles.kpiValue, color: "#2563eb" }}>{total}</p>
                        </div>
                        <div style={{ ...styles.kpiCard, flex: "1 1 150px", borderTop: "3px solid #22c55e" }}>
                          <p style={styles.kpiLabel}>Present</p>
                          <p style={{ ...styles.kpiValue, color: "#22c55e" }}>{presentNow}</p>
                        </div>
                        <div style={{ ...styles.kpiCard, flex: "1 1 150px", borderTop: "3px solid #ef4444" }}>
                          <p style={styles.kpiLabel}>Absent</p>
                          <p style={{ ...styles.kpiValue, color: "#ef4444" }}>{absentNow}</p>
                        </div>
                        <div style={{ ...styles.kpiCard, flex: "1 1 150px", borderTop: `3px solid ${attColor}` }}>
                          <p style={styles.kpiLabel}>Attendance %</p>
                          <p style={{ ...styles.kpiValue, color: attColor }}>{pct}%</p>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Charts Row */}
                <div style={{ display: "flex", gap: "16px", marginBottom: "20px", flexWrap: "wrap" }}>
                  {/* Bar chart */}
                  <div style={{ ...styles.formCard, flex: "1 1 300px", marginBottom: 0 }}>
                    <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a", marginBottom: "4px" }}>
                      📊 Student-wise Attendance
                    </h4>
                    <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "16px" }}>
                      Present = 100%, Absent = 0% (today's session)
                    </p>
                    <BarChart
                      data={students.map(s => ({
                        label: s.name?.split(" ")[0] || s.prn,
                        value: attendanceMap[s.prn] === "present" ? 100 : 0,
                        color: attendanceMap[s.prn] === "present" ? "#22c55e" : "#ef4444"
                      }))}
                      height={120}
                    />
                  </div>

                  {/* Donut chart */}
                  <div style={{ ...styles.formCard, flex: "1 1 250px", marginBottom: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a", marginBottom: "4px", alignSelf: "flex-start" }}>
                      🍩 Present vs Absent
                    </h4>
                    <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "16px", alignSelf: "flex-start" }}>
                      Today's class breakdown
                    </p>
                    {(() => {
                      const total = students.length || 1;
                      const presentPct = Math.round((presentCount / total) * 100);
                      const absentPct = 100 - presentPct;
                      return (
                        <>
                          <DonutChart segments={[
                            { label: "Present", value: presentPct, color: "#22c55e" },
                            { label: "Absent", value: absentPct, color: "#ef4444" },
                          ]} size={160} />
                          <div style={{ display: "flex", gap: "16px", marginTop: "12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
                              <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#22c55e" }} />
                              Present ({presentPct}%)
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
                              <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ef4444" }} />
                              Absent ({absentPct}%)
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Student detail table + download */}
                <div style={styles.formCard}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
                    <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
                      👥 Student Attendance Detail
                    </h4>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => {
                          const rows = [
                            ["#", "PRN", "Name", "Branch", "Semester", "Status", "Date"],
                            ...students.map((s, i) => [
                              i + 1, s.prn, s.name, s.branch, s.semester,
                              attendanceMap[s.prn] === "present" ? "Present" : "Absent",
                              attendanceDate
                            ])
                          ];
                          const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
                          const blob = new Blob([csv], { type: "text/csv" });
                          const a = document.createElement("a");
                          a.href = URL.createObjectURL(blob);
                          a.download = `attendance_${selectedClass}_${attendanceDate}.csv`;
                          a.click();
                        }}
                        style={{ background: "#dcfce7", color: "#16a34a", border: "1px solid #86efac", borderRadius: "8px", padding: "7px 14px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>
                        ⬇️ Download CSV
                      </button>
                      <button
                        onClick={() => {
                          const data = {
                            class: selectedClass, date: attendanceDate,
                            total: students.length, present: presentCount, absent: absentCount,
                            students: students.map(s => ({
                              prn: s.prn, name: s.name,
                              status: attendanceMap[s.prn] === "present" ? "Present" : "Absent"
                            }))
                          };
                          const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                          const a = document.createElement("a");
                          a.href = URL.createObjectURL(blob);
                          a.download = `attendance_${selectedClass}_${attendanceDate}.json`;
                          a.click();
                        }}
                        style={{ background: "#fef9c3", color: "#ca8a04", border: "1px solid #fde047", borderRadius: "8px", padding: "7px 14px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>
                        ⬇️ Download JSON
                      </button>
                    </div>
                  </div>

                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.tableHead}>
                        <th style={styles.th}>#</th>
                        <th style={styles.th}>PRN</th>
                        <th style={styles.th}>Name</th>
                        <th style={styles.th}>Branch</th>
                        <th style={styles.th}>Semester</th>
                        <th style={styles.th}>Status</th>
                        <th style={styles.th}>Attendance %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((s, i) => {
                        const isPresent = attendanceMap[s.prn] === "present";
                        return (
                          <tr key={i} style={{
                            background: isPresent ? "#f0fdf4" : "#fff5f5",
                            borderBottom: "1px solid #f0f0f0"
                          }}>
                            <td style={{ ...styles.td, color: "#94a3b8" }}>{i + 1}</td>
                            <td style={{ ...styles.td, color: "#64748b", fontSize: "12px" }}>{s.prn}</td>
                            <td style={{ ...styles.td, fontWeight: "600" }}>{s.name}</td>
                            <td style={styles.td}>{s.branch}</td>
                            <td style={styles.td}>{s.semester}</td>
                            <td style={styles.td}>
                              <span style={{
                                background: isPresent ? "#dcfce7" : "#fee2e2",
                                color: isPresent ? "#16a34a" : "#dc2626",
                                borderRadius: "20px", padding: "4px 14px",
                                fontSize: "12px", fontWeight: "700"
                              }}>
                                {isPresent ? "✅ Present" : "❌ Absent"}
                              </span>
                            </td>
                            <td style={styles.td}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <div style={{ background: "#e2e8f0", borderRadius: "4px", height: "6px", width: "80px" }}>
                                  <div style={{
                                    width: isPresent ? "100%" : "0%",
                                    background: isPresent ? "#22c55e" : "#ef4444",
                                    height: "6px", borderRadius: "4px"
                                  }} />
                                </div>
                                <span style={{ fontSize: "12px", fontWeight: "700", color: isPresent ? "#22c55e" : "#ef4444" }}>
                                  {isPresent ? "100%" : "0%"}
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

       
        {/* ══ STUDENTS ══ */}
        {activePage === "students" && (
          <div style={styles.formCard}>
            <h3 style={styles.formTitle}>👥 Students in Your Class</h3>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHead}>
                  <th style={styles.th}>#</th>
                  <th style={styles.th}>PRN</th>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Branch</th>
                  <th style={styles.th}>Semester</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>
                    <td style={styles.td}>{i + 1}</td>
                    <td style={{ ...styles.td, color: "#64748b", fontSize: "12px" }}>{s.prn}</td>
                    <td style={{ ...styles.td, fontWeight: "600" }}>{s.name}</td>
                    <td style={styles.td}>{s.branch}</td>
                    <td style={styles.td}>{s.semester}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ══ REPORTS ══ */}
        {activePage === "reports" && (
          <ReportsPage
            analysis={analysis}
            assignments={assignments}
            students={students}
            facultyId={facultyId}
            name={name}
          />
        )}
      </div>
    </div>
  );
}

const styles = {
  layout: { display: "flex", minHeight: "100vh", background: "#f8fafc" },
  sidebar: { background: "#0f172a", display: "flex", flexDirection: "column", transition: "width 0.3s", overflow: "hidden", minHeight: "100vh", position: "fixed", left: 0, top: 0, zIndex: 100 },
  sidebarScrollArea: { flex: 1, overflowY: "auto", overflowX: "hidden", paddingTop: "20px", scrollbarWidth: "none" },
  sidebarBrand: { display: "flex", alignItems: "center", gap: "12px", padding: "0 16px 20px 16px", borderBottom: "1px solid #1e293b", marginBottom: "8px" },
  brandIconBox: { fontSize: "22px", background: "#2563eb", borderRadius: "10px", padding: "6px 10px", flexShrink: 0 },
  brandName: { color: "white", fontWeight: "800", fontSize: "15px" },
  brandSub: { color: "#64748b", fontSize: "11px" },
  nav: { padding: "8px", display: "flex", flexDirection: "column", gap: "4px" },
  navBtn: { display: "flex", alignItems: "center", padding: "10px 14px", borderRadius: "10px", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: "500", width: "100%", transition: "all 0.2s" },
  sidebarSection: { padding: "16px", borderTop: "1px solid #1e293b", marginTop: "8px" },
  sidebarSectionTitle: { fontSize: "10px", color: "#475569", fontWeight: "700", letterSpacing: "1px", marginBottom: "10px" },
  assignItem: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" },
  assignDot: { width: "6px", height: "6px", borderRadius: "50%", background: "#2563eb", flexShrink: 0 },
  sidebarBottom: { padding: "12px", borderTop: "1px solid #1e293b", flexShrink: 0, background: "#0f172a" },
  collapseBtn: { background: "transparent", border: "none", color: "#64748b", cursor: "pointer", fontSize: "14px", marginBottom: "10px", width: "100%", textAlign: "right" },
  facultyNameBtn: { display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", padding: "10px", borderRadius: "10px", marginBottom: "8px", background: "#1e293b", border: "1px solid #334155" },
  userAvatar: { width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg, #2563eb, #7c3aed)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "14px", flexShrink: 0 },
  profileDropdown: { background: "#1e293b", borderRadius: "10px", padding: "14px", marginBottom: "10px", border: "1px solid #334155" },
  profileRow: { display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #334155", fontSize: "12px" },
  profileLabel: { color: "#64748b" },
  profileValue: { color: "white", fontWeight: "600", fontSize: "11px", maxWidth: "130px", textAlign: "right" },
  logoutBtn: { background: "transparent", border: "none", color: "#64748b", cursor: "pointer", fontSize: "13px", width: "100%", textAlign: "left", padding: "4px 0" },
  main: { flex: 1, padding: "24px 32px", transition: "margin-left 0.3s" },
  topbar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", paddingBottom: "16px", borderBottom: "1px solid #e2e8f0" },
  pageTitle: { fontSize: "22px", fontWeight: "700", color: "#0f172a" },
  success: { background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "8px", padding: "12px 18px", marginBottom: "16px", color: "#16a34a", fontWeight: "600" },
  errorBox: { background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "8px", padding: "12px 18px", marginBottom: "16px", color: "#dc2626", fontWeight: "600" },
  kpiRow: { display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap" },
  kpiCard: { flex: 1, minWidth: "160px", background: "white", borderRadius: "14px", padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0" },
  kpiLabel: { fontSize: "12px", color: "#64748b", marginBottom: "6px" },
  kpiValue: { fontSize: "26px", fontWeight: "700", margin: 0 },
  subjectCard: { background: "white", borderRadius: "14px", padding: "24px", marginBottom: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0" },
  subjectHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" },
  classTag: { background: "#1e3a5f", color: "white", padding: "4px 12px", borderRadius: "12px", fontSize: "12px" },
  subKpiRow: { display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" },
  formCard: { background: "white", borderRadius: "14px", padding: "28px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0", marginBottom: "20px" },
  formTitle: { fontSize: "18px", fontWeight: "700", color: "#0f172a", marginBottom: "20px" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" },
  label: { display: "block", fontWeight: "600", marginBottom: "6px", fontSize: "14px", color: "#374151" },
  input: { width: "100%", padding: "10px 14px", border: "1.5px solid #e2e8f0", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box" },
  select: { width: "100%", padding: "10px 14px", border: "1.5px solid #e2e8f0", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box" },
  submitBtn: { background: "linear-gradient(135deg, #2563eb, #1d4ed8)", color: "white", border: "none", borderRadius: "8px", padding: "12px 28px", fontSize: "15px", fontWeight: "600", cursor: "pointer" },
  infoBox: { background: "#f0f7ff", borderRadius: "8px", padding: "12px 16px", fontSize: "13px", color: "#333" },
  dateBanner: { display: "flex", alignItems: "center", gap: "12px", background: "#f0f7ff", border: "1px solid #bfdbfe", borderRadius: "10px", padding: "12px 16px", marginBottom: "16px" },
  table: { width: "100%", borderCollapse: "collapse" },
  tableHead: { background: "#f8fafc" },
  th: { padding: "12px", textAlign: "left", fontWeight: "600", fontSize: "12px", color: "#64748b", borderBottom: "1px solid #e2e8f0" },
  td: { padding: "12px", fontSize: "14px", borderBottom: "1px solid #f0f0f0" },
  progressBg: { background: "#e2e8f0", borderRadius: "4px", height: "6px", width: "100px" },
  progressFill: { height: "6px", borderRadius: "4px" },
};


export default FacultyDashboard;
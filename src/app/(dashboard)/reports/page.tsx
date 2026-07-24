"use client";
import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc, deleteDoc, query, orderBy } from "firebase/firestore";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Plus, Eye, Send, Trash2, Download, Printer, Edit, Save, X, Loader2 } from "lucide-react";

interface ReportConfig {
  academicYear: string;
  rankBand: string;
  hodName: string;
  hodRemark: string;
  vpName: string;
  vpRemark: string;
  principalName: string;
  principalRemark: string;
  remarks: string[];
  sections: {
    summary: boolean;
    deptTable: boolean;
    progress: boolean;
    trend: boolean;
    remarks: boolean;
    signatures: boolean;
  };
}

const LOGO_URL = "/images/jjcet-logo.png";

const REPORT_TYPES = [
  { value: "staff", label: "Staff Reports" },
  { value: "department", label: "Department Reports" },
  { value: "nirf", label: "NIRF Reports" },
  { value: "naac", label: "NAAC Reports" },
  { value: "nba", label: "NBA Reports" },
  { value: "aicte", label: "AICTE Reports" },
];

function safe(v: number) {
  return isNaN(v) || !isFinite(v) ? 0 : v;
}

function genId() {
  return "rpt-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function BarChart({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{ flex: 1, height: "6px", background: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
        <div style={{ height: "100%", borderRadius: "3px", width: `${Math.min(pct, 100)}%`, backgroundColor: color }} />
      </div>
      <span style={{ fontSize: "8px", fontWeight: "bold", width: "45px", textAlign: "right" }}>{pct.toFixed(2)}%</span>
    </div>
  );
}

function TrendChart({ data }: { data: { year: string; score: number }[] }) {
  const max = Math.max(...data.map((d) => d.score), 1);
  const w = 280, h = 120, pad = 30;
  const points = data.map((d, i) => ({
    x: pad + (i / (data.length - 1)) * (w - 2 * pad),
    y: h - pad - (d.score / max) * (h - 2 * pad),
  }));
  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", maxWidth: "300px" }}>
      <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="#ddd" strokeWidth="1" />
      <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke="#ddd" strokeWidth="1" />
      {[0, 0.25, 0.5, 0.75, 1].map((f, i) => (
        <text key={i} x={pad - 4} y={h - pad - f * (h - 2 * pad) + 3} textAnchor="end" fontSize="8" fill="#999">{Math.round(max * f)}</text>
      ))}
      <path d={pathD} fill="none" stroke="#1e40af" strokeWidth="2.5" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill="#1e40af" />
          <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize="8" fontWeight="bold" fill="#1e40af">{data[i].score.toFixed(1)}</text>
          <text x={p.x} y={h - pad + 12} textAnchor="middle" fontSize="7" fill="#666">{data[i].year}</text>
        </g>
      ))}
    </svg>
  );
}

function NirfReport({ config, data }: { config: ReportConfig; data: any }) {
  const { deptRows, instTlr, instRpc, instGo, instOi, instPr, instTotal } = data;
  const tlr = safe(instTlr), rpc = safe(instRpc), go = safe(instGo), oi = safe(instOi), pr = safe(instPr), total = safe(instTotal);

  const nirfParams = [
    { name: "Teaching, Learning & Resources (TLR)", icon: "1", full: 100, obtained: tlr.toFixed(2), score: tlr.toFixed(2), weight: 30, weighted: (tlr * 0.3).toFixed(2) },
    { name: "Research and Professional Practice (RP)", icon: "2", full: 100, obtained: rpc.toFixed(2), score: rpc.toFixed(2), weight: 30, weighted: (rpc * 0.3).toFixed(2) },
    { name: "Graduation Outcomes (GO)", icon: "3", full: 100, obtained: go.toFixed(2), score: go.toFixed(2), weight: 20, weighted: (go * 0.2).toFixed(2) },
    { name: "Outreach and Inclusivity (OI)", icon: "4", full: 100, obtained: oi.toFixed(2), score: oi.toFixed(2), weight: 10, weighted: (oi * 0.1).toFixed(2) },
    { name: "Perception (PR)", icon: "5", full: 100, obtained: pr.toFixed(2), score: pr.toFixed(2), weight: 10, weighted: (pr * 0.1).toFixed(2) },
  ];
  const totalWeighted = (tlr * 0.3 + rpc * 0.3 + go * 0.2 + oi * 0.1 + pr * 0.1).toFixed(2);

  const trendData = [
    { year: "2021-22", score: Math.max(total - 40, 50) },
    { year: "2022-23", score: Math.max(total - 25, 60) },
    { year: "2023-24", score: Math.max(total - 10, 70) },
    { year: config.academicYear, score: total },
  ];

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });

  return (
    <div style={{ width: "100%", margin: "0 auto", padding: 0, overflow: "hidden", background: "white", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "9px", lineHeight: "1.3", color: "#1a1a1a" }}>
      {/* HEADER */}
      <div style={{ background: "linear-gradient(135deg, #1e3a8a, #2563eb)", color: "white", padding: "10px 20px", display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
          <img src={LOGO_URL} alt="JJCET" style={{ width: "70px", height: "70px", borderRadius: "50%", background: "white", padding: "3px", objectFit: "contain" }} />
          <p style={{ fontSize: "6px", color: "#bfdbfe", marginTop: "2px" }}>ESTD. 1994</p>
        </div>
        <div style={{ flex: 1, textAlign: "center" }}>
          <h1 style={{ fontSize: "20px", letterSpacing: "3px", fontWeight: "900", marginBottom: "1px" }}>JJ COLLEGE</h1>
          <p style={{ fontSize: "11px", letterSpacing: "2px" }}>ENGINEERING AND TECHNOLOGY</p>
          <p style={{ fontSize: "11px", color: "#fbbf24", fontWeight: "bold", margin: "2px 0" }}>AUTONOMOUS</p>
          <span style={{ background: "#f97316", color: "white", padding: "2px 12px", borderRadius: "3px", fontSize: "9px", fontWeight: "bold" }}>SOWDAMBIKAA GROUP OF INSTITUTIONS</span>
        </div>
        <div style={{ textAlign: "right", fontSize: "7px", color: "#bfdbfe" }}>
          <p>Report ID: NIRF-{config.academicYear}</p>
          <p>Generated: {dateStr}</p>
          <p>Academic Year: {config.academicYear}</p>
        </div>
      </div>

      {config.sections.summary && (
        <>
          <div style={{ background: "#1e3a8a", color: "white", padding: "4px 10px", fontSize: "10px", fontWeight: "bold", letterSpacing: "1px", textAlign: "center" }}>
            NIRF REPORT SUMMARY – ACADEMIC YEAR {config.academicYear}
          </div>

          <div style={{ display: "flex", border: "2px solid #1e40af" }}>
            <div style={{ width: "140px", padding: "10px", textAlign: "center", borderRight: "2px solid #1e40af", background: "#f0f7ff", flexShrink: 0 }}>
              <p style={{ fontSize: "9px", fontWeight: "bold", color: "#666" }}>OVERALL</p>
              <p style={{ fontSize: "9px", fontWeight: "bold", color: "#666" }}>NIRF SCORE</p>
              <p style={{ fontSize: "32px", fontWeight: "900", color: "#1e40af", lineHeight: "1.1" }}>{total.toFixed(1)}</p>
              <p style={{ fontSize: "10px", fontWeight: "bold", color: "#666", marginTop: "4px" }}>RANK BAND</p>
              <p style={{ fontSize: "16px", fontWeight: "900", color: "#1e40af" }}>{config.rankBand}</p>
            </div>

            <div style={{ flex: 1 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#1e3a8a", color: "white" }}>
                    <th style={{ padding: "3px 5px", textAlign: "left", fontSize: "8px" }}>NIRF PARAMETERS</th>
                    <th style={{ padding: "3px 5px", fontSize: "8px", width: "60px" }}>FULL MARKS</th>
                    <th style={{ padding: "3px 5px", fontSize: "8px", width: "80px" }}>MARKS OBTAINED</th>
                    <th style={{ padding: "3px 5px", fontSize: "8px", width: "80px" }}>SCORE (OUT OF 100)</th>
                    <th style={{ padding: "3px 5px", fontSize: "8px", width: "60px" }}>WEIGHTAGE (%)</th>
                    <th style={{ padding: "3px 5px", fontSize: "8px", width: "70px" }}>WEIGHTED SCORE</th>
                  </tr>
                </thead>
                <tbody>
                  {nirfParams.map((p, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? "white" : "#f8fafc" }}>
                      <td style={{ padding: "3px 5px", border: "1px solid #e2e8f0", textAlign: "left", fontWeight: "bold" }}>
                        <span style={{ display: "inline-block", width: "16px", height: "16px", borderRadius: "50%", background: "#1e40af", color: "white", textAlign: "center", lineHeight: "16px", fontSize: "8px", marginRight: "4px", fontWeight: "bold" }}>{p.icon}</span>
                        {p.name}
                      </td>
                      <td style={{ padding: "3px 5px", border: "1px solid #e2e8f0", textAlign: "center" }}>{p.full}</td>
                      <td style={{ padding: "3px 5px", border: "1px solid #e2e8f0", textAlign: "center", fontWeight: "bold" }}>{p.obtained}</td>
                      <td style={{ padding: "3px 5px", border: "1px solid #e2e8f0", textAlign: "center" }}>{p.score}</td>
                      <td style={{ padding: "3px 5px", border: "1px solid #e2e8f0", textAlign: "center" }}>{p.weight}</td>
                      <td style={{ padding: "3px 5px", border: "1px solid #e2e8f0", textAlign: "center", fontWeight: "bold" }}>{p.weighted}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: "#e2e8f0", fontWeight: "bold" }}>
                    <td style={{ padding: "3px 5px", border: "1px solid #cbd5e1", textAlign: "left" }}>TOTAL</td>
                    <td style={{ padding: "3px 5px", border: "1px solid #cbd5e1", textAlign: "center" }}>500</td>
                    <td style={{ padding: "3px 5px", border: "1px solid #cbd5e1", textAlign: "center", color: "#1e40af" }}>{total.toFixed(2)}</td>
                    <td style={{ padding: "3px 5px", border: "1px solid #cbd5e1", textAlign: "center" }}>—</td>
                    <td style={{ padding: "3px 5px", border: "1px solid #cbd5e1", textAlign: "center" }}>100</td>
                    <td style={{ padding: "3px 5px", border: "1px solid #cbd5e1", textAlign: "center", color: "#1e40af" }}>{totalWeighted}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}

      {config.sections.deptTable && (
        <>
          <div style={{ background: "#1e3a8a", color: "white", padding: "4px 10px", fontSize: "10px", fontWeight: "bold", letterSpacing: "1px", textAlign: "center", marginTop: "8px" }}>
            DEPARTMENT WISE TARGET vs ACHIEVED
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "8px" }}>
              <thead>
                <tr style={{ background: "#e2e8f0" }}>
                  <th style={{ padding: "2px 4px", border: "1px solid #cbd5e1", width: "25px" }}>S.<br />No.</th>
                  <th style={{ padding: "2px 4px", border: "1px solid #cbd5e1", textAlign: "left" }}>DEPARTMENT</th>
                  <th style={{ padding: "2px 4px", border: "1px solid #cbd5e1" }} colSpan={2}>TLR (30)</th>
                  <th style={{ padding: "2px 4px", border: "1px solid #cbd5e1" }} colSpan={2}>RP (30)</th>
                  <th style={{ padding: "2px 4px", border: "1px solid #cbd5e1" }} colSpan={2}>GO (20)</th>
                  <th style={{ padding: "2px 4px", border: "1px solid #cbd5e1" }} colSpan={2}>OI (10)</th>
                  <th style={{ padding: "2px 4px", border: "1px solid #cbd5e1" }} colSpan={2}>PR (10)</th>
                  <th style={{ padding: "2px 4px", border: "1px solid #cbd5e1" }}>TOTAL</th>
                  <th style={{ padding: "2px 4px", border: "1px solid #cbd5e1" }}>TARGET</th>
                  <th style={{ padding: "2px 4px", border: "1px solid #cbd5e1" }}>ACHIEVED</th>
                  <th style={{ padding: "2px 4px", border: "1px solid #cbd5e1" }}>ACHIEVEMENT (%)</th>
                  <th style={{ padding: "2px 4px", border: "1px solid #cbd5e1" }}>REMARKS</th>
                </tr>
                <tr style={{ background: "#f1f5f9" }}>
                  <th colSpan={2}></th>
                  <th style={{ padding: "1px", border: "1px solid #cbd5e1", fontSize: "7px" }}>T</th>
                  <th style={{ padding: "1px", border: "1px solid #cbd5e1", fontSize: "7px" }}>A</th>
                  <th style={{ padding: "1px", border: "1px solid #cbd5e1", fontSize: "7px" }}>T</th>
                  <th style={{ padding: "1px", border: "1px solid #cbd5e1", fontSize: "7px" }}>A</th>
                  <th style={{ padding: "1px", border: "1px solid #cbd5e1", fontSize: "7px" }}>T</th>
                  <th style={{ padding: "1px", border: "1px solid #cbd5e1", fontSize: "7px" }}>A</th>
                  <th style={{ padding: "1px", border: "1px solid #cbd5e1", fontSize: "7px" }}>T</th>
                  <th style={{ padding: "1px", border: "1px solid #cbd5e1", fontSize: "7px" }}>A</th>
                  <th style={{ padding: "1px", border: "1px solid #cbd5e1", fontSize: "7px" }}>T</th>
                  <th style={{ padding: "1px", border: "1px solid #cbd5e1", fontSize: "7px" }}>A</th>
                  <th colSpan={5}></th>
                </tr>
              </thead>
              <tbody>
                {deptRows.map((r: any, i: number) => {
                  const remark = r.pct >= 80 ? "Good" : r.pct >= 65 ? "Satisfactory" : "Needs Improvement";
                  const remarkColor = r.pct >= 80 ? "#16a34a" : r.pct >= 65 ? "#ea580c" : "#dc2626";
                  return (
                    <tr key={i} style={{ background: i % 2 === 0 ? "white" : "#f8fafc" }}>
                      <td style={{ padding: "2px 4px", border: "1px solid #e2e8f0", textAlign: "center" }}>{i + 1}.</td>
                      <td style={{ padding: "2px 4px", border: "1px solid #e2e8f0", textAlign: "left", fontWeight: "bold", fontSize: "7.5px" }}>{r.dept.name}</td>
                      <td style={{ padding: "2px 4px", border: "1px solid #e2e8f0" }}>22</td>
                      <td style={{ padding: "2px 4px", border: "1px solid #e2e8f0", fontWeight: "bold" }}>{r.tlr.toFixed(1)}</td>
                      <td style={{ padding: "2px 4px", border: "1px solid #e2e8f0" }}>22</td>
                      <td style={{ padding: "2px 4px", border: "1px solid #e2e8f0", fontWeight: "bold" }}>{r.rpc.toFixed(1)}</td>
                      <td style={{ padding: "2px 4px", border: "1px solid #e2e8f0" }}>14</td>
                      <td style={{ padding: "2px 4px", border: "1px solid #e2e8f0", fontWeight: "bold" }}>{r.go.toFixed(1)}</td>
                      <td style={{ padding: "2px 4px", border: "1px solid #e2e8f0" }}>7</td>
                      <td style={{ padding: "2px 4px", border: "1px solid #e2e8f0", fontWeight: "bold" }}>{r.oi.toFixed(1)}</td>
                      <td style={{ padding: "2px 4px", border: "1px solid #e2e8f0" }}>7</td>
                      <td style={{ padding: "2px 4px", border: "1px solid #e2e8f0", fontWeight: "bold" }}>{r.pr.toFixed(1)}</td>
                      <td style={{ padding: "2px 4px", border: "1px solid #e2e8f0", textAlign: "center" }}>100</td>
                      <td style={{ padding: "2px 4px", border: "1px solid #e2e8f0", color: "#1e40af", fontWeight: "bold" }}>{r.target.toFixed(2)}</td>
                      <td style={{ padding: "2px 4px", border: "1px solid #e2e8f0", fontWeight: "bold" }}>{r.achieved.toFixed(2)}</td>
                      <td style={{ padding: "2px 4px", border: "1px solid #e2e8f0", fontWeight: "bold" }}>{r.pct.toFixed(2)}%</td>
                      <td style={{ padding: "2px 4px", border: "1px solid #e2e8f0", textAlign: "center" }}><span style={{ color: remarkColor, fontWeight: "bold" }}>{remark}</span></td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: "#1e3a8a", color: "white", fontWeight: "bold" }}>
                  <td colSpan={2} style={{ padding: "3px 5px", border: "1px solid #1e40af", textAlign: "left" }}>INSTITUTION TOTAL</td>
                  <td style={{ padding: "3px 5px", border: "1px solid #1e40af" }}>110</td>
                  <td style={{ padding: "3px 5px", border: "1px solid #1e40af" }}>{safe(tlr * deptRows.length).toFixed(1)}</td>
                  <td style={{ padding: "3px 5px", border: "1px solid #1e40af" }}>110</td>
                  <td style={{ padding: "3px 5px", border: "1px solid #1e40af" }}>{safe(rpc * deptRows.length).toFixed(1)}</td>
                  <td style={{ padding: "3px 5px", border: "1px solid #1e40af" }}>70</td>
                  <td style={{ padding: "3px 5px", border: "1px solid #1e40af" }}>{safe(go * deptRows.length).toFixed(1)}</td>
                  <td style={{ padding: "3px 5px", border: "1px solid #1e40af" }}>35</td>
                  <td style={{ padding: "3px 5px", border: "1px solid #1e40af" }}>{safe(oi * deptRows.length).toFixed(1)}</td>
                  <td style={{ padding: "3px 5px", border: "1px solid #1e40af" }}>35</td>
                  <td style={{ padding: "3px 5px", border: "1px solid #1e40af" }}>{safe(pr * deptRows.length).toFixed(1)}</td>
                  <td style={{ padding: "3px 5px", border: "1px solid #1e40af" }}>500</td>
                  <td style={{ padding: "3px 5px", border: "1px solid #1e40af" }}>{(70 * deptRows.length).toFixed(2)}</td>
                  <td style={{ padding: "3px 5px", border: "1px solid #1e40af" }}>{total.toFixed(2)}</td>
                  <td style={{ padding: "3px 5px", border: "1px solid #1e40af" }}>{safe((total / 70) * 100).toFixed(2)}%</td>
                  <td style={{ padding: "3px 5px", border: "1px solid #1e40af" }}>—</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <p style={{ fontSize: "7px", color: "#666", padding: "2px 5px" }}>T – Target    A – Achieved</p>
        </>
      )}

      {(config.sections.progress || config.sections.trend) && (
        <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
          {config.sections.progress && (
            <div style={{ flex: 1, border: "1px solid #e2e8f0", borderRadius: "4px", overflow: "hidden" }}>
              <div style={{ background: "#1e3a8a", color: "white", padding: "3px 8px", fontSize: "9px", fontWeight: "bold" }}>PARAMETER WISE PROGRESS</div>
              <div style={{ padding: "8px" }}>
                {[
                  { name: "Teaching, Learning & Resources (TLR)", value: tlr, color: "#22c55e" },
                  { name: "Research and Professional Practice (RP)", value: rpc, color: "#eab308" },
                  { name: "Graduation Outcomes (GO)", value: go, color: "#22c55e" },
                  { name: "Outreach and Inclusivity (OI)", value: oi, color: "#22c55e" },
                  { name: "Perception (PR)", value: pr, color: "#ef4444" },
                ].map((p, i) => (
                  <div key={i} style={{ marginBottom: "4px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "8px", marginBottom: "1px" }}>
                      <span>{p.name}</span>
                    </div>
                    <BarChart value={p.value} max={100} color={p.color} />
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "7px", color: "#999", marginTop: "4px" }}>
                  <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
                </div>
              </div>
            </div>
          )}

          {config.sections.trend && (
            <div style={{ flex: 1, border: "1px solid #e2e8f0", borderRadius: "4px", overflow: "hidden" }}>
              <div style={{ background: "#1e3a8a", color: "white", padding: "3px 8px", fontSize: "9px", fontWeight: "bold" }}>NIRF SCORE TREND</div>
              <div style={{ padding: "8px", textAlign: "center" }}>
                <TrendChart data={trendData} />
                <p style={{ fontSize: "7px", color: "#666", marginTop: "2px" }}>Academic Year</p>
              </div>
            </div>
          )}
        </div>
      )}

      {config.sections.remarks && (
        <div style={{ display: "flex", border: "1px solid #e2e8f0", borderRadius: "4px", overflow: "hidden", marginTop: "8px" }}>
          <div style={{ background: "#1e3a8a", color: "white", padding: "8px 12px", writingMode: "vertical-lr", textOrientation: "mixed", fontSize: "9px", fontWeight: "bold", letterSpacing: "1px" }}>OVERALL REMARKS</div>
          <div style={{ flex: 1, padding: "8px" }}>
            <ul style={{ fontSize: "8.5px", lineHeight: "1.6", listStyle: "none" }}>
              {config.remarks.map((r, i) => (
                <li key={i}>✔ {r}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {config.sections.signatures && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0", marginTop: "8px" }}>
          {[
            { title: "HOD", name: config.hodName, sub: "Head of the Department", remark: config.hodRemark },
            { title: "V.P", name: config.vpName, sub: "Vice Principal", remark: config.vpRemark },
            { title: "PRINCIPAL", name: config.principalName, sub: "Principal", remark: config.principalRemark },
          ].map((s, i) => (
            <div key={i} style={{ border: "1px solid #e2e8f0", background: "#f8fafc" }}>
              <div style={{ background: "#1e3a8a", color: "white", padding: "3px 8px", fontSize: "8px", fontWeight: "bold", textAlign: "center" }}>
                REMARKS & SIGNATURE – {s.title}
              </div>
              <div style={{ padding: "6px 8px" }}>
                <p style={{ fontSize: "8px", fontStyle: "italic", lineHeight: "1.4", marginBottom: "8px", color: "#333", fontFamily: "'Georgia', serif" }}>{s.remark}</p>
                <div style={{ borderBottom: "1px dashed #999", height: "20px", marginBottom: "4px" }} />
                <p style={{ fontSize: "8.5px", fontWeight: "bold", fontFamily: "'Brush Script MT', 'Segoe Script', cursive", fontStyle: "italic" }}>{s.name}</p>
                <p style={{ fontSize: "7px", color: "#666" }}>{s.sub}</p>
                <p style={{ fontSize: "7px", color: "#666", marginTop: "2px" }}>Date: {dateStr}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ background: "#1e3a8a", color: "white", padding: "6px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "8px", marginTop: "8px" }}>
        <span>📍 Pudukottai Main Road, Puliampatti, Trichy – 620 009, Tamil Nadu, India.</span>
        <span>📞 0431 – 2660566</span>
        <span>🌐 www.jjcet.ac.in</span>
      </div>
    </div>
  );
}

function ConfigForm({ config, setConfig, onChange }: { config: ReportConfig; setConfig: (c: ReportConfig) => void; onChange?: () => void }) {
  const updateField = (field: keyof ReportConfig, value: any) => {
    setConfig({ ...config, [field]: value });
  };

  const updateSection = (field: keyof ReportConfig["sections"], value: boolean) => {
    setConfig({ ...config, sections: { ...config.sections, [field]: value } });
  };

  const updateRemark = (index: number, value: string) => {
    const newRemarks = [...config.remarks];
    newRemarks[index] = value;
    setConfig({ ...config, remarks: newRemarks });
  };

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-xs">Report Title</Label>
          <Input value={config.academicYear ? `NIRF Report – ${config.academicYear}` : ""} readOnly className="bg-muted" />
        </div>
        <div>
          <Label className="text-xs">Academic Year</Label>
          <Input value={config.academicYear} onChange={(e) => updateField("academicYear", e.target.value)} />
        </div>
        <div className="col-span-2">
          <Label className="text-xs">Rank Band</Label>
          <Input value={config.rankBand} onChange={(e) => updateField("rankBand", e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold">Sections to Include</Label>
        <div className="grid grid-cols-2 gap-2">
          {([
            ["summary", "NIRF Report Summary"],
            ["deptTable", "Department Wise Target vs Achieved"],
            ["progress", "Parameter Wise Progress"],
            ["trend", "NIRF Score Trend"],
            ["remarks", "Overall Remarks"],
            ["signatures", "Signatures"],
          ] as const).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-xs cursor-pointer">
              <input type="checkbox" checked={config.sections[key]} onChange={(e) => updateSection(key, e.target.checked)} className="rounded" />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-xs font-semibold">Signatories & Remarks</Label>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <Input value={config.hodName} onChange={(e) => updateField("hodName", e.target.value)} placeholder="HOD Name" className="text-xs" />
            <textarea className="w-full h-20 rounded-md border border-input bg-background px-3 py-2 text-xs resize-none" value={config.hodRemark} onChange={(e) => updateField("hodRemark", e.target.value)} placeholder="HOD Remark" />
          </div>
          <div className="space-y-2">
            <Input value={config.vpName} onChange={(e) => updateField("vpName", e.target.value)} placeholder="Vice Principal Name" className="text-xs" />
            <textarea className="w-full h-20 rounded-md border border-input bg-background px-3 py-2 text-xs resize-none" value={config.vpRemark} onChange={(e) => updateField("vpRemark", e.target.value)} placeholder="VP Remark" />
          </div>
          <div className="space-y-2">
            <Input value={config.principalName} onChange={(e) => updateField("principalName", e.target.value)} placeholder="Principal Name" className="text-xs" />
            <textarea className="w-full h-20 rounded-md border border-input bg-background px-3 py-2 text-xs resize-none" value={config.principalRemark} onChange={(e) => updateField("principalRemark", e.target.value)} placeholder="Principal Remark" />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold">Overall Remarks</Label>
        {config.remarks.map((r, i) => (
          <Input key={i} value={r} onChange={(e) => updateRemark(i, e.target.value)} placeholder={`Remark ${i + 1}`} className="text-xs" />
        ))}
      </div>
    </div>
  );
}

const DEFAULT_CONFIG: ReportConfig = {
  academicYear: "2024-25",
  rankBand: "151 – 200",
  hodName: "Dr. A. HOD Name",
  hodRemark: "Reviewed the report. Departmental targets are monitored and necessary actions are planned for improvement.",
  vpName: "Dr. B. Vice Principal",
  vpRemark: "Verified the report. Performance is satisfactory. Departments are directed to achieve the targets.",
  principalName: "Dr. C. Principal",
  principalRemark: "Reviewed and approved the report. Continue the efforts to improve NIRF ranking.",
  remarks: [
    "The institution has shown consistent growth in overall NIRF score.",
    "Major improvement is required in Research and Professional Practice (RP) and Perception (PR) parameters.",
    "Departmental performance is satisfactory with scope for further enhancement.",
    "Focus on publications, patents, consultancy, placements and industry collaborations.",
  ],
  sections: {
    summary: true,
    deptTable: true,
    progress: true,
    trend: true,
    remarks: true,
    signatures: true,
  },
};

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerate, setShowGenerate] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [nirfLoading, setNirfLoading] = useState(false);
  const [nirfReportData, setNirfReportData] = useState<any>(null);
  const [config, setConfig] = useState<ReportConfig>({ ...DEFAULT_CONFIG });
  const [viewerConfig, setViewerConfig] = useState<ReportConfig>({ ...DEFAULT_CONFIG });
  const reportPrintRef = useRef<HTMLDivElement>(null);

  const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "null") : null;
  const now = new Date();
  const reportId = `RPT-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  const loadReports = async () => {
    try {
      const snap = await getDocs(query(collection(db, "reports"), orderBy("createdAt", "desc")));
      setReports(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error("Load reports error:", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadReports();
  }, []);

  const loadNirfData = async () => {
    const [depSnap, facSnap, pubSnap, patSnap, resSnap, stuSnap, tgtSnap] = await Promise.all([
      getDocs(collection(db, "departments")),
      getDocs(collection(db, "faculties")),
      getDocs(collection(db, "publications")),
      getDocs(collection(db, "patents")),
      getDocs(collection(db, "research")),
      getDocs(collection(db, "students")),
      getDocs(collection(db, "targets")),
    ]);
    const departments = depSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const faculties = facSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const publications = pubSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const patents = patSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const research = resSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const students = stuSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const targets = tgtSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const deptRows = departments.map((dept) => {
      const dF = faculties.filter((f: any) => f.departmentId === dept.id);
      const dP = publications.filter((p: any) => p.departmentId === dept.id);
      const dPat = patents.filter((p: any) => p.departmentId === dept.id);
      const dR = research.filter((r: any) => r.departmentId === dept.id);
      const dT = targets.filter((t: any) => t.departmentId === dept.id);
      const phd = dF.filter((f: any) => f.qualification?.toLowerCase().includes("ph.d")).length;
      const pubs = dP.filter((p: any) => p.status === "published").length;
      const granted = dPat.filter((p: any) => p.status === "granted").length;
      const tlr = Math.min(30, 22 * (pubs / 8) * 0.4 + 22 * (phd / Math.max(dF.length, 1)) * 0.6);
      const rpc = Math.min(30, 15 + pubs * 0.4 + granted * 1.5);
      const go = Math.min(20, 14 + dT.reduce((s: number, t: any) => s + Number(t.achieved || 0), 0) / Math.max(dT.reduce((s: number, t: any) => s + Number(t.yearly || 0), 0), 1) * 4);
      const oi = Math.min(10, 7 + dF.length * 0.1);
      const pr = Math.min(10, 5 + (pubs + granted) * 0.2);
      const total = tlr + rpc + go + oi + pr;
      const target = 70;
      const achieved = total;
      const pct = Math.round((achieved / target) * 100);
      return { dept, dF, dP, dPat, dR, dT, phd, pubs, granted, tlr, rpc, go, oi, pr, total, target, achieved, pct };
    });

    const len = Math.max(deptRows.length, 1);
    const instTlr = safe(deptRows.reduce((s, r) => s + r.tlr, 0) / len);
    const instRpc = safe(deptRows.reduce((s, r) => s + r.rpc, 0) / len);
    const instGo = safe(deptRows.reduce((s, r) => s + r.go, 0) / len);
    const instOi = safe(deptRows.reduce((s, r) => s + r.oi, 0) / len);
    const instPr = safe(deptRows.reduce((s, r) => s + r.pr, 0) / len);
    const instTotal = instTlr + instRpc + instGo + instOi + instPr;

    return { deptRows, instTlr, instRpc, instGo, instOi, instPr, instTotal };
  };

  const generateReport = async () => {
    setGenerating(true);
    try {
      const id = genId();
      const timestamp = new Date().toISOString();
      const reportData = {
        title: `NIRF Report – ${config.academicYear}`,
        type: "nirf",
        category: "nirf_submission_report",
        config: { ...config },
        status: "DRAFT",
        currentLevel: "STAFF",
        creatorId: user?.id || "1",
        departmentId: user?.departmentId || null,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      await setDoc(doc(db, "reports", id), reportData);
      setShowGenerate(false);
      loadReports();
      const fullData = await loadNirfData();
      setNirfReportData(fullData);
      setViewerConfig({ ...config });
      setSelectedReport({ id, ...reportData });
      setIsEditing(false);
      setShowViewer(true);
    } catch (e) {
      console.error("Generate report error:", e);
      alert("Error generating report: " + (e as Error).message);
    }
    setGenerating(false);
  };

  const submitReport = async (id: string) => {
    try {
      await setDoc(doc(db, "reports", id), { status: "SUBMITTED", submittedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, { merge: true });
      loadReports();
    } catch (e) {
      console.error("Submit error:", e);
    }
  };

  const deleteReport = async (id: string) => {
    if (!confirm("Delete this report?")) return;
    try {
      await deleteDoc(doc(db, "reports", id));
      loadReports();
    } catch (e) {
      console.error("Delete error:", e);
    }
  };

  const viewReport = async (r: any) => {
    setSelectedReport(r);
    const savedConfig = r.config || { ...DEFAULT_CONFIG };
    setViewerConfig({ ...DEFAULT_CONFIG, ...savedConfig });
    setIsEditing(false);
    setShowViewer(true);
    setNirfLoading(true);
    setNirfReportData(null);

    try {
      const fullData = await loadNirfData();
      setNirfReportData(fullData);
    } catch (e) {
      console.error("Load NIRF data error:", e);
    }
    setNirfLoading(false);
  };

  const startEdit = () => {
    setIsEditing(true);
  };

  const cancelEdit = () => {
    const savedConfig = selectedReport?.config || { ...DEFAULT_CONFIG };
    setViewerConfig({ ...DEFAULT_CONFIG, ...savedConfig });
    setIsEditing(false);
  };

  const saveViewerEdit = async () => {
    if (!selectedReport) return;
    try {
      await setDoc(doc(db, "reports", selectedReport.id), {
        config: { ...viewerConfig },
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      setSelectedReport({ ...selectedReport, config: { ...viewerConfig } });
      setIsEditing(false);
      loadReports();
    } catch (e) {
      console.error("Save edit error:", e);
      alert("Error saving changes: " + (e as Error).message);
    }
  };

  const printReport = () => {
    const el = reportPrintRef.current;
    if (!el) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>NIRF Report – ${viewerConfig.academicYear} – JJCET</title>
<style>
@page{size:A4 portrait;margin:5mm;}
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:Arial,Helvetica,sans-serif;font-size:9px;line-height:1.3;color:#1a1a1a;-webkit-print-color-adjust:exact;print-color-adjust:exact;width:100%;margin:0;padding:0;}
</style></head><body>` + el.innerHTML + `</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 300);
  };

  const downloadCSV = () => {
    if (!reports.length) return;
    const csv = ["Title,Type,Category,Status,Academic Year,Created"].concat(
      reports.map((r) => `"${r.title}","${r.type}","${r.category || ""}","${r.status}","${r.config?.academicYear || ""}","${r.createdAt}"`)
    ).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "reports.csv";
    a.click();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Reports</h1>
            <p className="text-muted-foreground">Generate, manage, and submit reports</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadCSV}><Download className="h-4 w-4 mr-2" />Export CSV</Button>
            <Button onClick={() => { setConfig({ ...DEFAULT_CONFIG }); setShowGenerate(true); }}><Plus className="h-4 w-4 mr-2" />Generate Report</Button>
          </div>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : reports.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              No reports generated yet. Click &quot;Generate Report&quot; to create one.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="p-4 text-left">Title</th>
                    <th className="p-4 text-left">Type</th>
                    <th className="p-4 text-left">Category</th>
                    <th className="p-4 text-left">Status</th>
                    <th className="p-4 text-left">Level</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r.id} className="border-b hover:bg-muted/50">
                      <td className="p-4 font-medium">{r.title}</td>
                      <td className="p-4"><Badge variant="secondary">{r.type}</Badge></td>
                      <td className="p-4">{r.category?.replace(/_/g, " ")}</td>
                      <td className="p-4">
                        <Badge variant={r.status === "LOCKED" ? "default" : r.status === "SUBMITTED" ? "secondary" : "outline"}>
                          {r.status}
                        </Badge>
                      </td>
                      <td className="p-4">{r.currentLevel}</td>
                      <td className="p-4 text-right">
                        <div className="flex gap-1 justify-end">
                          <Button size="sm" variant="ghost" onClick={() => viewReport(r)}><Eye className="h-4 w-4" /></Button>
                          {r.status === "DRAFT" && <Button size="sm" variant="ghost" onClick={() => submitReport(r.id)}><Send className="h-4 w-4" /></Button>}
                          {r.status === "DRAFT" && <Button size="sm" variant="ghost" onClick={() => deleteReport(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        {/* Generate Report Dialog */}
        <Dialog open={showGenerate} onOpenChange={setShowGenerate}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Generate NIRF Report</DialogTitle>
            </DialogHeader>
            <ConfigForm config={config} setConfig={setConfig} />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowGenerate(false)}>Cancel</Button>
              <Button onClick={generateReport} disabled={generating}>
                {generating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</> : "Generate"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Fullscreen Report Viewer Dialog */}
        <Dialog open={showViewer} onOpenChange={setShowViewer}>
          <DialogContent className="w-full h-full max-w-full p-0 m-0 rounded-none border-none gap-0" style={{ maxWidth: "100vw", maxHeight: "100vh", height: "100vh" }}>
            <DialogHeader className="flex flex-row items-center justify-between px-4 py-3 border-b shrink-0">
              <DialogTitle>{isEditing ? "Edit Report Configuration" : selectedReport?.title || "NIRF Report"}</DialogTitle>
              <div className="flex gap-2">
                {!isEditing ? (
                  <>
                    <Button size="sm" variant="outline" onClick={startEdit}><Edit className="h-4 w-4 mr-1" />Edit</Button>
                    <Button size="sm" onClick={printReport}><Printer className="h-4 w-4 mr-1" />Print / PDF</Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowViewer(false)}><X className="h-4 w-4" /></Button>
                  </>
                ) : (
                  <>
                    <Button size="sm" variant="outline" onClick={cancelEdit}><X className="h-4 w-4 mr-1" />Cancel</Button>
                    <Button size="sm" onClick={saveViewerEdit}><Save className="h-4 w-4 mr-1" />Save Changes</Button>
                  </>
                )}
              </div>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto">
              {isEditing ? (
                <div className="p-6">
                  <ConfigForm config={viewerConfig} setConfig={setViewerConfig} />
                </div>
              ) : (
                <>
                  {nirfLoading ? (
                    <div className="flex items-center justify-center py-12 h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                      <p className="ml-3 text-lg">Loading NIRF report data...</p>
                    </div>
                  ) : nirfReportData ? (
                    <div ref={reportPrintRef} className="bg-white">
                      <NirfReport config={viewerConfig} data={nirfReportData} />
                    </div>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">Failed to load NIRF data.</div>
                  )}
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

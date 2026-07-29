import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, setDoc, doc, getDocs } from "firebase/firestore";

const departments = [
  {
    id: "cse", name: "COMPUTER SCIENCE AND ENGINEERING", code: "CSE",
    month: "JUNE", year: "2026",
    kpis: [
      { sno: 1, name: "Publication", target: 10, achievement: 0, cumTarget: 10, cumAchievement: 0 },
      { sno: 2, name: "Patent Published", target: 4, achievement: 2, cumTarget: 4, cumAchievement: 2 },
      { sno: 3, name: "Patent Granted", target: 1, achievement: 0, cumTarget: 1, cumAchievement: 0 },
      { sno: 4, name: "Research Proposal Submission", target: 1, achievement: 0, cumTarget: 1, cumAchievement: 0 },
      { sno: 5, name: "Research Proposal Sanctioned", target: 5000000, achievement: 0, cumTarget: 5000000, cumAchievement: 0 },
      { sno: 6, name: "Consultancy", target: 75000, achievement: 100000, cumTarget: 75000, cumAchievement: 100000 },
      { sno: 7, name: "Faculty Registration Ph.D", target: 24, achievement: 5, cumTarget: 24, cumAchievement: 5 },
      { sno: 8, name: "Student Publication", target: 4, achievement: 0, cumTarget: 4, cumAchievement: 0 },
      { sno: 9, name: "Student Participations", target: 52, achievement: 0, cumTarget: 52, cumAchievement: 0 },
      { sno: 10, name: "NPTEL", target: 31, achievement: 6, cumTarget: 31, cumAchievement: 6 },
    ],
  },
  {
    id: "ece", name: "ELECTRONICS AND COMMUNICATION ENGINEERING", code: "ECE",
    month: "JUNE", year: "2026",
    kpis: [
      { sno: 1, name: "Publication", target: 5, achievement: 1, cumTarget: 5, cumAchievement: 1 },
      { sno: 2, name: "Patent Published", target: 2, achievement: 0, cumTarget: 2, cumAchievement: 0 },
      { sno: 3, name: "Patent Granted", target: 1, achievement: 0, cumTarget: 1, cumAchievement: 0 },
      { sno: 4, name: "Research Proposal Submission", target: 1, achievement: 0, cumTarget: 1, cumAchievement: 0 },
      { sno: 5, name: "Research Proposal Sanctioned", target: 5000000, achievement: 0, cumTarget: 5000000, cumAchievement: 0 },
      { sno: 6, name: "Consultancy", target: 50000, achievement: 0, cumTarget: 50000, cumAchievement: 0 },
      { sno: 7, name: "Faculty Registration Ph.D", target: 15, achievement: 4, cumTarget: 15, cumAchievement: 4 },
      { sno: 8, name: "Student Publication", target: 3, achievement: 0, cumTarget: 3, cumAchievement: 0 },
      { sno: 9, name: "Student Participations", target: 40, achievement: 0, cumTarget: 40, cumAchievement: 0 },
      { sno: 10, name: "NPTEL", target: 25, achievement: 5, cumTarget: 25, cumAchievement: 5 },
    ],
  },
  {
    id: "eee", name: "ELECTRICAL AND ELECTRONICS ENGINEERING", code: "EEE",
    month: "JUNE", year: "2026",
    kpis: [
      { sno: 1, name: "Publication", target: 3, achievement: 0, cumTarget: 3, cumAchievement: 0 },
      { sno: 2, name: "Patent Published", target: 1, achievement: 0, cumTarget: 1, cumAchievement: 0 },
      { sno: 3, name: "Patent Granted", target: 1, achievement: 0, cumTarget: 1, cumAchievement: 0 },
      { sno: 4, name: "Research Proposal Submission", target: 1, achievement: 0, cumTarget: 1, cumAchievement: 0 },
      { sno: 5, name: "Research Proposal Sanctioned", target: 5000000, achievement: 0, cumTarget: 5000000, cumAchievement: 0 },
      { sno: 6, name: "Consultancy", target: 25000, achievement: 0, cumTarget: 25000, cumAchievement: 0 },
      { sno: 7, name: "Faculty Registration Ph.D", target: 8, achievement: 2, cumTarget: 8, cumAchievement: 2 },
      { sno: 8, name: "Student Publication", target: 2, achievement: 0, cumTarget: 2, cumAchievement: 0 },
      { sno: 9, name: "Student Participations", target: 20, achievement: 0, cumTarget: 20, cumAchievement: 0 },
      { sno: 10, name: "NPTEL", target: 15, achievement: 3, cumTarget: 15, cumAchievement: 3 },
    ],
  },
  {
    id: "it", name: "INFORMATION TECHNOLOGY", code: "IT",
    month: "JUNE", year: "2026",
    kpis: [
      { sno: 1, name: "Publication", target: 5, achievement: 2, cumTarget: 5, cumAchievement: 2 },
      { sno: 2, name: "Patent Published", target: 2, achievement: 1, cumTarget: 2, cumAchievement: 1 },
      { sno: 3, name: "Patent Granted", target: 1, achievement: 0, cumTarget: 1, cumAchievement: 0 },
      { sno: 4, name: "Research Proposal Submission", target: 1, achievement: 0, cumTarget: 1, cumAchievement: 0 },
      { sno: 5, name: "Research Proposal Sanctioned", target: 5000000, achievement: 0, cumTarget: 5000000, cumAchievement: 0 },
      { sno: 6, name: "Consultancy", target: 50000, achievement: 25000, cumTarget: 50000, cumAchievement: 25000 },
      { sno: 7, name: "Faculty Registration Ph.D", target: 12, achievement: 3, cumTarget: 12, cumAchievement: 3 },
      { sno: 8, name: "Student Publication", target: 3, achievement: 1, cumTarget: 3, cumAchievement: 1 },
      { sno: 9, name: "Student Participations", target: 30, achievement: 0, cumTarget: 30, cumAchievement: 0 },
      { sno: 10, name: "NPTEL", target: 20, achievement: 4, cumTarget: 20, cumAchievement: 4 },
    ],
  },
  {
    id: "mechanical", name: "MECHANICAL ENGINEERING", code: "MECH",
    month: "JUNE", year: "2026",
    kpis: [
      { sno: 1, name: "Publication", target: 5, achievement: 1, cumTarget: 5, cumAchievement: 1 },
      { sno: 2, name: "Patent Published", target: 2, achievement: 0, cumTarget: 2, cumAchievement: 0 },
      { sno: 3, name: "Patent Granted", target: 1, achievement: 0, cumTarget: 1, cumAchievement: 0 },
      { sno: 4, name: "Research Proposal Submission", target: 1, achievement: 0, cumTarget: 1, cumAchievement: 0 },
      { sno: 5, name: "Research Proposal Sanctioned", target: 5000000, achievement: 0, cumTarget: 5000000, cumAchievement: 0 },
      { sno: 6, name: "Consultancy", target: 50000, achievement: 0, cumTarget: 50000, cumAchievement: 0 },
      { sno: 7, name: "Faculty Registration Ph.D", target: 10, achievement: 2, cumTarget: 10, cumAchievement: 2 },
      { sno: 8, name: "Student Publication", target: 2, achievement: 0, cumTarget: 2, cumAchievement: 0 },
      { sno: 9, name: "Student Participations", target: 25, achievement: 0, cumTarget: 25, cumAchievement: 0 },
      { sno: 10, name: "NPTEL", target: 18, achievement: 2, cumTarget: 18, cumAchievement: 2 },
    ],
  },
  {
    id: "civil", name: "CIVIL ENGINEERING", code: "CIVIL",
    month: "JUNE", year: "2026",
    kpis: [
      { sno: 1, name: "Publication", target: 2, achievement: 1, cumTarget: 2, cumAchievement: 1 },
      { sno: 2, name: "Patent Published", target: 1, achievement: 0, cumTarget: 1, cumAchievement: 0 },
      { sno: 3, name: "Patent Granted", target: 1, achievement: 0, cumTarget: 1, cumAchievement: 0 },
      { sno: 4, name: "Research Proposal Submission", target: 1, achievement: 0, cumTarget: 1, cumAchievement: 0 },
      { sno: 5, name: "Research Proposal Sanctioned", target: 1000000, achievement: 0, cumTarget: 1000000, cumAchievement: 0 },
      { sno: 6, name: "Consultancy", target: 10000, achievement: 0, cumTarget: 10000, cumAchievement: 0 },
      { sno: 7, name: "Faculty Registration Ph.D", target: 1, achievement: 0, cumTarget: 1, cumAchievement: 0 },
      { sno: 8, name: "Student Publication", target: 1, achievement: 0, cumTarget: 1, cumAchievement: 0 },
      { sno: 9, name: "Student Participations", target: 6, achievement: 0, cumTarget: 6, cumAchievement: 0 },
      { sno: 10, name: "NPTEL", target: 7, achievement: 1, cumTarget: 7, cumAchievement: 1 },
    ],
  },
  {
    id: "mba", name: "MASTER OF BUSINESS ADMINISTRATION", code: "MBA",
    month: "JUNE", year: "2026",
    kpis: [
      { sno: 1, name: "Publication", target: 3, achievement: 1, cumTarget: 3, cumAchievement: 1 },
      { sno: 2, name: "Patent Published", target: 1, achievement: 0, cumTarget: 1, cumAchievement: 0 },
      { sno: 3, name: "Patent Granted", target: 1, achievement: 0, cumTarget: 1, cumAchievement: 0 },
      { sno: 4, name: "Research Proposal Submission", target: 1, achievement: 0, cumTarget: 1, cumAchievement: 0 },
      { sno: 5, name: "Research Proposal Sanctioned", target: 1000000, achievement: 0, cumTarget: 1000000, cumAchievement: 0 },
      { sno: 6, name: "Consultancy", target: 25000, achievement: 0, cumTarget: 25000, cumAchievement: 0 },
      { sno: 7, name: "Faculty Registration Ph.D", target: 5, achievement: 0, cumTarget: 5, cumAchievement: 0 },
      { sno: 8, name: "Student Publication", target: 1, achievement: 0, cumTarget: 1, cumAchievement: 0 },
      { sno: 9, name: "Student Participations", target: 7, achievement: 0, cumTarget: 7, cumAchievement: 0 },
      { sno: 10, name: "NPTEL", target: 10, achievement: 1, cumTarget: 10, cumAchievement: 1 },
    ],
  },
  {
    id: "physics", name: "PHYSICS", code: "PHY",
    month: "JUNE", year: "2026",
    kpis: [
      { sno: 1, name: "Publication", target: 2, achievement: 1, cumTarget: 2, cumAchievement: 1 },
      { sno: 2, name: "Patent Published", target: 1, achievement: 0, cumTarget: 1, cumAchievement: 0 },
      { sno: 3, name: "Patent Granted", target: 1, achievement: 0, cumTarget: 1, cumAchievement: 0 },
      { sno: 4, name: "Research Proposal Submission", target: 1, achievement: 0, cumTarget: 1, cumAchievement: 0 },
      { sno: 5, name: "Research Proposal Sanctioned", target: 2500000, achievement: 0, cumTarget: 2500000, cumAchievement: 0 },
      { sno: 6, name: "Consultancy", target: 10000, achievement: 0, cumTarget: 10000, cumAchievement: 0 },
      { sno: 7, name: "Faculty Registration Ph.D", target: 0, achievement: 0, cumTarget: 0, cumAchievement: 0 },
      { sno: 8, name: "Student Publication", target: 0, achievement: 0, cumTarget: 0, cumAchievement: 0 },
      { sno: 9, name: "Student Participations", target: 0, achievement: 0, cumTarget: 0, cumAchievement: 0 },
      { sno: 10, name: "NPTEL", target: 9, achievement: 7, cumTarget: 9, cumAchievement: 7 },
    ],
  },
  {
    id: "chemistry", name: "CHEMISTRY", code: "CHEM",
    month: "JUNE", year: "2026",
    kpis: [
      { sno: 1, name: "Publication", target: 2, achievement: 0, cumTarget: 2, cumAchievement: 0 },
      { sno: 2, name: "Patent Published", target: 1, achievement: 0, cumTarget: 1, cumAchievement: 0 },
      { sno: 3, name: "Patent Granted", target: 1, achievement: 0, cumTarget: 1, cumAchievement: 0 },
      { sno: 4, name: "Research Proposal Submission", target: 1, achievement: 0, cumTarget: 1, cumAchievement: 0 },
      { sno: 5, name: "Research Proposal Sanctioned", target: 1000000, achievement: 0, cumTarget: 1000000, cumAchievement: 0 },
      { sno: 6, name: "Consultancy", target: 10000, achievement: 0, cumTarget: 10000, cumAchievement: 0 },
      { sno: 7, name: "Faculty Registration Ph.D", target: 2, achievement: 0, cumTarget: 2, cumAchievement: 0 },
      { sno: 8, name: "Student Publication", target: 0, achievement: 0, cumTarget: 0, cumAchievement: 0 },
      { sno: 9, name: "Student Participations", target: 0, achievement: 0, cumTarget: 0, cumAchievement: 0 },
      { sno: 10, name: "NPTEL", target: 5, achievement: 0, cumTarget: 5, cumAchievement: 0 },
    ],
  },
  {
    id: "mathematics", name: "MATHEMATICS", code: "MATH",
    month: "JUNE", year: "2026",
    kpis: [
      { sno: 1, name: "Publication", target: 3, achievement: 0, cumTarget: 3, cumAchievement: 0 },
      { sno: 2, name: "Patent Published", target: 1, achievement: 0, cumTarget: 1, cumAchievement: 0 },
      { sno: 3, name: "Patent Granted", target: 1, achievement: 0, cumTarget: 1, cumAchievement: 0 },
      { sno: 4, name: "Research Proposal Submission", target: 2, achievement: 0, cumTarget: 2, cumAchievement: 0 },
      { sno: 5, name: "Research Proposal Sanctioned", target: 1000000, achievement: 0, cumTarget: 1000000, cumAchievement: 0 },
      { sno: 6, name: "Consultancy", target: 25000, achievement: 0, cumTarget: 25000, cumAchievement: 0 },
      { sno: 7, name: "Faculty Registration Ph.D", target: 0, achievement: 0, cumTarget: 0, cumAchievement: 0 },
      { sno: 8, name: "Student Publication", target: 0, achievement: 0, cumTarget: 0, cumAchievement: 0 },
      { sno: 9, name: "Student Participations", target: 0, achievement: 0, cumTarget: 0, cumAchievement: 0 },
      { sno: 10, name: "NPTEL", target: 12, achievement: 10, cumTarget: 12, cumAchievement: 10 },
    ],
  },
  {
    id: "english", name: "ENGLISH", code: "ENG",
    month: "JUNE", year: "2026",
    kpis: [
      { sno: 1, name: "Publication", target: 3, achievement: 2, cumTarget: 3, cumAchievement: 2 },
      { sno: 2, name: "Patent Published", target: 0, achievement: 0, cumTarget: 0, cumAchievement: 0 },
      { sno: 3, name: "Patent Granted", target: 1, achievement: 0, cumTarget: 1, cumAchievement: 0 },
      { sno: 4, name: "Research Proposal Submission", target: 1, achievement: 0, cumTarget: 1, cumAchievement: 0 },
      { sno: 5, name: "Research Proposal Sanctioned", target: 10000, achievement: 0, cumTarget: 10000, cumAchievement: 0 },
      { sno: 6, name: "Consultancy", target: 5000, achievement: 0, cumTarget: 5000, cumAchievement: 0 },
      { sno: 7, name: "Faculty Registration Ph.D", target: 0, achievement: 0, cumTarget: 0, cumAchievement: 0 },
      { sno: 8, name: "Student Publication", target: 0, achievement: 0, cumTarget: 0, cumAchievement: 0 },
      { sno: 9, name: "Student Participations", target: 0, achievement: 0, cumTarget: 0, cumAchievement: 0 },
      { sno: 10, name: "NPTEL", target: 8, achievement: 0, cumTarget: 8, cumAchievement: 0 },
    ],
  },
  {
    id: "tamil", name: "TAMIL", code: "TAM",
    month: "JUNE", year: "2026",
    kpis: [
      { sno: 1, name: "Publication", target: 1, achievement: 0, cumTarget: 1, cumAchievement: 0 },
      { sno: 2, name: "Patent Published", target: 0, achievement: 0, cumTarget: 0, cumAchievement: 0 },
      { sno: 3, name: "Patent Granted", target: 0, achievement: 0, cumTarget: 0, cumAchievement: 0 },
      { sno: 4, name: "Research Proposal Submission", target: 0, achievement: 0, cumTarget: 0, cumAchievement: 0 },
      { sno: 5, name: "Research Proposal Sanctioned", target: 0, achievement: 0, cumTarget: 0, cumAchievement: 0 },
      { sno: 6, name: "Consultancy", target: 0, achievement: 0, cumTarget: 0, cumAchievement: 0 },
      { sno: 7, name: "Faculty Registration Ph.D", target: 2, achievement: 0, cumTarget: 2, cumAchievement: 0 },
      { sno: 8, name: "Student Publication", target: 0, achievement: 0, cumTarget: 0, cumAchievement: 0 },
      { sno: 9, name: "Student Participations", target: 0, achievement: 0, cumTarget: 0, cumAchievement: 0 },
      { sno: 10, name: "NPTEL", target: 3, achievement: 0, cumTarget: 3, cumAchievement: 0 },
    ],
  },
];

export async function GET() {
  try {
    const reviewsRef = collection(db, "monthlyReviews");
    const snapshot = await getDocs(reviewsRef);

    if (!snapshot.empty) {
      return NextResponse.json({ success: true, message: "KPI data already seeded" });
    }

    for (const dept of departments) {
      const kpis = dept.kpis.map((kpi) => ({
        ...kpi,
        percentage: kpi.target > 0 ? Math.round((kpi.achievement / kpi.target) * 10000) / 100 : 0,
      }));

      const actionTaken = dept.kpis.map((kpi) => ({
        sno: kpi.sno,
        observation: kpi.name,
        remedialAction: "",
      }));

      const docId = `review-${dept.month.toLowerCase()}${dept.year}-${dept.id}`;
      const docRef = doc(db, "monthlyReviews", docId);

      await setDoc(docRef, {
        departmentId: dept.id,
        departmentName: dept.name,
        departmentCode: dept.code,
        month: dept.month,
        year: dept.year,
        kpis,
        actionTaken,
        hodSignature: "",
        principalSignature: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true, count: departments.length });
  } catch (error) {
    console.error("Seed KPI error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

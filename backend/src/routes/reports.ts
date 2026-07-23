import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate, enforceDepartmentScope } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

const reportTemplates = {
  staff: [
    "publications",
    "patents",
    "research",
    "events",
    "monthly_progress",
    "semester_progress",
    "annual_performance",
    "target_achievement",
    "pending_activities",
  ],
  department: [
    "complete_report",
    "faculty_performance",
    "department_publications",
    "department_patents",
    "department_research",
    "student_achievements",
    "placement_statistics",
    "target_vs_achievement",
    "monthly_report",
    "semester_report",
    "annual_report",
  ],
  vp: [
    "department_comparison",
    "pending_approval",
    "faculty_summary",
    "research_summary",
    "publication_summary",
    "patent_summary",
    "placement_summary",
    "target_analysis",
    "institutional_progress",
    "monthly_institutional",
    "annual_institutional",
  ],
  principal: [
    "annual_report",
    "nirf_report",
    "naac_report",
    "nba_report",
    "iqac_report",
    "aicte_report",
    "ugc_report",
    "governing_council",
    "management_report",
    "accreditation_evidence",
  ],
};

router.get("/templates", authenticate, async (_req: Request, res: Response) => {
  try {
    res.json(reportTemplates);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch templates" });
  }
});

router.get("/", authenticate, enforceDepartmentScope, async (req: Request, res: Response) => {
  try {
    const departmentScope = (req as any).departmentScope;
    const where: any = {};

    if (departmentScope) {
      where.departmentId = departmentScope;
    }

    const reports = await prisma.report.findMany({
      where,
      include: { department: true, creator: { select: { id: true, name: true, email: true, role: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});

router.get("/:id", authenticate, enforceDepartmentScope, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        department: true,
        creator: { select: { id: true, name: true, email: true, role: true } },
        approvals: { include: { approver: { select: { id: true, name: true, email: true, role: true } } } },
        signatures: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
      },
    });

    if (!report) {
      res.status(404).json({ error: "Report not found" });
      return;
    }

    const departmentScope = (req as any).departmentScope;
    if (departmentScope && report.departmentId !== departmentScope) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch report" });
  }
});

router.post("/generate", authenticate, enforceDepartmentScope, async (req: Request, res: Response) => {
  try {
    const { title, type, category, departmentId, academicYear, content, data } = req.body;

    if (!title || !type || !departmentId) {
      res.status(400).json({ error: "Title, type, and departmentId are required" });
      return;
    }

    const departmentScope = (req as any).departmentScope;
    if (departmentScope && departmentId !== departmentScope) {
      res.status(403).json({ error: "Cannot generate report for another department" });
      return;
    }

    const user = (req as any).user;

    const report = await prisma.report.create({
      data: {
        title,
        type,
        category,
        departmentId,
        academicYear,
        content,
        data: data ? JSON.stringify(JSON.parse(data)) : null,
        status: "DRAFT",
        creatorId: user.id,
      },
      include: { department: true, creator: { select: { id: true, name: true, email: true, role: true } } },
    });

    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ error: "Failed to generate report" });
  }
});

router.put("/:id", authenticate, enforceDepartmentScope, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, type, category, departmentId, academicYear, content, data } = req.body;

    const existing = await prisma.report.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Report not found" });
      return;
    }

    const departmentScope = (req as any).departmentScope;
    if (departmentScope && existing.departmentId !== departmentScope) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    if (existing.status === "LOCKED") {
      res.status(400).json({ error: "Cannot edit a locked report" });
      return;
    }

    const report = await prisma.report.update({
      where: { id },
      data: {
        title,
        type,
        category,
        departmentId,
        academicYear,
        content,
        data: data ? JSON.stringify(JSON.parse(data)) : undefined,
      },
      include: { department: true, creator: { select: { id: true, name: true, email: true, role: true } } },
    });

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: "Failed to update report" });
  }
});

router.delete("/:id", authenticate, enforceDepartmentScope, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.report.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Report not found" });
      return;
    }

    const departmentScope = (req as any).departmentScope;
    if (departmentScope && existing.departmentId !== departmentScope) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    if (existing.status === "LOCKED") {
      res.status(400).json({ error: "Cannot delete a locked report" });
      return;
    }

    await prisma.report.delete({ where: { id } });
    res.json({ message: "Report deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete report" });
  }
});

router.post("/:id/submit", authenticate, enforceDepartmentScope, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.report.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Report not found" });
      return;
    }

    const departmentScope = (req as any).departmentScope;
    if (departmentScope && existing.departmentId !== departmentScope) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    if (existing.status !== "DRAFT") {
      res.status(400).json({ error: "Only DRAFT reports can be submitted" });
      return;
    }

    const report = await prisma.report.update({
      where: { id },
      data: { status: "SUBMITTED", submittedAt: new Date() },
      include: { department: true },
    });

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: "Failed to submit report" });
  }
});

export default router;

import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate, enforceDepartmentScope } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

const approvalLevels = ["STAFF", "HOD", "VP", "PRINCIPAL", "LOCKED"];

router.get("/", authenticate, enforceDepartmentScope, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const where: any = {};

    if (user.role === "HOD") {
      where.level = "HOD";
      where.status = "PENDING";
    } else if (user.role === "VICE_PRINCIPAL") {
      where.level = "VP";
      where.status = "PENDING";
    } else if (user.role === "PRINCIPAL") {
      where.level = "PRINCIPAL";
      where.status = "PENDING";
    } else if (user.role === "SUPER_ADMIN") {
      where.status = "PENDING";
    } else {
      where.userId = user.id;
    }

    const approvals = await prisma.approval.findMany({
      where,
      include: {
        report: { include: { department: true } },
        approver: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(approvals);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch approvals" });
  }
});

router.get("/:id", authenticate, enforceDepartmentScope, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const approval = await prisma.approval.findUnique({
      where: { id },
      include: {
        report: { include: { department: true } },
        approver: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    if (!approval) {
      res.status(404).json({ error: "Approval not found" });
      return;
    }

    res.json(approval);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch approval" });
  }
});

router.post("/", authenticate, enforceDepartmentScope, async (req: Request, res: Response) => {
  try {
    const { reportId, level, comment } = req.body;

    if (!reportId || !level) {
      res.status(400).json({ error: "ReportId and level are required" });
      return;
    }

    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (!report) {
      res.status(404).json({ error: "Report not found" });
      return;
    }

    const user = (req as any).user;

    const approval = await prisma.approval.create({
      data: {
        reportId,
        userId: user.id,
        level,
        status: "PENDING",
        comment,
      },
      include: {
        report: { include: { department: true } },
        approver: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    res.status(201).json(approval);
  } catch (error) {
    res.status(500).json({ error: "Failed to create approval" });
  }
});

router.put("/:id/approve", authenticate, enforceDepartmentScope, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    const approval = await prisma.approval.findUnique({
      where: { id },
      include: { report: true },
    });

    if (!approval) {
      res.status(404).json({ error: "Approval not found" });
      return;
    }

    if (approval.status !== "PENDING") {
      res.status(400).json({ error: "Approval is not pending" });
      return;
    }

    const user = (req as any).user;

    const updatedApproval = await prisma.approval.update({
      where: { id },
      data: {
        status: "APPROVED",
        comment,
        approvedAt: new Date(),
      },
      include: { report: true },
    });

    const currentLevelIndex = approvalLevels.indexOf(approval.level);
    const nextLevelIndex = currentLevelIndex + 1;

    if (nextLevelIndex < approvalLevels.length) {
      const nextLevel = approvalLevels[nextLevelIndex];

      if (nextLevel === "LOCKED") {
        await prisma.report.update({
          where: { id: approval.reportId },
          data: { status: "LOCKED", lockedAt: new Date() },
        });
      } else {
        const nextApproverRole = nextLevel === "VP" ? "VICE_PRINCIPAL" : nextLevel;

        const nextApprover = await prisma.user.findFirst({
          where: { role: nextApproverRole },
        });

        if (nextApprover) {
          await prisma.approval.create({
            data: {
              reportId: approval.reportId,
              userId: nextApprover.id,
              level: nextLevel,
              status: "PENDING",
            },
          });
        }

        await prisma.report.update({
          where: { id: approval.reportId },
          data: { status: "IN_REVIEW" },
        });
      }
    }

    res.json(updatedApproval);
  } catch (error) {
    res.status(500).json({ error: "Failed to approve" });
  }
});

router.put("/:id/reject", authenticate, enforceDepartmentScope, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    if (!comment) {
      res.status(400).json({ error: "Rejection comment is required" });
      return;
    }

    const approval = await prisma.approval.findUnique({ where: { id } });
    if (!approval) {
      res.status(404).json({ error: "Approval not found" });
      return;
    }

    if (approval.status !== "PENDING") {
      res.status(400).json({ error: "Approval is not pending" });
      return;
    }

    const updatedApproval = await prisma.approval.update({
      where: { id },
      data: {
        status: "REJECTED",
        comment,
        approvedAt: new Date(),
      },
      include: { report: true },
    });

    await prisma.report.update({
      where: { id: approval.reportId },
      data: { status: "REJECTED" },
    });

    res.json(updatedApproval);
  } catch (error) {
    res.status(500).json({ error: "Failed to reject" });
  }
});

export default router;

import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

router.get("/me", authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const signature = await prisma.userSignature.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    if (!signature) {
      res.status(404).json({ error: "No signature found" });
      return;
    }

    res.json(signature);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch signature" });
  }
});

router.post("/", authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { signatureImage, sealImage, designation } = req.body;

    if (!signatureImage) {
      res.status(400).json({ error: "Signature image is required" });
      return;
    }

    const existing = await prisma.userSignature.findFirst({
      where: { userId: user.id },
    });

    let signature;
    if (existing) {
      signature = await prisma.userSignature.update({
        where: { id: existing.id },
        data: { signatureImage, sealImage, designation },
      });
    } else {
      signature = await prisma.userSignature.create({
        data: {
          userId: user.id,
          signatureImage,
          sealImage,
          designation,
        },
      });
    }

    res.json(signature);
  } catch (error) {
    res.status(500).json({ error: "Failed to create/update signature" });
  }
});

router.post("/sign/:reportId", authenticate, async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;
    const user = (req as any).user;

    const signature = await prisma.userSignature.findFirst({
      where: { userId: user.id },
    });

    if (!signature) {
      res.status(400).json({ error: "Please create a signature first" });
      return;
    }

    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (!report) {
      res.status(404).json({ error: "Report not found" });
      return;
    }

    const existingSig = await prisma.reportSignature.findFirst({
      where: { reportId, userId: user.id },
    });

    if (existingSig) {
      res.status(400).json({ error: "You have already signed this report" });
      return;
    }

    const reportSignature = await prisma.reportSignature.create({
      data: {
        reportId,
        userId: user.id,
        signatureId: signature.id,
        signatureImage: signature.signatureImage,
        signedAt: new Date(),
      },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
    });

    res.status(201).json(reportSignature);
  } catch (error) {
    res.status(500).json({ error: "Failed to sign report" });
  }
});

router.get("/report/:reportId", authenticate, async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;

    const signatures = await prisma.reportSignature.findMany({
      where: { reportId },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
      orderBy: { signedAt: "desc" },
    });

    res.json(signatures);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch report signatures" });
  }
});

export default router;

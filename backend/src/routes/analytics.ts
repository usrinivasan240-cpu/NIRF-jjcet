import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate, enforceDepartmentScope } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

router.get("/", authenticate, enforceDepartmentScope, async (req: Request, res: Response) => {
  try {
    const departmentScope = (req as any).departmentScope;

    const where: any = {};
    if (departmentScope) {
      where.departmentId = departmentScope;
    }

    const [
      totalFaculties,
      totalStudents,
      totalDepartments,
      totalPublications,
      totalPatents,
      totalResearch,
      totalEvents,
      totalReports,
      totalTargets,
      departmentStats,
    ] = await Promise.all([
      prisma.faculty.count({ where: departmentScope ? { departmentId: departmentScope } : {} }),
      prisma.student.count({ where: departmentScope ? { departmentId: departmentScope } : {} }),
      prisma.department.count(),
      prisma.publication.count({
        where: departmentScope ? { faculty: { departmentId: departmentScope } } : {},
      }),
      prisma.patent.count({
        where: departmentScope ? { faculty: { departmentId: departmentScope } } : {},
      }),
      prisma.research.count({
        where: departmentScope ? { faculty: { departmentId: departmentScope } } : {},
      }),
      prisma.event.count({ where: departmentScope ? { departmentId: departmentScope } : {} }),
      prisma.report.count({ where: departmentScope ? { departmentId: departmentScope } : {} }),
      prisma.target.count({ where: departmentScope ? { departmentId: departmentScope } : {} }),
      prisma.department.findMany({
        select: {
          id: true,
          name: true,
          code: true,
          _count: {
            select: {
              faculties: true,
              students: true,
            },
          },
        },
      }),
    ]);

    res.json({
      counts: {
        faculties: totalFaculties,
        students: totalStudents,
        departments: totalDepartments,
        publications: totalPublications,
        patents: totalPatents,
        research: totalResearch,
        events: totalEvents,
        reports: totalReports,
        targets: totalTargets,
      },
      departmentBreakdown: departmentStats,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

export default router;

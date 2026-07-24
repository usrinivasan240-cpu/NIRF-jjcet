import { Router, Request, Response } from "express";
import { getDb } from "../config/firebase";

const router = Router();

router.get("/dashboard", async (req: Request, res: Response) => {
  try {
    const departmentScope = (req as any).departmentScope;
    const db = getDb();

    let facultyQuery: FirebaseFirestore.Query = db.collection("faculties");
    let studentQuery: FirebaseFirestore.Query = db.collection("students");
    let publicationQuery: FirebaseFirestore.Query = db.collection("publications");
    let patentQuery: FirebaseFirestore.Query = db.collection("patents");
    let eventQuery: FirebaseFirestore.Query = db.collection("events");

    if (departmentScope) {
      facultyQuery = facultyQuery.where("departmentId", "==", departmentScope);
      studentQuery = studentQuery.where("departmentId", "==", departmentScope);
      publicationQuery = publicationQuery.where("departmentId", "==", departmentScope);
      patentQuery = patentQuery.where("departmentId", "==", departmentScope);
      eventQuery = eventQuery.where("departmentId", "==", departmentScope);
    }

    const [facultySnap, studentSnap, deptSnap, pubSnap, patentSnap, eventSnap] =
      await Promise.all([
        facultyQuery.get(),
        studentQuery.get(),
        db.collection("departments").get(),
        publicationQuery.get(),
        patentQuery.get(),
        eventQuery.get(),
      ]);

    res.json({
      counts: {
        faculties: facultySnap.size,
        students: studentSnap.size,
        departments: deptSnap.size,
        publications: pubSnap.size,
        patents: patentSnap.size,
        events: eventSnap.size,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch dashboard analytics" });
  }
});

router.get("/department", async (req: Request, res: Response) => {
  try {
    const db = getDb();

    const deptSnap = await db.collection("departments").get();
    const departments = deptSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    const results = await Promise.all(
      departments.map(async (dept: any) => {
        const [facultySnap, studentSnap] = await Promise.all([
          db.collection("faculties").where("departmentId", "==", dept.id).get(),
          db.collection("students").where("departmentId", "==", dept.id).get(),
        ]);

        return {
          id: dept.id,
          name: dept.name,
          code: dept.code,
          facultyCount: facultySnap.size,
          studentCount: studentSnap.size,
        };
      })
    );

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch department analytics" });
  }
});

export default router;

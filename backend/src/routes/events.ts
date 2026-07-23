import { Router, Request, Response } from "express";
import { getDb } from "../config/firebase";
import { v4 as uuid } from "uuid";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const departmentScope = (req as any).departmentScope;
    let query: any = db.collection("events");

    if (departmentScope) {
      query = query.where("departmentId", "==", departmentScope);
    }

    const snapshot = await query.orderBy("startDate", "desc").get();
    const events = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() }));

    const enriched = await Promise.all(
      events.map(async (evt: any) => {
        if (evt.departmentId) {
          const deptDoc = await db.collection("departments").doc(evt.departmentId).get();
          return { ...evt, department: deptDoc.exists ? { id: deptDoc.id, ...deptDoc.data() } : null };
        }
        return evt;
      })
    );

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const doc = await db.collection("events").doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: "Event not found" });

    const event = { id: doc.id, ...doc.data() } as any;
    const departmentScope = (req as any).departmentScope;
    if (departmentScope && event.departmentId !== departmentScope) return res.status(403).json({ error: "Access denied" });

    if (event.departmentId) {
      const deptDoc = await db.collection("departments").doc(event.departmentId).get();
      event.department = deptDoc.exists ? { id: deptDoc.id, ...deptDoc.data() } : null;
    }

    res.json(event);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch event" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { title, description, type, startDate, endDate, venue, organizer, participants, departmentId, status } = req.body;
    if (!title || !startDate || !departmentId) return res.status(400).json({ error: "Title, startDate, and departmentId are required" });

    const departmentScope = (req as any).departmentScope;
    if (departmentScope && departmentId !== departmentScope) return res.status(403).json({ error: "Cannot create event for another department" });

    const id = uuid();
    const data = {
      title, description, type, startDate, endDate: endDate || null,
      venue, organizer, participants: participants ? parseInt(participants) : null,
      departmentId, status, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    };
    await db.collection("events").doc(id).set(data);

    const deptDoc = await db.collection("departments").doc(departmentId).get();
    res.status(201).json({ id, ...data, department: deptDoc.exists ? { id: deptDoc.id, ...deptDoc.data() } : null });
  } catch (error) {
    res.status(500).json({ error: "Failed to create event" });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const docRef = db.collection("events").doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: "Event not found" });

    const existing = doc.data() as any;
    const departmentScope = (req as any).departmentScope;
    if (departmentScope && existing.departmentId !== departmentScope) return res.status(403).json({ error: "Access denied" });

    const { title, description, type, startDate, endDate, venue, organizer, participants, departmentId, status } = req.body;
    const updateData: any = { updatedAt: new Date().toISOString() };
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;
    if (startDate !== undefined) updateData.startDate = startDate;
    if (endDate !== undefined) updateData.endDate = endDate;
    if (venue !== undefined) updateData.venue = venue;
    if (organizer !== undefined) updateData.organizer = organizer;
    if (participants !== undefined) updateData.participants = participants ? parseInt(participants) : null;
    if (departmentId !== undefined) updateData.departmentId = departmentId;
    if (status !== undefined) updateData.status = status;

    await docRef.update(updateData);
    res.json({ id: req.params.id, ...existing, ...updateData });
  } catch (error) {
    res.status(500).json({ error: "Failed to update event" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const doc = await db.collection("events").doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: "Event not found" });

    const existing = doc.data() as any;
    const departmentScope = (req as any).departmentScope;
    if (departmentScope && existing.departmentId !== departmentScope) return res.status(403).json({ error: "Access denied" });

    await db.collection("events").doc(req.params.id).delete();
    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete event" });
  }
});

export default router;

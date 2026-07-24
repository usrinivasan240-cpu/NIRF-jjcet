import admin from "firebase-admin";
import { readFileSync } from "fs";
import { join } from "path";

let db: admin.firestore.Firestore;

export function getDb(): admin.firestore.Firestore {
  if (!db) {
    throw new Error("Firebase not initialized. Call initFirebase() first.");
  }
  return db;
}

export function initFirebase(): admin.firestore.Firestore {
  if (admin.apps.length > 0) {
    db = admin.firestore();
    return db;
  }

  const possiblePaths = [
    join(process.cwd(), "serviceAccountKey.json"),
    join(process.cwd(), "src/lib/backend/serviceAccountKey.json"),
    join(__dirname, "../../serviceAccountKey.json"),
    join(__dirname, "../../../serviceAccountKey.json"),
  ];

  let initialized = false;
  for (const p of possiblePaths) {
    try {
      const serviceAccount = JSON.parse(readFileSync(p, "utf-8"));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: "jjcet-nirf-cdefd",
      });
      initialized = true;
      break;
    } catch {
      continue;
    }
  }

  if (!initialized) {
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || "jjcet-nirf-cdefd",
    });
  }

  db = admin.firestore();
  return db;
}

export { admin };

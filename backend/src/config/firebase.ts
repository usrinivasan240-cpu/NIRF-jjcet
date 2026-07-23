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

  const serviceAccountPath = join(__dirname, "../../serviceAccountKey.json");

  try {
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf-8"));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: "jjcet-nirf-cdefd",
    });
  } catch {
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || "jjcet-nirf-cdefd",
    });
  }

  db = admin.firestore();
  return db;
}

export { admin };

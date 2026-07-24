"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "/api";

export default function SeedPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const seedDatabase = async () => {
    setLoading(true); setError(""); setResult(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/seed`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.success) { setResult(data.data); } else { setError(data.error || "Failed to seed"); }
    } catch (e: any) { setError(e.message || "Connection error"); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Database className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Seed Database</CardTitle>
          <p className="text-sm text-muted-foreground">Populate Firestore with JJCET sample data</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg text-sm space-y-1">
            <p className="font-medium">This will create:</p>
            <ul className="list-disc list-inside text-muted-foreground">
              <li>6 Departments (IT, CSE, ECE, EEE, MECH, CIVIL)</li>
              <li>12 Faculty members</li>
              <li>10 Publications</li>
              <li>5 Patents</li>
              <li>6 Research Projects</li>
              <li>8 Students</li>
              <li>6 Events</li>
              <li>6 Targets</li>
              <li>3 Reports</li>
              <li>3 Notifications</li>
            </ul>
          </div>
          {error && <div className="bg-red-50 text-red-600 p-3 rounded text-sm flex items-center gap-2"><AlertCircle className="h-4 w-4" />{error}</div>}
          {result && (
            <div className="bg-green-50 text-green-700 p-4 rounded-lg text-sm space-y-2">
              <div className="flex items-center gap-2 font-medium"><CheckCircle className="h-4 w-4" />Database seeded successfully!</div>
              <p>Created {result.count} documents across {result.collections?.length} collections.</p>
              <p className="font-medium mt-2">Collections: {result.collections?.join(", ")}</p>
              <a href="/dashboard" className="inline-block mt-2 text-blue-600 underline">Go to Dashboard</a>
            </div>
          )}
          <Button onClick={seedDatabase} disabled={loading} className="w-full" size="lg">
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Seeding Database...</> : "Seed Database Now"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

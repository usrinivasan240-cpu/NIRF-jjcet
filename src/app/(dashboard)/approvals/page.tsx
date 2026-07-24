"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc, query, where, orderBy } from "firebase/firestore";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Clock } from "lucide-react";

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReject, setShowReject] = useState(false);
  const [rejectComment, setRejectComment] = useState("");
  const [selectedId, setSelectedId] = useState("");

  const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "null") : null;

  const loadApprovals = async () => {
    try {
      const snap = await getDocs(query(collection(db, "approvals"), orderBy("createdAt", "desc")));
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const filtered = items.filter(a => {
        if (user?.role === "SUPER_ADMIN") return true;
        if (user?.role === "HOD") return a.level === "HOD" && a.status === "PENDING";
        if (user?.role === "VICE_PRINCIPAL") return a.level === "VP" && a.status === "PENDING";
        if (user?.role === "PRINCIPAL") return a.level === "PRINCIPAL" && a.status === "PENDING";
        return a.userId === user?.id;
      });
      setApprovals(filtered);
    } catch (e) { console.error("Load approvals error:", e); }
    setLoading(false);
  };

  useEffect(() => { loadApprovals(); }, []);

  const approve = async (id: string) => {
    try {
      await setDoc(doc(db, "approvals", id), { status: "APPROVED", comment: "Approved", approvedAt: new Date().toISOString() }, { merge: true });
      loadApprovals();
    } catch (e) { console.error("Approve error:", e); }
  };

  const reject = async () => {
    try {
      await setDoc(doc(db, "approvals", selectedId), { status: "REJECTED", comment: rejectComment }, { merge: true });
      setShowReject(false);
      setRejectComment("");
      loadApprovals();
    } catch (e) { console.error("Reject error:", e); }
  };

  const levelColors: Record<string, string> = { STAFF: "bg-blue-100 text-blue-800", HOD: "bg-purple-100 text-purple-800", VP: "bg-orange-100 text-orange-800", PRINCIPAL: "bg-green-100 text-green-800" };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold">Approvals</h1><p className="text-muted-foreground">Review and approve reports</p></div>
        {loading ? <p>Loading...</p> : approvals.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground"><CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />No pending approvals</CardContent></Card>
        ) : (
          <div className="space-y-4">
            {approvals.map((a) => (
              <Card key={a.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{a.reportId || "Report"}</span>
                        <Badge className={levelColors[a.level] || ""}>{a.level}</Badge>
                        <Badge variant="secondary">{a.status}</Badge>
                      </div>
                      {a.comment && <p className="text-sm text-muted-foreground mt-1">{a.comment}</p>}
                    </div>
                    {a.status === "PENDING" && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => approve(a.id)}><CheckCircle className="h-4 w-4 mr-1" />Approve</Button>
                        <Button size="sm" variant="destructive" onClick={() => { setSelectedId(a.id); setShowReject(true); }}><XCircle className="h-4 w-4 mr-1" />Reject</Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        <Dialog open={showReject} onOpenChange={setShowReject}>
          <DialogContent>
            <DialogHeader><DialogTitle>Reject Report</DialogTitle></DialogHeader>
            <div className="mt-4"><Label>Reason</Label><textarea className="w-full h-24 rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" value={rejectComment} onChange={(e) => setRejectComment(e.target.value)} placeholder="Enter rejection reason..." /></div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowReject(false)}>Cancel</Button>
              <Button variant="destructive" onClick={reject} disabled={!rejectComment}>Reject</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

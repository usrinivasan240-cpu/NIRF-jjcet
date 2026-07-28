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
import { CheckCircle, XCircle, Clock, Send, Lock, ArrowRight } from "lucide-react";

const APPROVAL_LEVELS = ["STAFF", "HOD", "VP", "PRINCIPAL", "LOCKED"];

const levelColors: Record<string, string> = {
  STAFF: "bg-blue-100 text-blue-800",
  HOD: "bg-purple-100 text-purple-800",
  VP: "bg-orange-100 text-orange-800",
  PRINCIPAL: "bg-green-100 text-green-800",
  LOCKED: "bg-gray-100 text-gray-800",
};

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [reports, setReports] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [showReject, setShowReject] = useState(false);
  const [rejectComment, setRejectComment] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [processing, setProcessing] = useState(false);

  const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "null") : null;

  const loadApprovals = async () => {
    try {
      const [approvSnap, repSnap] = await Promise.all([
        getDocs(query(collection(db, "approvals"), orderBy("createdAt", "desc"))),
        getDocs(collection(db, "reports")),
      ]);
      const repMap: Record<string, any> = {};
      repSnap.docs.forEach(d => { repMap[d.id] = { id: d.id, ...d.data() }; });
      setReports(repMap);

      const items = approvSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const filtered = items.filter(a => {
        if (user?.role === "SUPER_ADMIN") return true;
        if (user?.role === "HOD") return a.level === "HOD" && a.status === "PENDING";
        if (user?.role === "VICE_PRINCIPAL") return a.level === "VP" && a.status === "PENDING";
        if (user?.role === "PRINCIPAL") return a.level === "PRINCIPAL" && a.status === "PENDING";
        if (user?.role === "DEPARTMENT_STAFF") return a.userId === user?.id;
        return a.userId === user?.id;
      });
      setApprovals(filtered);
    } catch (e) { console.error("Load approvals error:", e); }
    setLoading(false);
  };

  useEffect(() => { loadApprovals(); }, []);

  const approve = async (approval: any) => {
    setProcessing(true);
    try {
      const ts = new Date().toISOString();
      const currentLevelIndex = APPROVAL_LEVELS.indexOf(approval.level);
      const nextLevelIndex = currentLevelIndex + 1;
      const nextLevel = APPROVAL_LEVELS[nextLevelIndex] || "LOCKED";

      await setDoc(doc(db, "approvals", approval.id), {
        status: "APPROVED",
        comment: "Approved",
        approvedBy: user?.name || "Unknown",
        approvedAt: ts,
      }, { merge: true });

      if (nextLevel === "LOCKED") {
        await setDoc(doc(db, "reports", approval.reportId), {
          status: "LOCKED",
          currentLevel: "LOCKED",
          lockedAt: ts,
          updatedAt: ts,
        }, { merge: true });
      } else {
        await setDoc(doc(db, "reports", approval.reportId), {
          currentLevel: nextLevel,
          updatedAt: ts,
        }, { merge: true });

        const nextApprovalId = "apr-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        const roleMap: Record<string, string> = {
          HOD: "HOD",
          VP: "VICE_PRINCIPAL",
          PRINCIPAL: "PRINCIPAL",
        };
        await setDoc(doc(db, "approvals", nextApprovalId), {
          reportId: approval.reportId,
          userId: roleMap[nextLevel] || nextLevel,
          userName: nextLevel,
          userRole: nextLevel,
          level: nextLevel,
          status: "PENDING",
          comment: `Auto-created after ${approval.level} approval`,
          createdAt: ts,
        });
      }

      loadApprovals();
    } catch (e) { console.error("Approve error:", e); }
    setProcessing(false);
  };

  const reject = async () => {
    setProcessing(true);
    try {
      const ts = new Date().toISOString();
      await setDoc(doc(db, "approvals", selectedId), {
        status: "REJECTED",
        comment: rejectComment,
        rejectedBy: user?.name || "Unknown",
        rejectedAt: ts,
      }, { merge: true });

      const approval = approvals.find(a => a.id === selectedId);
      if (approval?.reportId) {
        await setDoc(doc(db, "reports", approval.reportId), {
          status: "DRAFT",
          currentLevel: "STAFF",
          rejectedAt: ts,
          updatedAt: ts,
        }, { merge: true });
      }

      setShowReject(false);
      setRejectComment("");
      loadApprovals();
    } catch (e) { console.error("Reject error:", e); }
    setProcessing(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Approvals</h1>
          <p className="text-muted-foreground">Review and approve NIRF reports through the approval chain</p>
        </div>

        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Approval Workflow</p>
            <div className="flex items-center gap-1 text-xs flex-wrap">
              {APPROVAL_LEVELS.map((level, i) => (
                <span key={level} className="flex items-center gap-1">
                  <Badge className={levelColors[level]}>{level}</Badge>
                  {i < APPROVAL_LEVELS.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                </span>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Each approval auto-creates the next level. Rejection sends the report back to DRAFT.
            </p>
          </CardContent>
        </Card>

        {loading ? (
          <p>Loading...</p>
        ) : approvals.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              No pending approvals for your role
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {approvals.map((a) => {
              const report = reports[a.reportId];
              return (
                <Card key={a.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{report?.title || a.reportId}</span>
                          <Badge className={levelColors[a.level] || ""}>{a.level}</Badge>
                          <Badge className={statusColors[a.status] || ""}>{a.status}</Badge>
                          {report?.config?.academicYear && (
                            <span className="text-xs text-muted-foreground">AY {report.config.academicYear}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>Submitted by: <strong>{a.userName || a.userId || "—"}</strong></span>
                          <span>Created: {a.createdAt ? new Date(a.createdAt).toLocaleDateString("en-IN") : "—"}</span>
                          {a.approvedAt && <span>Approved: {new Date(a.approvedAt).toLocaleDateString("en-IN")}</span>}
                          {report?.currentLevel && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Report at: <strong>{report.currentLevel}</strong>
                            </span>
                          )}
                        </div>
                        {a.comment && <p className="text-sm text-muted-foreground mt-1 italic">&quot;{a.comment}&quot;</p>}
                      </div>
                      <div className="flex gap-2">
                        {a.status === "PENDING" && (
                          <>
                            <Button size="sm" onClick={() => approve(a)} disabled={processing}>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              {processing ? "Processing..." : "Approve"}
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => { setSelectedId(a.id); setShowReject(true); }} disabled={processing}>
                              <XCircle className="h-4 w-4 mr-1" />Reject
                            </Button>
                          </>
                        )}
                        {a.status === "APPROVED" && (
                          <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>
                        )}
                        {a.status === "REJECTED" && (
                          <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>
                        )}
                        {report?.status === "LOCKED" && (
                          <Badge className="bg-gray-100 text-gray-800"><Lock className="h-3 w-3 mr-1" />Locked</Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Dialog open={showReject} onOpenChange={setShowReject}>
          <DialogContent>
            <DialogHeader><DialogTitle>Reject Report</DialogTitle></DialogHeader>
            <div className="mt-4">
              <Label>Reason</Label>
              <textarea
                className="w-full h-24 rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                placeholder="Enter rejection reason..."
              />
              <p className="text-xs text-muted-foreground mt-1">The report will be sent back to DRAFT status.</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowReject(false)}>Cancel</Button>
              <Button variant="destructive" onClick={reject} disabled={!rejectComment || processing}>
                {processing ? "Processing..." : "Reject"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

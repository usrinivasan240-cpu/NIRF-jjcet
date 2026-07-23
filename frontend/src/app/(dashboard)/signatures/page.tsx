"use client";
import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PenTool, Check } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function SignaturesPage() {
  const [signature, setSignature] = useState<any>(null);
  const [designation, setDesignation] = useState("");
  const [sealImage, setSealImage] = useState("");
  const [saved, setSaved] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "null") : null;
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  useEffect(() => {
    if (token) {
      fetch(`${API}/signatures/me`, { headers }).then(r => r.json()).then(d => {
        if (d.success && d.data) { setSignature(d.data); setDesignation(d.data.designation); }
      }).catch(() => {});
    }
  }, []);

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000";
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDraw = () => { setDrawing(false); };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const img = canvas.toDataURL("image/png");
    if (!designation) { alert("Enter your designation"); return; }
    try {
      const res = await fetch(`${API}/signatures`, {
        method: "POST", headers,
        body: JSON.stringify({ signatureImage: img, designation, sealImage: sealImage || undefined }),
      });
      const data = await res.json();
      if (data.success) { setSignature(data.data); setSaved(true); setTimeout(() => setSaved(false), 2000); }
    } catch {}
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold">E-Signature</h1><p className="text-muted-foreground">Manage your digital signature for report approval</p></div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Draw Your Signature</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <canvas ref={canvasRef} width={400} height={150} className="w-full border-2 border-dashed rounded-lg cursor-crosshair bg-white" onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw} />
              <div className="flex gap-2">
                <Button variant="outline" onClick={clearCanvas}>Clear</Button>
                <Button onClick={saveSignature}>{saved ? <><Check className="h-4 w-4 mr-2" />Saved!</> : "Save Signature"}</Button>
              </div>
              <div><Label>Designation</Label><Input value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="e.g. Head of Department" /></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Current Signature</CardTitle></CardHeader>
            <CardContent>
              {signature ? (
                <div className="space-y-4">
                  <div className="border rounded-lg p-4 bg-white text-center">
                    <img src={signature.signatureImage} alt="Signature" className="h-24 mx-auto" />
                  </div>
                  <p className="text-sm"><strong>Designation:</strong> {signature.designation}</p>
                  <p className="text-sm text-muted-foreground">Created: {new Date(signature.createdAt).toLocaleDateString()}</p>
                </div>
              ) : (
                <p className="text-muted-foreground py-8 text-center">No signature saved yet. Draw your signature to get started.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

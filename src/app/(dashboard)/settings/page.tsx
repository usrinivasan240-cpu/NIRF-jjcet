"use client";
import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Save, Building2, Globe, Mail, Phone, Upload, Image } from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    collegeName: "J.J. College of Engineering & Technology",
    collegeCode: "JJCET",
    address: "Trichy - Chennai Highway, Thuraiyur, Tiruchirappalli, Tamil Nadu 621013",
    phone: "+91 431 2550000",
    email: "info@jjcet.ac.in",
    website: "https://jjcet.ac.in",
    nirfId: "",
    naacGrade: "",
    academicYear: "2024-25",
    currentSemester: "Even",
    logoUrl: "/images/jjcet-logo.png",
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "null") : null;
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, "appSettings", "main"));
        if (snap.exists()) setSettings(prev => ({ ...prev, ...snap.data() }));
      } catch (e) { console.error("Load settings error:", e); }
      setLoading(false);
    };
    load();
  }, []);

  const save = async () => {
    try {
      await setDoc(doc(db, "appSettings", "main"), { ...settings, updatedAt: new Date().toISOString() });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { console.error("Save settings error:", e); }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) { alert("Logo must be under 500KB"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setSettings(prev => ({ ...prev, logoUrl: ev.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div><h1 className="text-2xl font-bold">Settings</h1><p className="text-muted-foreground">Configure your NIRF ERP system</p></div>
          <Button onClick={save}>{saved ? "Saved!" : <><Save className="h-4 w-4 mr-2" />Save Settings</>}</Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {isSuperAdmin && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Image className="h-5 w-5" />Report Logo</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground">This logo appears on all generated NIRF reports. Max 500KB. Recommended: 200x200px square or circular.</p>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 rounded-lg border-2 border-dashed flex items-center justify-center bg-muted/30 overflow-hidden">
                    {settings.logoUrl ? (
                      <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <Image className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="h-4 w-4 mr-2" />Upload Logo
                    </Button>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                    <div><Label className="text-xs">Or paste image URL</Label><Input value={settings.logoUrl} onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })} placeholder="/images/jjcet-logo.png" className="text-xs mt-1" /></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" />College Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>College Name</Label><Input value={settings.collegeName} onChange={(e) => setSettings({ ...settings, collegeName: e.target.value })} /></div>
              <div><Label>College Code</Label><Input value={settings.collegeCode} onChange={(e) => setSettings({ ...settings, collegeCode: e.target.value })} /></div>
              <div><Label>Address</Label><textarea className="w-full h-20 rounded-md border border-input bg-background px-3 py-2 text-sm" value={settings.address} onChange={(e) => setSettings({ ...settings, address: e.target.value })} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" />Contact & Web</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label className="flex items-center gap-1"><Phone className="h-3 w-3" />Phone</Label><Input value={settings.phone} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} /></div>
              <div><Label className="flex items-center gap-1"><Mail className="h-3 w-3" />Email</Label><Input type="email" value={settings.email} onChange={(e) => setSettings({ ...settings, email: e.target.value })} /></div>
              <div><Label className="flex items-center gap-1"><Globe className="h-3 w-3" />Website</Label><Input value={settings.website} onChange={(e) => setSettings({ ...settings, website: e.target.value })} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" />Academic Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Academic Year</Label><Input value={settings.academicYear} onChange={(e) => setSettings({ ...settings, academicYear: e.target.value })} /></div>
              <div><Label>Current Semester</Label>
                <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={settings.currentSemester} onChange={(e) => setSettings({ ...settings, currentSemester: e.target.value })}>
                  <option value="Odd">Odd Semester</option><option value="Even">Even Semester</option>
                </select>
              </div>
              <div><Label>NIRF ID</Label><Input value={settings.nirfId} onChange={(e) => setSettings({ ...settings, nirfId: e.target.value })} placeholder="NIRF Registration ID" /></div>
              <div><Label>NAAC Grade</Label><Input value={settings.naacGrade} onChange={(e) => setSettings({ ...settings, naacGrade: e.target.value })} placeholder="e.g. A++" /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>System Information</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Application</span><span className="font-medium">NIRF ERP Pro</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Version</span><span className="font-medium">2.0.0</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Logged in as</span><span className="font-medium">{user?.name || "Unknown"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Role</span><span className="font-medium capitalize">{user?.role || "N/A"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Department</span><span className="font-medium">{user?.departmentId || "All"}</span></div>
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">System designed for J.J. College of Engineering & Technology, Tiruchirappalli for NIRF/NAAC/NBA accreditation compliance.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store";

const API = process.env.NEXT_PUBLIC_API_URL || "/api";

const quickLogins = [
  { label: "Super Admin", email: "admin@jjcet.edu", password: "admin123", color: "bg-red-600 hover:bg-red-700" },
  { label: "Principal", email: "principal@jjcet.edu", password: "principal123", color: "bg-blue-600 hover:bg-blue-700" },
  { label: "Vice Principal", email: "vp@jjcet.edu", password: "vp123", color: "bg-purple-600 hover:bg-purple-700" },
  { label: "HOD", email: "hod@jjcet.edu", password: "hod123", color: "bg-green-600 hover:bg-green-700" },
  { label: "Staff", email: "staff@jjcet.edu", password: "staff123", color: "bg-orange-600 hover:bg-orange-700" },
];

export default function LoginPage() {
  const router = useRouter();
  const { login: authLogin } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const doLogin = async (e: React.FormEvent, em: string, pw: string) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: em, password: pw }) });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { setError("Server error"); setLoading(false); return; }
      const token = data.data?.token || data.token;
      const user = data.data?.user || data.user;
      if (token) {
        authLogin(user, token);
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        router.push("/dashboard");
      } else {
        setError(data.error || data.message || "Invalid credentials");
      }
    } catch (e: any) { setError(e.message || "Cannot connect to server"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4"><span className="text-slate-900 font-bold text-2xl">J</span></div>
          <CardTitle className="text-2xl">NIRF ERP Pro</CardTitle>
          <CardDescription>J.J. College of Engineering & Technology</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <div className="bg-red-50 text-red-600 p-3 rounded text-sm">{error}</div>}

          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700 text-center">Quick Login</p>
            <div className="grid grid-cols-2 gap-2">
              {quickLogins.map((ql) => (
                <Button key={ql.email} className={`${ql.color} text-white text-xs`} disabled={loading} onClick={(e) => { setEmail(ql.email); setPassword(ql.password); doLogin(e as any, ql.email, ql.password); }}>
                  {loading ? "..." : ql.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div><div className="relative flex justify-center text-xs"><span className="bg-white px-2 text-gray-500">or sign in manually</span></div></div>

          <form onSubmit={(e) => doLogin(e, email, password)} className="space-y-4">
            <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" required /></div>
            <div><Label>Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" required /></div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Signing in..." : "Sign In"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

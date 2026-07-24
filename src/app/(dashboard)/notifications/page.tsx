"use client";
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCheck, Info, AlertTriangle, CheckCircle } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "/api";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const load = async () => {
    try {
      const r = await fetch(`${API}/notifications`, { headers });
      const d = await r.json();
      if (d.success) setNotifications(d.data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const markAsRead = async (id: string) => {
    try {
      await fetch(`${API}/notifications/${id}/read`, { method: "PUT", headers });
      load();
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await fetch(`${API}/notifications/read-all`, { method: "PUT", headers });
      load();
    } catch {}
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "info": return <Info className="h-4 w-4 text-blue-500" />;
      case "warning": return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "success": return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">
              {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "All caught up!"}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllRead}><CheckCheck className="h-4 w-4 mr-2" />Mark All Read</Button>
          )}
        </div>

        {loading ? <p className="text-muted-foreground">Loading...</p> : notifications.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground"><Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />No notifications yet.</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <Card key={n.id} className={`transition-colors ${!n.read ? "border-l-4 border-l-blue-500 bg-blue-50/50" : ""}`}>
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="mt-1">{getTypeIcon(n.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-sm">{n.title}</h3>
                      {!n.read && <Badge className="bg-blue-500 text-white text-xs">New</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}
                    </p>
                  </div>
                  {!n.read && (
                    <Button size="sm" variant="ghost" onClick={() => markAsRead(n.id)}>Mark Read</Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

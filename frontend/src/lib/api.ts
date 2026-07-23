const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

class ApiClient {
  private token: string | null = null;
  setToken(t: string | null) { this.token = t; }
  private async req<T>(ep: string, opts: RequestInit = {}): Promise<T> {
    const h: Record<string, string> = { "Content-Type": "application/json", ...((opts.headers as Record<string, string>) || {}) };
    if (this.token) h["Authorization"] = `Bearer ${this.token}`;
    const r = await fetch(`${API_BASE}${ep}`, { ...opts, headers: h });
    const d = await r.json();
    if (!r.ok) throw new Error(d.message || "API Error");
    return d;
  }
  get<T>(ep: string) { return this.req<T>(ep); }
  post<T>(ep: string, body: any) { return this.req<T>(ep, { method: "POST", body: JSON.stringify(body) }); }
  put<T>(ep: string, body: any) { return this.req<T>(ep, { method: "PUT", body: JSON.stringify(body) }); }
  del<T>(ep: string) { return this.req<T>(ep, { method: "DELETE" }); }

  login(email: string, password: string) { return this.post("/auth/login", { email, password }); }
  getDepartments() { return this.get("/departments"); }
  getFaculty() { return this.get("/faculty"); }
  getPublications() { return this.get("/publications"); }
  getPatents() { return this.get("/patents"); }
  getResearch() { return this.get("/research"); }
  getStudents() { return this.get("/students"); }
  getEvents() { return this.get("/events"); }
  getTargets() { return this.get("/targets"); }
  getReports() { return this.get("/reports"); }
  getReport(id: string) { return this.get(`/reports/${id}`); }
  generateReport(data: any) { return this.post("/reports/generate", data); }
  submitReport(id: string) { return this.post(`/reports/${id}/submit`, {}); }
  deleteReport(id: string) { return this.del(`/reports/${id}`); }
  getReportTemplates() { return this.get("/reports/templates"); }
  getApprovals() { return this.get("/approvals"); }
  approveItem(id: string, comment?: string) { return this.put(`/approvals/${id}/approve`, { comment }); }
  rejectItem(id: string, comment: string) { return this.put(`/approvals/${id}/reject`, { comment }); }
  getMySignature() { return this.get("/signatures/me"); }
  saveSignature(data: any) { return this.post("/signatures", data); }
  signReport(reportId: string) { return this.post(`/signatures/sign/${reportId}`, {}); }
  getNotifications() { return this.get("/notifications"); }
  getUsers() { return this.get("/users"); }
  getAnalytics() { return this.get("/analytics"); }
  create(data: any, ep: string) { return this.post(ep, data); }
  update(id: string, data: any, ep: string) { return this.put(`${ep}/${id}`, data); }
  remove(id: string, ep: string) { return this.del(`${ep}/${id}`); }
}

export const api = new ApiClient();

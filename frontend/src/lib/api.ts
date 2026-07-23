const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

class ApiClient {
  private token: string | null = null;

  setToken(t: string | null) {
    this.token = t;
  }

  private async request(path: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || data.message || "Request failed");
    }

    return data;
  }

  async get(path: string) {
    return this.request(path);
  }

  async post(path: string, body: any) {
    return this.request(path, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async put(path: string, body: any) {
    return this.request(path, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  async delete(path: string) {
    return this.request(path, { method: "DELETE" });
  }
}

export const api = new ApiClient();
export default api;

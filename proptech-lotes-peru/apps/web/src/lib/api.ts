const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  cache?: RequestCache;
  next?: { revalidate?: number; tags?: string[] };
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {}, ...fetchOptions } = options;

    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      ...fetchOptions,
    };

    if (body) {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(`${this.baseUrl}/api${endpoint}`, config);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Projects
  async getProjects(params?: Record<string, string | number>) {
    const query = params ? '?' + new URLSearchParams(
      Object.entries(params).reduce((acc, [k, v]) => ({ ...acc, [k]: String(v) }), {} as Record<string, string>)
    ).toString() : '';
    return this.request<Record<string, unknown>>(`/projects${query}`, { next: { revalidate: 60 } });
  }

  async getFeaturedProjects(limit = 6) {
    return this.request<Record<string, unknown>>(`/projects/featured?limit=${limit}`, { next: { revalidate: 300 } });
  }

  async getProjectBySlug(slug: string) {
    return this.request<Record<string, unknown>>(`/projects/${slug}`, { next: { revalidate: 60 } });
  }

  async getTopZones() {
    return this.request<Record<string, unknown>>('/projects/top-zones', { next: { revalidate: 600 } });
  }

  async getStats() {
    return this.request<Record<string, unknown>>('/projects/stats', { next: { revalidate: 300 } });
  }

  // Cities
  async getCities() {
    return this.request<Record<string, unknown>>('/cities', { next: { revalidate: 600 } });
  }

  async getCityBySlug(slug: string) {
    return this.request<Record<string, unknown>>(`/cities/${slug}`, { next: { revalidate: 300 } });
  }

  // Compare
  async compareProjects(slugs: string[]) {
    return this.request<Record<string, unknown>>('/compare', { method: 'POST', body: { slugs } });
  }

  // Simulator
  async simulateAffordability(data: Record<string, unknown>) {
    return this.request<Record<string, unknown>>('/simulator/affordability', { method: 'POST', body: data });
  }

  async simulateValorization(data: Record<string, unknown>) {
    return this.request<Record<string, unknown>>('/simulator/valorization', { method: 'POST', body: data });
  }

  // Leads
  async submitLead(data: Record<string, unknown>) {
    return this.request<Record<string, unknown>>('/leads', { method: 'POST', body: data });
  }

  // Reviews
  async submitReview(data: Record<string, unknown>) {
    return this.request<Record<string, unknown>>('/reviews', { method: 'POST', body: data });
  }

  async getReviewsByProject(projectId: string) {
    return this.request<Record<string, unknown>>(`/reviews/project/${projectId}`);
  }

  // SEO
  async getSeoPageData(citySlug: string) {
    return this.request<Record<string, unknown>>(`/seo/city/${citySlug}`, { next: { revalidate: 600 } });
  }

  async getSeoPaths() {
    return this.request<string[]>('/seo/paths', { next: { revalidate: 3600 } });
  }

  // Analytics
  async trackEvent(eventName: string, data?: Record<string, unknown>) {
    return this.request<void>('/analytics/event', {
      method: 'POST',
      body: { eventName, data, pageUrl: typeof window !== 'undefined' ? window.location.href : '' },
    }).catch(() => {}); // Fire and forget
  }

  // Auth (for admin)
  async login(email: string, password: string) {
    return this.request<Record<string, unknown>>('/auth/login', { method: 'POST', body: { email, password } });
  }

  async refreshToken(refreshToken: string) {
    return this.request<Record<string, unknown>>('/auth/refresh', { method: 'POST', body: { refreshToken } });
  }

  // Admin
  async adminRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    return this.request<T>(endpoint, {
      ...options,
      headers: {
        ...options.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  }
}

export const api = new ApiClient(API_URL);

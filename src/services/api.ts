// Backend API service for PostgreSQL database
import type { Rikishi, Basho, Bout } from '../types';

const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'http://localhost:3001/api'
  : '/api'; // Use Vite proxy in development

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // Rikishi API methods
  async getAllRikishi(): Promise<Rikishi[]> {
    return this.request<Rikishi[]>('/rikishi');
  }

  async getRikishiById(id: string): Promise<Rikishi> {
    return this.request<Rikishi>(`/rikishi/${id}`);
  }

  async createRikishi(rikishi: Omit<Rikishi, 'createdAt'>): Promise<Rikishi> {
    return this.request<Rikishi>('/rikishi', {
      method: 'POST',
      body: JSON.stringify(rikishi),
    });
  }

  async bulkCreateRikishi(rikishi: Omit<Rikishi, 'createdAt'>[]): Promise<{ message: string; created: number }> {
    return this.request<{ message: string; created: number }>('/rikishi/bulk', {
      method: 'POST',
      body: JSON.stringify({ rikishi }),
    });
  }

  async updateRikishi(id: string, rikishi: Partial<Rikishi>): Promise<Rikishi> {
    return this.request<Rikishi>(`/rikishi/${id}`, {
      method: 'PUT',
      body: JSON.stringify(rikishi),
    });
  }

  async deleteRikishi(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/rikishi/${id}`, {
      method: 'DELETE',
    });
  }

  // Basho API methods
  async getAllBasho(): Promise<Basho[]> {
    return this.request<Basho[]>('/basho');
  }

  async getBashoById(id: string): Promise<Basho> {
    return this.request<Basho>(`/basho/${id}`);
  }

  async createBasho(basho: Omit<Basho, 'createdAt'>): Promise<Basho> {
    return this.request<Basho>('/basho', {
      method: 'POST',
      body: JSON.stringify(basho),
    });
  }

  async updateBasho(id: string, basho: Partial<Basho>): Promise<Basho> {
    return this.request<Basho>(`/basho/${id}`, {
      method: 'PUT',
      body: JSON.stringify(basho),
    });
  }

  async deleteBasho(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/basho/${id}`, {
      method: 'DELETE',
    });
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const url = process.env.NODE_ENV === 'production'
      ? 'http://localhost:3001/health'
      : '/health';
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }

    return response.json();
  }
}

export const apiService = new ApiService();
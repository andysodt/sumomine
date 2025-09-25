// Backend API service for PostgreSQL database
import type { Rikishi, Basho, Bout, MeasurementEntity, RankEntity, ShikonaEntity, BanzukeEntity, TorikumiEntity } from '../types';

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

  // Measurements API methods
  async getAllMeasurements(): Promise<MeasurementEntity[]> {
    return this.request<MeasurementEntity[]>('/measurements');
  }

  async getMeasurementById(id: string): Promise<MeasurementEntity> {
    return this.request<MeasurementEntity>(`/measurements/${id}`);
  }

  async createMeasurement(measurement: Omit<MeasurementEntity, 'createdAt'>): Promise<MeasurementEntity> {
    return this.request<MeasurementEntity>('/measurements', {
      method: 'POST',
      body: JSON.stringify(measurement),
    });
  }

  async bulkCreateMeasurements(measurements: Omit<MeasurementEntity, 'createdAt'>[]): Promise<{ message: string; created: number }> {
    return this.request<{ message: string; created: number }>('/measurements/bulk', {
      method: 'POST',
      body: JSON.stringify({ measurements }),
    });
  }

  async updateMeasurement(id: string, measurement: Partial<MeasurementEntity>): Promise<MeasurementEntity> {
    return this.request<MeasurementEntity>(`/measurements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(measurement),
    });
  }

  async deleteMeasurement(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/measurements/${id}`, {
      method: 'DELETE',
    });
  }

  // Ranks API methods
  async getAllRanks(): Promise<RankEntity[]> {
    return this.request<RankEntity[]>('/ranks');
  }

  async getRankById(id: string): Promise<RankEntity> {
    return this.request<RankEntity>(`/ranks/${id}`);
  }

  async createRank(rank: Omit<RankEntity, 'createdAt'>): Promise<RankEntity> {
    return this.request<RankEntity>('/ranks', {
      method: 'POST',
      body: JSON.stringify(rank),
    });
  }

  async bulkCreateRanks(ranks: Omit<RankEntity, 'createdAt'>[]): Promise<{ message: string; created: number }> {
    return this.request<{ message: string; created: number }>('/ranks/bulk', {
      method: 'POST',
      body: JSON.stringify({ ranks }),
    });
  }

  async updateRank(id: string, rank: Partial<RankEntity>): Promise<RankEntity> {
    return this.request<RankEntity>(`/ranks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(rank),
    });
  }

  async deleteRank(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/ranks/${id}`, {
      method: 'DELETE',
    });
  }

  // Shikonas API methods
  async getAllShikonas(): Promise<ShikonaEntity[]> {
    return this.request<ShikonaEntity[]>('/shikonas');
  }

  async getShikonaById(id: string): Promise<ShikonaEntity> {
    return this.request<ShikonaEntity>(`/shikonas/${id}`);
  }

  async createShikona(shikona: Omit<ShikonaEntity, 'createdAt'>): Promise<ShikonaEntity> {
    return this.request<ShikonaEntity>('/shikonas', {
      method: 'POST',
      body: JSON.stringify(shikona),
    });
  }

  async bulkCreateShikonas(shikonas: Omit<ShikonaEntity, 'createdAt'>[]): Promise<{ message: string; created: number }> {
    return this.request<{ message: string; created: number }>('/shikonas/bulk', {
      method: 'POST',
      body: JSON.stringify({ shikonas }),
    });
  }

  async updateShikona(id: string, shikona: Partial<ShikonaEntity>): Promise<ShikonaEntity> {
    return this.request<ShikonaEntity>(`/shikonas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(shikona),
    });
  }

  async deleteShikona(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/shikonas/${id}`, {
      method: 'DELETE',
    });
  }

  // Banzuke API methods
  async getAllBanzuke(): Promise<BanzukeEntity[]> {
    return this.request<BanzukeEntity[]>('/banzuke');
  }

  async getBanzukeById(id: string): Promise<BanzukeEntity> {
    return this.request<BanzukeEntity>(`/banzuke/${id}`);
  }

  async createBanzuke(banzuke: Omit<BanzukeEntity, 'createdAt'>): Promise<BanzukeEntity> {
    return this.request<BanzukeEntity>('/banzuke', {
      method: 'POST',
      body: JSON.stringify(banzuke),
    });
  }

  async bulkCreateBanzuke(banzuke: Omit<BanzukeEntity, 'createdAt'>[]): Promise<{ message: string; created: number }> {
    return this.request<{ message: string; created: number }>('/banzuke/bulk', {
      method: 'POST',
      body: JSON.stringify({ banzuke }),
    });
  }

  async updateBanzuke(id: string, banzuke: Partial<BanzukeEntity>): Promise<BanzukeEntity> {
    return this.request<BanzukeEntity>(`/banzuke/${id}`, {
      method: 'PUT',
      body: JSON.stringify(banzuke),
    });
  }

  async deleteBanzuke(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/banzuke/${id}`, {
      method: 'DELETE',
    });
  }

  // Torikumi API methods
  async getAllTorikumi(): Promise<TorikumiEntity[]> {
    return this.request<TorikumiEntity[]>('/torikumi');
  }

  async getTorikumiById(id: string): Promise<TorikumiEntity> {
    return this.request<TorikumiEntity>(`/torikumi/${id}`);
  }

  async createTorikumi(torikumi: Omit<TorikumiEntity, 'createdAt'>): Promise<TorikumiEntity> {
    return this.request<TorikumiEntity>('/torikumi', {
      method: 'POST',
      body: JSON.stringify(torikumi),
    });
  }

  async bulkCreateTorikumi(torikumi: Omit<TorikumiEntity, 'createdAt'>[]): Promise<{ message: string; created: number }> {
    return this.request<{ message: string; created: number }>('/torikumi/bulk', {
      method: 'POST',
      body: JSON.stringify({ torikumi }),
    });
  }

  async updateTorikumi(id: string, torikumi: Partial<TorikumiEntity>): Promise<TorikumiEntity> {
    return this.request<TorikumiEntity>(`/torikumi/${id}`, {
      method: 'PUT',
      body: JSON.stringify(torikumi),
    });
  }

  async deleteTorikumi(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/torikumi/${id}`, {
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
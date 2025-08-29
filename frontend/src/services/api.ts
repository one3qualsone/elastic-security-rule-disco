import axios from 'axios';
import { DetectionRule } from '../types/rule';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
});

export interface RulesResponse {
  rules: DetectionRule[];
  total: number;
}

export const apiService = {
  // Get all rules with optional search
  async getRules(search?: string, limit?: number): Promise<RulesResponse> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (limit) params.append('limit', limit.toString());
    
    const response = await api.get<RulesResponse>(`/rules?${params}`);
    return response.data;
  },

  // Get single rule by ID
  async getRule(id: string): Promise<DetectionRule> {
    const response = await api.get<{ rule: DetectionRule }>(`/rules/${id}`);
    return response.data.rule;
  },

  // Seed sample data
  async seedRules(): Promise<void> {
    await api.post('/rules/seed');
  },
};

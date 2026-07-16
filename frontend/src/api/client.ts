/**
 * API Client for Dell AI Agent Optimization System
 */
import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  AgentRequest,
  AgentResponse,
  OptimizationControlsConfig,
  ExperimentConfig,
  ExperimentResult,
  SystemStats,
  CostAlert,
  ModelComparisonData
} from '../types';

const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:8000';

class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string = API_BASE_URL) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config: any) => {
        // Add auth token if available
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error: any) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: any) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Handle unauthorized
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Health check
  async healthCheck(): Promise<{ status: string; app_name: string; version: string }> {
    const response = await this.client.get('/health');
    return response.data;
  }

  // Optimize agent request
  async optimizeAgent(request: AgentRequest): Promise<AgentResponse> {
    const response = await this.client.post<AgentResponse>('/api/v1/optimize', request);
    return response.data;
  }

  // Get model comparison
  async getModelComparison(request: AgentRequest): Promise<{
    request: string;
    comparison_data: ModelComparisonData[];
  }> {
    const response = await this.client.post('/api/v1/model-comparison', request);
    return response.data;
  }

  // Run experiment
  async runExperiment(config: ExperimentConfig): Promise<ExperimentResult> {
    const response = await this.client.post<ExperimentResult>('/api/v1/experiment', config);
    return response.data;
  }

  // Get system stats
  async getSystemStats(): Promise<SystemStats> {
    const response = await this.client.get<SystemStats>('/api/v1/stats');
    return response.data;
  }

  // Get optimization recommendations
  async getRecommendations(): Promise<{
    recommendations: string[];
    timestamp: string;
  }> {
    const response = await this.client.get('/api/v1/recommendations');
    return response.data;
  }

  // Update configuration
  async updateConfiguration(config: OptimizationControlsConfig): Promise<{
    status: string;
    message: string;
    timestamp: string;
  }> {
    const response = await this.client.put('/api/v1/config', config);
    return response.data;
  }

  // Clear cache
  async clearCache(): Promise<{ status: string; message: string }> {
    const response = await this.client.post('/api/v1/cache/clear');
    return response.data;
  }

  // Get cost alerts
  async getCostAlerts(): Promise<{ alerts: CostAlert[]; timestamp: string }> {
    const response = await this.client.get('/api/v1/cost/alerts');
    return response.data;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default ApiClient;

/**
 * Dashboard Component - Main dashboard with metrics and stats
 */
import React, { useEffect, useState } from 'react';
import { Activity, DollarSign, Zap, Database } from 'lucide-react';
import { apiClient } from '../api/client';
import { SystemStats, CostAlert } from '../types';

export const Dashboard: React.FC = () => {
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [costAlerts, setCostAlerts] = useState<CostAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [statsData, recsData, alertsData] = await Promise.all([
          apiClient.getSystemStats(),
          apiClient.getRecommendations(),
          apiClient.getCostAlerts(),
        ]);
        setSystemStats(statsData);
        setRecommendations(recsData.recommendations);
        setCostAlerts(alertsData.alerts);
      } catch (err: any) {
        setError(err?.message || 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const cacheStats = systemStats?.caching as Record<string, any> | undefined;
  const costStats = systemStats?.cost_optimization as Record<string, any> | undefined;
  const tokenMonitoring = costStats?.token_monitoring as Record<string, any> | undefined;

  const stats = {
    registrySize: systemStats?.model_selection?.registry_size ?? 0,
    semanticCacheEntries: cacheStats?.semantic_cache?.total_entries ?? 0,
    totalCost: tokenMonitoring?.total_cost != null ? `$${tokenMonitoring.total_cost.toFixed(4)}` : '$0.00',
    activeAlerts: costAlerts.length,
  };

  if (isLoading) {
    return <div className="dashboard"><p>Loading dashboard...</p></div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Optimization Dashboard</h2>
        <p>Real-time performance metrics and optimization insights</p>
      </div>

      {error && <div className="run-error">{error}</div>}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <Activity />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.registrySize}</div>
            <div className="stat-label">Models in Registry</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <DollarSign />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalCost}</div>
            <div className="stat-label">Total Cost Tracked</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Database />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.semanticCacheEntries}</div>
            <div className="stat-label">Semantic Cache Entries</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Zap />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.activeAlerts}</div>
            <div className="stat-label">Active Cost Alerts</div>
          </div>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="dashboard-section">
          <h3>Cost Alerts</h3>
          <div className="activity-list">
            {costAlerts.length === 0 && <div className="activity-item">No active cost alerts</div>}
            {costAlerts.map((alert: CostAlert, idx: number) => (
              <div className="activity-item" key={idx}>
                <span className={`activity-text severity-${alert.severity}`}>
                  [{alert.severity.toUpperCase()}] {alert.type}: {alert.current} / {alert.threshold}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-section">
          <h3>Optimization Recommendations</h3>
          <div className="recommendations-list">
            {recommendations.length === 0 && (
              <div className="recommendation-item low">
                <span className="recommendation-text">No recommendations at this time</span>
              </div>
            )}
            {recommendations.map((rec: string, idx: number) => (
              <div className="recommendation-item medium" key={idx}>
                <span className="recommendation-text">{rec}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

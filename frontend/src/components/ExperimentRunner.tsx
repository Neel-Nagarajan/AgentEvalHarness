/**
 * ExperimentRunner Component - A/B testing and experiment management
 */
import React, { useState } from 'react';
import { Play, BarChart3, Loader } from 'lucide-react';
import { apiClient } from '../api/client';
import { ExperimentResult, OptimizationControlsConfig } from '../types';

const DEFAULT_CONFIG: OptimizationControlsConfig = {
  model_selection: {
    primary_model: 'gpt-4-turbo' as any,
    fallback_models: ['gpt-3.5-turbo'] as any,
    cost_threshold: 0.05,
    quality_threshold: 0.85,
    latency_budget_ms: 2000,
    strategy: 'balanced' as any,
    use_case: 'general' as any,
  },
  context_optimization: {
    max_context_tokens: 128000,
    min_context_tokens: 4000,
    compression_ratio: 0.7,
    relevance_threshold: 0.6,
    conversation_turns_retention: 10,
  },
  prompt_caching: {
    enabled: true,
    cache_levels: ['memory', 'redis', 'disk'],
    similarity_threshold: 0.95,
    ttl_seconds: 3600,
    max_cache_size_mb: 1000,
    cache_warmup: false,
  },
  prompt_compression: {} as any,
  chain_of_thought: {} as any,
  token_budget: {} as any,
  context_pruning: {} as any,
  rag_optimization: {} as any,
  semantic_caching: {} as any,
  response_caching: {} as any,
  token_monitoring: {
    enabled: true,
    real_time_tracking: true,
    per_operation_tracking: true,
    cost_calculation: true,
    alert_thresholds: { daily: 0.8, weekly: 0.85, monthly: 0.9 },
  },
  query_cost_tracking: {} as any,
  latency_targets: {
    p50_target_ms: 500,
    p95_target_ms: 1000,
    p99_target_ms: 2000,
    enforcement: true,
    auto_optimization: true,
  },
  quality_thresholds: {} as any,
  tool_selection: {} as any,
  workflow_optimization: {} as any,
};

const USE_CASE_OPTIONS: { value: string; label: string }[] = [
  { value: 'general', label: 'General (use strategy weights)' },
  { value: 'chatbot', label: 'Chatbot (latency + cost)' },
  { value: 'rag', label: 'RAG Assistant (quality + grounding)' },
  { value: 'coding', label: 'Coding Agent (quality + reasoning)' },
  { value: 'batch', label: 'Batch Analytics (throughput + cost)' },
];

const buildConfigForUseCase = (useCase: string): OptimizationControlsConfig => ({
  ...DEFAULT_CONFIG,
  model_selection: {
    ...DEFAULT_CONFIG.model_selection,
    use_case: useCase as any,
  },
});

export const ExperimentRunner: React.FC = () => {
  const [experimentName, setExperimentName] = useState('Use Case Comparison');
  const [testQueries, setTestQueries] = useState('What is the capital of France?\nSummarize this document.');
  const [useCaseA, setUseCaseA] = useState('general');
  const [useCaseB, setUseCaseB] = useState('chatbot');
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExperimentResult | null>(null);

  const handleRunExperiment = async () => {
    const queries = testQueries.split('\n').map((q: string) => q.trim()).filter(Boolean);
    if (queries.length === 0) {
      setError('Please enter at least one test query.');
      return;
    }

    setIsRunning(true);
    setError(null);
    setResult(null);

    try {
      const experimentResult = await apiClient.runExperiment({
        experiment_id: `exp-${Date.now()}`,
        name: experimentName,
        description: `Comparing use_case=${useCaseA} vs use_case=${useCaseB}`,
        control_configs: [buildConfigForUseCase(useCaseA), buildConfigForUseCase(useCaseB)],
        test_queries: queries,
        metrics: ['latency', 'cost', 'quality'],
        duration_hours: 1,
      });
      setResult(experimentResult);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to run experiment');
    } finally {
      setIsRunning(false);
    }
  };

  const useCaseLabel = (index: number | string | undefined): string => {
    if (index === 0 || index === '0') return `Config A (${useCaseA})`;
    if (index === 1 || index === '1') return `Config B (${useCaseB})`;
    return String(index ?? 'N/A');
  };

  return (
    <div className="experiment-runner">
      <div className="experiment-header">
        <h2>Experiment Runner</h2>
        <p>Run A/B tests comparing optimization configurations</p>
      </div>

      <div className="config-field">
        <label>Experiment Name</label>
        <input
          type="text"
          value={experimentName}
          onChange={(e) => setExperimentName(e.target.value)}
        />
      </div>

      <div className="config-field">
        <label>Test Queries (one per line)</label>
        <textarea
          rows={4}
          value={testQueries}
          onChange={(e) => setTestQueries(e.target.value)}
        />
      </div>

      <div className="config-field">
        <label>Use Case A</label>
        <select value={useCaseA} onChange={(e) => setUseCaseA(e.target.value)}>
          {USE_CASE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="config-field">
        <label>Use Case B</label>
        <select value={useCaseB} onChange={(e) => setUseCaseB(e.target.value)}>
          {USE_CASE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="experiment-actions">
        <button className="btn-primary" onClick={handleRunExperiment} disabled={isRunning}>
          {isRunning ? <Loader size={16} className="spin" /> : <Play size={16} />}
          {isRunning ? 'Running...' : 'Run Experiment'}
        </button>
      </div>

      {error && <div className="run-error">{error}</div>}

      {result && (
        <div className="experiments-list">
          <div className="experiment-card">
            <div className="experiment-info">
              <h3>{result.experiment_id}</h3>
              <span className="experiment-status status-completed">completed</span>
            </div>

            <div className="experiment-results">
              <div className="result-item">
                <BarChart3 size={14} />
                <span>Best Config (by latency):</span>
                <span className="result-value good">
                  {useCaseLabel(result.statistical_analysis?.best_config_by_latency)}
                </span>
              </div>
              <div className="result-item">
                <span>Latency Improvement:</span>
                <span className="result-value good">
                  {result.statistical_analysis?.latency_improvement ?? 'N/A'}
                </span>
              </div>
              <div className="result-item">
                <span>Cost Savings:</span>
                <span className="result-value good">
                  {result.statistical_analysis?.cost_savings ?? 'N/A'}
                </span>
              </div>
            </div>

            <div className="dashboard-section">
              <h4>Recommendations</h4>
              <div className="recommendations-list">
                {result.recommendations.map((rec: string, idx: number) => (
                  <div className="recommendation-item medium" key={idx}>
                    <span className="recommendation-text">{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

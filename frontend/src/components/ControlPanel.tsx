/**
 * ControlPanel Component - Main dashboard for optimization controls
 */
import React, { useState } from 'react';
import { Settings, Zap, Database, DollarSign, Activity, Play, Loader } from 'lucide-react';
import { OptimizationControlsConfig, AgentResponse } from '../types';
import { apiClient } from '../api/client';

interface ControlPanelProps {
  config: OptimizationControlsConfig;
  onConfigChange: (config: OptimizationControlsConfig) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ config, onConfigChange }) => {
  const [activeTab, setActiveTab] = useState('model');
  const [agentId, setAgentId] = useState('agent-001');
  const [deploymentId, setDeploymentId] = useState('');
  const [query, setQuery] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [runResult, setRunResult] = useState<AgentResponse | null>(null);

  const handleRunAgent = async () => {
    if (!query.trim()) {
      setRunError('Please enter a query to run the agent with.');
      return;
    }

    setIsRunning(true);
    setRunError(null);
    setRunResult(null);

    try {
      const response = await apiClient.optimizeAgent({
        agent_id: agentId,
        query,
        priority: 'normal',
        optimization_config: config,
        deployment_id: deploymentId.trim() || undefined,
      });
      setRunResult(response);
    } catch (err: any) {
      setRunError(err?.response?.data?.error || err?.message || 'Failed to run agent');
    } finally {
      setIsRunning(false);
    }
  };

  const tabs = [
    { id: 'model', label: 'Model Selection', icon: Zap },
    { id: 'context', label: 'Context Management', icon: Database },
    { id: 'prompt', label: 'Prompt Engineering', icon: Settings },
    { id: 'cost', label: 'Cost Optimization', icon: DollarSign },
    { id: 'performance', label: 'Performance', icon: Activity },
  ];

  const updateConfig = (section: keyof OptimizationControlsConfig, updates: any) => {
    onConfigChange({
      ...config,
      [section]: {
        ...config[section],
        ...updates,
      },
    });
  };

  return (
    <div className="control-panel">
      <div className="control-panel-header">
        <h2>Optimization Controls</h2>
        <p>Configure and tune optimization parameters for your AI agents</p>
      </div>

      <div className="control-panel-tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="control-panel-content">
        {activeTab === 'model' && (
          <ModelSelectionConfig
            config={config.model_selection}
            onChange={(updates) => updateConfig('model_selection', updates)}
          />
        )}
        {activeTab === 'context' && (
          <ContextManagementConfig
            config={config.context_optimization}
            onChange={(updates) => updateConfig('context_optimization', updates)}
          />
        )}
        {activeTab === 'prompt' && (
          <PromptEngineeringConfig
            config={config.prompt_caching}
            onChange={(updates) => updateConfig('prompt_caching', updates)}
          />
        )}
        {activeTab === 'cost' && (
          <CostOptimizationConfig
            config={config.token_monitoring}
            onChange={(updates) => updateConfig('token_monitoring', updates)}
          />
        )}
        {activeTab === 'performance' && (
          <PerformanceConfig
            config={config.latency_targets}
            onChange={(updates) => updateConfig('latency_targets', updates)}
          />
        )}
      </div>

      <div className="run-agent-section">
        <h3>Run Agent With Current Settings</h3>
        <p>Send a test query to the agent using the optimization controls configured above.</p>

        <div className="config-field">
          <label>Agent ID</label>
          <input
            type="text"
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
          />
        </div>

        <div className="config-field">
          <label>Data Robot Deployment ID (optional)</label>
          <input
            type="text"
            placeholder="Leave blank to use the server default deployment"
            value={deploymentId}
            onChange={(e) => setDeploymentId(e.target.value)}
          />
        </div>

        <div className="config-field">
          <label>Query</label>
          <textarea
            rows={3}
            placeholder="Enter the query to send to the agent..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <button className="btn-primary" onClick={handleRunAgent} disabled={isRunning}>
          {isRunning ? <Loader size={16} className="spin" /> : <Play size={16} />}
          {isRunning ? 'Running...' : 'Run Agent'}
        </button>

        {runError && <div className="run-error">{runError}</div>}

        {runResult && (
          <div className="run-result">
            <h4>Agent Response</h4>
            <p className="run-response-text">{runResult.response}</p>

            <div className="run-metrics">
              <div className="result-item">
                <span>Execution Mode:</span>
                <span className="result-value">
                  {runResult.metrics.execution_mode === 'data_robot' && 'Real Data Robot Deployment'}
                  {runResult.metrics.execution_mode === 'simulated' && 'Simulated (no deployment configured)'}
                  {runResult.metrics.execution_mode === 'simulated_fallback' && 'Simulated (Data Robot call failed)'}
                  {runResult.metrics.execution_mode === 'cached' && 'Served from Cache'}
                  {!runResult.metrics.execution_mode && 'N/A'}
                </span>
              </div>
              <div className="result-item">
                <span>Model Used:</span>
                <span className="result-value">{runResult.metrics.model_used || 'N/A'}</span>
              </div>
              <div className="result-item">
                <span>Cache Hit:</span>
                <span className="result-value">{runResult.metrics.cache_hit ? 'Yes' : 'No'}</span>
              </div>
              <div className="result-item">
                <span>Tokens Saved:</span>
                <span className="result-value">{runResult.metrics.tokens_saved}</span>
              </div>
              <div className="result-item">
                <span>Processing Time:</span>
                <span className="result-value">{runResult.metadata.processing_time_seconds.toFixed(3)}s</span>
              </div>
              <div className="result-item">
                <span>Controls Applied:</span>
                <span className="result-value">
                  {runResult.metrics.optimization_controls_applied.join(', ') || 'None'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Model Selection Config Component
const ModelSelectionConfig: React.FC<{
  config: any;
  onChange: (updates: any) => void;
}> = ({ config, onChange }) => (
  <div className="config-section">
    <h3>Model Selection</h3>
    
    <div className="config-field">
      <label>Primary Model</label>
      <select
        value={config.primary_model}
        onChange={(e) => onChange({ primary_model: e.target.value })}
      >
        <option value="gpt-4-turbo">GPT-4 Turbo</option>
        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
        <option value="claude-3-opus">Claude 3 Opus</option>
        <option value="claude-3-sonnet">Claude 3 Sonnet</option>
      </select>
    </div>

    <div className="config-field">
      <label>Cost Threshold ($ per 1K tokens)</label>
      <input
        type="number"
        step="0.01"
        value={config.cost_threshold}
        onChange={(e) => onChange({ cost_threshold: parseFloat(e.target.value) })}
      />
    </div>

    <div className="config-field">
      <label>Quality Threshold (0-1)</label>
      <input
        type="number"
        step="0.01"
        min="0"
        max="1"
        value={config.quality_threshold}
        onChange={(e) => onChange({ quality_threshold: parseFloat(e.target.value) })}
      />
    </div>

    <div className="config-field">
      <label>Latency Budget (ms)</label>
      <input
        type="number"
        value={config.latency_budget_ms}
        onChange={(e) => onChange({ latency_budget_ms: parseInt(e.target.value) })}
      />
    </div>

    <div className="config-field">
      <label>Use Case</label>
      <select
        value={config.use_case}
        onChange={(e) => onChange({ use_case: e.target.value })}
      >
        <option value="general">General (use strategy weights)</option>
        <option value="chatbot">Chatbot (latency + cost)</option>
        <option value="rag">RAG Assistant (quality + grounding)</option>
        <option value="coding">Coding Agent (quality + reasoning)</option>
        <option value="batch">Batch Analytics (throughput + cost)</option>
      </select>
    </div>

    <div className="config-field">
      <label>Optimization Strategy</label>
      <select
        value={config.strategy}
        onChange={(e) => onChange({ strategy: e.target.value })}
      >
        <option value="balanced">Balanced</option>
        <option value="cost_optimized">Cost Optimized</option>
        <option value="quality_optimized">Quality Optimized</option>
        <option value="latency_optimized">Latency Optimized</option>
      </select>
    </div>
  </div>
);

// Context Management Config Component
const ContextManagementConfig: React.FC<{
  config: any;
  onChange: (updates: any) => void;
}> = ({ config, onChange }) => (
  <div className="config-section">
    <h3>Context Management</h3>
    
    <div className="config-field">
      <label>Max Context Tokens</label>
      <input
        type="number"
        value={config.max_context_tokens}
        onChange={(e) => onChange({ max_context_tokens: parseInt(e.target.value) })}
      />
    </div>

    <div className="config-field">
      <label>Min Context Tokens</label>
      <input
        type="number"
        value={config.min_context_tokens}
        onChange={(e) => onChange({ min_context_tokens: parseInt(e.target.value) })}
      />
    </div>

    <div className="config-field">
      <label>Compression Ratio (0-1)</label>
      <input
        type="number"
        step="0.01"
        min="0"
        max="1"
        value={config.compression_ratio}
        onChange={(e) => onChange({ compression_ratio: parseFloat(e.target.value) })}
      />
    </div>

    <div className="config-field">
      <label>Relevance Threshold (0-1)</label>
      <input
        type="number"
        step="0.01"
        min="0"
        max="1"
        value={config.relevance_threshold}
        onChange={(e) => onChange({ relevance_threshold: parseFloat(e.target.value) })}
      />
    </div>

    <div className="config-field">
      <label>Conversation Turns Retention</label>
      <input
        type="number"
        value={config.conversation_turns_retention}
        onChange={(e) => onChange({ conversation_turns_retention: parseInt(e.target.value) })}
      />
    </div>
  </div>
);

// Prompt Engineering Config Component
const PromptEngineeringConfig: React.FC<{
  config: any;
  onChange: (updates: any) => void;
}> = ({ config, onChange }) => (
  <div className="config-section">
    <h3>Prompt Engineering</h3>
    
    <div className="config-field">
      <label>
        <input
          type="checkbox"
          checked={config.enabled}
          onChange={(e) => onChange({ enabled: e.target.checked })}
        />
        Enable Prompt Caching
      </label>
    </div>

    <div className="config-field">
      <label>Similarity Threshold (0-1)</label>
      <input
        type="number"
        step="0.01"
        min="0"
        max="1"
        value={config.similarity_threshold}
        onChange={(e) => onChange({ similarity_threshold: parseFloat(e.target.value) })}
      />
    </div>

    <div className="config-field">
      <label>TTL (seconds)</label>
      <input
        type="number"
        value={config.ttl_seconds}
        onChange={(e) => onChange({ ttl_seconds: parseInt(e.target.value) })}
      />
    </div>

    <div className="config-field">
      <label>Max Cache Size (MB)</label>
      <input
        type="number"
        value={config.max_cache_size_mb}
        onChange={(e) => onChange({ max_cache_size_mb: parseInt(e.target.value) })}
      />
    </div>
  </div>
);

// Cost Optimization Config Component
const CostOptimizationConfig: React.FC<{
  config: any;
  onChange: (updates: any) => void;
}> = ({ config, onChange }) => (
  <div className="config-section">
    <h3>Cost Optimization</h3>
    
    <div className="config-field">
      <label>
        <input
          type="checkbox"
          checked={config.enabled}
          onChange={(e) => onChange({ enabled: e.target.checked })}
        />
        Enable Token Monitoring
      </label>
    </div>

    <div className="config-field">
      <label>
        <input
          type="checkbox"
          checked={config.real_time_tracking}
          onChange={(e) => onChange({ real_time_tracking: e.target.checked })}
        />
        Real-time Tracking
      </label>
    </div>

    <div className="config-field">
      <label>Daily Alert Threshold (0-1)</label>
      <input
        type="number"
        step="0.01"
        min="0"
        max="1"
        value={config.alert_thresholds?.daily || 0.8}
        onChange={(e) => onChange({
          alert_thresholds: {
            ...config.alert_thresholds,
            daily: parseFloat(e.target.value)
          }
        })}
      />
    </div>

    <div className="config-field">
      <label>Weekly Alert Threshold (0-1)</label>
      <input
        type="number"
        step="0.01"
        min="0"
        max="1"
        value={config.alert_thresholds?.weekly || 0.85}
        onChange={(e) => onChange({
          alert_thresholds: {
            ...config.alert_thresholds,
            weekly: parseFloat(e.target.value)
          }
        })}
      />
    </div>

    <div className="config-field">
      <label>Monthly Alert Threshold (0-1)</label>
      <input
        type="number"
        step="0.01"
        min="0"
        max="1"
        value={config.alert_thresholds?.monthly || 0.9}
        onChange={(e) => onChange({
          alert_thresholds: {
            ...config.alert_thresholds,
            monthly: parseFloat(e.target.value)
          }
        })}
      />
    </div>
  </div>
);

// Performance Config Component
const PerformanceConfig: React.FC<{
  config: any;
  onChange: (updates: any) => void;
}> = ({ config, onChange }) => (
  <div className="config-section">
    <h3>Performance Targets</h3>
    
    <div className="config-field">
      <label>P50 Latency Target (ms)</label>
      <input
        type="number"
        value={config.p50_target_ms}
        onChange={(e) => onChange({ p50_target_ms: parseInt(e.target.value) })}
      />
    </div>

    <div className="config-field">
      <label>P95 Latency Target (ms)</label>
      <input
        type="number"
        value={config.p95_target_ms}
        onChange={(e) => onChange({ p95_target_ms: parseInt(e.target.value) })}
      />
    </div>

    <div className="config-field">
      <label>P99 Latency Target (ms)</label>
      <input
        type="number"
        value={config.p99_target_ms}
        onChange={(e) => onChange({ p99_target_ms: parseInt(e.target.value) })}
      />
    </div>

    <div className="config-field">
      <label>
        <input
          type="checkbox"
          checked={config.enforcement}
          onChange={(e) => onChange({ enforcement: e.target.checked })}
        />
        Enable Latency Enforcement
      </label>
    </div>

    <div className="config-field">
      <label>
        <input
          type="checkbox"
          checked={config.auto_optimization}
          onChange={(e) => onChange({ auto_optimization: e.target.checked })}
        />
        Enable Auto-Optimization
      </label>
    </div>
  </div>
);

/**
 * Main App Component - Dell AI Agent Optimization Harness
 */
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ControlPanel from './components/ControlPanel';
import Dashboard from './components/Dashboard';
import ExperimentRunner from './components/ExperimentRunner';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="app">
          <header className="app-header">
            <h1>Dell AI Agent Optimization Harness</h1>
            <nav className="app-nav">
              <a href="/">Dashboard</a>
              <a href="/controls">Controls</a>
              <a href="/experiments">Experiments</a>
            </nav>
          </header>
          
          <main className="app-main">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/controls" element={<ControlPanelWrapper />} />
              <Route path="/experiments" element={<ExperimentRunner />} />
            </Routes>
          </main>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

const ControlPanelWrapper: React.FC = () => {
  const [config, setConfig] = React.useState({
    model_selection: {
      primary_model: "gpt-4-turbo",
      fallback_models: ["gpt-3.5-turbo"],
      cost_threshold: 0.05,
      quality_threshold: 0.85,
      latency_budget_ms: 2000,
      strategy: "balanced"
    },
    context_optimization: {
      max_context_tokens: 128000,
      min_context_tokens: 4000,
      compression_ratio: 0.7,
      relevance_threshold: 0.6,
      conversation_turns_retention: 10
    },
    prompt_caching: {
      enabled: true,
      cache_levels: ["memory", "redis", "disk"],
      similarity_threshold: 0.95,
      ttl_seconds: 3600,
      max_cache_size_mb: 1000,
      cache_warmup: false
    },
    token_monitoring: {
      enabled: true,
      real_time_tracking: true,
      per_operation_tracking: true,
      cost_calculation: true,
      alert_thresholds: {
        daily: 0.8,
        weekly: 0.85,
        monthly: 0.9
      }
    },
    latency_targets: {
      p50_target_ms: 500,
      p95_target_ms: 1000,
      p99_target_ms: 2000,
      enforcement: true,
      auto_optimization: true
    }
  });

  return (
    <ControlPanel 
      config={config} 
      onConfigChange={setConfig} 
    />
  );
};

export default App;

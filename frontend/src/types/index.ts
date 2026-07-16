/**
 * TypeScript interfaces for Dell AI Agent Optimization System
 */

export enum ModelTier {
  GPT4_TURBO = "gpt-4-turbo",
  GPT35_TURBO = "gpt-3.5-turbo",
  CLAUDE3_OPUS = "claude-3-opus",
  CLAUDE3_SONNET = "claude-3-sonnet",
  GPT4 = "gpt-4",
  GPT35_16K = "gpt-3.5-turbo-16k"
}

export enum OptimizationStrategy {
  COST_OPTIMIZED = "cost_optimized",
  QUALITY_OPTIMIZED = "quality_optimized",
  LATENCY_OPTIMIZED = "latency_optimized",
  BALANCED = "balanced"
}

export enum UseCase {
  CHATBOT = "chatbot",
  RAG = "rag",
  CODING = "coding",
  BATCH = "batch",
  MULTIMODAL = "multimodal",
  TOOL_CALLING = "tool_calling",
  SAFETY_CRITICAL = "safety_critical",
  REAL_TIME = "real_time",
  CUSTOM = "custom",
  GENERAL = "general"
}

export interface ModelSelectionWeights {
  cost: number;
  quality: number;
  latency: number;
  context: number;
  capability: number;
}

export interface ModelSelectionConfig {
  primary_model: ModelTier;
  fallback_models: ModelTier[];
  cost_threshold: number;
  quality_threshold: number;
  latency_budget_ms: number;
  strategy: OptimizationStrategy;
  use_case: UseCase;
  custom_weights?: ModelSelectionWeights;
  custom_required_capabilities?: string[];
}

export interface ContextOptimizationConfig {
  max_context_tokens: number;
  min_context_tokens: number;
  compression_ratio: number;
  relevance_threshold: number;
  conversation_turns_retention: number;
}

export interface PromptCachingConfig {
  enabled: boolean;
  cache_levels: string[];
  similarity_threshold: number;
  ttl_seconds: number;
  max_cache_size_mb: number;
  cache_warmup: boolean;
}

export interface PromptCompressionConfig {
  enabled: boolean;
  target_reduction: number;
  preservation_threshold: number;
  compression_stages: string[];
}

export interface ChainOfThoughtConfig {
  enabled: boolean;
  max_steps: number;
  min_steps: number;
  complexity_based_depth: boolean;
  reasoning_extraction: boolean;
  quality_threshold: number;
}

export interface TokenBudgetConfig {
  daily_limit: number;
  session_limit: number;
  per_query_limit: number;
  budget_enforcement: boolean;
  overage_handling: "queue" | "reject" | "charge";
  priority_levels: string[];
}

export interface ContextPruningConfig {
  enabled: boolean;
  strategy: "relevance_based" | "temporal" | "semantic";
  pruning_threshold: number;
  retention_policy: "recent_first" | "relevance_first" | "hybrid";
  cluster_pruning: boolean;
  semantic_preservation: number;
}

export interface RAGOptimizationConfig {
  vector_db: string;
  search_type: "semantic" | "keyword" | "hybrid";
  top_k: number;
  reranking: boolean;
  reranking_model: string;
  chunk_size: number;
  chunk_overlap: number;
}

export interface SemanticCachingConfig {
  enabled: boolean;
  embedding_model: string;
  similarity_threshold: number;
  index_type: string;
  cache_warming_queries: number;
  hierarchical_indexing: boolean;
}

export interface ResponseCachingConfig {
  enabled: boolean;
  default_ttl: number;
  stale_while_revalidate: number;
  cache_hierarchies: Array<{
    level: string;
    ttl: number;
    size: number;
  }>;
}

export interface TokenMonitoringConfig {
  enabled: boolean;
  real_time_tracking: boolean;
  per_operation_tracking: boolean;
  cost_calculation: boolean;
  alert_thresholds: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}

export interface QueryCostTrackingConfig {
  enabled: boolean;
  attribution_level: "detailed" | "summary" | "minimal";
  aggregation_intervals: string[];
  optimization_recommendations: boolean;
  cost_benchmarking: boolean;
}

export interface LatencyTargetsConfig {
  p50_target_ms: number;
  p95_target_ms: number;
  p99_target_ms: number;
  enforcement: boolean;
  auto_optimization: boolean;
}

export interface QualityThresholdsConfig {
  min_quality_score: number;
  quality_model: string;
  below_threshold_action: "retry" | "fallback" | "accept";
  continuous_monitoring: boolean;
  quality_trend_analysis: boolean;
}

export interface ToolSelectionConfig {
  enabled: boolean;
  capability_matching: boolean;
  performance_tracking: boolean;
  auto_selection: boolean;
  tool_registry: string;
}

export interface WorkflowOptimizationConfig {
  enabled: boolean;
  optimization_algorithm: "genetic" | "simulated_annealing" | "gradient_descent";
  performance_monitoring: boolean;
  auto_tuning: boolean;
  workflow_library: string;
}

export interface OptimizationControlsConfig {
  model_selection: ModelSelectionConfig;
  context_optimization: ContextOptimizationConfig;
  prompt_caching: PromptCachingConfig;
  prompt_compression: PromptCompressionConfig;
  chain_of_thought: ChainOfThoughtConfig;
  token_budget: TokenBudgetConfig;
  context_pruning: ContextPruningConfig;
  rag_optimization: RAGOptimizationConfig;
  semantic_caching: SemanticCachingConfig;
  response_caching: ResponseCachingConfig;
  token_monitoring: TokenMonitoringConfig;
  query_cost_tracking: QueryCostTrackingConfig;
  latency_targets: LatencyTargetsConfig;
  quality_thresholds: QualityThresholdsConfig;
  tool_selection: ToolSelectionConfig;
  workflow_optimization: WorkflowOptimizationConfig;
}

export interface AgentRequest {
  agent_id: string;
  query: string;
  context?: Array<Record<string, any>>;
  parameters?: Record<string, any>;
  optimization_config?: OptimizationControlsConfig;
  priority: string;
  session_id?: string;
  deployment_id?: string;
}

export interface AgentResponse {
  agent_id: string;
  response: string;
  metadata: {
    processing_time_seconds: number;
    timestamp: string;
    session_id?: string;
  };
  metrics: {
    optimization_controls_applied: string[];
    model_used?: string;
    tokens_saved: number;
    cache_hit: boolean;
    execution_mode: 'data_robot' | 'simulated' | 'simulated_fallback' | 'cached';
  };
  optimization_applied: Record<string, any>;
}

export interface ExperimentConfig {
  experiment_id: string;
  name: string;
  description: string;
  control_configs: OptimizationControlsConfig[];
  test_queries: string[];
  metrics: string[];
  duration_hours: number;
}

export interface ExperimentResult {
  experiment_id: string;
  results: Record<string, any>;
  statistical_analysis: Record<string, any>;
  recommendations: string[];
  timestamp: string;
}

export interface SystemStats {
  model_selection: {
    registry_size: number;
  };
  prompt_engineering: Record<string, any>;
  context_management: Record<string, any>;
  caching: Record<string, any>;
  cost_optimization: Record<string, any>;
}

export interface CostAlert {
  type: string;
  current: number;
  threshold: number;
  severity: "warning" | "critical";
}

export interface ModelComparisonData {
  model_id: string;
  score: number;
  context_window: number;
  cost_per_1k_tokens: number;
  avg_latency_ms: number;
  quality_score: number;
  capabilities: string[];
  meets_requirements: {
    cost: boolean;
    quality: boolean;
    latency: boolean;
    context: boolean;
  };
}

export interface OptimizationRecommendation {
  category: string;
  recommendation: string;
  impact: string;
  priority: "high" | "medium" | "low";
}

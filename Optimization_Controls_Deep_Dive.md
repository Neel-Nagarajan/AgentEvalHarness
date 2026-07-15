# AI Agent Optimization Controls - Deep Dive & Tuning Playbook

Companion to `Technical_Architecture_Optimization_Controls.md`. This document adds four layers of depth for each control:

- **Parameter Reference** - what every parameter means, valid range, default, and the trade-off it governs
- **How It Works** - the underlying algorithm, formula, or decision logic
- **Tuning Presets** - recommended values for common agent use cases
- **Eval Harness Workflow** - step-by-step of how a customer tunes the control in the UI

All parameters and defaults are grounded in `optimization_system/models/schemas.py`.

---

## Use Case Profiles (referenced throughout)

| Profile | Description | Primary Goal |
|---------|-------------|--------------|
| **Chatbot** | High-volume conversational support agent | Low latency + low cost |
| **RAG Assistant** | Knowledge-base Q&A over documents | Quality + grounding |
| **Coding Agent** | Code generation / debugging | Quality + deep reasoning |
| **Batch Analytics** | Large-scale offline document processing | Throughput + lowest cost |

---

# 1. Model Selection Controls

## 1.1 Model Selection (`ModelSelectionConfig`)

### Parameter Reference

| Parameter | Range / Type | Default | What it controls | Trade-off |
|-----------|--------------|---------|------------------|-----------|
| `primary_model` | `ModelTier` enum | `gpt-4-turbo` | Default model for all requests | Higher tier = better quality, higher cost |
| `fallback_models` | ordered list | `[]` | Models tried when primary fails a gate | More fallbacks = resilience, complexity |
| `cost_threshold` | float ≥ 0 ($/1K tok) | `0.05` | Hard ceiling on per-token spend | Lower = cheaper, more downgrades |
| `quality_threshold` | 0.0-1.0 | `0.85` | Minimum acceptable quality score | Higher = better output, fewer cheap models qualify |
| `latency_budget_ms` | int ≥ 0 | `2000` | Max acceptable response time | Lower = faster models only, may hurt quality |
| `strategy` | enum | `balanced` | Weighting used when `use_case` is `general` | See scoring formula below |
| `use_case` | enum | `general` | Use-case profile that drives weighting + capability requirements | Overrides `strategy` weights when not `general` |

### How It Works

Each candidate model receives a composite score across **five normalized `[0,1]` dimensions** — cost, quality, latency, context fit, and capability match:

```
score(model) = w_cost·cost + w_quality·quality + w_latency·latency
             + w_context·context + w_capability·capability
```

**Weight resolution:** If `use_case` is not `general`, the use-case profile weights apply. Otherwise the router falls back to `strategy`-derived weights.

**Use-case weight profiles** (from `USE_CASE_PROFILES` in `core/model_selection.py`):

| use_case | cost | quality | latency | context | capability | required capabilities |
|----------|------|---------|---------|---------|------------|-----------------------|
| `chatbot` | 0.30 | 0.20 | 0.35 | 0.05 | 0.10 | reasoning |
| `rag` | 0.15 | 0.35 | 0.10 | 0.20 | 0.20 | long_context, analysis |
| `coding` | 0.10 | 0.45 | 0.10 | 0.15 | 0.20 | coding, reasoning |
| `batch` | 0.50 | 0.15 | 0.05 | 0.10 | 0.20 | reasoning |

**Strategy fallback weights** (used when `use_case = general`):

| strategy | cost | quality | latency | context | capability |
|----------|------|---------|---------|---------|------------|
| `cost_optimized` | 0.50 | 0.20 | 0.15 | 0.10 | 0.05 |
| `quality_optimized` | 0.10 | 0.55 | 0.10 | 0.15 | 0.10 |
| `latency_optimized` | 0.15 | 0.20 | 0.50 | 0.10 | 0.05 |
| `balanced` | 0.30 | 0.30 | 0.20 | 0.10 | 0.10 |

**Capability match** = fraction of required capabilities the model possesses. Required capabilities combine the use-case profile with the classified query domain (`coding`/`analysis`/`reasoning`) and a `long_context` requirement when estimated tokens exceed 8000. The `QueryClassifier` estimates complexity/domain so a simple query can still route to a cheaper tier.

### Tuning Presets

| Profile | primary_model | strategy | cost_threshold | quality_threshold | latency_budget_ms |
|---------|---------------|----------|----------------|-------------------|-------------------|
| Chatbot | gpt-3.5-turbo | cost_optimized | 0.02 | 0.75 | 800 |
| RAG Assistant | gpt-4-turbo | balanced | 0.05 | 0.88 | 2000 |
| Coding Agent | claude-3-opus | quality_optimized | 0.10 | 0.92 | 5000 |
| Batch Analytics | gpt-3.5-turbo-16k | cost_optimized | 0.015 | 0.70 | 10000 |

### Eval Harness Workflow

1. Open **Control Panel → Model Selection**.
2. Set `strategy` and thresholds; the panel shows candidate models that pass the gates.
3. Run **Model Comparison** on your test query set - view cost/quality/latency side by side.
4. Promote the winning config to an experiment for statistical A/B validation.

---

# 2. Context Management Controls

## 2.1 Context Optimization (`ContextOptimizationConfig`)

### Parameter Reference

| Parameter | Range | Default | What it controls | Trade-off |
|-----------|-------|---------|------------------|-----------|
| `max_context_tokens` | ≥ 1 | `128000` | Upper bound on context sent | Higher = more grounding, more cost |
| `min_context_tokens` | ≥ 1 | `4000` | Floor to preserve coherence | Too low starves the model |
| `compression_ratio` | 0.0-1.0 | `0.7` | Target retained fraction | Lower = cheaper, risk of losing meaning |
| `relevance_threshold` | 0.0-1.0 | `0.6` | Min relevance for a chunk to stay | Higher = leaner context, risk dropping useful info |
| `conversation_turns_retention` | ≥ 0 | `10` | Dialogue turns kept | More = better memory, more tokens |

Validator: `max_context_tokens` must be ≥ `min_context_tokens`.

### How It Works

Context is scored per segment using cosine similarity between the segment embedding and the current query embedding. Segments below `relevance_threshold` are candidates for removal. The engine then compresses remaining content toward `compression_ratio` while never dropping below `min_context_tokens`.

### Tuning Presets

| Profile | max_context | compression_ratio | relevance_threshold | turns_retention |
|---------|-------------|-------------------|---------------------|-----------------|
| Chatbot | 16000 | 0.6 | 0.55 | 6 |
| RAG Assistant | 128000 | 0.8 | 0.65 | 4 |
| Coding Agent | 128000 | 0.85 | 0.6 | 12 |
| Batch Analytics | 32000 | 0.5 | 0.7 | 0 |

### Eval Harness Workflow

1. **Control Panel → Context Management**.
2. Use the **Context Visualizer** to see per-segment relevance scores.
3. Slide `compression_ratio` and watch the quality-impact estimate update.
4. Confirm outputs stay above your quality bar before saving.

## 2.2 Token Budget (`TokenBudgetConfig`)

### Parameter Reference

| Parameter | Range | Default | What it controls | Trade-off |
|-----------|-------|---------|------------------|-----------|
| `daily_limit` | ≥ 0 | `1000000` | Tokens per day | Hard cost cap vs. throttling risk |
| `session_limit` | ≥ 0 | `10000` | Tokens per session | Protects against runaway sessions |
| `per_query_limit` | ≥ 0 | `2000` | Tokens per single query | Prevents oversized prompts |
| `budget_enforcement` | bool | `true` | Enforce vs. track-only | Off = observability only |
| `overage_handling` | `queue`/`reject`/`charge` | `queue` | Action when exceeded | Queue delays, reject fails, charge bills |
| `priority_levels` | list | `[critical, normal, low]` | Allocation tiers under scarcity | More tiers = finer control |

### How It Works

A token bucket per scope (day/session/query) is decremented on each call. When a bucket empties, `overage_handling` decides behavior. Under contention, higher `priority_levels` drain from a reserved allocation first.

### Tuning Presets

| Profile | daily_limit | per_query_limit | overage_handling |
|---------|-------------|-----------------|------------------|
| Chatbot | 5,000,000 | 1500 | queue |
| RAG Assistant | 2,000,000 | 4000 | queue |
| Coding Agent | 1,000,000 | 8000 | charge |
| Batch Analytics | 20,000,000 | 3000 | reject |

## 2.3 Context Pruning (`ContextPruningConfig`)

### Parameter Reference

| Parameter | Range | Default | What it controls | Trade-off |
|-----------|-------|---------|------------------|-----------|
| `strategy` | `relevance_based`/`temporal`/`semantic` | `relevance_based` | How pruning targets are chosen | See below |
| `pruning_threshold` | 0.0-1.0 | `0.5` | Score below which content is dropped | Higher = more aggressive pruning |
| `retention_policy` | `recent_first`/`relevance_first`/`hybrid` | `recent_first` | What to keep when trimming | Recency vs. importance |
| `cluster_pruning` | bool | `true` | Drop whole semantic clusters | Efficient but coarser |
| `semantic_preservation` | 0.0-1.0 | `0.85` | Guard for meaning-critical content | Higher = safer, less savings |

### How It Works

- `relevance_based`: prunes by similarity-to-query score.
- `temporal`: prunes oldest content first.
- `semantic`: clusters segments (e.g., k-means on embeddings) and prunes lowest-value clusters, respecting `semantic_preservation`.

### Tuning Presets

| Profile | strategy | pruning_threshold | retention_policy |
|---------|----------|-------------------|------------------|
| Chatbot | temporal | 0.4 | recent_first |
| RAG Assistant | relevance_based | 0.55 | relevance_first |
| Coding Agent | semantic | 0.5 | hybrid |
| Batch Analytics | relevance_based | 0.6 | relevance_first |

## 2.4 RAG Optimization (`RAGOptimizationConfig`)

### Parameter Reference

| Parameter | Range | Default | What it controls | Trade-off |
|-----------|-------|---------|------------------|-----------|
| `vector_db` | string | `pinecone` | Backing vector store | Infra choice |
| `search_type` | `semantic`/`keyword`/`hybrid` | `hybrid` | Retrieval mode | Hybrid best recall, more compute |
| `top_k` | ≥ 1 | `10` | Chunks retrieved | Higher recall vs. more tokens |
| `reranking` | bool | `true` | Second-pass ordering | Precision vs. latency |
| `reranking_model` | string | `cross-encoder` | Reranker used | Accuracy vs. speed |
| `chunk_size` | ≥ 1 | `512` | Tokens per chunk | Larger = more context per hit, less precise |
| `chunk_overlap` | ≥ 0 | `50` | Overlap between chunks | Reduces boundary loss, adds redundancy |

### How It Works

Hybrid search fuses dense (embedding) and sparse (BM25/keyword) scores, retrieves `top_k` candidates, then a cross-encoder reranks by joint query-chunk relevance. `chunk_size`/`chunk_overlap` are applied at ingestion.

### Tuning Presets

| Profile | search_type | top_k | reranking | chunk_size |
|---------|-------------|-------|-----------|------------|
| RAG Assistant | hybrid | 10 | true | 512 |
| Coding Agent | hybrid | 15 | true | 800 |
| Chatbot | semantic | 5 | false | 384 |
| Batch Analytics | semantic | 8 | false | 512 |

### Eval Harness Workflow

1. **Control Panel → RAG**.
2. Tune `chunk_size`/`top_k`; the **RAG Performance Dashboard** shows retrieval precision and latency.
3. Toggle `reranking` and compare grounding quality on your test queries.

---

# 3. Prompt Engineering Controls

## 3.1 Prompt Caching (`PromptCachingConfig`)

### Parameter Reference

| Parameter | Range | Default | What it controls | Trade-off |
|-----------|-------|---------|------------------|-----------|
| `enabled` | bool | `true` | Master switch | - |
| `cache_levels` | list | `[memory, redis, disk]` | Tier hierarchy | More tiers = higher hit rate, more infra |
| `similarity_threshold` | 0.0-1.0 | `0.95` | Match strictness | High = fewer false hits, lower hit rate |
| `ttl_seconds` | ≥ 0 | `3600` | Entry lifetime | Longer = more hits, staler data |
| `max_cache_size_mb` | ≥ 0 | `1000` | Memory ceiling | Bigger cache, more RAM |
| `cache_warmup` | bool | `false` | Preload common prompts | Faster cold start, startup cost |

### How It Works

L1 (memory) → L2 (Redis) → L3 (disk) are checked in order. A prompt embedding is compared to cached keys; a hit requires similarity ≥ `similarity_threshold`. Entries expire by `ttl_seconds` and evict via LRU when `max_cache_size_mb` is reached.

### Tuning Presets

| Profile | similarity_threshold | ttl_seconds | cache_warmup |
|---------|----------------------|-------------|--------------|
| Chatbot | 0.93 | 7200 | true |
| RAG Assistant | 0.96 | 1800 | false |
| Coding Agent | 0.98 | 900 | false |
| Batch Analytics | 0.90 | 86400 | true |

## 3.2 Prompt Compression (`PromptCompressionConfig`)

### Parameter Reference

| Parameter | Range | Default | What it controls | Trade-off |
|-----------|-------|---------|------------------|-----------|
| `enabled` | bool | `false` | Master switch | - |
| `target_reduction` | 0.0-1.0 | `0.3` | Desired token cut | Higher savings vs. meaning loss |
| `preservation_threshold` | 0.0-1.0 | `0.9` | Min meaning retention | Higher = safer, less reduction |
| `compression_stages` | list | `[remove_redundancy, simplify_language]` | Pipeline steps | More stages = more reduction, more risk |

### How It Works

A multi-stage pipeline applies each stage sequentially, measuring semantic similarity between original and compressed prompt after each stage. Compression stops when either `target_reduction` is met or continuing would push retention below `preservation_threshold`.

### Tuning Presets

| Profile | enabled | target_reduction | stages |
|---------|---------|------------------|--------|
| Chatbot | true | 0.35 | remove_redundancy, simplify_language |
| RAG Assistant | true | 0.25 | remove_redundancy |
| Coding Agent | false | - | - (avoid altering code) |
| Batch Analytics | true | 0.45 | all |

## 3.3 Chain-of-Thought (`ChainOfThoughtConfig`)

### Parameter Reference

| Parameter | Range | Default | What it controls | Trade-off |
|-----------|-------|---------|------------------|-----------|
| `enabled` | bool | `true` | Master switch | - |
| `max_steps` | ≥ 1 | `10` | Reasoning depth cap | More = better hard-problem accuracy, more tokens |
| `min_steps` | ≥ 1 | `2` | Reasoning depth floor | Ensures baseline reasoning |
| `complexity_based_depth` | bool | `true` | Auto-scale to difficulty | Efficient; needs good classifier |
| `reasoning_extraction` | bool | `true` | Capture intermediate steps | Debuggability vs. output size |
| `quality_threshold` | 0.0-1.0 | `0.8` | Min reasoning quality | Higher = retries on weak reasoning |

Validator: `max_steps` must be ≥ `min_steps`.

### How It Works

When `complexity_based_depth` is on, the query complexity score maps linearly into `[min_steps, max_steps]`. Output reasoning is scored; if below `quality_threshold`, the request retries with more steps or a fallback model.

### Tuning Presets

| Profile | enabled | min_steps | max_steps |
|---------|---------|-----------|-----------|
| Chatbot | false | 1 | 2 |
| RAG Assistant | true | 2 | 5 |
| Coding Agent | true | 3 | 12 |
| Batch Analytics | false | 1 | 3 |

---

# 4. Caching Controls

## 4.1 Semantic Caching (`SemanticCachingConfig`)

### Parameter Reference

| Parameter | Range | Default | What it controls | Trade-off |
|-----------|-------|---------|------------------|-----------|
| `enabled` | bool | `true` | Master switch | - |
| `embedding_model` | string | `text-embedding-3-small` | Vectorizer | Bigger = more accurate, costlier |
| `similarity_threshold` | 0.0-1.0 | `0.92` | Vector match cutoff | High = precise, low hit rate |
| `index_type` | string | `hnsw` | ANN index | HNSW fast approx; flat exact |
| `cache_warming_queries` | ≥ 0 | `1000` | Prewarm count | Faster start, upfront cost |
| `hierarchical_indexing` | bool | `true` | Multi-level index | Scales large caches |

### How It Works

Incoming query is embedded and searched against the HNSW index. Nearest neighbor above `similarity_threshold` returns its cached response. Hierarchical indexing partitions the space (e.g., by domain) for sub-linear lookup at scale.

### Tuning Presets

| Profile | similarity_threshold | cache_warming_queries |
|---------|----------------------|-----------------------|
| Chatbot | 0.90 | 5000 |
| RAG Assistant | 0.93 | 2000 |
| Coding Agent | 0.96 | 500 |
| Batch Analytics | 0.88 | 10000 |

## 4.2 Response Caching (`ResponseCachingConfig`)

### Parameter Reference

| Parameter | Range | Default | What it controls | Trade-off |
|-----------|-------|---------|------------------|-----------|
| `enabled` | bool | `true` | Master switch | - |
| `default_ttl` | ≥ 0 | `300` | Response lifetime (s) | Longer = more hits, staler |
| `stale_while_revalidate` | ≥ 0 | `60` | Grace window serving stale | Latency win vs. freshness |
| `cache_hierarchies` | list | `[]` | Tiered edge/regional/origin TTLs | Geo performance vs. complexity |

### How It Works

On a hit within `default_ttl`, the cached response is returned. Within the `stale_while_revalidate` window after expiry, the stale value is served immediately while a background refresh runs. Hierarchies apply different TTLs at edge/regional/origin layers.

### Tuning Presets

| Profile | default_ttl | stale_while_revalidate |
|---------|-------------|------------------------|
| Chatbot | 600 | 120 |
| RAG Assistant | 300 | 60 |
| Coding Agent | 60 | 0 |
| Batch Analytics | 3600 | 300 |

---

# 5. Cost Optimization Controls

## 5.1 Token Monitoring (`TokenMonitoringConfig`)

### Parameter Reference

| Parameter | Range | Default | What it controls | Trade-off |
|-----------|-------|---------|------------------|-----------|
| `enabled` | bool | `true` | Master switch | - |
| `real_time_tracking` | bool | `true` | Live token accounting | Slight overhead |
| `per_operation_tracking` | bool | `true` | Track by operation type | Granular insight, more storage |
| `cost_calculation` | bool | `true` | Convert tokens → dollars live | - |
| `alert_thresholds` | dict | `{daily:0.8, weekly:0.85, monthly:0.9}` | Fractional budget triggers | Lower = earlier warnings, more noise |

### How It Works

A counter increments per request; `alert_thresholds` fire when cumulative spend reaches the given fraction of the corresponding budget window. Costs are computed from live per-model pricing.

### Tuning Presets

| Profile | alert_thresholds (daily/weekly/monthly) |
|---------|------------------------------------------|
| Chatbot | 0.7 / 0.8 / 0.9 |
| RAG Assistant | 0.8 / 0.85 / 0.9 |
| Coding Agent | 0.75 / 0.85 / 0.95 |
| Batch Analytics | 0.6 / 0.75 / 0.85 |

## 5.2 Query Cost Tracking (`QueryCostTrackingConfig`)

### Parameter Reference

| Parameter | Range | Default | What it controls | Trade-off |
|-----------|-------|---------|------------------|-----------|
| `enabled` | bool | `true` | Master switch | - |
| `attribution_level` | `detailed`/`summary`/`minimal` | `detailed` | Cost breakdown granularity | Detail vs. storage/perf |
| `aggregation_intervals` | list | `[hourly, daily, weekly]` | Rollup windows | More = richer trends, more compute |
| `optimization_recommendations` | bool | `true` | Auto savings suggestions | - |
| `cost_benchmarking` | bool | `true` | Compare to baselines | - |

### How It Works

Each query's token counts are attributed to its agent/operation. Rollups are precomputed at the configured intervals; the recommendation engine flags high-cost patterns (e.g., oversized prompts, low cache hit rate).

### Tuning Presets

| Profile | attribution_level |
|---------|-------------------|
| Chatbot | summary |
| RAG Assistant | detailed |
| Coding Agent | detailed |
| Batch Analytics | minimal |

---

# 6. Performance & Agent Controls

## 6.1 Request Batching (`RequestBatchingConfig`)

| Parameter | Range | Default | What it controls | Trade-off |
|-----------|-------|---------|------------------|-----------|
| `max_batch_size` | ≥ 1 | `20` | Upper batch bound | Throughput vs. per-request latency |
| `min_batch_size` | ≥ 1 | `1` | Lower batch bound | - |
| `batch_timeout_ms` | ≥ 0 | `100` | Max wait to fill a batch | Longer = fuller batches, higher latency |
| `priority_batching` | bool | `true` | Group by priority | Fairness vs. efficiency |
| `size_based_batching` | bool | `true` | Group by token size | Better utilization |

Validator: `max_batch_size` ≥ `min_batch_size`. **Preset:** Batch Analytics `max_batch_size=50, timeout=500`; Chatbot `max_batch_size=8, timeout=50`.

## 6.2 Parallel Processing (`ParallelProcessingConfig`)

| Parameter | Range | Default | What it controls | Trade-off |
|-----------|-------|---------|------------------|-----------|
| `max_workers` | ≥ 1 | `10` | Concurrency | Throughput vs. resource use |
| `worker_type` | `thread`/`process` | `thread` | Execution model | Threads for I/O, processes for CPU |
| `async_io` | bool | `true` | Async I/O | Better for API-bound work |
| `queue_size` | ≥ 0 | `1000` | Pending capacity | Buffering vs. memory |
| `load_balancing` | `round_robin`/`least_connections`/`random` | `round_robin` | Dispatch strategy | Even vs. adaptive |

## 6.3 Latency Targets (`LatencyTargetsConfig`)

| Parameter | Range | Default | What it controls | Trade-off |
|-----------|-------|---------|------------------|-----------|
| `p50_target_ms` | ≥ 0 | `500` | Median latency SLA | - |
| `p95_target_ms` | ≥ 0 | `1000` | Tail latency SLA | - |
| `p99_target_ms` | ≥ 0 | `2000` | Extreme tail SLA | - |
| `enforcement` | bool | `true` | Enforce SLAs | May downgrade models to comply |
| `auto_optimization` | bool | `true` | Auto-adjust controls to hit targets | Convenience vs. determinism |

Validators enforce `p50 ≤ p95 ≤ p99`. When `auto_optimization` is on, breaching a target triggers cheaper/faster routing or increased caching.

## 6.4 Quality Thresholds (`QualityThresholdsConfig`)

| Parameter | Range | Default | What it controls | Trade-off |
|-----------|-------|---------|------------------|-----------|
| `min_quality_score` | 0.0-1.0 | `0.8` | Acceptance floor | Higher = more retries/cost |
| `quality_model` | string | `custom_quality_classifier` | Scorer | Accuracy vs. speed |
| `below_threshold_action` | `retry`/`fallback`/`accept` | `retry_with_fallback` | Recovery action | Cost/latency vs. quality |
| `continuous_monitoring` | bool | `true` | Ongoing scoring | Overhead |
| `quality_trend_analysis` | bool | `true` | Drift detection | - |

## 6.5 Tool Selection (`ToolSelectionConfig`)

| Parameter | Default | What it controls |
|-----------|---------|------------------|
| `capability_matching` | `true` | Match tool capabilities to task requirements |
| `performance_tracking` | `true` | Track per-tool success/latency |
| `auto_selection` | `true` | Auto-pick best tool |
| `tool_registry` | `/tools/registry` | Registry path |

## 6.6 Workflow Optimization (`WorkflowOptimizationConfig`)

| Parameter | Default | What it controls |
|-----------|---------|------------------|
| `optimization_algorithm` | `genetic` | Search method (`genetic`/`simulated_annealing`/`gradient_descent`) |
| `performance_monitoring` | `true` | Track workflow metrics |
| `auto_tuning` | `true` | Auto-optimize step ordering/params |
| `workflow_library` | `/workflows/library` | Library path |

---

# 7. Consolidated Tuning Playbook

Copy-paste starting points (partial `OptimizationControlsConfig`):

### Chatbot (latency + cost)
```yaml
model_selection: { primary_model: gpt-3.5-turbo, strategy: cost_optimized, latency_budget_ms: 800 }
prompt_caching: { similarity_threshold: 0.93, cache_warmup: true }
semantic_caching: { similarity_threshold: 0.90 }
chain_of_thought: { enabled: false }
latency_targets: { p50_target_ms: 300, p95_target_ms: 700 }
```

### RAG Assistant (quality + grounding)
```yaml
model_selection: { primary_model: gpt-4-turbo, strategy: balanced, quality_threshold: 0.88 }
rag_optimization: { search_type: hybrid, top_k: 10, reranking: true }
context_optimization: { compression_ratio: 0.8, relevance_threshold: 0.65 }
quality_thresholds: { min_quality_score: 0.85 }
```

### Coding Agent (deep reasoning)
```yaml
model_selection: { primary_model: claude-3-opus, strategy: quality_optimized, latency_budget_ms: 5000 }
chain_of_thought: { enabled: true, min_steps: 3, max_steps: 12 }
prompt_compression: { enabled: false }
rag_optimization: { top_k: 15, chunk_size: 800 }
```

### Batch Analytics (throughput + lowest cost)
```yaml
model_selection: { primary_model: gpt-3.5-turbo-16k, strategy: cost_optimized }
request_batching: { max_batch_size: 50, batch_timeout_ms: 500 }
parallel_processing: { max_workers: 32, worker_type: process }
prompt_compression: { enabled: true, target_reduction: 0.45 }
response_caching: { default_ttl: 3600 }
```

---

# 8. General Eval Harness Tuning Loop

1. **Baseline** - Import agent config; run test queries with defaults; record cost, latency, quality.
2. **Isolate** - Change one control at a time in the Control Panel.
3. **Experiment** - Launch an A/B experiment (`ExperimentConfig`) with `control_configs` = [baseline, variant].
4. **Analyze** - Review statistical analysis and recommendations in the Experiment Runner.
5. **Promote** - Export the winning `OptimizationControlsConfig` and deploy via gradual rollout.
6. **Monitor** - Watch dashboards; `auto_optimization` and quality-trend analysis flag regressions.

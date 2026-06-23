---
name: golang-benchmark
description: "Use when compare go benchmark results and explain pprof output; not when another Go skill is a better fit."
metadata:
  category: go
  audience: general-coding-agent
  maturity: draft
  kind: reference
---

# Go Benchmarking

Use this skill when you need to measure, compare, or explain Go performance with benchmarks, profiles, or regression checks.

## Use this skill when

- The task is about benchmark design, benchmark comparisons, pprof output, benchstat, or CI regression detection.
- You need to reason about measurement before choosing an optimization path.
- The request is performance-analysis work, not general debugging.

## Do not use this skill when

- The main problem is a crash, panic, or logic bug rather than measurement.
- You are already in the optimization phase and need code-level tuning patterns instead.
- A broader Go troubleshooting skill is a better first stop.

## Routing boundary

| Situation | Use this skill? | Route instead |
| --- | --- | --- |
| The request is specifically about go benchmarking. | Yes | - |
| The request is better served by an adjacent Go skill. | No | Use [`golang-performance`](../golang-performance/SKILL.md) for optimization patterns and [`golang-troubleshooting`](../golang-troubleshooting/SKILL.md) for bug diagnosis. |

## Guardrails

- Keep the guidance focused on go benchmarking work.
- Prefer the narrower Go skill when the request clearly fits one.
- Do not turn this skill into a generic catch-all.

## Validation

- Run `node skills/skill-authoring/scripts/validate-skill-library.mjs skills/golang-benchmark/SKILL.md`.
- Smoke test:
  - should trigger: "Compare Go benchmark results and explain pprof output."
  - should not trigger: "Debug a Go compile error."

## Examples

- "Compare two Go benchmark runs and tell me whether the regression is real."
- "Help me profile this handler and interpret the hot path before I change code."
- "Set up benchmark regression checks in CI for this Go package."

# Go Benchmarking

Use this skill when you need to measure, compare, or explain Go performance with benchmarks, profiles, or regression checks.

## Use this skill when

- The task is about benchmark design, benchmark comparisons, pprof output, benchstat, or CI regression detection.
- You need to reason about measurement before choosing an optimization path.
- The request is performance-analysis work, not general debugging.

## Do not use this skill when

- The main problem is a crash, panic, or logic bug rather than measurement.
- You are already in the optimization phase and need code-level tuning patterns instead.
- A broader Go troubleshooting skill is a better first stop.

## Routing boundary

| Situation | Use this skill? | Route instead |
| --- | --- | --- |
| The request is specifically about go benchmarking. | Yes | - |
| The request is better served by an adjacent Go skill. | No | Use [`golang-performance`](../golang-performance/SKILL.md) for optimization patterns and [`golang-troubleshooting`](../golang-troubleshooting/SKILL.md) for bug diagnosis. |

## Guardrails

- Keep the guidance focused on go benchmarking work.
- Prefer the narrower Go skill when the request clearly fits one.
- Do not turn this skill into a generic catch-all.

## Validation

- Run `node skills/skill-authoring/scripts/validate-skill-library.mjs skills/golang-benchmark/SKILL.md`.
- Smoke test:
  - should trigger: "Compare Go benchmark results and explain pprof output."
  - should not trigger: "Debug a Go compile error."

## Examples

- "Compare two Go benchmark runs and tell me whether the regression is real."
- "Help me profile this handler and interpret the hot path before I change code."
- "Set up benchmark regression checks in CI for this Go package."

## Reference files

- [`references/benchstat.md`](./references/benchstat.md)
- [`references/ci-regression.md`](./references/ci-regression.md)
- [`references/compiler-analysis.md`](./references/compiler-analysis.md)
- [`references/investigation-session.md`](./references/investigation-session.md)
- [`references/pprof.md`](./references/pprof.md)
- [`references/prometheus-go-metrics.md`](./references/prometheus-go-metrics.md)
- [`references/tools.md`](./references/tools.md)
- [`references/trace.md`](./references/trace.md)
- [`evals/evals.json`](./evals/evals.json)

## Imported content
**Persona:** You are a Go performance measurement engineer. You never draw conclusions from a single benchmark run — statistical rigor and controlled conditions are prerequisites before any optimization decision.

**Thinking mode:** Use `ultrathink` for benchmark analysis, profile interpretation, and performance comparison tasks. Deep reasoning prevents misinterpreting profiling data and ensures statistically sound conclusions.

**Dependencies:**

- benchstat: `go install golang.org/x/perf/cmd/benchstat@latest`

# Go Benchmarking & Performance Measurement

Performance improvement does not exist without measures — if you can measure it, you can improve it.

This skill covers the full measurement workflow: write a benchmark, run it, profile the result, compare before/after with statistical rigor, and track regressions in CI. For optimization patterns to apply after measurement, → See `samber/cc-skills-golang@golang-performance` skill. For pprof setup on running services, → See `samber/cc-skills-golang@golang-troubleshooting` skill.

## Writing Benchmarks

### `b.Loop()` (Go 1.24+) — preferred

For Go 1.24+, prefer `b.Loop()` for new benchmarks. It times only the loop body and keeps function arguments/results alive, which reduces dead-code-elimination mistakes.

```go
func BenchmarkParse(b *testing.B) {
    data := loadFixture("large.json") // setup — excluded from timing
    for b.Loop() {
        Parse(data)  // compiler cannot eliminate this call
    }
}
```

Legacy `b.N` loops still compile and are fine to keep when preserving existing benchmarks or supporting Go <1.24. They are easier to get wrong: setup may need `b.ResetTimer()`, and results may need a sink if the compiler can eliminate the work. Go 1.26 fixed an earlier `b.Loop()` inlining limitation — benchmarks on 1.24–1.25 already benefit from `b.Loop()` but may miss inlining optimizations that 1.26 delivers.

### Memory tracking

```go
func BenchmarkAlloc(b *testing.B) {
    b.ReportAllocs() // or run with -benchmem flag
    var sink []byte
    for b.Loop() {
        sink = make([]byte, 1024)
    }
    _ = sink
}
```

`b.ReportMetric()` adds custom metrics (e.g., throughput):

```go
b.ReportMetric(float64(totalBytes)/b.Elapsed().Seconds(), "bytes/s") // b.Elapsed() is only valid inside b.Loop()
```

### Sub-benchmarks and table-driven

```go
func BenchmarkEncode(b *testing.B) {
    for _, size := range []int{64, 256, 4096} {
        b.Run(fmt.Sprintf("size=%d", size), func(b *testing.B) {
            data := make([]byte, size)
            for b.Loop() {
                Encode(data)
            }
        })
    }
}
```

## Running Benchmarks

```bash
go test -bench=BenchmarkEncode -benchmem -count=10 ./pkg/... | tee bench.txt
```

| Flag                   | Purpose                                   |
| ---------------------- | ----------------------------------------- |
| `-bench=.`             | Run all benchmarks (regexp filter)        |
| `-benchmem`            | Report allocations (B/op, allocs/op)      |
| `-count=10`            | Run 10 times for statistical significance |
| `-benchtime=3s`        | Minimum time per benchmark (default 1s)   |
| `-cpu=1,2,4`           | Run with different GOMAXPROCS values      |
| `-cpuprofile=cpu.prof` | Write CPU profile                         |
| `-memprofile=mem.prof` | Write memory profile                      |
| `-trace=trace.out`     | Write execution trace                     |

**Output format:** `BenchmarkEncode/size=64-8  5000000  230.5 ns/op  128 B/op  2 allocs/op` — the `-8` suffix is GOMAXPROCS, `ns/op` is time per operation, `B/op` is bytes allocated per op, `allocs/op` is heap allocation count per op.

## Documenting Results in Commits

Paste benchstat output in the commit body when the change has a measurable performance impact. This documents _why_ an optimization was made, prevents future readers from reverting it, and lets reviewers verify the claim without re-running benchmarks.

Commit format:

```
perf(parser): reduce Parse allocations 50% with sync.Pool

Replace per-call []byte allocation with a pooled buffer.

goos: linux / goarch: amd64 / cpu: AMD Ryzen 9 5950X
          │    old     │              new               │
          │  sec/op    │  sec/op     vs base            │
Parse-32    4.592µ ± 2%  3.041µ ± 1%  -33.78% (p=0.000 n=10)

          │   old    │             new              │
          │   B/op   │   B/op     vs base           │
Parse-32   1.024Ki ± 0%  0.512Ki ± 0%  -50.00% (p=0.000 n=10)

          │ old  │            new             │
          │ allocs/op │ allocs/op  vs base    │
Parse-32   12.00 ± 0%   6.000 ± 0%  -50.00% (p=0.000 n=10)
```

**Rules:**

- Only include benchmarks directly affected by the change — strip unrelated rows
- Never paste results with `~` (no statistical significance) — the improvement cannot be claimed
- Include the hardware context line (`goos/goarch/cpu`) so results are reproducible
- Use `perf(scope):` commit type for performance-only changes

## Profiling from Benchmarks

Generate profiles directly from benchmark runs — no HTTP server needed:

```bash
# CPU profile
go test -bench=BenchmarkParse -cpuprofile=cpu.prof ./pkg/parser
go tool pprof cpu.prof

# Memory profile (alloc_objects shows GC churn, inuse_space shows leaks)
go test -bench=BenchmarkParse -memprofile=mem.prof ./pkg/parser
go tool pprof -alloc_objects mem.prof

# Execution trace
go test -bench=BenchmarkParse -trace=trace.out ./pkg/parser
go tool trace trace.out
```

For full pprof CLI reference (all commands, non-interactive mode, profile interpretation), see [pprof Reference](./references/pprof.md). For execution trace interpretation, see [Trace Reference](./references/trace.md). For statistical comparison, see [benchstat Reference](./references/benchstat.md).

## Reference Files

- **[pprof Reference](./references/pprof.md)** — Interactive and non-interactive analysis of CPU, memory, and goroutine profiles. Full CLI commands, profile types (CPU vs alloc*objects vs inuse_space), web UI navigation, and interpretation patterns. Use this to dive deep into \_where* time and memory are being spent in your code.

- **[benchstat Reference](./references/benchstat.md)** — Statistical comparison of benchmark runs with rigorous confidence intervals and p-value tests. Covers output reading, filtering old benchmarks, interleaving results for visual clarity, and regression detection. Use this when you need to prove a change made a meaningful performance difference, not just a lucky run.

- **[Trace Reference](./references/trace.md)** — Execution tracer for understanding _when_ and _why_ code runs. Visualizes goroutine scheduling, garbage collection phases, network blocking, and custom span annotations. Use this when pprof (which shows _where_ CPU goes) isn't enough — you need to see the timeline of what happened.

- **[Diagnostic Tools](./references/tools.md)** — Quick reference for ancillary tools: fieldalignment (struct padding waste), GODEBUG (runtime logging flags), fgprof (frame graph profiles), race detector (concurrency bugs), and others. Use this when you have a specific symptom and need a focused diagnostic — don't reach for pprof if a simpler tool already answers your question.

- **[Compiler Analysis](./references/compiler-analysis.md)** — Low-level compiler optimization insights: escape analysis (when values move to the heap), inlining decisions (which function calls are eliminated), SSA dump (intermediate representation), and assembly output. Use this when benchmarks show allocations you didn't expect, or when you want to verify the compiler did what you intended.

- **[CI Regression Detection](./references/ci-regression.md)** — Automated performance regression gating in CI pipelines. Covers three tools (benchdiff for quick PR comparisons, cob for strict threshold-based gating, gobenchdata for long-term trend dashboards), noisy neighbor mitigation strategies (why cloud CI benchmarks vary 5-10% even on quiet machines), and self-hosted runner tuning to make benchmarks reproducible. Use this when you want to ensure pull requests don't silently slow down your codebase — detecting regressions early prevents shipping performance debt.

- **[Investigation Session](./references/investigation-session.md)** — Production performance troubleshooting workflow combining Prometheus runtime metrics (heap size, GC frequency, goroutine counts), PromQL queries to correlate metrics with code changes, runtime configuration flags (GODEBUG env vars to enable GC logging), and cost warnings (when you're hitting performance tax). Use this when production benchmarks look good but real traffic behaves differently.

- **[Prometheus Go Metrics Reference](./references/prometheus-go-metrics.md)** — Complete listing of Go runtime metrics actually exposed as Prometheus metrics by `prometheus/client_golang`. Covers 30 default metrics, 40+ optional metrics (Go 1.17+), process metrics, and common PromQL queries. Distinguishes between `runtime/metrics` (Go internal data) and Prometheus metrics (what you scrape from `/metrics`). Use this when setting up monitoring dashboards or writing PromQL queries for production alerts.

## Cross-References

- → See `samber/cc-skills-golang@golang-performance` skill for optimization patterns to apply after measuring ("if X bottleneck, apply Y")
- → See `samber/cc-skills-golang@golang-troubleshooting` skill for pprof setup on running services (enable, secure, capture), Delve debugger, GODEBUG flags, root cause methodology
- → See `samber/cc-skills-golang@golang-observability` skill for everyday always-on monitoring, continuous profiling (Pyroscope), distributed tracing (OpenTelemetry)
- → See `samber/cc-skills-golang@golang-testing` skill for general testing practices
- → See `samber/cc-skills@promql-cli` skill for querying Prometheus runtime metrics in production to validate benchmark findings



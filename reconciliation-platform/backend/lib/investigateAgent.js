/**
 * Deterministic "agentic" investigate loop.
 *
 * Stub-first: no LLM calls. We simulate an investigation loop by iteratively running
 * small diagnostic functions ("tool calls") over the already-computed breaks + datasets.
 *
 * Evidence must be derived directly from deterministic analysis of the diff/break records.
 */

import { valueMatches } from "./compare.js";

const SUPPORTED_DETERMINISTIC_RULE_TYPES = new Set(["numeric_tolerance", "exact"]);

function tryParseNumber(value) {
  if (value == null) return null;
  const s = String(value).trim();
  if (!s) return null;
  const n = parseFloat(s);
  if (Number.isNaN(n)) return null;
  return n;
}

function normalizeKey(value) {
  return value != null ? String(value).trim() : "";
}

function safeMedian(nums) {
  if (!Array.isArray(nums) || nums.length === 0) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) return (sorted[mid - 1] + sorted[mid]) / 2;
  return sorted[mid];
}

function takeSample(arr, max = 3) {
  if (!Array.isArray(arr)) return [];
  return arr.slice(0, max);
}

function countBy(arr, keyFn) {
  const out = {};
  for (const x of arr) {
    const k = keyFn(x);
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

function computeOutcomeDistribution(breaks) {
  const counts = countBy(breaks || [], (b) => b.outcome || "unknown");
  const total = (breaks || []).length || 0;
  return {
    total,
    counts,
  };
}

function computeMismatchFieldFrequency(mismatchBreaks) {
  const freq = {};
  const totalMismatchBreaks = mismatchBreaks.length;

  for (const b of mismatchBreaks) {
    const fields = Array.isArray(b.differingFields) ? b.differingFields : [];
    for (const f of fields) {
      freq[f] = (freq[f] ?? 0) + 1;
    }
  }

  const topFields = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([field, count]) => ({ field, count }));

  return {
    totalMismatchBreaks,
    topFields,
  };
}

function computeUnsupportedRuleTypes(valueFields) {
  const unsupported = [];
  for (const vf of valueFields || []) {
    const ruleType = typeof vf === "object" ? vf.ruleType : "exact";
    const fieldName = typeof vf === "object" ? vf.name : String(vf);
    if (ruleType && !SUPPORTED_DETERMINISTIC_RULE_TYPES.has(ruleType)) {
      unsupported.push({ field: fieldName, ruleType });
    }
  }

  // De-duplicate by field+ruleType.
  const key = (x) => `${x.field}::${x.ruleType}`;
  const uniq = [];
  const seen = new Set();
  for (const x of unsupported) {
    const k = key(x);
    if (seen.has(k)) continue;
    seen.add(k);
    uniq.push(x);
  }

  return {
    unsupportedRules: uniq,
    unsupportedCount: uniq.length,
  };
}

function computeNumericToleranceStats(mismatchBreaks, valueFields) {
  const numericVF = (valueFields || []).filter((vf) => typeof vf === "object" && vf.ruleType === "numeric_tolerance");
  const byField = {};

  for (const vf of numericVF) {
    const field = vf.name;
    const tol = Number(vf.params?.tolerance) || 0;
    byField[field] = {
      tolerance: tol,
      parseablePairs: 0,
      nonParseablePairs: 0,
      overTolerancePairs: 0,
      absDiffs: [],
      samples: [],
    };
  }

  for (const b of mismatchBreaks) {
    const differing = Array.isArray(b.differingFields) ? b.differingFields : [];
    // Only analyze fields we actually configured.
    for (const field of differing) {
      if (!byField[field]) continue;
      const aRaw = b.sideA?.[field];
      const cRaw = b.sideB?.[field];
      const a = tryParseNumber(aRaw);
      const c = tryParseNumber(cRaw);
      if (a == null || c == null) {
        byField[field].nonParseablePairs += 1;
        continue;
      }
      const absDiff = Math.abs(a - c);
      byField[field].parseablePairs += 1;
      byField[field].absDiffs.push(absDiff);
      if (absDiff > byField[field].tolerance) {
        byField[field].overTolerancePairs += 1;
      }
      if (byField[field].samples.length < 3) {
        byField[field].samples.push({
          key: b.key,
          sideA: aRaw,
          sideB: cRaw,
          absDiff,
          tolerance: byField[field].tolerance,
        });
      }
    }
  }

  const perField = Object.entries(byField).map(([field, stats]) => {
    const medianAbsDiff = safeMedian(stats.absDiffs);
    const averageAbsDiff =
      stats.absDiffs.length > 0 ? stats.absDiffs.reduce((acc, x) => acc + x, 0) / stats.absDiffs.length : null;
    const percentOverTolerance =
      stats.parseablePairs > 0 ? stats.overTolerancePairs / stats.parseablePairs : 0;
    return {
      field,
      tolerance: stats.tolerance,
      parseablePairs: stats.parseablePairs,
      nonParseablePairs: stats.nonParseablePairs,
      overTolerancePairs: stats.overTolerancePairs,
      percentOverTolerance,
      medianAbsDiff,
      averageAbsDiff,
      samples: stats.samples,
    };
  });

  // Top fields by "percent over tolerance" then by parseablePairs.
  const topNumericFields = [...perField]
    .sort((a, b) => (b.percentOverTolerance - a.percentOverTolerance) || (b.parseablePairs - a.parseablePairs))
    .slice(0, 5);

  return {
    analyzedFields: perField.length,
    topNumericFields,
    perField,
  };
}

function computeOrphanSamples(breaks, maxPerOutcome = 3) {
  const orphansA = breaks.filter((b) => b.outcome === "orphan_a");
  const orphansB = breaks.filter((b) => b.outcome === "orphan_b");

  const sampleA = takeSample(
    orphansA.map((b) => ({
      key: b.key,
      sideA: b.sideA ?? null,
    })),
    maxPerOutcome
  );

  const sampleB = takeSample(
    orphansB.map((b) => ({
      key: b.key,
      sideB: b.sideB ?? null,
    })),
    maxPerOutcome
  );

  return {
    orphanCountA: orphansA.length,
    orphanCountB: orphansB.length,
    sampleA,
    sampleB,
  };
}

function computeDuplicateKeySamples(breaks, maxPerOutcome = 3) {
  const dup = breaks.filter((b) => b.outcome === "duplicate_key");
  const sample = takeSample(
    dup.map((b) => ({ key: b.key, sideA: b.sideA ?? null, sideB: b.sideB ?? null })),
    maxPerOutcome
  );

  return {
    duplicateKeyCount: dup.length,
    sample,
  };
}

function computeNumericFieldCoverage(valueFields) {
  const numericFields = (valueFields || [])
    .filter((vf) => typeof vf === "object" && vf.ruleType === "numeric_tolerance")
    .map((vf) => vf.name)
    .filter(Boolean);
  return { numericFields };
}

function getValueFieldSpec(valueField) {
  if (typeof valueField === "string") return { name: valueField, ruleType: "exact", params: {} };
  return {
    name: valueField.name,
    ruleType: valueField.ruleType || "exact",
    params: valueField.params || {},
  };
}

function rowMatchesValueFields(presentRow, candidateRow, valueFields) {
  const matchedFields = [];
  const valueFieldSpecs = valueFields || [];

  for (const vf of valueFieldSpecs) {
    const { name, ruleType, params } = getValueFieldSpec(vf);
    const presentVal = presentRow?.[name];
    const candidateVal = candidateRow?.[name];
    const ok = valueMatches(presentVal, candidateVal, ruleType, params);
    if (!ok) return { matched: false, matchedFields };
    matchedFields.push(name);
  }

  return { matched: true, matchedFields };
}

function findHistoricalOrphanProposals({
  keyField,
  valueFields,
  breaks,
  historyRuns,
  currentRunId,
  maxProposalsPerBreak = 3,
}) {
  const orphanBreaks = (breaks || []).filter((b) => b.outcome === "orphan_a" || b.outcome === "orphan_b");

  const proposals = [];

  const orphanKeyMatches = (b) => normalizeKey(b?.key);

  for (const b of orphanBreaks) {
    const orphanKey = orphanKeyMatches(b);
    if (!orphanKey) continue;

    const isOrphanA = b.outcome === "orphan_a";
    const presentRow = isOrphanA ? (b.sideA && !Array.isArray(b.sideA) ? b.sideA : b.sideA?.[0]) : (b.sideB && !Array.isArray(b.sideB) ? b.sideB : b.sideB?.[0]);
    if (!presentRow) continue;

    // What we're trying to fill:
    // - orphan_a => missing sideB => candidate rows come from history sideB
    // - orphan_b => missing sideA => candidate rows come from history sideA
    const sideToFill = isOrphanA ? "sideB" : "sideA";
    const candidateSide = isOrphanA ? "sideB" : "sideA";

    const breakProposals = [];

    for (let runIndex = 0; runIndex < (historyRuns || []).length; runIndex++) {
      const hr = historyRuns[runIndex];
      const candidateRows = Array.isArray(hr?.[candidateSide]) ? hr[candidateSide] : [];

      // Deterministic key lookup: exact match on normalized keyField value.
      const matchingKeyRows = candidateRows.filter((row) => normalizeKey(row?.[keyField]) === orphanKey);
      if (matchingKeyRows.length === 0) continue;

      for (const candidateRow of matchingKeyRows) {
        const { matched, matchedFields } = rowMatchesValueFields(presentRow, candidateRow, valueFields);
        if (!matched) continue;

        breakProposals.push({
          id: `prop-${currentRunId}-${b.id}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          runId: currentRunId,
          breakId: b.id,
          originalOutcome: b.outcome,
          sideToFill,
          candidate: {
            priorRunId: hr.runId,
            priorStartedAt: hr.startedAt,
            key: orphanKey,
            row: candidateRow,
          },
          evidence: {
            keyField,
            matchedValueFields: matchedFields,
            matchType: "deterministic_all_value_fields",
            recencyRank: runIndex + 1,
          },
          status: "pending",
        });

        if (breakProposals.length >= maxProposalsPerBreak) break;
      }

      if (breakProposals.length >= maxProposalsPerBreak) break;
    }

    proposals.push(...breakProposals);
  }

  return proposals;
}

export function runInvestigation({
  runId,
  reconciliationTypeId,
  config,
  breaks,
  sideARows,
  sideBRows,
  goal = "",
  historyRuns = [],
  daysBack = 7,
}) {
  const keyField = config?.keyField || "transaction_id";
  const valueFields = config?.valueFields || [];
  const mismatchBreaks = (breaks || []).filter((b) => b.outcome === "mismatch");
  const orphanBreaks = (breaks || []).filter((b) => b.outcome === "orphan_a" || b.outcome === "orphan_b");
  const duplicateBreaks = (breaks || []).filter((b) => b.outcome === "duplicate_key");

  const steps = [];
  const hypotheses = [];

  // Evidence snapshot, updated by "tool calls".
  const evidence = {
    outcome: null,
    mismatchFieldFreq: null,
    numericToleranceStats: null,
    orphanSamples: null,
    duplicateKeySamples: null,
    unsupportedRules: null,
  };

  const maxIterations = 4;
  let ran = new Set();

  // The "agentic loop": choose the next diagnostic function based on what evidence is missing.
  const diagnosticPlan = [
    {
      id: "outcome_distribution",
      shouldRun: () => true,
      run: () => {
        const res = computeOutcomeDistribution(breaks);
        evidence.outcome = res;
        return {
          label: "Outcome distribution",
          result: res,
        };
      },
    },
    {
      id: "mismatch_field_frequency",
      shouldRun: () => mismatchBreaks.length > 0 && evidence.mismatchFieldFreq == null,
      run: () => {
        const res = computeMismatchFieldFrequency(mismatchBreaks);
        evidence.mismatchFieldFreq = res;
        return {
          label: "Mismatched field frequency",
          result: res,
        };
      },
    },
    {
      id: "orphan_sampling",
      shouldRun: () => orphanBreaks.length > 0 && evidence.orphanSamples == null,
      run: () => {
        const res = computeOrphanSamples(breaks);
        evidence.orphanSamples = res;
        return {
          label: "Orphan sampling (A-only / B-only)",
          result: res,
        };
      },
    },
    {
      id: "duplicate_key_sampling",
      shouldRun: () => duplicateBreaks.length > 0 && evidence.duplicateKeySamples == null,
      run: () => {
        const res = computeDuplicateKeySamples(breaks);
        evidence.duplicateKeySamples = res;
        return {
          label: "Duplicate-key sampling",
          result: res,
        };
      },
    },
    {
      id: "numeric_tolerance_stats",
      shouldRun: () => mismatchBreaks.length > 0 && evidence.numericToleranceStats == null,
      run: () => {
        const res = computeNumericToleranceStats(mismatchBreaks, valueFields);
        evidence.numericToleranceStats = res;
        return {
          label: "Numeric tolerance stats (for configured numeric_tolerance fields)",
          result: res,
        };
      },
    },
    {
      id: "unsupported_rule_detection",
      shouldRun: () => evidence.unsupportedRules == null,
      run: () => {
        const res = computeUnsupportedRuleTypes(valueFields);
        evidence.unsupportedRules = res;
        return {
          label: "Unsupported rule types configured (deterministic comparator coverage)",
          result: res,
        };
      },
    },
  ];

  for (let i = 0; i < maxIterations; i++) {
    // Pick the highest-priority diagnostic whose predicate is satisfied and hasn't run yet.
    const next = diagnosticPlan.find((d) => !ran.has(d.id) && d.shouldRun());
    if (!next) break;

    const result = next.run();
    ran.add(next.id);
    steps.push({
      id: `step-${i + 1}-${next.id}`,
      type: next.id,
      ...result,
    });
  }

  // Always ensure we have core evidence for hypothesis ranking.
  if (!evidence.outcome) {
    const res = computeOutcomeDistribution(breaks);
    evidence.outcome = res;
    steps.push({
      id: "step-core-outcome",
      type: "outcome_distribution",
      label: "Outcome distribution",
      result: res,
    });
  }
  if (!evidence.unsupportedRules) {
    const res = computeUnsupportedRuleTypes(valueFields);
    evidence.unsupportedRules = res;
    steps.push({
      id: "step-core-unsupported-rules",
      type: "unsupported_rule_detection",
      label: "Unsupported rule types configured (deterministic comparator coverage)",
      result: res,
    });
  }

  const total = evidence.outcome?.total ?? (breaks || []).length ?? 0;
  const outcomeCounts = evidence.outcome?.counts || {};
  const mismatches = outcomeCounts["mismatch"] ?? 0;
  const orphanA = outcomeCounts["orphan_a"] ?? 0;
  const orphanB = outcomeCounts["orphan_b"] ?? 0;
  const dupCount = outcomeCounts["duplicate_key"] ?? 0;

  const unsupportedRules = evidence.unsupportedRules?.unsupportedRules || [];
  const orphanTotal = orphanA + orphanB;
  const mismatchRate = total > 0 ? mismatches / total : 0;
  const orphanRate = total > 0 ? orphanTotal / total : 0;
  const dupRate = total > 0 ? dupCount / total : 0;

  const topNumeric = evidence.numericToleranceStats?.topNumericFields || [];
  const topNumericOver = topNumeric[0]?.percentOverTolerance ?? 0;

  const numericConfigured = computeNumericFieldCoverage(valueFields);
  const numericConfiguredCount = numericConfigured.numericFields.length;

  // Hypothesis 1: orphan pattern
  if (orphanTotal > 0) {
    const sampleKeys = [...(evidence.orphanSamples?.sampleA || []).map((x) => x.key), ...(evidence.orphanSamples?.sampleB || []).map((x) => x.key)];
    hypotheses.push({
      id: "hyp-orphans",
      title: "Orphan keys indicate key alignment or join mismatch",
      confidence: Math.min(0.95, 0.35 + orphanRate),
      evidence: {
        summary: `Found ${orphanTotal} orphan keys across A-only (${orphanA}) and B-only (${orphanB}).`,
        details: {
          sampleKeys: takeSample(sampleKeys, 5),
          samplesA: evidence.orphanSamples?.sampleA || [],
          samplesB: evidence.orphanSamples?.sampleB || [],
          note: "Breaks are classified as orphans when a key exists only on one side; this often points to mismatched IDs or missing rows rather than value differences.",
        },
      },
      recommendedNextSteps: [
        "Verify `keyField` values are formatted/trimmed consistently across both exports (IDs, leading zeros, casing).",
        "If one system aggregates/deduplicates differently, consider adding a mapping/allowlist reconciliation rule for the key.",
      ],
    });
  }

  // Hypothesis 2: numeric tolerance mismatches
  if (mismatches > 0 && numericConfiguredCount > 0 && topNumeric.length > 0 && topNumericOver > 0) {
    const f = topNumeric[0];
    hypotheses.push({
      id: "hyp-numeric-tolerance",
      title: "Numeric differences exceed configured tolerance for key value fields",
      confidence: Math.min(0.92, 0.35 + mismatchRate * (0.4 + topNumericOver)),
      evidence: {
        summary: `For field "${f.field}": ${f.overTolerancePairs}/${f.parseablePairs} parseable mismatch pairs are over tolerance (tolerance=${f.tolerance}).`,
        details: {
          medianAbsDiff: f.medianAbsDiff,
          averageAbsDiff: f.averageAbsDiff,
          percentOverTolerance: f.percentOverTolerance,
          samples: f.samples,
        },
      },
      recommendedNextSteps: [
        "Check whether amounts use the same units/currency and whether exports round at different precision.",
        "If small rounding drift is expected, increase `tolerance` for the numeric field(s).",
      ],
    });
  }

  // Hypothesis 3: duplicate-key classification
  if (dupCount > 0) {
    hypotheses.push({
      id: "hyp-duplicate-key",
      title: "Duplicate keys prevent a 1-row-per-key comparison",
      confidence: Math.min(0.9, 0.3 + dupRate),
      evidence: {
        summary: `Found ${dupCount} duplicate-key break(s).`,
        details: {
          sample: evidence.duplicateKeySamples?.sample || [],
          note: "Duplicates are classified when a key appears multiple times on one or both sides; investigate upstream aggregation/deduplication.",
        },
      },
      recommendedNextSteps: [
        "Ensure both datasets are aggregated/deduplicated to a single row per key before upload.",
        "If you need mapping/combining, add a reconciliation type that normalizes multiple rows for the same key.",
      ],
    });
  }

  // Hypothesis 4: unsupported rule types configured
  if (unsupportedRules.length > 0) {
    hypotheses.push({
      id: "hyp-unsupported-rules",
      title: "Configured reconciliation rule types are not fully implemented in the deterministic comparator",
      confidence: Math.min(0.85, 0.25 + Math.min(1, unsupportedRules.length / 5)),
      evidence: {
        summary: `Unsupported rule types detected: ${unsupportedRules
          .slice(0, 5)
          .map((r) => `${r.field}:${r.ruleType}`)
          .join(", ")}.`,
        details: {
          unsupportedRules,
          supportedRuleTypes: [...SUPPORTED_DETERMINISTIC_RULE_TYPES],
          note: "The comparator currently implements numeric_tolerance and exact matching; other rule types fall back to exact-style comparisons.",
        },
      },
      recommendedNextSteps: [
        "Either restrict reconciliation configurations to supported rule types (exact, numeric_tolerance), or implement the remaining rule types in `lib/compare.js`.",
        "After implementing, re-run the same compare inputs to validate that break classifications change as expected.",
      ],
    });
  }

  // Fallback if we produced too few hypotheses.
  if (hypotheses.length === 0) {
    const topField = evidence.mismatchFieldFreq?.topFields?.[0]?.field ?? null;
    hypotheses.push({
      id: "hyp-generic-mismatch",
      title: "Mismatch patterns require additional field-level diagnostics",
      confidence: 0.45,
      evidence: {
        summary: `No strong deterministic evidence patterns were detected (total breaks: ${total}).${
          topField ? ` Top differing field: "${topField}".` : ""
        }`,
      },
      recommendedNextSteps: [
        "Add more value fields to the reconciliation config and re-run the compare.",
        "Inspect the mismatches list and verify that both datasets use the same key mapping and data types.",
      ],
    });
  }

  // Rank hypotheses by confidence descending.
  hypotheses.sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0));

  // Historical orphan-to-orphan proposals with deterministic valueFields matching.
  // This produces "agentic follow-up" actions: a structured next action the human can accept/reject.
  const matchProposals = findHistoricalOrphanProposals({
    keyField,
    valueFields,
    breaks,
    historyRuns,
    currentRunId: runId,
    maxProposalsPerBreak: 3,
  });

  return {
    investigation: {
      runId,
      reconciliationTypeId,
      goal: goal || "Investigate reconciliation breaks",
    },
    steps,
    hypotheses,
    matchProposals,
  };
}


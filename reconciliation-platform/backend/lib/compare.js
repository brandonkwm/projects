/**
 * Compare two datasets (Side A and Side B) by key and value fields.
 * Returns { matches, breaks } where breaks have outcome, sideA, sideB, differingFields.
 * Explanations are generated deterministically from the diff (no LLM guessing).
 */

export function compare(sideARows, sideBRows, config) {
  const keyField = config.keyField || "id";
  const valueFields = config.valueFields || [];

  const byKeyA = indexByKey(sideARows, keyField);
  const byKeyB = indexByKey(sideBRows, keyField);
  const allKeys = new Set([...Object.keys(byKeyA), ...Object.keys(byKeyB)]);

  const matches = [];
  const breaks = [];

  for (const key of allKeys) {
    const rowsA = byKeyA[key];
    const rowsB = byKeyB[key];

    if (!rowsA?.length) {
      breaks.push({
        key,
        outcome: "orphan_b",
        sideA: null,
        sideB: rowsB.length === 1 ? rowsB[0] : rowsB,
        differingFields: [],
      });
      continue;
    }
    if (!rowsB?.length) {
      breaks.push({
        key,
        outcome: "orphan_a",
        sideA: rowsA.length === 1 ? rowsA[0] : rowsA,
        sideB: null,
        differingFields: [],
      });
      continue;
    }

    if (rowsA.length > 1 || rowsB.length > 1) {
      breaks.push({
        key,
        outcome: "duplicate_key",
        sideA: rowsA.length === 1 ? rowsA[0] : rowsA,
        sideB: rowsB.length === 1 ? rowsB[0] : rowsB,
        differingFields: [],
      });
      continue;
    }

    const rowA = rowsA[0];
    const rowB = rowsB[0];
    const differingFields = [];
    for (const vf of valueFields) {
      const name = typeof vf === "string" ? vf : vf.name;
      const rule = typeof vf === "object" ? vf : {};
      const ruleType = rule.ruleType || "exact";
      const params = rule.params || {};
      const aVal = rowA[name];
      const bVal = rowB[name];
      if (!valueMatches(aVal, bVal, ruleType, params)) differingFields.push(name);
    }

    if (differingFields.length === 0) {
      matches.push({ key, sideA: rowA, sideB: rowB });
    } else {
      breaks.push({
        key,
        outcome: "mismatch",
        sideA: rowA,
        sideB: rowB,
        differingFields,
      });
    }
  }

  return { matches, breaks };
}

function indexByKey(rows, keyField) {
  const out = {};
  for (const row of rows) {
    const k = row[keyField] != null ? String(row[keyField]).trim() : "";
    if (!k) continue;
    if (!out[k]) out[k] = [];
    out[k].push(row);
  }
  return out;
}

function valueMatches(aVal, bVal, ruleType, params) {
  const a = aVal != null ? String(aVal).trim() : "";
  const b = bVal != null ? String(bVal).trim() : "";
  if (ruleType === "numeric_tolerance") {
    const numA = parseFloat(a);
    const numB = parseFloat(b);
    if (Number.isNaN(numA) || Number.isNaN(numB)) return a === b;
    const tol = Number(params.tolerance) || 0;
    return Math.abs(numA - numB) <= tol;
  }
  if (ruleType === "exact" || !ruleType) return a === b;
  return a === b;
}

/**
 * Generate a deterministic explanation from the break (no guessing e.g. "FX").
 */
export function explainBreak(breakRecord, valueFieldsConfig) {
  const { key, outcome, sideA, sideB, differingFields } = breakRecord;
  const steps = [];
  let text;

  if (outcome === "orphan_a") {
    steps.push(`Key ${key} present on Side A only; no row with this key on Side B.`);
    steps.push("Classified as orphan (A-only).");
    text = `Orphan on Side A: key ${key} has no matching row on Side B.`;
  } else if (outcome === "orphan_b") {
    steps.push(`Key ${key} present on Side B only; no row with this key on Side A.`);
    steps.push("Classified as orphan (B-only).");
    text = `Orphan on Side B: key ${key} has no matching row on Side A.`;
  } else if (outcome === "duplicate_key") {
    steps.push(`Key ${key} has multiple rows on one or both sides.`);
    text = `Duplicate key: ${key} appears more than once on one side; cannot compare single row.`;
  } else {
    for (const field of differingFields) {
      const va = sideA?.[field] != null ? sideA[field] : "(missing)";
      const vb = sideB?.[field] != null ? sideB[field] : "(missing)";
      steps.push(`Field '${field}': Side A = ${va}, Side B = ${vb}.`);
    }
    const fieldList = differingFields.join(", ");
    text = `Mismatch on field(s): ${fieldList}. Values differ as shown above (deterministic comparison; no inference).`;
  }

  return {
    text,
    reasoningSteps: steps,
    inputContext: { key, sideA: sideA ?? null, sideB: sideB ?? null, differingFields },
  };
}

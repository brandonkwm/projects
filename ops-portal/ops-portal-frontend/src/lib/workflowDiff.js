/**
 * Flatten nested workflow JSON into dot paths for audit before/after maps.
 */

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

export function flattenForAudit(value, prefix = '') {
  if (value === undefined) {
    return prefix ? { [prefix]: null } : {};
  }
  if (value === null) {
    return prefix ? { [prefix]: null } : {};
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return prefix ? { [prefix]: value } : {};
  }
  if (value instanceof Date) {
    return prefix ? { [prefix]: value.toISOString() } : {};
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return prefix ? { [prefix]: [] } : {};
    }
    return value.reduce((acc, item, i) => {
      const path = prefix ? `${prefix}[${i}]` : `[${i}]`;
      const inner = flattenForAudit(item, path);
      return { ...acc, ...inner };
    }, {});
  }
  if (isPlainObject(value)) {
    const keys = Object.keys(value).sort();
    if (keys.length === 0) {
      return prefix ? { [prefix]: {} } : {};
    }
    return keys.reduce((acc, key) => {
      const path = prefix ? `${prefix}.${key}` : key;
      const inner = flattenForAudit(value[key], path);
      return { ...acc, ...inner };
    }, {});
  }
  return prefix ? { [prefix]: String(value) } : {};
}

function stableStringify(v) {
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

/**
 * Returns only keys that differ between two flattened snapshots.
 */
export function diffFlatMaps(beforeFlat, afterFlat) {
  const keys = new Set([...Object.keys(beforeFlat), ...Object.keys(afterFlat)]);
  const beforeOut = {};
  const afterOut = {};
  for (const k of [...keys].sort()) {
    if (stableStringify(beforeFlat[k]) !== stableStringify(afterFlat[k])) {
      beforeOut[k] = beforeFlat[k] !== undefined ? beforeFlat[k] : null;
      afterOut[k] = afterFlat[k] !== undefined ? afterFlat[k] : null;
    }
  }
  return { beforeFlat: beforeOut, afterFlat: afterOut };
}

/** Strip volatile fields before diffing workflow records. */
export function workflowForDiff(workflow) {
  if (!workflow || typeof workflow !== 'object') return {};
  const { updatedAt, ...rest } = workflow;
  return rest;
}

export function diffWorkflowRecords(beforeWorkflow, afterWorkflow) {
  const b = flattenForAudit(workflowForDiff(beforeWorkflow || {}));
  const a = flattenForAudit(workflowForDiff(afterWorkflow || {}));
  return diffFlatMaps(b, a);
}

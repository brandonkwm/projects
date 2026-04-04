/**
 * Append-only workflow change audit log (MVP: localStorage).
 */
const STORAGE_KEY = 'ops-portal-workflow-audit-log';

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function writeAll(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function newEntryId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `audit_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * @param {object} entry
 * @param {string} entry.workflowId
 * @param {string} entry.source - e.g. 'save' (legacy entries may use other values)
 * @param {string} entry.atUtc - ISO UTC
 * @param {string} entry.atLocalDisplay
 * @param {string} entry.timezone - IANA zone
 * @param {{ id: string, displayName: string }} entry.actor
 * @param {Record<string, unknown>} entry.beforeFlat
 * @param {Record<string, unknown>} entry.afterFlat
 * @param {string[]} [entry.summaryLines]
 */
export function appendWorkflowAuditEntry(entry) {
  const list = readAll();
  list.push({
    id: newEntryId(),
    ...entry,
  });
  writeAll(list);
}

export function getWorkflowAuditEntries(workflowId) {
  if (!workflowId) return [];
  return readAll()
    .filter((e) => e.workflowId === workflowId)
    .sort((a, b) => String(b.atUtc).localeCompare(String(a.atUtc)));
}

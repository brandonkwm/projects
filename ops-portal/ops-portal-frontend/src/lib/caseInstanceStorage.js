/**
 * Case instances = work items for human agents.
 * MVP: localStorage. Replace with API when backend is ready.
 *
 * Case instance shape:
 * - id, caseTemplateId, title, status ('open'|'completed'), fields, createdAt, updatedAt, completedAt?
 * - executionTrace?: { workflowId: string, nodeIds: string[] } — set by workflow engine; order of node IDs visited for "Trace case" visual debug.
 */

const STORAGE_KEY = 'ops-portal-case-instances';

export function getAllCaseInstances() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function getCaseInstanceById(id) {
  return getAllCaseInstances().find((c) => c.id === id) ?? null;
}

export function getOpenCaseInstances() {
  return getAllCaseInstances().filter((c) => c.status === 'open');
}

export function saveCaseInstance(caseInstance) {
  const list = getAllCaseInstances();
  const updated = {
    ...caseInstance,
    updatedAt: new Date().toISOString(),
  };
  const idx = list.findIndex((c) => c.id === caseInstance.id);
  const next = idx >= 0 ? [...list] : [...list, updated];
  if (idx >= 0) next[idx] = updated;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return updated;
}

export function completeCaseInstance(id, fields) {
  const list = getAllCaseInstances();
  const caseInstance = list.find((c) => c.id === id);
  if (!caseInstance) return null;
  const updated = {
    ...caseInstance,
    status: 'completed',
    fields: { ...(caseInstance.fields || {}), ...fields },
    completedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const next = list.map((c) => (c.id === id ? updated : c));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return updated;
}

export function createCaseInstance({ caseTemplateId, title, fields = {} }) {
  const list = getAllCaseInstances();
  const id = `case-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const created = {
    id,
    caseTemplateId,
    title: title || `Case ${id}`,
    status: 'open',
    fields,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  list.push(created);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  return created;
}

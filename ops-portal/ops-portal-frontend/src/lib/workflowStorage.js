/**
 * Workflow persistence (MVP: localStorage).
 * Swap this for an API client when you have a backend.
 */

const STORAGE_KEY = 'ops-portal-workflows';

/**
 * @typedef {Object} WorkflowDefinition
 * @property {string} id - Unique ID used by upstream to trigger (e.g. POST /workflows/{id}/run)
 * @property {string} name
 * @property {string} [description]
 * @property {string} [requestBodyDescription] - Optional note on expected JSON request body
 * @property {string} updatedAt - ISO date string
 * @property {Object} definition - { nodes, edges } from the builder
 */

/**
 * @returns {WorkflowDefinition[]}
 */
export function getAllWorkflows() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/**
 * @param {string} id
 * @returns {WorkflowDefinition | null}
 */
export function getWorkflowById(id) {
  const list = getAllWorkflows();
  return list.find((w) => w.id === id) ?? null;
}

/**
 * @param {WorkflowDefinition} workflow
 */
export function saveWorkflow(workflow) {
  const list = getAllWorkflows();
  const updated = {
    ...workflow,
    updatedAt: new Date().toISOString(),
  };
  const index = list.findIndex((w) => w.id === workflow.id);
  const next = index >= 0 ? [...list] : [...list, updated];
  if (index >= 0) next[index] = updated;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return updated;
}

/**
 * @param {string} id
 */
export function deleteWorkflow(id) {
  const list = getAllWorkflows().filter((w) => w.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

/**
 * Generate a URL-safe workflow ID from a name (for new workflows).
 * @param {string} name
 * @returns {string}
 */
export function slugFromName(name) {
  return (name || 'workflow')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '')
    .slice(0, 64) || 'workflow';
}

/**
 * Ensure unique ID among existing workflows.
 * @param {string} baseId
 * @param {string[]} [excludeId] - ID to keep (e.g. when editing)
 * @returns {string}
 */
export function uniqueWorkflowId(baseId, excludeId) {
  const existing = getAllWorkflows().map((w) => w.id);
  let candidate = baseId || 'workflow';
  let n = 0;
  while (existing.includes(candidate) && candidate !== excludeId) {
    n += 1;
    candidate = `${baseId || 'workflow'}-${n}`;
  }
  return candidate;
}

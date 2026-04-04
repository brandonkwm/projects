import { getCurrentUser } from './userContext';
import { diffWorkflowRecords } from './workflowDiff';
import { appendWorkflowAuditEntry } from './workflowAuditStorage';
import { buildAuditChangeGroups } from './workflowAuditEnrichment';

function formatLocalNow() {
  const d = new Date();
  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'medium',
  });
}

/**
 * Record a workflow change if the diff is non-empty.
 * @returns {object|null} stored entry or null
 */
export function recordWorkflowAudit({
  workflowId,
  beforeWorkflow,
  afterWorkflow,
  source = 'save',
  summaryLines,
}) {
  if (!workflowId || !afterWorkflow) return null;
  const { beforeFlat, afterFlat } = diffWorkflowRecords(beforeWorkflow, afterWorkflow);
  if (
    Object.keys(beforeFlat).length === 0 &&
    Object.keys(afterFlat).length === 0
  ) {
    return null;
  }
  const { sections: auditSections } = buildAuditChangeGroups(
    beforeWorkflow,
    afterWorkflow,
    beforeFlat,
    afterFlat
  );

  const entry = {
    workflowId,
    source,
    atUtc: new Date().toISOString(),
    atLocalDisplay: formatLocalNow(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    actor: getCurrentUser(),
    beforeFlat,
    afterFlat,
    auditSections,
    ...(summaryLines?.length ? { summaryLines } : {}),
  };
  appendWorkflowAuditEntry(entry);
  return entry;
}

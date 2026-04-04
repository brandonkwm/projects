/**
 * Turn flat audit paths into citizen-friendly parent/child sections
 * (workflow → nodes/edges → fields).
 */

const NODE_RE = /^definition\.nodes\[(\d+)\]\.(.+)$/;
const EDGE_RE = /^definition\.edges\[(\d+)\]\.(.+)$/;

function prettifyFieldPath(rest) {
  if (!rest) return rest;
  const trimmed = rest.replace(/^data\./, '');
  return trimmed
    .split('.')
    .map((part) =>
      part
        .replace(/\[(\d+)\]/g, '[$1]')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/_/g, ' ')
    )
    .join(' › ');
}

function nodeSectionMeta(beforeWorkflow, afterWorkflow, index) {
  const i = Number(index);
  const afterN = afterWorkflow?.definition?.nodes?.[i];
  const beforeN = beforeWorkflow?.definition?.nodes?.[i];
  const n = afterN || beforeN || {};
  const rawLabel = n.data?.label != null ? String(n.data.label).trim() : '';
  const type = n.type || 'node';
  const paletteLabel =
    type === 'start'
      ? 'Start'
      : type === 'end'
        ? 'End'
        : type === 'condition'
          ? 'Condition'
          : type === 'task'
            ? 'Task'
            : 'Node';
  const nodeLabel = rawLabel || null;
  const title =
    nodeLabel != null && nodeLabel !== ''
      ? `${paletteLabel} — "${nodeLabel}"`
      : `${paletteLabel} (no label on canvas — use a unique label for clearer audits)`;
  return {
    kind: 'node',
    nodeIndex: i,
    nodeId: n.id ?? `index-${i}`,
    nodeType: type,
    nodeLabel,
    paletteLabel,
    title,
    subtitle: `Canvas type: ${paletteLabel} · id: ${n.id ?? '—'}`,
  };
}

function edgeSectionMeta(beforeWorkflow, afterWorkflow, index) {
  const i = Number(index);
  const afterE = afterWorkflow?.definition?.edges?.[i];
  const beforeE = beforeWorkflow?.definition?.edges?.[i];
  const e = afterE || beforeE || {};
  const src = e.source ?? '—';
  const tgt = e.target ?? '—';
  return {
    kind: 'edge',
    edgeIndex: i,
    edgeId: e.id,
    title: `Connection · ${src} → ${tgt}`,
    subtitle: `Edge id: ${e.id ?? '—'}`,
  };
}

/**
 * @param {object|null} beforeWorkflow
 * @param {object|null} afterWorkflow
 * @param {Record<string, unknown>} beforeFlat
 * @param {Record<string, unknown>} afterFlat
 * @returns {{ sections: object[] }}
 */
export function buildAuditChangeGroups(beforeWorkflow, afterWorkflow, beforeFlat, afterFlat) {
  const keys = new Set([...Object.keys(beforeFlat || {}), ...Object.keys(afterFlat || {})]);
  const nodeMap = new Map();
  const edgeMap = new Map();
  const workflowList = [];

  for (const key of [...keys].sort()) {
    const nm = key.match(NODE_RE);
    if (nm) {
      const idx = nm[1];
      const rest = nm[2];
      if (!nodeMap.has(idx)) {
        nodeMap.set(idx, {
          ...nodeSectionMeta(beforeWorkflow, afterWorkflow, idx),
          changes: [],
        });
      }
      nodeMap.get(idx).changes.push({
        fieldLabel: prettifyFieldPath(rest),
        technicalPath: key,
        before: beforeFlat[key],
        after: afterFlat[key],
      });
      continue;
    }

    const em = key.match(EDGE_RE);
    if (em) {
      const idx = em[1];
      const rest = em[2];
      if (!edgeMap.has(idx)) {
        edgeMap.set(idx, {
          ...edgeSectionMeta(beforeWorkflow, afterWorkflow, idx),
          changes: [],
        });
      }
      edgeMap.get(idx).changes.push({
        fieldLabel: prettifyFieldPath(rest),
        technicalPath: key,
        before: beforeFlat[key],
        after: afterFlat[key],
      });
      continue;
    }

    workflowList.push({
      fieldLabel: prettifyFieldPath(key),
      technicalPath: key,
      before: beforeFlat[key],
      after: afterFlat[key],
    });
  }

  const sections = [];

  if (workflowList.length > 0) {
    sections.push({
      kind: 'workflow',
      title: 'Workflow & triggers',
      subtitle: 'Name, description, entry channels, and graph layout metadata',
      changes: workflowList,
    });
  }

  const nodeSections = [...nodeMap.entries()]
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([, sec]) => sec);
  sections.push(...nodeSections);

  const edgeSections = [...edgeMap.entries()]
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([, sec]) => sec);
  sections.push(...edgeSections);

  return { sections };
}

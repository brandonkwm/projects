/**
 * Citizen-developer friendly validation for workflow definitions.
 */

/**
 * Tasks must have a non-empty label, unique case-insensitively among tasks.
 * @param {{ id: string, type?: string, data?: object }[]} nodes - React Flow nodes
 * @returns {{ ok: boolean, errors: { nodeId: string, message: string }[] }}
 */
export function validateTaskLabels(nodes) {
  if (!Array.isArray(nodes)) {
    return { ok: true, errors: [] };
  }
  const tasks = nodes.filter((n) => n?.type === 'task');
  const errors = [];
  const seen = new Map();

  for (const n of tasks) {
    const id = n.id ?? '?';
    const label = (n.data?.label != null ? String(n.data.label) : '').trim();
    if (!label) {
      errors.push({
        nodeId: id,
        message: 'This task has no label. Add a short unique label (shown on the canvas) so audits stay readable.',
      });
      continue;
    }
    const key = label.toLowerCase();
    if (seen.has(key)) {
      errors.push({
        nodeId: id,
        message: `Duplicate task label "${label}" (same as another task). Make each task label unique.`,
      });
    } else {
      seen.set(key, id);
    }
  }

  return { ok: errors.length === 0, errors };
}

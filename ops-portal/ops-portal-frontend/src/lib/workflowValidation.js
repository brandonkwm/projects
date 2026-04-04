/**
 * Citizen-developer friendly validation for workflow definitions.
 */

/**
 * Tasks must have a non-empty label, unique among tasks (case-sensitive: "Foo" and "foo" are different).
 * @param {{ id: string, type?: string, data?: object }[]} nodes - React Flow nodes
 * @returns {{ ok: boolean, errors: { nodeId: string, message: string }[] }}
 */
export function validateTaskLabels(nodes) {
  if (!Array.isArray(nodes)) {
    return { ok: true, errors: [] };
  }
  const tasksRaw = nodes.filter((n) => n?.type === 'task');
  // Same node id must not be counted twice (defensive — duplicate entries would look like duplicate labels).
  const byNodeId = new Map();
  for (const n of tasksRaw) {
    const nid = n.id ?? '?';
    byNodeId.set(nid, n);
  }
  const tasks = [...byNodeId.values()];

  const errors = [];

  const byLabel = new Map(); // exact trimmed string -> [{ id, label }]

  for (const n of tasks) {
    const id = n.id ?? '?';
    const label = (n.data?.label != null ? String(n.data.label) : '').trim();
    if (!label) {
      errors.push({
        nodeId: id,
        message: `Task node "${id}" has no label. Add a short unique label on the canvas so audits stay readable.`,
      });
      continue;
    }
    if (!byLabel.has(label)) {
      byLabel.set(label, []);
    }
    byLabel.get(label).push({ id, label });
  }

  for (const [, list] of byLabel) {
    if (list.length < 2) continue;
    const ids = list.map((x) => x.id).join(', ');
    const displayLabel = list[0].label;
    const msg = `Duplicate task label "${displayLabel}" on nodes: ${ids}. Rename one of them (use the minimap or zoom out if you do not see every task).`;
    for (const item of list) {
      errors.push({ nodeId: item.id, message: msg });
    }
  }

  return { ok: errors.length === 0, errors };
}

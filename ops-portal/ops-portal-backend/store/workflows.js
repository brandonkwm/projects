let store = [];

function getAll() {
  return [...store];
}

function getById(id) {
  return store.find((w) => w.id === id) || null;
}

function save(workflow) {
  if (!workflow.id) {
    workflow.id = `wf-${Date.now()}`;
    workflow.updatedAt = new Date().toISOString();
    store.push(workflow);
    return workflow;
  }
  const idx = store.findIndex((w) => w.id === workflow.id);
  const updated = { ...workflow, updatedAt: new Date().toISOString() };
  if (idx >= 0) store[idx] = updated;
  else store.push(updated);
  return updated;
}

function remove(id) {
  store = store.filter((w) => w.id !== id);
}

module.exports = { getAll, getById, save, remove };

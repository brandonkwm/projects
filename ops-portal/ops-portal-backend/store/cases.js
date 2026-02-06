let store = [];

function getAll() {
  return [...store];
}

function getById(id) {
  return store.find((c) => c.id === id) || null;
}

function save(caseInstance) {
  const idx = store.findIndex((c) => c.id === caseInstance.id);
  const updated = { ...caseInstance, updatedAt: new Date().toISOString() };
  if (idx >= 0) store[idx] = updated;
  else store.push(updated);
  return updated;
}

function complete(id, fields) {
  const c = getById(id);
  if (!c) return null;
  const updated = {
    ...c,
    status: 'completed',
    fields: { ...(c.fields || {}), ...fields },
    completedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const idx = store.findIndex((x) => x.id === id);
  store[idx] = updated;
  return updated;
}

function create({ caseTemplateId, title, fields = {} }) {
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
  store.push(created);
  return created;
}

module.exports = { getAll, getById, save, complete, create };

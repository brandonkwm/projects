let store = [];

function getAll() {
  return [...store];
}

function getById(id) {
  return store.find((t) => t.id === id) || null;
}

function save(template) {
  if (!template.id) {
    template.id = `comm-tpl-${Date.now()}`;
    template.updatedAt = new Date().toISOString();
    store.push(template);
    return template;
  }
  const idx = store.findIndex((t) => t.id === template.id);
  const updated = { ...template, updatedAt: new Date().toISOString() };
  if (idx >= 0) store[idx] = updated;
  else store.push(updated);
  return updated;
}

function remove(id) {
  store = store.filter((t) => t.id !== id);
}

module.exports = { getAll, getById, save, remove };

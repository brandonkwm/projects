const STORAGE_KEY = 'ops-portal-communication-templates';

export function getAllCommunicationTemplates() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function getCommunicationTemplateById(id) {
  return getAllCommunicationTemplates().find((t) => t.id === id) ?? null;
}

export function saveCommunicationTemplate(template) {
  const list = getAllCommunicationTemplates();
  const updated = {
    ...template,
    updatedAt: new Date().toISOString(),
  };
  const idx = list.findIndex((t) => t.id === template.id);
  const next = idx >= 0 ? [...list] : [...list, updated];
  if (idx >= 0) next[idx] = updated;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return updated;
}

export function deleteCommunicationTemplate(id) {
  const next = getAllCommunicationTemplates().filter((t) => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function slugFromName(name) {
  return (
    (name || 'template')
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-_]/g, '')
      .slice(0, 64) || 'template'
  );
}


const STORAGE_KEY = 'ops-portal-case-templates';

export function getAllCaseTemplates() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function getCaseTemplateById(id) {
  return getAllCaseTemplates().find((t) => t.id === id) ?? null;
}

export function saveCaseTemplate(template) {
  const list = getAllCaseTemplates();
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

export function deleteCaseTemplate(id) {
  const next = getAllCaseTemplates().filter((t) => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function slugFromName(name) {
  return (
    (name || 'case')
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-_]/g, '')
      .slice(0, 64) || 'case'
  );
}

export function uniqueCaseTemplateId(baseId) {
  const existing = getAllCaseTemplates().map((t) => t.id);
  let candidate = baseId || 'case';
  let n = 0;
  while (existing.includes(candidate)) {
    n += 1;
    candidate = `${baseId || 'case'}-${n}`;
  }
  return candidate;
}


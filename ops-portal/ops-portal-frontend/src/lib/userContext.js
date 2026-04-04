/**
 * MVP "logged-in user" for audit trails (replace with real auth when available).
 */
const STORAGE_KEY = 'ops-portal-current-user';

const defaultUser = () => ({
  id: 'local-user',
  displayName: 'Local user',
});

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultUser();
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.displayName === 'string') {
      return {
        id: typeof parsed.id === 'string' && parsed.id.trim() ? parsed.id.trim() : 'local-user',
        displayName: parsed.displayName.trim() || defaultUser().displayName,
      };
    }
  } catch {
    /* ignore */
  }
  return defaultUser();
}

export function setCurrentUser(user) {
  const next = {
    id: typeof user?.id === 'string' && user.id.trim() ? user.id.trim() : 'local-user',
    displayName:
      typeof user?.displayName === 'string' && user.displayName.trim()
        ? user.displayName.trim()
        : defaultUser().displayName,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

/**
 * Build a map of normalized field identifiers -> value for matching form fields.
 * Keys are lowercase, no extra spaces; we'll match against label/name/placeholder/id.
 */
export function buildValueMap(profile, questionAnswers) {
  const m = new Map();

  if (profile.full_name) m.set("full name", profile.full_name);
  if (profile.full_name) m.set("name", profile.full_name);
  if (profile.full_name) m.set("fullname", profile.full_name);
  if (profile.email) m.set("email", profile.email);
  if (profile.phone) m.set("phone", profile.phone);
  if (profile.phone) m.set("telephone", profile.phone);
  if (profile.phone) m.set("mobile", profile.phone);
  if (profile.location) {
    m.set("location", profile.location);
    m.set("city", profile.location);
    m.set("address", profile.location);
    m.set("current location", profile.location);
  }

  for (const qa of questionAnswers || []) {
    if (!qa.answer_text) continue;
    const q = normalizeKey(qa.question_text);
    if (q) m.set(q, qa.answer_text);
    if (qa.key) {
      m.set(qa.key.toLowerCase().replace(/_/g, " "), qa.answer_text);
      m.set(qa.key.toLowerCase(), qa.answer_text);
    }
  }

  return m;
}

export function normalizeKey(text) {
  if (!text || typeof text !== "string") return "";
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Try to find a value for this field from the value map.
 * Returns { value, isFile } or null if no match.
 */
export function matchField(valueMap, label, name, id, placeholder, type) {
  const candidates = [label, name, id, placeholder].filter(Boolean).map(normalizeKey);
  for (const c of candidates) {
    if (!c) continue;
    if (valueMap.has(c)) return { value: valueMap.get(c), isFile: false };
    for (const [key, value] of valueMap) {
      if (c.includes(key) || key.includes(c)) return { value, isFile: false };
    }
  }
  if (type === "file" || (label && /resume|cv|upload|attachment/i.test(label))) {
    return { value: "__resume__", isFile: true };
  }
  return null;
}

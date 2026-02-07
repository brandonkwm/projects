/**
 * In-memory store for reconciliation types (config for key + value fields and rules).
 * Each type has: name, keyField, valueFields (each with name, ruleType, params).
 */

const reconciliationTypes = [
  {
    id: "cash-vs-bank",
    name: "Cash vs Bank",
    keyField: "transaction_id",
    valueFields: [
      { name: "amount", ruleType: "numeric_tolerance", params: { tolerance: 0.01 } },
      { name: "date", ruleType: "date_tolerance", params: { days: 1 } },
    ],
  },
];

export function list() {
  return [...reconciliationTypes];
}

export function get(id) {
  return reconciliationTypes.find((t) => t.id === id) ?? null;
}

export function create(body) {
  const id = (body.id || body.name?.toLowerCase().replace(/\s+/g, "-")).replace(/[^a-z0-9-]/g, "");
  if (reconciliationTypes.some((t) => t.id === id)) throw new Error("Reconciliation type with this id already exists");
  const type = {
    id,
    name: body.name || "Unnamed",
    keyField: body.keyField || "id",
    valueFields: Array.isArray(body.valueFields) ? body.valueFields : [],
  };
  reconciliationTypes.push(type);
  return type;
}

export function update(id, body) {
  const i = reconciliationTypes.findIndex((t) => t.id === id);
  if (i === -1) return null;
  if (body.name != null) reconciliationTypes[i].name = body.name;
  if (body.keyField != null) reconciliationTypes[i].keyField = body.keyField;
  if (Array.isArray(body.valueFields)) reconciliationTypes[i].valueFields = body.valueFields;
  return reconciliationTypes[i];
}

export function remove(id) {
  const i = reconciliationTypes.findIndex((t) => t.id === id);
  if (i === -1) return false;
  reconciliationTypes.splice(i, 1);
  return true;
}

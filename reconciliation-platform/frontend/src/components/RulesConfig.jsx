import React, { useEffect, useState } from 'react';
import { reconciliationTypes as typesApi } from '../api';

const RULE_TYPES = [
  { value: 'exact', label: 'Exact' },
  { value: 'numeric_tolerance', label: 'Numeric tolerance' },
  { value: 'date_tolerance', label: 'Date tolerance' },
  { value: 'normalize_then_compare', label: 'Normalize then compare' },
  { value: 'mapping', label: 'Mapping / allowlist' },
];

export default function RulesConfig() {
  const [types, setTypes] = useState([]);
  const [editing, setEditing] = useState(null); // null | { id, name, keyField, valueFields }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await typesApi.list();
      setTypes(list);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    setError(null);
    try {
      if (editing.id && types.some((t) => t.id === editing.id)) {
        await typesApi.update(editing.id, {
          name: editing.name,
          keyField: editing.keyField,
          valueFields: editing.valueFields,
        });
      } else {
        await typesApi.create({
          id: editing.id || undefined,
          name: editing.name,
          keyField: editing.keyField,
          valueFields: editing.valueFields,
        });
      }
      await load();
      setEditing(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddField = () => {
    setEditing((e) => ({
      ...e,
      valueFields: [...(e.valueFields || []), { name: '', ruleType: 'exact', params: {} }],
    }));
  };

  const handleRemoveField = (index) => {
    setEditing((e) => ({
      ...e,
      valueFields: e.valueFields.filter((_, i) => i !== index),
    }));
  };

  const handleFieldChange = (index, field, value) => {
    setEditing((e) => {
      const next = [...(e.valueFields || [])];
      next[index] = { ...next[index], [field]: value };
      return { ...e, valueFields: next };
    });
  };

  const handleParamsChange = (index, paramKey, paramValue) => {
    setEditing((e) => {
      const next = [...(e.valueFields || [])];
      next[index] = {
        ...next[index],
        params: { ...(next[index].params || {}), [paramKey]: paramValue },
      };
      return { ...e, valueFields: next };
    });
  };

  if (loading) return <div className="text-slate-500">Loading rules…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-800">Systematic rules</h2>
        <button
          type="button"
          onClick={() => setEditing({ id: '', name: '', keyField: 'id', valueFields: [] })}
          className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
        >
          Add reconciliation type
        </button>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

      {editing ? (
        <div className="border border-slate-200 rounded-lg bg-white p-6 shadow-sm space-y-4">
          <h3 className="font-medium text-slate-700">
            {types.some((t) => t.id === editing.id) ? 'Edit' : 'New'} reconciliation type
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-600">Name</span>
              <input
                type="text"
                value={editing.name}
                onChange={(ev) => setEditing((e) => ({ ...e, name: ev.target.value }))}
                placeholder="e.g. Cash vs Bank"
                className="mt-1 block w-full rounded border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-600">Key field</span>
              <input
                type="text"
                value={editing.keyField}
                onChange={(ev) => setEditing((e) => ({ ...e, keyField: ev.target.value }))}
                placeholder="e.g. transaction_id"
                className="mt-1 block w-full rounded border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-600">Value fields to compare</span>
              <button type="button" onClick={handleAddField} className="text-sm text-slate-600 hover:text-slate-800">
                + Add field
              </button>
            </div>
            <div className="space-y-3">
              {(editing.valueFields || []).map((field, index) => (
                <div key={index} className="flex flex-wrap items-end gap-3 p-3 bg-slate-50 rounded-lg">
                  <label className="flex-1 min-w-[120px]">
                    <span className="text-xs text-slate-500">Field name</span>
                    <input
                      type="text"
                      value={field.name}
                      onChange={(ev) => handleFieldChange(index, 'name', ev.target.value)}
                      placeholder="e.g. amount"
                      className="mt-0.5 block w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                    />
                  </label>
                  <label className="w-40">
                    <span className="text-xs text-slate-500">Rule type</span>
                    <select
                      value={field.ruleType || 'exact'}
                      onChange={(ev) => handleFieldChange(index, 'ruleType', ev.target.value)}
                      className="mt-0.5 block w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                    >
                      {RULE_TYPES.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </label>
                  {field.ruleType === 'numeric_tolerance' && (
                    <label className="w-24">
                      <span className="text-xs text-slate-500">Tolerance</span>
                      <input
                        type="number"
                        step="0.01"
                        value={field.params?.tolerance ?? ''}
                        onChange={(ev) => handleParamsChange(index, 'tolerance', parseFloat(ev.target.value) || 0)}
                        placeholder="0.01"
                        className="mt-0.5 block w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                      />
                    </label>
                  )}
                  {field.ruleType === 'date_tolerance' && (
                    <label className="w-24">
                      <span className="text-xs text-slate-500">Days</span>
                      <input
                        type="number"
                        min="0"
                        value={field.params?.days ?? ''}
                        onChange={(ev) => handleParamsChange(index, 'days', parseInt(ev.target.value, 10) || 0)}
                        placeholder="1"
                        className="mt-0.5 block w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                      />
                    </label>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveField(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !editing.name || !editing.keyField}
              className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      <div className="border border-slate-200 rounded-lg bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 border-b border-slate-200">
            <tr>
              <th className="text-left p-3 font-medium">Name</th>
              <th className="text-left p-3 font-medium">Key field</th>
              <th className="text-left p-3 font-medium">Value fields</th>
              <th className="w-24 p-3"></th>
            </tr>
          </thead>
          <tbody>
            {types.map((t) => (
              <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-3 font-medium">{t.name}</td>
                <td className="p-3 font-mono text-slate-600">{t.keyField}</td>
                <td className="p-3">
                  {t.valueFields?.length ? (
                    <span className="text-slate-600">
                      {t.valueFields.map((f) => `${f.name} (${f.ruleType})`).join(', ')}
                    </span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="p-3">
                  <button
                    type="button"
                    onClick={() => setEditing({ ...t, valueFields: [...(t.valueFields || [])] })}
                    className="text-slate-600 hover:text-slate-800"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {types.length === 0 && !editing && (
          <div className="p-6 text-slate-500 text-center">No reconciliation types. Add one to configure systematic rules.</div>
        )}
      </div>
    </div>
  );
}

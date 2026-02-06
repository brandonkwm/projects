import React, { useState } from 'react';
import { slugFromName, uniqueCaseTemplateId } from '../lib/caseTemplateStorage';

const fieldTypes = ['string', 'number', 'boolean', 'select', 'date'];

export default function CaseTemplateEditor({ initialTemplate, onSave, onBack }) {
  const [name, setName] = useState(initialTemplate?.name || '');
  const [description, setDescription] = useState(initialTemplate?.description || '');
  const [fields, setFields] = useState(
    Array.isArray(initialTemplate?.fields) && initialTemplate.fields.length
      ? initialTemplate.fields
      : [{ key: 'notes', label: 'Notes', type: 'string', required: false, readOnly: false, sourcePath: '' }]
  );

  const templateId =
    initialTemplate?.id || uniqueCaseTemplateId(slugFromName(name || 'case'));

  const handleFieldChange = (index, patch) => {
    setFields((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  const handleAddField = () => {
    setFields((prev) => [
      ...prev,
      { key: '', label: '', type: 'string', required: false, readOnly: false, sourcePath: '' },
    ]);
  };

  const handleRemoveField = (index) => {
    setFields((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSave = () => {
    const cleanedFields = fields
      .map((f) => ({
        key: f.key.trim(),
        label: f.label.trim() || f.key.trim(),
        type: f.type || 'string',
        required: !!f.required,
        readOnly: !!f.readOnly,
        sourcePath: f.sourcePath?.trim() || undefined,
      }))
      .filter((f) => f.key);

    const payload = {
      id: templateId,
      name: name.trim() || 'Untitled case',
      description: description.trim() || undefined,
      fields: cleanedFields,
    };

    onSave?.(payload);
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              style={{
                padding: '6px 10px',
                fontSize: 13,
                borderRadius: 6,
                border: '1px solid #d1d5db',
                background: '#f9fafb',
                cursor: 'pointer',
              }}
            >
              ← Back
            </button>
          )}
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
              {initialTemplate ? 'Edit case template' : 'New case template'}
            </h1>
            <div style={{ fontSize: 12, color: '#6b7280', fontFamily: 'monospace' }}>ID: {templateId}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSave}
          style={{
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 600,
            borderRadius: 8,
            border: 'none',
            background: '#0f766e',
            color: '#ffffff',
            cursor: 'pointer',
          }}
        >
          Save template
        </button>
      </div>

      <div
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: 16,
          background: '#ffffff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          marginBottom: 16,
        }}
      >
        <label style={{ fontSize: 12, fontWeight: 500 }}>Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{
            display: 'block',
            width: '100%',
            marginTop: 4,
            marginBottom: 8,
            padding: '8px 10px',
            fontSize: 13,
            borderRadius: 6,
            border: '1px solid #d1d5db',
          }}
        />
        <label style={{ fontSize: 12, fontWeight: 500 }}>Description</label>
        <textarea
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{
            display: 'block',
            width: '100%',
            marginTop: 4,
            padding: '8px 10px',
            fontSize: 13,
            borderRadius: 6,
            border: '1px solid #d1d5db',
            resize: 'vertical',
          }}
        />
      </div>

      <div
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: 16,
          background: '#ffffff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Fields</h2>
          <button
            type="button"
            onClick={handleAddField}
            style={{
              padding: '6px 10px',
              fontSize: 12,
              borderRadius: 999,
              border: '1px solid #d1d5db',
              background: '#f9fafb',
              cursor: 'pointer',
            }}
          >
            + Add field
          </button>
        </div>

        {fields.map((field, index) => (
          <div
            key={index}
            style={{
              display: 'grid',
              gridTemplateColumns: '1.4fr 1.4fr 1.2fr 1.6fr auto',
              gap: 8,
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <input
              type="text"
              placeholder="key (e.g. amount, payerName)"
              value={field.key}
              onChange={(e) => handleFieldChange(index, { key: e.target.value })}
              style={{
                fontSize: 12,
                padding: '6px 8px',
                borderRadius: 6,
                border: '1px solid #d1d5db',
              }}
            />
            <input
              type="text"
              placeholder="Label"
              value={field.label}
              onChange={(e) => handleFieldChange(index, { label: e.target.value })}
              style={{
                fontSize: 12,
                padding: '6px 8px',
                borderRadius: 6,
                border: '1px solid #d1d5db',
              }}
            />
            <select
              value={field.type || 'string'}
              onChange={(e) => handleFieldChange(index, { type: e.target.value })}
              style={{
                fontSize: 12,
                padding: '6px 8px',
                borderRadius: 6,
                border: '1px solid #d1d5db',
              }}
            >
              {fieldTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="JSON path (e.g. payload.amount)"
              value={field.sourcePath || ''}
              onChange={(e) => handleFieldChange(index, { sourcePath: e.target.value })}
              style={{
                fontSize: 12,
                padding: '6px 8px',
                borderRadius: 6,
                border: '1px solid #d1d5db',
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <label style={{ fontSize: 11 }}>
                <input
                  type="checkbox"
                  checked={!!field.required}
                  onChange={(e) => handleFieldChange(index, { required: e.target.checked })}
                  style={{ marginRight: 4 }}
                />
                Required
              </label>
              <label style={{ fontSize: 11 }}>
                <input
                  type="checkbox"
                  checked={!!field.readOnly}
                  onChange={(e) => handleFieldChange(index, { readOnly: e.target.checked })}
                  style={{ marginRight: 4 }}
                />
                Read-only
              </label>
              <button
                type="button"
                onClick={() => handleRemoveField(index)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: '#ef4444',
                  fontSize: 11,
                  cursor: 'pointer',
                }}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Live preview of how a case form would render */}
      <div
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: 16,
          background: '#f9fafb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 8px' }}>Case preview</h2>
        <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 12px' }}>
          This is how a human agent would see the case form generated from this template.
        </p>
        <form style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {fields.map((field) => (
            <div key={field.key || field.label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 500 }}>
                {field.label || field.key || 'Untitled field'}
                {field.required && <span style={{ color: '#dc2626' }}> *</span>}
              </label>
              {field.type === 'boolean' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                  <input type="checkbox" disabled />
                  <span>Yes / No</span>
                </div>
              ) : field.type === 'number' ? (
                <input
                  type="number"
                  disabled
                  style={{
                    fontSize: 12,
                    padding: '6px 8px',
                    borderRadius: 6,
                    border: '1px solid #d1d5db',
                    background: '#f3f4f6',
                  }}
                />
              ) : field.type === 'date' ? (
                <input
                  type="date"
                  disabled
                  style={{
                    fontSize: 12,
                    padding: '6px 8px',
                    borderRadius: 6,
                    border: '1px solid #d1d5db',
                    background: '#f3f4f6',
                  }}
                />
              ) : (
                <input
                  type="text"
                  disabled
                  style={{
                    fontSize: 12,
                    padding: '6px 8px',
                    borderRadius: 6,
                    border: '1px solid #d1d5db',
                    background: '#f3f4f6',
                  }}
                />
              )}
              {field.sourcePath && (
                <div style={{ fontSize: 11, color: '#9ca3af' }}>Maps from JSON: {field.sourcePath}</div>
              )}
            </div>
          ))}
        </form>
      </div>
    </div>
  );
}


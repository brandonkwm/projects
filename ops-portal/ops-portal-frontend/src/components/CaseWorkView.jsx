import React, { useState, useMemo } from 'react';
import { getCaseInstanceById, completeCaseInstance } from '../lib/caseInstanceStorage';
import { getCaseTemplateById } from '../lib/caseTemplateStorage';

const fieldTypes = ['string', 'number', 'boolean', 'select', 'date'];

export default function CaseWorkView({ caseId, caseTemplates, onBack, onComplete }) {
  const caseInstance = useMemo(() => getCaseInstanceById(caseId), [caseId]);
  const template = useMemo(
    () => (caseInstance ? getCaseTemplateById(caseInstance.caseTemplateId) : null),
    [caseInstance]
  );

  const [fields, setFields] = useState(() => {
    if (!caseInstance) return {};
    return { ...(caseInstance.fields || {}) };
  });

  if (!caseInstance) {
    return (
      <div style={{ maxWidth: 700, margin: '0 auto', padding: 24 }}>
        <p style={{ color: '#6b7280' }}>Case not found.</p>
        <button type="button" onClick={onBack} style={{ marginTop: 12, padding: '8px 14px', cursor: 'pointer' }}>
          ← Back to list
        </button>
      </div>
    );
  }

  if (!template) {
    return (
      <div style={{ maxWidth: 700, margin: '0 auto', padding: 24 }}>
        <p style={{ color: '#6b7280' }}>Case template not found for this case.</p>
        <button type="button" onClick={onBack} style={{ marginTop: 12, padding: '8px 14px', cursor: 'pointer' }}>
          ← Back to list
        </button>
      </div>
    );
  }

  const handleFieldChange = (fieldKey, value) => {
    setFields((prev) => ({ ...prev, [fieldKey]: value }));
  };

  const handleComplete = () => {
    completeCaseInstance(caseId, fields);
    onComplete?.();
    onBack?.();
  };

  const templateFields = Array.isArray(template.fields) ? template.fields : [];

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{caseInstance.title || caseId}</h1>
            <div style={{ fontSize: 12, color: '#6b7280' }}>
              {template.name} · {caseInstance.status}
            </div>
          </div>
        </div>
        {caseInstance.status === 'open' && (
          <button
            type="button"
            onClick={handleComplete}
            style={{
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 8,
              border: 'none',
              background: '#0d9488',
              color: '#ffffff',
              cursor: 'pointer',
            }}
          >
            Complete case
          </button>
        )}
      </div>

      <div
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: 20,
          background: '#ffffff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}
      >
        <form style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {templateFields.map((field) => {
            const value = fields[field.key];
            const isReadOnly = !!field.readOnly || caseInstance.status === 'completed';

            return (
              <div key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 13, fontWeight: 500 }}>
                  {field.label || field.key}
                  {field.required && <span style={{ color: '#dc2626' }}> *</span>}
                  {field.readOnly && (
                    <span style={{ marginLeft: 8, fontSize: 11, color: '#6b7280' }}>(read-only)</span>
                  )}
                </label>
                {field.type === 'boolean' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={!!value}
                      onChange={(e) => handleFieldChange(field.key, e.target.checked)}
                      disabled={isReadOnly}
                      style={{ width: 18, height: 18 }}
                    />
                    <span style={{ fontSize: 13 }}>{value ? 'Yes' : 'No'}</span>
                  </div>
                ) : field.type === 'number' ? (
                  <input
                    type="number"
                    value={value ?? ''}
                    onChange={(e) => handleFieldChange(field.key, e.target.value === '' ? undefined : Number(e.target.value))}
                    disabled={isReadOnly}
                    style={{
                      padding: '8px 10px',
                      fontSize: 13,
                      borderRadius: 6,
                      border: '1px solid #d1d5db',
                      background: isReadOnly ? '#f3f4f6' : '#ffffff',
                    }}
                  />
                ) : field.type === 'date' ? (
                  <input
                    type="date"
                    value={value ?? ''}
                    onChange={(e) => handleFieldChange(field.key, e.target.value || undefined)}
                    disabled={isReadOnly}
                    style={{
                      padding: '8px 10px',
                      fontSize: 13,
                      borderRadius: 6,
                      border: '1px solid #d1d5db',
                      background: isReadOnly ? '#f3f4f6' : '#ffffff',
                    }}
                  />
                ) : (
                  <input
                    type="text"
                    value={value ?? ''}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    disabled={isReadOnly}
                    style={{
                      padding: '8px 10px',
                      fontSize: 13,
                      borderRadius: 6,
                      border: '1px solid #d1d5db',
                      background: isReadOnly ? '#f3f4f6' : '#ffffff',
                    }}
                  />
                )}
              </div>
            );
          })}
        </form>
      </div>
    </div>
  );
}

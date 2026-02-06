import React, { useState } from 'react';
import { createCaseInstance } from '../lib/caseInstanceStorage';

export default function CreateTestCaseForm({ caseTemplates, onCreateAndOpen, onBack }) {
  const [templateId, setTemplateId] = useState(caseTemplates?.[0]?.id || '');
  const [title, setTitle] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!templateId) return;
    const created = createCaseInstance({
      caseTemplateId: templateId,
      title: title.trim() || undefined,
      fields: {},
    });
    onCreateAndOpen(created.id);
  };

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', padding: 24 }}>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
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
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Create test case</h1>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: 20,
          background: '#ffffff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div>
          <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>
            Case template
          </label>
          <select
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '8px 10px',
              fontSize: 13,
              borderRadius: 6,
              border: '1px solid #d1d5db',
            }}
          >
            <option value="">Select template</option>
            {caseTemplates?.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.name || tpl.id}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>
            Title (optional)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Payment review #123"
            style={{
              width: '100%',
              padding: '8px 10px',
              fontSize: 13,
              borderRadius: 6,
              border: '1px solid #d1d5db',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="submit"
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
            Create & open
          </button>
          <button type="button" onClick={onBack} style={{ padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

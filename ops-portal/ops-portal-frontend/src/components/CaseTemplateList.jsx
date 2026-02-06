import React from 'react';

const cardStyle = {
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  padding: 16,
  background: '#ffffff',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
};

export default function CaseTemplateList({ templates, onNew, onEdit, onDelete }) {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Case templates</h1>
          <p style={{ fontSize: 14, color: '#6b7280', margin: '4px 0 0' }}>
            Define the fields for cases that humans and agents will work on.
          </p>
        </div>
        <button
          type="button"
          onClick={onNew}
          style={{
            padding: '10px 18px',
            fontSize: 14,
            fontWeight: 600,
            borderRadius: 8,
            border: 'none',
            background: '#0f766e',
            color: '#ffffff',
            cursor: 'pointer',
          }}
        >
          + New case template
        </button>
      </div>

      {templates.length === 0 ? (
        <div
          style={{
            ...cardStyle,
            textAlign: 'center',
            padding: 48,
            color: '#6b7280',
            fontSize: 14,
          }}
        >
          No case templates yet. Create one so human-in-the-loop tasks can open structured cases.
        </div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {templates.map((tpl) => (
            <li key={tpl.id} style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{tpl.name || 'Untitled case'}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', fontFamily: 'monospace', marginBottom: 4 }}>
                    ID: {tpl.id}
                  </div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>
                    Updated: {tpl.updatedAt ? new Date(tpl.updatedAt).toLocaleString() : '—'}
                  </div>
                  <div style={{ fontSize: 12, color: '#4b5563', marginTop: 6 }}>
                    Fields: {Array.isArray(tpl.fields) ? tpl.fields.length : 0}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => onEdit(tpl.id)}
                    style={{
                      padding: '8px 14px',
                      fontSize: 13,
                      fontWeight: 500,
                      borderRadius: 6,
                      border: '1px solid #d1d5db',
                      background: '#ffffff',
                      cursor: 'pointer',
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Delete case template "${tpl.name || tpl.id}"?`)) onDelete(tpl.id);
                    }}
                    style={{
                      padding: '8px 14px',
                      fontSize: 13,
                      fontWeight: 500,
                      borderRadius: 6,
                      border: '1px solid #fecaca',
                      background: '#fef2f2',
                      color: '#dc2626',
                      cursor: 'pointer',
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}


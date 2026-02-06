import React from 'react';

const cardStyle = {
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  padding: 16,
  background: '#ffffff',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
};

export default function WorkflowList({ workflows, onNew, onOpen, onDelete }) {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Workflows</h1>
          <p style={{ fontSize: 14, color: '#6b7280', margin: '4px 0 0' }}>
            Configure workflows that process a JSON request body. Upstream services trigger them by workflow ID.
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
            background: '#4f46e5',
            color: '#ffffff',
            cursor: 'pointer',
          }}
        >
          + New workflow
        </button>
      </div>

      {workflows.length === 0 ? (
        <div
          style={{
            ...cardStyle,
            textAlign: 'center',
            padding: 48,
            color: '#6b7280',
            fontSize: 14,
          }}
        >
          No workflows yet. Create one to define how request payloads are processed (tasks and decisions).
        </div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {workflows.map((wf) => (
            <li key={wf.id} style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{wf.name || 'Unnamed'}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', fontFamily: 'monospace', marginBottom: 4 }}>
                    ID: {wf.id}
                  </div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>
                    Updated: {wf.updatedAt ? new Date(wf.updatedAt).toLocaleString() : '—'}
                  </div>
                  <div
                    style={{
                      marginTop: 8,
                      padding: 8,
                      borderRadius: 6,
                      background: '#f3f4f6',
                      fontSize: 11,
                      color: '#4b5563',
                    }}
                  >
                    <strong>Trigger:</strong> POST /workflows/{wf.id}/run with JSON body (request payload).
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => onOpen(wf.id)}
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
                    Open
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Delete workflow "${wf.name || wf.id}"?`)) onDelete(wf.id);
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

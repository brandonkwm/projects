import React, { useState } from 'react';
import { getCaseTemplateById } from '../lib/caseTemplateStorage';
const cardStyle = {
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  padding: 16,
  background: '#ffffff',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
};

export default function CaseWorkList({ cases, onOpen, onCreateTestCase, onTraceCaseId, caseTemplates }) {
  const [traceSearchId, setTraceSearchId] = useState('');
  const openCases = cases.filter((c) => c.status === 'open');
  const completedCases = cases.filter((c) => c.status === 'completed');

  const handleTrace = () => {
    const id = traceSearchId.trim();
    if (id && onTraceCaseId) onTraceCaseId(id);
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      {onTraceCaseId && (
        <div
          style={{
            marginBottom: 24,
            padding: 16,
            border: '1px solid #99f6e4',
            borderRadius: 12,
            background: '#f0fdf4',
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 8px', color: '#0f766e' }}>Trace case by ID</h3>
          <p style={{ fontSize: 12, color: '#0d9488', margin: '0 0 10px' }}>
            Search for a case reference to see where it flowed through the workflow (visual debug).
          </p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="text"
              value={traceSearchId}
              onChange={(e) => setTraceSearchId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTrace()}
              placeholder="Case ID (e.g. case-123)"
              style={{
                flex: 1,
                maxWidth: 320,
                padding: '8px 12px',
                fontSize: 13,
                border: '1px solid #99f6e4',
                borderRadius: 6,
              }}
            />
            <button
              type="button"
              onClick={handleTrace}
              style={{
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 500,
                borderRadius: 6,
                border: '1px solid #0d9488',
                background: '#0d9488',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              Trace
            </button>
          </div>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Case work</h1>
          <p style={{ fontSize: 14, color: '#6b7280', margin: '4px 0 0' }}>
            Work on cases assigned to you. Open a case to review and complete it.
          </p>
        </div>
        {caseTemplates?.length > 0 && (
          <button
            type="button"
            onClick={onCreateTestCase}
            style={{
              padding: '10px 18px',
              fontSize: 14,
              fontWeight: 600,
              borderRadius: 8,
              border: '1px solid #0d9488',
              background: '#ccfbf1',
              color: '#0f766e',
              cursor: 'pointer',
            }}
          >
            + Create test case
          </button>
        )}
      </div>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Open ({openCases.length})</h2>
        {openCases.length === 0 ? (
          <div style={{ ...cardStyle, padding: 24, textAlign: 'center', color: '#6b7280', fontSize: 14 }}>
            No open cases. Create a test case or wait for workflows to assign cases.
          </div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {openCases.map((c) => {
              const tpl = getCaseTemplateById(c.caseTemplateId);
              return (
                <li key={c.id} style={cardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{c.title || c.id}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>
                        Template: {tpl?.name || c.caseTemplateId} · Created {new Date(c.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpen(c.id)}
                      style={{
                        padding: '8px 14px',
                        fontSize: 13,
                        fontWeight: 500,
                        borderRadius: 6,
                        border: 'none',
                        background: '#0d9488',
                        color: '#ffffff',
                        cursor: 'pointer',
                      }}
                    >
                      Open
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Completed ({completedCases.length})</h2>
        {completedCases.length === 0 ? (
          <div style={{ ...cardStyle, padding: 24, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
            No completed cases yet.
          </div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {completedCases.slice(0, 20).map((c) => {
              const tpl = getCaseTemplateById(c.caseTemplateId);
              return (
                <li key={c.id} style={{ ...cardStyle, opacity: 0.95 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{c.title || c.id}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>
                        {tpl?.name || c.caseTemplateId} · Completed {c.completedAt && new Date(c.completedAt).toLocaleString()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          fontSize: 11,
                          padding: '4px 8px',
                          borderRadius: 999,
                          background: '#d1fae5',
                          color: '#065f46',
                          fontWeight: 500,
                        }}
                      >
                        Done
                      </span>
                      <button
                        type="button"
                        onClick={() => onOpen(c.id)}
                        style={{
                          padding: '6px 12px',
                          fontSize: 12,
                          fontWeight: 500,
                          borderRadius: 6,
                          border: '1px solid #d1d5db',
                          background: '#f9fafb',
                          cursor: 'pointer',
                        }}
                      >
                        View
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

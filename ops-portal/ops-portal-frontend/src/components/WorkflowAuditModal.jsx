import React, { useEffect, useMemo, useState } from 'react';
import { getWorkflowAuditEntries } from '../lib/workflowAuditStorage';
import { buildAuditChangeGroups } from '../lib/workflowAuditEnrichment';

function formatAuditValue(v) {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'object') {
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }
  return String(v);
}

function JsonBlock({ title, obj }) {
  const text = useMemo(() => {
    try {
      return JSON.stringify(obj ?? {}, null, 2);
    } catch {
      return '{}';
    }
  }, [obj]);

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>{title}</div>
      <pre
        style={{
          margin: 0,
          padding: 8,
          fontSize: 10,
          lineHeight: 1.4,
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: 6,
          overflow: 'auto',
          maxHeight: 220,
          fontFamily: 'ui-monospace, monospace',
        }}
      >
        {text}
      </pre>
    </div>
  );
}

export default function WorkflowAuditModal({ workflowId, open, onClose }) {
  const [entries, setEntries] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [showTechnical, setShowTechnical] = useState(false);

  useEffect(() => {
    if (!open || !workflowId) return;
    const list = getWorkflowAuditEntries(workflowId);
    setEntries(list);
    setOpenId(list[0]?.id ?? null);
  }, [open, workflowId]);

  useEffect(() => {
    setShowTechnical(false);
  }, [openId]);

  const selected = entries.find((e) => e.id === openId) ?? entries[0] ?? null;

  const auditSections = useMemo(() => {
    if (!selected) return [];
    if (Array.isArray(selected.auditSections) && selected.auditSections.length > 0) {
      return selected.auditSections;
    }
    return buildAuditChangeGroups(
      null,
      null,
      selected.beforeFlat || {},
      selected.afterFlat || {}
    ).sections;
  }, [selected]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="audit-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 12,
          maxWidth: 960,
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <h2 id="audit-modal-title" style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
            Workflow audit log
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px 12px',
              fontSize: 13,
              borderRadius: 6,
              border: '1px solid #d1d5db',
              background: '#f9fafb',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>

        <div style={{ padding: '12px 18px', fontSize: 12, color: '#6b7280' }}>
          Workflow ID: <code style={{ fontSize: 11 }}>{workflowId}</code>
          <br />
          Changes are grouped by the same labels you see on the canvas (tasks, conditions, etc.). Expand{' '}
          <strong>Technical paths</strong> below if you need raw JSON keys.
        </div>

        <div style={{ display: 'flex', flex: 1, minHeight: 0, borderTop: '1px solid #e5e7eb' }}>
          <div
            style={{
              width: 260,
              borderRight: '1px solid #e5e7eb',
              overflow: 'auto',
              flexShrink: 0,
            }}
          >
            {entries.length === 0 ? (
              <div style={{ padding: 16, fontSize: 12, color: '#6b7280' }}>No audit entries yet.</div>
            ) : (
              entries.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => setOpenId(e.id)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 12px',
                    fontSize: 11,
                    border: 'none',
                    borderBottom: '1px solid #f3f4f6',
                    background: e.id === (selected?.id) ? '#eef2ff' : '#ffffff',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontWeight: 600, color: '#111827' }}>
                    {e.source === 'ai-scan' ? 'AI scan' : 'Save'}
                  </div>
                  <div style={{ color: '#6b7280', marginTop: 2 }}>{e.atLocalDisplay}</div>
                  <div style={{ color: '#9ca3af', marginTop: 2 }}>
                    {e.actor?.displayName ?? '—'} · {e.timezone ?? '—'}
                  </div>
                </button>
              ))
            )}
          </div>

          <div style={{ flex: 1, padding: 16, overflow: 'auto', minWidth: 0 }}>
            {!selected ? null : (
              <>
                <div style={{ fontSize: 12, marginBottom: 12, color: '#374151' }}>
                  <strong>When (local):</strong> {selected.atLocalDisplay}
                  <br />
                  <strong>When (UTC):</strong> {selected.atUtc}
                  <br />
                  <strong>Actor:</strong> {selected.actor?.displayName ?? '—'} ({selected.actor?.id ?? '—'})
                  <br />
                  <strong>Source:</strong> {selected.source === 'ai-scan' ? 'AI scan' : 'Save'}
                </div>
                {selected.summaryLines?.length > 0 && (
                  <div
                    style={{
                      marginBottom: 12,
                      padding: 10,
                      background: '#fef3c7',
                      borderRadius: 8,
                      fontSize: 11,
                      color: '#92400e',
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Summary</div>
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {selected.summaryLines.map((line, i) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div style={{ marginBottom: 12, fontSize: 12, fontWeight: 600, color: '#111827' }}>
                  What changed (by canvas node)
                </div>
                {auditSections.length === 0 ? (
                  <div style={{ fontSize: 12, color: '#6b7280' }}>No grouped changes.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {auditSections.map((sec, si) => (
                      <div
                        key={si}
                        style={{
                          border: '1px solid #e5e7eb',
                          borderRadius: 8,
                          overflow: 'hidden',
                          background: '#fafafa',
                        }}
                      >
                        <div
                          style={{
                            padding: '10px 12px',
                            background: '#f3f4f6',
                            borderBottom: '1px solid #e5e7eb',
                          }}
                        >
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#1f2937' }}>{sec.title}</div>
                          {sec.subtitle && (
                            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>{sec.subtitle}</div>
                          )}
                        </div>
                        <ul style={{ margin: 0, padding: '8px 12px 10px 28px', listStyle: 'disc' }}>
                          {sec.changes.map((ch, ci) => (
                            <li key={ci} style={{ marginBottom: 8, fontSize: 12, color: '#374151' }}>
                              <div style={{ fontWeight: 600 }}>{ch.fieldLabel}</div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4, alignItems: 'baseline' }}>
                                <span style={{ color: '#991b1b' }}>
                                  Before: <code style={{ fontSize: 10 }}>{formatAuditValue(ch.before)}</code>
                                </span>
                                <span style={{ color: '#166534' }}>
                                  After: <code style={{ fontSize: 10 }}>{formatAuditValue(ch.after)}</code>
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ marginTop: 16 }}>
                  <button
                    type="button"
                    onClick={() => setShowTechnical((s) => !s)}
                    style={{
                      padding: '6px 10px',
                      fontSize: 12,
                      borderRadius: 6,
                      border: '1px solid #d1d5db',
                      background: '#ffffff',
                      cursor: 'pointer',
                    }}
                  >
                    {showTechnical ? 'Hide' : 'Show'} technical paths (JSON)
                  </button>
                </div>
                {showTechnical && (
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 10 }}>
                    <JsonBlock title="Before (flat keys)" obj={selected.beforeFlat} />
                    <JsonBlock title="After (flat keys)" obj={selected.afterFlat} />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useMemo, useState } from 'react';
import ReactFlow, { ReactFlowProvider, Background, Controls, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';
import { getCaseInstanceById } from '../lib/caseInstanceStorage';
import { getWorkflowById } from '../lib/workflowStorage';

export default function CaseTraceView({ caseId, workflows, onBack }) {
  const caseInstance = useMemo(() => getCaseInstanceById(caseId), [caseId]);
  const trace = caseInstance?.executionTrace;
  const workflow = useMemo(
    () => (trace?.workflowId ? getWorkflowById(trace.workflowId) : null),
    [trace?.workflowId, workflows]
  );

  const { nodes: rawNodes = [], edges: rawEdges = [] } = workflow?.definition || {};
  const traceNodeIds = trace?.nodeIds || [];

  const nodes = useMemo(
    () =>
      rawNodes.map((n) => {
        const stepIndex = traceNodeIds.indexOf(n.id);
        const isTraced = stepIndex >= 0;
        return {
          ...n,
          style: isTraced
            ? {
                ...n.style,
                border: '3px solid #0d9488',
                boxShadow: '0 0 12px rgba(13,148,136,0.35)',
                background: n.style?.background || '#f0fdf4',
              }
            : { ...n.style, opacity: traceNodeIds.length ? 0.5 : 1 },
          data: {
            ...n.data,
            ...(isTraced ? { stepNumber: stepIndex + 1 } : {}),
          },
        };
      }),
    [rawNodes, traceNodeIds]
  );

  const edges = useMemo(
    () =>
      rawEdges.map((e) => ({
        ...e,
        animated: traceNodeIds.length > 0 && traceNodeIds.includes(e.source) && traceNodeIds.includes(e.target),
        style: traceNodeIds.length > 0 && traceNodeIds.includes(e.source) && traceNodeIds.includes(e.target)
          ? { stroke: '#0d9488', strokeWidth: 2 }
          : undefined,
      })),
    [rawEdges, traceNodeIds]
  );

  if (!caseInstance) {
    return (
      <div style={{ maxWidth: 700, margin: '0 auto', padding: 24 }}>
        <p style={{ color: '#6b7280' }}>Case not found.</p>
        <button type="button" onClick={onBack} style={{ marginTop: 12, padding: '8px 14px', cursor: 'pointer' }}>
          ← Back
        </button>
      </div>
    );
  }

  if (!trace || !trace.workflowId) {
    return (
      <div style={{ maxWidth: 700, margin: '0 auto', padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
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
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Trace: {caseInstance.title || caseId}</h1>
        </div>
        <div
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            padding: 24,
            background: '#f9fafb',
            color: '#6b7280',
            fontSize: 14,
          }}
        >
          No execution trace for this case. Trace is recorded when the workflow engine runs this case through a
          workflow. Run a workflow with this case to see the path here.
        </div>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div style={{ maxWidth: 700, margin: '0 auto', padding: 24 }}>
        <p style={{ color: '#6b7280' }}>Workflow not found for this trace.</p>
        <button type="button" onClick={onBack} style={{ marginTop: 12, padding: '8px 14px', cursor: 'pointer' }}>
          ← Back
        </button>
      </div>
    );
  }

  const pathLabels = traceNodeIds
    .map((id) => {
      const n = rawNodes.find((node) => node.id === id);
      return n?.data?.label || n?.id || id;
    })
    .filter(Boolean);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 500 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid #e5e7eb',
          background: '#ffffff',
          flexShrink: 0,
        }}
      >
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
            <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
              Trace: {caseInstance.title || caseId}
            </h1>
            <div style={{ fontSize: 12, color: '#6b7280' }}>
              Workflow: {workflow.name || trace.workflowId} · {traceNodeIds.length} steps
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, minHeight: 400 }}>
        <div
          style={{
            flex: 1,
            minHeight: 400,
            borderRight: '1px solid #e5e7eb',
            background: '#fafafa',
          }}
        >
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              fitView
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={false}
              panOnDrag={true}
              zoomOnScroll={true}
            >
              <Background gap={16} color="#e5e7eb" />
              <Controls />
              <MiniMap nodeColor="#0d9488" />
            </ReactFlow>
          </ReactFlowProvider>
        </div>

        <aside
          style={{
            width: 280,
            padding: 16,
            background: '#f0fdf4',
            borderLeft: '1px solid #99f6e4',
            overflow: 'auto',
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 8px' }}>Execution path</h3>
          <p style={{ fontSize: 12, color: '#0f766e', margin: '0 0 12px' }}>
            Highlighted nodes show where this case flowed (in order).
          </p>
          <ol style={{ margin: 0, paddingLeft: 20, fontSize: 13, lineHeight: 1.8 }}>
            {pathLabels.map((label, i) => (
              <li key={i} style={{ color: '#065f46' }}>
                <strong>{label}</strong>
              </li>
            ))}
          </ol>
          {traceNodeIds.length === 0 && (
            <p style={{ fontSize: 12, color: '#6b7280' }}>No steps recorded yet.</p>
          )}
        </aside>
      </div>
    </div>
  );
}

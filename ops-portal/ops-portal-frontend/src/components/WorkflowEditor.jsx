import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  useReactFlow,
  addEdge,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { slugFromName, uniqueWorkflowId } from '../lib/workflowStorage';
import WorkflowAuditModal from './WorkflowAuditModal';
import { validateTaskLabels } from '../lib/workflowValidation';

// Palette shown on the left-hand side
const nodeTypesPalette = [
  { type: 'start', label: 'Start', description: 'Entry point of the workflow' },
  { type: 'condition', label: 'Condition', description: 'Branch logic using conditions' },
  { type: 'task', label: 'Task', description: 'Operational or AI task' },
  { type: 'end', label: 'End', description: 'Marks the workflow as complete' },
];

// Initial example: single start node
const initialNodes = [
  {
    id: 'start-1',
    type: 'start',
    position: { x: 0, y: 0 },
    data: { label: 'Start', description: 'Workflow entry' },
  },
];

const initialEdges = [];

let id = 0;
const getId = () => `node_${id++}`;

// ---- Custom node renderers -------------------------------------------------

const baseNodeStyle = {
  borderRadius: 12,
  padding: '10px 14px',
  color: '#ffffff',
  fontSize: 13,
  fontWeight: 600,
  boxShadow: '0 8px 16px rgba(15, 23, 42, 0.12)',
  minWidth: 140,
};

function StartNode({ data }) {
  return (
    <div
      style={{
        ...baseNodeStyle,
        background: 'linear-gradient(135deg, #059669, #10b981)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: 999,
          background: 'rgba(255,255,255,0.16)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
        }}
      >
        ▶
      </div>
      <span>{data.label || 'Start'}</span>
      <Handle type="source" position={Position.Bottom} style={{ background: '#ffffff' }} />
    </div>
  );
}

function TaskNode({ data }) {
  const actionType = data.actionType || 'data';
  const actionLabel =
    actionType === 'data'
      ? 'Data read/write'
      : actionType === 'notification'
      ? 'Notifications & Escalations'
      : 'Human Agent';

  return (
    <div
      style={{
        ...baseNodeStyle,
        background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: '#ffffff' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: 6,
            border: '1px dashed rgba(255,255,255,0.6)',
          }}
        />
        <span>{data.label || 'Task'}</span>
      </div>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 10,
          padding: '2px 6px',
          borderRadius: 999,
          background: 'rgba(15,23,42,0.35)',
          alignSelf: 'flex-start',
        }}
      >
        <span>{actionLabel}</span>
      </div>
      {data.description ? (
        <div style={{ fontSize: 11, fontWeight: 400, opacity: 0.9 }}>{data.description}</div>
      ) : (
        <div style={{ fontSize: 11, fontWeight: 400, opacity: 0.7 }}>Configure this task</div>
      )}
      <Handle type="source" position={Position.Bottom} style={{ background: '#ffffff' }} />
    </div>
  );
}

function ConditionNode({ data }) {
  const isAiMode = data?.conditionMode === 'ai';
  const isCouncilMode = data?.conditionMode === 'council';
  const config = isCouncilMode ? data?.councilConfig : data?.aiConfig;
  const allowedOutputs = (config?.allowedOutputs || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const leftLabel = allowedOutputs[0] || (isAiMode || isCouncilMode ? 'Yes' : 'true');
  const rightLabel = allowedOutputs[1] || (isAiMode || isCouncilMode ? 'No' : 'false');
  const displayLabel = data?.label || (isCouncilMode ? 'Council' : isAiMode ? 'AI decision' : 'Condition');

  return (
    <div style={{ position: 'relative', width: 140, height: 96 }}>
      <Handle type="target" position={Position.Top} style={{ background: '#111827' }} />
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: 80,
          height: 80,
          transform: 'translate(-50%, -50%) rotate(45deg)',
          background: isCouncilMode
            ? 'linear-gradient(135deg, #0f766e, #14b8a6)'
            : isAiMode
            ? 'linear-gradient(135deg, #4f46e5, #6366f1)'
            : 'linear-gradient(135deg, #7c3aed, #a855f7)',
          borderRadius: 18,
          boxShadow: isCouncilMode
            ? '0 8px 18px rgba(15, 118, 110, 0.35)'
            : isAiMode
            ? '0 8px 18px rgba(67, 56, 202, 0.35)'
            : '0 8px 18px rgba(88, 28, 135, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            transform: 'rotate(-45deg)',
            color: '#ffffff',
            fontSize: 12,
            fontWeight: 600,
            textAlign: 'center',
            padding: '0 6px',
          }}
        >
          {displayLabel}
        </div>
        {isAiMode && (
          <div
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              transform: 'rotate(-45deg)',
              fontSize: 9,
              fontWeight: 700,
              color: 'rgba(255,255,255,0.9)',
              letterSpacing: '0.02em',
            }}
          >
            AI
          </div>
        )}
        {isCouncilMode && (
          <div
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              transform: 'rotate(-45deg)',
              fontSize: 9,
              fontWeight: 700,
              color: 'rgba(255,255,255,0.9)',
              letterSpacing: '0.02em',
            }}
          >
            Council
          </div>
        )}
      </div>
      {/* Branch handles: positioned at 30% / 70% from left to match original layout */}
      <Handle
        type="source"
        id="true"
        position={Position.Bottom}
        style={{ left: '30%', transform: 'translateX(-50%)', background: '#22c55e' }}
      />
      <Handle
        type="source"
        id="false"
        position={Position.Bottom}
        style={{ left: '70%', transform: 'translateX(-50%)', background: '#ef4444' }}
      />
      {/* Labels under the handles, aligned to same positions */}
      <div style={{ position: 'absolute', bottom: 2, left: 0, right: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', left: '30%', transform: 'translateX(-50%)', width: 80, textAlign: 'center' }}>
          <span style={{ fontSize: 9, fontWeight: 600, color: '#166534', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={leftLabel}>
            {leftLabel}
          </span>
        </div>
        <div style={{ position: 'absolute', left: '70%', transform: 'translateX(-50%)', width: 80, textAlign: 'center' }}>
          <span style={{ fontSize: 9, fontWeight: 600, color: '#b91c1c', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={rightLabel}>
            {rightLabel}
          </span>
        </div>
      </div>
    </div>
  );
}

function EndNode({ data }) {
  return (
    <div
      style={{
        ...baseNodeStyle,
        background: 'linear-gradient(135deg, #4b5563, #6b7280)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: '#ffffff' }} />
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: 999,
          border: '2px solid rgba(255,255,255,0.7)',
        }}
      />
      <span>{data.label || 'End'}</span>
    </div>
  );
}

const nodeTypes = {
  start: StartNode,
  task: TaskNode,
  condition: ConditionNode,
  end: EndNode,
};

function WorkflowCanvas({
  initialWorkflow,
  onSave,
  onBack,
  caseTemplates = [],
  communicationTemplates = [],
}) {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(
    initialWorkflow?.definition?.nodes?.length ? initialWorkflow.definition.nodes : initialNodes
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    initialWorkflow?.definition?.edges ?? initialEdges
  );
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [workflowName, setWorkflowName] = useState(initialWorkflow?.name ?? '');
  const [workflowDescription, setWorkflowDescription] = useState(initialWorkflow?.description ?? '');
  const [requestBodyDescription, setRequestBodyDescription] = useState(
    initialWorkflow?.requestBodyDescription ?? ''
  );
  const [entryConfig, setEntryConfig] = useState(
    () =>
      initialWorkflow?.entryConfig || {
        httpEnabled: true,
        emailEnabled: false,
        emailAddress: '',
        emailSubjectFilter: '',
        scheduleEnabled: false,
        scheduleType: 'daily', // 'daily' | 'cron'
        scheduleTimeOfDay: '',
        scheduleTimezone: '',
        scheduleBusinessDaysOnly: false,
      }
  );
  const workflowId = initialWorkflow?.id ?? null;
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [saveBlockingMessages, setSaveBlockingMessages] = useState([]);
  const { project } = useReactFlow();
  const taskLabelSignatureRef = useRef('');

  // Save errors are from the last failed save; clear when task labels change (not when only dragging — positions update too).
  useEffect(() => {
    const sig = nodes
      .filter((n) => n?.type === 'task')
      .map((n) => `${n.id ?? '?'}:${(n.data?.label != null ? String(n.data.label) : '').trim()}`)
      .sort()
      .join('|');
    if (sig !== taskLabelSignatureRef.current) {
      taskLabelSignatureRef.current = sig;
      setSaveBlockingMessages([]);
    }
  }, [nodes]);

  const auditWorkflowId = useMemo(() => {
    const name = (workflowName || 'Unnamed').trim();
    return workflowId || uniqueWorkflowId(slugFromName(name));
  }, [workflowId, workflowName]);

  // Default edge appearance: smooth, animated with arrowheads.
  const defaultEdgeOptions = useMemo(
    () => ({
      type: 'smoothstep',
      animated: true,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 16,
        height: 16,
      },
    }),
    []
  );

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  );

  const taskLabelWarningsForSelection = useMemo(() => {
    if (!selectedNode || selectedNode.type !== 'task') return [];
    const { errors } = validateTaskLabels(nodes);
    return errors.filter((e) => e.nodeId === selectedNode.id);
  }, [nodes, selectedNode]);

  const selectedCaseTemplate = useMemo(() => {
    if (!selectedNode) return null;
    const caseTemplateId = selectedNode.data?.actionConfig?.caseTemplateId;
    if (!caseTemplateId) return null;
    return caseTemplates.find((tpl) => tpl.id === caseTemplateId) || null;
  }, [selectedNode, caseTemplates]);

  const selectedCommTemplate = useMemo(() => {
    if (!selectedNode) return null;
    const commId = selectedNode.data?.actionConfig?.commTemplateId;
    if (!commId) return null;
    return communicationTemplates.find((tpl) => tpl.id === commId) || null;
  }, [selectedNode, communicationTemplates]);

  const onConnect = useCallback(
    (params) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
          },
          eds
        )
      ),
    [setEdges]
  );

  const onNodeClick = useCallback((_, node) => {
    setSelectedNodeId(node.id);
  }, []);

  const onNodesDelete = useCallback(
    (deleted) => {
      setNodes((nds) => nds.filter((n) => !deleted.some((d) => d.id === n.id)));
      setEdges((eds) => eds.filter((e) => !deleted.some((d) => d.id === e.source || d.id === e.target)));
      if (deleted.some((d) => d.id === selectedNodeId)) {
        setSelectedNodeId(null);
      }
    },
    [selectedNodeId, setNodes, setEdges]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const bounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!bounds) return;

      const position = project({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      const paletteItem = nodeTypesPalette.find((n) => n.type === type);
      const newId = getId();
      const taskNum = nodes.filter((n) => n.type === 'task').length;
      const label =
        type === 'task'
          ? taskNum === 0
            ? 'Task'
            : `Task ${taskNum + 1}`
          : paletteItem?.label || type;

      const newNode = {
        id: newId,
        type,
        position,
        data: {
          label,
          description: paletteItem?.description || '',
          // For condition nodes we initialise an empty rule set
          ...(type === 'condition'
            ? {
                rules: [
                  {
                    id: 'rule-1',
                    left: '',
                    operator: 'equals',
                    right: '',
                    logic: 'AND',
                  },
                ],
              }
            : {}),
        },
      };

      setNodes((nds) => nds.concat(newNode));
      setSelectedNodeId(newNode.id);
    },
    [project, setNodes, nodes]
  );

  const handleNodeFieldChange = useCallback(
    (field, value) => {
      if (!selectedNodeId) return;

      setNodes((nds) =>
        nds.map((node) =>
          node.id === selectedNodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  [field]: value,
                },
              }
            : node
        )
      );
    },
    [selectedNodeId, setNodes]
  );

  const handleDecisionRuleChange = useCallback(
    (index, field, value) => {
      if (!selectedNodeId) return;

      setNodes((nds) =>
        nds.map((node) => {
          if (node.id !== selectedNodeId || node.type !== 'condition') return node;

          const rules = Array.isArray(node.data?.rules) ? [...node.data.rules] : [];
          if (!rules[index]) return node;
          rules[index] = { ...rules[index], [field]: value };

          return {
            ...node,
            data: {
              ...node.data,
              rules,
            },
          };
        })
      );
    },
    [selectedNodeId, setNodes]
  );

  const addDecisionRule = useCallback(() => {
    if (!selectedNodeId) return;

    setNodes((nds) =>
      nds.map((node) => {
        if (node.id !== selectedNodeId || node.type !== 'condition') return node;
        const rules = Array.isArray(node.data?.rules) ? [...node.data.rules] : [];
        rules.push({
          id: `rule-${rules.length + 1}`,
          left: '',
          operator: 'equals',
          right: '',
          logic: 'AND',
        });
        return {
          ...node,
          data: {
            ...node.data,
            rules,
          },
        };
      })
    );
  }, [selectedNodeId, setNodes]);

  const removeDecisionRule = useCallback(
    (index) => {
      if (!selectedNodeId) return;

      setNodes((nds) =>
        nds.map((node) => {
          if (node.id !== selectedNodeId || node.type !== 'condition') return node;
          const rules = Array.isArray(node.data?.rules) ? [...node.data.rules] : [];
          rules.splice(index, 1);
          return {
            ...node,
            data: {
              ...node.data,
              rules,
            },
          };
        })
      );
    },
    [selectedNodeId, setNodes]
  );

  const addCouncilRole = useCallback(() => {
    if (!selectedNodeId) return;
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id !== selectedNodeId || node.type !== 'condition') return node;
        const roles = Array.isArray(node.data?.councilConfig?.roles) ? [...node.data.councilConfig.roles] : [];
        roles.push({
          id: `role-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          name: 'New role',
          instruction: 'Describe this perspective\'s mandate.',
        });
        return {
          ...node,
          data: {
            ...node.data,
            councilConfig: {
              ...(node.data?.councilConfig || {}),
              roles,
            },
          },
        };
      })
    );
  }, [selectedNodeId, setNodes]);

  const removeCouncilRole = useCallback(
    (index) => {
      if (!selectedNodeId) return;
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id !== selectedNodeId || node.type !== 'condition') return node;
          const roles = Array.isArray(node.data?.councilConfig?.roles) ? [...node.data.councilConfig.roles] : [];
          roles.splice(index, 1);
          return {
            ...node,
            data: {
              ...node.data,
              councilConfig: {
                ...(node.data?.councilConfig || {}),
                roles,
              },
            },
          };
        })
      );
    },
    [selectedNodeId, setNodes]
  );

  const updateCouncilRole = useCallback(
    (index, field, value) => {
      if (!selectedNodeId) return;
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id !== selectedNodeId || node.type !== 'condition') return node;
          const roles = Array.isArray(node.data?.councilConfig?.roles) ? [...node.data.councilConfig.roles] : [];
          if (!roles[index]) return node;
          roles[index] = { ...roles[index], [field]: value };
          return {
            ...node,
            data: {
              ...node.data,
              councilConfig: {
                ...(node.data?.councilConfig || {}),
                roles,
              },
            },
          };
        })
      );
    },
    [selectedNodeId, setNodes]
  );

  const updateCouncilConfig = useCallback(
    (field, value) => {
      if (!selectedNodeId) return;
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id !== selectedNodeId || node.type !== 'condition') return node;
          return {
            ...node,
            data: {
              ...node.data,
              councilConfig: {
                ...(node.data?.councilConfig || {}),
                [field]: value,
              },
            },
          };
        })
      );
    },
    [selectedNodeId, setNodes]
  );

  const buildWorkflowPayload = useCallback(() => {
    const name = (workflowName || 'Unnamed').trim();
    const id = workflowId || uniqueWorkflowId(slugFromName(name));
    return {
      id,
      name,
      description: workflowDescription.trim() || undefined,
      requestBodyDescription: requestBodyDescription.trim() || undefined,
      entryConfig,
      definition: {
        nodes: nodes.map(({ id: nid, type, position, data }) => ({
          id: nid,
          type,
          position,
          data,
        })),
        edges: edges.map(({ id: eid, source, target, sourceHandle, targetHandle, label }) => ({
          id: eid,
          source,
          target,
          sourceHandle,
          targetHandle,
          label,
        })),
      },
    };
  }, [
    nodes,
    edges,
    workflowName,
    workflowDescription,
    requestBodyDescription,
    workflowId,
    entryConfig,
  ]);

  const saveWorkflow = useCallback(() => {
    const payload = buildWorkflowPayload();
    const { ok, errors } = validateTaskLabels(payload.definition.nodes);
    if (!ok) {
      setSaveBlockingMessages([...new Set(errors.map((e) => e.message))]);
      return;
    }
    setSaveBlockingMessages([]);
    onSave?.(payload);
  }, [onSave, buildWorkflowPayload]);

  const displayId = workflowId || (workflowName.trim() ? uniqueWorkflowId(slugFromName(workflowName)) : '—');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Header: back, name, ID, save */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '12px 16px',
          borderBottom: '1px solid #e5e7eb',
          background: '#ffffff',
          flexShrink: 0,
        }}
      >
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
        <input
          type="text"
          value={workflowName}
          onChange={(e) => setWorkflowName(e.target.value)}
          placeholder="Workflow name"
          style={{
            flex: 1,
            maxWidth: 280,
            padding: '8px 12px',
            fontSize: 14,
            fontWeight: 600,
            borderRadius: 6,
            border: '1px solid #d1d5db',
          }}
        />
        <div style={{ fontSize: 12, color: '#6b7280', fontFamily: 'monospace' }}>
          ID: {displayId}
        </div>
        <button
          type="button"
          onClick={() => setAuditModalOpen(true)}
          style={{
            padding: '8px 14px',
            fontSize: 13,
            fontWeight: 600,
            borderRadius: 8,
            border: '1px solid #d1d5db',
            background: '#f9fafb',
            color: '#374151',
            cursor: 'pointer',
          }}
        >
          Audit log
        </button>
        {onSave && (
          <button
            type="button"
            onClick={saveWorkflow}
            style={{
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 8,
              border: 'none',
              background: '#4f46e5',
              color: '#ffffff',
              cursor: 'pointer',
            }}
          >
            Save
          </button>
        )}
      </div>

      {saveBlockingMessages.length > 0 && (
        <div
          style={{
            padding: '10px 16px',
            borderBottom: '1px solid #e5e7eb',
            background: '#fef2f2',
            fontSize: 12,
            color: '#991b1b',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Fix before saving</div>
          {saveBlockingMessages.map((msg, i) => (
            <div key={i} style={{ marginBottom: 4, lineHeight: 1.45 }}>
              {msg}
            </div>
          ))}
        </div>
      )}

      <WorkflowAuditModal
        workflowId={auditWorkflowId}
        open={auditModalOpen}
        onClose={() => setAuditModalOpen(false)}
      />

      <div style={{ display: 'flex', flex: 1, minHeight: 0, gap: 16 }}>
        {/* Palette / toolbox */}
        <div
          style={{
            width: 220,
            borderRight: '1px solid #e5e7eb',
            padding: 12,
            background: '#f9fafb',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Workflow building blocks</h3>
          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 10, lineHeight: 1.4 }}>
            Drag the same block onto the canvas as many times as you need. There is <strong>no limit</strong> on how many tasks,
            conditions, or other steps a workflow can contain.
          </div>
          {nodeTypesPalette.map((node) => (
            <div
              key={node.type}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData('application/reactflow', node.type);
                event.dataTransfer.effectAllowed = 'move';
              }}
              style={{
                padding: '8px 10px',
                borderRadius: 6,
                border: '1px solid #d1d5db',
                background: '#ffffff',
                cursor: 'grab',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600 }}>{node.label}</div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>{node.description}</div>
            </div>
          ))}
          <div
            style={{
              marginTop: 'auto',
              padding: 8,
              borderRadius: 6,
              background: '#eff6ff',
              fontSize: 11,
              color: '#1e40af',
            }}
          >
            Select the <strong>Start</strong> node to configure entry channels (HTTP, email, schedule). Tasks and decisions
            process a JSON payload; a task can lead to another decision. Add as many steps as your process requires.
          </div>
        </div>

      {/* Canvas */}
      <div
        ref={reactFlowWrapper}
        style={{ flex: 1, height: '100%', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}
        onDrop={onDrop}
        onDragOver={onDragOver}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onNodesDelete={onNodesDelete}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView
        >
          <MiniMap nodeColor="#4f46e5" />
          <Controls />
          <Background gap={16} color="#e5e7eb" />
        </ReactFlow>
      </div>

      {/* Inspector */}
      <div
        style={{
          width: 260,
          borderLeft: '1px solid #e5e7eb',
          padding: 12,
          background: '#f9fafb',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Step configuration</h3>
        {selectedNode ? (
          <>
            <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8 }}>
              Node ID: {selectedNode.id}
              <br />
              Type: {selectedNode.type}
            </div>
            <label style={{ fontSize: 12, fontWeight: 500, marginBottom: 4 }}>Label</label>
            <input
              type="text"
              value={selectedNode.data?.label || ''}
              onChange={(e) => handleNodeFieldChange('label', e.target.value)}
              style={{
                padding: '6px 8px',
                fontSize: 13,
                borderRadius: 6,
                border: '1px solid #d1d5db',
                marginBottom: 4,
              }}
            />
            {selectedNode.type === 'task' && (
              <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 6, lineHeight: 1.35 }}>
                Use a short label <strong>unique among all tasks</strong> (case-sensitive: <code style={{ fontSize: 10 }}>a</code>{' '}
                and <code style={{ fontSize: 10 }}>A</code> differ). Check the minimap—another task off-screen may share the same
                text. Audits group changes under this name.
              </div>
            )}
            {taskLabelWarningsForSelection.length > 0 && (
              <div
                style={{
                  fontSize: 11,
                  color: '#b45309',
                  marginBottom: 8,
                  padding: 6,
                  background: '#fffbeb',
                  borderRadius: 6,
                  border: '1px solid #fde68a',
                }}
              >
                {taskLabelWarningsForSelection.map((e, i) => (
                  <div key={i}>{e.message}</div>
                ))}
              </div>
            )}

            <label style={{ fontSize: 12, fontWeight: 500, marginBottom: 4 }}>Description</label>
            <textarea
              rows={3}
              value={selectedNode.data?.description || ''}
              onChange={(e) => handleNodeFieldChange('description', e.target.value)}
              style={{
                padding: '6px 8px',
                fontSize: 13,
                borderRadius: 6,
                border: '1px solid #d1d5db',
                resize: 'vertical',
                marginBottom: 8,
              }}
            />

            {selectedNode.type === 'condition' && (
              <div
                style={{
                  marginTop: 8,
                  paddingTop: 8,
                  borderTop: '1px solid #e5e7eb',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 600 }}>Decision</div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>
                  Choose rules, a single AI decision, or a Council (multi-agent debate). The engine uses the{' '}
                  <code>true</code> / <code>false</code> handles (or custom branches) from this node to route cases.
                </div>

                <label style={{ fontSize: 11, fontWeight: 500, marginTop: 4 }}>Mode</label>
                <select
                  value={selectedNode.data?.conditionMode || 'rules'}
                  onChange={(e) =>
                    setNodes((nds) =>
                      nds.map((node) =>
                        node.id === selectedNode.id && node.type === 'condition'
                          ? {
                              ...node,
                              data: {
                                ...(node.data || {}),
                                conditionMode: e.target.value,
                                ...(e.target.value === 'council' && !node.data?.councilConfig
                                  ? {
                                      councilConfig: {
                                        question: node.data?.aiConfig?.question || '',
                                        allowedOutputs: node.data?.aiConfig?.allowedOutputs || '',
                                        outputPath: node.data?.aiConfig?.outputPath || '',
                                        roles: [
                                          { id: 'role-1', name: 'Customer impact', instruction: 'Argue from the perspective of customer experience and impact.' },
                                          { id: 'role-2', name: 'Compliance / risk', instruction: 'Argue from the perspective of regulatory and risk controls.' },
                                          { id: 'role-3', name: 'Operations capacity', instruction: 'Argue from the perspective of ops capacity and workload.' },
                                        ],
                                      },
                                    }
                                  : {}),
                              },
                            }
                          : node
                      )
                    )
                  }
                  style={{
                    fontSize: 12,
                    padding: '4px 6px',
                    borderRadius: 6,
                    border: '1px solid #d1d5db',
                    width: '100%',
                    marginBottom: 4,
                  }}
                >
                  <option value="rules">Rules (IF / AND / OR)</option>
                  <option value="ai">AI decision</option>
                  <option value="council">Council (multi-agent)</option>
                </select>

                {/* Rules-based mode (existing behaviour) */}
                {(!selectedNode.data?.conditionMode || selectedNode.data?.conditionMode === 'rules') && (
                  <>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>
                      Define IF / AND / OR conditions. The engine can use the <code>true</code> /
                      <code>false</code> handles from this node to route cases.
                    </div>

                    {(selectedNode.data?.rules || []).map((rule, index) => (
                      <div
                        key={rule.id || index}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 4,
                          padding: 6,
                          borderRadius: 6,
                          background: '#f3f4f6',
                        }}
                      >
                        <div style={{ display: 'flex', gap: 4 }}>
                          <select
                            value={rule.logic || 'AND'}
                            onChange={(e) => handleDecisionRuleChange(index, 'logic', e.target.value)}
                            style={{
                              fontSize: 11,
                              padding: '4px 6px',
                              borderRadius: 4,
                              border: '1px solid #d1d5db',
                              width: 64,
                            }}
                          >
                            <option value="AND">AND</option>
                            <option value="OR">OR</option>
                          </select>
                          <input
                            type="text"
                            placeholder="condition_a"
                            value={rule.left || ''}
                            onChange={(e) => handleDecisionRuleChange(index, 'left', e.target.value)}
                            style={{
                              flex: 1,
                              fontSize: 11,
                              padding: '4px 6px',
                              borderRadius: 4,
                              border: '1px solid #d1d5db',
                            }}
                          />
                          <select
                            value={rule.operator || 'equals'}
                            onChange={(e) => handleDecisionRuleChange(index, 'operator', e.target.value)}
                            style={{
                              fontSize: 11,
                              padding: '4px 6px',
                              borderRadius: 4,
                              border: '1px solid #d1d5db',
                            }}
                          >
                            <option value="equals">==</option>
                            <option value="not_equals">!=</option>
                            <option value="contains">contains</option>
                            <option value="greater_than">&gt;</option>
                            <option value="less_than">&lt;</option>
                          </select>
                          <input
                            type="text"
                            placeholder="condition_b"
                            value={rule.right || ''}
                            onChange={(e) => handleDecisionRuleChange(index, 'right', e.target.value)}
                            style={{
                              flex: 1,
                              fontSize: 11,
                              padding: '4px 6px',
                              borderRadius: 4,
                              border: '1px solid #d1d5db',
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeDecisionRule(index)}
                          style={{
                            alignSelf: 'flex-end',
                            border: 'none',
                            background: 'transparent',
                            color: '#ef4444',
                            fontSize: 11,
                            cursor: 'pointer',
                          }}
                        >
                          Remove rule
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addDecisionRule}
                      style={{
                        marginTop: 4,
                        padding: '6px 8px',
                        fontSize: 11,
                        borderRadius: 999,
                        border: '1px dashed #9ca3af',
                        background: '#ffffff',
                        cursor: 'pointer',
                        alignSelf: 'flex-start',
                      }}
                    >
                      + Add condition
                    </button>

                    <div style={{ fontSize: 11, color: '#6b7280' }}>
                      Connect the green handle to your &quot;true&quot; branch and the red handle to your
                      &quot;false&quot; branch.
                    </div>
                  </>
                )}

                {/* AI-assisted mode */}
                {selectedNode.data?.conditionMode === 'ai' && (
                  <div
                    style={{
                      marginTop: 4,
                      padding: 8,
                      borderRadius: 8,
                      background: '#eff6ff',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#1d4ed8' }}>AI decision</div>
                    <div style={{ fontSize: 11, color: '#4b5563' }}>
                      Describe how the AI should route this item. The engine will call an LLM with this instruction and
                      the payload, then map the AI&apos;s answer onto this node&apos;s outgoing handles.
                    </div>

                    <label style={{ fontSize: 11, fontWeight: 500 }}>Routing question / instruction</label>
                    <textarea
                      rows={3}
                      placeholder="Example: Decide whether this request should go to HUMAN_REVIEW or AUTO_CLOSE based on risk, amount, and channel. Answer with only one of: HUMAN_REVIEW, AUTO_CLOSE."
                      value={selectedNode.data?.aiConfig?.question || ''}
                      onChange={(e) =>
                        setNodes((nds) =>
                          nds.map((node) =>
                            node.id === selectedNode.id && node.type === 'condition'
                              ? {
                                  ...node,
                                  data: {
                                    ...(node.data || {}),
                                    aiConfig: {
                                      ...(node.data?.aiConfig || {}),
                                      question: e.target.value,
                                    },
                                  },
                                }
                              : node
                          )
                        )
                      }
                      style={{
                        padding: '6px 8px',
                        fontSize: 12,
                        borderRadius: 6,
                        border: '1px solid #d1d5db',
                      }}
                    />

                    <label style={{ fontSize: 11, fontWeight: 500 }}>Allowed outputs (labels)</label>
                    <input
                      type="text"
                      placeholder="e.g. HUMAN_REVIEW, AUTO_CLOSE, UNCLEAR"
                      value={selectedNode.data?.aiConfig?.allowedOutputs || ''}
                      onChange={(e) =>
                        setNodes((nds) =>
                          nds.map((node) =>
                            node.id === selectedNode.id && node.type === 'condition'
                              ? {
                                  ...node,
                                  data: {
                                    ...(node.data || {}),
                                    aiConfig: {
                                      ...(node.data?.aiConfig || {}),
                                      allowedOutputs: e.target.value,
                                    },
                                  },
                                }
                              : node
                          )
                        )
                      }
                      style={{
                        padding: '6px 8px',
                        fontSize: 12,
                        borderRadius: 6,
                        border: '1px solid #d1d5db',
                      }}
                    />
                    <div style={{ fontSize: 11, color: '#6b7280' }}>
                      The engine should constrain the LLM to these labels and map them to outgoing branches (for example
                      using handle labels or payload fields).
                    </div>

                    <label style={{ fontSize: 11, fontWeight: 500 }}>Optional few-shot examples</label>
                    <textarea
                      rows={3}
                      placeholder={'Example format:\\nINPUT: {...payload...}\\nOUTPUT: HUMAN_REVIEW — high amount over threshold.\\n---'}
                      value={selectedNode.data?.aiConfig?.examples || ''}
                      onChange={(e) =>
                        setNodes((nds) =>
                          nds.map((node) =>
                            node.id === selectedNode.id && node.type === 'condition'
                              ? {
                                  ...node,
                                  data: {
                                    ...(node.data || {}),
                                    aiConfig: {
                                      ...(node.data?.aiConfig || {}),
                                      examples: e.target.value,
                                    },
                                  },
                                }
                              : node
                          )
                        )
                      }
                      style={{
                        padding: '6px 8px',
                        fontSize: 12,
                        borderRadius: 6,
                        border: '1px solid #d1d5db',
                      }}
                    />

                    <label style={{ fontSize: 11, fontWeight: 500 }}>Write decision to payload path (optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. meta.routeDecision"
                      value={selectedNode.data?.aiConfig?.outputPath || ''}
                      onChange={(e) =>
                        setNodes((nds) =>
                          nds.map((node) =>
                            node.id === selectedNode.id && node.type === 'condition'
                              ? {
                                  ...node,
                                  data: {
                                    ...(node.data || {}),
                                    aiConfig: {
                                      ...(node.data?.aiConfig || {}),
                                      outputPath: e.target.value,
                                    },
                                  },
                                }
                              : node
                          )
                        )
                      }
                      style={{
                        padding: '6px 8px',
                        fontSize: 12,
                        borderRadius: 6,
                        border: '1px solid #d1d5db',
                      }}
                    />
                    <div style={{ fontSize: 11, color: '#6b7280' }}>
                      Optional: the engine can persist the chosen label into the payload so downstream tasks or humans
                      can see how this decision was made.
                    </div>
                  </div>
                )}

                {/* Council (multi-agent) mode */}
                {selectedNode.data?.conditionMode === 'council' && (
                  <div
                    style={{
                      marginTop: 4,
                      padding: 8,
                      borderRadius: 8,
                      background: '#f0fdf4',
                      border: '1px solid #99f6e4',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#0f766e' }}>Council (multi-agent)</div>
                    <div style={{ fontSize: 11, color: '#065f46' }}>
                      Multiple agent roles debate the same question; a moderator synthesizes and picks one outcome. Provides oversight and reduces reliance on a single prompt.
                    </div>

                    <label style={{ fontSize: 11, fontWeight: 500 }}>Shared question (for all roles)</label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Should this case go to HUMAN_REVIEW or AUTO_CLOSE? Consider risk, amount, and channel."
                      value={selectedNode.data?.councilConfig?.question || ''}
                      onChange={(e) => updateCouncilConfig('question', e.target.value)}
                      style={{
                        padding: '6px 8px',
                        fontSize: 12,
                        borderRadius: 6,
                        border: '1px solid #99f6e4',
                      }}
                    />

                    <label style={{ fontSize: 11, fontWeight: 500 }}>Allowed outputs (comma-separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. HUMAN_REVIEW, AUTO_CLOSE, ESCALATE"
                      value={selectedNode.data?.councilConfig?.allowedOutputs || ''}
                      onChange={(e) => updateCouncilConfig('allowedOutputs', e.target.value)}
                      style={{
                        padding: '6px 8px',
                        fontSize: 12,
                        borderRadius: 6,
                        border: '1px solid #99f6e4',
                      }}
                    />
                    <div style={{ fontSize: 11, color: '#065f46' }}>
                      The moderator must choose exactly one of these labels. Map each to an outgoing branch (e.g. green = first, red = second).
                    </div>

                    <label style={{ fontSize: 11, fontWeight: 500 }}>Write decision to payload path (optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. meta.councilDecision"
                      value={selectedNode.data?.councilConfig?.outputPath || ''}
                      onChange={(e) => updateCouncilConfig('outputPath', e.target.value)}
                      style={{
                        padding: '6px 8px',
                        fontSize: 12,
                        borderRadius: 6,
                        border: '1px solid #99f6e4',
                      }}
                    />

                    <div style={{ fontSize: 11, fontWeight: 600, color: '#0f766e', marginTop: 4 }}>Agencies (roles)</div>
                    <div style={{ fontSize: 11, color: '#065f46', marginBottom: 4 }}>
                      Each role argues from one perspective. The engine runs each agent, then a moderator synthesizes into one of the allowed outputs.
                    </div>
                    {(selectedNode.data?.councilConfig?.roles || []).map((role, index) => (
                      <div
                        key={role.id}
                        style={{
                          padding: 8,
                          borderRadius: 6,
                          background: '#ecfdf5',
                          border: '1px solid #a7f3d0',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 4,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 10, fontWeight: 600, color: '#047857' }}>Role {index + 1}</span>
                          <button
                            type="button"
                            onClick={() => removeCouncilRole(index)}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              color: '#b91c1c',
                              fontSize: 11,
                              cursor: 'pointer',
                            }}
                          >
                            Remove
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="Role name (e.g. Compliance)"
                          value={role.name || ''}
                          onChange={(e) => updateCouncilRole(index, 'name', e.target.value)}
                          style={{
                            padding: '4px 6px',
                            fontSize: 12,
                            borderRadius: 4,
                            border: '1px solid #a7f3d0',
                          }}
                        />
                        <textarea
                          rows={2}
                          placeholder="Instruction for this role (e.g. Argue from regulatory and risk perspective only.)"
                          value={role.instruction || ''}
                          onChange={(e) => updateCouncilRole(index, 'instruction', e.target.value)}
                          style={{
                            padding: '4px 6px',
                            fontSize: 11,
                            borderRadius: 4,
                            border: '1px solid #a7f3d0',
                            resize: 'vertical',
                          }}
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addCouncilRole}
                      style={{
                        padding: '6px 10px',
                        fontSize: 11,
                        borderRadius: 999,
                        border: '1px dashed #0d9488',
                        background: '#ffffff',
                        color: '#0f766e',
                        cursor: 'pointer',
                        alignSelf: 'flex-start',
                      }}
                    >
                      + Add agency (role)
                    </button>
                  </div>
                )}
              </div>
            )}

            {selectedNode.type === 'task' && (
              <div
                style={{
                  marginTop: 8,
                  paddingTop: 8,
                  borderTop: '1px solid #e5e7eb',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 600 }}>Task action</div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>
                  Choose how this task interacts with the case payload or external systems.
                </div>

                {/* Action taxonomy select */}
                <label style={{ fontSize: 11, fontWeight: 500 }}>Action type</label>
                <select
                  value={selectedNode.data?.actionType || 'data'}
                  onChange={(e) =>
                    setNodes((nds) =>
                      nds.map((node) =>
                        node.id === selectedNode.id && node.type === 'task'
                          ? {
                              ...node,
                              data: {
                                ...node.data,
                                actionType: e.target.value,
                              },
                            }
                          : node
                      )
                    )
                  }
                  style={{
                    fontSize: 12,
                    padding: '6px 8px',
                    borderRadius: 6,
                    border: '1px solid #d1d5db',
                    marginBottom: 6,
                  }}
                >
                  <option value="data">Data read/write</option>
                  <option value="notification">Notifications &amp; Escalations</option>
                  <option value="human">Human Agent</option>
                </select>

                {/* Data read/write configuration */}
                {(!selectedNode.data?.actionType || selectedNode.data?.actionType === 'data') && (
                  <div
                    style={{
                      padding: 8,
                      borderRadius: 6,
                      background: '#eff6ff',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#1d4ed8' }}>Data read/write</div>
                    <label style={{ fontSize: 11, fontWeight: 500 }}>Mode</label>
                    <select
                      value={selectedNode.data?.actionConfig?.dataMode || 'fetch'}
                      onChange={(e) =>
                        setNodes((nds) =>
                          nds.map((node) =>
                            node.id === selectedNode.id && node.type === 'task'
                              ? {
                                  ...node,
                                  data: {
                                    ...node.data,
                                    actionConfig: {
                                      ...(node.data?.actionConfig || {}),
                                      dataMode: e.target.value,
                                    },
                                  },
                                }
                              : node
                          )
                        )
                      }
                      style={{
                        fontSize: 12,
                        padding: '4px 6px',
                        borderRadius: 6,
                        border: '1px solid #d1d5db',
                        marginBottom: 4,
                      }}
                    >
                      <option value="fetch">Fetch from external endpoint</option>
                      <option value="update">Update JSON payload</option>
                    </select>

                    {/* Fetch mode */}
                    {(selectedNode.data?.actionConfig?.dataMode || 'fetch') === 'fetch' && (
                      <>
                        <label style={{ fontSize: 11, fontWeight: 500 }}>Fetch via</label>
                        <select
                          value={selectedNode.data?.actionConfig?.dataFetchSource || 'http'}
                          onChange={(e) =>
                            setNodes((nds) =>
                              nds.map((node) =>
                                node.id === selectedNode.id && node.type === 'task'
                                  ? {
                                      ...node,
                                      data: {
                                        ...node.data,
                                        actionConfig: {
                                          ...(node.data?.actionConfig || {}),
                                          dataFetchSource: e.target.value,
                                        },
                                      },
                                    }
                                  : node
                              )
                            )
                          }
                          style={{
                            fontSize: 12,
                            padding: '4px 6px',
                            borderRadius: 6,
                            border: '1px solid #d1d5db',
                            marginBottom: 4,
                          }}
                        >
                          <option value="http">HTTP endpoint</option>
                          <option value="sqlApi">SQL API (POST JSON)</option>
                        </select>

                        <label style={{ fontSize: 11, fontWeight: 500 }}>Fetch request timeout (seconds)</label>
                        <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 2 }}>
                          Max time the workflow engine should wait on this step: <strong>GET/POST to HTTP endpoint</strong> or{' '}
                          <strong>POST to SQL API</strong>. Empty = engine default. Separate from any <code style={{ fontSize: 9 }}>timeout</code>{' '}
                          field inside optional SQL body JSON (that is defined by your SQL provider).
                        </div>
                        <input
                          type="number"
                          min={1}
                          step={1}
                          placeholder="e.g. 90"
                          value={(() => {
                            const ac = selectedNode.data?.actionConfig;
                            if (typeof ac?.dataFetchTimeoutSeconds === 'number') {
                              return String(ac.dataFetchTimeoutSeconds);
                            }
                            if (typeof ac?.sqlClientTimeoutSeconds === 'number') {
                              return String(ac.sqlClientTimeoutSeconds);
                            }
                            return '';
                          })()}
                          onChange={(e) =>
                            setNodes((nds) =>
                              nds.map((node) =>
                                node.id === selectedNode.id && node.type === 'task'
                                  ? {
                                      ...node,
                                      data: {
                                        ...node.data,
                                        actionConfig: {
                                          ...(node.data?.actionConfig || {}),
                                          dataFetchTimeoutSeconds:
                                            e.target.value === '' ? undefined : Number(e.target.value),
                                        },
                                      },
                                    }
                                  : node
                              )
                            )
                          }
                          style={{
                            fontSize: 12,
                            padding: '4px 6px',
                            borderRadius: 6,
                            border: '1px solid #d1d5db',
                            marginBottom: 4,
                          }}
                        />

                        {(!selectedNode.data?.actionConfig?.dataFetchSource ||
                          selectedNode.data?.actionConfig?.dataFetchSource === 'http') && (
                          <>
                            <label style={{ fontSize: 11, fontWeight: 500 }}>Endpoint URL</label>
                            <input
                              type="text"
                              placeholder="https://api.internal/read"
                              value={selectedNode.data?.actionConfig?.fetchUrl || ''}
                              onChange={(e) =>
                                setNodes((nds) =>
                                  nds.map((node) =>
                                    node.id === selectedNode.id && node.type === 'task'
                                      ? {
                                          ...node,
                                          data: {
                                            ...node.data,
                                            actionConfig: {
                                              ...(node.data?.actionConfig || {}),
                                              fetchUrl: e.target.value,
                                            },
                                          },
                                        }
                                      : node
                                  )
                                )
                              }
                              style={{
                                fontSize: 12,
                                padding: '4px 6px',
                                borderRadius: 6,
                                border: '1px solid #d1d5db',
                                marginBottom: 4,
                              }}
                            />
                            <label style={{ fontSize: 11, fontWeight: 500 }}>HTTP method</label>
                            <select
                              value={selectedNode.data?.actionConfig?.fetchMethod || 'GET'}
                              onChange={(e) =>
                                setNodes((nds) =>
                                  nds.map((node) =>
                                    node.id === selectedNode.id && node.type === 'task'
                                      ? {
                                          ...node,
                                          data: {
                                            ...node.data,
                                            actionConfig: {
                                              ...(node.data?.actionConfig || {}),
                                              fetchMethod: e.target.value,
                                            },
                                          },
                                        }
                                      : node
                                  )
                                )
                              }
                              style={{
                                fontSize: 12,
                                padding: '4px 6px',
                                borderRadius: 6,
                                border: '1px solid #d1d5db',
                              }}
                            >
                              <option value="GET">GET</option>
                              <option value="POST">POST</option>
                            </select>
                          </>
                        )}

                        {selectedNode.data?.actionConfig?.dataFetchSource === 'sqlApi' && (
                          <>
                            <div style={{ fontSize: 10, color: '#1e40af', lineHeight: 1.35 }}>
                              Sends a <strong>POST</strong> with <code style={{ fontSize: 9 }}>Content-Type: application/json</code>.
                              The SQL is sent as <code style={{ fontSize: 9 }}>statement</code> in the body. Optional JSON below is
                              merged into the same object (e.g. warehouse, database, schema, role, bindings, or any fields your API
                              expects).
                            </div>
                            <div style={{ fontSize: 10, color: '#6b7280', lineHeight: 1.4, marginTop: 4 }}>
                              <strong>Timeout:</strong> A <code style={{ fontSize: 9 }}>timeout</code> (or similar) key inside optional
                              JSON is passed to your SQL API only—meaning depends on that service. Use <strong>Fetch request timeout</strong>{' '}
                              above for the engine&apos;s HTTP client max wait.
                            </div>
                            <div style={{ fontSize: 10, color: '#6b7280', lineHeight: 1.45, marginTop: 4 }}>
                              <strong>Expected response (JSON):</strong> Many SQL-over-HTTP APIs return a wrapper object with status
                              fields plus a <code style={{ fontSize: 9 }}>data</code> object that holds result metadata and row
                              values. Your provider may use slightly different names, but a common shape looks like this:
                            </div>
                            <pre
                              style={{
                                margin: '6px 0 0',
                                padding: 8,
                                fontSize: 9,
                                lineHeight: 1.35,
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: 6,
                                overflow: 'auto',
                                fontFamily: 'ui-monospace, monospace',
                                color: '#334155',
                              }}
                            >
{`{
  "code": "000000",
  "message": "Statement executed successfully",
  "statementHandle": "…",
  "data": {
    "columns": [
      { "name": "ID", "type": "TEXT" },
      { "name": "NAME", "type": "TEXT" }
    ],
    "rows": [
      ["1", "John Doe"],
      ["2", "Jane Smith"]
    ]
  },
  "responseTime": 15
}`}
                            </pre>
                            <div style={{ fontSize: 10, color: '#6b7280', lineHeight: 1.45, marginTop: 6 }}>
                              <strong>Providers differ:</strong> each warehouse / SQL API may use different property names and nesting.
                              Use <strong>Response shape</strong> below to point the engine at your <code style={{ fontSize: 9 }}>columns</code> /{' '}
                              <code style={{ fontSize: 9 }}>rows</code> (and optional status fields). Use <strong>Execution</strong> to say
                              whether the POST returns the final result or a job handle for polling or a callback.
                            </div>
                            <label style={{ fontSize: 11, fontWeight: 500, marginTop: 6 }}>POST URL</label>
                            <input
                              type="text"
                              placeholder="https://api.internal/v1/sql/statements"
                              value={
                                selectedNode.data?.actionConfig?.sqlApiPostUrl ||
                                selectedNode.data?.actionConfig?.sqlApiBaseUrl ||
                                ''
                              }
                              onChange={(e) =>
                                setNodes((nds) =>
                                  nds.map((node) =>
                                    node.id === selectedNode.id && node.type === 'task'
                                      ? {
                                          ...node,
                                          data: {
                                            ...node.data,
                                            actionConfig: {
                                              ...(node.data?.actionConfig || {}),
                                              sqlApiPostUrl: e.target.value,
                                            },
                                          },
                                        }
                                      : node
                                  )
                                )
                              }
                              style={{
                                fontSize: 12,
                                padding: '4px 6px',
                                borderRadius: 6,
                                border: '1px solid #d1d5db',
                                marginBottom: 4,
                              }}
                            />
                            <label style={{ fontSize: 11, fontWeight: 500 }}>Statement (SQL)</label>
                            <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 2 }}>
                              Becomes the <code style={{ fontSize: 9 }}>statement</code> field in the JSON body (overrides the same
                              key if present in optional JSON).
                            </div>
                            <textarea
                              rows={5}
                              placeholder={'SELECT * FROM sales_data WHERE region = ?'}
                              value={selectedNode.data?.actionConfig?.sqlQuery || ''}
                              onChange={(e) =>
                                setNodes((nds) =>
                                  nds.map((node) =>
                                    node.id === selectedNode.id && node.type === 'task'
                                      ? {
                                          ...node,
                                          data: {
                                            ...node.data,
                                            actionConfig: {
                                              ...(node.data?.actionConfig || {}),
                                              sqlQuery: e.target.value,
                                            },
                                          },
                                        }
                                      : node
                                  )
                                )
                              }
                              style={{
                                fontSize: 11,
                                fontFamily: 'ui-monospace, monospace',
                                padding: '6px 8px',
                                borderRadius: 6,
                                border: '1px solid #d1d5db',
                                resize: 'vertical',
                              }}
                            />
                            <label style={{ fontSize: 11, fontWeight: 500 }}>Optional body context (JSON)</label>
                            <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 2 }}>
                              Omit <code style={{ fontSize: 9 }}>statement</code> here; it is taken from the field above. Invalid JSON
                              is stored as-is for the engine to validate.
                            </div>
                            <textarea
                              rows={8}
                              placeholder={`{\n  "warehouse": "ANALYTICS_WH",\n  "database": "APP_DB",\n  "schema": "PUBLIC",\n  "timeout": 60,\n  "bindings": {\n    "1": { "type": "TEXT", "value": "example" }\n  }\n}`}
                              value={selectedNode.data?.actionConfig?.sqlApiBodyContextJson || ''}
                              onChange={(e) =>
                                setNodes((nds) =>
                                  nds.map((node) =>
                                    node.id === selectedNode.id && node.type === 'task'
                                      ? {
                                          ...node,
                                          data: {
                                            ...node.data,
                                            actionConfig: {
                                              ...(node.data?.actionConfig || {}),
                                              sqlApiBodyContextJson: e.target.value,
                                            },
                                          },
                                        }
                                      : node
                                  )
                                )
                              }
                              style={{
                                fontSize: 10,
                                fontFamily: 'ui-monospace, monospace',
                                padding: '6px 8px',
                                borderRadius: 6,
                                border: '1px solid #d1d5db',
                                resize: 'vertical',
                              }}
                            />

                            <div
                              style={{
                                marginTop: 10,
                                paddingTop: 10,
                                borderTop: '1px solid #bfdbfe',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 6,
                              }}
                            >
                              <div style={{ fontSize: 11, fontWeight: 600, color: '#1e3a8a' }}>Execution</div>
                              <div style={{ fontSize: 10, color: '#6b7280', lineHeight: 1.4 }}>
                                Whether the SQL API returns the full result in the first POST response, or accepts the statement and
                                finishes later (poll or inbound webhook).
                              </div>
                              <label style={{ fontSize: 11, fontWeight: 500 }}>API handling</label>
                              <select
                                value={selectedNode.data?.actionConfig?.sqlExecutionMode || 'sync'}
                                onChange={(e) =>
                                  setNodes((nds) =>
                                    nds.map((node) =>
                                      node.id === selectedNode.id && node.type === 'task'
                                        ? {
                                            ...node,
                                            data: {
                                              ...node.data,
                                              actionConfig: {
                                                ...(node.data?.actionConfig || {}),
                                                sqlExecutionMode: e.target.value,
                                              },
                                            },
                                          }
                                        : node
                                    )
                                  )
                                }
                                style={{
                                  fontSize: 12,
                                  padding: '4px 6px',
                                  borderRadius: 6,
                                  border: '1px solid #d1d5db',
                                }}
                              >
                                <option value="sync">Synchronous — result (or error) in POST response body</option>
                                <option value="async">Asynchronous — POST returns a handle; complete via poll or callback</option>
                              </select>

                              {(selectedNode.data?.actionConfig?.sqlExecutionMode || 'sync') === 'async' && (
                                <>
                                  <label style={{ fontSize: 11, fontWeight: 500 }}>Async completion</label>
                                  <select
                                    value={selectedNode.data?.actionConfig?.sqlAsyncCompletion || 'poll'}
                                    onChange={(e) =>
                                      setNodes((nds) =>
                                        nds.map((node) =>
                                          node.id === selectedNode.id && node.type === 'task'
                                            ? {
                                                ...node,
                                                data: {
                                                  ...node.data,
                                                  actionConfig: {
                                                    ...(node.data?.actionConfig || {}),
                                                    sqlAsyncCompletion: e.target.value,
                                                  },
                                                },
                                              }
                                            : node
                                        )
                                      )
                                    }
                                    style={{
                                      fontSize: 12,
                                      padding: '4px 6px',
                                      borderRadius: 6,
                                      border: '1px solid #d1d5db',
                                    }}
                                  >
                                    <option value="poll">Poll — engine calls a status URL until the result is ready</option>
                                    <option value="callback">
                                      Callback — provider invokes your webhook; engine resumes when notified
                                    </option>
                                  </select>

                                  {(selectedNode.data?.actionConfig?.sqlAsyncCompletion || 'poll') === 'poll' && (
                                    <>
                                      <div style={{ fontSize: 10, color: '#6b7280', lineHeight: 1.4 }}>
                                        Use <code style={{ fontSize: 9 }}>{'{{handle}}'}</code> in the URL where the submit response
                                        places the job / statement id (see <strong>Job handle path</strong> below).
                                      </div>
                                      <label style={{ fontSize: 11, fontWeight: 500 }}>Poll URL template</label>
                                      <input
                                        type="text"
                                        placeholder="https://api.internal/v1/jobs/{{handle}}/result"
                                        value={selectedNode.data?.actionConfig?.sqlPollUrlTemplate || ''}
                                        onChange={(e) =>
                                          setNodes((nds) =>
                                            nds.map((node) =>
                                              node.id === selectedNode.id && node.type === 'task'
                                                ? {
                                                    ...node,
                                                    data: {
                                                      ...node.data,
                                                      actionConfig: {
                                                        ...(node.data?.actionConfig || {}),
                                                        sqlPollUrlTemplate: e.target.value,
                                                      },
                                                    },
                                                  }
                                                : node
                                            )
                                          )
                                        }
                                        style={{
                                          fontSize: 12,
                                          padding: '4px 6px',
                                          borderRadius: 6,
                                          border: '1px solid #d1d5db',
                                        }}
                                      />
                                      <label style={{ fontSize: 11, fontWeight: 500 }}>Poll HTTP method</label>
                                      <select
                                        value={selectedNode.data?.actionConfig?.sqlPollMethod || 'GET'}
                                        onChange={(e) =>
                                          setNodes((nds) =>
                                            nds.map((node) =>
                                              node.id === selectedNode.id && node.type === 'task'
                                                ? {
                                                    ...node,
                                                    data: {
                                                      ...node.data,
                                                      actionConfig: {
                                                        ...(node.data?.actionConfig || {}),
                                                        sqlPollMethod: e.target.value,
                                                      },
                                                    },
                                                  }
                                                : node
                                            )
                                          )
                                        }
                                        style={{
                                          fontSize: 12,
                                          padding: '4px 6px',
                                          borderRadius: 6,
                                          border: '1px solid #d1d5db',
                                        }}
                                      >
                                        <option value="GET">GET</option>
                                        <option value="POST">POST</option>
                                      </select>
                                      <label style={{ fontSize: 11, fontWeight: 500 }}>Poll interval (seconds)</label>
                                      <input
                                        type="number"
                                        min={1}
                                        step={1}
                                        placeholder="e.g. 2"
                                        value={
                                          typeof selectedNode.data?.actionConfig?.sqlPollIntervalSeconds === 'number'
                                            ? String(selectedNode.data.actionConfig.sqlPollIntervalSeconds)
                                            : ''
                                        }
                                        onChange={(e) =>
                                          setNodes((nds) =>
                                            nds.map((node) =>
                                              node.id === selectedNode.id && node.type === 'task'
                                                ? {
                                                    ...node,
                                                    data: {
                                                      ...node.data,
                                                      actionConfig: {
                                                        ...(node.data?.actionConfig || {}),
                                                        sqlPollIntervalSeconds:
                                                          e.target.value === '' ? undefined : Number(e.target.value),
                                                      },
                                                    },
                                                  }
                                                : node
                                            )
                                          )
                                        }
                                        style={{
                                          fontSize: 12,
                                          padding: '4px 6px',
                                          borderRadius: 6,
                                          border: '1px solid #d1d5db',
                                        }}
                                      />
                                      <div
                                        style={{
                                          marginTop: 8,
                                          paddingTop: 8,
                                          borderTop: '1px dashed #cbd5e1',
                                          display: 'flex',
                                          flexDirection: 'column',
                                          gap: 6,
                                        }}
                                      >
                                        <div style={{ fontSize: 11, fontWeight: 600, color: '#334155' }}>When to stop polling</div>
                                        <div style={{ fontSize: 10, color: '#6b7280', lineHeight: 1.45 }}>
                                          After each poll, the engine reads a <strong>dot path</strong> on the JSON body. If you list
                                          <strong>done values</strong>, polling stops when the value at that path equals <em>any</em>{' '}
                                          of them. If you leave values empty, polling stops when that path <strong>exists</strong>{' '}
                                          and is not null. If the condition is not met, it keeps polling until{' '}
                                          <strong>max wait</strong> below (then times out). If <strong>done path</strong> is empty, the
                                          executor may fall back to its own rule (e.g. result rows present).
                                        </div>
                                        <label style={{ fontSize: 11, fontWeight: 500 }}>Done path (poll response)</label>
                                        <input
                                          type="text"
                                          placeholder="e.g. status or data.state"
                                          value={selectedNode.data?.actionConfig?.sqlPollDonePath || ''}
                                          onChange={(e) =>
                                            setNodes((nds) =>
                                              nds.map((node) =>
                                                node.id === selectedNode.id && node.type === 'task'
                                                  ? {
                                                      ...node,
                                                      data: {
                                                        ...node.data,
                                                        actionConfig: {
                                                          ...(node.data?.actionConfig || {}),
                                                          sqlPollDonePath: e.target.value,
                                                        },
                                                      },
                                                    }
                                                  : node
                                              )
                                            )
                                          }
                                          style={{
                                            fontSize: 12,
                                            padding: '4px 6px',
                                            borderRadius: 6,
                                            border: '1px solid #d1d5db',
                                          }}
                                        />
                                        <label style={{ fontSize: 11, fontWeight: 500 }}>Done values (optional)</label>
                                        <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 2 }}>
                                          One per line or comma-separated. Compared as strings to the value at the done path. Empty
                                          = stop when path exists only.
                                        </div>
                                        <textarea
                                          rows={3}
                                          placeholder={'SUCCEEDED\nCOMPLETE\n000000'}
                                          value={selectedNode.data?.actionConfig?.sqlPollDoneValues || ''}
                                          onChange={(e) =>
                                            setNodes((nds) =>
                                              nds.map((node) =>
                                                node.id === selectedNode.id && node.type === 'task'
                                                  ? {
                                                      ...node,
                                                      data: {
                                                        ...node.data,
                                                        actionConfig: {
                                                          ...(node.data?.actionConfig || {}),
                                                          sqlPollDoneValues: e.target.value,
                                                        },
                                                      },
                                                    }
                                                  : node
                                              )
                                            )
                                          }
                                          style={{
                                            fontSize: 11,
                                            fontFamily: 'ui-monospace, monospace',
                                            padding: '6px 8px',
                                            borderRadius: 6,
                                            border: '1px solid #d1d5db',
                                            resize: 'vertical',
                                          }}
                                        />
                                      </div>
                                      <label style={{ fontSize: 11, fontWeight: 500 }}>Poll max wait (seconds)</label>
                                      <input
                                        type="number"
                                        min={1}
                                        step={1}
                                        placeholder="e.g. 300"
                                        value={
                                          typeof selectedNode.data?.actionConfig?.sqlPollMaxWaitSeconds === 'number'
                                            ? String(selectedNode.data.actionConfig.sqlPollMaxWaitSeconds)
                                            : ''
                                        }
                                        onChange={(e) =>
                                          setNodes((nds) =>
                                            nds.map((node) =>
                                              node.id === selectedNode.id && node.type === 'task'
                                                ? {
                                                    ...node,
                                                    data: {
                                                      ...node.data,
                                                      actionConfig: {
                                                        ...(node.data?.actionConfig || {}),
                                                        sqlPollMaxWaitSeconds:
                                                          e.target.value === '' ? undefined : Number(e.target.value),
                                                      },
                                                    },
                                                  }
                                                : node
                                            )
                                          )
                                        }
                                        style={{
                                          fontSize: 12,
                                          padding: '4px 6px',
                                          borderRadius: 6,
                                          border: '1px solid #d1d5db',
                                        }}
                                      />
                                    </>
                                  )}

                                  {(selectedNode.data?.actionConfig?.sqlAsyncCompletion || 'poll') === 'callback' && (
                                    <>
                                      <div style={{ fontSize: 10, color: '#6b7280', lineHeight: 1.4 }}>
                                        Register a <strong>public HTTPS URL</strong> with your provider so they POST back when the
                                        statement completes. The ops runtime must match inbound events to this workflow run (e.g.
                                        correlation id).
                                      </div>
                                      <label style={{ fontSize: 11, fontWeight: 500 }}>Callback / webhook URL (yours)</label>
                                      <input
                                        type="text"
                                        placeholder="https://ops.example.com/hooks/sql-result"
                                        value={selectedNode.data?.actionConfig?.sqlCallbackWebhookUrl || ''}
                                        onChange={(e) =>
                                          setNodes((nds) =>
                                            nds.map((node) =>
                                              node.id === selectedNode.id && node.type === 'task'
                                                ? {
                                                    ...node,
                                                    data: {
                                                      ...node.data,
                                                      actionConfig: {
                                                        ...(node.data?.actionConfig || {}),
                                                        sqlCallbackWebhookUrl: e.target.value,
                                                      },
                                                    },
                                                  }
                                                : node
                                            )
                                          )
                                        }
                                        style={{
                                          fontSize: 12,
                                          padding: '4px 6px',
                                          borderRadius: 6,
                                          border: '1px solid #d1d5db',
                                        }}
                                      />
                                      <label style={{ fontSize: 11, fontWeight: 500 }}>Correlation notes (JSON paths, headers)</label>
                                      <textarea
                                        rows={3}
                                        placeholder={
                                          'e.g. Send payload.correlationId in submit body; provider echoes it in callback JSON at body.runId'
                                        }
                                        value={selectedNode.data?.actionConfig?.sqlCallbackNotes || ''}
                                        onChange={(e) =>
                                          setNodes((nds) =>
                                            nds.map((node) =>
                                              node.id === selectedNode.id && node.type === 'task'
                                                ? {
                                                    ...node,
                                                    data: {
                                                      ...node.data,
                                                      actionConfig: {
                                                        ...(node.data?.actionConfig || {}),
                                                        sqlCallbackNotes: e.target.value,
                                                      },
                                                    },
                                                  }
                                                : node
                                            )
                                          )
                                        }
                                        style={{
                                          fontSize: 11,
                                          padding: '6px 8px',
                                          borderRadius: 6,
                                          border: '1px solid #d1d5db',
                                          resize: 'vertical',
                                        }}
                                      />
                                    </>
                                  )}
                                </>
                              )}
                            </div>

                            <div
                              style={{
                                marginTop: 10,
                                paddingTop: 10,
                                borderTop: '1px solid #bfdbfe',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 6,
                              }}
                            >
                              <div style={{ fontSize: 11, fontWeight: 600, color: '#1e3a8a' }}>Response shape (dot paths)</div>
                              <div style={{ fontSize: 10, color: '#6b7280', lineHeight: 1.4 }}>
                                Paths are from the <strong>root of each JSON response</strong> (submit, and each poll if async).
                                Use <strong>Custom</strong> when your warehouse nests columns/rows differently.
                              </div>
                              <label style={{ fontSize: 11, fontWeight: 500 }}>Layout</label>
                              <select
                                value={selectedNode.data?.actionConfig?.sqlResponseLayout || 'convention'}
                                onChange={(e) =>
                                  setNodes((nds) =>
                                    nds.map((node) =>
                                      node.id === selectedNode.id && node.type === 'task'
                                        ? {
                                            ...node,
                                            data: {
                                              ...node.data,
                                              actionConfig: {
                                                ...(node.data?.actionConfig || {}),
                                                sqlResponseLayout: e.target.value,
                                              },
                                            },
                                          }
                                        : node
                                    )
                                  )
                                }
                                style={{
                                  fontSize: 12,
                                  padding: '4px 6px',
                                  borderRadius: 6,
                                  border: '1px solid #d1d5db',
                                }}
                              >
                                <option value="convention">Common convention (default paths)</option>
                                <option value="custom">Custom dot paths</option>
                              </select>
                              {(selectedNode.data?.actionConfig?.sqlResponseLayout || 'convention') === 'convention' && (
                                <div style={{ fontSize: 10, color: '#6b7280', lineHeight: 1.45, marginTop: 2 }}>
                                  Uses <code style={{ fontSize: 9 }}>data.columns</code>, <code style={{ fontSize: 9 }}>data.rows</code>,{' '}
                                  <code style={{ fontSize: 9 }}>code</code>, <code style={{ fontSize: 9 }}>message</code>, and (for
                                  async) handle at <code style={{ fontSize: 9 }}>statementHandle</code> unless you override the job
                                  handle path below.
                                </div>
                              )}
                              {(selectedNode.data?.actionConfig?.sqlResponseLayout || 'convention') === 'custom' && (
                                <>
                                  <div style={{ fontSize: 10, color: '#6b7280', lineHeight: 1.45, marginTop: 2 }}>
                                    Set columns/rows/status paths yourself — needed when your warehouse nests JSON differently.
                                  </div>
                                  <label style={{ fontSize: 11, fontWeight: 500 }}>Columns array path</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. data.columns or result.meta.schema"
                                    value={selectedNode.data?.actionConfig?.sqlPathColumns || ''}
                                    onChange={(e) =>
                                      setNodes((nds) =>
                                        nds.map((node) =>
                                          node.id === selectedNode.id && node.type === 'task'
                                            ? {
                                                ...node,
                                                data: {
                                                  ...node.data,
                                                  actionConfig: {
                                                    ...(node.data?.actionConfig || {}),
                                                    sqlPathColumns: e.target.value,
                                                  },
                                                },
                                              }
                                            : node
                                        )
                                      )
                                    }
                                    style={{
                                      fontSize: 12,
                                      padding: '4px 6px',
                                      borderRadius: 6,
                                      border: '1px solid #d1d5db',
                                    }}
                                  />
                                  <label style={{ fontSize: 11, fontWeight: 500 }}>Rows array path</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. data.rows or result.data"
                                    value={selectedNode.data?.actionConfig?.sqlPathRows || ''}
                                    onChange={(e) =>
                                      setNodes((nds) =>
                                        nds.map((node) =>
                                          node.id === selectedNode.id && node.type === 'task'
                                            ? {
                                                ...node,
                                                data: {
                                                  ...node.data,
                                                  actionConfig: {
                                                    ...(node.data?.actionConfig || {}),
                                                    sqlPathRows: e.target.value,
                                                  },
                                                },
                                              }
                                            : node
                                        )
                                      )
                                    }
                                    style={{
                                      fontSize: 12,
                                      padding: '4px 6px',
                                      borderRadius: 6,
                                      border: '1px solid #d1d5db',
                                    }}
                                  />
                                  <label style={{ fontSize: 11, fontWeight: 500 }}>Status / success code path (optional)</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. code or status"
                                    value={selectedNode.data?.actionConfig?.sqlPathStatusCode || ''}
                                    onChange={(e) =>
                                      setNodes((nds) =>
                                        nds.map((node) =>
                                          node.id === selectedNode.id && node.type === 'task'
                                            ? {
                                                ...node,
                                                data: {
                                                  ...node.data,
                                                  actionConfig: {
                                                    ...(node.data?.actionConfig || {}),
                                                    sqlPathStatusCode: e.target.value,
                                                  },
                                                },
                                              }
                                            : node
                                        )
                                      )
                                    }
                                    style={{
                                      fontSize: 12,
                                      padding: '4px 6px',
                                      borderRadius: 6,
                                      border: '1px solid #d1d5db',
                                    }}
                                  />
                                  <label style={{ fontSize: 11, fontWeight: 500 }}>Success code value (optional)</label>
                                  <input
                                    type="text"
                                    placeholder='e.g. 000000 or "OK"'
                                    value={
                                      selectedNode.data?.actionConfig?.sqlPathStatusOkValue != null
                                        ? String(selectedNode.data.actionConfig.sqlPathStatusOkValue)
                                        : ''
                                    }
                                    onChange={(e) =>
                                      setNodes((nds) =>
                                        nds.map((node) =>
                                          node.id === selectedNode.id && node.type === 'task'
                                            ? {
                                                ...node,
                                                data: {
                                                  ...node.data,
                                                  actionConfig: {
                                                    ...(node.data?.actionConfig || {}),
                                                    sqlPathStatusOkValue: e.target.value,
                                                  },
                                                },
                                              }
                                            : node
                                        )
                                      )
                                    }
                                    style={{
                                      fontSize: 12,
                                      padding: '4px 6px',
                                      borderRadius: 6,
                                      border: '1px solid #d1d5db',
                                    }}
                                  />
                                  <label style={{ fontSize: 11, fontWeight: 500 }}>Human message path (optional)</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. message or error.detail"
                                    value={selectedNode.data?.actionConfig?.sqlPathMessage || ''}
                                    onChange={(e) =>
                                      setNodes((nds) =>
                                        nds.map((node) =>
                                          node.id === selectedNode.id && node.type === 'task'
                                            ? {
                                                ...node,
                                                data: {
                                                  ...node.data,
                                                  actionConfig: {
                                                    ...(node.data?.actionConfig || {}),
                                                    sqlPathMessage: e.target.value,
                                                  },
                                                },
                                              }
                                            : node
                                        )
                                      )
                                    }
                                    style={{
                                      fontSize: 12,
                                      padding: '4px 6px',
                                      borderRadius: 6,
                                      border: '1px solid #d1d5db',
                                    }}
                                  />
                                </>
                              )}

                              {(selectedNode.data?.actionConfig?.sqlExecutionMode || 'sync') === 'async' && (
                                <>
                                  <label style={{ fontSize: 11, fontWeight: 500 }}>Job handle path (submit response)</label>
                                  <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 2 }}>
                                    Dot path to the id returned by POST (used for poll URL{' '}
                                    <code style={{ fontSize: 9 }}>{'{{handle}}'}</code> or to correlate callbacks). Convention
                                    default is <code style={{ fontSize: 9 }}>statementHandle</code> if left empty.
                                  </div>
                                  <input
                                    type="text"
                                    placeholder="statementHandle or data.jobId"
                                    value={selectedNode.data?.actionConfig?.sqlJobHandlePath || ''}
                                    onChange={(e) =>
                                      setNodes((nds) =>
                                        nds.map((node) =>
                                          node.id === selectedNode.id && node.type === 'task'
                                            ? {
                                                ...node,
                                                data: {
                                                  ...node.data,
                                                  actionConfig: {
                                                    ...(node.data?.actionConfig || {}),
                                                    sqlJobHandlePath: e.target.value,
                                                  },
                                                },
                                              }
                                            : node
                                        )
                                      )
                                    }
                                    style={{
                                      fontSize: 12,
                                      padding: '4px 6px',
                                      borderRadius: 6,
                                      border: '1px solid #d1d5db',
                                    }}
                                  />
                                </>
                              )}
                            </div>

                            <label style={{ fontSize: 11, fontWeight: 500 }}>Merge response JSON into payload path</label>
                            <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 2 }}>
                              Dot path where the <strong>final parsed result</strong> (tabular + metadata the engine normalizes) is
                              attached on the workflow/case payload (e.g. <code style={{ fontSize: 9 }}>data.sql.customerRows</code>
                              ). Empty = engine default. Async callback mode still merges here once the webhook is matched.
                            </div>
                            <input
                              type="text"
                              placeholder="e.g. data.customerQuery"
                              value={selectedNode.data?.actionConfig?.sqlResponsePayloadPath || ''}
                              onChange={(e) =>
                                setNodes((nds) =>
                                  nds.map((node) =>
                                    node.id === selectedNode.id && node.type === 'task'
                                      ? {
                                          ...node,
                                          data: {
                                            ...node.data,
                                            actionConfig: {
                                              ...(node.data?.actionConfig || {}),
                                              sqlResponsePayloadPath: e.target.value,
                                            },
                                          },
                                        }
                                      : node
                                  )
                                )
                              }
                              style={{
                                fontSize: 12,
                                padding: '4px 6px',
                                borderRadius: 6,
                                border: '1px solid #d1d5db',
                              }}
                            />
                          </>
                        )}
                      </>
                    )}

                    {/* Update mode */}
                    {(selectedNode.data?.actionConfig?.dataMode || 'fetch') === 'update' && (
                      <>
                        <label style={{ fontSize: 11, fontWeight: 500 }}>Updates (JSON path → value)</label>
                        {(selectedNode.data?.actionConfig?.updates || [{ path: '', value: '', via: 'local' }]).map(
                          (u, idx) => (
                            <div
                              key={idx}
                              style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 6 }}
                            >
                              <div style={{ display: 'flex', gap: 4 }}>
                                <input
                                  type="text"
                                  placeholder="payload.customer.riskScore"
                                  value={u.path || ''}
                                  onChange={(e) =>
                                    setNodes((nds) =>
                                      nds.map((node) => {
                                        if (node.id !== selectedNode.id || node.type !== 'task') return node;
                                        const cfg = { ...(node.data?.actionConfig || {}) };
                                        const updates = Array.isArray(cfg.updates)
                                          ? [...cfg.updates]
                                          : [{ path: '', value: '', via: 'local' }];
                                        updates[idx] = { ...(updates[idx] || {}), path: e.target.value };
                                        cfg.updates = updates;
                                        return { ...node, data: { ...node.data, actionConfig: cfg } };
                                      })
                                    )
                                  }
                                  style={{
                                    flex: 1,
                                    fontSize: 12,
                                    padding: '4px 6px',
                                    borderRadius: 6,
                                    border: '1px solid #d1d5db',
                                  }}
                                />
                                <input
                                  type="text"
                                  placeholder="new value or expression"
                                  value={u.value || ''}
                                  onChange={(e) =>
                                    setNodes((nds) =>
                                      nds.map((node) => {
                                        if (node.id !== selectedNode.id || node.type !== 'task') return node;
                                        const cfg = { ...(node.data?.actionConfig || {}) };
                                        const updates = Array.isArray(cfg.updates)
                                          ? [...cfg.updates]
                                          : [{ path: '', value: '', via: 'local' }];
                                        updates[idx] = { ...(updates[idx] || {}), value: e.target.value };
                                        cfg.updates = updates;
                                        return { ...node, data: { ...node.data, actionConfig: cfg } };
                                      })
                                    )
                                  }
                                  style={{
                                    flex: 1,
                                    fontSize: 12,
                                    padding: '4px 6px',
                                    borderRadius: 6,
                                    border: '1px solid #d1d5db',
                                  }}
                                />
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                  <span style={{ fontSize: 11 }}>Apply via:</span>
                                  <select
                                    value={u.via || 'local'}
                                    onChange={(e) =>
                                      setNodes((nds) =>
                                        nds.map((node) => {
                                          if (node.id !== selectedNode.id || node.type !== 'task') return node;
                                          const cfg = { ...(node.data?.actionConfig || {}) };
                                          const updates = Array.isArray(cfg.updates)
                                            ? [...cfg.updates]
                                            : [{ path: '', value: '', via: 'local' }];
                                          updates[idx] = { ...(updates[idx] || {}), via: e.target.value };
                                          cfg.updates = updates;
                                          return { ...node, data: { ...node.data, actionConfig: cfg } };
                                        })
                                      )
                                    }
                                    style={{
                                      fontSize: 11,
                                      padding: '2px 6px',
                                      borderRadius: 999,
                                      border: '1px solid #d1d5db',
                                    }}
                                  >
                                    <option value="local">Local (in-memory)</option>
                                    <option value="api">API (POST)</option>
                                  </select>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setNodes((nds) =>
                                      nds.map((node) => {
                                        if (node.id !== selectedNode.id || node.type !== 'task') return node;
                                        const cfg = { ...(node.data?.actionConfig || {}) };
                                        const updates = Array.isArray(cfg.updates)
                                          ? [...cfg.updates]
                                          : [];
                                        updates.splice(idx, 1);
                                        cfg.updates = updates;
                                        return { ...node, data: { ...node.data, actionConfig: cfg } };
                                      })
                                    )
                                  }
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
                          )
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setNodes((nds) =>
                              nds.map((node) => {
                                if (node.id !== selectedNode.id || node.type !== 'task') return node;
                                const cfg = { ...(node.data?.actionConfig || {}) };
                                const updates = Array.isArray(cfg.updates)
                                  ? [...cfg.updates]
                                  : [];
                                updates.push({ path: '', value: '', via: 'local' });
                                cfg.updates = updates;
                                return { ...node, data: { ...node.data, actionConfig: cfg } };
                              })
                            )
                          }
                          style={{
                            alignSelf: 'flex-start',
                            padding: '4px 8px',
                            fontSize: 11,
                            borderRadius: 999,
                            border: '1px dashed #9ca3af',
                            background: '#ffffff',
                            cursor: 'pointer',
                          }}
                        >
                          + Add key-value update
                        </button>

                        <label style={{ fontSize: 11, fontWeight: 500, marginTop: 4 }}>API endpoint (for POST updates)</label>
                        <input
                          type="text"
                          placeholder="https://api.internal/update"
                          value={selectedNode.data?.actionConfig?.updateApiUrl || ''}
                          onChange={(e) =>
                            setNodes((nds) =>
                              nds.map((node) =>
                                node.id === selectedNode.id && node.type === 'task'
                                  ? {
                                      ...node,
                                      data: {
                                        ...node.data,
                                        actionConfig: {
                                          ...(node.data?.actionConfig || {}),
                                          updateApiUrl: e.target.value,
                                        },
                                      },
                                    }
                                  : node
                              )
                            )
                          }
                          style={{
                            fontSize: 12,
                            padding: '4px 6px',
                            borderRadius: 6,
                            border: '1px solid #d1d5db',
                          }}
                        />
                      </>
                    )}
                  </div>
                )}

                {/* Notifications & Escalations */}
                {selectedNode.data?.actionType === 'notification' && (
                  <div
                    style={{
                      padding: 8,
                      borderRadius: 6,
                      background: '#fef3c7',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#92400e' }}>
                      Notifications &amp; Escalations
                    </div>

                    <label style={{ fontSize: 11, fontWeight: 500 }}>Notification template</label>
                    <select
                      value={selectedNode.data?.actionConfig?.commTemplateId || ''}
                      onChange={(e) =>
                        setNodes((nds) =>
                          nds.map((node) =>
                            node.id === selectedNode.id && node.type === 'task'
                              ? {
                                  ...node,
                                  data: {
                                    ...node.data,
                                    actionConfig: {
                                      ...(node.data?.actionConfig || {}),
                                      commTemplateId: e.target.value || undefined,
                                    },
                                  },
                                }
                              : node
                          )
                        )
                      }
                      style={{
                        fontSize: 12,
                        padding: '4px 6px',
                        borderRadius: 6,
                        border: '1px solid #d1d5db',
                        marginBottom: 4,
                      }}
                    >
                      <option value="">Select communication template</option>
                      {communicationTemplates.map((tpl) => (
                        <option key={tpl.id} value={tpl.id}>
                          {tpl.name || tpl.id} ({tpl.channel || 'email'})
                        </option>
                      ))}
                    </select>

                    {selectedCommTemplate && (
                      <div
                        style={{
                          padding: 8,
                          borderRadius: 6,
                          background: '#fffbeb',
                          border: '1px dashed #fed7aa',
                          fontSize: 11,
                          color: '#92400e',
                        }}
                      >
                        <div style={{ fontWeight: 600, marginBottom: 2 }}>Template preview</div>
                        <div style={{ marginBottom: 2 }}>
                          Channel: <strong>{selectedCommTemplate.channel || 'email'}</strong>
                        </div>
                        {selectedCommTemplate.channel === 'email' && selectedCommTemplate.email && (
                          <>
                            <div>
                              <strong>Subject:</strong> {selectedCommTemplate.email.subject || '—'}
                            </div>
                            <div style={{ whiteSpace: 'pre-wrap' }}>
                              <strong>Body:</strong> {selectedCommTemplate.email.body || '—'}
                            </div>
                          </>
                        )}
                        {selectedCommTemplate.channel === 'slack' && selectedCommTemplate.slack && (
                          <div style={{ whiteSpace: 'pre-wrap' }}>
                            <strong>Message:</strong> {selectedCommTemplate.slack.message || '—'}
                          </div>
                        )}
                      </div>
                    )}

                    {selectedCommTemplate && (
                      <>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#92400e', marginTop: 8 }}>
                          Send to
                        </div>
                        {selectedCommTemplate.channel === 'email' && (
                          <>
                            <div style={{ fontSize: 10, color: '#92400e', marginBottom: 4 }}>
                              Use a literal address or a placeholder from the workflow JSON (e.g. {`{{payload.recipientEmail}}`}).
                            </div>
                            <label style={{ fontSize: 11, fontWeight: 500 }}>To</label>
                            <input
                              type="text"
                              placeholder="email@example.com or {{payload.recipientEmail}}"
                              value={selectedNode.data?.actionConfig?.emailTo || ''}
                              onChange={(e) =>
                                setNodes((nds) =>
                                  nds.map((node) =>
                                    node.id === selectedNode.id && node.type === 'task'
                                      ? {
                                          ...node,
                                          data: {
                                            ...node.data,
                                            actionConfig: {
                                              ...(node.data?.actionConfig || {}),
                                              emailTo: e.target.value,
                                            },
                                          },
                                        }
                                      : node
                                  )
                                )
                              }
                              style={{
                                fontSize: 12,
                                padding: '4px 6px',
                                borderRadius: 6,
                                border: '1px solid #d1d5db',
                                marginBottom: 4,
                                width: '100%',
                              }}
                            />
                            <label style={{ fontSize: 11, fontWeight: 500 }}>CC (optional)</label>
                            <input
                              type="text"
                              placeholder="cc@example.com or {{payload.ccEmail}}"
                              value={selectedNode.data?.actionConfig?.emailCc || ''}
                              onChange={(e) =>
                                setNodes((nds) =>
                                  nds.map((node) =>
                                    node.id === selectedNode.id && node.type === 'task'
                                      ? {
                                          ...node,
                                          data: {
                                            ...node.data,
                                            actionConfig: {
                                              ...(node.data?.actionConfig || {}),
                                              emailCc: e.target.value,
                                            },
                                          },
                                        }
                                      : node
                                  )
                                )
                              }
                              style={{
                                fontSize: 12,
                                padding: '4px 6px',
                                borderRadius: 6,
                                border: '1px solid #d1d5db',
                                width: '100%',
                              }}
                            />
                          </>
                        )}
                        {selectedCommTemplate.channel === 'slack' && (
                          <>
                            <div style={{ fontSize: 10, color: '#92400e', marginBottom: 4 }}>
                              Literal channel/webhook or placeholder (e.g. {`{{payload.slackChannel}}`}).
                            </div>
                            <label style={{ fontSize: 11, fontWeight: 500 }}>Slack channel or webhook URL</label>
                            <input
                              type="text"
                              placeholder="#ops-alerts or {{payload.slackChannel}}"
                              value={selectedNode.data?.actionConfig?.slackChannel || ''}
                              onChange={(e) =>
                                setNodes((nds) =>
                                  nds.map((node) =>
                                    node.id === selectedNode.id && node.type === 'task'
                                      ? {
                                          ...node,
                                          data: {
                                            ...node.data,
                                            actionConfig: {
                                              ...(node.data?.actionConfig || {}),
                                              slackChannel: e.target.value,
                                            },
                                          },
                                        }
                                      : node
                                  )
                                )
                              }
                              style={{
                                fontSize: 12,
                                padding: '4px 6px',
                                borderRadius: 6,
                                border: '1px solid #d1d5db',
                                width: '100%',
                              }}
                            />
                          </>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Human Agent task */}
                {selectedNode.data?.actionType === 'human' && (
                  <div
                    style={{
                      padding: 8,
                      borderRadius: 6,
                      background: '#ecfdf5',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#166534' }}>Human Agent</div>
                    <div style={{ fontSize: 11, color: '#16a34a' }}>
                      The workflow will pause on this step until a human completes the case, then resume on the next
                      node.
                    </div>
                    <label style={{ fontSize: 11, fontWeight: 500, marginTop: 4 }}>Case template</label>
                    <select
                      value={selectedNode.data?.actionConfig?.caseTemplateId || ''}
                      onChange={(e) =>
                        setNodes((nds) =>
                          nds.map((node) =>
                            node.id === selectedNode.id && node.type === 'task'
                              ? {
                                  ...node,
                                  data: {
                                    ...node.data,
                                    actionConfig: {
                                      ...(node.data?.actionConfig || {}),
                                      caseTemplateId: e.target.value || undefined,
                                    },
                                  },
                                }
                              : node
                          )
                        )
                      }
                      style={{
                        fontSize: 12,
                        padding: '4px 6px',
                        borderRadius: 6,
                        border: '1px solid #d1d5db',
                        marginBottom: 4,
                      }}
                    >
                      <option value="">Select case template</option>
                      {caseTemplates.map((tpl) => (
                        <option key={tpl.id} value={tpl.id}>
                          {tpl.name || tpl.id}
                        </option>
                      ))}
                    </select>

                    {selectedCaseTemplate && (
                      <div
                        style={{
                          marginTop: 4,
                          padding: 8,
                          borderRadius: 6,
                          border: '1px dashed #bbf7d0',
                          background: '#f0fdf4',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 4,
                          maxHeight: 180,
                          overflow: 'auto',
                        }}
                      >
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#166534' }}>Field bindings</div>
                        <div style={{ fontSize: 11, color: '#16a34a', marginBottom: 4 }}>
                          Map case fields to JSON paths in this workflow&apos;s payload.
                        </div>
                        {selectedCaseTemplate.fields?.map((field) => {
                          const bindings = selectedNode.data?.actionConfig?.fieldBindings || [];
                          const binding = bindings.find((b) => b.fieldKey === field.key) || {};
                          return (
                            <div
                              key={field.key}
                              style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 6 }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontSize: 11, fontWeight: 500 }}>
                                  {field.label || field.key || 'Field'}{' '}
                                  {field.required && <span style={{ color: '#dc2626' }}>*</span>}
                                  {field.readOnly && (
                                    <span
                                      style={{
                                        marginLeft: 6,
                                        fontSize: 10,
                                        padding: '1px 6px',
                                        borderRadius: 999,
                                        background: '#e5e7eb',
                                        color: '#374151',
                                      }}
                                    >
                                      read-only
                                    </span>
                                  )}
                                </div>
                              </div>
                              <input
                                type="text"
                                placeholder="e.g. payload.txn.amount"
                                value={binding.jsonPath || ''}
                                onChange={(e) =>
                                  setNodes((nds) =>
                                    nds.map((node) => {
                                      if (node.id !== selectedNode.id || node.type !== 'task') return node;
                                      const cfg = { ...(node.data?.actionConfig || {}) };
                                      const list = Array.isArray(cfg.fieldBindings) ? [...cfg.fieldBindings] : [];
                                      const idx = list.findIndex((b) => b.fieldKey === field.key);
                                      const nextBinding = { fieldKey: field.key, jsonPath: e.target.value };
                                      if (idx >= 0) {
                                        list[idx] = nextBinding;
                                      } else {
                                        list.push(nextBinding);
                                      }
                                      cfg.fieldBindings = list;
                                      return { ...node, data: { ...node.data, actionConfig: cfg } };
                                    })
                                  )
                                }
                                style={{
                                  fontSize: 11,
                                  padding: '4px 6px',
                                  borderRadius: 6,
                                  border: '1px solid #d1d5db',
                                }}
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <input
                      type="text"
                      placeholder="Queue name (e.g. AML Level 1)"
                      value={selectedNode.data?.actionConfig?.queue || ''}
                      onChange={(e) =>
                        setNodes((nds) =>
                          nds.map((node) =>
                            node.id === selectedNode.id && node.type === 'task'
                              ? {
                                  ...node,
                                  data: {
                                    ...node.data,
                                    actionConfig: {
                                      ...(node.data?.actionConfig || {}),
                                      queue: e.target.value,
                                    },
                                  },
                                }
                              : node
                          )
                        )
                      }
                      style={{
                        fontSize: 12,
                        padding: '4px 6px',
                        borderRadius: 6,
                        border: '1px solid #d1d5db',
                        marginBottom: 4,
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Required role (e.g. aml_checker)"
                      value={selectedNode.data?.actionConfig?.requiredRole || ''}
                      onChange={(e) =>
                        setNodes((nds) =>
                          nds.map((node) =>
                            node.id === selectedNode.id && node.type === 'task'
                              ? {
                                  ...node,
                                  data: {
                                    ...node.data,
                                    actionConfig: {
                                      ...(node.data?.actionConfig || {}),
                                      requiredRole: e.target.value,
                                    },
                                  },
                                }
                              : node
                          )
                        )
                      }
                      style={{
                        fontSize: 12,
                        padding: '4px 6px',
                        borderRadius: 6,
                        border: '1px solid #d1d5db',
                        marginBottom: 4,
                      }}
                    />
                    <input
                      type="number"
                      placeholder="SLA (seconds)"
                      value={selectedNode.data?.actionConfig?.slaSeconds || ''}
                      onChange={(e) =>
                        setNodes((nds) =>
                          nds.map((node) =>
                            node.id === selectedNode.id && node.type === 'task'
                              ? {
                                  ...node,
                                  data: {
                                    ...node.data,
                                    actionConfig: {
                                      ...(node.data?.actionConfig || {}),
                                      slaSeconds: e.target.value ? Number(e.target.value) : undefined,
                                    },
                                  },
                                }
                              : node
                          )
                        )
                      }
                      style={{
                        fontSize: 12,
                        padding: '4px 6px',
                        borderRadius: 6,
                        border: '1px solid #d1d5db',
                        marginBottom: 4,
                      }}
                    />
                    <textarea
                      rows={3}
                      placeholder="Instructions for the human checker (appear in case UI)."
                      value={selectedNode.data?.actionConfig?.instructions || ''}
                      onChange={(e) =>
                        setNodes((nds) =>
                          nds.map((node) =>
                            node.id === selectedNode.id && node.type === 'task'
                              ? {
                                  ...node,
                                  data: {
                                    ...node.data,
                                    actionConfig: {
                                      ...(node.data?.actionConfig || {}),
                                      instructions: e.target.value,
                                    },
                                  },
                                }
                              : node
                          )
                        )
                      }
                      style={{
                        fontSize: 12,
                        padding: '4px 6px',
                        borderRadius: 6,
                        border: '1px solid #d1d5db',
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div style={{ fontSize: 12, color: '#6b7280' }}>
            Select a node on the canvas to configure its details.
          </div>
        )}

        {/* Entry channels & triggers — only on Start (workflow entry), not condition/task/end */}
        {selectedNode?.type === 'start' && (
        <div
          style={{
            marginTop: 16,
            paddingTop: 12,
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600 }}>Entry channels & triggers</div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>
            Define how this workflow is started: via HTTP API, email ingestion, or on a schedule.
          </div>

          {/* HTTP API (always available, cannot be disabled for now) */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
            <input type="checkbox" checked={entryConfig.httpEnabled ?? true} readOnly />
            <span>
              HTTP API &mdash; POST <code style={{ fontSize: 10 }}>/workflows/{displayId}/run</code>
            </span>
          </label>

          {/* Email ingestion */}
          <div
            style={{
              marginTop: 4,
              padding: 8,
              borderRadius: 6,
              background: '#f3f4ff',
              border: '1px solid #e5e7eb',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
              <input
                type="checkbox"
                checked={!!entryConfig.emailEnabled}
                onChange={(e) =>
                  setEntryConfig((cfg) => ({
                    ...cfg,
                    emailEnabled: e.target.checked,
                  }))
                }
              />
              <span>Email ingestion (e.g. send to a specific mailbox and parse into JSON)</span>
            </label>
            {entryConfig.emailEnabled && (
              <>
                <input
                  type="text"
                  placeholder="Ingestion address (e.g. ops+workflow@bank.com)"
                  value={entryConfig.emailAddress || ''}
                  onChange={(e) =>
                    setEntryConfig((cfg) => ({
                      ...cfg,
                      emailAddress: e.target.value,
                    }))
                  }
                  style={{
                    fontSize: 11,
                    padding: '4px 6px',
                    borderRadius: 6,
                    border: '1px solid #d1d5db',
                  }}
                />
                <input
                  type="text"
                  placeholder="Optional subject filter (e.g. [CARD_DISPUTE])"
                  value={entryConfig.emailSubjectFilter || ''}
                  onChange={(e) =>
                    setEntryConfig((cfg) => ({
                      ...cfg,
                      emailSubjectFilter: e.target.value,
                    }))
                  }
                  style={{
                    fontSize: 11,
                    padding: '4px 6px',
                    borderRadius: 6,
                    border: '1px solid #d1d5db',
                  }}
                />
              </>
            )}
          </div>

          {/* Scheduled trigger */}
          <div
            style={{
              marginTop: 4,
              padding: 8,
              borderRadius: 6,
              background: '#ecfeff',
              border: '1px solid #bae6fd',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
              <input
                type="checkbox"
                checked={!!entryConfig.scheduleEnabled}
                onChange={(e) =>
                  setEntryConfig((cfg) => ({
                    ...cfg,
                    scheduleEnabled: e.target.checked,
                  }))
                }
              />
              <span>Scheduled trigger</span>
            </label>

            {entryConfig.scheduleEnabled && (
              <>
                <label style={{ fontSize: 11, fontWeight: 500 }}>Schedule type</label>
                <select
                  value={entryConfig.scheduleType || 'daily'}
                  onChange={(e) =>
                    setEntryConfig((cfg) => ({
                      ...cfg,
                      scheduleType: e.target.value,
                    }))
                  }
                  style={{
                    fontSize: 11,
                    padding: '4px 6px',
                    borderRadius: 6,
                    border: '1px solid #d1d5db',
                  }}
                >
                  <option value="daily">Daily time</option>
                  <option value="cron">Cron expression</option>
                </select>

                {entryConfig.scheduleType !== 'cron' ? (
                  <>
                    <label style={{ fontSize: 11, fontWeight: 500 }}>Time of day</label>
                    <input
                      type="text"
                      placeholder="e.g. 09:00"
                      value={entryConfig.scheduleTimeOfDay || ''}
                      onChange={(e) =>
                        setEntryConfig((cfg) => ({
                          ...cfg,
                          scheduleTimeOfDay: e.target.value,
                        }))
                      }
                      style={{
                        fontSize: 11,
                        padding: '4px 6px',
                        borderRadius: 6,
                        border: '1px solid #d1d5db',
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Timezone (e.g. Asia/Singapore)"
                      value={entryConfig.scheduleTimezone || ''}
                      onChange={(e) =>
                        setEntryConfig((cfg) => ({
                          ...cfg,
                          scheduleTimezone: e.target.value,
                        }))
                      }
                      style={{
                        fontSize: 11,
                        padding: '4px 6px',
                        borderRadius: 6,
                        border: '1px solid #d1d5db',
                      }}
                    />
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                      <input
                        type="checkbox"
                        checked={!!entryConfig.scheduleBusinessDaysOnly}
                        onChange={(e) =>
                          setEntryConfig((cfg) => ({
                            ...cfg,
                            scheduleBusinessDaysOnly: e.target.checked,
                          }))
                        }
                      />
                      <span>Business days only (Mon–Fri)</span>
                    </label>
                  </>
                ) : (
                  <>
                    <label style={{ fontSize: 11, fontWeight: 500 }}>Cron expression</label>
                    <input
                      type="text"
                      placeholder="e.g. 0 9 * * MON-FRI"
                      value={entryConfig.scheduleCron || ''}
                      onChange={(e) =>
                        setEntryConfig((cfg) => ({
                          ...cfg,
                          scheduleCron: e.target.value,
                        }))
                      }
                      style={{
                        fontSize: 11,
                        padding: '4px 6px',
                        borderRadius: 6,
                        border: '1px solid #d1d5db',
                      }}
                    />
                  </>
                )}
              </>
            )}
          </div>
        </div>
        )}

        {/* Workflow-level: request body note */}
        <div
          style={{
            marginTop: 16,
            paddingTop: 12,
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600 }}>Request body (JSON)</div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>
            Upstream calls POST /workflows/{displayId}/run with a JSON body. Optional note:
          </div>
          <textarea
            rows={2}
            value={requestBodyDescription}
            onChange={(e) => setRequestBodyDescription(e.target.value)}
            placeholder="e.g. { &quot;customerId&quot;, &quot;name&quot;, &quot;riskScore&quot; }"
            style={{
              padding: '6px 8px',
              fontSize: 12,
              borderRadius: 6,
              border: '1px solid #d1d5db',
              resize: 'vertical',
            }}
          />
        </div>
      </div>
      </div>
    </div>
  );
}

export default function WorkflowEditor({
  initialWorkflow,
  onSave,
  onBack,
  caseTemplates = [],
  communicationTemplates = [],
}) {
  return (
    <div style={{ height: '100%', minHeight: '600px', width: '100%', display: 'flex', flexDirection: 'column' }}>
      <ReactFlowProvider>
        <WorkflowCanvas
          initialWorkflow={initialWorkflow}
          onSave={onSave}
          onBack={onBack}
          caseTemplates={caseTemplates}
          communicationTemplates={communicationTemplates}
        />
      </ReactFlowProvider>
    </div>
  );
}

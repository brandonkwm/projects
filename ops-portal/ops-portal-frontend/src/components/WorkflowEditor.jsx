import React, { useCallback, useMemo, useRef, useState } from 'react';
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
  const allowedOutputs = (data?.aiConfig?.allowedOutputs || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const leftLabel = allowedOutputs[0] || (isAiMode ? 'Yes' : 'true');
  const rightLabel = allowedOutputs[1] || (isAiMode ? 'No' : 'false');
  const displayLabel = data?.label || (isAiMode ? 'AI decision' : 'Condition');

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
          background: isAiMode
            ? 'linear-gradient(135deg, #4f46e5, #6366f1)'
            : 'linear-gradient(135deg, #7c3aed, #a855f7)',
          borderRadius: 18,
          boxShadow: isAiMode
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
  const workflowId = initialWorkflow?.id ?? null;
  const { project } = useReactFlow();

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
      const label = paletteItem?.label || type;

      const newNode = {
        id: getId(),
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
    [project, setNodes]
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

  const saveWorkflow = useCallback(() => {
    const name = (workflowName || 'Unnamed').trim();
    const id =
      workflowId ||
      uniqueWorkflowId(slugFromName(name));
    const payload = {
      id,
      name,
      description: workflowDescription.trim() || undefined,
      requestBodyDescription: requestBodyDescription.trim() || undefined,
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
    onSave?.(payload);
  }, [
    nodes,
    edges,
    workflowName,
    workflowDescription,
    requestBodyDescription,
    workflowId,
    onSave,
  ]);

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
            This workflow is triggered by a JSON request body. Tasks and decisions process that payload; a task can lead to another decision.
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
                marginBottom: 8,
              }}
            />

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
                  Choose between classic IF / AND / OR rules or an AI-assisted decision. The engine can use the{' '}
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

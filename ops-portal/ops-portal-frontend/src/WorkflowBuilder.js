import React, { useCallback, useState } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  addEdge,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import './WorkflowBuilder.css';

const nodeTypes = {
  amlScreen: (props) => (
    <div className="custom-node aml">
      <div>🔍 AML Screen</div>
    </div>
  ),
  riskCheck: (props) => (
    <div className="custom-node risk">
      <div>⚠️ Risk Check</div>
    </div>
  ),
  approve: (props) => (
    <div className="custom-node approve">
      <div>✅ Approve</div>
    </div>
  ),
  escalate: (props) => (
    <div className="custom-node escalate">
      <div>🚨 Escalate</div>
    </div>
  ),
};

const sidebarNodes = [
  { id: 'aml', label: 'AML Screen', type: 'amlScreen' },
  { id: 'risk', label: 'Risk Check', type: 'riskCheck' },
  { id: 'approve', label: 'Approve', type: 'approve' },
  { id: 'escalate', label: 'Escalate', type: 'escalate' },
];

function WorkflowBuilder() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const reactFlowBounds = event.target.closest('.react-flow').getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');
      
      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };

      const newNode = {
        id: `${type}-${+new Date()}`,
        type,
        position,
        data: { label: `${type.toUpperCase()}` },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes]
  );

  const saveWorkflow = () => {
    const workflow = {
      id: `wf-${Date.now()}`,
      name: 'New Workflow',
      nodes: nodes.map(n => ({
        id: n.id,
        type: n.type,
        params: n.data?.params || {}
      })),
      edges: edges.map(e => ({
        source: e.source,
        target: e.target
      }))
    };
    console.log('SAVE WORKFLOW:', JSON.stringify(workflow, null, 2));
    alert('Workflow saved! Check console for JSON');
  };

  return (
    <div className="workflow-builder">
      <div className="header">
        <h1>Operations Workflow Builder</h1>
        <button onClick={saveWorkflow} className="save-btn">
          💾 Save Workflow
        </button>
      </div>

      <div className="layout">
        {/* Sidebar - Drag nodes from here */}
        <div className="sidebar">
          <h3>Operations Nodes</h3>
          <div className="node-palette">
            {sidebarNodes.map((node) => (
              <div
                key={node.id}
                className="node-item"
                draggable
                onDragStart={(event) => event.dataTransfer.setData('application/reactflow', node.type)}
                title={node.label}
              >
                {node.label}
              </div>
            ))}
          </div>
        </div>

        {/* Canvas */}
        <div className="canvas-container">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            fitView
          >
            <MiniMap />
            <Controls />
            <Background variant="dots" gap={12} size={1} />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}

export default WorkflowBuilder;

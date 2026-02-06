// src/App.jsx
import React, { useCallback, useState } from 'react';
import WorkflowEditor from './components/WorkflowEditor';
import WorkflowList from './components/WorkflowList';
import CaseTemplateList from './components/CaseTemplateList';
import CaseTemplateEditor from './components/CaseTemplateEditor';
import CommunicationTemplateList from './components/CommunicationTemplateList';
import CommunicationTemplateEditor from './components/CommunicationTemplateEditor';
import CaseWorkList from './components/CaseWorkList';
import CaseWorkView from './components/CaseWorkView';
import CaseTraceView from './components/CaseTraceView';
import CreateTestCaseForm from './components/CreateTestCaseForm';
import {
  getAllWorkflows,
  getWorkflowById,
  saveWorkflow,
  deleteWorkflow,
} from './lib/workflowStorage';
import {
  getAllCaseTemplates,
  getCaseTemplateById,
  saveCaseTemplate,
  deleteCaseTemplate,
} from './lib/caseTemplateStorage';
import {
  getAllCommunicationTemplates,
  getCommunicationTemplateById,
  saveCommunicationTemplate,
  deleteCommunicationTemplate,
} from './lib/communicationTemplateStorage';
import { getAllCaseInstances } from './lib/caseInstanceStorage';
import './App.css';

function App() {
  const [section, setSection] = useState('workflows'); // 'workflows' | 'cases' | 'comms' | 'casework'
  const [view, setView] = useState('list'); // workflows: list|builder; cases/comms: list|editor; casework: list|open|create
  const [selectedWorkflowId, setSelectedWorkflowId] = useState(null); // null = new workflow
  const [workflows, setWorkflows] = useState(() => getAllWorkflows());
  const [caseTemplates, setCaseTemplates] = useState(() => getAllCaseTemplates());
  const [communicationTemplates, setCommunicationTemplates] = useState(() => getAllCommunicationTemplates());
  const [caseInstances, setCaseInstances] = useState(() => getAllCaseInstances());
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [traceCaseId, setTraceCaseId] = useState(null);

  const refreshWorkflows = useCallback(() => {
    setWorkflows(getAllWorkflows());
  }, []);

  const refreshCaseTemplates = useCallback(() => {
    setCaseTemplates(getAllCaseTemplates());
  }, []);

  const refreshCommunicationTemplates = useCallback(() => {
    setCommunicationTemplates(getAllCommunicationTemplates());
  }, []);

  const refreshCaseInstances = useCallback(() => {
    setCaseInstances(getAllCaseInstances());
  }, []);

  const handleNew = useCallback(() => {
    setSelectedWorkflowId(null);
    setSection('workflows');
    setView('builder');
  }, []);

  const handleOpen = useCallback((id) => {
    setSelectedWorkflowId(id);
    setSection('workflows');
    setView('builder');
  }, []);

  const handleSave = useCallback((workflow) => {
    saveWorkflow(workflow);
    refreshWorkflows();
    setView('list');
  }, [refreshWorkflows]);

  const handleBack = useCallback(() => {
    setView('list');
  }, []);

  const handleDelete = useCallback((id) => {
    deleteWorkflow(id);
    refreshWorkflows();
  }, [refreshWorkflows]);

  // Case template handlers
  const [selectedCaseTemplateId, setSelectedCaseTemplateId] = useState(null);

  const handleNewCaseTemplate = useCallback(() => {
    setSelectedCaseTemplateId(null);
    setSection('cases');
    setView('editor');
  }, []);

  const handleEditCaseTemplate = useCallback((id) => {
    setSelectedCaseTemplateId(id);
    setSection('cases');
    setView('editor');
  }, []);

  const handleSaveCaseTemplate = useCallback((template) => {
    saveCaseTemplate(template);
    refreshCaseTemplates();
    setView('list');
  }, [refreshCaseTemplates]);

  const handleBackFromCaseEditor = useCallback(() => {
    setView('list');
  }, []);

  const handleDeleteCaseTemplate = useCallback((id) => {
    deleteCaseTemplate(id);
    refreshCaseTemplates();
  }, [refreshCaseTemplates]);

  // Communication template handlers
  const [selectedCommTemplateId, setSelectedCommTemplateId] = useState(null);

  const handleNewCommTemplate = useCallback(() => {
    setSelectedCommTemplateId(null);
    setSection('comms');
    setView('editor');
  }, []);

  const handleEditCommTemplate = useCallback((id) => {
    setSelectedCommTemplateId(id);
    setSection('comms');
    setView('editor');
  }, []);

  const handleSaveCommTemplate = useCallback((tpl) => {
    saveCommunicationTemplate(tpl);
    refreshCommunicationTemplates();
    setView('list');
  }, [refreshCommunicationTemplates]);

  const handleBackFromCommEditor = useCallback(() => {
    setView('list');
  }, []);

  const handleDeleteCommTemplate = useCallback((id) => {
    deleteCommunicationTemplate(id);
    refreshCommunicationTemplates();
  }, [refreshCommunicationTemplates]);

  const renderContent = () => {
    if (section === 'workflows') {
      if (view === 'builder') {
        const initialWorkflow = selectedWorkflowId ? getWorkflowById(selectedWorkflowId) : null;
        return (
          <WorkflowEditor
            initialWorkflow={initialWorkflow}
            onSave={handleSave}
            onBack={handleBack}
            caseTemplates={caseTemplates}
            communicationTemplates={communicationTemplates}
          />
        );
      }
      return (
        <WorkflowList
          workflows={workflows}
          onNew={handleNew}
          onOpen={handleOpen}
          onDelete={handleDelete}
        />
      );
    }

    if (section === 'cases') {
      if (view === 'editor') {
        const initialTemplate = selectedCaseTemplateId
          ? getCaseTemplateById(selectedCaseTemplateId)
          : null;
        return (
          <CaseTemplateEditor
            initialTemplate={initialTemplate}
            onSave={handleSaveCaseTemplate}
            onBack={handleBackFromCaseEditor}
          />
        );
      }
      return (
        <CaseTemplateList
          templates={caseTemplates}
          onNew={handleNewCaseTemplate}
          onEdit={handleEditCaseTemplate}
          onDelete={handleDeleteCaseTemplate}
        />
      );
    }

    if (section === 'comms') {
      if (view === 'editor') {
        const initialTemplate = selectedCommTemplateId
          ? getCommunicationTemplateById(selectedCommTemplateId)
          : null;
        return (
          <CommunicationTemplateEditor
            initialTemplate={initialTemplate}
            onSave={handleSaveCommTemplate}
            onBack={handleBackFromCommEditor}
          />
        );
      }
      return (
        <CommunicationTemplateList
          templates={communicationTemplates}
          onNew={handleNewCommTemplate}
          onEdit={handleEditCommTemplate}
          onDelete={handleDeleteCommTemplate}
        />
      );
    }

    if (section === 'casework') {
      if (traceCaseId) {
        return (
          <CaseTraceView
            caseId={traceCaseId}
            workflows={workflows}
            onBack={() => setTraceCaseId(null)}
          />
        );
      }
      if (view === 'create') {
        return (
          <CreateTestCaseForm
            caseTemplates={caseTemplates}
            onCreateAndOpen={(id) => {
              setSelectedCaseId(id);
              setView('open');
              refreshCaseInstances();
            }}
            onBack={() => setView('list')}
          />
        );
      }
      if (view === 'open' && selectedCaseId) {
        return (
          <CaseWorkView
            caseId={selectedCaseId}
            caseTemplates={caseTemplates}
            onBack={() => {
              setView('list');
              setSelectedCaseId(null);
              refreshCaseInstances();
            }}
            onComplete={refreshCaseInstances}
          />
        );
      }
      return (
        <CaseWorkList
          cases={caseInstances}
          caseTemplates={caseTemplates}
          onOpen={(id) => {
            setSelectedCaseId(id);
            setView('open');
          }}
          onTraceCaseId={(id) => setTraceCaseId(id || null)}
          onCreateTestCase={() => setView('create')}
        />
      );
    }

    return null;
  };

  return (
    <div className="workflow-app-root" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 20px',
          borderBottom: '1px solid #e5e7eb',
          background: '#ffffff',
          flexShrink: 0,
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 700 }}>Ops Portal – Designer</div>
        <nav style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => {
              setSection('workflows');
              setView('list');
            }}
            style={{
              padding: '6px 12px',
              fontSize: 13,
              borderRadius: 999,
              border: '1px solid ' + (section === 'workflows' ? '#4f46e5' : '#d1d5db'),
              background: section === 'workflows' ? '#eef2ff' : '#ffffff',
              cursor: 'pointer',
            }}
          >
            Workflows
          </button>
          <button
            type="button"
            onClick={() => {
              setSection('cases');
              setView('list');
            }}
            style={{
              padding: '6px 12px',
              fontSize: 13,
              borderRadius: 999,
              border: '1px solid ' + (section === 'cases' ? '#0f766e' : '#d1d5db'),
              background: section === 'cases' ? '#ecfdf3' : '#ffffff',
              cursor: 'pointer',
            }}
          >
            Case templates
          </button>
          <button
            type="button"
            onClick={() => {
              setSection('comms');
              setView('list');
            }}
            style={{
              padding: '6px 12px',
              fontSize: 13,
              borderRadius: 999,
              border: '1px solid ' + (section === 'comms' ? '#7c3aed' : '#d1d5db'),
              background: section === 'comms' ? '#f5f3ff' : '#ffffff',
              cursor: 'pointer',
            }}
          >
            Communication templates
          </button>
          <button
            type="button"
            onClick={() => {
              setSection('casework');
              setView('list');
              setSelectedCaseId(null);
              refreshCaseInstances();
            }}
            style={{
              padding: '6px 12px',
              fontSize: 13,
              borderRadius: 999,
              border: '1px solid ' + (section === 'casework' ? '#0d9488' : '#d1d5db'),
              background: section === 'casework' ? '#ccfbf1' : '#ffffff',
              cursor: 'pointer',
            }}
          >
            Case work
          </button>
        </nav>
      </header>

      <main style={{ flex: 1, overflow: 'auto' }}>{renderContent()}</main>
    </div>
  );
}

export default App;


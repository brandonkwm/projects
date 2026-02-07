import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import RulesConfig from './components/RulesConfig';
import RunDetail from './components/RunDetail';

function App() {
  const [section, setSection] = useState('dashboard'); // 'dashboard' | 'rules'
  const [selectedRunId, setSelectedRunId] = useState(null);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-slate-800 text-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Reconciliation Platform — Agentic AI</h1>
          <nav className="flex gap-4">
            <button
              onClick={() => { setSection('dashboard'); setSelectedRunId(null); }}
              className={`px-3 py-1.5 rounded ${section === 'dashboard' && !selectedRunId ? 'bg-slate-600' : 'hover:bg-slate-700'}`}
            >
              Dashboard
            </button>
            <button
              onClick={() => { setSection('rules'); setSelectedRunId(null); }}
              className={`px-3 py-1.5 rounded ${section === 'rules' ? 'bg-slate-600' : 'hover:bg-slate-700'}`}
            >
              Rules
            </button>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        {selectedRunId ? (
          <RunDetail runId={selectedRunId} onBack={() => setSelectedRunId(null)} />
        ) : (
          <>
            {section === 'dashboard' && <Dashboard onOpenRun={setSelectedRunId} />}
            {section === 'rules' && <RulesConfig />}
          </>
        )}
      </main>
    </div>
  );
}

export default App;

import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { Dashboard } from './components/Dashboard';
import { ProjectDetail } from './components/ProjectDetail';
import { SessionModal } from './components/SessionModal';
import { PROJECT_DEFINITIONS } from './data/seed';
import { createSessionRecord, deriveAppState } from './utils/progression';
import { createExportPayload, loadState, resetState, saveState, validateImportPayload } from './utils/storage';

function AppLayout({ children }) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand-link" to="/">
          <span className="brand-link__mark">TF</span>
          <div>
            <strong>The Forge</strong>
            <span>Local progression dashboard</span>
          </div>
        </Link>
      </header>
      {children}
    </div>
  );
}

function DashboardRoute(props) {
  return (
    <AppLayout>
      <Dashboard {...props} />
    </AppLayout>
  );
}

function ProjectRoute({ derived, onOpenSessionModal }) {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const project = PROJECT_DEFINITIONS.find((entry) => entry.id === projectId);

  if (!project) {
    return <Navigate to="/" replace />;
  }

  return (
    <AppLayout>
      <ProjectDetail
        project={project}
        stats={derived.projectStats[project.id]}
        onBack={() => navigate('/')}
        onOpenSessionModal={(targetProjectId) => onOpenSessionModal(targetProjectId)}
      />
    </AppLayout>
  );
}

function App() {
  const navigate = useNavigate();
  const [appState, setAppState] = useState(() => loadState());
  const [sessionModalProjectId, setSessionModalProjectId] = useState(undefined);

  useEffect(() => {
    saveState(appState);
  }, [appState]);

  const derived = useMemo(() => deriveAppState(appState), [appState]);

  const handleSaveSession = (payload) => {
    setAppState((current) => ({
      ...current,
      sessions: [...current.sessions, createSessionRecord(payload)],
    }));
    setSessionModalProjectId(undefined);
  };

  const handleClaimQuest = (questId) => {
    const targetQuest = derived.dailyQuests.find((quest) => quest.id === questId);
    if (!targetQuest || !targetQuest.complete || targetQuest.claimed) {
      return;
    }

    setAppState((current) => ({
      ...current,
      questClaims: {
        ...current.questClaims,
        [derived.todayKey]: {
          ...(current.questClaims[derived.todayKey] || {}),
          [questId]: new Date().toISOString(),
        },
      },
    }));
  };

  const handleToggleHabit = (habitId) => {
    setAppState((current) => {
      const todayHabits = { ...(current.habitChecks[derived.todayKey] || {}) };

      if (todayHabits[habitId]) {
        delete todayHabits[habitId];
      } else {
        todayHabits[habitId] = new Date().toISOString();
      }

      return {
        ...current,
        habitChecks: {
          ...current.habitChecks,
          [derived.todayKey]: todayHabits,
        },
      };
    });
  };

  const handleExportData = () => {
    const payload = createExportPayload();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'forge-save.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleImportData = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    try {
      const contents = await file.text();
      const parsed = JSON.parse(contents);
      const result = validateImportPayload(parsed);

      if (!result.valid) {
        window.alert(result.message);
        return;
      }

      const confirmed = window.confirm('Importing this save will overwrite your current local data. Do you want to continue?');
      if (!confirmed) {
        return;
      }

      setAppState(result.state);
      setSessionModalProjectId(undefined);
      navigate('/');
    } catch (error) {
      window.alert('Import failed: could not read this file. Please choose a valid The Forge JSON export.');
    }
  };

  const handleResetProgress = () => {
    const confirmed = window.confirm(
      'Reset Progress will permanently erase all saved sessions, quests, habits, achievements, notes, and progression from this device. This cannot be undone. Continue?',
    );

    if (!confirmed) {
      return;
    }

    setAppState(resetState());
    setSessionModalProjectId(undefined);
    navigate('/');
  };

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            <DashboardRoute
              derived={derived}
              projects={PROJECT_DEFINITIONS}
              onSelectProject={(projectId) => navigate(`/projects/${projectId}`)}
              onOpenSessionModal={() => setSessionModalProjectId(null)}
              onClaimQuest={handleClaimQuest}
              onToggleHabit={handleToggleHabit}
              onExportData={handleExportData}
              onImportData={handleImportData}
              onResetProgress={handleResetProgress}
            />
          }
        />
        <Route
          path="/projects/:projectId"
          element={<ProjectRoute derived={derived} onOpenSessionModal={(projectId) => setSessionModalProjectId(projectId)} />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <SessionModal
        isOpen={sessionModalProjectId !== undefined}
        onClose={() => setSessionModalProjectId(undefined)}
        onSubmit={handleSaveSession}
        projects={PROJECT_DEFINITIONS}
        defaultProjectId={sessionModalProjectId}
      />
    </>
  );
}

export default App;

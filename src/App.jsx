import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { Dashboard } from './components/Dashboard';
import { ProjectDetail } from './components/ProjectDetail';
import { SessionModal } from './components/SessionModal';
import { TutorialModal } from './components/TutorialModal';
import { PROJECT_DEFINITIONS } from './data/seed';
import { createSessionRecord, deriveAppState, updateSessionRecord } from './utils/progression';
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

function ProjectRoute({ derived, onOpenSessionModal, onEditSession, onDeleteSession }) {
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
        onEditSession={onEditSession}
        onDeleteSession={onDeleteSession}
      />
    </AppLayout>
  );
}

function App() {
  const navigate = useNavigate();
  const [appState, setAppState] = useState(() => loadState());
  const [sessionModalState, setSessionModalState] = useState(null);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  useEffect(() => {
    saveState(appState);
  }, [appState]);

  useEffect(() => {
    if (!appState.ui?.tutorialDismissed) {
      setIsTutorialOpen(true);
    }
  }, [appState.ui]);

  const derived = useMemo(() => deriveAppState(appState), [appState]);

  const closeTutorial = () => {
    setIsTutorialOpen(false);
    setAppState((current) => ({
      ...current,
      ui: {
        ...current.ui,
        tutorialDismissed: true,
      },
    }));
  };

  const handleSaveSession = (payload) => {
    setAppState((current) => {
      if (sessionModalState?.mode === 'edit' && sessionModalState.sessionId) {
        return {
          ...current,
          sessions: current.sessions.map((session) =>
            session.id === sessionModalState.sessionId ? updateSessionRecord(session, payload) : session,
          ),
        };
      }

      return {
        ...current,
        sessions: [...current.sessions, createSessionRecord(payload)],
      };
    });
    setSessionModalState(null);
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
      setSessionModalState(null);
      setIsTutorialOpen(false);
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
    setSessionModalState(null);
    setIsTutorialOpen(true);
    navigate('/');
  };

  const handleEditSession = (session) => {
    setSessionModalState({
      mode: 'edit',
      sessionId: session.id,
      initialValues: {
        projectId: session.projectId,
        durationMinutes: session.durationMinutes,
        tag: session.tag,
        note: session.note,
        date: session.date,
      },
    });
  };

  const handleDeleteSession = (sessionId) => {
    const confirmed = window.confirm('Delete this session? This will immediately recalculate XP, levels, streaks, quests, and achievements.');
    if (!confirmed) {
      return;
    }

    setAppState((current) => ({
      ...current,
      sessions: current.sessions.filter((session) => session.id !== sessionId),
    }));
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
              onOpenSessionModal={() => setSessionModalState({ mode: 'create', defaultProjectId: null, initialValues: null })}
              onClaimQuest={handleClaimQuest}
              onToggleHabit={handleToggleHabit}
              onExportData={handleExportData}
              onImportData={handleImportData}
              onResetProgress={handleResetProgress}
              onOpenTutorial={() => setIsTutorialOpen(true)}
            />
          }
        />
        <Route
          path="/projects/:projectId"
          element={
            <ProjectRoute
              derived={derived}
              onOpenSessionModal={(projectId) => setSessionModalState({ mode: 'create', defaultProjectId: projectId, initialValues: null })}
              onEditSession={handleEditSession}
              onDeleteSession={handleDeleteSession}
            />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <SessionModal
        isOpen={Boolean(sessionModalState)}
        onClose={() => setSessionModalState(null)}
        onSubmit={handleSaveSession}
        projects={PROJECT_DEFINITIONS}
        defaultProjectId={sessionModalState?.defaultProjectId}
        initialValues={sessionModalState?.initialValues}
      />

      <TutorialModal isOpen={isTutorialOpen} onClose={closeTutorial} />
    </>
  );
}

export default App;

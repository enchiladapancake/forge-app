import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { Dashboard } from './components/Dashboard';
import { ProjectDetail } from './components/ProjectDetail';
import { SessionModal } from './components/SessionModal';
import { TutorialModal } from './components/TutorialModal';
import { PROJECT_DEFINITIONS, QUEST_POOL } from './data/seed';
import {
  PERK_DEFINITIONS,
  createSessionRecord,
  deriveAppState,
  getProjectDefinition,
  getTodayKey,
  getWeekKey,
  getWeeklyFocusBonusPercent,
  updateSessionRecord,
} from './utils/progression';
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
  const [xpFeedback, setXpFeedback] = useState(null);

  useEffect(() => {
    saveState(appState);
  }, [appState]);

  useEffect(() => {
    if (!appState.ui?.tutorialDismissed) {
      setIsTutorialOpen(true);
    }
  }, [appState.ui]);

  useEffect(() => {
    if (!xpFeedback) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setXpFeedback(null), 3200);
    return () => window.clearTimeout(timeoutId);
  }, [xpFeedback]);

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
    const project = getProjectDefinition(payload.projectId);
    const focusBonusPercent = getWeeklyFocusBonusPercent(project.categoryId, appState.weeklyFocus);
    let targetSessionId = sessionModalState?.sessionId;
    let nextState;

    if (sessionModalState?.mode === 'edit' && sessionModalState.sessionId) {
      nextState = {
        ...appState,
        sessions: appState.sessions.map((session) => {
          if (session.id !== sessionModalState.sessionId) {
            return session;
          }

          return updateSessionRecord(session, { ...payload, focusBonusPercent });
        }),
      };
    } else {
      const newSession = createSessionRecord({ ...payload, focusBonusPercent });
      targetSessionId = newSession.id;
      nextState = {
        ...appState,
        sessions: [...appState.sessions, newSession],
      };
    }

    const nextDerived = deriveAppState(nextState);
    const nextSession = nextDerived.evaluatedSessions.find((session) => session.id === targetSessionId);
    const xpDelta = nextDerived.overallXp - derived.overallXp;
    const bonusNotes = [];

    if (nextSession?.focusBonusPercent) {
      bonusNotes.push('Focus bonus applied');
    }
    if (nextSession?.momentumBonusPercent) {
      bonusNotes.push('Momentum bonus applied');
    }
    if (nextDerived.balanceBonusInfo.events.length > derived.balanceBonusInfo.events.length) {
      bonusNotes.push('Balanced Week achieved');
    }
    if (
      nextDerived.longTermQuests.filter((quest) => quest.complete).length >
      derived.longTermQuests.filter((quest) => quest.complete).length
    ) {
      bonusNotes.push('Long-term quest completed');
    }
    if (
      nextDerived.legendaryQuests.filter((quest) => quest.complete).length >
      derived.legendaryQuests.filter((quest) => quest.complete).length
    ) {
      bonusNotes.push('Legendary quest advanced to completion');
    }
    if (
      nextDerived.milestoneHighlights.filter((milestone) => !milestone.claimed).length >
      derived.milestoneHighlights.filter((milestone) => !milestone.claimed).length
    ) {
      bonusNotes.push('New milestone ready');
    }
    if (nextDerived.buildIdentity.name !== derived.buildIdentity.name) {
      bonusNotes.push(`Build shifted to ${nextDerived.buildIdentity.name}`);
    }

    setAppState(nextState);
    setSessionModalState(null);
    setXpFeedback({
      label: `${xpDelta >= 0 ? '+' : ''}${xpDelta} XP`,
      note: bonusNotes.length ? bonusNotes.join(' | ') : sessionModalState?.mode === 'edit' ? 'Session updated' : 'Session recorded',
    });
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
    setXpFeedback({
      label: `+${targetQuest.rewardXp} XP | +${targetQuest.rewardPoints} FP`,
      note: `Daily quest completed: ${targetQuest.title}`,
    });
  };

  const handleClaimWeeklyChallenge = (challengeId) => {
    const challenge = derived.weeklyChallenges.find((entry) => entry.id === challengeId);
    const weekKey = getWeekKey();
    if (!challenge || !challenge.complete || challenge.claimed) {
      return;
    }

    setAppState((current) => ({
      ...current,
      weeklyChallengeClaims: {
        ...current.weeklyChallengeClaims,
        [weekKey]: {
          ...(current.weeklyChallengeClaims[weekKey] || {}),
          [challengeId]: new Date().toISOString(),
        },
      },
    }));
    setXpFeedback({
      label: `+${challenge.rewardXp} XP | +${challenge.rewardPoints} FP`,
      note: `Weekly challenge cleared: ${challenge.title}`,
    });
  };

  const handleClaimLongTermQuest = (questId) => {
    const quest = derived.longTermQuests.find((entry) => entry.id === questId);
    if (!quest || !quest.complete || quest.claimed) {
      return;
    }

    setAppState((current) => ({
      ...current,
      longTermQuestClaims: {
        ...current.longTermQuestClaims,
        [questId]: new Date().toISOString(),
      },
    }));
    setXpFeedback({
      label: `+${quest.rewardXp} XP | +${quest.rewardPoints} FP`,
      note: `Long-term quest completed: ${quest.title}`,
    });
  };

  const handleClaimLegendaryQuest = (questId) => {
    const quest = derived.legendaryQuests.find((entry) => entry.id === questId);
    if (!quest || !quest.complete || quest.claimed) {
      return;
    }

    setAppState((current) => ({
      ...current,
      legendaryQuestClaims: {
        ...current.legendaryQuestClaims,
        [questId]: new Date().toISOString(),
      },
    }));
    setXpFeedback({
      label: `+${quest.rewardXp} XP | +${quest.rewardPoints} FP`,
      note: `Legendary quest completed: ${quest.title}`,
    });
  };

  const handleClaimMilestone = (milestoneId) => {
    const milestone = derived.milestoneHighlights.find((entry) => entry.id === milestoneId);
    if (!milestone || milestone.claimed) {
      return;
    }

    setAppState((current) => ({
      ...current,
      milestoneClaims: {
        ...current.milestoneClaims,
        [milestoneId]: new Date().toISOString(),
      },
    }));
    setXpFeedback({
      label: `+200 XP | +${milestone.rewardPoints} FP`,
      note: `Milestone claimed: ${milestone.title}`,
    });
  };

  const handlePurchasePerk = (perkId) => {
    const perk = PERK_DEFINITIONS.find((entry) => entry.id === perkId);
    if (!perk || derived.forgePoints < perk.cost || appState.purchasedPerks?.[perkId]) {
      return;
    }

    setAppState((current) => ({
      ...current,
      purchasedPerks: {
        ...current.purchasedPerks,
        [perkId]: new Date().toISOString(),
      },
    }));
    setXpFeedback({
      label: `-${perk.cost} FP`,
      note: `Perk unlocked: ${perk.title}`,
    });
  };

  const handleRerollDailyQuest = (slotIndex) => {
    const todayKey = getTodayKey();
    if (derived.dailyQuestRerollInfo.rerollsUsed >= derived.dailyQuestRerollInfo.rerollLimit) {
      return;
    }

    const currentQuestIds = derived.dailyQuests.map((quest) => quest.id);
    const currentQuestId = derived.dailyQuests.find((quest) => quest.slotIndex === slotIndex)?.id;
    const replacement = QUEST_POOL.find((quest) => !currentQuestIds.includes(quest.id) && quest.id !== currentQuestId);
    if (!replacement) {
      return;
    }

    setAppState((current) => ({
      ...current,
      dailyQuestRerolls: {
        ...current.dailyQuestRerolls,
        [todayKey]: (current.dailyQuestRerolls?.[todayKey] || 0) + 1,
      },
      dailyQuestOverrides: {
        ...current.dailyQuestOverrides,
        [todayKey]: {
          ...(current.dailyQuestOverrides?.[todayKey] || {}),
          [slotIndex]: replacement.id,
        },
      },
    }));
    setXpFeedback({
      label: 'Quest rerolled',
      note: `New daily quest: ${replacement.title}`,
    });
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
    const habit = derived.habitsToday.find((entry) => entry.id === habitId);
    if (habit && !habit.checked) {
      setXpFeedback({
        label: `+${habit.rewardXp} XP`,
        note: `Habit completed: ${habit.name}`,
      });
    }
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

    const nextState = {
      ...appState,
      sessions: appState.sessions.filter((session) => session.id !== sessionId),
    };
    const nextDerived = deriveAppState(nextState);
    const xpDelta = nextDerived.overallXp - derived.overallXp;
    setAppState(nextState);
    setXpFeedback({
      label: `${xpDelta >= 0 ? '+' : ''}${xpDelta} XP`,
      note: 'Session removed and progression recalculated',
    });
  };

  const handleWeeklyFocusChange = (nextFocus) => {
    const uniqueSecondaryIds = [...new Set((nextFocus.secondaryCategoryIds || []).filter(Boolean))].slice(0, 2);

    if (nextFocus.primaryCategoryId && uniqueSecondaryIds.includes(nextFocus.primaryCategoryId)) {
      return;
    }

    setAppState((current) => ({
      ...current,
      weeklyFocus: {
        primaryCategoryId: nextFocus.primaryCategoryId || '',
        secondaryCategoryIds: uniqueSecondaryIds,
      },
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
              onClaimWeeklyChallenge={handleClaimWeeklyChallenge}
              onClaimLongTermQuest={handleClaimLongTermQuest}
              onClaimLegendaryQuest={handleClaimLegendaryQuest}
              onClaimMilestone={handleClaimMilestone}
              onToggleHabit={handleToggleHabit}
              onExportData={handleExportData}
              onImportData={handleImportData}
              onResetProgress={handleResetProgress}
              onOpenTutorial={() => setIsTutorialOpen(true)}
              weeklyFocus={appState.weeklyFocus}
              onWeeklyFocusChange={handleWeeklyFocusChange}
              onPurchasePerk={handlePurchasePerk}
              onRerollDailyQuest={handleRerollDailyQuest}
              xpFeedback={xpFeedback}
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

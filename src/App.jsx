import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { OverviewPage, PerksPage, ProjectsPage, QuestJournalPage, RoadPage, SettingsPage, StatsPage } from './components/AppSections';
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

const APP_NAV_ITEMS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/road', label: 'The Road' },
  { to: '/journal', label: 'Quest Journal' },
  { to: '/projects', label: 'Projects' },
  { to: '/stats', label: 'Progress' },
  { to: '/perks', label: 'Perks' },
  { to: '/settings', label: 'Settings' },
];

const PAGE_META = [
  { match: /^\/$/, title: 'Dashboard', subtitle: 'Your overview of the account right now.' },
  { match: /^\/road/, title: 'The Road', subtitle: 'The single best next action, chosen from the full state of the account.' },
  { match: /^\/journal/, title: 'Quest Journal', subtitle: 'Daily missions, weekly trials, and long-arc objectives.' },
  { match: /^\/projects/, title: 'Projects', subtitle: 'Crafts, categories, and individual progression lanes.' },
  { match: /^\/stats/, title: 'Progress', subtitle: 'Radar, milestones, summaries, and account trends.' },
  { match: /^\/perks/, title: 'Perks', subtitle: 'Forge Points and permanent upgrade decisions.' },
  { match: /^\/settings/, title: 'Settings', subtitle: 'Utilities, backups, reset, and product help.' },
];

function AppLayout({ children, derived, onOpenSessionModal }) {
  const location = useLocation();
  const currentMeta = PAGE_META.find((entry) => entry.match.test(location.pathname)) || PAGE_META[0];

  return (
    <div className="app-shell app-shell--with-nav">
      <aside className="sidebar-shell">
        <Link className="brand-link" to="/">
          <span className="brand-link__mark">TF</span>
          <div>
            <strong>The Forge</strong>
            <span>Personal progression system</span>
          </div>
        </Link>

        <nav className="sidebar-nav" aria-label="Primary">
          {APP_NAV_ITEMS.map((item) => (
            <NavLink key={item.to} className={({ isActive }) => `sidebar-nav__link${isActive ? ' active' : ''}`} to={item.to} end={item.end}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-summary">
          <div className="subpanel subpanel--compact">
            <strong>Mylo Level</strong>
            <p>Level {derived.overallLevelInfo.level} | {derived.overallXp} XP</p>
          </div>
          <div className="subpanel subpanel--compact">
            <strong>Forge Points</strong>
            <p>{derived.forgePoints} available</p>
          </div>
        </div>
      </aside>

      <div className="shell-content">
        <header className="topbar topbar--app">
          <div className="topbar-copy">
            <p className="eyebrow">The Forge</p>
            <h2>{currentMeta.title}</h2>
            <p>{currentMeta.subtitle}</p>
          </div>
          <button className="primary-button" type="button" onClick={onOpenSessionModal}>
            Log Session
          </button>
        </header>

        <nav className="mobile-nav" aria-label="Mobile">
          {APP_NAV_ITEMS.map((item) => (
            <NavLink key={item.to} className={({ isActive }) => `mobile-nav__link${isActive ? ' active' : ''}`} to={item.to} end={item.end}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {children}
      </div>
    </div>
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
    <AppLayout derived={derived} onOpenSessionModal={() => onOpenSessionModal(project.id)}>
      <ProjectDetail
        project={project}
        stats={derived.projectStats[project.id]}
        onBack={() => navigate('/projects')}
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
  const pushFeedback = (label, note) =>
    setXpFeedback({
      label,
      note: appState.ui?.feedbackMode === 'minimal' ? 'Progress updated' : note,
    });

  const openSessionModal = (defaultProjectId = null) => {
    setSessionModalState({ mode: 'create', defaultProjectId, initialValues: null });
  };

  const openRoadSessionModal = (action) => {
    if (!appState.ui?.roadAutoOpenPrefill) {
      openSessionModal(action.projectId || null);
      return;
    }

    setSessionModalState({
      mode: 'create',
      defaultProjectId: action.projectId || null,
      initialValues: {
        projectId: action.projectId,
        durationMinutes: action.durationMinutes || 20,
        tag: action.tag || '',
        note: action.note || '',
        date: derived.todayKey,
      },
    });
  };

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
    pushFeedback(
      `${xpDelta >= 0 ? '+' : ''}${xpDelta} XP`,
      bonusNotes.length ? bonusNotes.join(' | ') : sessionModalState?.mode === 'edit' ? 'Session updated' : 'Session recorded',
    );
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
    pushFeedback(`+${targetQuest.rewardXp} XP | +${targetQuest.rewardPoints} FP`, `Daily quest completed: ${targetQuest.title}`);
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
    pushFeedback(`+${challenge.rewardXp} XP | +${challenge.rewardPoints} FP`, `Weekly challenge cleared: ${challenge.title}`);
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
    pushFeedback(`+${quest.rewardXp} XP | +${quest.rewardPoints} FP`, `Long-term quest completed: ${quest.title}`);
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
    pushFeedback(`+${quest.rewardXp} XP | +${quest.rewardPoints} FP`, `Legendary quest completed: ${quest.title}`);
  };

  const handleClaimUltimateQuest = (questId) => {
    const quest = derived.ultimateQuests.find((entry) => entry.id === questId);
    if (!quest || !quest.complete || quest.claimed) {
      return;
    }

    setAppState((current) => ({
      ...current,
      ultimateQuestClaims: {
        ...current.ultimateQuestClaims,
        [questId]: new Date().toISOString(),
      },
    }));
    pushFeedback(`+${quest.rewardXp} XP | +${quest.rewardPoints} FP`, `Ultimate quest completed: ${quest.title}`);
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
    pushFeedback(`+200 XP | +${milestone.rewardPoints} FP`, `Milestone claimed: ${milestone.title}`);
  };

  const handlePurchasePerk = (perkId) => {
    const perk = PERK_DEFINITIONS.find((entry) => entry.id === perkId);
    const currentLevel = Number(appState.purchasedPerks?.[perkId] || 0);
    if (!perk || currentLevel >= perk.maxLevel) {
      return;
    }

    const nextCost = perk.getCost(currentLevel);
    if (derived.forgePoints < nextCost) {
      return;
    }

    setAppState((current) => ({
      ...current,
      purchasedPerks: {
        ...current.purchasedPerks,
        [perkId]: currentLevel + 1,
      },
    }));
    pushFeedback(`-${nextCost} FP`, `Perk upgraded: ${perk.title} to level ${currentLevel + 1}`);
  };

  const handleExecuteRoadAction = (action) => {
    if (!action) {
      return;
    }

    if (action.executionKind === 'habit' && action.habitId) {
      const habit = derived.habitsToday.find((entry) => entry.id === action.habitId);
      if (habit?.checked) {
        return;
      }
      handleToggleHabit(action.habitId);
      return;
    }

    if (action.executionKind === 'session' && action.projectId) {
      openRoadSessionModal(action);
    }
  };

  const handleRerollRoad = (action) => {
    const todayKey = derived.todayKey;
    const rerollLimit = derived.road.rerollInfo.limit;
    const rerollsUsed = derived.road.rerollInfo.used;

    if (!action || rerollsUsed >= rerollLimit) {
      return;
    }

    setAppState((current) => ({
      ...current,
      roadRerolls: {
        ...current.roadRerolls,
        [todayKey]: (current.roadRerolls?.[todayKey] || 0) + 1,
      },
      roadDismissals: {
        ...current.roadDismissals,
        [todayKey]: [...new Set([...(current.roadDismissals?.[todayKey] || []), action.id])],
      },
    }));
    pushFeedback('Road rerolled', 'A different high-value path has been surfaced.');
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
    pushFeedback('Quest rerolled', `New daily quest: ${replacement.title}`);
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
      pushFeedback(`+${habit.rewardXp} XP`, `Habit completed: ${habit.name}`);
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

      const confirmed = appState.ui?.confirmDestructiveActions
        ? window.confirm('Importing this save will overwrite your current local data. Do you want to continue?')
        : true;
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
    const confirmed = appState.ui?.confirmDestructiveActions
      ? window.confirm(
      'Reset Progress will permanently erase all saved sessions, quests, habits, achievements, notes, and progression from this device. This cannot be undone. Continue?',
        )
      : true;

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
    const confirmed = appState.ui?.confirmDestructiveActions
      ? window.confirm('Delete this session? This will immediately recalculate XP, levels, streaks, quests, and achievements.')
      : true;
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
    pushFeedback(`${xpDelta >= 0 ? '+' : ''}${xpDelta} XP`, 'Session removed and progression recalculated');
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

  const handleUpdatePreference = (key, value) => {
    setAppState((current) => ({
      ...current,
      ui: {
        ...current.ui,
        [key]: value,
      },
    }));
  };

  const handleToggleQuestSection = (sectionKey) => {
    setAppState((current) => ({
      ...current,
      ui: {
        ...current.ui,
        questSections: {
          ...current.ui.questSections,
          [sectionKey]: !current.ui.questSections?.[sectionKey],
        },
      },
    }));
  };

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            <AppLayout derived={derived} onOpenSessionModal={() => openSessionModal()}>
              <OverviewPage derived={derived} onOpenSessionModal={() => openSessionModal()} xpFeedback={xpFeedback} />
            </AppLayout>
          }
        />
        <Route
          path="/road"
          element={
            <AppLayout derived={derived} onOpenSessionModal={() => openSessionModal()}>
              <RoadPage derived={derived} onExecuteAction={handleExecuteRoadAction} onRerollRoad={handleRerollRoad} xpFeedback={xpFeedback} />
            </AppLayout>
          }
        />
        <Route
          path="/journal"
          element={
            <AppLayout derived={derived} onOpenSessionModal={() => openSessionModal()}>
              <QuestJournalPage
                derived={derived}
                uiState={appState.ui}
                onClaimQuest={handleClaimQuest}
                onClaimWeeklyChallenge={handleClaimWeeklyChallenge}
                onClaimLongTermQuest={handleClaimLongTermQuest}
                onClaimLegendaryQuest={handleClaimLegendaryQuest}
                onClaimUltimateQuest={handleClaimUltimateQuest}
                onToggleHabit={handleToggleHabit}
                onRerollDailyQuest={handleRerollDailyQuest}
                onToggleQuestSection={handleToggleQuestSection}
              />
            </AppLayout>
          }
        />
        <Route
          path="/projects"
          element={
            <AppLayout derived={derived} onOpenSessionModal={() => openSessionModal()}>
              <ProjectsPage
                derived={derived}
                projects={PROJECT_DEFINITIONS}
                onSelectProject={(projectId) => navigate(`/projects/${projectId}`)}
                onOpenSessionModal={() => openSessionModal()}
              />
            </AppLayout>
          }
        />
        <Route
          path="/stats"
          element={
            <AppLayout derived={derived} onOpenSessionModal={() => openSessionModal()}>
              <StatsPage
                derived={derived}
                weeklyFocus={appState.weeklyFocus}
                onWeeklyFocusChange={handleWeeklyFocusChange}
                onClaimMilestone={handleClaimMilestone}
              />
            </AppLayout>
          }
        />
        <Route
          path="/perks"
          element={
            <AppLayout derived={derived} onOpenSessionModal={() => openSessionModal()}>
              <PerksPage derived={derived} onPurchasePerk={handlePurchasePerk} />
            </AppLayout>
          }
        />
        <Route
          path="/settings"
          element={
            <AppLayout derived={derived} onOpenSessionModal={() => openSessionModal()}>
              <SettingsPage
                uiState={appState.ui}
                onExportData={handleExportData}
                onImportData={handleImportData}
                onResetProgress={handleResetProgress}
                onOpenTutorial={() => setIsTutorialOpen(true)}
                onUpdatePreference={handleUpdatePreference}
                onToggleQuestSection={handleToggleQuestSection}
              />
            </AppLayout>
          }
        />
        <Route
          path="/projects/:projectId"
          element={
            <ProjectRoute
              derived={derived}
              onOpenSessionModal={(projectId) => openSessionModal(projectId)}
              onEditSession={handleEditSession}
              onDeleteSession={handleDeleteSession}
            />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <SessionModal
        isOpen={Boolean(sessionModalState)}
        isEditing={sessionModalState?.mode === 'edit'}
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

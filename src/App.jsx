import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { DailyRoadPage, OverviewPage, PerksPage, ProjectsPage, QuestJournalPage, RoadPage, SettingsPage, StatsPage } from './components/AppSections';
import { ProjectDetail } from './components/ProjectDetail';
import { SessionModal } from './components/SessionModal';
import { SetupWizardModal } from './components/StructureManager';
import { TutorialModal } from './components/TutorialModal';
import { BUILT_IN_PRESETS, createCustomPresetFromProfile, createFreshAppState, createProfileFromPreset, getPresetById, syncCategoryProjectIds } from './data/seed';
import {
  PERK_DEFINITIONS,
  createSessionRecord,
  deriveAppState,
  getAvailableDailyQuestPool,
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
  { to: '/daily-road', label: 'Daily Road' },
  { to: '/journal', label: 'Quest Journal' },
  { to: '/projects', label: 'Projects' },
  { to: '/stats', label: 'Progress' },
  { to: '/perks', label: 'Perks' },
  { to: '/settings', label: 'Settings' },
];

const PAGE_META = [
  { match: /^\/$/, title: 'Dashboard', subtitle: 'Your overview of the account right now.' },
  { match: /^\/road/, title: 'The Road', subtitle: 'The single best next action, chosen from the full state of the account.' },
  { match: /^\/daily-road/, title: 'Daily Road', subtitle: 'A full optimized path for the whole day.' },
  { match: /^\/journal/, title: 'Quest Journal', subtitle: 'Daily missions, weekly trials, and long-arc objectives.' },
  { match: /^\/projects/, title: 'Projects', subtitle: 'Crafts, categories, and individual progression lanes.' },
  { match: /^\/stats/, title: 'Progress', subtitle: 'Radar, milestones, summaries, and account trends.' },
  { match: /^\/perks/, title: 'Perks', subtitle: 'Forge Points and permanent upgrade decisions.' },
  { match: /^\/settings/, title: 'Settings', subtitle: 'Utilities, backups, reset, and product help.' },
];

function AppLayout({ children, derived, onOpenSessionModal }) {
  const location = useLocation();
  const currentMeta = PAGE_META.find((entry) => entry.match.test(location.pathname)) || PAGE_META[0];
  const profile = derived.structure?.profile;

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = `${currentMeta.title} | The Forge`;

      const description = document.querySelector('meta[name="description"]');
      if (description) {
        description.setAttribute('content', currentMeta.subtitle);
      }
    }

    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  }, [currentMeta.subtitle, currentMeta.title, location.pathname]);

  return (
    <div className="app-shell app-shell--with-nav">
      <aside className="sidebar-shell">
        <Link className="brand-link" to="/">
          <span className="brand-link__mark">TF</span>
          <div>
            <strong>The Forge</strong>
            <span>{profile?.displayName ? `${profile.displayName}'s progression system` : 'Personal progression system'}</span>
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
            <strong>{profile?.levelLabel || 'Forge Level'}</strong>
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
  const project = derived.structure?.projects?.find((entry) => entry.id === projectId);

  if (!project) {
    return <Navigate to="/" replace />;
  }

  return (
    <AppLayout derived={derived} onOpenSessionModal={() => onOpenSessionModal(project.id)}>
      <ProjectDetail
        project={project}
        stats={derived.projectStats[project.id]}
        levelLabel={derived.structure?.profile?.levelLabel || 'Forge Level'}
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
    if (appState.profile?.isConfigured && !appState.ui?.tutorialDismissed) {
      setIsTutorialOpen(true);
    }
  }, [appState.profile?.isConfigured, appState.ui]);

  useEffect(() => {
    if (!xpFeedback) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setXpFeedback(null), 3200);
    return () => window.clearTimeout(timeoutId);
  }, [xpFeedback]);

  const derived = useMemo(() => deriveAppState(appState), [appState]);
  const currentProjects = derived.structure?.projects || [];
  const currentCategories = derived.structure?.categories || [];
  const currentHabits = appState.profile?.habits || [];
  const availablePresets = [...BUILT_IN_PRESETS, ...(appState.customPresets || [])];
  const dedupeById = (items = []) =>
    items.filter((item, index, array) => item?.id && array.findIndex((entry) => entry?.id === item.id) === index);
  const createStateSnapshot = (current, label) => ({
    id: crypto.randomUUID(),
    label,
    createdAt: new Date().toISOString(),
    state: {
      ...current,
      presetSnapshots: [],
    },
  });
  const buildArchivedStructure = (currentProfile, nextProfile) => {
    const nextCategoryIds = new Set((nextProfile.categories || []).map((category) => category.id));
    const nextProjectIds = new Set((nextProfile.projects || []).map((project) => project.id));
    const nextHabitIds = new Set((nextProfile.habits || []).map((habit) => habit.id));

    return {
      archivedCategories: dedupeById([
        ...(currentProfile?.archivedCategories || []),
        ...((currentProfile?.categories || []).filter((category) => !nextCategoryIds.has(category.id))),
      ]),
      archivedProjects: dedupeById([
        ...(currentProfile?.archivedProjects || []),
        ...((currentProfile?.projects || []).filter((project) => !nextProjectIds.has(project.id))),
      ]),
      archivedHabits: dedupeById([
        ...(currentProfile?.archivedHabits || []),
        ...((currentProfile?.habits || []).filter((habit) => !nextHabitIds.has(habit.id))),
      ]),
    };
  };
  const updateProfile = (updater) => {
    setAppState((current) => {
      const nextProfile = updater(current.profile);
      return {
        ...current,
        profile: {
          ...nextProfile,
          categories: syncCategoryProjectIds(nextProfile.categories || [], nextProfile.projects || []),
          updatedAt: new Date().toISOString(),
        },
        weeklyFocus: {
          primaryCategoryId:
            nextProfile.categories?.some((category) => category.id === current.weeklyFocus?.primaryCategoryId)
              ? current.weeklyFocus.primaryCategoryId
              : '',
          secondaryCategoryIds: (current.weeklyFocus?.secondaryCategoryIds || []).filter((categoryId) =>
            nextProfile.categories?.some((category) => category.id === categoryId)),
        },
      };
    });
  };
  const pushFeedback = (label, note) =>
    setXpFeedback({
      label,
      note: appState.ui?.feedbackMode === 'minimal' ? 'Progress updated' : note,
    });
  const updateRoadProgressState = (current) => {
    const todayKey = derived.todayKey;
    const nextCount = (current.roadActionCounts?.[todayKey] || 0) + 1;
    const nextClaims = { ...(current.roadBonusClaims?.[todayKey] || {}) };
    const messages = [];

    if (nextCount >= 3 && !nextClaims['road-3']) {
      nextClaims['road-3'] = new Date().toISOString();
      messages.push('Road chain bonus +24 FP');
    }
    if (nextCount >= 5 && !nextClaims['road-5']) {
      nextClaims['road-5'] = new Date().toISOString();
      messages.push('Road chain bonus +42 FP');
    }

    return {
      nextState: {
        ...current,
        roadActionCounts: {
          ...current.roadActionCounts,
          [todayKey]: nextCount,
        },
        roadBonusClaims: {
          ...current.roadBonusClaims,
          [todayKey]: nextClaims,
        },
      },
      messages,
    };
  };

  const completeDailyRoadStepInState = (current, stepId) => {
    const todayKey = derived.todayKey;
    const currentPlan = current.dailyRoadPlans?.[todayKey];
    if (!currentPlan) {
      return { nextState: current, completedPlan: false };
    }

    const completedStepIds = [...new Set([...(currentPlan.completedStepIds || []), stepId])];
    const completedPlan = completedStepIds.length >= (currentPlan.steps?.length || 0);
    const nextState = {
      ...current,
      dailyRoadPlans: {
        ...current.dailyRoadPlans,
        [todayKey]: {
          ...currentPlan,
          completedStepIds,
        },
      },
      dailyRoadCompletionClaims:
        completedPlan && !current.dailyRoadCompletionClaims?.[todayKey]
          ? {
              ...current.dailyRoadCompletionClaims,
              [todayKey]: new Date().toISOString(),
            }
          : current.dailyRoadCompletionClaims,
    };

    return { nextState, completedPlan };
  };

  const openSessionModal = (defaultProjectId = null) => {
    if (!currentProjects.length) {
      window.alert('Add at least one project in Settings before logging sessions.');
      return;
    }
    setSessionModalState({ mode: 'create', defaultProjectId, initialValues: null });
  };

  const openRoadSessionModal = (action, source = 'road', dailyRoadStepId = null) => {
    if (!appState.ui?.roadAutoOpenPrefill) {
      setSessionModalState({
        mode: 'create',
        source,
        dailyRoadStepId,
        defaultProjectId: action.projectId || null,
        initialValues: null,
      });
      return;
    }

    setSessionModalState({
      mode: 'create',
      source,
      dailyRoadStepId,
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

  const handleCompleteSetup = (profileDraft) => {
    setAppState((current) => ({
      ...current,
      profile: {
        ...profileDraft,
        categories: syncCategoryProjectIds(profileDraft.categories || [], profileDraft.projects || []),
        isConfigured: true,
        updatedAt: new Date().toISOString(),
      },
      ui: {
        ...current.ui,
        ...profileDraft.starterPreferences,
        tutorialDismissed: false,
      },
      weeklyFocus: {
        primaryCategoryId: '',
        secondaryCategoryIds: [],
      },
    }));
    setIsTutorialOpen(true);
    navigate('/');
  };

  const handleDuplicateCurrentPreset = () => {
    const customPreset = createCustomPresetFromProfile(appState.profile, `${appState.profile?.displayName || 'Current'} Custom Preset`);
    setAppState((current) => ({
      ...current,
      customPresets: [customPreset, ...(current.customPresets || [])],
    }));
    pushFeedback('Custom preset saved', `${customPreset.name} is now available in Preset and Setup.`);
  };

  const handleRestoreSnapshot = (snapshotId) => {
    const snapshot = (appState.presetSnapshots || []).find((entry) => entry.id === snapshotId);
    if (!snapshot) {
      return;
    }

    const confirmed = appState.ui?.confirmDestructiveActions
      ? window.confirm('Restoring this snapshot will replace the current local state with the saved backup. Continue?')
      : true;
    if (!confirmed) {
      return;
    }

    setAppState(snapshot.state);
    setSessionModalState(null);
    navigate('/');
  };

  const handleSwitchPreset = (presetId, strategy) => {
    const targetPreset = availablePresets.find((preset) => preset.id === presetId) || getPresetById(presetId);
    if (!targetPreset || targetPreset.id === appState.profile?.presetId) {
      return;
    }

    setAppState((current) => {
      const snapshot = createStateSnapshot(current, `${current.profile?.presetName || 'Current Setup'} before switching to ${targetPreset.name}`);
      const snapshots = [snapshot, ...(current.presetSnapshots || [])].slice(0, 10);
      const targetProfile = createProfileFromPreset(targetPreset.id, {
        preset: targetPreset,
        presetId: targetPreset.id,
        categories: targetPreset.categories,
        projects: targetPreset.projects,
        habits: targetPreset.habits,
        displayName: current.profile?.displayName || targetPreset.profileName,
        levelLabel: targetPreset.levelLabel,
      });

      const nextProfile = {
        ...targetProfile,
        displayName: current.profile?.displayName || targetProfile.displayName,
        presetName: targetPreset.name,
      };
      const archivedStructure = buildArchivedStructure(current.profile, nextProfile);

      if (strategy === 'fresh') {
        const fresh = createFreshAppState();
        return {
          ...fresh,
          profile: {
            ...nextProfile,
            archivedCategories: [],
            archivedProjects: [],
            archivedHabits: [],
          },
          ui: {
            ...fresh.ui,
            ...current.ui,
          },
          customPresets: current.customPresets || [],
          presetSnapshots: snapshots,
        };
      }

      const nextCustomPresets =
        strategy === 'duplicate-and-switch'
          ? [createCustomPresetFromProfile(current.profile, `${current.profile?.displayName || 'Current'} Preset Copy`), ...(current.customPresets || [])]
          : current.customPresets || [];

      return {
        ...current,
        profile: {
          ...nextProfile,
          ...archivedStructure,
        },
        customPresets: nextCustomPresets,
        presetSnapshots: snapshots,
        weeklyFocus: {
          primaryCategoryId:
            nextProfile.categories.some((category) => category.id === current.weeklyFocus?.primaryCategoryId) ? current.weeklyFocus.primaryCategoryId : '',
          secondaryCategoryIds: (current.weeklyFocus?.secondaryCategoryIds || []).filter((categoryId) =>
            nextProfile.categories.some((category) => category.id === categoryId)),
        },
      };
    });

    pushFeedback(
      strategy === 'fresh' ? 'Preset switched fresh' : 'Preset switched safely',
      strategy === 'duplicate-and-switch'
        ? `${targetPreset.name} is now active, and the previous structure was duplicated as a custom preset.`
        : strategy === 'fresh'
          ? `${targetPreset.name} is now active on a fresh progression state. A local snapshot was saved first.`
          : `${targetPreset.name} is now active. Compatible progress was preserved, and a local snapshot was saved first.`,
    );
    navigate('/settings');
  };

  const handleUpdateCategory = (categoryId, patch) => {
    updateProfile((profile) => ({
      ...profile,
      categories: profile.categories.map((category) => (category.id === categoryId ? { ...category, ...patch } : category)),
    }));
  };

  const handleCreateCategory = (category) => {
    if (currentCategories.some((entry) => entry.id === category.id)) {
      window.alert('That category id already exists. Try a different name.');
      return;
    }
    updateProfile((profile) => ({
      ...profile,
      categories: [...profile.categories, { ...category, projectIds: [] }],
    }));
  };

  const handleDeleteCategory = (categoryId) => {
    const hasProjects = currentProjects.some((project) => project.categoryId === categoryId);
    const categoryProjectIds = currentProjects.filter((project) => project.categoryId === categoryId).map((project) => project.id);
    const hasLoggedSessions = appState.sessions.some((session) => categoryProjectIds.includes(session.projectId));
    if (hasProjects || hasLoggedSessions) {
      window.alert('Remove or move projects first. Categories with linked project history cannot be deleted cleanly yet.');
      return;
    }
    updateProfile((profile) => ({
      ...profile,
      categories: profile.categories.filter((category) => category.id !== categoryId),
    }));
  };

  const handleUpdateProject = (projectId, patch) => {
    updateProfile((profile) => ({
      ...profile,
      projects: profile.projects.map((project) => (project.id === projectId ? { ...project, ...patch } : project)),
    }));
  };

  const handleCreateProject = (project) => {
    if (currentProjects.some((entry) => entry.id === project.id)) {
      window.alert('That project id already exists. Try a different name.');
      return;
    }
    updateProfile((profile) => ({
      ...profile,
      projects: [...profile.projects, project],
    }));
  };

  const handleDeleteProject = (projectId) => {
    if (appState.sessions.some((session) => session.projectId === projectId)) {
      window.alert('Projects with logged sessions cannot be deleted yet. Rename or keep them for history integrity.');
      return;
    }
    updateProfile((profile) => ({
      ...profile,
      projects: profile.projects.filter((project) => project.id !== projectId),
    }));
  };

  const handleUpdateHabit = (habitId, patch) => {
    updateProfile((profile) => ({
      ...profile,
      habits: profile.habits.map((habit) => (habit.id === habitId ? { ...habit, ...patch } : habit)),
    }));
  };

  const handleCreateHabit = (habit) => {
    if (currentHabits.some((entry) => entry.id === habit.id)) {
      window.alert('That habit id already exists. Try a different name.');
      return;
    }
    updateProfile((profile) => ({
      ...profile,
      habits: [...profile.habits, habit],
    }));
  };

  const handleDeleteHabit = (habitId) => {
    const hasHistory = Object.values(appState.habitChecks || {}).some((day) => day?.[habitId]);
    if (hasHistory) {
      window.alert('Habits with logged history should be disabled instead of deleted so reward history stays accurate.');
      return;
    }
    updateProfile((profile) => ({
      ...profile,
      habits: profile.habits.filter((habit) => habit.id !== habitId),
    }));
  };

  const handleToggleHabitEnabled = (habitId) => {
    updateProfile((profile) => ({
      ...profile,
      habits: profile.habits.map((habit) => (habit.id === habitId ? { ...habit, enabled: habit.enabled === false ? true : false } : habit)),
    }));
  };

  const handleSaveSession = (payload) => {
    const project = getProjectDefinition(payload.projectId);
    if (!project) {
      window.alert('That project no longer exists in the current setup. Choose a valid project and try again.');
      return;
    }
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

    const extraNotes = [];

    if (sessionModalState?.source === 'road') {
      const roadProgress = updateRoadProgressState(nextState);
      nextState = roadProgress.nextState;
      extraNotes.push(...roadProgress.messages);
    }

    if (sessionModalState?.dailyRoadStepId) {
      const dailyRoadProgress = completeDailyRoadStepInState(nextState, sessionModalState.dailyRoadStepId);
      nextState = dailyRoadProgress.nextState;
      if (dailyRoadProgress.completedPlan) {
        extraNotes.push('Daily Road complete +500 XP | +110 FP');
      }
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
      [...bonusNotes, ...extraNotes].length ? [...bonusNotes, ...extraNotes].join(' | ') : sessionModalState?.mode === 'edit' ? 'Session updated' : 'Session recorded',
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
      const todayHabits = { ...(appState.habitChecks[derived.todayKey] || {}) };
      todayHabits[action.habitId] = new Date().toISOString();
      const roadProgress = updateRoadProgressState({
        ...appState,
        habitChecks: {
          ...appState.habitChecks,
          [derived.todayKey]: todayHabits,
        },
      });
      setAppState(roadProgress.nextState);
      pushFeedback(`+${habit.rewardXp} XP`, ['Habit completed from The Road', ...roadProgress.messages].join(' | '));
      return;
    }

    if (action.executionKind === 'session' && action.projectId) {
      openRoadSessionModal(action, 'road');
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
    const replacement = getAvailableDailyQuestPool().find((quest) => !currentQuestIds.includes(quest.id) && quest.id !== currentQuestId);
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

  const handleEnsureDailyRoad = () => {
    if (appState.dailyRoadPlans?.[derived.todayKey]) {
      return;
    }

    setAppState((current) => ({
      ...current,
      dailyRoadPlans: {
        ...current.dailyRoadPlans,
        [derived.todayKey]: {
          date: derived.todayKey,
          steps: derived.suggestedDailyRoad,
          completedStepIds: [],
          generatedAt: new Date().toISOString(),
        },
      },
    }));
  };

  const handleRerollDailyRoad = () => {
    if (derived.dailyRoad.rerollsUsed >= derived.dailyRoad.rerollLimit) {
      return;
    }

    setAppState((current) => ({
      ...current,
      dailyRoadRerolls: {
        ...current.dailyRoadRerolls,
        [derived.todayKey]: (current.dailyRoadRerolls?.[derived.todayKey] || 0) + 1,
      },
      dailyRoadPlans: {
        ...current.dailyRoadPlans,
        [derived.todayKey]: {
          date: derived.todayKey,
          steps: deriveAppState({
            ...current,
            dailyRoadRerolls: {
              ...current.dailyRoadRerolls,
              [derived.todayKey]: (current.dailyRoadRerolls?.[derived.todayKey] || 0) + 1,
            },
          }).suggestedDailyRoad,
          completedStepIds: [],
          generatedAt: new Date().toISOString(),
        },
      },
    }));
    pushFeedback('Daily Road refreshed', 'A new structured path has been generated for today.');
  };

  const handleCompleteDailyRoadStep = (step) => {
    if (!step) {
      return;
    }

    if (step.executionKind === 'habit' && step.habitId) {
      const habit = derived.habitsToday.find((entry) => entry.id === step.habitId);
      if (habit?.checked) {
        return;
      }
      const todayHabits = { ...(appState.habitChecks[derived.todayKey] || {}) };
      todayHabits[step.habitId] = new Date().toISOString();
      const completed = completeDailyRoadStepInState(
        {
          ...appState,
          habitChecks: {
            ...appState.habitChecks,
            [derived.todayKey]: todayHabits,
          },
        },
        step.id,
      );
      setAppState(completed.nextState);
      pushFeedback(`+${habit.rewardXp} XP`, completed.completedPlan ? 'Daily Road complete +500 XP | +110 FP' : 'Daily Road step completed');
      return;
    }

    if (step.executionKind === 'session' && step.projectId) {
      openRoadSessionModal(step, 'daily-road', step.id);
    }
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
    setIsTutorialOpen(false);
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
          path="/daily-road"
          element={
            <AppLayout derived={derived} onOpenSessionModal={() => openSessionModal()}>
              <DailyRoadPage
                derived={derived}
                onEnsureDailyRoad={handleEnsureDailyRoad}
                onCompleteDailyRoadStep={handleCompleteDailyRoadStep}
                onRerollDailyRoad={handleRerollDailyRoad}
                xpFeedback={xpFeedback}
              />
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
              <ProjectsPage derived={derived} projects={currentProjects} onSelectProject={(projectId) => navigate(`/projects/${projectId}`)} onOpenSessionModal={() => openSessionModal()} />
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
                profile={appState.profile}
                presets={availablePresets}
                snapshots={appState.presetSnapshots}
                onExportData={handleExportData}
                onImportData={handleImportData}
                onResetProgress={handleResetProgress}
                onOpenTutorial={() => setIsTutorialOpen(true)}
                onUpdatePreference={handleUpdatePreference}
                onToggleQuestSection={handleToggleQuestSection}
                onUpdateCategory={handleUpdateCategory}
                onCreateCategory={handleCreateCategory}
                onDeleteCategory={handleDeleteCategory}
                onUpdateProject={handleUpdateProject}
                onCreateProject={handleCreateProject}
                onDeleteProject={handleDeleteProject}
                onUpdateHabit={handleUpdateHabit}
                onCreateHabit={handleCreateHabit}
                onDeleteHabit={handleDeleteHabit}
                onToggleHabitEnabled={handleToggleHabitEnabled}
                onSwitchPreset={handleSwitchPreset}
                onRestoreSnapshot={handleRestoreSnapshot}
                onDuplicateCurrentPreset={handleDuplicateCurrentPreset}
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
        projects={currentProjects}
        categories={currentCategories}
        defaultProjectId={sessionModalState?.defaultProjectId}
        initialValues={sessionModalState?.initialValues}
      />

      <SetupWizardModal isOpen={!appState.profile?.isConfigured} presets={BUILT_IN_PRESETS} onComplete={handleCompleteSetup} />
      <TutorialModal isOpen={isTutorialOpen} onClose={closeTutorial} />
    </>
  );
}

export default App;

import { CATEGORY_DEFINITIONS, HABIT_DEFINITIONS, PROJECT_DEFINITIONS, QUEST_POOL } from '../data/seed';

const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getTodayKey = () => formatDateKey(new Date());

export const formatDisplayDate = (dateString) =>
  new Date(`${dateString}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const addDays = (dateString, amount) => {
  const value = new Date(`${dateString}T00:00:00`);
  value.setDate(value.getDate() + amount);
  return formatDateKey(value);
};

const isConsecutiveDay = (previousDate, currentDate) => addDays(previousDate, 1) === currentDate;

export const calculateBaseXp = (minutes, rate) => {
  const firstSegment = Math.min(minutes, 60);
  const secondSegment = Math.min(Math.max(minutes - 60, 0), 60);
  const thirdSegment = Math.max(minutes - 120, 0);
  const weightedMinutes = firstSegment + secondSegment * 0.75 + thirdSegment * 0.5;
  return Math.round(weightedMinutes * rate);
};

export const getLevelFromXp = (xp) => {
  let level = 1;
  let spentXp = 0;
  let nextRequirement = 120;

  while (xp >= spentXp + nextRequirement) {
    spentXp += nextRequirement;
    level += 1;
    nextRequirement = Math.round(120 + (level - 1) * 55 + Math.pow(level - 1, 1.35) * 12);
  }

  return {
    level,
    currentLevelXp: xp - spentXp,
    xpForNextLevel: nextRequirement,
    progressPercent: clamp(((xp - spentXp) / nextRequirement) * 100, 0, 100),
  };
};

const getProjectMap = () =>
  PROJECT_DEFINITIONS.reduce((accumulator, project) => {
    accumulator[project.id] = project;
    return accumulator;
  }, {});

const getCategoryMap = () =>
  CATEGORY_DEFINITIONS.reduce((accumulator, category) => {
    accumulator[category.id] = category;
    return accumulator;
  }, {});

export const getAchievementDefinitions = (projectName) => [
  { id: 'first-session', label: 'First Session', check: (stats) => stats.sessionCount >= 1 },
  { id: 'five-sessions', label: 'Log 5 Sessions', check: (stats) => stats.sessionCount >= 5 },
  { id: 'ten-sessions', label: 'Log 10 Sessions', check: (stats) => stats.sessionCount >= 10 },
  { id: '120-minutes', label: 'Reach 120 Total Minutes', check: (stats) => stats.totalMinutes >= 120 },
  { id: '300-minutes', label: 'Reach 300 Total Minutes', check: (stats) => stats.totalMinutes >= 300 },
  { id: '500-xp', label: `Earn 500 XP in ${projectName}`, check: (stats) => stats.totalXp >= 500 },
  { id: '1000-xp', label: `Earn 1000 XP in ${projectName}`, check: (stats) => stats.totalXp >= 1000 },
];

const createEmptyProjectStats = () =>
  PROJECT_DEFINITIONS.reduce((accumulator, project) => {
    accumulator[project.id] = {
      projectId: project.id,
      name: project.name,
      categoryId: project.categoryId,
      totalXp: 0,
      totalMinutes: 0,
      sessionCount: 0,
      allSessions: [],
      recentSessions: [],
      tagsUsed: [],
      lastSessionDate: null,
    };
    return accumulator;
  }, {});

export const evaluateSessions = (sessions) => {
  const sortedSessions = [...sessions].sort((left, right) => {
    if (left.date !== right.date) {
      return left.date.localeCompare(right.date);
    }

    return left.createdAt.localeCompare(right.createdAt);
  });

  let streakDays = 0;
  let lastActiveDate = null;
  const dayBonusMap = {};

  return sortedSessions.map((session) => {
    const project = PROJECT_DEFINITIONS.find((entry) => entry.id === session.projectId);
    const baseXp = calculateBaseXp(session.durationMinutes, project.rate);

    if (!dayBonusMap[session.date]) {
      if (lastActiveDate && isConsecutiveDay(lastActiveDate, session.date)) {
        streakDays += 1;
      } else {
        streakDays = 1;
      }

      dayBonusMap[session.date] = clamp((streakDays - 1) * 5, 0, 50);
      lastActiveDate = session.date;
    }

    const streakBonusPercent = dayBonusMap[session.date];
    const finalXp = Math.round(baseXp * (1 + streakBonusPercent / 100));

    return {
      ...session,
      baseXp,
      streakBonusPercent,
      finalXp,
    };
  });
};

const buildTodaySummary = (evaluatedSessions, todayKey) => {
  const sessionsToday = evaluatedSessions.filter((session) => session.date === todayKey);
  const projectMap = getProjectMap();
  const summary = {
    totalSessionsToday: sessionsToday.length,
    totalMinutesToday: 0,
    minutesByProject: {},
    minutesByCategory: {},
    sessionsByProject: {},
    sessionsByCategory: {},
  };

  sessionsToday.forEach((session) => {
    const project = projectMap[session.projectId];
    summary.totalMinutesToday += session.durationMinutes;
    summary.minutesByProject[session.projectId] = (summary.minutesByProject[session.projectId] || 0) + session.durationMinutes;
    summary.minutesByCategory[project.categoryId] = (summary.minutesByCategory[project.categoryId] || 0) + session.durationMinutes;
    summary.sessionsByProject[session.projectId] = (summary.sessionsByProject[session.projectId] || 0) + 1;
    summary.sessionsByCategory[project.categoryId] = (summary.sessionsByCategory[project.categoryId] || 0) + 1;
  });

  return summary;
};

const buildDailyQuests = (todaySummary) => {
  const quests = [];
  const rotationIndex = new Date().getDate() % QUEST_POOL.length;

  for (let offset = 0; offset < 4; offset += 1) {
    quests.push(QUEST_POOL[(rotationIndex + offset) % QUEST_POOL.length]);
  }

  if (!quests.some((quest) => quest.id === 'log-one-session')) {
    quests[0] = QUEST_POOL.find((quest) => quest.id === 'log-one-session');
  }

  return quests.map((quest) => ({
    ...quest,
    complete: quest.evaluate(todaySummary),
    progressText: quest.progressLabel(todaySummary),
  }));
};

const buildHabitList = (habitChecks, todayKey) =>
  HABIT_DEFINITIONS.map((habit) => ({
    ...habit,
    checked: Boolean(habitChecks?.[todayKey]?.[habit.id]),
    completedAt: habitChecks?.[todayKey]?.[habit.id] || null,
  }));

const buildActivityFeed = ({ evaluatedSessions, questClaims, habitChecks, todayQuests }) => {
  const activities = [];

  evaluatedSessions.slice(-8).forEach((session) => {
    activities.push({
      id: `session-${session.id}`,
      type: 'session',
      createdAt: session.createdAt,
      title: `${PROJECT_DEFINITIONS.find((project) => project.id === session.projectId).name} session`,
      details: `${session.durationMinutes} min | +${session.finalXp} XP`,
    });
  });

  Object.entries(questClaims).forEach(([dateKey, claims]) => {
    Object.entries(claims).forEach(([questId, claimedAt]) => {
      const quest = [...QUEST_POOL, ...todayQuests].find((entry) => entry.id === questId);
      if (quest) {
        activities.push({
          id: `quest-${dateKey}-${questId}`,
          type: 'quest',
          createdAt: claimedAt,
          title: 'Quest completed',
          details: `${quest.title} | +${quest.rewardXp} XP`,
        });
      }
    });
  });

  Object.entries(habitChecks).forEach(([dateKey, habits]) => {
    Object.entries(habits).forEach(([habitId, completedAt]) => {
      const habit = HABIT_DEFINITIONS.find((entry) => entry.id === habitId);
      if (habit) {
        activities.push({
          id: `habit-${dateKey}-${habitId}`,
          type: 'habit',
          createdAt: completedAt,
          title: 'Habit completed',
          details: `${habit.name} | +${habit.rewardXp} XP`,
        });
      }
    });
  });

  return activities
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, 10);
};

export const deriveAppState = (state) => {
  const todayKey = getTodayKey();
  const projectMap = getProjectMap();
  const categoryMap = getCategoryMap();
  const evaluatedSessions = evaluateSessions(state.sessions);
  const projectStats = createEmptyProjectStats();

  evaluatedSessions.forEach((session) => {
    const stats = projectStats[session.projectId];
    stats.totalXp += session.finalXp;
    stats.totalMinutes += session.durationMinutes;
    stats.sessionCount += 1;
    stats.lastSessionDate = session.date;
    stats.allSessions.unshift(session);
    stats.recentSessions.unshift(session);

    if (session.tag && !stats.tagsUsed.includes(session.tag)) {
      stats.tagsUsed.push(session.tag);
    }
  });

  Object.values(projectStats).forEach((stats) => {
    stats.recentSessions = stats.recentSessions.slice(0, 6);
    stats.levelInfo = getLevelFromXp(stats.totalXp);
    stats.achievements = getAchievementDefinitions(stats.name).map((achievement) => ({
      ...achievement,
      unlocked: achievement.check(stats),
    }));
  });

  const categoryStats = CATEGORY_DEFINITIONS.map((category) => {
    const projects = category.projectIds.map((projectId) => projectStats[projectId]);
    const totalXp = projects.reduce((sum, project) => sum + project.totalXp, 0);
    const totalMinutes = projects.reduce((sum, project) => sum + project.totalMinutes, 0);
    const sessionCount = projects.reduce((sum, project) => sum + project.sessionCount, 0);

    return {
      ...category,
      projects,
      totalXp,
      totalMinutes,
      sessionCount,
      levelInfo: getLevelFromXp(totalXp),
    };
  });

  const todaySummary = buildTodaySummary(evaluatedSessions, todayKey);
  const dailyQuests = buildDailyQuests(todaySummary).map((quest) => ({
    ...quest,
    claimed: Boolean(state.questClaims?.[todayKey]?.[quest.id]),
  }));

  const habitsToday = buildHabitList(state.habitChecks, todayKey);

  const claimedQuestXp = Object.entries(state.questClaims).reduce((sum, [, claims]) => {
    return (
      sum +
      Object.keys(claims).reduce((claimSum, questId) => {
        const quest = QUEST_POOL.find((entry) => entry.id === questId) || dailyQuests.find((entry) => entry.id === questId);
        return claimSum + (quest?.rewardXp || 0);
      }, 0)
    );
  }, 0);

  const habitXp = Object.entries(state.habitChecks).reduce((sum, [, completedHabits]) => {
    return (
      sum +
      Object.keys(completedHabits).reduce((habitSum, habitId) => {
        const habit = HABIT_DEFINITIONS.find((entry) => entry.id === habitId);
        return habitSum + (habit?.rewardXp || 0);
      }, 0)
    );
  }, 0);

  const totalProjectXp = Object.values(projectStats).reduce((sum, project) => sum + project.totalXp, 0);
  const totalProjectMinutes = Object.values(projectStats).reduce((sum, project) => sum + project.totalMinutes, 0);
  const totalProjectSessions = Object.values(projectStats).reduce((sum, project) => sum + project.sessionCount, 0);
  const bonusXp = claimedQuestXp + habitXp;
  const overallLevelInfo = getLevelFromXp(totalProjectXp + bonusXp);

  const uniqueSessionDates = [...new Set(evaluatedSessions.map((session) => session.date))].sort();
  let activeStreakDays = 0;

  for (let index = uniqueSessionDates.length - 1; index >= 0; index -= 1) {
    const currentDate = uniqueSessionDates[index];
    const nextExpected = addDays(currentDate, 1);

    if (index === uniqueSessionDates.length - 1) {
      if (currentDate !== todayKey && nextExpected !== todayKey) {
        break;
      }
      activeStreakDays = 1;
      continue;
    }

    if (addDays(currentDate, 1) === uniqueSessionDates[index + 1]) {
      activeStreakDays += 1;
    } else {
      break;
    }
  }

  const mostRecentSession = evaluatedSessions[evaluatedSessions.length - 1] || null;

  return {
    todayKey,
    projectMap,
    categoryMap,
    evaluatedSessions,
    projectStats,
    categoryStats,
    dailyQuests,
    habitsToday,
    totalProjectXp,
    totalProjectMinutes,
    totalProjectSessions,
    bonusXp,
    overallXp: totalProjectXp + bonusXp,
    overallLevelInfo,
    todaySummary,
    activeStreakDays,
    activeStreakBonusPercent: clamp((Math.max(activeStreakDays, 1) - 1) * 5, 0, 50),
    mostRecentSession,
    activityFeed: buildActivityFeed({
      evaluatedSessions,
      questClaims: state.questClaims,
      habitChecks: state.habitChecks,
      todayQuests: dailyQuests,
    }),
  };
};

export const createSessionRecord = ({ projectId, durationMinutes, tag, note, date }) => ({
  id: crypto.randomUUID(),
  projectId,
  durationMinutes: Number(durationMinutes),
  tag: tag?.trim() || '',
  note: note?.trim() || '',
  date,
  createdAt: new Date().toISOString(),
});

export const updateSessionRecord = (existingSession, updates) => ({
  ...existingSession,
  projectId: updates.projectId,
  durationMinutes: Number(updates.durationMinutes),
  tag: updates.tag?.trim() || '',
  note: updates.note?.trim() || '',
  date: updates.date,
});

export const getProjectDefinition = (projectId) => PROJECT_DEFINITIONS.find((project) => project.id === projectId);

export const getCategoryDefinition = (categoryId) => CATEGORY_DEFINITIONS.find((category) => category.id === categoryId);

import { CATEGORY_DEFINITIONS, HABIT_DEFINITIONS, PROJECT_DEFINITIONS, QUEST_POOL } from '../data/seed';

const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getTodayKey = () => formatDateKey(new Date());

export const getWeekKey = (dateString = getTodayKey()) => {
  const date = new Date(`${dateString}T00:00:00`);
  const day = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - day);
  return formatDateKey(date);
};

const getWeekEndKey = (dateString = getTodayKey()) => addDays(getWeekKey(dateString), 6);

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

const subtractDays = (dateString, amount) => addDays(dateString, -amount);

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

export const PERK_DEFINITIONS = [
  {
    id: 'note-crafter',
    title: 'Note Crafter',
    category: 'XP Perks',
    description: 'Boost session XP when you write notes.',
    maxLevel: 4,
    getCost: (level) => 120 + level * 90,
    getCurrentEffect: (level) => `+${level * 3}% note session XP`,
    getNextEffect: (level) => `+${(level + 1) * 3}% note session XP`,
  },
  {
    id: 'music-mastery',
    title: 'Music Mastery',
    category: 'XP Perks',
    description: 'Increase XP from all Music projects.',
    maxLevel: 4,
    getCost: (level) => 150 + level * 110,
    getCurrentEffect: (level) => `+${level * 3}% Music XP`,
    getNextEffect: (level) => `+${(level + 1) * 3}% Music XP`,
  },
  {
    id: 'coding-mastery',
    title: 'Coding Mastery',
    category: 'XP Perks',
    description: 'Increase XP from all Coding projects.',
    maxLevel: 4,
    getCost: (level) => 150 + level * 110,
    getCurrentEffect: (level) => `+${level * 3}% Coding XP`,
    getNextEffect: (level) => `+${(level + 1) * 3}% Coding XP`,
  },
  {
    id: 'quest-ledger',
    title: 'Quest Ledger',
    category: 'Quest Perks',
    description: 'Improve daily quest rewards and rerolls.',
    maxLevel: 3,
    getCost: (level) => 180 + level * 120,
    getCurrentEffect: (level) => `+${level * 10}% Daily quest rewards | +${level} daily rerolls`,
    getNextEffect: (level) => `+${(level + 1) * 10}% Daily quest rewards | +${level + 1} daily rerolls`,
  },
  {
    id: 'trial-contracts',
    title: 'Trial Contracts',
    category: 'Quest Perks',
    description: 'Increase weekly trial rewards.',
    maxLevel: 3,
    getCost: (level) => 220 + level * 140,
    getCurrentEffect: (level) => `+${level * 12}% weekly trial rewards`,
    getNextEffect: (level) => `+${(level + 1) * 12}% weekly trial rewards`,
  },
  {
    id: 'legend-keeper',
    title: 'Legend Keeper',
    category: 'Reward Perks',
    description: 'Increase rewards from deeper quest tiers.',
    maxLevel: 3,
    getCost: (level) => 260 + level * 170,
    getCurrentEffect: (level) => `+${level * 12}% long-term, legendary, and ultimate rewards`,
    getNextEffect: (level) => `+${(level + 1) * 12}% long-term, legendary, and ultimate rewards`,
  },
  {
    id: 'road-instincts',
    title: 'Road Instincts',
    category: 'Road Perks',
    description: 'Increase The Road rerolls and backup paths.',
    maxLevel: 3,
    getCost: (level) => 180 + level * 120,
    getCurrentEffect: (level) => `${2 + level} Road rerolls | ${3 + Math.min(level, 2)} alternates`,
    getNextEffect: (level) => `${3 + level} Road rerolls | ${3 + Math.min(level + 1, 2)} alternates`,
  },
  {
    id: 'momentum-engine',
    title: 'Momentum Engine',
    category: 'Momentum/Streak Perks',
    description: 'Raise the effective momentum ceiling.',
    maxLevel: 2,
    getCost: (level) => 260 + level * 170,
    getCurrentEffect: (level) => `Momentum cap +${level * 5}%`,
    getNextEffect: (level) => `Momentum cap +${(level + 1) * 5}%`,
  },
  {
    id: 'streak-spark',
    title: 'Streak Spark',
    category: 'Momentum/Streak Perks',
    description: 'Add a small extra bonus whenever your streak is active.',
    maxLevel: 3,
    getCost: (level) => 160 + level * 120,
    getCurrentEffect: (level) => `+${level * 2}% extra streak bonus when active`,
    getNextEffect: (level) => `+${(level + 1) * 2}% extra streak bonus when active`,
  },
  {
    id: 'balance-amplifier',
    title: 'Balance Amplifier',
    category: 'Balance Perks',
    description: 'Increase Balanced Week rewards.',
    maxLevel: 4,
    getCost: (level) => 220 + level * 140,
    getCurrentEffect: (level) => `+${level * 80} XP and +${level * 20} FP per Balanced Week`,
    getNextEffect: (level) => `+${(level + 1) * 80} XP and +${(level + 1) * 20} FP per Balanced Week`,
  },
  {
    id: 'habit-catalyst',
    title: 'Habit Catalyst',
    category: 'Utility Perks',
    description: 'Increase habit XP rewards.',
    maxLevel: 3,
    getCost: (level) => 130 + level * 90,
    getCurrentEffect: (level) => `+${level * 10} XP per habit`,
    getNextEffect: (level) => `+${(level + 1) * 10} XP per habit`,
  },
  {
    id: 'forge-magnet',
    title: 'Forge Magnet',
    category: 'Reward Perks',
    description: 'Increase Forge Point payouts from major clears.',
    maxLevel: 3,
    getCost: (level) => 210 + level * 150,
    getCurrentEffect: (level) => `+${level * 10}% Forge Points from milestones and higher-tier clears`,
    getNextEffect: (level) => `+${(level + 1) * 10}% Forge Points from milestones and higher-tier clears`,
  },
];

const getPerkLevel = (purchasedPerks, perkId) => Math.max(0, Number(purchasedPerks?.[perkId] || 0));

const getPerkState = (purchasedPerks = {}) => ({
  noteXpBonusPercent: getPerkLevel(purchasedPerks, 'note-crafter') * 3,
  musicXpBonusPercent: getPerkLevel(purchasedPerks, 'music-mastery') * 3,
  codingXpBonusPercent: getPerkLevel(purchasedPerks, 'coding-mastery') * 3,
  dailyRewardBonusPercent: getPerkLevel(purchasedPerks, 'quest-ledger') * 10,
  extraDailyRerolls: getPerkLevel(purchasedPerks, 'quest-ledger'),
  weeklyRewardBonusPercent: getPerkLevel(purchasedPerks, 'trial-contracts') * 12,
  majorRewardBonusPercent: getPerkLevel(purchasedPerks, 'legend-keeper') * 12,
  roadRerollBonus: getPerkLevel(purchasedPerks, 'road-instincts'),
  roadAlternateBonus: Math.min(getPerkLevel(purchasedPerks, 'road-instincts'), 2),
  momentumCapBonusPercent: getPerkLevel(purchasedPerks, 'momentum-engine') * 5,
  streakBonusExtraPercent: getPerkLevel(purchasedPerks, 'streak-spark') * 2,
  balanceBonusXp: getPerkLevel(purchasedPerks, 'balance-amplifier') * 80,
  balanceBonusPoints: getPerkLevel(purchasedPerks, 'balance-amplifier') * 20,
  habitXpBonusFlat: getPerkLevel(purchasedPerks, 'habit-catalyst') * 10,
  forgePointBonusPercent: getPerkLevel(purchasedPerks, 'forge-magnet') * 10,
});

const scaleReward = (amount, percent) => Math.round(amount * (1 + percent / 100));

const LONG_TERM_QUEST_DEFINITIONS = [
  {
    id: 'bass-10-sessions',
    title: 'Bass Discipline',
    description: 'Log 10 Bass sessions.',
    rewardXp: 1200,
    getProgress: ({ projectStats }) => ({
      current: projectStats.bass.sessionCount,
      target: 10,
      complete: projectStats.bass.sessionCount >= 10,
    }),
  },
  {
    id: 'python-20-sessions',
    title: 'Python Builder',
    description: 'Log 20 Python sessions.',
    rewardXp: 1800,
    getProgress: ({ projectStats }) => ({
      current: projectStats.python.sessionCount,
      target: 20,
      complete: projectStats.python.sessionCount >= 20,
    }),
  },
  {
    id: 'exercise-600-minutes',
    title: 'Exercise Foundation',
    description: 'Spend 600 total minutes on Exercise.',
    rewardXp: 1600,
    getProgress: ({ projectStats }) => ({
      current: projectStats.exercise.totalMinutes,
      target: 600,
      complete: projectStats.exercise.totalMinutes >= 600,
    }),
  },
  {
    id: 'music-2000-xp',
    title: 'Music Tier Rise',
    description: 'Earn 2000 XP in Music.',
    rewardXp: 1800,
    getProgress: ({ categoryStats }) => {
      const music = categoryStats.find((category) => category.id === 'music');
      return {
        current: music.totalXp,
        target: 2000,
        complete: music.totalXp >= 2000,
      };
    },
  },
  {
    id: 'coding-level-5',
    title: 'Coding Level Push',
    description: 'Reach level 5 in Coding.',
    rewardXp: 2200,
    getProgress: ({ categoryStats }) => {
      const coding = categoryStats.find((category) => category.id === 'coding');
      return {
        current: coding.levelInfo.level,
        target: 5,
        complete: coding.levelInfo.level >= 5,
      };
    },
  },
  {
    id: 'momentum-three-categories',
    title: 'Momentum Network',
    description: 'Reach at least +5% momentum in 3 categories.',
    rewardXp: 1400,
    getProgress: ({ categoryMomentum }) => {
      const count = Object.values(categoryMomentum).filter((momentum) => momentum.bonusPercent >= 5).length;
      return {
        current: count,
        target: 3,
        complete: count >= 3,
      };
    },
  },
  {
    id: 'high-momentum-one-category',
    title: 'Momentum Specialist',
    description: 'Reach +15% momentum in one category.',
    rewardXp: 1600,
    getProgress: ({ categoryMomentum }) => {
      const count = Object.values(categoryMomentum).filter((momentum) => momentum.bonusPercent >= 15).length;
      return {
        current: count,
        target: 1,
        complete: count >= 1,
      };
    },
  },
  {
    id: 'balanced-week-three-times',
    title: 'Balanced Architect',
    description: 'Earn Balanced Week 3 times.',
    rewardXp: 2200,
    getProgress: ({ balanceBonusInfo }) => ({
      current: balanceBonusInfo.events.length,
      target: 3,
      complete: balanceBonusInfo.events.length >= 3,
    }),
  },
  {
    id: 'touch-six-categories',
    title: 'Wide Orbit',
    description: 'Be active in all 6 categories over time.',
    rewardXp: 1500,
    getProgress: ({ overallCategoryHistoryCount }) => ({
      current: overallCategoryHistoryCount,
      target: 6,
      complete: overallCategoryHistoryCount >= 6,
    }),
  },
  {
    id: 'complete-daily-quests-12',
    title: 'Quest Runner',
    description: 'Complete 12 daily quests.',
    rewardXp: 1600,
    getProgress: ({ claimedDailyQuestCount }) => ({
      current: claimedDailyQuestCount,
      target: 12,
      complete: claimedDailyQuestCount >= 12,
    }),
  },
  {
    id: 'complete-habits-30',
    title: 'Habit Engine',
    description: 'Complete 30 habits.',
    rewardXp: 1500,
    getProgress: ({ completedHabitCount }) => ({
      current: completedHabitCount,
      target: 30,
      complete: completedHabitCount >= 30,
    }),
  },
  {
    id: 'session-notes-20',
    title: 'Reflection Archive',
    description: 'Add notes to 20 sessions.',
    rewardXp: 1400,
    getProgress: ({ sessionNoteCount }) => ({
      current: sessionNoteCount,
      target: 20,
      complete: sessionNoteCount >= 20,
    }),
  },
];

const LEGENDARY_QUEST_DEFINITIONS = [
  {
    id: 'legend-bass-master',
    title: 'Legendary Bass Mastery',
    description: 'Log 50 Bass sessions and reach Bass level 15.',
    rewardXp: 5000,
    rewardPoints: 320,
    getRequirements: ({ projectStats }) => [
      { label: 'Bass sessions', current: projectStats.bass.sessionCount, target: 50 },
      { label: 'Bass level', current: projectStats.bass.levelInfo.level, target: 15 },
    ],
  },
  {
    id: 'legend-coding-architect',
    title: 'Coding Architect',
    description: 'Log 30 Coding sessions and add notes to 15 of them.',
    rewardXp: 4500,
    rewardPoints: 300,
    getRequirements: ({ categoryStats, codingNotedSessions }) => [
      { label: 'Coding sessions', current: categoryStats.find((category) => category.id === 'coding').sessionCount, target: 30 },
      { label: 'Coding notes', current: codingNotedSessions, target: 15 },
    ],
  },
  {
    id: 'legend-balanced-five',
    title: 'Architect of Balance',
    description: 'Achieve Balanced Week 5 times.',
    rewardXp: 5200,
    rewardPoints: 360,
    getRequirements: ({ balanceBonusInfo }) => [{ label: 'Balanced Weeks', current: balanceBonusInfo.events.length, target: 5 }],
  },
  {
    id: 'legend-quest-runner',
    title: 'Campaign Runner',
    description: 'Complete 40 daily quests and 8 weekly challenges.',
    rewardXp: 4800,
    rewardPoints: 340,
    getRequirements: ({ claimedDailyQuestCount, claimedWeeklyChallengeCount }) => [
      { label: 'Daily quests', current: claimedDailyQuestCount, target: 40 },
      { label: 'Weekly challenges', current: claimedWeeklyChallengeCount, target: 8 },
    ],
  },
];

const ULTIMATE_QUEST_DEFINITIONS = [
  {
    id: 'ultimate-legend-collector',
    title: 'Ultimate | Campaign Collector',
    description: 'Complete 3 Legendary Quests and reach Mylo Level 18.',
    rewardXp: 9000,
    rewardPoints: 700,
    getRequirements: ({ legendaryQuests, overallLevelInfo }) => [
      { label: 'Legendary quests completed', current: legendaryQuests.filter((quest) => quest.claimed).length, target: 3 },
      { label: 'Mylo level', current: overallLevelInfo.level, target: 18 },
    ],
  },
  {
    id: 'ultimate-balanced-empire',
    title: 'Ultimate | Balanced Empire',
    description: 'Earn Balanced Week 10 times and activate 4 categories in the current week.',
    rewardXp: 8200,
    rewardPoints: 640,
    getRequirements: ({ balanceBonusInfo, distinctCategoriesWeek }) => [
      { label: 'Balanced Weeks', current: balanceBonusInfo.events.length, target: 10 },
      { label: 'Current week category spread', current: distinctCategoriesWeek, target: 4 },
    ],
  },
  {
    id: 'ultimate-forge-economy',
    title: 'Ultimate | Economy Engine',
    description: 'Buy 8 perk levels and earn 3000 Forge Points over the lifetime of the account.',
    rewardXp: 8800,
    rewardPoints: 760,
    getRequirements: ({ totalPerkLevels, lifetimeForgePointsEarned }) => [
      { label: 'Perk levels purchased', current: totalPerkLevels, target: 8 },
      { label: 'Lifetime Forge Points earned', current: lifetimeForgePointsEarned, target: 3000 },
    ],
  },
  {
    id: 'ultimate-note-mastery',
    title: 'Ultimate | Chronicle Builder',
    description: 'Write notes on 60 sessions and complete 2 note-based legendary goals.',
    rewardXp: 8600,
    rewardPoints: 680,
    getRequirements: ({ sessionNoteCount, completedLegendaryNoteGoals }) => [
      { label: 'Sessions with notes', current: sessionNoteCount, target: 60 },
      { label: 'Legendary note goals completed', current: completedLegendaryNoteGoals, target: 2 },
    ],
  },
  {
    id: 'ultimate-spectrum',
    title: 'Ultimate | Full Spectrum',
    description: 'Reach level 10 in 4 categories and maintain momentum in 3 of them at once.',
    rewardXp: 9800,
    rewardPoints: 800,
    getRequirements: ({ categoryStats, categoryMomentum }) => [
      {
        label: 'Categories at level 10',
        current: categoryStats.filter((category) => category.levelInfo.level >= 10).length,
        target: 4,
      },
      {
        label: 'Categories with active momentum',
        current: Object.values(categoryMomentum).filter((momentum) => momentum.bonusPercent >= 10).length,
        target: 3,
      },
    ],
  },
];

const WEEKLY_CHALLENGE_POOL = [
  {
    id: 'weekly-primary-five',
    title: 'Forge Trial: Primary Pressure',
    description: 'Complete 5 sessions in your Primary focus this week.',
    rewardXp: 900,
    rewardPoints: 90,
    evaluate: ({ primaryFocusSessionsWeek, hasPrimaryFocus }) => hasPrimaryFocus && primaryFocusSessionsWeek >= 5,
    progress: ({ primaryFocusSessionsWeek, hasPrimaryFocus }) =>
      hasPrimaryFocus ? { current: primaryFocusSessionsWeek, target: 5 } : { current: 0, target: 5, emptyLabel: 'Choose a Primary focus' },
  },
  {
    id: 'weekly-touch-five-categories',
    title: 'Forge Trial: Wide Orbit',
    description: 'Touch 5 categories this week.',
    rewardXp: 950,
    rewardPoints: 95,
    evaluate: ({ distinctCategoriesWeek }) => distinctCategoriesWeek >= 5,
    progress: ({ distinctCategoriesWeek }) => ({ current: distinctCategoriesWeek, target: 5 }),
  },
  {
    id: 'weekly-momentum-two',
    title: 'Forge Trial: Momentum Chain',
    description: 'Maintain momentum in 2 categories this week.',
    rewardXp: 1000,
    rewardPoints: 100,
    evaluate: ({ momentumReadyCategories }) => momentumReadyCategories >= 2,
    progress: ({ momentumReadyCategories }) => ({ current: momentumReadyCategories, target: 2 }),
  },
  {
    id: 'weekly-three-dailies',
    title: 'Forge Trial: Daily Discipline',
    description: 'Complete 3 daily quests this week.',
    rewardXp: 850,
    rewardPoints: 85,
    evaluate: ({ weeklyDailyQuestCount }) => weeklyDailyQuestCount >= 3,
    progress: ({ weeklyDailyQuestCount }) => ({ current: weeklyDailyQuestCount, target: 3 }),
  },
  {
    id: 'weekly-two-noted-sessions',
    title: 'Forge Trial: Reflection Pass',
    description: 'Log 2 sessions with notes this week.',
    rewardXp: 800,
    rewardPoints: 80,
    evaluate: ({ notedSessionsWeek }) => notedSessionsWeek >= 2,
    progress: ({ notedSessionsWeek }) => ({ current: notedSessionsWeek, target: 2 }),
  },
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

export const evaluateSessions = (sessions, purchasedPerks = {}) => {
  const perkState = getPerkState(purchasedPerks);
  const sortedSessions = [...sessions].sort((left, right) => {
    if (left.date !== right.date) {
      return left.date.localeCompare(right.date);
    }

    return left.createdAt.localeCompare(right.createdAt);
  });

  let streakDays = 0;
  let lastActiveDate = null;
  const dayBonusMap = {};
  const categorySessionDates = {};

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
    const categoryDates = [...(categorySessionDates[project.categoryId] || []), session.date];
    categorySessionDates[project.categoryId] = categoryDates;

    const sessionsLast4Days = categoryDates.filter((date) => date >= subtractDays(session.date, 3)).length;
    const sessionsLast7Days = categoryDates.filter((date) => date >= subtractDays(session.date, 6)).length;
    let momentumBonusPercent = 0;

    if (sessionsLast7Days >= 6) {
      momentumBonusPercent = 15;
    } else if (sessionsLast7Days >= 4) {
      momentumBonusPercent = 10;
    } else if (sessionsLast4Days >= 2) {
      momentumBonusPercent = 5;
    }

    momentumBonusPercent = Math.min(momentumBonusPercent + perkState.momentumCapBonusPercent, 15 + perkState.momentumCapBonusPercent);

    let perkBonusPercent = 0;

    if (session.note?.trim()) {
      perkBonusPercent += perkState.noteXpBonusPercent;
    }
    if (project.categoryId === 'music') {
      perkBonusPercent += perkState.musicXpBonusPercent;
    }
    if (project.categoryId === 'coding') {
      perkBonusPercent += perkState.codingXpBonusPercent;
    }

    const focusBonusPercent = session.focusBonusPercent || 0;
    const streakPerkBonusPercent = streakBonusPercent > 0 ? perkState.streakBonusExtraPercent : 0;
    const totalBonusMultiplier =
      1 +
      streakBonusPercent / 100 +
      streakPerkBonusPercent / 100 +
      focusBonusPercent / 100 +
      momentumBonusPercent / 100 +
      perkBonusPercent / 100;
    const finalXp = Math.round(baseXp * totalBonusMultiplier);

    return {
      ...session,
      baseXp,
      streakBonusPercent,
      streakPerkBonusPercent,
      focusBonusPercent,
      momentumBonusPercent,
      perkBonusPercent,
      finalXp,
    };
  });
};

const getBalanceBonusEvents = (evaluatedSessions, todayKey, purchasedPerks = {}) => {
  const perkState = getPerkState(purchasedPerks);
  const uniqueDates = [...new Set(evaluatedSessions.map((session) => session.date))].sort();
  const events = [];
  let previousQualified = false;

  uniqueDates.forEach((date) => {
    const windowStart = subtractDays(date, 6);
    const windowSessions = evaluatedSessions.filter((session) => session.date >= windowStart && session.date <= date);
    const categoryIds = [...new Set(windowSessions.map((session) => getProjectDefinition(session.projectId).categoryId))];
    const qualified = categoryIds.length >= 5;

    if (qualified && !previousQualified) {
      events.push({
        id: `balanced-week-${date}`,
        date,
        rewardXp: 400 + perkState.balanceBonusXp,
        rewardPoints: 80 + perkState.balanceBonusPoints,
        categoryCount: categoryIds.length,
      });
    }

    previousQualified = qualified;
  });

  const currentWindowStart = subtractDays(todayKey, 6);
  const currentWindowSessions = evaluatedSessions.filter((session) => session.date >= currentWindowStart && session.date <= todayKey);
  const currentCategoryIds = [...new Set(currentWindowSessions.map((session) => getProjectDefinition(session.projectId).categoryId))];

  return {
    events,
    currentCategoryCount: currentCategoryIds.length,
    currentCategoryIds,
    isEligibleNow: currentCategoryIds.length >= 5,
    totalXp: events.reduce((sum, event) => sum + event.rewardXp, 0),
    totalPoints: events.reduce((sum, event) => sum + event.rewardPoints, 0),
  };
};

const buildTodaySummary = (evaluatedSessions, todayKey, state) => {
  const sessionsToday = evaluatedSessions.filter((session) => session.date === todayKey);
  const projectMap = getProjectMap();
  const summary = {
    totalSessionsToday: sessionsToday.length,
    totalMinutesToday: 0,
    minutesByProject: {},
    minutesByCategory: {},
    sessionsByProject: {},
    sessionsByCategory: {},
    notesTodayCount: 0,
    distinctCategoriesToday: 0,
    checkedHabitsToday: Object.keys(state.habitChecks?.[todayKey] || {}).length,
    hasPrimaryFocus: Boolean(state.weeklyFocus?.primaryCategoryId),
    primaryFocusSessionCount: 0,
    secondaryFocusCount: state.weeklyFocus?.secondaryCategoryIds?.filter(Boolean).length || 0,
    touchedSecondaryFocusCount: 0,
  };

  sessionsToday.forEach((session) => {
    const project = projectMap[session.projectId];
    summary.totalMinutesToday += session.durationMinutes;
    summary.minutesByProject[session.projectId] = (summary.minutesByProject[session.projectId] || 0) + session.durationMinutes;
    summary.minutesByCategory[project.categoryId] = (summary.minutesByCategory[project.categoryId] || 0) + session.durationMinutes;
    summary.sessionsByProject[session.projectId] = (summary.sessionsByProject[session.projectId] || 0) + 1;
    summary.sessionsByCategory[project.categoryId] = (summary.sessionsByCategory[project.categoryId] || 0) + 1;

    if (session.note?.trim()) {
      summary.notesTodayCount += 1;
    }
  });

  summary.distinctCategoriesToday = Object.keys(summary.sessionsByCategory).length;
  summary.primaryFocusSessionCount = summary.sessionsByCategory[state.weeklyFocus?.primaryCategoryId] || 0;
  summary.touchedSecondaryFocusCount = (state.weeklyFocus?.secondaryCategoryIds || []).filter(
    (categoryId) => summary.sessionsByCategory[categoryId] >= 1,
  ).length;

  return summary;
};

const buildDailyQuests = (questContext, overrides = {}) => {
  const quests = [];
  const rotationIndex = new Date().getDate() % QUEST_POOL.length;

  for (let offset = 0; offset < 5; offset += 1) {
    quests.push(QUEST_POOL[(rotationIndex + offset) % QUEST_POOL.length]);
  }

  if (!quests.some((quest) => quest.id === 'log-one-session')) {
    quests[0] = QUEST_POOL.find((quest) => quest.id === 'log-one-session');
  }

  const selectedQuests = quests.map((quest, slotIndex) => {
    const overrideId = overrides?.[slotIndex];
    if (!overrideId) {
      return quest;
    }

    return QUEST_POOL.find((entry) => entry.id === overrideId) || quest;
  });

  return selectedQuests.map((quest, slotIndex) => ({
    slotIndex,
    progressText: quest.progressLabel(questContext),
    ...quest,
    rewardPoints: quest.rewardPoints || 25,
    complete: quest.evaluate(questContext),
    progressPercent: (() => {
      const match = quest.progressLabel(questContext).match(/(\d+)\/(\d+)/);
      if (!match) {
        return quest.evaluate(questContext) ? 100 : 0;
      }

      const current = Number(match[1]);
      const target = Number(match[2]);
      return clamp((current / target) * 100, 0, 100);
    })(),
  }));
};

const buildHabitList = (habitChecks, todayKey, perkState) =>
  HABIT_DEFINITIONS.map((habit) => ({
    ...habit,
    rewardXp: habit.rewardXp + (perkState?.habitXpBonusFlat || 0),
    checked: Boolean(habitChecks?.[todayKey]?.[habit.id]),
    completedAt: habitChecks?.[todayKey]?.[habit.id] || null,
  }));

const getActiveDateStreak = (dateList, todayKey) => {
  const uniqueDates = [...new Set(dateList)].sort();
  let streakDays = 0;

  for (let index = uniqueDates.length - 1; index >= 0; index -= 1) {
    const currentDate = uniqueDates[index];
    const nextExpected = addDays(currentDate, 1);

    if (index === uniqueDates.length - 1) {
      if (currentDate !== todayKey && nextExpected !== todayKey) {
        break;
      }
      streakDays = 1;
      continue;
    }

    if (addDays(currentDate, 1) === uniqueDates[index + 1]) {
      streakDays += 1;
    } else {
      break;
    }
  }

  return streakDays;
};

const buildRecommendedActions = ({
  todaySummary,
  categoryMomentum,
  balanceBonusInfo,
  weeklyFocus,
  categoryStats,
  dailyQuests,
  longTermQuests,
  legendaryQuests,
  ultimateQuests,
  weeklyChallenges,
  weeklySummary,
}) => {
  const suggestions = [];
  const primaryCategory = CATEGORY_DEFINITIONS.find((category) => category.id === weeklyFocus?.primaryCategoryId);

  if (balanceBonusInfo.currentCategoryCount === 4) {
    suggestions.push({
      id: 'balance-near',
      title: 'You are 1 category away from Balanced Week',
      body: 'A single session in a new category would secure the +400 XP reward.',
    });
  }

  if (primaryCategory && todaySummary.primaryFocusSessionCount === 0) {
    suggestions.push({
      id: 'primary-missing',
      title: `${primaryCategory.name} has not been touched today`,
      body: 'A quick session there would activate your Primary focus lane.',
    });
  }

  const activeMomentumCategory = categoryStats.find((category) => categoryMomentum[category.id].bonusPercent >= 10);
  if (activeMomentumCategory) {
    suggestions.push({
      id: 'momentum-active',
      title: `${activeMomentumCategory.name} momentum is active`,
      body: `You currently have +${categoryMomentum[activeMomentumCategory.id].bonusPercent}% momentum there. Keep pushing it.`,
    });
  }

  const neglectedCategory = categoryStats.find((category) => categoryMomentum[category.id].sessionsLast7Days === 0);
  if (neglectedCategory) {
    suggestions.push({
      id: 'neglected-category',
      title: `${neglectedCategory.name} has been quiet`,
      body: 'One small session would get that category back into your weekly rotation.',
    });
  }

  if (todaySummary.checkedHabitsToday === 0) {
    suggestions.push({
      id: 'habit-nudge',
      title: 'Completing one habit would move a quest',
      body: 'A quick habit checkoff is an easy way to add XP and build momentum.',
    });
  }

  const nearDailyQuest = dailyQuests.find((quest) => !quest.complete && quest.progressPercent >= 70);
  if (nearDailyQuest) {
    suggestions.push({
      id: `daily-near-${nearDailyQuest.id}`,
      title: `${nearDailyQuest.title} is nearly complete`,
      body: `A small push would finish this daily quest for +${nearDailyQuest.rewardXp} XP.`,
    });
  }

  const nearLongTermQuest = longTermQuests.find((quest) => !quest.complete && quest.progressPercent >= 80);
  if (nearLongTermQuest) {
    suggestions.push({
      id: `long-near-${nearLongTermQuest.id}`,
      title: `${nearLongTermQuest.title} is close`,
      body: `You are ${nearLongTermQuest.progressText} toward a bigger long-term reward.`,
    });
  }

  if (weeklySummary.neglectedCategories?.length) {
    suggestions.push({
      id: 'weekly-neglected',
      title: `${weeklySummary.neglectedCategories.map((category) => category.name).join(' / ')} need attention`,
      body: 'A session there would round out the week and support long-term balance.',
    });
  }

  const nearLegendaryQuest = legendaryQuests.find((quest) => !quest.complete && quest.progressPercent >= 50);
  if (nearLegendaryQuest) {
    suggestions.push({
      id: `legendary-near-${nearLegendaryQuest.id}`,
      title: `${nearLegendaryQuest.title} is advancing`,
      body: 'A few more targeted pushes would move a major campaign objective forward.',
    });
  }

  const nearUltimateQuest = ultimateQuests.find((quest) => !quest.complete && quest.progressPercent >= 35);
  if (nearUltimateQuest) {
    suggestions.push({
      id: `ultimate-near-${nearUltimateQuest.id}`,
      title: `${nearUltimateQuest.title} is now in motion`,
      body: 'A few more aligned clears would move a major account-defining objective forward.',
    });
  }

  const nearWeeklyChallenge = weeklyChallenges.find((challenge) => !challenge.complete && challenge.progressPercent >= 60);
  if (nearWeeklyChallenge) {
    suggestions.push({
      id: `weekly-near-${nearWeeklyChallenge.id}`,
      title: `${nearWeeklyChallenge.title} is within reach`,
      body: `You are ${nearWeeklyChallenge.progressText} toward this week's bigger objective.`,
    });
  }

  return suggestions.slice(0, 5);
};

const buildLongTermQuests = (context) =>
  LONG_TERM_QUEST_DEFINITIONS.map((quest) => {
    const progress = quest.getProgress(context);
    return {
      ...quest,
      rewardXp: scaleReward(quest.rewardXp, context.perkState?.majorRewardBonusPercent || 0),
      rewardPoints: scaleReward(quest.rewardPoints || 120, context.perkState?.forgePointBonusPercent || 0),
      progressText: `${Math.min(progress.current, progress.target)} / ${progress.target}`,
      progressPercent: clamp((progress.current / progress.target) * 100, 0, 100),
      complete: progress.complete,
      current: progress.current,
      target: progress.target,
    };
  });

const buildLegendaryQuests = (context) =>
  LEGENDARY_QUEST_DEFINITIONS.map((quest) => {
    const requirements = quest.getRequirements(context).map((requirement) => ({
      ...requirement,
      progressPercent: clamp((requirement.current / requirement.target) * 100, 0, 100),
      complete: requirement.current >= requirement.target,
    }));
    return {
      ...quest,
      rewardXp: scaleReward(quest.rewardXp, context.perkState?.majorRewardBonusPercent || 0),
      rewardPoints: scaleReward(quest.rewardPoints, context.perkState?.forgePointBonusPercent || 0),
      requirements,
      progressPercent: requirements.reduce((sum, requirement) => sum + requirement.progressPercent, 0) / requirements.length,
      complete: requirements.every((requirement) => requirement.complete),
    };
  });

const buildUltimateQuests = (context) =>
  ULTIMATE_QUEST_DEFINITIONS.map((quest) => {
    const requirements = quest.getRequirements(context).map((requirement) => ({
      ...requirement,
      progressPercent: clamp((requirement.current / requirement.target) * 100, 0, 100),
      complete: requirement.current >= requirement.target,
    }));
    return {
      ...quest,
      rewardXp: scaleReward(quest.rewardXp, context.perkState?.majorRewardBonusPercent || 0),
      rewardPoints: scaleReward(quest.rewardPoints, context.perkState?.forgePointBonusPercent || 0),
      requirements,
      progressPercent: requirements.reduce((sum, requirement) => sum + requirement.progressPercent, 0) / requirements.length,
      complete: requirements.every((requirement) => requirement.complete),
    };
  });

const buildWeeklyChallenges = (context, weekKey) => {
  const selected = [];
  const startIndex = weekKey.split('-').join('').split('').reduce((sum, char) => sum + Number(char), 0) % WEEKLY_CHALLENGE_POOL.length;

  for (let offset = 0; offset < 3; offset += 1) {
    selected.push(WEEKLY_CHALLENGE_POOL[(startIndex + offset) % WEEKLY_CHALLENGE_POOL.length]);
  }

  return selected.map((challenge) => {
    const progress = challenge.progress(context);
    return {
      ...challenge,
      rewardXp: scaleReward(challenge.rewardXp, context.perkState?.weeklyRewardBonusPercent || 0),
      rewardPoints: scaleReward(challenge.rewardPoints || 70, context.perkState?.forgePointBonusPercent || 0),
      progressText: progress.emptyLabel || `${Math.min(progress.current, progress.target)} / ${progress.target}`,
      progressPercent: progress.emptyLabel ? 0 : clamp((progress.current / progress.target) * 100, 0, 100),
      complete: challenge.evaluate(context),
      weekKey,
    };
  });
};

const buildWeeklySummary = ({
  evaluatedSessions,
  todayKey,
  categoryStats,
  projectStats,
  categoryMomentum,
  balanceBonusInfo,
  weeklyDailyQuestCount,
  weeklyHabitCount,
  weeklyChallengeCount,
  forgePointsEarnedThisWeek,
  longTermQuests,
  legendaryQuests,
  buildIdentity,
  activeStreakDays,
}) => {
  const weekStart = subtractDays(todayKey, 6);
  const weeklySessions = evaluatedSessions.filter((session) => session.date >= weekStart && session.date <= todayKey);
  const weeklyXp = weeklySessions.reduce((sum, session) => sum + session.finalXp, 0);
  const sessionsLogged = weeklySessions.length;
  const weeklyMinutesByCategory = {};
  const weeklyMinutesByProject = {};

  weeklySessions.forEach((session) => {
    const project = getProjectDefinition(session.projectId);
    weeklyMinutesByCategory[project.categoryId] = (weeklyMinutesByCategory[project.categoryId] || 0) + session.durationMinutes;
    weeklyMinutesByProject[project.id] = (weeklyMinutesByProject[project.id] || 0) + session.durationMinutes;
  });

  const getTiedIds = (entries, type) => {
    if (!entries.length) {
      return [];
    }
    const values = entries.map((entry) => entry[1]);
    const target = type === 'max' ? Math.max(...values) : Math.min(...values);
    return entries.filter((entry) => entry[1] === target).map((entry) => entry[0]);
  };

  const mostActiveCategoryIds = getTiedIds(Object.entries(weeklyMinutesByCategory), 'max');
  const mostActiveProjectIds = getTiedIds(Object.entries(weeklyMinutesByProject), 'max');
  const neglectedCategoryIds =
    sessionsLogged === 0
      ? []
      : getTiedIds(
          categoryStats.map((category) => [category.id, categoryMomentum[category.id].sessionsLast7Days]),
          'min',
        );

  return {
    weekStart,
    weekEnd: todayKey,
    weeklyXp,
    sessionsLogged,
    forgePointsEarned: forgePointsEarnedThisWeek,
    mostActiveCategories: CATEGORY_DEFINITIONS.filter((category) => mostActiveCategoryIds.includes(category.id)),
    mostActiveProjects: PROJECT_DEFINITIONS.filter((project) => mostActiveProjectIds.includes(project.id)),
    neglectedCategories: CATEGORY_DEFINITIONS.filter((category) => neglectedCategoryIds.includes(category.id)),
    balancedWeekAchieved: balanceBonusInfo.events.some((event) => event.date >= weekStart),
    momentumHighlights: categoryStats
      .filter((category) => categoryMomentum[category.id].bonusPercent >= 10)
      .map((category) => `${category.name} +${categoryMomentum[category.id].bonusPercent}%`),
    dailyQuestsCompleted: weeklyDailyQuestCount,
    habitsCompleted: weeklyHabitCount,
    weeklyChallengesCompleted: weeklyChallengeCount,
    streakHighlights: activeStreakDays ? [`${activeStreakDays} active day streak`] : [],
    longTermQuestHighlights: longTermQuests
      .filter((quest) => !quest.complete && quest.progressPercent >= 70)
      .slice(0, 2)
      .map((quest) => `${quest.title} (${quest.progressText})`),
    legendaryQuestHighlights: legendaryQuests
      .filter((quest) => !quest.complete && quest.progressPercent >= 45)
      .slice(0, 2)
      .map((quest) => `${quest.title} (${Math.round(quest.progressPercent)}%)`),
    buildIdentity,
  };
};

const buildMilestoneHighlights = ({
  categoryStats,
  projectStats,
  balanceBonusInfo,
  categoryMomentum,
  longTermQuests,
  activeStreakBonusPercent,
  weeklyFocus,
  todaySummary,
}) => {
  const highlights = [];

  if (balanceBonusInfo.events.length >= 1) {
    highlights.push({
      id: 'balanced-week-first',
      title: 'Balanced Week unlocked',
      body: 'You have earned the balance reward at least once.',
    });
  }

  const levelProject = Object.values(projectStats).find((project) => project.levelInfo.level >= 5);
  if (levelProject) {
    highlights.push({
      id: 'project-level-5',
      title: `${levelProject.name} reached level ${levelProject.levelInfo.level}`,
      body: 'A project has crossed a meaningful level threshold.',
    });
  }

  const levelCategory = categoryStats.find((category) => category.levelInfo.level >= 4);
  if (levelCategory) {
    highlights.push({
      id: 'category-level-4',
      title: `${levelCategory.name} hit level ${levelCategory.levelInfo.level}`,
      body: 'That category is becoming a real pillar of your account.',
    });
  }

  const momentumCategory = categoryStats.find((category) => categoryMomentum[category.id].bonusPercent >= 15);
  if (momentumCategory) {
    highlights.push({
      id: 'momentum-15',
      title: `${momentumCategory.name} reached peak momentum`,
      body: 'You have pushed one category all the way to +15% momentum.',
    });
  }

  const completedLongTermQuest = longTermQuests.find((quest) => quest.complete);
  if (completedLongTermQuest) {
    highlights.push({
      id: 'long-term-complete',
      title: `${completedLongTermQuest.title} completed`,
      body: 'A long-term quest milestone is now fully completed.',
    });
  }

  if (activeStreakBonusPercent >= 20) {
    highlights.push({
      id: 'streak-milestone',
      title: `Streak bonus at +${activeStreakBonusPercent}%`,
      body: 'Consistency is now contributing a meaningful bonus to session XP.',
    });
  }

  if (weeklyFocus.primaryCategoryId && todaySummary.primaryFocusSessionCount >= 1) {
    const primary = CATEGORY_DEFINITIONS.find((category) => category.id === weeklyFocus.primaryCategoryId);
    highlights.push({
      id: 'focus-followed',
      title: `${primary?.name || 'Primary focus'} followed today`,
      body: 'Your current weekly strategy is being reinforced by real action.',
    });
  }

  return highlights.slice(0, 4);
};

const buildBuildIdentity = ({ weeklyFocus, categoryMomentum, weeklySessionsByCategory, balanceBonusInfo, activeStreakDays }) => {
  const primaryId = weeklyFocus?.primaryCategoryId;
  const categoryEntries = Object.entries(weeklySessionsByCategory);
  const primarySessions = weeklySessionsByCategory[primaryId] || 0;
  const totalSessions = categoryEntries.reduce((sum, [, value]) => sum + value, 0);
  const focusedShare = totalSessions ? primarySessions / totalSessions : 0;
  const momentumCount = Object.values(categoryMomentum).filter((momentum) => momentum.bonusPercent >= 10).length;

  if (focusedShare >= 0.45 && primaryId) {
    const category = CATEGORY_DEFINITIONS.find((entry) => entry.id === primaryId);
    return {
      name: 'Focused Builder',
      label: 'Focus profile',
      reason: `${category?.name || 'Your primary focus'} is carrying a large share of this week's sessions.`,
    };
  }

  if (balanceBonusInfo.currentCategoryCount >= 5) {
    return {
      name: 'Balanced Build',
      label: 'Balance profile',
      reason: 'You are spreading work across many categories and staying eligible for Balanced Week rewards.',
    };
  }

  if (momentumCount >= 2) {
    return {
      name: 'Momentum Build',
      label: 'Momentum profile',
      reason: 'Multiple categories currently have strong momentum bonuses active.',
    };
  }

  if (activeStreakDays >= 5) {
    return {
      name: 'Consistency Build',
      label: 'Consistency profile',
      reason: 'Your current streak is doing real work for the account.',
    };
  }

  return {
    name: 'Climber',
    label: 'Growth profile',
    reason: 'You are steadily building account power across several systems.',
  };
};

const cloneProjectStats = (projectStats) =>
  Object.fromEntries(
    Object.entries(projectStats).map(([projectId, stats]) => [
      projectId,
      {
        ...stats,
        allSessions: [...stats.allSessions],
        recentSessions: [...stats.recentSessions],
        tagsUsed: [...stats.tagsUsed],
        levelInfo: { ...stats.levelInfo },
      },
    ]),
  );

const cloneCategoryStats = (categoryStats) =>
  categoryStats.map((category) => ({
    ...category,
    projects: [...category.projects],
    levelInfo: { ...category.levelInfo },
  }));

const pickProjectForCategory = (categoryId, projectStats) =>
  PROJECT_DEFINITIONS.filter((project) => project.categoryId === categoryId)
    .map((project) => ({ project, stats: projectStats[project.id] }))
    .sort((left, right) => {
      if (left.project.rate !== right.project.rate) {
        return right.project.rate - left.project.rate;
      }

      return left.stats.sessionCount - right.stats.sessionCount;
    })[0]?.project || PROJECT_DEFINITIONS.find((project) => project.categoryId === categoryId);

const suggestSessionTag = (project) => project.tags?.[0] || '';

const getRoadRerollLimit = (perkState) => 2 + (perkState?.roadRerollBonus || 0);

const scoreProgressDelta = (beforeItems, afterItems, completionWeight, progressWeight) =>
  afterItems.reduce((sum, afterItem) => {
    const beforeItem = beforeItems.find((entry) => entry.id === afterItem.id);
    if (!beforeItem) {
      return sum;
    }

    if (!beforeItem.complete && afterItem.complete) {
      return sum + completionWeight;
    }

    const delta = Math.max((afterItem.progressPercent || 0) - (beforeItem.progressPercent || 0), 0);
    return sum + delta * progressWeight;
  }, 0);

const summarizeQuestDelta = (beforeItems, afterItems) =>
  afterItems
    .filter((afterItem) => {
      const beforeItem = beforeItems.find((entry) => entry.id === afterItem.id);
      return beforeItem && !beforeItem.complete && afterItem.complete;
    })
    .map((item) => item.title);

const buildRoadImpactLines = (candidate) => {
  const impact = [];

  if (candidate.estimatedXp) {
    impact.push(`About +${candidate.estimatedXp} XP`);
  }
  if (candidate.projectName) {
    impact.push(`${candidate.projectName}${candidate.durationMinutes ? ` for ${candidate.durationMinutes} min` : ''}`);
  }
  if (candidate.habitName) {
    impact.push(`Completes ${candidate.habitName}`);
  }
  if (candidate.projectedBalanceCount > candidate.currentBalanceCount) {
    impact.push(`Balance window moves to ${candidate.projectedBalanceCount}/5 categories`);
  }
  if (candidate.projectedMomentumBonus > candidate.currentMomentumBonus) {
    impact.push(`Momentum rises to +${candidate.projectedMomentumBonus}%`);
  }
  if (candidate.completedQuestTitles?.length) {
    impact.push(`Could complete: ${candidate.completedQuestTitles.slice(0, 2).join(' / ')}`);
  }

  return impact.slice(0, 4);
};

const buildSessionRoadCandidate = ({
  project,
  durationMinutes,
  tag,
  note,
  type,
  strategicTitle,
  strategicSummary,
  todaySummary,
  dailyQuests,
  dailyQuestOverrides,
  weeklyChallenges,
  longTermQuests,
  legendaryQuests,
  ultimateQuests,
  weeklyFocus,
  categoryMomentum,
  balanceBonusInfo,
  projectStats,
  categoryStats,
  activeStreakBonusPercent,
  categoryStreaks,
  buildIdentity,
  claimedDailyQuestCount,
  claimedWeeklyChallengeCount,
  completedHabitCount,
  sessionNoteCount,
  overallCategoryHistoryCount,
  totalPerkLevels,
  lifetimeForgePointsEarned,
  perkState,
  currentWeekKey,
}) => {
  const category = getCategoryDefinition(project.categoryId);
  const focusBonusPercent = getWeeklyFocusBonusPercent(project.categoryId, weeklyFocus);
  const currentMomentumBonus = categoryMomentum[category.id].bonusPercent;
  const noteBonusPercent = note?.trim() ? perkState.noteXpBonusPercent : 0;
  const categoryPerkBonusPercent =
    (category.id === 'music' ? perkState.musicXpBonusPercent : 0) + (category.id === 'coding' ? perkState.codingXpBonusPercent : 0);
  const totalMultiplier =
    1 +
    (activeStreakBonusPercent + (activeStreakBonusPercent > 0 ? perkState.streakBonusExtraPercent : 0)) / 100 +
    focusBonusPercent / 100 +
    currentMomentumBonus / 100 +
    noteBonusPercent / 100 +
    categoryPerkBonusPercent / 100;
  const estimatedXp = Math.round(calculateBaseXp(durationMinutes, project.rate) * totalMultiplier);
  const projectedTodaySummary = {
    ...todaySummary,
    totalSessionsToday: todaySummary.totalSessionsToday + 1,
    totalMinutesToday: todaySummary.totalMinutesToday + durationMinutes,
    notesTodayCount: todaySummary.notesTodayCount + (note?.trim() ? 1 : 0),
    minutesByProject: {
      ...todaySummary.minutesByProject,
      [project.id]: (todaySummary.minutesByProject[project.id] || 0) + durationMinutes,
    },
    minutesByCategory: {
      ...todaySummary.minutesByCategory,
      [category.id]: (todaySummary.minutesByCategory[category.id] || 0) + durationMinutes,
    },
    sessionsByProject: {
      ...todaySummary.sessionsByProject,
      [project.id]: (todaySummary.sessionsByProject[project.id] || 0) + 1,
    },
    sessionsByCategory: {
      ...todaySummary.sessionsByCategory,
      [category.id]: (todaySummary.sessionsByCategory[category.id] || 0) + 1,
    },
  };
  projectedTodaySummary.distinctCategoriesToday = Object.keys(projectedTodaySummary.sessionsByCategory).length;
  projectedTodaySummary.primaryFocusSessionCount = projectedTodaySummary.sessionsByCategory[weeklyFocus?.primaryCategoryId] || 0;
  projectedTodaySummary.touchedSecondaryFocusCount = (weeklyFocus?.secondaryCategoryIds || []).filter(
    (categoryId) => projectedTodaySummary.sessionsByCategory[categoryId] >= 1,
  ).length;

  const projectedCategoryMomentum = {
    ...categoryMomentum,
    [category.id]: (() => {
      const sessionsLast4Days = categoryMomentum[category.id].sessionsLast4Days + 1;
      const sessionsLast7Days = categoryMomentum[category.id].sessionsLast7Days + 1;
      let bonusPercent = 0;

      if (sessionsLast7Days >= 6) {
        bonusPercent = 15;
      } else if (sessionsLast7Days >= 4) {
        bonusPercent = 10;
      } else if (sessionsLast4Days >= 2) {
        bonusPercent = 5;
      }

      bonusPercent = Math.min(bonusPercent + perkState.momentumCapBonusPercent, 15 + perkState.momentumCapBonusPercent);

      return {
        sessionsLast4Days,
        sessionsLast7Days,
        bonusPercent,
      };
    })(),
  };

  const projectedBalanceCount = balanceBonusInfo.currentCategoryIds.includes(category.id)
    ? balanceBonusInfo.currentCategoryCount
    : balanceBonusInfo.currentCategoryCount + 1;
  const projectedQuestContext = {
    ...projectedTodaySummary,
    balancedWeekCategoryCount: projectedBalanceCount,
    momentumReadyCategories: Object.values(projectedCategoryMomentum).filter((momentum) => momentum.bonusPercent >= 5).length,
    primaryFocusCategoryId: weeklyFocus?.primaryCategoryId || '',
    secondaryFocusIds: weeklyFocus?.secondaryCategoryIds || [],
  };
  const projectedDailyQuests = buildDailyQuests(projectedQuestContext, dailyQuestOverrides).map((quest) => ({
    ...quest,
    rewardXp: scaleReward(quest.rewardXp, perkState.dailyRewardBonusPercent),
    rewardPoints: scaleReward(quest.rewardPoints || 25, perkState.dailyRewardBonusPercent),
  }));

  const projectedProjectStats = cloneProjectStats(projectStats);
  projectedProjectStats[project.id] = {
    ...projectedProjectStats[project.id],
    totalXp: projectedProjectStats[project.id].totalXp + estimatedXp,
    totalMinutes: projectedProjectStats[project.id].totalMinutes + durationMinutes,
    sessionCount: projectedProjectStats[project.id].sessionCount + 1,
  };
  projectedProjectStats[project.id].levelInfo = getLevelFromXp(projectedProjectStats[project.id].totalXp);

  const projectedCategoryStats = cloneCategoryStats(categoryStats).map((entry) => {
    if (entry.id !== category.id) {
      return entry;
    }

    const totalXp = entry.totalXp + estimatedXp;
    const totalMinutes = entry.totalMinutes + durationMinutes;
    const sessionCount = entry.sessionCount + 1;

    return {
      ...entry,
      totalXp,
      totalMinutes,
      sessionCount,
      levelInfo: getLevelFromXp(totalXp),
    };
  });

  const projectedWeeklyContext = {
    primaryFocusSessionsWeek:
      (weeklyFocus?.primaryCategoryId === category.id
        ? (todaySummary.sessionsByCategory[category.id] || 0) + 1
        : todaySummary.sessionsByCategory[weeklyFocus?.primaryCategoryId] || 0) + 0,
    hasPrimaryFocus: Boolean(weeklyFocus?.primaryCategoryId),
    distinctCategoriesWeek: projectedBalanceCount,
    momentumReadyCategories: Object.values(projectedCategoryMomentum).filter((momentum) => momentum.bonusPercent >= 5).length,
    weeklyDailyQuestCount: 0,
    notedSessionsWeek: note?.trim() ? 1 : 0,
    perkState,
  };
  const projectedWeeklyChallenges = buildWeeklyChallenges(projectedWeeklyContext, currentWeekKey);

  const projectedLongTermQuests = buildLongTermQuests({
    projectStats: projectedProjectStats,
    categoryStats: projectedCategoryStats,
    categoryMomentum: projectedCategoryMomentum,
    balanceBonusInfo: { ...balanceBonusInfo, currentCategoryCount: projectedBalanceCount },
    overallCategoryHistoryCount:
      overallCategoryHistoryCount + (projectStats[project.id].sessionCount === 0 ? (categoryStats.find((entry) => entry.id === category.id)?.sessionCount ? 0 : 1) : 0),
    claimedDailyQuestCount,
    completedHabitCount,
    sessionNoteCount: sessionNoteCount + (note?.trim() ? 1 : 0),
    perkState,
  });

  const projectedLegendaryQuests = buildLegendaryQuests({
    projectStats: projectedProjectStats,
    categoryStats: projectedCategoryStats,
    balanceBonusInfo: balanceBonusInfo,
    claimedDailyQuestCount,
    claimedWeeklyChallengeCount,
    codingNotedSessions: category.id === 'coding' && note?.trim() ? 1 : 0,
    perkState,
  });

  const projectedUltimateQuests = buildUltimateQuests({
    categoryStats: projectedCategoryStats,
    categoryMomentum: projectedCategoryMomentum,
    balanceBonusInfo,
    legendaryQuests: projectedLegendaryQuests.map((quest) => ({
      ...quest,
      claimed: quest.claimed || quest.complete,
    })),
    overallLevelInfo: getLevelFromXp(
      projectedCategoryStats.reduce((sum, entry) => sum + entry.totalXp, 0) + estimatedXp + balanceBonusInfo.totalXp,
    ),
    distinctCategoriesWeek: projectedBalanceCount,
    totalPerkLevels,
    lifetimeForgePointsEarned,
    sessionNoteCount: sessionNoteCount + (note?.trim() ? 1 : 0),
    completedLegendaryNoteGoals: projectedLegendaryQuests.filter((quest) => quest.complete && /Coding Architect|Campaign Runner/.test(quest.title)).length,
    perkState,
  });

  const reasons = [];
  let score = estimatedXp;

  if (focusBonusPercent) {
    score += focusBonusPercent === 20 ? 90 : 45;
    reasons.push({ label: `Supports ${focusBonusPercent === 20 ? 'Primary' : 'Secondary'} Focus`, weight: focusBonusPercent === 20 ? 90 : 45 });
  }

  if (projectedBalanceCount > balanceBonusInfo.currentCategoryCount) {
    const weight = projectedBalanceCount >= 5 ? 260 : 120;
    score += weight;
    reasons.push({ label: projectedBalanceCount >= 5 ? 'Secures Balanced Week' : 'Advances Balanced Week', weight });
  }

  if (projectedCategoryMomentum[category.id].bonusPercent > currentMomentumBonus) {
    const weight = 110;
    score += weight;
    reasons.push({ label: `Builds ${category.name} momentum`, weight });
  } else if (currentMomentumBonus >= 10) {
    score += 40;
    reasons.push({ label: `Maintains strong ${category.name} momentum`, weight: 40 });
  }

  if (categoryMomentum[category.id].sessionsLast7Days === 0) {
    score += 80;
    reasons.push({ label: `Revives neglected ${category.name}`, weight: 80 });
  }

  if (todaySummary.totalSessionsToday === 0) {
    score += 60;
    reasons.push({ label: 'Supports today’s streak path', weight: 60 });
  }

  if (noteBonusPercent) {
    score += 35;
    reasons.push({ label: 'Benefits from note perk scaling', weight: 35 });
  }

  if (categoryPerkBonusPercent) {
    score += 35;
    reasons.push({ label: 'Benefits from purchased perk bonuses', weight: 35 });
  }

  if (buildIdentity.name === 'Focused Builder' && weeklyFocus?.primaryCategoryId === category.id) {
    score += 35;
    reasons.push({ label: 'Fits your current build identity', weight: 35 });
  }

  if (buildIdentity.name === 'Balanced Build' && !balanceBonusInfo.currentCategoryIds.includes(category.id)) {
    score += 35;
    reasons.push({ label: 'Fits your current balanced build', weight: 35 });
  }

  const dailyQuestScore = scoreProgressDelta(dailyQuests, projectedDailyQuests, 180, 0.8);
  if (dailyQuestScore > 0) {
    score += dailyQuestScore;
    reasons.push({ label: 'Advances daily quests', weight: dailyQuestScore });
  }

  const weeklyChallengeScore = scoreProgressDelta(weeklyChallenges, projectedWeeklyChallenges, 230, 1.2);
  if (weeklyChallengeScore > 0) {
    score += weeklyChallengeScore;
    reasons.push({ label: 'Advances Forge Trials', weight: weeklyChallengeScore });
  }

  const longTermScore = scoreProgressDelta(longTermQuests, projectedLongTermQuests, 260, 0.9);
  if (longTermScore > 0) {
    score += longTermScore;
    reasons.push({ label: 'Moves long-term quests', weight: longTermScore });
  }

  const legendaryScore = scoreProgressDelta(legendaryQuests, projectedLegendaryQuests, 420, 1.2);
  if (legendaryScore > 0) {
    score += legendaryScore;
    reasons.push({ label: 'Progresses legendary goals', weight: legendaryScore });
  }

  const ultimateScore = scoreProgressDelta(ultimateQuests, projectedUltimateQuests, 520, 1.3);
  if (ultimateScore > 0) {
    score += ultimateScore;
    reasons.push({ label: 'Pushes an ultimate objective', weight: ultimateScore });
  }

  const completedQuestTitles = [
    ...summarizeQuestDelta(dailyQuests, projectedDailyQuests),
    ...summarizeQuestDelta(weeklyChallenges, projectedWeeklyChallenges),
    ...summarizeQuestDelta(longTermQuests, projectedLongTermQuests),
    ...summarizeQuestDelta(legendaryQuests, projectedLegendaryQuests),
    ...summarizeQuestDelta(ultimateQuests, projectedUltimateQuests),
  ];

  return {
    id: `${type}-${project.id}-${durationMinutes}-${tag || 'none'}-${category.id}`,
    type,
    executionKind: 'session',
    title: strategicTitle || `${project.name} for ${durationMinutes} minutes`,
    summary: strategicSummary || `${category.name} session${tag ? ` focused on ${tag}` : ''}${note ? ' with a note' : ''}.`,
    score,
    projectId: project.id,
    projectName: project.name,
    categoryId: category.id,
    categoryName: category.name,
    durationMinutes,
    tag,
    note,
    reasons: reasons.sort((left, right) => right.weight - left.weight).slice(0, 5).map((reason) => reason.label),
    completedQuestTitles,
    estimatedXp,
    currentMomentumBonus,
    projectedMomentumBonus: projectedCategoryMomentum[category.id].bonusPercent,
    currentBalanceCount: balanceBonusInfo.currentCategoryCount,
    projectedBalanceCount,
    expectedImpact: buildRoadImpactLines({
      estimatedXp,
      projectName: project.name,
      durationMinutes,
      completedQuestTitles,
      currentMomentumBonus,
      projectedMomentumBonus: projectedCategoryMomentum[category.id].bonusPercent,
      currentBalanceCount: balanceBonusInfo.currentCategoryCount,
      projectedBalanceCount,
    }),
  };
};

const buildHabitRoadCandidate = ({ habit, todaySummary, dailyQuests, buildIdentity, weeklyFocus, perkState }) => {
  const projectedQuestContext = {
    ...todaySummary,
    checkedHabitsToday: todaySummary.checkedHabitsToday + 1,
    primaryFocusCategoryId: weeklyFocus?.primaryCategoryId || '',
    secondaryFocusIds: weeklyFocus?.secondaryCategoryIds || [],
  };
  const projectedDailyQuests = buildDailyQuests(projectedQuestContext).map((quest) => ({
    ...quest,
    rewardXp: scaleReward(quest.rewardXp, perkState.dailyRewardBonusPercent),
    rewardPoints: scaleReward(quest.rewardPoints || 25, perkState.dailyRewardBonusPercent),
  }));
  const dailyQuestScore = scoreProgressDelta(dailyQuests, projectedDailyQuests, 180, 0.8);
  const reasons = [];
  let score = habit.rewardXp + dailyQuestScore;

  if (dailyQuestScore > 0) {
    reasons.push({ label: 'Advances daily quests', weight: dailyQuestScore });
  }

  if (todaySummary.checkedHabitsToday === 0) {
    score += 50;
    reasons.push({ label: 'Gets the first habit clear on the board', weight: 50 });
  }

  if (buildIdentity.name === 'Consistency Build') {
    score += 25;
    reasons.push({ label: 'Fits your current consistency build', weight: 25 });
  }

  return {
    id: `habit-${habit.id}`,
    type: 'habit',
    executionKind: 'habit',
    title: `Complete ${habit.name}`,
    summary: 'A lightweight one-click action that still feeds quests and steady account momentum.',
    score,
    habitId: habit.id,
    habitName: habit.name,
    reasons: reasons.sort((left, right) => right.weight - left.weight).slice(0, 5).map((reason) => reason.label),
    completedQuestTitles: summarizeQuestDelta(dailyQuests, projectedDailyQuests),
    estimatedXp: habit.rewardXp,
    expectedImpact: buildRoadImpactLines({
      estimatedXp: habit.rewardXp,
      habitName: habit.name,
      completedQuestTitles: summarizeQuestDelta(dailyQuests, projectedDailyQuests),
      currentBalanceCount: 0,
      projectedBalanceCount: 0,
      currentMomentumBonus: 0,
      projectedMomentumBonus: 0,
    }),
  };
};

const buildRoadRecommendations = ({
  todayKey,
  todaySummary,
  dailyQuests,
  dailyQuestOverrides,
  weeklyChallenges,
  longTermQuests,
  legendaryQuests,
  ultimateQuests,
  habitsToday,
  weeklyFocus,
  categoryMomentum,
  balanceBonusInfo,
  projectStats,
  categoryStats,
  activeStreakBonusPercent,
  categoryStreaks,
  buildIdentity,
  claimedDailyQuestCount,
  claimedWeeklyChallengeCount,
  completedHabitCount,
  sessionNoteCount,
  overallCategoryHistoryCount,
  totalPerkLevels,
  lifetimeForgePointsEarned,
  perkState,
  roadDismissals,
  roadRerollsUsed,
}) => {
  const currentWeekKey = getWeekKey(todayKey);
  const candidates = [];
  const primaryCategoryId = weeklyFocus?.primaryCategoryId;
  const neglectedCategory = categoryStats.find((category) => categoryMomentum[category.id].sessionsLast7Days === 0);
  const balanceTargetCategoryId = CATEGORY_DEFINITIONS.find((category) => !balanceBonusInfo.currentCategoryIds.includes(category.id))?.id;

  PROJECT_DEFINITIONS.forEach((project) => {
    const categoryId = project.categoryId;
    const tag = suggestSessionTag(project);
    const needsNote = Boolean(
      perkState.noteXpBonusPercent ||
        dailyQuests.some((quest) => quest.id === 'write-a-note' && !quest.complete) ||
        longTermQuests.some((quest) => quest.id === 'session-notes-20' && !quest.complete) ||
        legendaryQuests.some((quest) => quest.id === 'legend-coding-architect' && !quest.complete && categoryId === 'coding'),
    );

    candidates.push(
      buildSessionRoadCandidate({
        project,
        durationMinutes: categoryId === primaryCategoryId ? 25 : 20,
        tag,
        note: needsNote ? 'Road action: note one concrete thing that moved forward.' : '',
        type: 'session',
        todaySummary,
        dailyQuests,
        dailyQuestOverrides,
        weeklyChallenges,
        longTermQuests,
        legendaryQuests,
        ultimateQuests,
        weeklyFocus,
        categoryMomentum,
        balanceBonusInfo,
        projectStats,
        categoryStats,
        activeStreakBonusPercent,
        categoryStreaks,
        buildIdentity,
        claimedDailyQuestCount,
        claimedWeeklyChallengeCount,
        completedHabitCount,
        sessionNoteCount,
        overallCategoryHistoryCount,
        totalPerkLevels,
        lifetimeForgePointsEarned,
        perkState,
        currentWeekKey,
      }),
    );
  });

  if (primaryCategoryId) {
    const project = pickProjectForCategory(primaryCategoryId, projectStats);
    if (project) {
      candidates.push(
        buildSessionRoadCandidate({
          project,
          durationMinutes: 25,
          tag: suggestSessionTag(project),
          note: '',
          type: 'strategy',
          strategicTitle: `Hit your Primary Focus: ${getCategoryDefinition(primaryCategoryId).name}`,
          strategicSummary: 'This is the clearest way to lean into your current weekly build and stack focus value immediately.',
          todaySummary,
          dailyQuests,
          dailyQuestOverrides,
          weeklyChallenges,
          longTermQuests,
          legendaryQuests,
          ultimateQuests,
          weeklyFocus,
          categoryMomentum,
          balanceBonusInfo,
          projectStats,
          categoryStats,
          activeStreakBonusPercent,
          categoryStreaks,
          buildIdentity,
          claimedDailyQuestCount,
          claimedWeeklyChallengeCount,
          completedHabitCount,
          sessionNoteCount,
          overallCategoryHistoryCount,
          totalPerkLevels,
          lifetimeForgePointsEarned,
          perkState,
          currentWeekKey,
        }),
      );
    }
  }

  if (balanceTargetCategoryId) {
    const project = pickProjectForCategory(balanceTargetCategoryId, projectStats);
    if (project) {
      candidates.push(
        buildSessionRoadCandidate({
          project,
          durationMinutes: 20,
          tag: suggestSessionTag(project),
          note: '',
          type: 'strategy',
          strategicTitle: `Open a new lane for Balance: ${getCategoryDefinition(balanceTargetCategoryId).name}`,
          strategicSummary: 'This action is aimed at moving the 7-day balance window toward the next threshold.',
          todaySummary,
          dailyQuests,
          dailyQuestOverrides,
          weeklyChallenges,
          longTermQuests,
          legendaryQuests,
          ultimateQuests,
          weeklyFocus,
          categoryMomentum,
          balanceBonusInfo,
          projectStats,
          categoryStats,
          activeStreakBonusPercent,
          categoryStreaks,
          buildIdentity,
          claimedDailyQuestCount,
          claimedWeeklyChallengeCount,
          completedHabitCount,
          sessionNoteCount,
          overallCategoryHistoryCount,
          totalPerkLevels,
          lifetimeForgePointsEarned,
          perkState,
          currentWeekKey,
        }),
      );
    }
  }

  if (neglectedCategory) {
    const project = pickProjectForCategory(neglectedCategory.id, projectStats);
    if (project) {
      candidates.push(
        buildSessionRoadCandidate({
          project,
          durationMinutes: 20,
          tag: suggestSessionTag(project),
          note: '',
          type: 'strategy',
          strategicTitle: `Revive ${neglectedCategory.name}`,
          strategicSummary: 'A small session here stops drift and keeps the whole account healthier.',
          todaySummary,
          dailyQuests,
          dailyQuestOverrides,
          weeklyChallenges,
          longTermQuests,
          legendaryQuests,
          ultimateQuests,
          weeklyFocus,
          categoryMomentum,
          balanceBonusInfo,
          projectStats,
          categoryStats,
          activeStreakBonusPercent,
          categoryStreaks,
          buildIdentity,
          claimedDailyQuestCount,
          claimedWeeklyChallengeCount,
          completedHabitCount,
          sessionNoteCount,
          overallCategoryHistoryCount,
          totalPerkLevels,
          lifetimeForgePointsEarned,
          perkState,
          currentWeekKey,
        }),
      );
    }
  }

  habitsToday
    .filter((habit) => !habit.checked)
    .forEach((habit) => {
      candidates.push(
        buildHabitRoadCandidate({
          habit,
          todaySummary,
          dailyQuests,
          buildIdentity,
          weeklyFocus,
          perkState,
        }),
      );
    });

  const filteredCandidates = candidates.filter((candidate) => !roadDismissals.includes(candidate.id));
  const candidatePool = filteredCandidates.length ? filteredCandidates : candidates;
  const sorted = candidatePool.sort((left, right) => right.score - left.score);
  const primary = sorted[0] || null;
  const alternates = [];
  const seenKeys = new Set(primary ? [`${primary.type}-${primary.categoryId || primary.habitId || primary.projectId}`] : []);

  sorted.slice(1).forEach((candidate) => {
    const uniquenessKey = `${candidate.type}-${candidate.categoryId || candidate.habitId || candidate.projectId}`;
    if (!seenKeys.has(uniquenessKey) && alternates.length < 3 + (perkState?.roadAlternateBonus || 0)) {
      alternates.push(candidate);
      seenKeys.add(uniquenessKey);
    }
  });

  return {
    primary,
    alternates,
    rerollInfo: {
      used: roadRerollsUsed,
      limit: getRoadRerollLimit(perkState),
    },
  };
};

const buildCurrencyLedger = ({
  dailyQuests,
  questClaims,
  weeklyChallenges,
  weeklyChallengeClaims,
  longTermQuests,
  longTermQuestClaims,
  legendaryQuests,
  legendaryQuestClaims,
  ultimateQuests,
  ultimateQuestClaims,
  milestoneDefinitions,
  milestoneClaims,
  balanceBonusInfo,
  purchasedPerks,
}) => {
  let earnedPoints = 0;
  const rewardEntries = [];

  Object.entries(questClaims).forEach(([dateKey, claims]) => {
    Object.entries(claims).forEach(([questId, claimedAt]) => {
      const quest = dailyQuests.find((entry) => entry.id === questId) || QUEST_POOL.find((entry) => entry.id === questId);
      if (quest) {
        const points = quest.rewardPoints || 25;
        earnedPoints += points;
        rewardEntries.push({ id: `daily-${dateKey}-${questId}`, createdAt: claimedAt, points });
      }
    });
  });

  Object.entries(weeklyChallengeClaims).forEach(([, claims]) => {
    Object.entries(claims).forEach(([challengeId, claimedAt]) => {
      const challenge = weeklyChallenges.find((entry) => entry.id === challengeId);
      if (challenge) {
        earnedPoints += challenge.rewardPoints || 70;
        rewardEntries.push({ id: `weekly-${challengeId}`, createdAt: claimedAt, points: challenge.rewardPoints || 70 });
      }
    });
  });

  Object.entries(longTermQuestClaims).forEach(([questId, claimedAt]) => {
    const quest = longTermQuests.find((entry) => entry.id === questId);
    if (quest) {
      earnedPoints += quest.rewardPoints || 100;
      rewardEntries.push({ id: `long-${questId}`, createdAt: claimedAt, points: quest.rewardPoints || 100 });
    }
  });

  Object.entries(legendaryQuestClaims).forEach(([questId, claimedAt]) => {
    const quest = legendaryQuests.find((entry) => entry.id === questId);
    if (quest) {
      earnedPoints += quest.rewardPoints || 250;
      rewardEntries.push({ id: `legendary-${questId}`, createdAt: claimedAt, points: quest.rewardPoints || 250 });
    }
  });

  Object.entries(ultimateQuestClaims).forEach(([questId, claimedAt]) => {
    const quest = ultimateQuests.find((entry) => entry.id === questId);
    if (quest) {
      earnedPoints += quest.rewardPoints || 500;
      rewardEntries.push({ id: `ultimate-${questId}`, createdAt: claimedAt, points: quest.rewardPoints || 500 });
    }
  });

  Object.entries(milestoneClaims).forEach(([milestoneId, claimedAt]) => {
    const milestone = milestoneDefinitions.find((entry) => entry.id === milestoneId);
    if (milestone) {
      earnedPoints += milestone.rewardPoints;
      rewardEntries.push({ id: `milestone-${milestoneId}`, createdAt: claimedAt, points: milestone.rewardPoints });
    }
  });

  balanceBonusInfo.events.forEach((event) => {
    earnedPoints += event.rewardPoints || 0;
    rewardEntries.push({
      id: event.id,
      createdAt: `${event.date}T23:59:59`,
      points: event.rewardPoints || 0,
    });
  });

  const spentPoints = Object.entries(purchasedPerks).reduce((sum, [perkId, levelValue]) => {
    const perk = PERK_DEFINITIONS.find((entry) => entry.id === perkId);
    const level = Number(levelValue) || 0;
    if (!perk || level <= 0) {
      return sum;
    }

    let perkSpend = 0;
    for (let index = 0; index < level; index += 1) {
      perkSpend += perk.getCost(index);
    }
    return sum + perkSpend;
  }, 0);

  return {
    earnedPoints,
    spentPoints,
    balance: earnedPoints - spentPoints,
    rewardEntries,
  };
};

const buildActivityFeed = ({
  evaluatedSessions,
  questClaims,
  habitChecks,
  todayQuests,
  balanceBonusEvents,
  weeklyChallengeClaims,
  weeklyChallenges,
  longTermQuestClaims,
  longTermQuests,
  legendaryQuestClaims,
  legendaryQuests,
  ultimateQuestClaims,
  ultimateQuests,
  milestoneClaims,
  milestoneHighlights,
  purchasedPerks,
}) => {
  const activities = [];

  evaluatedSessions.slice(-8).forEach((session) => {
    const project = PROJECT_DEFINITIONS.find((entry) => entry.id === session.projectId);
    const category = CATEGORY_DEFINITIONS.find((entry) => entry.id === project.categoryId);
    const bonusBits = [];

    if (session.focusBonusPercent) {
      bonusBits.push(`focus +${session.focusBonusPercent}%`);
    }
    if (session.momentumBonusPercent) {
      bonusBits.push(`momentum +${session.momentumBonusPercent}%`);
    }
    if (session.streakBonusPercent) {
      bonusBits.push(`streak +${session.streakBonusPercent}%`);
    }

    activities.push({
      id: `session-${session.id}`,
      type: 'session',
      createdAt: session.createdAt,
      title: `${project.name} | ${category.name}`,
      details: `${session.durationMinutes} min | +${session.finalXp} XP${bonusBits.length ? ` | ${bonusBits.join(', ')}` : ''}`,
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
          title: `Quest | ${quest.title}`,
          details: `${quest.description || 'Daily mission completed'} | +${quest.rewardXp} XP | +${quest.rewardPoints || 25} FP`,
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
          title: `Habit | ${habit.name}`,
          details: `Daily habit completed | +${habit.rewardXp} XP`,
        });
      }
    });
  });

  balanceBonusEvents.forEach((event) => {
    activities.push({
      id: event.id,
      type: 'balance',
      createdAt: `${event.date}T23:59:59`,
      title: 'Balanced Week',
      details: `${event.categoryCount} categories active in 7 days | +${event.rewardXp} XP | +${event.rewardPoints} FP`,
    });
  });

  Object.entries(weeklyChallengeClaims).forEach(([weekKey, claims]) => {
    Object.entries(claims).forEach(([challengeId, claimedAt]) => {
      const challenge = weeklyChallenges.find((entry) => entry.id === challengeId);
      if (challenge) {
        activities.push({
          id: `weekly-${weekKey}-${challengeId}`,
          type: 'weekly',
          createdAt: claimedAt,
          title: `Weekly Challenge | ${challenge.title}`,
          details: `${challenge.description} | +${challenge.rewardXp} XP | +${challenge.rewardPoints} FP`,
        });
      }
    });
  });

  Object.entries(longTermQuestClaims).forEach(([questId, claimedAt]) => {
    const quest = longTermQuests.find((entry) => entry.id === questId);
    if (quest) {
      activities.push({
        id: `long-term-${questId}`,
        type: 'long-term',
        createdAt: claimedAt,
        title: `Long-Term Quest | ${quest.title}`,
        details: `${quest.description} | +${quest.rewardXp} XP | +${quest.rewardPoints} FP`,
      });
    }
  });

  Object.entries(legendaryQuestClaims).forEach(([questId, claimedAt]) => {
    const quest = legendaryQuests.find((entry) => entry.id === questId);
    if (quest) {
      activities.push({
        id: `legendary-${questId}`,
        type: 'legendary',
        createdAt: claimedAt,
        title: `Legendary Quest | ${quest.title}`,
        details: `${quest.description} | +${quest.rewardXp} XP | +${quest.rewardPoints} FP`,
      });
    }
  });

  Object.entries(ultimateQuestClaims).forEach(([questId, claimedAt]) => {
    const quest = ultimateQuests.find((entry) => entry.id === questId);
    if (quest) {
      activities.push({
        id: `ultimate-${questId}`,
        type: 'ultimate',
        createdAt: claimedAt,
        title: `Ultimate Quest | ${quest.title}`,
        details: `${quest.description} | +${quest.rewardXp} XP | +${quest.rewardPoints} FP`,
      });
    }
  });

  Object.entries(milestoneClaims).forEach(([milestoneId, claimedAt]) => {
    const milestone = milestoneHighlights.find((entry) => entry.id === milestoneId);
    if (milestone) {
      activities.push({
        id: `milestone-${milestoneId}`,
        type: 'milestone',
        createdAt: claimedAt,
        title: `Milestone | ${milestone.title}`,
        details: `${milestone.body} | +200 XP | +${milestone.rewardPoints} FP`,
      });
    }
  });

  return activities
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, 10);
};

export const deriveAppState = (state) => {
  const todayKey = getTodayKey();
  const weekStart = subtractDays(todayKey, 6);
  const currentWeekKey = getWeekKey(todayKey);
  const projectMap = getProjectMap();
  const categoryMap = getCategoryMap();
  const perkState = getPerkState(state.purchasedPerks);
  const evaluatedSessions = evaluateSessions(state.sessions, state.purchasedPerks);
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

  const totalProjectXp = Object.values(projectStats).reduce((sum, project) => sum + project.totalXp, 0);
  const totalProjectMinutes = Object.values(projectStats).reduce((sum, project) => sum + project.totalMinutes, 0);
  const totalProjectSessions = Object.values(projectStats).reduce((sum, project) => sum + project.sessionCount, 0);
  const todaySummary = buildTodaySummary(evaluatedSessions, todayKey, state);
  const balanceBonusInfo = getBalanceBonusEvents(evaluatedSessions, todayKey, state.purchasedPerks);
  const weeklySessions = evaluatedSessions.filter((session) => session.date >= weekStart && session.date <= todayKey);
  const weeklySessionsByCategory = weeklySessions.reduce((accumulator, session) => {
    const categoryId = getProjectDefinition(session.projectId).categoryId;
    accumulator[categoryId] = (accumulator[categoryId] || 0) + 1;
    return accumulator;
  }, {});
  const uniqueSessionDates = [...new Set(evaluatedSessions.map((session) => session.date))];
  const activeStreakDays = getActiveDateStreak(uniqueSessionDates, todayKey);
  const activeStreakBonusPercent = clamp((Math.max(activeStreakDays, 1) - 1) * 5, 0, 50) + (activeStreakDays ? perkState.streakBonusExtraPercent : 0);

  const categoryMomentum = CATEGORY_DEFINITIONS.reduce((accumulator, category) => {
    const categorySessions = evaluatedSessions.filter((session) => getProjectDefinition(session.projectId).categoryId === category.id && session.date >= weekStart && session.date <= todayKey);
    const sessionsLast4Days = categorySessions.filter((session) => session.date >= subtractDays(todayKey, 3)).length;
    const sessionsLast7Days = categorySessions.length;
    let bonusPercent = 0;

    if (sessionsLast7Days >= 6) {
      bonusPercent = 15;
    } else if (sessionsLast7Days >= 4) {
      bonusPercent = 10;
    } else if (sessionsLast4Days >= 2) {
      bonusPercent = 5;
    }

    bonusPercent = Math.min(bonusPercent + perkState.momentumCapBonusPercent, 15 + perkState.momentumCapBonusPercent);

    accumulator[category.id] = {
      bonusPercent,
      sessionsLast4Days,
      sessionsLast7Days,
    };
    return accumulator;
  }, {});

  const categoryStreaks = CATEGORY_DEFINITIONS.reduce((accumulator, category) => {
    const categoryDates = evaluatedSessions
      .filter((session) => getProjectDefinition(session.projectId).categoryId === category.id)
      .map((session) => session.date);
    accumulator[category.id] = getActiveDateStreak(categoryDates, todayKey);
    return accumulator;
  }, {});

  const questContext = {
    ...todaySummary,
    balancedWeekCategoryCount: balanceBonusInfo.currentCategoryCount,
    momentumReadyCategories: Object.values(categoryMomentum).filter((momentum) => momentum.bonusPercent >= 5).length,
    primaryFocusCategoryId: state.weeklyFocus?.primaryCategoryId || '',
    secondaryFocusIds: state.weeklyFocus?.secondaryCategoryIds || [],
  };

  const dailyQuestOverrides = state.dailyQuestOverrides?.[todayKey] || {};
  const rerollLimit = 1 + perkState.extraDailyRerolls;
  const rerollsUsed = state.dailyQuestRerolls?.[todayKey] || 0;
  const dailyQuests = buildDailyQuests(questContext, dailyQuestOverrides).map((quest) => ({
    ...quest,
    rewardXp: scaleReward(quest.rewardXp, perkState.dailyRewardBonusPercent),
    rewardPoints: scaleReward(quest.rewardPoints || 25, perkState.dailyRewardBonusPercent),
    claimed: Boolean(state.questClaims?.[todayKey]?.[quest.id]),
    canReroll: rerollsUsed < rerollLimit,
  }));

  const habitsToday = buildHabitList(state.habitChecks, todayKey, perkState);
  const completedHabitCount = Object.values(state.habitChecks).reduce((sum, completedHabits) => sum + Object.keys(completedHabits).length, 0);
  const weeklyHabitCount = Object.entries(state.habitChecks)
    .filter(([dateKey]) => dateKey >= weekStart && dateKey <= todayKey)
    .reduce((sum, [, completedHabits]) => sum + Object.keys(completedHabits).length, 0);
  const claimedDailyQuestCount = Object.values(state.questClaims).reduce((sum, claims) => sum + Object.keys(claims).length, 0);
  const weeklyDailyQuestCount = Object.entries(state.questClaims)
    .filter(([dateKey]) => dateKey >= weekStart && dateKey <= todayKey)
    .reduce((sum, [, claims]) => sum + Object.keys(claims).length, 0);
  const claimedWeeklyChallengeCount = Object.values(state.weeklyChallengeClaims || {}).reduce((sum, claims) => sum + Object.keys(claims).length, 0);
  const sessionNoteCount = evaluatedSessions.filter((session) => session.note?.trim()).length;
  const overallCategoryHistoryCount = new Set(evaluatedSessions.map((session) => getProjectDefinition(session.projectId).categoryId)).size;
  const codingNotedSessions = evaluatedSessions.filter((session) => getProjectDefinition(session.projectId).categoryId === 'coding' && session.note?.trim()).length;
  const totalPerkLevels = Object.values(state.purchasedPerks || {}).reduce((sum, value) => sum + (Number(value) || 0), 0);
  const buildIdentity = buildBuildIdentity({
    weeklyFocus: state.weeklyFocus,
    categoryMomentum,
    weeklySessionsByCategory,
    balanceBonusInfo,
    activeStreakDays,
  });

  const weeklyContext = {
    primaryFocusSessionsWeek: weeklySessionsByCategory[state.weeklyFocus?.primaryCategoryId] || 0,
    hasPrimaryFocus: Boolean(state.weeklyFocus?.primaryCategoryId),
    distinctCategoriesWeek: Object.keys(weeklySessionsByCategory).length,
    momentumReadyCategories: Object.values(categoryMomentum).filter((momentum) => momentum.bonusPercent >= 5).length,
    weeklyDailyQuestCount,
    notedSessionsWeek: weeklySessions.filter((session) => session.note?.trim()).length,
    perkState,
  };

  const weeklyChallenges = buildWeeklyChallenges(weeklyContext, currentWeekKey).map((challenge) => ({
    ...challenge,
    claimed: Boolean(state.weeklyChallengeClaims?.[currentWeekKey]?.[challenge.id]),
  }));

  const longTermQuests = buildLongTermQuests({
    projectStats,
    categoryStats,
    categoryMomentum,
    balanceBonusInfo,
    overallCategoryHistoryCount,
    claimedDailyQuestCount,
    completedHabitCount,
    sessionNoteCount,
    perkState,
  }).map((quest) => ({
    ...quest,
    claimed: Boolean(state.longTermQuestClaims?.[quest.id]),
  }));

  const legendaryQuests = buildLegendaryQuests({
    projectStats,
    categoryStats,
    balanceBonusInfo,
    claimedDailyQuestCount,
    claimedWeeklyChallengeCount,
    codingNotedSessions,
    perkState,
  }).map((quest) => ({
    ...quest,
    claimed: Boolean(state.legendaryQuestClaims?.[quest.id]),
  }));

  const lifetimeForgePointsEarnedKnown =
    Object.entries(state.questClaims || {}).reduce((sum, [, claims]) => {
      return (
        sum +
        Object.keys(claims).reduce((claimSum, questId) => {
          const quest = dailyQuests.find((entry) => entry.id === questId) || QUEST_POOL.find((entry) => entry.id === questId);
          return claimSum + (quest?.rewardPoints || 0);
        }, 0)
      );
    }, 0) +
    Object.entries(state.weeklyChallengeClaims || {}).reduce((sum, [, claims]) => {
      return (
        sum +
        Object.keys(claims).reduce((claimSum, challengeId) => {
          const challenge = weeklyChallenges.find((entry) => entry.id === challengeId);
          return claimSum + (challenge?.rewardPoints || 0);
        }, 0)
      );
    }, 0) +
    longTermQuests.filter((quest) => quest.claimed).reduce((sum, quest) => sum + (quest.rewardPoints || 0), 0) +
    legendaryQuests.filter((quest) => quest.claimed).reduce((sum, quest) => sum + (quest.rewardPoints || 0), 0) +
    balanceBonusInfo.totalPoints;

  const baseBonusXp =
    Object.entries(state.questClaims).reduce((sum, [, claims]) => {
      return (
        sum +
        Object.keys(claims).reduce((claimSum, questId) => {
          const quest = QUEST_POOL.find((entry) => entry.id === questId) || dailyQuests.find((entry) => entry.id === questId);
          return claimSum + (quest?.rewardXp || 0);
        }, 0)
      );
    }, 0) +
    Object.entries(state.habitChecks).reduce((sum, [, completedHabits]) => {
      return (
        sum +
        Object.keys(completedHabits).reduce((habitSum, habitId) => {
          const habit = habitsToday.find((entry) => entry.id === habitId);
          return habitSum + (habit?.rewardXp || 0);
        }, 0)
      );
    }, 0) +
    balanceBonusInfo.totalXp;

  const provisionalOverallLevelInfo = getLevelFromXp(totalProjectXp + baseBonusXp);
  const ultimateQuests = buildUltimateQuests({
    categoryStats,
    categoryMomentum,
    balanceBonusInfo,
    legendaryQuests,
    overallLevelInfo: provisionalOverallLevelInfo,
    distinctCategoriesWeek: Object.keys(weeklySessionsByCategory).length,
    totalPerkLevels,
    lifetimeForgePointsEarned: lifetimeForgePointsEarnedKnown,
    sessionNoteCount,
    completedLegendaryNoteGoals: legendaryQuests.filter((quest) => quest.claimed && /Coding Architect|Campaign Runner/.test(quest.title)).length,
    perkState,
  }).map((quest) => ({
    ...quest,
    claimed: Boolean(state.ultimateQuestClaims?.[quest.id]),
  }));

  const milestoneDefinitions = buildMilestoneHighlights({
    categoryStats,
    projectStats,
    balanceBonusInfo,
    categoryMomentum,
    longTermQuests,
    activeStreakBonusPercent,
    weeklyFocus: state.weeklyFocus,
    todaySummary,
  }).map((milestone) => ({
    ...milestone,
    rewardPoints: scaleReward(60, perkState.forgePointBonusPercent),
    claimed: Boolean(state.milestoneClaims?.[milestone.id]),
  }));

  const currencyLedger = buildCurrencyLedger({
    dailyQuests,
    questClaims: state.questClaims || {},
    weeklyChallenges,
    weeklyChallengeClaims: state.weeklyChallengeClaims || {},
    longTermQuests,
    longTermQuestClaims: state.longTermQuestClaims || {},
    legendaryQuests,
    legendaryQuestClaims: state.legendaryQuestClaims || {},
    ultimateQuests,
    ultimateQuestClaims: state.ultimateQuestClaims || {},
    milestoneDefinitions,
    milestoneClaims: state.milestoneClaims || {},
    balanceBonusInfo,
    purchasedPerks: state.purchasedPerks || {},
  });

  const perks = PERK_DEFINITIONS.map((perk) => {
    const level = getPerkLevel(state.purchasedPerks, perk.id);
    const maxLevel = perk.maxLevel;
    const nextCost = level < maxLevel ? perk.getCost(level) : null;

    return {
      ...perk,
      level,
      maxLevel,
      currentEffect: perk.getCurrentEffect(level),
      nextEffect: level < maxLevel ? perk.getNextEffect(level) : 'Maxed',
      nextCost,
      affordable: nextCost !== null && currencyLedger.balance >= nextCost,
      purchased: level > 0,
      isMaxed: level >= maxLevel,
    };
  });

  const bonusXp =
    baseBonusXp +
    weeklyChallenges.filter((challenge) => challenge.claimed).reduce((sum, challenge) => sum + challenge.rewardXp, 0) +
    longTermQuests.filter((quest) => quest.claimed).reduce((sum, quest) => sum + quest.rewardXp, 0) +
    legendaryQuests.filter((quest) => quest.claimed).reduce((sum, quest) => sum + quest.rewardXp, 0) +
    ultimateQuests.filter((quest) => quest.claimed).reduce((sum, quest) => sum + quest.rewardXp, 0) +
    milestoneDefinitions.filter((milestone) => milestone.claimed).reduce((sum) => sum + 200, 0);

  const overallXp = totalProjectXp + bonusXp;
  const overallLevelInfo = getLevelFromXp(overallXp);
  const mostRecentSession = evaluatedSessions[evaluatedSessions.length - 1] || null;

  const weeklySummary = buildWeeklySummary({
    evaluatedSessions,
    todayKey,
    categoryStats,
    projectStats,
    categoryMomentum,
    balanceBonusInfo,
    weeklyDailyQuestCount,
    weeklyHabitCount,
    weeklyChallengeCount: Object.keys(state.weeklyChallengeClaims?.[currentWeekKey] || {}).length,
    forgePointsEarnedThisWeek: currencyLedger.rewardEntries
      .filter((entry) => entry.createdAt.slice(0, 10) >= weekStart && entry.createdAt.slice(0, 10) <= todayKey)
      .reduce((sum, entry) => sum + entry.points, 0),
    longTermQuests,
    legendaryQuests,
    buildIdentity,
    activeStreakDays,
  });

  const recommendedActions = buildRecommendedActions({
    todaySummary,
    categoryMomentum,
    balanceBonusInfo,
    weeklyFocus: state.weeklyFocus,
    categoryStats,
    dailyQuests,
    longTermQuests,
    legendaryQuests,
    ultimateQuests,
    weeklyChallenges,
    weeklySummary,
  });

  const roadDismissals = state.roadDismissals?.[todayKey] || [];
  const roadRerollsUsed = state.roadRerolls?.[todayKey] || 0;
  const road = buildRoadRecommendations({
    todayKey,
    todaySummary,
    dailyQuests,
    dailyQuestOverrides,
    weeklyChallenges,
    longTermQuests,
    legendaryQuests,
    ultimateQuests,
    habitsToday,
    weeklyFocus: state.weeklyFocus,
    categoryMomentum,
    balanceBonusInfo,
    projectStats,
    categoryStats,
    activeStreakBonusPercent,
    categoryStreaks,
    buildIdentity,
    claimedDailyQuestCount,
    claimedWeeklyChallengeCount,
    completedHabitCount,
    sessionNoteCount,
    overallCategoryHistoryCount,
    totalPerkLevels,
    lifetimeForgePointsEarned: lifetimeForgePointsEarnedKnown,
    perkState,
    roadDismissals,
    roadRerollsUsed,
  });

  return {
    todayKey,
    projectMap,
    categoryMap,
    evaluatedSessions,
    projectStats,
    categoryStats,
    dailyQuests,
    dailyQuestRerollInfo: { rerollsUsed, rerollLimit },
    weeklyChallenges,
    longTermQuests,
    legendaryQuests,
    ultimateQuests,
    habitsToday,
    totalProjectXp,
    totalProjectMinutes,
    totalProjectSessions,
    bonusXp,
    overallXp,
    overallLevelInfo,
    todaySummary,
    categoryMomentum,
    balanceBonusInfo,
    buildIdentity,
    progressProfile: buildIdentity,
    perks,
    perkState,
    forgePoints: currencyLedger.balance,
    currencyLedger,
    weeklySummary,
    milestoneHighlights: milestoneDefinitions,
    recommendedActions,
    road,
    activeStreakDays,
    categoryStreaks,
    activeStreakBonusPercent,
    mostRecentSession,
    activityFeed: buildActivityFeed({
      evaluatedSessions,
      questClaims: state.questClaims || {},
      habitChecks: state.habitChecks || {},
      todayQuests: dailyQuests,
      balanceBonusEvents: balanceBonusInfo.events,
      weeklyChallengeClaims: state.weeklyChallengeClaims || {},
      weeklyChallenges,
      longTermQuestClaims: state.longTermQuestClaims || {},
      longTermQuests,
      legendaryQuestClaims: state.legendaryQuestClaims || {},
      legendaryQuests,
      ultimateQuestClaims: state.ultimateQuestClaims || {},
      ultimateQuests,
      milestoneClaims: state.milestoneClaims || {},
      milestoneHighlights: milestoneDefinitions,
      purchasedPerks: state.purchasedPerks || {},
    }),
  };
};

export const getWeeklyFocusBonusPercent = (categoryId, weeklyFocus) => {
  if (weeklyFocus?.primaryCategoryId === categoryId) {
    return 20;
  }

  if (weeklyFocus?.secondaryCategoryIds?.includes(categoryId)) {
    return 10;
  }

  return 0;
};

export const createSessionRecord = ({ projectId, durationMinutes, tag, note, date, focusBonusPercent = 0 }) => ({
  id: crypto.randomUUID(),
  projectId,
  durationMinutes: Number(durationMinutes),
  tag: tag?.trim() || '',
  note: note?.trim() || '',
  date,
  focusBonusPercent,
  createdAt: new Date().toISOString(),
});

export const updateSessionRecord = (existingSession, updates) => ({
  ...existingSession,
  projectId: updates.projectId,
  durationMinutes: Number(updates.durationMinutes),
  tag: updates.tag?.trim() || '',
  note: updates.note?.trim() || '',
  date: updates.date,
  focusBonusPercent: updates.focusBonusPercent ?? existingSession.focusBonusPercent ?? 0,
});

export const getProjectDefinition = (projectId) => PROJECT_DEFINITIONS.find((project) => project.id === projectId);

export const getCategoryDefinition = (categoryId) => CATEGORY_DEFINITIONS.find((category) => category.id === categoryId);

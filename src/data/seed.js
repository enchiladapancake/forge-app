export const CATEGORY_DEFINITIONS = [
  {
    id: 'music',
    name: 'Music',
    color: '#f59e0b',
    description: 'Instrument work, ear training, and theory study.',
    projectIds: ['bass', 'violin', 'piano', 'music-theory'],
  },
  {
    id: 'coding',
    name: 'Coding',
    color: '#38bdf8',
    description: 'Programming practice and technical problem solving.',
    projectIds: ['python', 'cpp'],
  },
  {
    id: 'health',
    name: 'Health',
    color: '#34d399',
    description: 'Physical wellbeing, movement, and nutrition.',
    projectIds: ['nutrition', 'exercise'],
  },
  {
    id: 'academics',
    name: 'Academics',
    color: '#a78bfa',
    description: 'Formal study and school work.',
    projectIds: ['school'],
  },
  {
    id: 'language',
    name: 'Language',
    color: '#fb7185',
    description: 'Language acquisition and practice.',
    projectIds: ['italian'],
  },
  {
    id: 'strategy',
    name: 'Strategy',
    color: '#f97316',
    description: 'Deliberate thinking and tactical growth.',
    projectIds: ['chess'],
  },
];

export const PROJECT_DEFINITIONS = [
  { id: 'bass', name: 'Bass', categoryId: 'music', rate: 1.2, tags: ['Technique', 'Songs', 'Exercises'] },
  { id: 'violin', name: 'Violin', categoryId: 'music', rate: 1.1, tags: ['Technique', 'Repertoire', 'Scales'] },
  { id: 'piano', name: 'Piano', categoryId: 'music', rate: 1.1, tags: ['Technique', 'Pieces', 'Sight Reading'] },
  { id: 'music-theory', name: 'Music Theory', categoryId: 'music', rate: 1.0, tags: ['Harmony', 'Ear Training', 'Analysis'] },
  { id: 'python', name: 'Python', categoryId: 'coding', rate: 1.5, tags: ['Scripting', 'Problem Solving', 'Project Work'] },
  { id: 'cpp', name: 'Cpp', categoryId: 'coding', rate: 1.5, tags: ['Algorithms', 'Systems', 'Problem Solving'] },
  { id: 'nutrition', name: 'Nutrition', categoryId: 'health', rate: 0.8, tags: ['Meal Prep', 'Learning', 'Tracking'] },
  { id: 'exercise', name: 'Exercise', categoryId: 'health', rate: 1.3, tags: ['Lifting', 'Cardio', 'Mobility'] },
  { id: 'school', name: 'School', categoryId: 'academics', rate: 1.0, tags: ['Homework', 'Reading', 'Study Session'] },
  { id: 'italian', name: 'Italian', categoryId: 'language', rate: 1.1, tags: ['Vocabulary', 'Speaking', 'Listening'] },
  { id: 'chess', name: 'Chess', categoryId: 'strategy', rate: 1.2, tags: ['Puzzles', 'Games', 'Study'] },
];

export const HABIT_DEFINITIONS = [
  { id: 'read', name: 'Read', rewardXp: 30 },
  { id: 'stretch', name: 'Stretch', rewardXp: 25 },
  { id: 'chess-puzzles', name: 'Chess Puzzles', rewardXp: 35 },
  { id: 'bible-reading', name: 'Bible Reading', rewardXp: 30 },
  { id: 'piano-practice', name: 'Piano Practice', rewardXp: 40 },
  { id: 'bass-practice', name: 'Bass Practice', rewardXp: 40 },
];

export const QUEST_POOL = [
  {
    id: 'log-one-session',
    title: 'Log 1 session today',
    rewardXp: 100,
    evaluate: ({ totalSessionsToday }) => totalSessionsToday >= 1,
    progressLabel: ({ totalSessionsToday }) => `${Math.min(totalSessionsToday, 1)}/1 sessions`,
  },
  {
    id: 'bass-30',
    title: 'Spend 30 minutes on Bass',
    rewardXp: 250,
    evaluate: ({ minutesByProject }) => (minutesByProject.bass || 0) >= 30,
    progressLabel: ({ minutesByProject }) => `${Math.min(minutesByProject.bass || 0, 30)}/30 min`,
  },
  {
    id: 'italian-20',
    title: 'Spend 20 minutes on Italian',
    rewardXp: 250,
    evaluate: ({ minutesByProject }) => (minutesByProject.italian || 0) >= 20,
    progressLabel: ({ minutesByProject }) => `${Math.min(minutesByProject.italian || 0, 20)}/20 min`,
  },
  {
    id: 'exercise-session',
    title: 'Complete 1 Exercise session',
    rewardXp: 250,
    evaluate: ({ sessionsByProject }) => (sessionsByProject.exercise || 0) >= 1,
    progressLabel: ({ sessionsByProject }) => `${Math.min(sessionsByProject.exercise || 0, 1)}/1 sessions`,
  },
  {
    id: 'coding-session',
    title: 'Log any Coding session',
    rewardXp: 250,
    evaluate: ({ sessionsByCategory }) => (sessionsByCategory.coding || 0) >= 1,
    progressLabel: ({ sessionsByCategory }) => `${Math.min(sessionsByCategory.coding || 0, 1)}/1 sessions`,
  },
  {
    id: 'forty-five-focus',
    title: 'Log 45 total focused minutes',
    rewardXp: 250,
    evaluate: ({ totalMinutesToday }) => totalMinutesToday >= 45,
    progressLabel: ({ totalMinutesToday }) => `${Math.min(totalMinutesToday, 45)}/45 min`,
  },
  {
    id: 'music-session',
    title: 'Log any Music session',
    rewardXp: 100,
    evaluate: ({ sessionsByCategory }) => (sessionsByCategory.music || 0) >= 1,
    progressLabel: ({ sessionsByCategory }) => `${Math.min(sessionsByCategory.music || 0, 1)}/1 sessions`,
  },
  {
    id: 'health-25',
    title: 'Spend 25 minutes on Health',
    rewardXp: 250,
    evaluate: ({ minutesByCategory }) => (minutesByCategory.health || 0) >= 25,
    progressLabel: ({ minutesByCategory }) => `${Math.min(minutesByCategory.health || 0, 25)}/25 min`,
  },
];

export const DEFAULT_APP_STATE = {
  sessions: [],
  questClaims: {},
  habitChecks: {},
  ui: {},
};

import { BUILT_IN_PRESETS, DEFAULT_APP_STATE, createFreshAppState, createLegacyMyloProfile, createProfileFromPreset, getPresetById, syncCategoryProjectIds } from '../data/seed';

export const STORAGE_KEY = 'the-forge-state';
const EXPORT_VERSION = 1;
const hasBrowserStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
const resolvePresetName = (presetId, customPresets = [], fallbackName = '') =>
  customPresets.find((preset) => preset.id === presetId)?.name ||
  BUILT_IN_PRESETS.find((preset) => preset.id === presetId)?.name ||
  fallbackName;

export const normalizeState = (parsed = {}) => ({
  ...createFreshAppState(),
  ...parsed,
  profile:
    parsed.profile && typeof parsed.profile === 'object' && Array.isArray(parsed.profile.categories) && Array.isArray(parsed.profile.projects) && Array.isArray(parsed.profile.habits)
      ? parsed.profile.isConfigured === false
        ? {
            ...createFreshAppState().profile,
            ...parsed.profile,
            categories: syncCategoryProjectIds(
              Array.isArray(parsed.profile.categories) ? parsed.profile.categories : [],
              Array.isArray(parsed.profile.projects) ? parsed.profile.projects : [],
            ),
            projects: Array.isArray(parsed.profile.projects) ? parsed.profile.projects : [],
            habits: Array.isArray(parsed.profile.habits) ? parsed.profile.habits : [],
            isConfigured: false,
          }
        : {
            ...createProfileFromPreset(parsed.profile.presetId || getPresetById('mylo-personal').id),
            ...parsed.profile,
            presetName: resolvePresetName(parsed.profile.presetId || 'mylo-personal', Array.isArray(parsed.customPresets) ? parsed.customPresets : [], parsed.profile.presetName),
            projects: Array.isArray(parsed.profile.projects) ? parsed.profile.projects : [],
            categories: syncCategoryProjectIds(
              Array.isArray(parsed.profile.categories) ? parsed.profile.categories : [],
              Array.isArray(parsed.profile.projects) ? parsed.profile.projects : [],
            ),
            habits: Array.isArray(parsed.profile.habits) ? parsed.profile.habits : [],
            isConfigured: true,
            updatedAt: new Date().toISOString(),
          }
      : createLegacyMyloProfile(),
  customPresets: Array.isArray(parsed.customPresets) ? parsed.customPresets : [],
  presetSnapshots: Array.isArray(parsed.presetSnapshots) ? parsed.presetSnapshots : [],
  sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
  questClaims: parsed.questClaims && typeof parsed.questClaims === 'object' ? parsed.questClaims : {},
  weeklyChallengeClaims: parsed.weeklyChallengeClaims && typeof parsed.weeklyChallengeClaims === 'object' ? parsed.weeklyChallengeClaims : {},
  longTermQuestClaims: parsed.longTermQuestClaims && typeof parsed.longTermQuestClaims === 'object' ? parsed.longTermQuestClaims : {},
  legendaryQuestClaims: parsed.legendaryQuestClaims && typeof parsed.legendaryQuestClaims === 'object' ? parsed.legendaryQuestClaims : {},
  milestoneClaims: parsed.milestoneClaims && typeof parsed.milestoneClaims === 'object' ? parsed.milestoneClaims : {},
  habitChecks: parsed.habitChecks && typeof parsed.habitChecks === 'object' ? parsed.habitChecks : {},
  dailyQuestRerolls: parsed.dailyQuestRerolls && typeof parsed.dailyQuestRerolls === 'object' ? parsed.dailyQuestRerolls : {},
  dailyQuestOverrides: parsed.dailyQuestOverrides && typeof parsed.dailyQuestOverrides === 'object' ? parsed.dailyQuestOverrides : {},
  roadRerolls: parsed.roadRerolls && typeof parsed.roadRerolls === 'object' ? parsed.roadRerolls : {},
  roadDismissals: parsed.roadDismissals && typeof parsed.roadDismissals === 'object' ? parsed.roadDismissals : {},
  dailyRoadPlans: parsed.dailyRoadPlans && typeof parsed.dailyRoadPlans === 'object' ? parsed.dailyRoadPlans : {},
  dailyRoadRerolls: parsed.dailyRoadRerolls && typeof parsed.dailyRoadRerolls === 'object' ? parsed.dailyRoadRerolls : {},
  roadActionCounts: parsed.roadActionCounts && typeof parsed.roadActionCounts === 'object' ? parsed.roadActionCounts : {},
  roadBonusClaims: parsed.roadBonusClaims && typeof parsed.roadBonusClaims === 'object' ? parsed.roadBonusClaims : {},
  dailyRoadCompletionClaims:
    parsed.dailyRoadCompletionClaims && typeof parsed.dailyRoadCompletionClaims === 'object' ? parsed.dailyRoadCompletionClaims : {},
  ultimateQuestClaims: parsed.ultimateQuestClaims && typeof parsed.ultimateQuestClaims === 'object' ? parsed.ultimateQuestClaims : {},
  ui:
    parsed.ui && typeof parsed.ui === 'object'
      ? {
          ...createFreshAppState().ui,
          ...parsed.ui,
          questSections:
            parsed.ui.questSections && typeof parsed.ui.questSections === 'object'
              ? {
                  ...createFreshAppState().ui.questSections,
                  ...parsed.ui.questSections,
                }
              : createFreshAppState().ui.questSections,
        }
      : createFreshAppState().ui,
  purchasedPerks:
    parsed.purchasedPerks && typeof parsed.purchasedPerks === 'object'
      ? Object.fromEntries(
          Object.entries(parsed.purchasedPerks).map(([perkId, value]) => [
            perkId,
            typeof value === 'number' ? value : value ? 1 : 0,
          ]),
        )
      : {},
  weeklyFocus:
    parsed.weeklyFocus && typeof parsed.weeklyFocus === 'object'
      ? {
          primaryCategoryId: parsed.weeklyFocus.primaryCategoryId || '',
          secondaryCategoryIds: Array.isArray(parsed.weeklyFocus.secondaryCategoryIds)
            ? parsed.weeklyFocus.secondaryCategoryIds.filter(Boolean).slice(0, 2)
            : [],
        }
      : createFreshAppState().weeklyFocus,
});

export const loadState = () => {
  if (!hasBrowserStorage()) {
    return normalizeState(DEFAULT_APP_STATE);
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return normalizeState(DEFAULT_APP_STATE);
    }

    return normalizeState(JSON.parse(stored));
  } catch (error) {
    return normalizeState(DEFAULT_APP_STATE);
  }
};

export const saveState = (state) => {
  if (!hasBrowserStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    // Swallow storage failures so the UI stays usable in restricted/private contexts.
  }
};

export const resetState = () => {
  if (hasBrowserStorage()) {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      // Ignore local storage removal errors and still return a clean in-memory state.
    }
  }

  return normalizeState(createFreshAppState());
};

export const createExportPayload = () => ({
  app: 'the-forge',
  version: EXPORT_VERSION,
  exportedAt: new Date().toISOString(),
  state: loadState(),
});

export const validateImportPayload = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, message: 'Import failed: file is not valid JSON data.' };
  }

  if (payload.app !== 'the-forge' || typeof payload.version !== 'number' || !payload.state) {
    return { valid: false, message: 'Import failed: this file is not a valid The Forge save export.' };
  }

  const { state } = payload;
  if (!Array.isArray(state.sessions) || typeof state.questClaims !== 'object' || typeof state.habitChecks !== 'object') {
    return { valid: false, message: 'Import failed: save data is missing required fields.' };
  }

  return {
    valid: true,
    state: normalizeState(state),
  };
};

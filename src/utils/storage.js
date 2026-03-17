import { DEFAULT_APP_STATE } from '../data/seed';

export const STORAGE_KEY = 'the-forge-state';
const EXPORT_VERSION = 1;

export const normalizeState = (parsed = {}) => ({
  ...DEFAULT_APP_STATE,
  ...parsed,
  sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
  questClaims: parsed.questClaims && typeof parsed.questClaims === 'object' ? parsed.questClaims : {},
  habitChecks: parsed.habitChecks && typeof parsed.habitChecks === 'object' ? parsed.habitChecks : {},
  ui: parsed.ui && typeof parsed.ui === 'object' ? parsed.ui : {},
});

export const loadState = () => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return DEFAULT_APP_STATE;
    }

    return normalizeState(JSON.parse(stored));
  } catch (error) {
    return DEFAULT_APP_STATE;
  }
};

export const saveState = (state) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const resetState = () => {
  window.localStorage.removeItem(STORAGE_KEY);
  return DEFAULT_APP_STATE;
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

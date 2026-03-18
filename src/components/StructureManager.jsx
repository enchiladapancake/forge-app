import { useEffect, useMemo, useState } from 'react';
import { createProfileFromPreset, getPresetById, syncCategoryProjectIds } from '../data/seed';

const slugify = (value, fallback) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || fallback;

const parseTags = (value) =>
  value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

function PresetCard({ preset, isCurrent, onSelect, disabled }) {
  return (
    <button className={`preset-card ${isCurrent ? 'preset-card--current' : ''}`} type="button" onClick={() => onSelect?.(preset.id)} disabled={disabled}>
      <div className="preset-card__top">
        <strong>{preset.name}</strong>
        {isCurrent ? <span className="status-pill status-pill--ready">Current</span> : null}
      </div>
      <p>{preset.description}</p>
      <div className="preset-card__stats">
        <span>{preset.categories.length} categories</span>
        <span>{preset.projects.length} projects</span>
        <span>{preset.habits.length} habits</span>
      </div>
    </button>
  );
}

function CategoryManager({ categories, projects, onUpdate, onCreate, onDelete }) {
  const [draft, setDraft] = useState({ name: '', color: '#60a5fa', description: '' });

  return (
    <div className="structure-block">
      <div className="panel-header">
        <div>
          <h3>Categories</h3>
          <p>These are the top-level lanes that hold projects and category-level progress.</p>
        </div>
      </div>
      <div className="stack-list">
        {categories.map((category) => (
          <div key={category.id} className="structure-card">
            <div className="structure-card__header">
              <strong>{category.name}</strong>
              <button className="ghost-button session-action-button" type="button" onClick={() => onDelete(category.id)}>
                Delete
              </button>
            </div>
            <div className="structure-form-grid">
              <label>
                Name
                <input value={category.name} onChange={(event) => onUpdate(category.id, { name: event.target.value })} />
              </label>
              <label>
                Color
                <input type="color" value={category.color} onChange={(event) => onUpdate(category.id, { color: event.target.value })} />
              </label>
              <label className="structure-form-grid__wide">
                Description
                <input value={category.description || ''} onChange={(event) => onUpdate(category.id, { description: event.target.value })} />
              </label>
            </div>
            <p className="structure-card__meta">{projects.filter((project) => project.categoryId === category.id).length} projects currently assigned</p>
          </div>
        ))}
      </div>
      <div className="structure-create-card">
        <strong>Add Category</strong>
        <div className="structure-form-grid">
          <label>
            Name
            <input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} placeholder="New category" />
          </label>
          <label>
            Color
            <input type="color" value={draft.color} onChange={(event) => setDraft((current) => ({ ...current, color: event.target.value }))} />
          </label>
          <label className="structure-form-grid__wide">
            Description
            <input
              value={draft.description}
              onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
              placeholder="What belongs in this lane?"
            />
          </label>
        </div>
        <button
          className="secondary-button"
          type="button"
          onClick={() => {
            onCreate({
              id: slugify(draft.name, `category-${Date.now()}`),
              name: draft.name.trim(),
              color: draft.color,
              description: draft.description.trim(),
            });
            setDraft({ name: '', color: '#60a5fa', description: '' });
          }}
          disabled={!draft.name.trim()}
        >
          Add Category
        </button>
      </div>
    </div>
  );
}

function ProjectManager({ categories, projects, onUpdate, onCreate, onDelete }) {
  const [draft, setDraft] = useState({
    name: '',
    categoryId: categories[0]?.id || '',
    rate: 1,
    tags: '',
  });

  useEffect(() => {
    if (!draft.categoryId && categories[0]?.id) {
      setDraft((current) => ({ ...current, categoryId: categories[0].id }));
    }
  }, [categories, draft.categoryId]);

  return (
    <div className="structure-block">
      <div className="panel-header">
        <div>
          <h3>Projects</h3>
          <p>Projects are the direct lanes sessions feed. Rates and tags stay editable here.</p>
        </div>
      </div>
      <div className="stack-list">
        {projects.map((project) => (
          <div key={project.id} className="structure-card">
            <div className="structure-card__header">
              <strong>{project.name}</strong>
              <button className="ghost-button session-action-button" type="button" onClick={() => onDelete(project.id)}>
                Delete
              </button>
            </div>
            <div className="structure-form-grid">
              <label>
                Name
                <input value={project.name} onChange={(event) => onUpdate(project.id, { name: event.target.value })} />
              </label>
              <label>
                Category
                <select value={project.categoryId} onChange={(event) => onUpdate(project.id, { categoryId: event.target.value })}>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                XP Rate
                <input type="number" min="0.5" step="0.1" value={project.rate} onChange={(event) => onUpdate(project.id, { rate: Number(event.target.value) || 1 })} />
              </label>
              <label className="structure-form-grid__wide">
                Tags
                <input value={(project.tags || []).join(', ')} onChange={(event) => onUpdate(project.id, { tags: parseTags(event.target.value) })} />
              </label>
            </div>
          </div>
        ))}
      </div>
      <div className="structure-create-card">
        <strong>Add Project</strong>
        <div className="structure-form-grid">
          <label>
            Name
            <input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} placeholder="New project" />
          </label>
          <label>
            Category
            <select value={draft.categoryId} onChange={(event) => setDraft((current) => ({ ...current, categoryId: event.target.value }))}>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            XP Rate
            <input type="number" min="0.5" step="0.1" value={draft.rate} onChange={(event) => setDraft((current) => ({ ...current, rate: Number(event.target.value) || 1 }))} />
          </label>
          <label className="structure-form-grid__wide">
            Tags
            <input value={draft.tags} onChange={(event) => setDraft((current) => ({ ...current, tags: event.target.value }))} placeholder="Technique, Deep Work, Review" />
          </label>
        </div>
        <button
          className="secondary-button"
          type="button"
          onClick={() => {
            onCreate({
              id: slugify(draft.name, `project-${Date.now()}`),
              name: draft.name.trim(),
              categoryId: draft.categoryId,
              rate: Number(draft.rate) || 1,
              tags: parseTags(draft.tags),
            });
            setDraft({ name: '', categoryId: categories[0]?.id || '', rate: 1, tags: '' });
          }}
          disabled={!draft.name.trim() || !draft.categoryId}
        >
          Add Project
        </button>
      </div>
    </div>
  );
}

function HabitManager({ habits, onUpdate, onCreate, onDelete, onToggleEnabled }) {
  const [draft, setDraft] = useState({ name: '', rewardXp: 30 });

  return (
    <div className="structure-block">
      <div className="panel-header">
        <div>
          <h3>Habits</h3>
          <p>Enable or disable daily habits without losing the saved structure behind them.</p>
        </div>
      </div>
      <div className="stack-list">
        {habits.map((habit) => (
          <div key={habit.id} className="structure-card">
            <div className="structure-card__header">
              <strong>{habit.name}</strong>
              <div className="inline-actions">
                <button className="ghost-button session-action-button" type="button" onClick={() => onToggleEnabled(habit.id)}>
                  {habit.enabled === false ? 'Enable' : 'Disable'}
                </button>
                <button className="ghost-button session-action-button" type="button" onClick={() => onDelete(habit.id)}>
                  Delete
                </button>
              </div>
            </div>
            <div className="structure-form-grid">
              <label>
                Name
                <input value={habit.name} onChange={(event) => onUpdate(habit.id, { name: event.target.value })} />
              </label>
              <label>
                Reward XP
                <input type="number" min="0" step="5" value={habit.rewardXp} onChange={(event) => onUpdate(habit.id, { rewardXp: Number(event.target.value) || 0 })} />
              </label>
            </div>
            <p className="structure-card__meta">{habit.enabled === false ? 'Currently disabled' : 'Currently active'}</p>
          </div>
        ))}
      </div>
      <div className="structure-create-card">
        <strong>Add Habit</strong>
        <div className="structure-form-grid">
          <label>
            Name
            <input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} placeholder="New habit" />
          </label>
          <label>
            Reward XP
            <input type="number" min="0" step="5" value={draft.rewardXp} onChange={(event) => setDraft((current) => ({ ...current, rewardXp: Number(event.target.value) || 0 }))} />
          </label>
        </div>
        <button
          className="secondary-button"
          type="button"
          onClick={() => {
            onCreate({
              id: slugify(draft.name, `habit-${Date.now()}`),
              name: draft.name.trim(),
              rewardXp: Number(draft.rewardXp) || 0,
              enabled: true,
            });
            setDraft({ name: '', rewardXp: 30 });
          }}
          disabled={!draft.name.trim()}
        >
          Add Habit
        </button>
      </div>
    </div>
  );
}

export function PresetTemplatePanel({ presets, currentPresetId }) {
  return (
    <div className="structure-block">
      <div className="panel-header">
        <div>
          <h2>Preset and Setup</h2>
          <p>The current account is now backed by a setup preset. The Mylo setup stays preserved as a first-class built-in template.</p>
        </div>
      </div>
      <div className="preset-grid">
        {presets.map((preset) => (
          <PresetCard key={preset.id} preset={preset} isCurrent={preset.id === currentPresetId} disabled />
        ))}
      </div>
      <div className="subpanel subpanel--compact">
        <strong>Why preset switching is locked for now</strong>
        <p>The current structure can be customized safely in-place. Full preset swapping is intentionally view-only until it can guarantee no accidental data loss.</p>
      </div>
    </div>
  );
}

export function StructureManagementPanel({
  profile,
  onUpdateCategory,
  onCreateCategory,
  onDeleteCategory,
  onUpdateProject,
  onCreateProject,
  onDeleteProject,
  onUpdateHabit,
  onCreateHabit,
  onDeleteHabit,
  onToggleHabitEnabled,
}) {
  return (
    <div className="structure-manager">
      <CategoryManager categories={profile.categories} projects={profile.projects} onUpdate={onUpdateCategory} onCreate={onCreateCategory} onDelete={onDeleteCategory} />
      <ProjectManager categories={profile.categories} projects={profile.projects} onUpdate={onUpdateProject} onCreate={onCreateProject} onDelete={onDeleteProject} />
      <HabitManager habits={profile.habits} onUpdate={onUpdateHabit} onCreate={onCreateHabit} onDelete={onDeleteHabit} onToggleEnabled={onToggleHabitEnabled} />
    </div>
  );
}

export function SetupWizardModal({ isOpen, presets, onComplete }) {
  const [selectedPresetId, setSelectedPresetId] = useState(presets[0]?.id || 'mylo-personal');
  const [displayName, setDisplayName] = useState('');
  const [customize, setCustomize] = useState(false);
  const selectedPreset = useMemo(() => getPresetById(selectedPresetId), [selectedPresetId]);
  const [draftProfile, setDraftProfile] = useState(() => createProfileFromPreset(selectedPresetId));

  useEffect(() => {
    const nextProfile = createProfileFromPreset(selectedPresetId);
    setDraftProfile(nextProfile);
    setDisplayName(nextProfile.displayName || '');
  }, [selectedPresetId]);

  if (!isOpen) {
    return null;
  }

  const updateDraft = (updater) => {
    setDraftProfile((current) => {
      const next = updater(current);
      return {
        ...next,
        categories: syncCategoryProjectIds(next.categories, next.projects),
      };
    });
  };

  return (
    <div className="modal-backdrop" onClick={(event) => event.stopPropagation()}>
      <div className="modal-panel tutorial-panel setup-panel" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p className="eyebrow">Setup</p>
            <h2>Set Up The Forge</h2>
            <p>Choose a starter preset, give the account a name if you want, and optionally tune the structure before starting.</p>
          </div>
        </div>

        <label className="setup-field">
          Display Name
          <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Mylo" />
        </label>

        <div className="preset-grid">
          {presets.map((preset) => (
            <PresetCard key={preset.id} preset={preset} isCurrent={preset.id === selectedPresetId} onSelect={setSelectedPresetId} />
          ))}
        </div>

        <div className="subpanel">
          <strong>{selectedPreset.name}</strong>
          <p>{selectedPreset.description}</p>
        </div>

        <label className="preference-card">
          <input type="checkbox" checked={customize} onChange={(event) => setCustomize(event.target.checked)} />
          <div>
            <strong>Customize before finishing</strong>
            <span>Adjust categories, projects, or habits now instead of starting with the preset exactly as-is.</span>
          </div>
        </label>

        {customize ? (
          <div className="setup-editor">
            <StructureManagementPanel
              profile={draftProfile}
              onUpdateCategory={(categoryId, patch) =>
                updateDraft((current) => ({
                  ...current,
                  categories: current.categories.map((category) => (category.id === categoryId ? { ...category, ...patch } : category)),
                }))}
              onCreateCategory={(category) =>
                updateDraft((current) => ({
                  ...current,
                  categories: [...current.categories, { ...category, projectIds: [] }],
                }))}
              onDeleteCategory={(categoryId) =>
                updateDraft((current) => ({
                  ...current,
                  categories: current.categories.filter((category) => category.id !== categoryId),
                  projects: current.projects.filter((project) => project.categoryId !== categoryId),
                }))}
              onUpdateProject={(projectId, patch) =>
                updateDraft((current) => ({
                  ...current,
                  projects: current.projects.map((project) => (project.id === projectId ? { ...project, ...patch } : project)),
                }))}
              onCreateProject={(project) =>
                updateDraft((current) => ({
                  ...current,
                  projects: [...current.projects, project],
                }))}
              onDeleteProject={(projectId) =>
                updateDraft((current) => ({
                  ...current,
                  projects: current.projects.filter((project) => project.id !== projectId),
                }))}
              onUpdateHabit={(habitId, patch) =>
                updateDraft((current) => ({
                  ...current,
                  habits: current.habits.map((habit) => (habit.id === habitId ? { ...habit, ...patch } : habit)),
                }))}
              onCreateHabit={(habit) =>
                updateDraft((current) => ({
                  ...current,
                  habits: [...current.habits, habit],
                }))}
              onDeleteHabit={(habitId) =>
                updateDraft((current) => ({
                  ...current,
                  habits: current.habits.filter((habit) => habit.id !== habitId),
                }))}
              onToggleHabitEnabled={(habitId) =>
                updateDraft((current) => ({
                  ...current,
                  habits: current.habits.map((habit) =>
                    habit.id === habitId ? { ...habit, enabled: habit.enabled === false ? true : false } : habit),
                }))}
            />
          </div>
        ) : null}

        <div className="form-actions">
          <button
            className="primary-button"
            type="button"
            onClick={() =>
              onComplete({
                ...draftProfile,
                presetId: selectedPresetId,
                presetName: selectedPreset.name,
                displayName: displayName.trim() || draftProfile.displayName || selectedPreset.profileName,
                levelLabel: draftProfile.levelLabel || selectedPreset.levelLabel,
                starterPreferences: selectedPreset.starterPreferences || {},
                isConfigured: true,
                updatedAt: new Date().toISOString(),
              })}
          >
            Start Forging
          </button>
        </div>
      </div>
    </div>
  );
}

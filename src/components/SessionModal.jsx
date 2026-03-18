import { useEffect, useMemo, useState } from 'react';
import { getTodayKey } from '../utils/progression';

export function SessionModal({ isOpen, isEditing = false, onClose, onSubmit, projects, categories, defaultProjectId, initialValues }) {
  const initialProject = useMemo(() => initialValues?.projectId || defaultProjectId || projects[0]?.id || '', [defaultProjectId, initialValues, projects]);
  const [projectId, setProjectId] = useState(initialProject);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [tag, setTag] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(getTodayKey());

  useEffect(() => {
    if (isOpen) {
      setProjectId(initialProject);
      setDurationMinutes(initialValues?.durationMinutes ?? 30);
      setTag(initialValues?.tag || '');
      setNote(initialValues?.note || '');
      setDate(initialValues?.date || getTodayKey());
    }
  }, [initialProject, initialValues, isOpen]);

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const selectedProject = projects.find((project) => project.id === projectId);
  const availableTags = selectedProject?.tags || [];
  const projectsByCategory = categories.map((category) => ({
    ...category,
    projects: projects.filter((project) => project.categoryId === category.id),
  })).filter((category) => category.projects.length);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      projectId,
      durationMinutes: Number(durationMinutes),
      tag,
      note,
      date,
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>{isEditing ? 'Edit Session' : 'Log Session'}</h2>
            <p>{isEditing ? 'Update the session and all progression will recalculate automatically.' : 'Capture focused work and turn it into progress.'}</p>
          </div>
          <button className="ghost-button" type="button" onClick={onClose}>
            Close
          </button>
        </div>

        <form className="session-form" onSubmit={handleSubmit}>
          <label>
            Project
            <div className="project-picker">
              {projectsByCategory.map((category) => (
                <div key={category.id} className="project-group">
                  <div className="project-group__header">
                    <span className="legend-dot" style={{ backgroundColor: category.color }} />
                    <strong>{category.name}</strong>
                  </div>
                  <div className="project-chip-grid">
                    {category.projects.map((project) => {
                      const isSelected = project.id === projectId;

                      return (
                        <button
                          key={project.id}
                          className={`project-chip ${isSelected ? 'project-chip--selected' : ''}`}
                          style={{
                            '--project-accent': category.color,
                          }}
                          type="button"
                          onClick={() => setProjectId(project.id)}
                        >
                          {project.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </label>

          <label>
            Duration (minutes)
            <input
              min="1"
              step="1"
              type="number"
              value={durationMinutes}
              onChange={(event) => setDurationMinutes(event.target.value)}
              required
            />
          </label>

          <label>
            Tag
            <input
              list="project-tags"
              value={tag}
              onChange={(event) => setTag(event.target.value)}
              placeholder="Technique, scripting, lifting..."
            />
            <datalist id="project-tags">
              {availableTags.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </label>

          <label>
            Note
            <textarea
              rows="4"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="What moved forward in this session?"
            />
          </label>

          <label>
            Date
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
          </label>

          <div className="form-actions">
            <button className="primary-button" type="submit">
              {isEditing ? 'Save Changes' : 'Save Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

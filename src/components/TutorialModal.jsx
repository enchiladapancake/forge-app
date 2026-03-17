export function TutorialModal({ isOpen, onClose }) {
  if (!isOpen) {
    return null;
  }

  const sections = [
    {
      title: 'What The Forge Is',
      body: 'The Forge turns real-life effort into visible progression. Your sessions feed project XP, category growth, and your overall Mylo Level.',
    },
    {
      title: 'Projects and Categories',
      body: 'Projects are the specific things you practice, like Bass or Python. Categories group those projects into bigger life domains like Music or Coding.',
    },
    {
      title: 'How to Log a Session',
      body: 'Use Log Session to record a project, minutes spent, optional tag, optional note, and date. Sessions are the source of truth for all progression.',
    },
    {
      title: 'XP and Levels',
      body: 'Each project has its own XP rate. Longer sessions use diminishing returns, and levels scale upward over time for projects, categories, and Mylo Level.',
    },
    {
      title: 'Streak Bonus',
      body: 'Logging at least one session on consecutive days gives an active XP bonus. It adds 5% per day up to 50%, and missing a day just resets the bonus, not your base XP.',
    },
    {
      title: 'Habits and Quests',
      body: 'Habits are quick daily check-offs for small XP. Quests are daily objectives with flat rewards that help guide focus without overpowering session progress.',
    },
    {
      title: 'Achievements',
      body: 'Each project tracks milestones like first session, session count, total minutes, and XP earned. They unlock automatically from your session history.',
    },
    {
      title: 'Local Save Data',
      body: 'Everything is saved locally in your browser on this device. Export Data creates a backup file, Import Data restores one, and Reset Progress wipes local progress completely.',
    },
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel tutorial-panel" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p className="eyebrow">How It Works</p>
            <h2>Welcome to The Forge</h2>
            <p>Everything you need to understand the loop, backup your data, and use the app confidently.</p>
          </div>
          <button className="ghost-button" type="button" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="tutorial-grid">
          {sections.map((section) => (
            <div key={section.title} className="tutorial-card">
              <h3>{section.title}</h3>
              <p>{section.body}</p>
            </div>
          ))}
        </div>

        <div className="form-actions">
          <button className="primary-button" type="button" onClick={onClose}>
            Start Forging
          </button>
        </div>
      </div>
    </div>
  );
}

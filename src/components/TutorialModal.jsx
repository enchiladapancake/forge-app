export function TutorialModal({ isOpen, onClose }) {
  if (!isOpen) {
    return null;
  }

  const sections = [
    {
      title: 'What The Forge Is',
      body: 'The Forge turns real-life effort into visible progression. Sessions are still the core source of truth, and they feed project XP, category growth, quests, streaks, and your overall Mylo Level.',
    },
    {
      title: 'Dashboard Structure',
      body: 'The dashboard is organized into Overview, Strategy, Build Identity, Progress Visualization, Quest Journal, Weekly Summary, Perks, Activity, and Utilities so the growing systems still stay skimmable.',
    },
    {
      title: 'Projects and Categories',
      body: 'Projects are the specific crafts you level, like Bass or Python. Categories group them into broader domains like Music, Coding, or Health.',
    },
    {
      title: 'Logging Sessions',
      body: 'Use Log Session to record the project, minutes, optional tag, optional note, and date. You can edit or delete sessions later if you need to correct them.',
    },
    {
      title: 'XP Feedback',
      body: 'When you log, edit, or delete a session, the app briefly shows the XP change and calls out bigger moments like focus, momentum, perks, balance rewards, quest clears, and other milestone events.',
    },
    {
      title: 'XP and Levels',
      body: 'Each project has its own XP rate. Sessions use diminishing returns for long blocks, and XP can be boosted by streaks, Weekly Focus, momentum, and some perks. Levels scale upward for projects, categories, and your Mylo Level.',
    },
    {
      title: 'Daily and Weekly Refresh',
      body: 'Daily Quests, daily habit checkoffs, rerolls, and streak-related day tracking all follow the real calendar day. Forge Trials reset on the real calendar week, so the app keeps moving even after reloads, closing the browser, export/import, or reset.',
    },
    {
      title: 'Streaks, Focus, Momentum, and Balance',
      body: 'Daily streaks reward consistency without punishing misses. Weekly Focus gives one Primary category +20% XP and two Secondary categories +10% XP on new sessions. Momentum rewards recent category activity up to +15%, and Balanced Week rewards broad activity across 5 categories in 7 days.',
    },
    {
      title: 'Quest Journal',
      body: 'The Quest Journal now has three tiers: Daily Quests for short pushes, Long-Term Quests for milestone progress, and Legendary Quests for major campaign objectives that can take weeks or months.',
    },
    {
      title: 'Forge Trials and Rerolls',
      body: 'Forge Trials are weekly boss-style objectives with stronger rewards. Daily Quests can also be rerolled in a controlled way, and perks can expand how many rerolls you get each day.',
    },
    {
      title: 'Forge Points and Perks',
      body: 'Forge Points are the app’s second progression currency. You earn them from quests, trials, milestones, and balance rewards, then spend them on moderate permanent perks like note bonuses, category bonuses, stronger balance rewards, and better quest utility.',
    },
    {
      title: 'Build Identity and Recommendations',
      body: 'The app now derives a build identity like Focused Builder, Balanced Build, Momentum Build, or Consistency Build from your actual recent patterns. Recommendations use that, plus quest progress, neglect, focus, and balance opportunities, to suggest better next moves.',
    },
    {
      title: 'Weekly Summary, Ties, and Highlights',
      body: 'The Weekly Summary now tells the story of the last 7 days with XP, Forge Points, trials cleared, momentum, neglected lanes, and tie-aware activity summaries. If multiple categories or projects are tied, the app shows all of them instead of arbitrarily picking one.',
    },
    {
      title: 'Milestones and Achievements',
      body: 'Projects still unlock achievements automatically from session history. The dashboard also surfaces larger milestone highlights like first Balanced Week, momentum peaks, level thresholds, and other progression moments that can be claimed for rewards.',
    },
    {
      title: 'Utilities and Local Save Data',
      body: 'Everything stays local to this device. Use Export Data for backups, Import Data to restore, Open Help to revisit this guide, and Reset Progress to wipe local progress completely. Export/import also includes the newer systems like quests, Forge Points, perks, rerolls, and refresh-sensitive state.',
    },
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel tutorial-panel" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p className="eyebrow">How It Works</p>
            <h2>Welcome to The Forge</h2>
            <p>Everything you need to understand the progression loop, the refresh cycles, and the strategic layers of the app.</p>
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

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
      title: 'Navigation Structure',
      body: 'Use Dashboard for the current overview, The Road for the best next action, Daily Road for a full optimized plan for the day, Quest Journal for all quest tiers, Projects for categories and timelines, Progress for stats and profile insight, Perks for the Forge Points economy, and Settings for help and local preferences.',
    },
    {
      title: 'Installable App Mode',
      body: 'The Forge now has an installable web-app foundation. On supported browsers you can add it to your home screen or install it from the browser menu, then open it in a cleaner standalone app shell while keeping the same local-first save behavior.',
    },
    {
      title: 'The Road',
      body: 'The Road is the flagship decision engine. It scores candidate actions from your live state, surfaces one primary recommendation, explains why it was chosen, shows expected impact, and lets you complete that action directly from the page.',
    },
    {
      title: 'Daily Road',
      body: 'Daily Road is the structured version of The Road. It generates a clean multi-step path for the whole day, lets you complete each step directly, tracks progress through the path, and refreshes once per day unless you explicitly reroll it.',
    },
    {
      title: 'What The Road Considers',
      body: 'The Road looks across daily quests, long-term quests, legendary quests, ultimate quests, weekly Forge Trials, habits, Weekly Focus, momentum, Balanced Week progress, streaks, neglected categories, perks, your Progress Profile, and long-arc objective pressure.',
    },
    {
      title: 'Sessions and XP',
      body: 'Log a session with project, minutes, optional tag, note, and date. XP uses diminishing returns for long sessions and can be boosted by streaks, Weekly Focus, momentum, and perks.',
    },
    {
      title: 'Focus, Momentum, and Balance',
      body: 'Weekly Focus gives one Primary category +20% XP and two Secondary categories +10% XP on new sessions. Momentum rewards recent category activity. Balanced Week rewards broad activity across 5 categories in 7 days.',
    },
    {
      title: 'Quest Journal',
      body: 'The Journal now has Daily Quests, weekly Forge Trials, Long-Term Quests, Legendary Quests, and Ultimate Quests. Each tier can be collapsed or expanded, and those preferences are stored locally.',
    },
    {
      title: 'Forge Points and Perks',
      body: 'Forge Points are the second progression economy. You earn them from quests, trials, milestones, balance rewards, and major clears, then spend them on repeatable perk upgrades that improve XP, rewards, momentum, streak utility, The Road, and more.',
    },
    {
      title: 'Progress Profile',
      body: 'The Progress page now explains your current pattern as a Progress Profile, such as Focused Builder, Balanced Build, Momentum Build, or Consistency Build. Recommendations and The Road both use that profile as part of their scoring.',
    },
    {
      title: 'Refresh Cycles',
      body: 'Daily Quests, habit checkoffs, rerolls, and streak-related day tracking follow the real calendar day. Forge Trials follow the real calendar week, so the app keeps moving after refreshes, browser restarts, imports, and resets.',
    },
    {
      title: 'Feedback and Rewards',
      body: 'When you log, edit, delete, claim, upgrade, or complete a Road or Daily Road action, the app shows concise XP and Forge Point feedback. Settings lets you keep those messages full or minimal.',
    },
    {
      title: 'Settings and Local Save Data',
      body: 'Everything stays local to this device. Settings includes Export Data, Import Data, Reset Progress, Help, confirmation preferences, Road behavior preferences, feedback style, and quest-tier collapse preferences.',
    },
    {
      title: 'Offline and Resilience',
      body: 'The app now includes a lightweight app-shell cache so the installed experience feels more stable. Live progression data still comes from your browser storage on this device, so Export Data remains the safe way to move or back up progress.',
    },
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel tutorial-panel" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p className="eyebrow">How It Works</p>
            <h2>Welcome to The Forge</h2>
            <p>Everything you need to understand the progression loop, the economy, the flagship action flow, and the installable app experience.</p>
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

import { ProgressBar } from './ProgressBar';
import { formatDisplayDate, getCategoryDefinition } from '../utils/progression';

function QuestCard({ quest, onClaim }) {
  return (
    <div className={`subpanel ${quest.claimed ? 'subpanel--claimed' : ''}`}>
      <div className="list-row">
        <div>
          <h4>{quest.title}</h4>
          <p>{quest.progressText}</p>
        </div>
        <div className="reward-pill">+{quest.rewardXp} XP</div>
      </div>
      <button className="secondary-button" type="button" disabled={!quest.complete || quest.claimed} onClick={() => onClaim(quest.id)}>
        {quest.claimed ? 'Claimed' : quest.complete ? 'Claim Reward' : 'In Progress'}
      </button>
    </div>
  );
}

function HabitCard({ habit, onToggle }) {
  return (
    <label className={`habit-card ${habit.checked ? 'habit-card--checked' : ''}`}>
      <input type="checkbox" checked={habit.checked} onChange={() => onToggle(habit.id)} />
      <div>
        <strong>{habit.name}</strong>
        <span>+{habit.rewardXp} XP</span>
      </div>
    </label>
  );
}

export function Dashboard({
  derived,
  projects,
  onSelectProject,
  onOpenSessionModal,
  onClaimQuest,
  onToggleHabit,
  onExportData,
  onImportData,
  onResetProgress,
}) {
  const latestNote = derived.mostRecentSession?.note?.trim();

  return (
    <div className="page page--dashboard">
      <section className="hero-card">
        <div>
          <p className="eyebrow">Personal Progression Dashboard</p>
          <h1>The Forge</h1>
          <p className="hero-copy">
            Turn consistent work into visible growth. Log sessions, complete daily objectives, and push your Mylo Level forward.
          </p>
        </div>
        <div className="hero-stats">
          <div className="level-badge">
            <span>Mylo Level</span>
            <strong>{derived.overallLevelInfo.level}</strong>
          </div>
          <div className="stat-chip">
            <span>Total XP</span>
            <strong>{derived.overallXp}</strong>
          </div>
          <div className="stat-chip">
            <span>Active Streak Bonus</span>
            <strong>+{derived.activeStreakBonusPercent}%</strong>
          </div>
          <div className="stat-chip">
            <span>Focused Minutes</span>
            <strong>{derived.totalProjectMinutes}</strong>
          </div>
        </div>
        <ProgressBar
          value={derived.overallLevelInfo.progressPercent}
          label={`${derived.overallLevelInfo.currentLevelXp} / ${derived.overallLevelInfo.xpForNextLevel} XP to next Mylo Level`}
          tone="ember"
        />
        <div className="hero-actions">
          <div className="hero-action-group">
            <button className="primary-button" type="button" onClick={onOpenSessionModal}>
              Log Session
            </button>
            <button className="ghost-button" type="button" onClick={onExportData}>
              Export Data
            </button>
            <label className="ghost-button ghost-button--file">
              Import Data
              <input type="file" accept="application/json,.json" onChange={onImportData} />
            </label>
            <button className="danger-button" type="button" onClick={onResetProgress}>
              Reset Progress
            </button>
          </div>
          <div className="hero-note">
            <span>Bonus XP tracked separately:</span> {derived.bonusXp}
          </div>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="panel">
          <div className="panel-header">
            <h2>Category Summary</h2>
            <p>Broader progression built from project totals.</p>
          </div>
          <div className="category-list">
            {derived.categoryStats.map((category) => (
              <div key={category.id} className="category-row">
                <div>
                  <h3>{category.name}</h3>
                  <p>{category.totalMinutes} min logged</p>
                </div>
                <div className="category-metrics">
                  <span>Lvl {category.levelInfo.level}</span>
                  <span>{category.totalXp} XP</span>
                </div>
                <ProgressBar value={category.levelInfo.progressPercent} tone="steel" />
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2>Daily Quests</h2>
            <p>{formatDisplayDate(derived.todayKey)}</p>
          </div>
          <div className="stack-list">
            {derived.dailyQuests.map((quest) => (
              <QuestCard key={quest.id} quest={quest} onClaim={onClaimQuest} />
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2>Habits</h2>
            <p>Small wins that stack over time.</p>
          </div>
          <div className="habit-grid">
            {derived.habitsToday.map((habit) => (
              <HabitCard key={habit.id} habit={habit} onToggle={onToggleHabit} />
            ))}
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Projects</h2>
          <p>Each project levels independently, then rolls up into its category.</p>
        </div>
        <div className="project-grid">
          {projects.map((project) => {
            const stats = derived.projectStats[project.id];
            const category = getCategoryDefinition(project.categoryId);

            return (
              <button key={project.id} type="button" className="project-card" onClick={() => onSelectProject(project.id)}>
                <div className="project-card__header">
                  <div>
                    <h3>{project.name}</h3>
                    <p>{category.name}</p>
                  </div>
                  <div className="rate-badge">{project.rate}x</div>
                </div>
                <div className="project-card__stats">
                  <span>Lvl {stats.levelInfo.level}</span>
                  <span>{stats.totalXp} XP</span>
                  <span>{stats.totalMinutes} min</span>
                </div>
                <ProgressBar
                  value={stats.levelInfo.progressPercent}
                  label={`${stats.levelInfo.currentLevelXp} / ${stats.levelInfo.xpForNextLevel} XP`}
                />
              </button>
            );
          })}
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="panel">
          <div className="panel-header">
            <h2>Most Recent Session Note</h2>
            <p>{derived.mostRecentSession ? formatDisplayDate(derived.mostRecentSession.date) : 'No sessions yet'}</p>
          </div>
          <div className="note-card">
            {derived.mostRecentSession ? (
              <>
                <h3>{derived.projectMap[derived.mostRecentSession.projectId].name}</h3>
                <p>{latestNote || 'No note was added for the latest session.'}</p>
              </>
            ) : (
              <p>Start by logging your first session and the dashboard will begin telling the story of your progress.</p>
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2>Recent Activity</h2>
            <p>Sessions, habits, and quest claims.</p>
          </div>
          <div className="activity-list">
            {derived.activityFeed.length ? (
              derived.activityFeed.map((activity) => (
                <div key={activity.id} className="activity-item">
                  <div>
                    <strong>{activity.title}</strong>
                    <p>{activity.details}</p>
                  </div>
                  <span>{new Date(activity.createdAt).toLocaleString()}</span>
                </div>
              ))
            ) : (
              <p className="empty-state">Activity will appear here after your first session or daily check-in.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

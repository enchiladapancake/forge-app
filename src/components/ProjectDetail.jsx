import { ProgressBar } from './ProgressBar';
import { formatDisplayDate, getCategoryDefinition } from '../utils/progression';

export function ProjectDetail({ project, stats, onBack, onOpenSessionModal, onEditSession, onDeleteSession }) {
  const category = getCategoryDefinition(project.categoryId);

  return (
    <div className="page page--detail">
      <section className="detail-hero">
        <button className="ghost-button" type="button" onClick={onBack}>
          Back to Projects
        </button>
        <div className="detail-hero__content">
          <div>
            <p className="eyebrow">{category.name}</p>
            <h1>{project.name}</h1>
            <p className="hero-copy">Focused sessions here contribute directly to {category.name} and your overall Mylo Level.</p>
          </div>
          <button className="primary-button" type="button" onClick={() => onOpenSessionModal(project.id)}>
            Log New Session
          </button>
        </div>
        <div className="detail-stat-row">
          <div className="stat-card">
            <span>Project Level</span>
            <strong>{stats.levelInfo.level}</strong>
          </div>
          <div className="stat-card">
            <span>Total XP</span>
            <strong>{stats.totalXp}</strong>
          </div>
          <div className="stat-card">
            <span>Total Minutes</span>
            <strong>{stats.totalMinutes}</strong>
          </div>
          <div className="stat-card">
            <span>Sessions Logged</span>
            <strong>{stats.sessionCount}</strong>
          </div>
        </div>
        <ProgressBar
          value={stats.levelInfo.progressPercent}
          label={`${stats.levelInfo.currentLevelXp} / ${stats.levelInfo.xpForNextLevel} XP to next project level`}
          tone="ember"
        />
      </section>

      <section className="dashboard-grid">
        <div className="panel">
          <div className="panel-header">
            <h2>Session Logs</h2>
            <p>Review, edit, or remove logged work.</p>
          </div>
          <div className="stack-list">
            {stats.allSessions.length ? (
              stats.allSessions.map((session) => (
                <div key={session.id} className="subpanel">
                  <div className="list-row">
                    <div>
                      <h4>{formatDisplayDate(session.date)}</h4>
                      <p>
                        {session.durationMinutes} min{session.tag ? ` | ${session.tag}` : ''}
                      </p>
                    </div>
                    <div className="reward-pill">+{session.finalXp} XP</div>
                  </div>
                  <p>{session.note || 'No note added for this session.'}</p>
                  <div className="session-meta-row">
                    <small>Streak bonus: +{session.streakBonusPercent}%</small>
                    <div className="session-actions">
                      <button className="ghost-button session-action-button" type="button" onClick={() => onEditSession(session)}>
                        Edit
                      </button>
                      <button className="danger-button session-action-button" type="button" onClick={() => onDeleteSession(session.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-state">No sessions yet. Log one to start this project's timeline.</p>
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2>Achievements</h2>
            <p>Milestones that reflect steady progress.</p>
          </div>
          <div className="achievement-list">
            {stats.achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`achievement-card ${achievement.unlocked ? 'achievement-card--unlocked' : 'achievement-card--locked'}`}
              >
                <strong>{achievement.label}</strong>
                <span>{achievement.unlocked ? 'Unlocked' : 'Locked'}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

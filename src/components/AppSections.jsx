import { ProgressBar } from './ProgressBar';
import { CategoryRadarChart } from './CategoryRadarChart';
import { formatDisplayDate, getCategoryDefinition } from '../utils/progression';

function PageHeader({ eyebrow, title, body, actions }) {
  return (
    <section className="page-header-card">
      <div className="page-header-copy">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="hero-copy">{body}</p>
      </div>
      {actions ? <div className="page-header-actions">{actions}</div> : null}
    </section>
  );
}

function formatNameList(items, fallback) {
  if (!items?.length) {
    return fallback;
  }

  return items.map((item) => item.name).join(' / ');
}

function QuestCard({
  quest,
  onClaim,
  claimLabel = 'Claim Reward',
  showClaim = true,
  onReroll,
  canReroll = false,
  showRequirements = false,
  tone = 'daily',
}) {
  return (
    <div className={`quest-card quest-card--${tone} ${quest.claimed ? 'quest-card--claimed' : quest.complete ? 'quest-card--complete' : ''}`}>
      <div className="quest-card__header">
        <div>
          <h3>{quest.title}</h3>
          <p>{quest.description}</p>
        </div>
        <div className="reward-stack">
          <div className="reward-pill">+{quest.rewardXp} XP</div>
          {'rewardPoints' in quest ? <div className="reward-pill reward-pill--points">+{quest.rewardPoints} FP</div> : null}
        </div>
      </div>
      {showRequirements && quest.requirements?.length ? (
        <div className="requirement-list">
          {quest.requirements.map((requirement) => (
            <div key={`${quest.id}-${requirement.label}`} className="requirement-item">
              <div className="requirement-item__copy">
                <strong>{requirement.label}</strong>
                <span>
                  {Math.min(requirement.current, requirement.target)} / {requirement.target}
                </span>
              </div>
              <ProgressBar value={requirement.progressPercent} tone={requirement.complete ? 'steel' : 'amber'} />
            </div>
          ))}
        </div>
      ) : (
        <ProgressBar value={quest.complete ? 100 : quest.progressPercent} label={quest.progressText} tone={quest.complete ? 'steel' : 'amber'} />
      )}
      <div className="quest-card__footer">
        <span className={`status-pill ${quest.claimed ? 'status-pill--claimed' : quest.complete ? 'status-pill--ready' : ''}`}>
          {quest.claimed ? 'Claimed' : quest.complete ? 'Ready' : 'In Progress'}
        </span>
        <div className="inline-actions">
          {onReroll ? (
            <button className="ghost-button quest-action-button" type="button" onClick={() => onReroll(quest.slotIndex)} disabled={!canReroll || quest.claimed}>
              Reroll
            </button>
          ) : null}
          {showClaim ? (
            <button className="secondary-button quest-action-button" type="button" disabled={!quest.complete || quest.claimed} onClick={() => onClaim(quest.id)}>
              {quest.claimed ? 'Claimed' : claimLabel}
            </button>
          ) : null}
        </div>
      </div>
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

function SectionToggleCard({ title, subtitle, isOpen, onToggle, children, tone = 'panel' }) {
  return (
    <section className={`panel quest-tier quest-tier--${tone}`}>
      <button className="section-toggle" type="button" onClick={onToggle}>
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <span className="status-pill">{isOpen ? 'Collapse' : 'Expand'}</span>
      </button>
      {isOpen ? children : null}
    </section>
  );
}

function WeeklyFocusPanel({ categories, weeklyFocus, onWeeklyFocusChange }) {
  const secondaryIds = weeklyFocus.secondaryCategoryIds || [];
  const primaryId = weeklyFocus.primaryCategoryId || '';

  const handlePrimaryChange = (value) => {
    onWeeklyFocusChange({
      primaryCategoryId: value,
      secondaryCategoryIds: secondaryIds.filter((categoryId) => categoryId !== value),
    });
  };

  const handleSecondaryChange = (index, value) => {
    const nextSecondaryIds = [...secondaryIds];
    nextSecondaryIds[index] = value;

    onWeeklyFocusChange({
      primaryCategoryId: primaryId === value ? '' : primaryId,
      secondaryCategoryIds: nextSecondaryIds,
    });
  };

  return (
    <div className="panel panel--soft">
      <div className="panel-header">
        <div>
          <h2>Weekly Focus</h2>
          <p>Primary grants +20%. Each Secondary grants +10% on new sessions.</p>
        </div>
      </div>
      <div className="focus-form-grid">
        <label>
          Primary
          <select value={primaryId} onChange={(event) => handlePrimaryChange(event.target.value)}>
            <option value="">None selected</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        {[0, 1].map((index) => (
          <label key={index}>
            Secondary {index + 1}
            <select value={secondaryIds[index] || ''} onChange={(event) => handleSecondaryChange(index, event.target.value)}>
              <option value="">None selected</option>
              {categories
                .filter((category) => category.id !== primaryId)
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
            </select>
          </label>
        ))}
      </div>
      <div className="focus-summary">
        {[primaryId, ...secondaryIds.filter(Boolean)].filter(Boolean).length ? (
          categories
            .filter((category) => category.id === primaryId || secondaryIds.includes(category.id))
            .map((category) => (
              <div key={category.id} className="focus-chip" style={{ borderColor: category.color }}>
                <span className="legend-dot" style={{ backgroundColor: category.color }} />
                <strong>{category.name}</strong>
                <small>{category.id === primaryId ? 'Primary +20%' : 'Secondary +10%'}</small>
              </div>
            ))
        ) : (
          <p className="empty-state">No Weekly Focus selected yet.</p>
        )}
      </div>
    </div>
  );
}

function WeeklySummarySnapshot({ weeklySummary }) {
  return (
    <div className="panel panel--soft">
      <div className="panel-header">
        <div>
          <h2>This Week</h2>
          <p>
            {formatDisplayDate(weeklySummary.weekStart)} to {formatDisplayDate(weeklySummary.weekEnd)}
          </p>
        </div>
      </div>
      <div className="summary-grid">
        <div className="summary-card">
          <span>Weekly XP</span>
          <strong>{weeklySummary.weeklyXp}</strong>
        </div>
        <div className="summary-card">
          <span>Forge Points</span>
          <strong>{weeklySummary.forgePointsEarned}</strong>
        </div>
        <div className="summary-card">
          <span>Sessions</span>
          <strong>{weeklySummary.sessionsLogged}</strong>
        </div>
        <div className="summary-card">
          <span>Habits</span>
          <strong>{weeklySummary.habitsCompleted}</strong>
        </div>
      </div>
      <div className="stack-list">
        <div className="subpanel">
          <strong>Most active</strong>
          <p>{formatNameList(weeklySummary.mostActiveCategories, 'No activity yet')}</p>
        </div>
        <div className="subpanel">
          <strong>Neglected</strong>
          <p>{formatNameList(weeklySummary.neglectedCategories, 'None')}</p>
        </div>
      </div>
    </div>
  );
}

function ProgressProfilePanel({ derived }) {
  const profile = derived.progressProfile || derived.buildIdentity;
  const activeCategoryStreaks = derived.categoryStats
    .filter((category) => derived.categoryStreaks[category.id] >= 2)
    .sort((left, right) => derived.categoryStreaks[right.id] - derived.categoryStreaks[left.id])
    .slice(0, 3);

  return (
    <div className="panel panel--soft">
      <div className="panel-header">
        <div>
          <h2>Progress Profile</h2>
          <p>The app reads your recent pattern and explains the current style of growth.</p>
        </div>
      </div>
      <div className="identity-card">
        <span className="identity-card__label">{profile.label || 'Current profile'}</span>
        <strong>{profile.name}</strong>
        <p>{profile.reason}</p>
      </div>
      <div className="summary-grid">
        <div className="summary-card">
          <span>Overall streak</span>
          <strong>{derived.activeStreakDays} days</strong>
        </div>
        <div className="summary-card">
          <span>Streak bonus</span>
          <strong>+{derived.activeStreakBonusPercent}%</strong>
        </div>
      </div>
      <div className="stack-list">
        {activeCategoryStreaks.length ? (
          activeCategoryStreaks.map((category) => (
            <div key={category.id} className="subpanel subpanel--compact">
              <strong>{category.name}</strong>
              <p>{derived.categoryStreaks[category.id]} day category streak</p>
            </div>
          ))
        ) : (
          <p className="empty-state">Category streaks appear here once a few lanes start chaining together.</p>
        )}
      </div>
    </div>
  );
}

function UtilitiesPanel({ onExportData, onImportData, onOpenTutorial, onResetProgress }) {
  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2>Utilities</h2>
          <p>Backup, restore, revisit help, or reset the local account.</p>
        </div>
      </div>
      <div className="utility-grid">
        <button className="ghost-button utility-button" type="button" onClick={onExportData}>
          <strong>Export Data</strong>
          <span>Download a full local backup.</span>
        </button>
        <label className="ghost-button ghost-button--file utility-button">
          <strong>Import Data</strong>
          <span>Restore a saved Forge export.</span>
          <input type="file" accept="application/json,.json" onChange={onImportData} />
        </label>
        <button className="ghost-button utility-button" type="button" onClick={onOpenTutorial}>
          <strong>Open Help</strong>
          <span>Revisit the built-in guide.</span>
        </button>
        <button className="danger-button utility-button" type="button" onClick={onResetProgress}>
          <strong>Reset Progress</strong>
          <span>Erase local progress and start clean.</span>
        </button>
      </div>
    </div>
  );
}

function RoadActionDetails({ action }) {
  if (!action) {
    return null;
  }

  return (
    <div className="road-details">
      {action.projectName ? <div className="road-detail-pill"><strong>Project</strong><span>{action.projectName}</span></div> : null}
      {action.categoryName ? <div className="road-detail-pill"><strong>Category</strong><span>{action.categoryName}</span></div> : null}
      {action.durationMinutes ? <div className="road-detail-pill"><strong>Duration</strong><span>{action.durationMinutes} min</span></div> : null}
      {action.tag ? <div className="road-detail-pill"><strong>Tag</strong><span>{action.tag}</span></div> : null}
      {action.habitName ? <div className="road-detail-pill"><strong>Habit</strong><span>{action.habitName}</span></div> : null}
    </div>
  );
}

export function RoadPage({ derived, onExecuteAction, onRerollRoad, xpFeedback }) {
  const primary = derived.road.primary;

  return (
    <div className="page">
      <PageHeader
        eyebrow="The Road"
        title="Best Next Action"
        body="The Road is the flagship decision engine. It looks across current quests, focus, momentum, balance, streaks, perks, neglect, and long-arc goals to choose the single strongest move right now."
        actions={xpFeedback ? <div className="feedback-banner"><strong>{xpFeedback.label}</strong><span>{xpFeedback.note}</span></div> : null}
      />

      <section className="page-section">
        <div className="road-hero" style={{ '--road-accent': getCategoryDefinition(primary?.categoryId || '')?.color || '#f59e0b' }}>
          {primary ? (
            <>
              <div className="road-hero__copy">
                <p className="eyebrow">Primary Recommendation</p>
                <h1>{primary.title}</h1>
                <p className="hero-copy">{primary.summary}</p>
              </div>
              <RoadActionDetails action={primary} />
              <div className="road-impact-grid">
                <div className="panel panel--soft">
                  <div className="panel-header"><div><h2>Why this was chosen</h2><p>The Road favors actions that stack several systems at once.</p></div></div>
                  <div className="stack-list">
                    {primary.reasons.map((reason) => <div key={reason} className="subpanel road-reason-card"><strong>{reason}</strong></div>)}
                  </div>
                </div>
                <div className="panel panel--soft">
                  <div className="panel-header"><div><h2>Expected impact</h2><p>Approximate preview of what this action is likely to move right now.</p></div></div>
                  <div className="stack-list">
                    {primary.expectedImpact.map((impact) => <div key={impact} className="subpanel road-impact-card"><strong>{impact}</strong></div>)}
                  </div>
                </div>
              </div>
              <div className="road-cta-row">
                <button className="primary-button road-cta-button" type="button" onClick={() => onExecuteAction(primary)}>
                  {primary.executionKind === 'habit' ? 'Complete This Action' : 'Log This Action'}
                </button>
                <button className="ghost-button" type="button" onClick={() => onRerollRoad(primary)} disabled={derived.road.rerollInfo.used >= derived.road.rerollInfo.limit}>
                  Suggest Another Path
                </button>
                <small>Rerolls {derived.road.rerollInfo.used}/{derived.road.rerollInfo.limit}</small>
              </div>
            </>
          ) : (
            <p className="empty-state">The Road does not have a strong action yet. Log a session or clear a habit and it will recompute.</p>
          )}
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="panel panel--span-2">
          <div className="panel-header"><div><h2>Alternate Paths</h2><p>Backup options if the main line is not the move you want right now.</p></div></div>
          <div className="quest-grid">
            {derived.road.alternates.length ? (
              derived.road.alternates.map((action) => (
                <div key={action.id} className="quest-card">
                  <div className="quest-card__header">
                    <div><h3>{action.title}</h3><p>{action.summary}</p></div>
                    <div className="reward-pill">~{action.estimatedXp || 0} XP</div>
                  </div>
                  <RoadActionDetails action={action} />
                  <div className="stack-list">
                    {action.reasons.slice(0, 3).map((reason) => <div key={reason} className="subpanel subpanel--compact"><strong>{reason}</strong></div>)}
                  </div>
                  <div className="quest-card__footer">
                    <span className="status-pill">Score {Math.round(action.score)}</span>
                    <button className="secondary-button quest-action-button" type="button" onClick={() => onExecuteAction(action)}>Take This Path</button>
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-state">No alternate paths yet.</p>
            )}
          </div>
        </div>
        <div className="panel panel--soft">
          <div className="panel-header"><div><h2>Road Signals</h2><p>The strongest live pressures feeding the engine right now.</p></div></div>
          <div className="stack-list">
            <div className="subpanel"><strong>Progress profile</strong><p>{derived.progressProfile.name} | {derived.progressProfile.reason}</p></div>
            <div className="subpanel"><strong>Balance window</strong><p>{derived.balanceBonusInfo.currentCategoryCount}/5 categories active</p></div>
            <div className="subpanel"><strong>Legendary pressure</strong><p>{derived.legendaryQuests.filter((quest) => !quest.claimed && quest.progressPercent >= 50).length} legendary goals are currently hot.</p></div>
            <div className="subpanel"><strong>Ultimate pressure</strong><p>{derived.ultimateQuests.filter((quest) => !quest.claimed && quest.progressPercent >= 25).length} ultimate goals are now in motion.</p></div>
          </div>
        </div>
      </section>
    </div>
  );
}

export function OverviewPage({ derived, onOpenSessionModal, xpFeedback }) {
  const readyDaily = derived.dailyQuests.filter((quest) => quest.complete && !quest.claimed).length;
  const readyLongArc =
    derived.longTermQuests.filter((quest) => quest.complete && !quest.claimed).length +
    derived.legendaryQuests.filter((quest) => quest.complete && !quest.claimed).length +
    derived.ultimateQuests.filter((quest) => quest.complete && !quest.claimed).length;

  return (
    <div className="page">
      <PageHeader
        eyebrow="Dashboard"
        title="Account Overview"
        body="This is the high-level snapshot: current power, what matters today, and which systems are ready to pay out right now."
        actions={
          <>
            <button className="primary-button" type="button" onClick={onOpenSessionModal}>Log Session</button>
            {xpFeedback ? <div className="feedback-banner"><strong>{xpFeedback.label}</strong><span>{xpFeedback.note}</span></div> : null}
          </>
        }
      />

      <section className="dashboard-grid dashboard-grid--overview">
        <div className="hero-card hero-card--overview panel--span-2">
          <div className="hero-stats">
            <div className="level-badge"><span>Mylo Level</span><strong>{derived.overallLevelInfo.level}</strong></div>
            <div className="stat-chip"><span>Total XP</span><strong>{derived.overallXp}</strong></div>
            <div className="stat-chip"><span>Forge Points</span><strong>{derived.forgePoints}</strong></div>
            <div className="stat-chip"><span>Rewards ready</span><strong>{readyDaily + readyLongArc}</strong></div>
          </div>
          <ProgressBar value={derived.overallLevelInfo.progressPercent} label={`${derived.overallLevelInfo.currentLevelXp} / ${derived.overallLevelInfo.xpForNextLevel} XP to next Mylo Level`} tone="ember" />
          <div className="subpanel"><strong>Road focus</strong><p>{derived.road.primary ? `${derived.road.primary.title} | ${derived.road.primary.summary}` : 'Log a session to activate The Road.'}</p></div>
        </div>
        <ProgressProfilePanel derived={derived} />
      </section>

      <section className="dashboard-grid">
        <div className="panel panel--span-2">
          <div className="panel-header"><div><h2>Recommended Actions</h2><p>Short strategic nudges that support the larger systems.</p></div></div>
          <div className="stack-list">
            {derived.recommendedActions.length ? derived.recommendedActions.map((action) => <div key={action.id} className="subpanel action-card"><strong>{action.title}</strong><p>{action.body}</p></div>) : <p className="empty-state">No recommendations yet.</p>}
          </div>
        </div>
        <div className="panel">
          <div className="panel-header"><div><h2>Today</h2><p>Quick live state.</p></div></div>
          <div className="stack-list">
            <div className="subpanel"><strong>Daily quests</strong><p>{readyDaily} ready | {derived.dailyQuestRerollInfo.rerollsUsed}/{derived.dailyQuestRerollInfo.rerollLimit} rerolls used</p></div>
            <div className="subpanel"><strong>Balanced Week</strong><p>{derived.balanceBonusInfo.currentCategoryCount}/5 categories active in the current window</p></div>
            <div className="subpanel"><strong>Latest note</strong><p>{derived.mostRecentSession?.note?.trim() || 'No recent session note yet.'}</p></div>
          </div>
        </div>
      </section>

      <section className="dashboard-grid">
        <WeeklySummarySnapshot weeklySummary={derived.weeklySummary} />
        <div className="panel panel--soft">
          <div className="panel-header"><div><h2>Recent Activity</h2><p>Recent wins, clears, and progression moments.</p></div></div>
          <div className="activity-list">
            {derived.activityFeed.length ? derived.activityFeed.slice(0, 6).map((activity) => (
              <div key={activity.id} className="activity-item activity-item--card">
                <div><strong>{activity.title}</strong><p>{activity.details}</p></div>
                <span>{new Date(activity.createdAt).toLocaleString()}</span>
              </div>
            )) : <p className="empty-state">Activity appears here after your first session or reward event.</p>}
          </div>
        </div>
      </section>
    </div>
  );
}

export function QuestJournalPage({ derived, uiState, onClaimQuest, onClaimWeeklyChallenge, onClaimLongTermQuest, onClaimLegendaryQuest, onClaimUltimateQuest, onToggleHabit, onRerollDailyQuest, onToggleQuestSection }) {
  const sections = uiState?.questSections || {};

  return (
    <div className="page">
      <PageHeader eyebrow="Quest Journal" title="Quest Journal" body="This is the mission hub: daily quests, habit checkoffs, weekly trials, milestone objectives, and the rarest long-arc campaigns." />

      <SectionToggleCard title="Daily Quests" subtitle={`${formatDisplayDate(derived.todayKey)} | Rerolls ${derived.dailyQuestRerollInfo.rerollsUsed}/${derived.dailyQuestRerollInfo.rerollLimit}`} isOpen={sections.daily} onToggle={() => onToggleQuestSection('daily')} tone="daily">
        <div className="quest-grid">
          {derived.dailyQuests.map((quest) => <QuestCard key={quest.id} quest={quest} onClaim={onClaimQuest} onReroll={onRerollDailyQuest} canReroll={quest.canReroll} tone="daily" />)}
        </div>
      </SectionToggleCard>

      <section className="dashboard-grid">
        <SectionToggleCard title="Habits" subtitle="Lightweight daily checkoffs that still feed the account." isOpen={sections.habits} onToggle={() => onToggleQuestSection('habits')} tone="habit">
          <div className="habit-grid">
            {derived.habitsToday.map((habit) => <HabitCard key={habit.id} habit={habit} onToggle={onToggleHabit} />)}
          </div>
        </SectionToggleCard>

        <SectionToggleCard title="Forge Trials" subtitle="Weekly objectives with bigger rewards and stronger urgency." isOpen={sections.weekly} onToggle={() => onToggleQuestSection('weekly')} tone="weekly">
          <div className="quest-grid">
            {derived.weeklyChallenges.map((challenge) => <QuestCard key={challenge.id} quest={challenge} onClaim={onClaimWeeklyChallenge} claimLabel="Claim Trial" tone="weekly" />)}
          </div>
        </SectionToggleCard>
      </section>

      <SectionToggleCard title="Long-Term Quests" subtitle="Milestone objectives that accumulate over time." isOpen={sections.longTerm} onToggle={() => onToggleQuestSection('longTerm')} tone="long">
        <div className="quest-grid">
          {derived.longTermQuests.map((quest) => <QuestCard key={quest.id} quest={quest} onClaim={onClaimLongTermQuest} claimLabel="Claim Long-Term Reward" tone="long" />)}
        </div>
      </SectionToggleCard>

      <section className="dashboard-grid">
        <SectionToggleCard title="Legendary Quests" subtitle="Rare campaign goals meant to take real time." isOpen={sections.legendary} onToggle={() => onToggleQuestSection('legendary')} tone="legendary">
          <div className="stack-list">
            {derived.legendaryQuests.map((quest) => <QuestCard key={quest.id} quest={quest} onClaim={onClaimLegendaryQuest} claimLabel="Claim Legendary Reward" showRequirements tone="legendary" />)}
          </div>
        </SectionToggleCard>
        <SectionToggleCard title="Ultimate Quests" subtitle="Prestige-scale account-defining objectives." isOpen={sections.ultimate} onToggle={() => onToggleQuestSection('ultimate')} tone="ultimate">
          <div className="stack-list">
            {derived.ultimateQuests.map((quest) => <QuestCard key={quest.id} quest={quest} onClaim={onClaimUltimateQuest} claimLabel="Claim Ultimate Reward" showRequirements tone="ultimate" />)}
          </div>
        </SectionToggleCard>
      </section>
    </div>
  );
}

export function ProjectsPage({ derived, projects, onSelectProject, onOpenSessionModal }) {
  return (
    <div className="page">
      <PageHeader eyebrow="Projects" title="Projects and Categories" body="Browse your crafts by category, see where time is going, and jump into individual project timelines." actions={<button className="primary-button" type="button" onClick={onOpenSessionModal}>Log Session</button>} />
      <section className="page-section">
        <div className="category-hub">
          {derived.categoryStats.map((category) => (
            <div key={category.id} className="panel category-hub__panel" style={{ '--category-accent': category.color }}>
              <div className="panel-header">
                <div><h2>{category.name}</h2><p>{category.projects.length} projects in this lane</p></div>
                <div className="reward-pill category-accent-pill">Lvl {category.levelInfo.level}</div>
              </div>
              <div className="category-metrics"><span>{category.totalXp} XP</span><span>{category.totalMinutes} min</span><span>Momentum +{derived.categoryMomentum[category.id].bonusPercent}%</span></div>
              <ProgressBar value={category.levelInfo.progressPercent} tone="steel" />
              <div className="project-grid">
                {category.projects.map((project) => {
                  const sourceProject = projects.find((entry) => entry.id === project.projectId);
                  return (
                    <button key={project.projectId} type="button" className="project-card project-card--category" onClick={() => onSelectProject(project.projectId)}>
                      <div className="project-card__header"><div><h3>{project.name}</h3><p>{sourceProject?.rate}x XP rate</p></div><div className="rate-badge">Lvl {project.levelInfo.level}</div></div>
                      <div className="project-card__stats"><span>{project.totalXp} XP</span><span>{project.totalMinutes} min</span><span>{project.sessionCount} sessions</span></div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function StatsPage({ derived, weeklyFocus, onWeeklyFocusChange, onClaimMilestone }) {
  return (
    <div className="page">
      <PageHeader eyebrow="Progress" title="Progress, Profile, and Clarity" body="Use this page to understand category balance, weekly story, milestone pressure, and the profile your current behavior is creating." />
      <section className="dashboard-grid">
        <WeeklyFocusPanel categories={derived.categoryStats} weeklyFocus={weeklyFocus} onWeeklyFocusChange={onWeeklyFocusChange} />
        <div className="panel panel--span-2 panel--chart">
          <div className="panel-header"><div><h2>Category Balance Radar</h2><p>A cleaner reading of where your account currently leans.</p></div></div>
          <CategoryRadarChart categories={derived.categoryStats} />
          <div className="category-legend">
            {derived.categoryStats.map((category) => <div key={category.id} className="legend-item"><span className="legend-dot" style={{ backgroundColor: category.color }} /><span>{category.name}</span><small>Lvl {category.levelInfo.level}</small></div>)}
          </div>
        </div>
        <ProgressProfilePanel derived={derived} />
      </section>

      <section className="dashboard-grid">
        <div className="panel panel--span-2">
          <div className="panel-header"><div><h2>Category Summary</h2><p>Levels, momentum, streaks, and totals across every category.</p></div></div>
          <div className="category-list">
            {derived.categoryStats.map((category) => (
              <div key={category.id} className="category-row category-row--card">
                <div><h3>{category.name}</h3><p>{category.totalMinutes} min logged</p></div>
                <div className="category-metrics"><span>Lvl {category.levelInfo.level}</span><span>{category.totalXp} XP</span><span>Momentum +{derived.categoryMomentum[category.id].bonusPercent}%</span><span>{derived.categoryStreaks[category.id]} day streak</span></div>
                <ProgressBar value={category.levelInfo.progressPercent} tone="steel" />
              </div>
            ))}
          </div>
        </div>
        <WeeklySummarySnapshot weeklySummary={derived.weeklySummary} />
      </section>

      <section className="dashboard-grid">
        <div className="panel panel--span-2">
          <div className="panel-header"><div><h2>Milestones</h2><p>Claimable highlight moments across the larger progression systems.</p></div></div>
          <div className="stack-list">
            {derived.milestoneHighlights.length ? derived.milestoneHighlights.map((milestone) => (
              <div key={milestone.id} className={`subpanel milestone-card ${milestone.claimed ? 'subpanel--claimed' : ''}`}>
                <div className="list-row">
                  <div><strong>{milestone.title}</strong><p>{milestone.body}</p></div>
                  <div className="reward-stack"><div className="reward-pill">+200 XP</div><div className="reward-pill reward-pill--points">+{milestone.rewardPoints} FP</div></div>
                </div>
                <div className="quest-card__footer">
                  <span className={`status-pill ${milestone.claimed ? 'status-pill--claimed' : 'status-pill--ready'}`}>{milestone.claimed ? 'Claimed' : 'Ready'}</span>
                  <button className="secondary-button quest-action-button" type="button" disabled={milestone.claimed} onClick={() => onClaimMilestone(milestone.id)}>{milestone.claimed ? 'Claimed' : 'Claim Milestone'}</button>
                </div>
              </div>
            )) : <p className="empty-state">Milestones will appear here as your account crosses bigger thresholds.</p>}
          </div>
        </div>
        <div className="panel">
          <div className="panel-header"><div><h2>Weekly Insight</h2><p>Tie-aware summary lines from the current review window.</p></div></div>
          <div className="stack-list">
            <div className="subpanel"><strong>Most active categories</strong><p>{formatNameList(derived.weeklySummary.mostActiveCategories, 'No category activity yet')}</p></div>
            <div className="subpanel"><strong>Most active projects</strong><p>{formatNameList(derived.weeklySummary.mostActiveProjects, 'No project activity yet')}</p></div>
            <div className="subpanel"><strong>Neglected categories</strong><p>{formatNameList(derived.weeklySummary.neglectedCategories, 'None')}</p></div>
          </div>
        </div>
      </section>
    </div>
  );
}

function PreferenceToggle({ title, body, checked, onChange }) {
  return (
    <label className="preference-card">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <div><strong>{title}</strong><span>{body}</span></div>
    </label>
  );
}

export function PerksPage({ derived, onPurchasePerk }) {
  const groupedPerks = derived.perks.reduce((accumulator, perk) => {
    accumulator[perk.category] = [...(accumulator[perk.category] || []), perk];
    return accumulator;
  }, {});

  return (
    <div className="page">
      <PageHeader eyebrow="Perks" title="Forge Points and Upgrades" body="Forge Points now act like a real progression economy. Spend them here on repeatable perks that change how the account grows." />
      <section className="dashboard-grid">
        <div className="hero-card hero-card--overview panel--span-2">
          <div className="hero-stats">
            <div className="level-badge"><span>Forge Points</span><strong>{derived.forgePoints}</strong></div>
            <div className="stat-chip"><span>Perk levels</span><strong>{derived.perks.reduce((sum, perk) => sum + perk.level, 0)}</strong></div>
            <div className="stat-chip"><span>Balance rewards</span><strong>{derived.balanceBonusInfo.events.length}</strong></div>
            <div className="stat-chip"><span>Ultimate clears</span><strong>{derived.ultimateQuests.filter((quest) => quest.claimed).length}</strong></div>
          </div>
          <div className="subpanel"><strong>Economy loop</strong><p>Forge Points come from quest clears, trials, milestones, balance rewards, and higher-tier objectives. Perks here feed directly back into XP, rewards, Road control, streaks, momentum, and utility.</p></div>
        </div>
        <ProgressProfilePanel derived={derived} />
      </section>
      {Object.entries(groupedPerks).map(([category, perks]) => (
        <section key={category} className="page-section">
          <div className="panel">
            <div className="panel-header"><div><h2>{category}</h2><p>Upgrade levels stack, and each next level has a visible cost and effect.</p></div></div>
            <div className="quest-grid">
              {perks.map((perk) => (
                <div key={perk.id} className={`quest-card perk-card ${perk.isMaxed ? 'quest-card--claimed' : ''}`}>
                  <div className="quest-card__header"><div><h3>{perk.title}</h3><p>{perk.description}</p></div><div className="reward-pill reward-pill--points">{perk.isMaxed ? 'Maxed' : `${perk.nextCost} FP`}</div></div>
                  <div className="stack-list">
                    <div className="subpanel subpanel--compact"><strong>Current</strong><p>Level {perk.level}/{perk.maxLevel} | {perk.currentEffect}</p></div>
                    <div className="subpanel subpanel--compact"><strong>Next</strong><p>{perk.nextEffect}</p></div>
                  </div>
                  <div className="quest-card__footer">
                    <span className={`status-pill ${perk.isMaxed ? 'status-pill--claimed' : perk.affordable ? 'status-pill--ready' : ''}`}>{perk.isMaxed ? 'Maxed' : perk.affordable ? 'Affordable' : 'Locked'}</span>
                    <button className="secondary-button quest-action-button" type="button" disabled={perk.isMaxed || !perk.affordable} onClick={() => onPurchasePerk(perk.id)}>{perk.isMaxed ? 'Maxed' : `Upgrade to ${perk.level + 1}`}</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}

export function SettingsPage({ uiState, onExportData, onImportData, onOpenTutorial, onResetProgress, onUpdatePreference, onToggleQuestSection }) {
  return (
    <div className="page">
      <PageHeader eyebrow="Settings" title="Settings and Local Controls" body="Everything in The Forge stays local. This page is for backup, restore, reset, help, and local UX preferences." />
      <section className="dashboard-grid">
        <div className="panel panel--span-2">
          <div className="panel-header"><div><h2>Experience Preferences</h2><p>Local-only behavior settings that shape how the app feels day to day.</p></div></div>
          <div className="preference-grid">
            <PreferenceToggle title="Confirm destructive actions" body="Ask before deletes and reset-style actions." checked={uiState.confirmDestructiveActions} onChange={(value) => onUpdatePreference('confirmDestructiveActions', value)} />
            <PreferenceToggle title="Road opens prefilled logging" body="Let The Road jump straight into a prefilled session flow." checked={uiState.roadAutoOpenPrefill} onChange={(value) => onUpdatePreference('roadAutoOpenPrefill', value)} />
            <PreferenceToggle title="Full feedback banners" body="Show richer XP and reward context after actions." checked={uiState.feedbackMode !== 'minimal'} onChange={(value) => onUpdatePreference('feedbackMode', value ? 'full' : 'minimal')} />
            <PreferenceToggle title="Daily quests expanded by default" body="Keep the Daily Quest section open when you revisit the journal." checked={uiState.questSections?.daily} onChange={() => onToggleQuestSection('daily')} />
          </div>
        </div>
        <div className="panel panel--soft">
          <div className="panel-header"><div><h2>Quest Journal Layout</h2><p>Collapse or expand any quest tier and keep that preference locally.</p></div></div>
          <div className="stack-list">
            {[
              ['daily', 'Daily Quests'],
              ['habits', 'Habits'],
              ['weekly', 'Forge Trials'],
              ['longTerm', 'Long-Term Quests'],
              ['legendary', 'Legendary Quests'],
              ['ultimate', 'Ultimate Quests'],
            ].map(([key, label]) => (
              <button key={key} className="ghost-button settings-chip" type="button" onClick={() => onToggleQuestSection(key)}>
                <strong>{label}</strong>
                <span>{uiState.questSections?.[key] ? 'Expanded' : 'Collapsed'}</span>
              </button>
            ))}
          </div>
        </div>
      </section>
      <UtilitiesPanel onExportData={onExportData} onImportData={onImportData} onOpenTutorial={onOpenTutorial} onResetProgress={onResetProgress} />
    </div>
  );
}

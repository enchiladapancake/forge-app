import { ProgressBar } from './ProgressBar';
import { CategoryRadarChart } from './CategoryRadarChart';
import { formatDisplayDate, getCategoryDefinition } from '../utils/progression';

function SectionIntro({ label, title, body }) {
  return (
    <div className="section-intro">
      <p className="eyebrow">{label}</p>
      <h2>{title}</h2>
      <p>{body}</p>
    </div>
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
}) {
  return (
    <div className={`quest-card ${quest.claimed ? 'quest-card--claimed' : quest.complete ? 'quest-card--complete' : ''}`}>
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

  const selectedFocus = categories.filter((category) => category.id === primaryId || secondaryIds.includes(category.id));

  return (
    <div className="panel panel--soft">
      <div className="panel-header">
        <div>
          <h3>Weekly Focus</h3>
          <p>Choose one primary lane and two secondary lanes for stronger new-session XP.</p>
        </div>
      </div>

      <div className="focus-form-grid">
        <label>
          Primary (+20%)
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
            Secondary {index + 1} (+10%)
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
        {selectedFocus.length ? (
          selectedFocus.map((category) => (
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

function BuildIdentityPanel({ buildIdentity, activeStreakDays, activeStreakBonusPercent, categoryStreaks, categories }) {
  const activeCategoryStreaks = categories
    .filter((category) => categoryStreaks[category.id] >= 2)
    .sort((left, right) => categoryStreaks[right.id] - categoryStreaks[left.id])
    .slice(0, 3);

  return (
    <div className="panel panel--soft">
      <div className="panel-header">
        <div>
          <h3>Build Identity</h3>
          <p>Your current pattern translated into a clear build style.</p>
        </div>
      </div>
      <div className="identity-card">
        <span className="identity-card__label">{buildIdentity.name}</span>
        <p>{buildIdentity.reason}</p>
      </div>
      <div className="summary-grid">
        <div className="summary-card">
          <span>Overall Streak</span>
          <strong>{activeStreakDays} days</strong>
        </div>
        <div className="summary-card">
          <span>Streak Bonus</span>
          <strong>+{activeStreakBonusPercent}%</strong>
        </div>
      </div>
      <div className="stack-list">
        {activeCategoryStreaks.length ? (
          activeCategoryStreaks.map((category) => (
            <div key={category.id} className="subpanel subpanel--compact">
              <strong>{category.name}</strong>
              <p>{categoryStreaks[category.id]} active days in a row</p>
            </div>
          ))
        ) : (
          <p className="empty-state">Category streaks appear once a lane gets at least 2 active days in a row.</p>
        )}
      </div>
    </div>
  );
}

function BalanceBonusPanel({ balanceBonusInfo }) {
  const progressPercent = Math.min((balanceBonusInfo.currentCategoryCount / 5) * 100, 100);
  const latestEvent = balanceBonusInfo.events[balanceBonusInfo.events.length - 1] || null;

  return (
    <div className="panel panel--soft">
      <div className="panel-header">
        <div>
          <h3>Balanced Week</h3>
          <p>Reach activity in 5 categories over the current 7-day window for a balance reward.</p>
        </div>
      </div>
      <ProgressBar value={progressPercent} label={`${Math.min(balanceBonusInfo.currentCategoryCount, 5)} / 5 categories active`} tone="steel" />
      <div className="balance-status">
        <strong>{balanceBonusInfo.isEligibleNow ? 'Balanced Week active' : 'Balance progress is building'}</strong>
        <p>
          {balanceBonusInfo.isEligibleNow
            ? 'You are inside the reward window right now.'
            : `${5 - balanceBonusInfo.currentCategoryCount} more categories needed in the current 7-day window.`}
        </p>
      </div>
      <small>
        {latestEvent
          ? `Latest reward earned on ${formatDisplayDate(latestEvent.date)} for +${latestEvent.rewardXp} XP and +${latestEvent.rewardPoints} FP.`
          : 'No Balance Bonus earned yet.'}
      </small>
    </div>
  );
}

function RecommendedActionsPanel({ actions }) {
  return (
    <div className="panel panel--soft">
      <div className="panel-header">
        <div>
          <h3>What To Do Next</h3>
          <p>Short suggestions pulled from quests, momentum, focus, balance, and weekly review signals.</p>
        </div>
      </div>
      <div className="stack-list">
        {actions.length ? (
          actions.map((action) => (
            <div key={action.id} className="subpanel action-card">
              <strong>{action.title}</strong>
              <p>{action.body}</p>
            </div>
          ))
        ) : (
          <p className="empty-state">Log a session and the app will start surfacing useful next steps.</p>
        )}
      </div>
    </div>
  );
}

function WeeklyChallengesPanel({ challenges, onClaim }) {
  return (
    <div className="panel panel--span-2">
      <div className="panel-header">
        <div>
          <h3>Forge Trials</h3>
          <p>Weekly objectives that reset with the real calendar week and reward bigger pushes.</p>
        </div>
      </div>
      <div className="quest-grid">
        {challenges.map((challenge) => (
          <QuestCard key={challenge.id} quest={challenge} onClaim={onClaim} claimLabel="Claim Trial" />
        ))}
      </div>
    </div>
  );
}

function WeeklySummaryPanel({ weeklySummary }) {
  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h3>Weekly Summary</h3>
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
          <span>Weekly Trials</span>
          <strong>{weeklySummary.weeklyChallengesCompleted}</strong>
        </div>
        <div className="summary-card">
          <span>Daily Quests</span>
          <strong>{weeklySummary.dailyQuestsCompleted}</strong>
        </div>
        <div className="summary-card">
          <span>Habits</span>
          <strong>{weeklySummary.habitsCompleted}</strong>
        </div>
      </div>
      <div className="stack-list">
        <div className="subpanel">
          <strong>Most active categories</strong>
          <p>{formatNameList(weeklySummary.mostActiveCategories, 'No category activity yet')}</p>
        </div>
        <div className="subpanel">
          <strong>Most active projects</strong>
          <p>{formatNameList(weeklySummary.mostActiveProjects, 'No project activity yet')}</p>
        </div>
        <div className="subpanel">
          <strong>Neglected categories</strong>
          <p>{formatNameList(weeklySummary.neglectedCategories, 'None')}</p>
        </div>
        <div className="subpanel">
          <strong>Momentum highlights</strong>
          <p>{weeklySummary.momentumHighlights.length ? weeklySummary.momentumHighlights.join(' | ') : 'No strong momentum lanes yet.'}</p>
        </div>
        <div className="subpanel">
          <strong>Long-term watch</strong>
          <p>{weeklySummary.longTermQuestHighlights.length ? weeklySummary.longTermQuestHighlights.join(' | ') : 'No long-term quests near completion yet.'}</p>
        </div>
        <div className="subpanel">
          <strong>Legendary watch</strong>
          <p>{weeklySummary.legendaryQuestHighlights.length ? weeklySummary.legendaryQuestHighlights.join(' | ') : 'No legendary quest pressure points yet.'}</p>
        </div>
        <div className="subpanel">
          <strong>Build summary</strong>
          <p>
            {weeklySummary.buildIdentity.name} | {weeklySummary.buildIdentity.reason}
          </p>
        </div>
        <div className="subpanel">
          <strong>Balance and streak</strong>
          <p>
            {weeklySummary.balancedWeekAchieved ? 'Balanced Week landed this review window' : 'No Balanced Week this review window yet'}
            {' | '}
            {weeklySummary.streakHighlights.length ? weeklySummary.streakHighlights.join(' | ') : 'No active streak highlight'}
          </p>
        </div>
      </div>
    </div>
  );
}

function MilestonePanel({ milestones, onClaim }) {
  return (
    <div className="panel panel--soft">
      <div className="panel-header">
        <div>
          <h3>Milestones</h3>
          <p>Major progression moments worth acknowledging and cashing in.</p>
        </div>
      </div>
      <div className="stack-list">
        {milestones.length ? (
          milestones.map((milestone) => (
            <div key={milestone.id} className={`subpanel milestone-card ${milestone.claimed ? 'subpanel--claimed' : ''}`}>
              <div className="list-row">
                <div>
                  <strong>{milestone.title}</strong>
                  <p>{milestone.body}</p>
                </div>
                <div className="reward-stack">
                  <div className="reward-pill">+200 XP</div>
                  <div className="reward-pill reward-pill--points">+{milestone.rewardPoints} FP</div>
                </div>
              </div>
              <div className="quest-card__footer">
                <span className={`status-pill ${milestone.claimed ? 'status-pill--claimed' : 'status-pill--ready'}`}>{milestone.claimed ? 'Claimed' : 'Ready'}</span>
                <button className="secondary-button quest-action-button" type="button" disabled={milestone.claimed} onClick={() => onClaim(milestone.id)}>
                  {milestone.claimed ? 'Claimed' : 'Claim Milestone'}
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="empty-state">Big progression moments will appear here as your account grows.</p>
        )}
      </div>
    </div>
  );
}

function CurrencyPanel({ forgePoints, perks, balanceBonusInfo }) {
  const purchasedCount = perks.filter((perk) => perk.purchased).length;

  return (
    <div className="panel panel--soft">
      <div className="panel-header">
        <div>
          <h3>Forge Points</h3>
          <p>Your strategic currency for permanent account perks.</p>
        </div>
      </div>
      <div className="summary-grid">
        <div className="summary-card">
          <span>Balance</span>
          <strong>{forgePoints}</strong>
        </div>
        <div className="summary-card">
          <span>Perks Unlocked</span>
          <strong>{purchasedCount}/{perks.length}</strong>
        </div>
      </div>
      <small>
        Quest clears, milestones, weekly trials, and Balanced Week rewards all feed this currency layer. Current balance rewards earned: {balanceBonusInfo.totalPoints} FP.
      </small>
    </div>
  );
}

function PerksPanel({ perks, onPurchase }) {
  return (
    <div className="panel panel--span-2">
      <div className="panel-header">
        <div>
          <h3>Perks</h3>
          <p>Permanent upgrades that lightly shape your build without overpowering the progression loop.</p>
        </div>
      </div>
      <div className="quest-grid">
        {perks.map((perk) => (
          <div key={perk.id} className={`quest-card ${perk.purchased ? 'quest-card--claimed' : ''}`}>
            <div className="quest-card__header">
              <div>
                <h3>{perk.title}</h3>
                <p>{perk.description}</p>
              </div>
              <div className="reward-pill reward-pill--points">{perk.cost} FP</div>
            </div>
            <div className="quest-card__footer">
              <span className={`status-pill ${perk.purchased ? 'status-pill--claimed' : perk.affordable ? 'status-pill--ready' : ''}`}>
                {perk.purchased ? 'Unlocked' : perk.affordable ? 'Affordable' : 'Locked'}
              </span>
              <button className="secondary-button quest-action-button" type="button" disabled={perk.purchased || !perk.affordable} onClick={() => onPurchase(perk.id)}>
                {perk.purchased ? 'Unlocked' : 'Unlock'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function UtilitiesPanel({ onExportData, onImportData, onOpenTutorial, onResetProgress }) {
  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h3>Utilities</h3>
          <p>Backup, restore, revisit the systems, or start fresh.</p>
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
          <span>Revisit the built-in tutorial.</span>
        </button>
        <button className="danger-button utility-button" type="button" onClick={onResetProgress}>
          <strong>Reset Progress</strong>
          <span>Erase local progress and start clean.</span>
        </button>
      </div>
    </div>
  );
}

export function Dashboard({
  derived,
  projects,
  onSelectProject,
  onOpenSessionModal,
  onClaimQuest,
  onClaimWeeklyChallenge,
  onClaimLongTermQuest,
  onClaimLegendaryQuest,
  onClaimMilestone,
  onToggleHabit,
  onExportData,
  onImportData,
  onResetProgress,
  onOpenTutorial,
  weeklyFocus,
  onWeeklyFocusChange,
  onPurchasePerk,
  onRerollDailyQuest,
  xpFeedback,
}) {
  const latestNote = derived.mostRecentSession?.note?.trim();
  const claimedLongTermQuests = derived.longTermQuests.filter((quest) => quest.claimed).length;
  const claimedLegendaryQuests = derived.legendaryQuests.filter((quest) => quest.claimed).length;

  return (
    <div className="page page--dashboard">
      <section className="hero-card hero-card--overview">
        <div className="hero-copy-block">
          <p className="eyebrow">Overview</p>
          <h1>The Forge</h1>
          <p className="hero-copy">A local progression system built for long arcs, real refresh cycles, strategic tradeoffs, and cleaner reasons to keep coming back.</p>
        </div>

        <div className="hero-actions hero-actions--compact">
          <button className="primary-button" type="button" onClick={onOpenSessionModal}>
            Log Session
          </button>
          {xpFeedback ? (
            <div className="feedback-banner">
              <strong>{xpFeedback.label}</strong>
              <span>{xpFeedback.note}</span>
            </div>
          ) : null}
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
            <span>Forge Points</span>
            <strong>{derived.forgePoints}</strong>
          </div>
          <div className="stat-chip">
            <span>Legendary Quests</span>
            <strong>{claimedLegendaryQuests}/{derived.legendaryQuests.length}</strong>
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

        <div className="hero-note">
          <span>Bonus XP tracked separately:</span> {derived.bonusXp}
        </div>
      </section>

      <section className="section-block">
        <SectionIntro
          label="Strategy"
          title="Shape the week instead of just recording it"
          body="Weekly Focus, Forge Trials, balance rewards, momentum, and streaks now work together as a real strategy layer."
        />
        <div className="dashboard-grid">
          <WeeklyFocusPanel categories={derived.categoryStats} weeklyFocus={weeklyFocus} onWeeklyFocusChange={onWeeklyFocusChange} />
          <BuildIdentityPanel
            buildIdentity={derived.buildIdentity}
            activeStreakDays={derived.activeStreakDays}
            activeStreakBonusPercent={derived.activeStreakBonusPercent}
            categoryStreaks={derived.categoryStreaks}
            categories={derived.categoryStats}
          />
          <BalanceBonusPanel balanceBonusInfo={derived.balanceBonusInfo} />
          <RecommendedActionsPanel actions={derived.recommendedActions} />
          <WeeklyChallengesPanel challenges={derived.weeklyChallenges} onClaim={onClaimWeeklyChallenge} />
        </div>
      </section>

      <section className="section-block">
        <SectionIntro
          label="Progress Visualization"
          title="Read the shape of your account"
          body="The radar chart, category levels, and live momentum cards show how broad or narrow your growth is becoming."
        />
        <div className="dashboard-grid">
          <div className="panel">
            <div className="panel-header">
              <div>
                <h3>Category Balance</h3>
                <p>A cleaner view of how category progress is shaping the account.</p>
              </div>
            </div>
            <CategoryRadarChart categories={derived.categoryStats} />
            <div className="category-legend">
              {derived.categoryStats.map((category) => (
                <div key={category.id} className="legend-item">
                  <span className="legend-dot" style={{ backgroundColor: category.color }} />
                  <span>{category.name}</span>
                  <small>Lvl {category.levelInfo.level}</small>
                </div>
              ))}
            </div>
          </div>

          <div className="panel panel--span-2">
            <div className="panel-header">
              <div>
                <h3>Category Summary</h3>
                <p>Levels, momentum, and category streaks across the whole account.</p>
              </div>
            </div>
            <div className="category-list">
              {derived.categoryStats.map((category) => (
                <div key={category.id} className="category-row category-row--card">
                  <div>
                    <h4>{category.name}</h4>
                    <p>{category.totalMinutes} min logged</p>
                  </div>
                  <div className="category-metrics">
                    <span>Lvl {category.levelInfo.level}</span>
                    <span>{category.totalXp} XP</span>
                    <span>Momentum +{derived.categoryMomentum[category.id].bonusPercent}%</span>
                    <span>{derived.categoryStreaks[category.id]} day streak</span>
                  </div>
                  <ProgressBar value={category.levelInfo.progressPercent} tone="steel" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section-block">
        <SectionIntro
          label="Quest Journal"
          title="Layer short goals, milestones, and campaign-scale objectives"
          body="Daily Quests refresh each calendar day, Forge Trials refresh each calendar week, and the longer tiers stay with the account until you finish them."
        />
        <div className="dashboard-grid">
          <div className="panel panel--span-2">
            <div className="panel-header">
              <div>
                <h3>Daily Quests</h3>
                <p>
                  {formatDisplayDate(derived.todayKey)} | Rerolls {derived.dailyQuestRerollInfo.rerollsUsed}/{derived.dailyQuestRerollInfo.rerollLimit}
                </p>
              </div>
            </div>
            <div className="quest-grid">
              {derived.dailyQuests.map((quest) => (
                <QuestCard key={quest.id} quest={quest} onClaim={onClaimQuest} onReroll={onRerollDailyQuest} canReroll={quest.canReroll} />
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <div>
                <h3>Habits</h3>
                <p>Small wins that keep the day alive.</p>
              </div>
            </div>
            <div className="habit-grid">
              {derived.habitsToday.map((habit) => (
                <HabitCard key={habit.id} habit={habit} onToggle={onToggleHabit} />
              ))}
            </div>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="panel panel--span-2">
            <div className="panel-header">
              <div>
                <h3>Long-Term Quests</h3>
                <p>Milestone objectives that accumulate over time and reward both XP and Forge Points.</p>
              </div>
            </div>
            <div className="quest-grid">
              {derived.longTermQuests.map((quest) => (
                <QuestCard key={quest.id} quest={quest} onClaim={onClaimLongTermQuest} claimLabel="Claim Long-Term Reward" />
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <div>
                <h3>Legendary Quests</h3>
                <p>Major campaign objectives meant to span weeks or months.</p>
              </div>
            </div>
            <div className="stack-list">
              {derived.legendaryQuests.map((quest) => (
                <QuestCard key={quest.id} quest={quest} onClaim={onClaimLegendaryQuest} claimLabel="Claim Legendary Reward" showRequirements />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section-block">
        <SectionIntro
          label="Weekly Summary"
          title="Turn the last seven days into a readable story"
          body="This panel now captures XP, Forge Points, balance success, ties in activity, build identity, and which deeper objectives are getting close."
        />
        <div className="dashboard-grid">
          <WeeklySummaryPanel weeklySummary={derived.weeklySummary} />
          <MilestonePanel milestones={derived.milestoneHighlights} onClaim={onClaimMilestone} />
        </div>
      </section>

      <section className="section-block">
        <SectionIntro
          label="Perks"
          title="Convert major progress into permanent account power"
          body="Forge Points unlock small but meaningful upgrades that shape how future sessions, quests, and balance rewards behave."
        />
        <div className="dashboard-grid">
          <CurrencyPanel forgePoints={derived.forgePoints} perks={derived.perks} balanceBonusInfo={derived.balanceBonusInfo} />
          <PerksPanel perks={derived.perks} onPurchase={onPurchasePerk} />
        </div>
      </section>

      <section className="section-block">
        <SectionIntro
          label="Projects"
          title="Level each craft directly"
          body="Projects remain the core source of truth for XP, levels, notes, achievements, and the rest of the account."
        />
        <div className="panel">
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
                  <ProgressBar value={stats.levelInfo.progressPercent} label={`${stats.levelInfo.currentLevelXp} / ${stats.levelInfo.xpForNextLevel} XP`} />
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section-block">
        <SectionIntro
          label="Activity"
          title="See the story of your recent progress"
          body="Sessions, quests, balance rewards, perks, milestones, and habits all surface here so the account feels alive instead of silent."
        />
        <div className="dashboard-grid">
          <div className="panel">
            <div className="panel-header">
              <div>
                <h3>Most Recent Session Note</h3>
                <p>{derived.mostRecentSession ? formatDisplayDate(derived.mostRecentSession.date) : 'No sessions yet'}</p>
              </div>
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

            <div className="subpanel">
              <strong>Quest Tier Snapshot</strong>
              <p>
                Daily ready: {derived.dailyQuests.filter((quest) => quest.complete && !quest.claimed).length} | Long-term claimed: {claimedLongTermQuests}/{derived.longTermQuests.length} | Legendary claimed: {claimedLegendaryQuests}/{derived.legendaryQuests.length}
              </p>
            </div>
          </div>

          <div className="panel panel--span-2">
            <div className="panel-header">
              <div>
                <h3>Recent Activity</h3>
                <p>Readable context for sessions, quests, weekly clears, milestones, and account upgrades.</p>
              </div>
            </div>
            <div className="activity-list">
              {derived.activityFeed.length ? (
                derived.activityFeed.map((activity) => (
                  <div key={activity.id} className="activity-item activity-item--card">
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
        </div>
      </section>

      <section className="section-block">
        <SectionIntro
          label="Utilities"
          title="Keep your data safe and the systems understandable"
          body="Everything stays local, but you can still back up, restore, reset, and revisit the tutorial whenever you need."
        />
        <UtilitiesPanel onExportData={onExportData} onImportData={onImportData} onOpenTutorial={onOpenTutorial} onResetProgress={onResetProgress} />
      </section>
    </div>
  );
}

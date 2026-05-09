/**
 * WeeklySummaryCards — 4 category-specific cards showing this week's training.
 * Athlete OS: hard borders, monospace numbers, day-of-week dots.
 * Cards: Foundation / Run / Strength / Badminton
 * Targets read from challenge_v2.json — zero hardcoded values.
 */
import {
  Activity,
  getTrainingCategory,
  getThisWeekActivities,
  GROUP_CONFIG,
  parseWinLoss,
} from "@/lib/activities";
import type { Quest, WeeklyTargets, MainQuest } from "@/lib/challenge";
import { toLocalDateStr } from "@/lib/challenge";

interface Props {
  activities: Activity[];
  weeklyTargets: WeeklyTargets;
  quests: Quest[];
  mainQuest: MainQuest;
  challengeStartDate: string;
}

const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

function getDayOfWeek(dateStr: string): number {
  const d = new Date(dateStr);
  return (d.getDay() + 6) % 7; // 0=Mon, 6=Sun
}

function getThisWeekMonday(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.getFullYear(), now.getMonth(), diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function DayDots({ activeDays, color }: { activeDays: Set<number>; color: string }) {
  const now = new Date();
  const todayDow = (now.getDay() + 6) % 7;

  return (
    <div className="flex gap-1 mt-3">
      {WEEKDAY_LABELS.map((label, i) => {
        const done = activeDays.has(i);
        const isFuture = i > todayDow;
        return (
          <div key={i} className="flex flex-col items-center gap-1">
            <div
              className="w-3.5 h-3.5 flex items-center justify-center text-[8px] font-bold"
              style={{
                backgroundColor: done ? color : "transparent",
                color: done ? "#fff" : isFuture ? "#ccc" : "#999",
                border: done ? "none" : `1.5px solid ${isFuture ? "#ddd" : "#bbb"}`,
              }}
            >
              {label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ProgressBar({ current, target, color }: { current: number; target: number; color: string }) {
  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  return (
    <div className="h-2 bg-muted mt-2 overflow-hidden">
      <div className="h-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

function SummaryCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-2 border-foreground p-4">
      {children}
    </div>
  );
}

// Foundation: derived from quest data (default_done polarity)
function FoundationCard({ quest, target }: { quest: Quest | undefined; target: number }) {
  const config = GROUP_CONFIG.foundation;
  const monday = getThisWeekMonday();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let count = 0;
  const activeDays = new Set<number>();

  if (quest) {
    const qStart = new Date(quest.start_date + "T00:00:00");
    const effectiveStart = qStart > monday ? qStart : monday;
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const effectiveEnd = today < sunday ? today : sunday;

    const missed = new Set(quest.missed_dates ?? []);
    const excused = new Set(quest.excused_dates ?? []);
    const allMissed = new Set([...missed, ...excused]);

    const d = new Date(effectiveStart);
    while (d <= effectiveEnd) {
      const ds = toLocalDateStr(d);
      const dow = (d.getDay() + 6) % 7;
      if (!allMissed.has(ds)) {
        count++;
        activeDays.add(dow);
      }
      d.setDate(d.getDate() + 1);
    }
  }

  return (
    <SummaryCard>
      <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">
        {config.label}
      </h3>
      <div className="flex items-baseline gap-1">
        <span className="metric-lg">{count}</span>
        <span className="text-sm text-muted-foreground font-mono">/{target}</span>
      </div>
      <ProgressBar current={count} target={target} color={config.color} />
      <DayDots activeDays={activeDays} color={config.color} />
    </SummaryCard>
  );
}

// Run: weekly count + pace toward the main quest total (15 runs by June 5)
function RunCard({ activities, challengeStartDate, mainQuest }: {
  activities: Activity[];
  challengeStartDate: string;
  mainQuest: MainQuest;
}) {
  const config = GROUP_CONFIG.run;
  const thisWeek = getThisWeekActivities(activities);
  const runsThisWeek = thisWeek.filter((a) => getTrainingCategory(a) === "run");
  const activeDays = new Set(runsThisWeek.map((a) => getDayOfWeek(a.start_date_local)));

  // Total runs since challenge start
  const totalRuns = activities.filter(
    (a) => getTrainingCategory(a) === "run" && a.start_date_local.slice(0, 10) >= challengeStartDate
  ).length;

  const target = mainQuest.target;

  // Pace: runs needed per week to hit target by event_date
  let paceLabel: string | null = null;
  if (mainQuest.event_date) {
    const now = new Date();
    const eventDate = new Date(mainQuest.event_date);
    const daysLeft = Math.max(Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)), 0);
    const weeksLeft = Math.max(daysLeft / 7, 0.1);
    const runsLeft = Math.max(target - totalRuns, 0);
    const needed = (runsLeft / weeksLeft).toFixed(1);
    paceLabel = `${totalRuns}/${target} total · ${needed}/wk needed`;
  }

  return (
    <SummaryCard>
      <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">
        {config.label}
      </h3>
      <div className="flex items-baseline gap-1">
        <span className="metric-lg">{runsThisWeek.length}</span>
        <span className="text-sm text-muted-foreground font-mono">this week</span>
      </div>
      {paceLabel && (
        <div className="mt-2 text-[10px] font-mono text-muted-foreground">{paceLabel}</div>
      )}
      <ProgressBar current={totalRuns} target={target} color={config.color} />
      <DayDots activeDays={activeDays} color={config.color} />
    </SummaryCard>
  );
}

// Strength: weekly sessions toward the 3x/week target
function StrengthCard({ activities, target }: { activities: Activity[]; target: number }) {
  const config = GROUP_CONFIG.strength;
  const thisWeek = getThisWeekActivities(activities);
  const strengthThisWeek = thisWeek.filter((a) => getTrainingCategory(a) === "strength");
  const activeDays = new Set(strengthThisWeek.map((a) => getDayOfWeek(a.start_date_local)));
  const count = strengthThisWeek.length;

  const workoutTypes = strengthThisWeek.map((a) => {
    const match = a.name.match(/Strength\s+(A|B)/i);
    return match ? `Strength ${match[1]}` : a.name;
  });

  return (
    <SummaryCard>
      <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">
        {config.label}
      </h3>
      <div className="flex items-baseline gap-1">
        <span className="metric-lg">{count}</span>
        <span className="text-sm text-muted-foreground font-mono">/{target}</span>
      </div>
      <ProgressBar current={count} target={target} color={config.color} />
      {workoutTypes.length > 0 ? (
        <div className="mt-3 space-y-1">
          {workoutTypes.map((wt, i) => (
            <div key={i} className="text-[10px] font-mono text-muted-foreground">
              <span style={{ color: config.color }}>&#10003;</span> {wt}
            </div>
          ))}
        </div>
      ) : (
        <DayDots activeDays={activeDays} color={config.color} />
      )}
    </SummaryCard>
  );
}

// Badminton: session count + optional win/loss record (no weekly target currently)
function BadmintonCard({ activities, target }: { activities: Activity[]; target: number }) {
  const thisWeek = getThisWeekActivities(activities);
  const config = GROUP_CONFIG.badminton;
  const badmintonCategories = new Set(config.categories);
  const badThisWeek = thisWeek.filter((a) => badmintonCategories.has(getTrainingCategory(a)));
  const activeDays = new Set(badThisWeek.map((a) => getDayOfWeek(a.start_date_local)));
  const count = badThisWeek.length;

  let rankedWins = 0, rankedLosses = 0, allWins = 0, allLosses = 0;
  for (const a of badThisWeek) {
    const wl = parseWinLoss(a.description);
    if (wl) {
      const cat = getTrainingCategory(a);
      if (cat === "badminton_ranked" || cat === "badminton_league") {
        rankedWins += wl.ranked.wins;
        rankedLosses += wl.ranked.losses;
      }
      allWins += wl.all.wins;
      allLosses += wl.all.losses;
    }
  }
  const hasRecord = allWins + allLosses > 0;
  const hasRanked = rankedWins + rankedLosses > 0;
  const hasFriendlies = allWins + allLosses !== rankedWins + rankedLosses;

  return (
    <SummaryCard>
      <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">
        {config.label}
      </h3>
      <div className="flex items-baseline gap-2">
        <span className="metric-lg">{count}</span>
        {target > 0 && (
          <span className="text-sm text-muted-foreground font-mono">/{target}</span>
        )}
        {hasRecord && (
          <div className="flex flex-col ml-2">
            <span className="text-xs font-mono text-muted-foreground">
              {allWins}W–{allLosses}L
            </span>
            {hasRanked && hasFriendlies && (
              <span className="text-[10px] font-mono text-muted-foreground/60">
                Ranked: {rankedWins}W–{rankedLosses}L
              </span>
            )}
          </div>
        )}
      </div>
      {target > 0 && <ProgressBar current={count} target={target} color={config.color} />}
      <DayDots activeDays={activeDays} color={config.color} />
    </SummaryCard>
  );
}

export function WeeklySummaryCards({ activities, weeklyTargets, quests, mainQuest, challengeStartDate }: Props) {
  const foundationQuest = quests.find((q) => q.id === "foundation");

  return (
    <div className="container pt-6">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-6">
        <FoundationCard quest={foundationQuest} target={weeklyTargets.foundation} />
        <RunCard activities={activities} challengeStartDate={challengeStartDate} mainQuest={mainQuest} />
        <StrengthCard activities={activities} target={weeklyTargets.strength} />
        <BadmintonCard activities={activities} target={weeklyTargets.badminton} />
      </div>
    </div>
  );
}
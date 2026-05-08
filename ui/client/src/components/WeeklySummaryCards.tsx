/**
 * WeeklySummaryCards — 4 category-specific cards showing this week's training.
 * Athlete OS: hard borders, monospace numbers, day-of-week dots.
 * v3: Weekly targets read from challenge_v2.json via props — zero hardcoded targets.
 */
import {
  Activity,
  getTrainingCategory,
  getThisWeekActivities,
  formatDistance,
  formatDurationShort,
  totalTime,
  parseWinLoss,
  GROUP_CONFIG,
} from "@/lib/activities";
import type { Quest, WeeklyTargets } from "@/lib/challenge";
import { toLocalDateStr } from "@/lib/challenge";

interface Props {
  activities: Activity[];
  weeklyTargets: WeeklyTargets;
  quests: Quest[];
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

function DayDots({ activeDays, target, color }: { activeDays: Set<number>; target?: number; color: string }) {
  const now = new Date();
  const todayDow = (now.getDay() + 6) % 7;

  return (
    <div className="flex gap-1 mt-3">
      {WEEKDAY_LABELS.map((label, i) => {
        const done = activeDays.has(i);
        const isFuture = i > todayDow;
        const isTarget = target ? i < target : i < 7;

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
  const pct = Math.min((current / target) * 100, 100);
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

/**
 * Foundation count derived from quest data (default_done polarity):
 * eligible days this week - missed - excused = completed.
 * Day dots also derived from quest data, not Strava.
 */
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

    // Walk each day of the week
    const d = new Date(effectiveStart);
    while (d <= effectiveEnd) {
      const ds = toLocalDateStr(d);
      const dow = (d.getDay() + 6) % 7; // 0=Mon
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
      <DayDots activeDays={activeDays} target={7} color={config.color} />
    </SummaryCard>
  );
}

function CalisthenicsCard({ activities, target }: { activities: Activity[]; target: number }) {
  const thisWeek = getThisWeekActivities(activities);
  const config = GROUP_CONFIG.calisthenics;
  const calThisWeek = thisWeek.filter((a) => getTrainingCategory(a) === "calisthenics");
  const activeDays = new Set(calThisWeek.map((a) => getDayOfWeek(a.start_date_local)));
  const count = calThisWeek.length;

  // Extract workout type from name (e.g., "Calisthenics #7: FL & Handstand" → "FL & Handstand")
  const workoutTypes = calThisWeek.map((a) => {
    const match = a.name.match(/Calisthenics\s*#\d+:\s*(.+)/i);
    return match ? match[1].trim() : "Session";
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
      {workoutTypes.length > 0 && (
        <div className="mt-3 space-y-1">
          {workoutTypes.map((wt, i) => (
            <div key={i} className="text-[10px] font-mono text-muted-foreground">
              <span style={{ color: config.color }}>&#10003;</span> {wt}
            </div>
          ))}
        </div>
      )}
      {workoutTypes.length === 0 && (
        <DayDots activeDays={activeDays} color={config.color} />
      )}
    </SummaryCard>
  );
}

function BadmintonCard({ activities, target }: { activities: Activity[]; target: number }) {
  const thisWeek = getThisWeekActivities(activities);
  const config = GROUP_CONFIG.badminton;
  const badmintonCategories = new Set(config.categories);
  const badThisWeek = thisWeek.filter((a) => badmintonCategories.has(getTrainingCategory(a)));
  const activeDays = new Set(badThisWeek.map((a) => getDayOfWeek(a.start_date_local)));
  const count = badThisWeek.length;

  // Aggregate win/loss from descriptions.
  // Only badminton_ranked sessions (Monday Hit & Run) count toward ranked record.
  // Friendly sessions (Thursday) have a summary line that reflects friendly games,
  // not ranked games — including them in rankedWins/rankedLosses was the bug.
  let rankedWins = 0;
  let rankedLosses = 0;
  let allWins = 0;
  let allLosses = 0;
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
        <span className="text-sm text-muted-foreground font-mono">/{target}</span>
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
      <ProgressBar current={count} target={target} color={config.color} />
      <DayDots activeDays={activeDays} color={config.color} />
    </SummaryCard>
  );
}

function RidesCard({ activities }: { activities: Activity[] }) {
  const thisWeek = getThisWeekActivities(activities);
  const config = GROUP_CONFIG.ride;
  const ridesThisWeek = thisWeek.filter((a) => getTrainingCategory(a) === "ride");
  const count = ridesThisWeek.length;
  const totalDist = ridesThisWeek.reduce((sum, a) => sum + (a.distance || 0), 0);
  const totalSec = totalTime(ridesThisWeek);

  return (
    <SummaryCard>
      <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">
        {config.label}
      </h3>
      <div className="flex items-baseline gap-2">
        <span className="metric-lg">{count}</span>
        <span className="text-xs text-muted-foreground uppercase">rides</span>
      </div>
      {totalDist > 0 && (
        <div className="mt-2 flex gap-4">
          <div>
            <div className="metric-sm">{formatDistance(totalDist)}</div>
            <div className="text-[9px] text-muted-foreground uppercase">Distance</div>
          </div>
          <div>
            <div className="metric-sm">{formatDurationShort(totalSec)}</div>
            <div className="text-[9px] text-muted-foreground uppercase">Time</div>
          </div>
        </div>
      )}
    </SummaryCard>
  );
}

export function WeeklySummaryCards({ activities, weeklyTargets, quests }: Props) {
  const foundationQuest = quests.find((q) => q.id === "foundation");

  return (
    <div className="container pt-6">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-6">
        <FoundationCard quest={foundationQuest} target={weeklyTargets.foundation} />
        <CalisthenicsCard activities={activities} target={weeklyTargets.calisthenics} />
        <BadmintonCard activities={activities} target={weeklyTargets.badminton} />
        <RidesCard activities={activities} />
      </div>
    </div>
  );
}

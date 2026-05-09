/**
 * RunAnalytics — Run performance page for the Birthday Run Season.
 * Shows: progress toward 15-run goal, weekly distance, pace trend,
 * Zone 2 compliance, and per-run history.
 *
 * TO SWAP BACK TO BADMINTON ANALYTICS: see BadmintonAnalytics.tsx header comment.
 */
import { useMemo } from "react";
import activitiesData from "@/data/activities.json";
import challengeDataRaw from "@/data/challenge_v2.json";
import syncStatusData from "@/data/sync_status.json";
import type { ChallengeV2 } from "@/lib/challenge";
import {
  Activity,
  getTrainingCategory,
  computeFoundationStreak,
  groupByWeek,
  formatDistance,
  HR_ZONE_LABELS,
} from "@/lib/activities";
import { CommandStrip } from "@/components/CommandStrip";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";

const activitiesRaw = activitiesData as Activity[];
const challengeData = challengeDataRaw as unknown as ChallengeV2;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function paceSecPerKm(activity: Activity): number | null {
  if (!activity.distance || !activity.moving_time) return null;
  return activity.moving_time / (activity.distance / 1000);
}

function formatPace(secPerKm: number): string {
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${s.toString().padStart(2, "0")} /km`;
}

function zone2Pct(activity: Activity): number | null {
  if (!activity.hr_zones) return null;
  const z2 = activity.hr_zones["Zone 2"]?.seconds ?? 0;
  const total = Object.values(activity.hr_zones).reduce((s, z) => s + z.seconds, 0);
  if (total === 0) return null;
  return Math.round((z2 / total) * 100);
}

function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.max(Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)), 0);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-2 border-foreground p-4">
      <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">{title}</h3>
      {children}
    </div>
  );
}

function StatBox({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="border-2 border-foreground p-4">
      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">{label}</div>
      <div className="text-2xl font-mono font-black leading-none">{value}</div>
      {sub && <div className="text-[10px] font-mono text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

function WeeklyDistanceChart({ runs }: { runs: Activity[] }) {
  const data = useMemo(() => {
    const weeks = groupByWeek(runs);
    return Array.from(weeks.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-10)
      .map(([weekKey, acts]) => {
        const d = new Date(weekKey);
        const totalKm = acts.reduce((s, a) => s + (a.distance ?? 0), 0) / 1000;
        return {
          week: `${d.getDate()}/${d.getMonth() + 1}`,
          km: Math.round(totalKm * 10) / 10,
        };
      });
  }, [runs]);

  return (
    <ChartCard title="Weekly Distance">
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data} barCategoryGap="25%">
          <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#999" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 9, fill: "#999" }} axisLine={false} tickLine={false} width={28} tickFormatter={(v) => `${v}k`} />
          <Tooltip
            contentStyle={{ background: "#000", border: "none", color: "#fff", fontSize: 11, fontFamily: "Space Mono, monospace" }}
            formatter={(v: number) => [`${v} km`, "Distance"]}
          />
          <Bar dataKey="km" fill="#c44020" radius={0} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function PaceTrendChart({ runs }: { runs: Activity[] }) {
  const data = useMemo(() => {
    return runs
      .filter((a) => a.distance && a.moving_time)
      .slice(0, 20)
      .reverse()
      .map((a) => {
        const d = new Date(a.start_date_local);
        const pace = paceSecPerKm(a)!;
        return {
          date: `${d.getDate()}/${d.getMonth() + 1}`,
          pace: Math.round(pace),
          paceLabel: formatPace(pace),
          dist: formatDistance(a.distance),
        };
      });
  }, [runs]);

  // Y axis: flip so faster (lower sec/km) is higher on chart
  const paceMin = Math.min(...data.map((d) => d.pace)) - 15;
  const paceMax = Math.max(...data.map((d) => d.pace)) + 15;

  return (
    <ChartCard title="Pace Trend (last 20 runs)">
      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={data}>
          <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#999" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
          <YAxis
            domain={[paceMin, paceMax]}
            tick={{ fontSize: 9, fill: "#999" }}
            axisLine={false}
            tickLine={false}
            width={38}
            reversed
            tickFormatter={(v) => `${Math.floor(v / 60)}:${String(Math.round(v % 60)).padStart(2, "0")}`}
          />
          <Tooltip
            contentStyle={{ background: "#000", border: "none", color: "#fff", fontSize: 11, fontFamily: "Space Mono, monospace" }}
            formatter={(_: number, __: string, props: any) => [props.payload.paceLabel, "Pace"]}
          />
          <Line type="monotone" dataKey="pace" stroke="#c44020" strokeWidth={2} dot={{ r: 3, fill: "#c44020" }} name="Pace" />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function Zone2Chart({ runs }: { runs: Activity[] }) {
  const data = useMemo(() => {
    return runs
      .filter((a) => a.hr_zones)
      .slice(0, 15)
      .reverse()
      .map((a) => {
        const d = new Date(a.start_date_local);
        const pct = zone2Pct(a) ?? 0;
        return {
          date: `${d.getDate()}/${d.getMonth() + 1}`,
          z2: pct,
          dist: formatDistance(a.distance),
        };
      });
  }, [runs]);

  if (data.length === 0) {
    return (
      <ChartCard title="Zone 2 Compliance">
        <p className="text-xs text-muted-foreground">No HR zone data yet. Make sure Garmin is recording HR zones.</p>
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Zone 2 Compliance (last 15 runs with HR)">
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data} barCategoryGap="25%">
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#999" }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "#999" }} axisLine={false} tickLine={false} width={28} tickFormatter={(v) => `${v}%`} />
          <Tooltip
            contentStyle={{ background: "#000", border: "none", color: "#fff", fontSize: 11, fontFamily: "Space Mono, monospace" }}
            formatter={(v: number) => [`${v}%`, "Zone 2"]}
          />
          {/* Target: 70%+ Zone 2 for aerobic base building */}
          <ReferenceLine y={70} stroke="#22c55e" strokeDasharray="4 2" label={{ value: "70% target", fill: "#22c55e", fontSize: 9, position: "insideTopRight" }} />
          <Bar dataKey="z2" radius={0} fill="#22c55e" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function RunHistoryCard({ run }: { run: Activity }) {
  const d = new Date(run.start_date_local);
  const dateStr = d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  const pace = paceSecPerKm(run);
  const z2 = zone2Pct(run);

  const durationMins = Math.floor(run.moving_time / 60);
  const durationSecs = run.moving_time % 60;

  return (
    <div className="border-2 border-foreground p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <div className="text-[10px] font-mono text-muted-foreground">{dateStr}</div>
          <div className="text-sm font-bold mt-0.5">{run.name}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-lg font-mono font-black leading-none" style={{ color: "#c44020" }}>
            {formatDistance(run.distance)}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mt-3 text-[10px] font-mono text-muted-foreground">
        <span>
          {durationMins}:{durationSecs.toString().padStart(2, "0")} moving
        </span>
        {pace && <span>{formatPace(pace)}</span>}
        {run.average_heartrate && <span>Avg {Math.round(run.average_heartrate)} bpm</span>}
        {z2 !== null && (
          <span style={{ color: z2 >= 70 ? "#22c55e" : z2 >= 50 ? "#f59e0b" : "#ef4444" }}>
            Z2: {z2}%
          </span>
        )}
      </div>

      {/* Mini HR zone bar */}
      {run.hr_zones && (
        <div className="flex h-1.5 mt-3 overflow-hidden gap-px">
          {HR_ZONE_LABELS.map((zone) => {
            const secs = run.hr_zones![zone.key]?.seconds ?? 0;
            const total = Object.values(run.hr_zones!).reduce((s, z) => s + z.seconds, 0);
            const pct = total > 0 ? (secs / total) * 100 : 0;
            if (pct === 0) return null;
            return (
              <div
                key={zone.key}
                style={{ width: `${pct}%`, backgroundColor: zone.color, flexShrink: 0 }}
                title={`${zone.label}: ${Math.round(pct)}%`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function RunAnalytics() {
  const foundationQuest = challengeData.quests.find((q) => q.id === "foundation");
  const foundationExcused = foundationQuest?.excused_dates ?? [];
  const foundationStreak = useMemo(
    () => computeFoundationStreak(activitiesRaw, foundationExcused),
    [foundationExcused],
  );

  const runs = useMemo(
    () => activitiesRaw.filter((a) => getTrainingCategory(a) === "run"),
    [],
  );

  const challengeRuns = useMemo(() => {
    const start = challengeData.challenge.start_date;
    return runs.filter((a) => a.start_date_local.slice(0, 10) >= start);
  }, [runs]);

  const target = challengeData.main_quest.target;
  const completed = challengeRuns.length;
  const eventDate = challengeData.main_quest.event_date;
  const daysLeft = eventDate ? daysUntil(eventDate) : null;
  const weeksLeft = daysLeft ? Math.max(daysLeft / 7, 0.1) : null;
  const runsLeft = Math.max(target - completed, 0);
  const neededPerWeek = weeksLeft ? (runsLeft / weeksLeft).toFixed(1) : null;

  const totalDistanceKm = (runs.reduce((s, a) => s + (a.distance ?? 0), 0) / 1000).toFixed(1);
  const avgPace = useMemo(() => {
    const withPace = runs.filter((a) => a.distance && a.moving_time);
    if (!withPace.length) return null;
    const avg = withPace.reduce((s, a) => s + paceSecPerKm(a)!, 0) / withPace.length;
    return formatPace(avg);
  }, [runs]);

  return (
    <div className="min-h-screen bg-background">
      <CommandStrip challengeData={challengeData} foundationStreak={foundationStreak} syncStatus={syncStatusData} />
      <div className="border-b-2 border-foreground" />

      <div className="container py-6 px-4 md:px-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold tracking-tight">Run Analytics</h2>
          <p className="text-xs text-muted-foreground mt-1">{runs.length} total runs in history</p>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatBox
            label="Birthday Run Goal"
            value={`${completed}/${target}`}
            sub={neededPerWeek ? `${neededPerWeek}/wk needed` : undefined}
          />
          {daysLeft !== null && (
            <StatBox
              label="Days to June 5"
              value={`${daysLeft}d`}
              sub={eventDate ? new Date(eventDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : undefined}
            />
          )}
          <StatBox
            label="Total Distance"
            value={`${totalDistanceKm} km`}
            sub={`${runs.length} runs`}
          />
          {avgPace && (
            <StatBox
              label="Avg Pace (all time)"
              value={avgPace}
              sub="moving time"
            />
          )}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <WeeklyDistanceChart runs={runs} />
          <PaceTrendChart runs={runs} />
        </div>

        <div className="mb-6">
          <Zone2Chart runs={runs} />
        </div>

        {/* Run history */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
            Run History
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[...runs].reverse().map((run) => (
              <RunHistoryCard key={run.id} run={run} />
            ))}
          </div>
          {runs.length === 0 && (
            <p className="text-sm text-muted-foreground">No runs yet. First one is the hardest.</p>
          )}
        </div>
      </div>
    </div>
  );
}

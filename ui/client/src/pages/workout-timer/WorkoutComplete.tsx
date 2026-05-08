import { Link } from "wouter";
import { Workout, WORKOUT_TYPE_CONFIG, formatTimer } from "@/lib/workouts";

export function WorkoutComplete({
  workout,
  elapsed,
}: {
  workout: Workout;
  elapsed: number;
}) {
  const config = WORKOUT_TYPE_CONFIG[workout.workout_type];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center">
      <div className="container text-center">
        <div
          className="inline-block text-[10px] font-bold uppercase tracking-wider font-mono px-2 py-1 mb-4"
          style={{ backgroundColor: config.color, color: "#fff" }}
        >
          Workout Complete
        </div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">
          {workout.title}
        </h2>
        <p className="metric-lg mb-1">{formatTimer(elapsed)}</p>
        <p className="text-sm text-muted-foreground mb-8">Total time</p>

        <div className="space-y-3">
          <Link href="/workouts">
            <button className="w-full max-w-xs py-3 bg-foreground text-background font-bold uppercase tracking-widest text-sm border-2 border-foreground hover:bg-foreground/90 transition-colors">
              Back to Workouts
            </button>
          </Link>
          <Link href="/">
            <button className="w-full max-w-xs py-3 bg-background text-foreground font-bold uppercase tracking-widest text-sm border-2 border-foreground hover:bg-secondary transition-colors">
              Dashboard
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

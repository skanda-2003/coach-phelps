import { Phase, Exercise, formatTimer } from "@/lib/workouts";
import { TimerState, TimerPosition } from "./useTimerEngine";

interface TimerScreensProps {
  state: TimerState;
  timer: number;
  exercise: Exercise;
  pos: TimerPosition;
  phase: Phase;
  isCircuit: boolean;
  phaseRounds: number;
  currentSide: 0 | 1;
  nextPreview: { label: string; name: string } | null;
  handleSkipPhase: () => void;
}

export function TimerScreens({
  state,
  timer,
  exercise,
  pos,
  phase,
  isCircuit,
  phaseRounds,
  currentSide,
  nextPreview,
  handleSkipPhase,
}: TimerScreensProps) {
  const isPhaseTransition = state === "phase_transition";
  const isPrep = state === "prep";
  const isRest = state === "rest";
  const isReps = state === "exercise" && exercise.type === "reps";

  if (isPhaseTransition) {
    return (
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">
          Next Phase
        </p>
        <h2 className="text-xl font-bold tracking-tight mb-4">
          {phase.name}
        </h2>
        <p className="metric-xl" style={{ color: "#3b82f6" }}>
          {formatTimer(timer)}
        </p>
        <p className="text-sm text-muted-foreground mt-4">
          Get ready — first up: {exercise?.name ?? ""}
        </p>
        {phase?.optional && (
          <button
            onClick={handleSkipPhase}
            className="mt-6 px-6 py-2.5 bg-amber-400 text-foreground font-bold uppercase tracking-widest text-xs border-2 border-amber-500 hover:bg-amber-500 transition-colors"
          >
            Skip Phase
          </button>
        )}
      </div>
    );
  }

  if (isPrep) {
    return (
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-2">
          Get Ready
        </p>
        <h2 className="text-xl font-bold tracking-tight mb-1">
          {exercise.name}
        </h2>
        <p className="text-sm font-mono text-muted-foreground mb-6">
          Set {pos.setNum} of {exercise.sets}
        </p>
        <p className="metric-xl" style={{ color: "#d97706" }}>
          {formatTimer(timer)}
        </p>
        <div className="mt-6 border-2 border-foreground/10 p-4 text-left">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
            Form Cue
          </p>
          <p className="text-sm">{exercise.form_cue}</p>
        </div>
      </div>
    );
  }

  if (isRest) {
    return (
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
          Rest{isCircuit ? ` · Round ${pos.roundNum}/${phaseRounds}` : ""}
        </p>
        <p className="metric-xl" style={{ color: "#22c55e" }}>
          {formatTimer(timer)}
        </p>
        {nextPreview && (
          <div className="mt-6 border-2 border-foreground/10 p-4 text-left">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
              {nextPreview.label}
            </p>
            <p className="text-sm font-bold">{nextPreview.name}</p>
          </div>
        )}
      </div>
    );
  }

  // Exercise screen
  return (
    <div>
      <p className="text-xs font-mono text-muted-foreground mb-1">
        #{exercise.num}
      </p>
      <div className="flex items-center gap-2 mb-1">
        <h2 className="text-2xl font-bold tracking-tight">
          {exercise.name}
        </h2>
        {exercise.optional && (
          <span className="text-[9px] font-mono text-muted-foreground/60 uppercase border border-muted-foreground/20 px-1.5 py-0.5">
            optional
          </span>
        )}
      </div>

      <p className="text-sm font-mono text-muted-foreground mb-6">
        {isCircuit
          ? `Round ${pos.roundNum} of ${phaseRounds}`
          : `Set ${pos.setNum} of ${exercise.sets}`}
        {isReps && exercise.reps
          ? ` · ${exercise.reps} rep${exercise.reps > 1 ? "s" : ""}`
          : ""}
      </p>

      {exercise.both_sides && exercise.type === "timed" && (
        <div className="flex items-center gap-3 mb-6">
          <span className={`text-xs font-bold uppercase tracking-widest px-2 py-1 border-2 font-mono ${
            currentSide === 0
              ? "bg-foreground text-background border-foreground"
              : "border-foreground/20 text-muted-foreground"
          }`}>
            Left
          </span>
          <span className="text-xs text-muted-foreground font-mono">→</span>
          <span className={`text-xs font-bold uppercase tracking-widest px-2 py-1 border-2 font-mono ${
            currentSide === 1
              ? "bg-foreground text-background border-foreground"
              : "border-foreground/20 text-muted-foreground"
          }`}>
            Right
          </span>
        </div>
      )}

      <div className="text-center my-8">
        {exercise.type === "timed" ? (
          <p className="metric-xl">{formatTimer(timer)}</p>
        ) : (
          <p className="metric-xl">{exercise.reps}</p>
        )}
        {exercise.type === "reps" && (
          <p className="text-xs font-mono text-muted-foreground mt-1">
            {exercise.reps === 1 ? "REP" : "REPS"}
          </p>
        )}
      </div>

      <div className="border-2 border-foreground/10 p-4 mb-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
          Form Cue
        </p>
        <p className="text-sm">{exercise.form_cue}</p>
      </div>

      <div className="border-2 border-foreground/10 p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
          Why
        </p>
        <p className="text-sm text-muted-foreground">{exercise.why}</p>
      </div>
    </div>
  );
}

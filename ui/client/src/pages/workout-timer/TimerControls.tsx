import { Dispatch, SetStateAction } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronRight,
  Check,
} from "lucide-react";
import { Exercise, Phase } from "@/lib/workouts";
import { TimerState } from "./useTimerEngine";

interface TimerControlsProps {
  state: TimerState;
  exercise: Exercise;
  phase: Phase;
  isPaused: boolean;
  setIsPaused: Dispatch<SetStateAction<boolean>>;
  handleExerciseDone: () => void;
  handleGoBack: () => void;
  handleSkip: () => void;
  handleSkipOptional: () => void;
  handleSkipPhase: () => void;
}

export function TimerControls({
  state,
  exercise,
  phase,
  isPaused,
  setIsPaused,
  handleExerciseDone,
  handleGoBack,
  handleSkip,
  handleSkipOptional,
  handleSkipPhase,
}: TimerControlsProps) {
  const isPhaseTransition = state === "phase_transition";
  const isPrep = state === "prep";
  const isRest = state === "rest";
  const isReps = state === "exercise" && exercise.type === "reps";

  return (
    <div className="border-t-2 border-foreground bg-background">
      <div className="container py-4">
        <div className="flex items-center justify-center gap-4">
          {/* Back */}
          <button
            onClick={handleGoBack}
            className="p-3 border-2 border-foreground/20 hover:border-foreground transition-colors"
            title="Previous"
          >
            <SkipBack className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Main action — context-dependent */}
          {isPhaseTransition || isPrep ? (
            <button
              onClick={handleSkip}
              className="px-8 py-3 bg-foreground text-background font-bold uppercase tracking-widest text-sm border-2 border-foreground hover:bg-foreground/90 transition-colors"
            >
              <div className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4" />
                Skip
              </div>
            </button>
          ) : isRest ? (
            <button
              onClick={handleSkip}
              className="px-8 py-3 bg-foreground text-background font-bold uppercase tracking-widest text-sm border-2 border-foreground hover:bg-foreground/90 transition-colors"
            >
              <div className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4" />
                Skip Rest
              </div>
            </button>
          ) : isReps ? (
            <button
              onClick={handleExerciseDone}
              className="px-8 py-3 bg-foreground text-background font-bold uppercase tracking-widest text-sm border-2 border-foreground hover:bg-foreground/90 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                Done
              </div>
            </button>
          ) : (
            <button
              onClick={() => setIsPaused((p) => !p)}
              className="px-8 py-3 bg-foreground text-background font-bold uppercase tracking-widest text-sm border-2 border-foreground hover:bg-foreground/90 transition-colors"
            >
              <div className="flex items-center gap-2">
                {isPaused ? (
                  <>
                    <Play className="w-4 h-4" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4" />
                    Pause
                  </>
                )}
              </div>
            </button>
          )}

          {/* Skip Phase — for optional phases */}
          {phase?.optional && (state === "exercise" || state === "rest" || state === "prep") && (
            <button
              onClick={handleSkipPhase}
              className="p-3 border-2 border-amber-400 hover:border-amber-600 transition-colors"
              title="Skip optional phase"
            >
              <SkipForward className="w-5 h-5 text-amber-500" />
            </button>
          )}

          {/* Forward — skip optional exercise or skip set */}
          {state === "exercise" && exercise.optional ? (
            <button
              onClick={handleSkipOptional}
              className="p-3 border-2 border-amber-400 hover:border-amber-600 transition-colors"
              title="Skip optional exercise"
            >
              <SkipForward className="w-5 h-5 text-amber-500" />
            </button>
          ) : state === "exercise" ? (
            <button
              onClick={handleSkip}
              className="p-3 border-2 border-foreground/20 hover:border-foreground transition-colors"
              title="Skip set"
            >
              <SkipForward className="w-5 h-5 text-muted-foreground" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

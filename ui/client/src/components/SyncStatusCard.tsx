/**
 * SyncStatusBanner — Slim banner shown only for warning/error sync states.
 * Success and "no data" are silent — handled by the tooltip on the sync button.
 */
import { useState } from "react";
import { ChevronDown, ChevronUp, AlertTriangle, XCircle } from "lucide-react";

interface SyncStatus {
  timestamp: string | null;
  status: string;
  activities_synced: number;
  activities_renamed: number;
  descriptions_parsed: number;
  warnings: string[];
  error?: string;
}

interface Props {
  syncStatus: SyncStatus;
}

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function SyncStatusBanner({ syncStatus }: Props) {
  const [expanded, setExpanded] = useState(false);
  const { status, timestamp, warnings, error } = syncStatus;

  // Only render for warning/error states
  if (status !== "partial" && status !== "error") return null;
  if (!timestamp) return null;

  const ago = timeAgo(timestamp);

  if (status === "error") {
    return (
      <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-1.5">
        <div className="container flex items-center gap-2 text-xs text-red-500">
          <XCircle className="w-3 h-3 shrink-0" />
          <span>Last sync failed {ago}{error ? ` — ${error}` : ""}</span>
        </div>
      </div>
    );
  }

  // partial (warnings)
  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5">
      <div className="container">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 hover:opacity-80 transition-opacity w-full text-left"
        >
          <AlertTriangle className="w-3 h-3 shrink-0" />
          <span className="flex-1">
            Last sync {ago} — {warnings.length} warning{warnings.length !== 1 ? "s" : ""}
          </span>
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
        {expanded && (
          <ul className="mt-1 ml-5 text-[10px] text-amber-600/80 dark:text-amber-400/80 space-y-0.5 pb-0.5">
            {warnings.map((w, i) => (
              <li key={i}>• {w}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/**
 * Deprecated — Archive of v1 widgets for reference.
 * These were replaced by the v2 category-based summary cards.
 */
import activitiesData from "@/data/activities.json";
import { Activity } from "@/lib/activities";
import { InsightsRow } from "@/components/InsightsRow";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

const activities = activitiesData as Activity[];

export default function Deprecated() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container py-6">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold uppercase tracking-tight mb-2">Deprecated Widgets</h1>
        <p className="text-sm text-muted-foreground mb-8">
          These v1 insight cards were replaced by category-specific summary cards in v2. Kept here for reference.
        </p>
      </div>
      <InsightsRow activities={activities} />
    </div>
  );
}

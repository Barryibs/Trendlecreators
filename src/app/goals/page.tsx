"use client";

import { useEffect, useState, useCallback } from "react";

interface Goal {
  id: string;
  weekStart: string;
  title: string;
  completed: boolean;
}

function formatWeekLabel(weekStart: string): string {
  const monday = new Date(weekStart + "T00:00:00Z");
  const sunday = new Date(monday);
  sunday.setUTCDate(sunday.getUTCDate() + 6);
  return `Week of ${monday.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${sunday.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGoals = useCallback(async () => {
    try {
      const res = await fetch("/api/goals");
      setGoals(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  // Group goals by week
  const goalsByWeek = new Map<string, Goal[]>();
  for (const g of goals) {
    const existing = goalsByWeek.get(g.weekStart) || [];
    existing.push(g);
    goalsByWeek.set(g.weekStart, existing);
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Weekly Goals</h2>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : goals.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <p className="text-muted-foreground text-sm">
            No goals set for this period.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {Array.from(goalsByWeek.entries())
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([weekStart, weekGoals]) => {
              const completed = weekGoals.filter((g) => g.completed).length;
              const pct = Math.round((completed / weekGoals.length) * 100);
              return (
                <div key={weekStart}>
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
                    <h3 className="text-sm font-semibold">
                      {formatWeekLabel(weekStart)}
                    </h3>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        {completed}/{weekGoals.length} completed
                      </span>
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {weekGoals.map((g) => (
                      <div
                        key={g.id}
                        className="flex items-center gap-3 bg-card rounded-lg border border-border px-4 py-3"
                      >
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            g.completed
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-border"
                          }`}
                        >
                          {g.completed && (
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </div>
                        <span
                          className={`flex-1 text-sm ${
                            g.completed
                              ? "line-through text-muted-foreground"
                              : ""
                          }`}
                        >
                          {g.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

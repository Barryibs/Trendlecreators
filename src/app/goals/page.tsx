"use client";

import { useEffect, useState, useCallback } from "react";

interface Goal {
  id: string;
  weekStart: string;
  title: string;
  completed: boolean;
}

function getWeekOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  const current = new Date("2026-03-02T00:00:00Z");
  const now = new Date();

  while (current <= now) {
    const end = new Date(current);
    end.setUTCDate(end.getUTCDate() + 6);
    options.push({
      value: current.toISOString().split("T")[0],
      label: `${current.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
    });
    current.setUTCDate(current.getUTCDate() + 7);
  }
  return options.reverse();
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [selectedWeek, setSelectedWeek] = useState("");

  const weekOptions = getWeekOptions();

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
    if (weekOptions.length > 0 && !selectedWeek) {
      setSelectedWeek(weekOptions[0].value);
    }
  }, [fetchGoals, weekOptions, selectedWeek]);

  async function addGoal(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !selectedWeek) return;

    await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weekStart: selectedWeek, title: newTitle.trim() }),
    });
    setNewTitle("");
    fetchGoals();
  }

  async function toggleGoal(id: string, completed: boolean) {
    await fetch("/api/goals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, completed: !completed }),
    });
    fetchGoals();
  }

  async function deleteGoal(id: string) {
    await fetch("/api/goals", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchGoals();
  }

  // Group goals by week
  const goalsByWeek = new Map<string, Goal[]>();
  for (const g of goals) {
    const existing = goalsByWeek.get(g.weekStart) || [];
    existing.push(g);
    goalsByWeek.set(g.weekStart, existing);
  }

  const weekLabel = (weekStart: string) => {
    const opt = weekOptions.find((w) => w.value === weekStart);
    return opt ? `Week of ${opt.label}` : weekStart;
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Weekly Goals</h2>

      {/* Add goal form */}
      <div className="bg-card rounded-xl border border-border p-6 mb-8">
        <h3 className="text-sm font-semibold mb-3">Add a Goal</h3>
        <form onSubmit={addGoal} className="flex gap-2">
          <select
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
            className="px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {weekOptions.map((w) => (
              <option key={w.value} value={w.value}>
                {w.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Goal description..."
            className="flex-1 px-3 py-2 border border-border rounded-lg text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90"
          >
            Add
          </button>
        </form>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : goals.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <p className="text-muted-foreground text-sm">
            No goals set yet. Add your first weekly goal above.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {Array.from(goalsByWeek.entries())
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([weekStart, weekGoals]) => {
              const completed = weekGoals.filter((g) => g.completed).length;
              return (
                <div key={weekStart}>
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
                    <h3 className="text-sm font-semibold">
                      {weekLabel(weekStart)}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {completed}/{weekGoals.length} completed
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {weekGoals.map((g) => (
                      <div
                        key={g.id}
                        className="flex items-center gap-3 bg-card rounded-lg border border-border px-4 py-3"
                      >
                        <button
                          onClick={() => toggleGoal(g.id, g.completed)}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            g.completed
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-border hover:border-primary"
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
                        </button>
                        <span
                          className={`flex-1 text-sm ${
                            g.completed
                              ? "line-through text-muted-foreground"
                              : ""
                          }`}
                        >
                          {g.title}
                        </span>
                        <button
                          onClick={() => deleteGoal(g.id)}
                          className="text-xs text-destructive hover:underline"
                        >
                          Delete
                        </button>
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

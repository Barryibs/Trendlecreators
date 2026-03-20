"use client";

import { useEffect, useState, useCallback } from "react";

interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  deployment: "bg-blue-100 text-blue-700 border-blue-300",
  marketing: "bg-purple-100 text-purple-700 border-purple-300",
  partnership: "bg-green-100 text-green-700 border-green-300",
  event: "bg-orange-100 text-orange-700 border-orange-300",
  feature: "bg-indigo-100 text-indigo-700 border-indigo-300",
  competition: "bg-yellow-100 text-yellow-700 border-yellow-300",
};

const STATUS_ICONS: Record<string, string> = {
  completed: "bg-green-500",
  "in-progress": "bg-blue-500",
  upcoming: "bg-muted-foreground",
};

function formatDate(d: string): string {
  return new Date(d + "T00:00:00Z").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function TimelinePage() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/timeline");
      setEvents(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const today = new Date().toISOString().split("T")[0];

  // Split into past and upcoming
  const past = events
    .filter((e) => e.date < today && e.status === "completed")
    .reverse();
  const current = events.filter(
    (e) => e.status === "in-progress" || (e.date === today)
  );
  const upcoming = events.filter(
    (e) => e.date >= today && e.status === "upcoming"
  );

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Timeline & Upcoming</h2>
      <p className="text-sm text-muted-foreground mb-8">
        Key dates, deployments, and marketing moments. Plan your content around
        these.
      </p>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : events.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <p className="text-muted-foreground text-sm">
            No events scheduled yet.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {/* In Progress / Today */}
          {current.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                Happening Now
              </h3>
              <div className="flex flex-col gap-3">
                {current.map((e) => (
                  <div
                    key={e.id}
                    className="bg-card rounded-xl border-2 border-primary p-5"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-bold">
                        {formatDate(e.date)}
                      </span>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          CATEGORY_COLORS[e.category] ||
                          "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {e.category}
                      </span>
                    </div>
                    <p className="text-base font-semibold mb-1">{e.title}</p>
                    {e.description && (
                      <p className="text-sm text-muted-foreground">
                        {e.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Upcoming</h3>
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border" />
                <div className="flex flex-col gap-4">
                  {upcoming.map((e) => {
                    const daysAway = Math.ceil(
                      (new Date(e.date + "T00:00:00Z").getTime() -
                        new Date(today + "T00:00:00Z").getTime()) /
                        (1000 * 60 * 60 * 24)
                    );
                    return (
                      <div key={e.id} className="flex gap-4">
                        <div className="relative z-10 mt-1.5">
                          <div
                            className={`w-6 h-6 rounded-full border-2 border-card ${
                              STATUS_ICONS[e.status] || "bg-gray-400"
                            }`}
                          />
                        </div>
                        <div className="flex-1 bg-card rounded-xl border border-border p-5">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-semibold">
                              {formatDate(e.date)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {daysAway === 1
                                ? "Tomorrow"
                                : `in ${daysAway} days`}
                            </span>
                            <span
                              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                CATEGORY_COLORS[e.category] ||
                                "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {e.category}
                            </span>
                          </div>
                          <p className="text-sm font-semibold mb-1">
                            {e.title}
                          </p>
                          {e.description && (
                            <p className="text-sm text-muted-foreground">
                              {e.description}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Past / Completed */}
          {past.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 text-muted-foreground">
                Completed
              </h3>
              <div className="relative">
                <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border" />
                <div className="flex flex-col gap-4">
                  {past.map((e) => (
                    <div key={e.id} className="flex gap-4 opacity-60">
                      <div className="relative z-10 mt-1.5">
                        <div className="w-6 h-6 rounded-full border-2 border-card bg-green-500" />
                      </div>
                      <div className="flex-1 bg-card rounded-xl border border-border p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">
                            {formatDate(e.date)}
                          </span>
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              CATEGORY_COLORS[e.category] ||
                              "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {e.category}
                          </span>
                        </div>
                        <p className="text-sm">{e.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

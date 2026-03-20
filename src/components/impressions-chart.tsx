"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function ImpressionsChart({
  data,
}: {
  data: { date: string; impressions: number }[];
}) {
  if (data.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-6 h-64 flex items-center justify-center">
        <p className="text-muted-foreground text-sm">
          No impression data yet. Sync to start tracking.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <h3 className="text-sm font-semibold mb-4">
        Weekly Impressions (since Mar 1)
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => {
              const d = new Date(v + "T00:00:00");
              return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
            }}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickFormatter={(v) =>
              v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)
            }
          />
          <Tooltip
            formatter={(value) => [
              Number(value).toLocaleString(),
              "Impressions",
            ]}
            labelFormatter={(label) => {
              const d = new Date(label + "T00:00:00");
              const end = new Date(d);
              end.setDate(end.getDate() + 6);
              return `Week of ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
            }}
          />
          <Bar dataKey="impressions" fill="#6366f1" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

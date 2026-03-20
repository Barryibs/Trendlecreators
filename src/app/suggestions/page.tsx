"use client";

import { useEffect, useState, useCallback } from "react";

interface Suggestion {
  id: string;
  author: string;
  category: string;
  text: string;
  status: string;
  createdAt: string;
}

const CATEGORIES = [
  "general",
  "platform",
  "creator-program",
  "trading",
  "ui-ux",
  "marketing",
];

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  reviewing: "bg-yellow-100 text-yellow-700",
  accepted: "bg-green-100 text-green-700",
  implemented: "bg-purple-100 text-purple-700",
  declined: "bg-gray-100 text-gray-500",
};

export default function SuggestionsPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("general");
  const [text, setText] = useState("");
  const [filterCat, setFilterCat] = useState<string>("all");

  const fetchSuggestions = useCallback(async () => {
    try {
      const res = await fetch("/api/suggestions");
      setSuggestions(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!author.trim() || !text.trim()) return;

    await fetch("/api/suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        author: author.trim(),
        category,
        text: text.trim(),
      }),
    });
    setText("");
    fetchSuggestions();
  }

  async function updateStatus(id: string, status: string) {
    await fetch("/api/suggestions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    fetchSuggestions();
  }

  const filtered =
    filterCat === "all"
      ? suggestions
      : suggestions.filter((s) => s.category === filterCat);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Suggestions & Feedback</h2>

      {/* Submit form */}
      <div className="bg-card rounded-xl border border-border p-6 mb-8">
        <h3 className="text-sm font-semibold mb-3">Submit a Suggestion</h3>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Your name or @username"
              className="flex-1 px-3 py-2 border border-border rounded-lg text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.replace("-", " ")}
                </option>
              ))}
            </select>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Describe your suggestion, feedback, or idea to improve the platform or creator program..."
            rows={4}
            className="px-3 py-2 border border-border rounded-lg text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
          <button
            type="submit"
            className="self-end px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90"
          >
            Submit
          </button>
        </form>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-sm text-muted-foreground">Filter:</span>
        <button
          onClick={() => setFilterCat("all")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filterCat === "all"
              ? "bg-primary text-primary-foreground"
              : "bg-card border border-border hover:bg-muted"
          }`}
        >
          All ({suggestions.length})
        </button>
        {CATEGORIES.map((c) => {
          const count = suggestions.filter((s) => s.category === c).length;
          if (count === 0) return null;
          return (
            <button
              key={c}
              onClick={() => setFilterCat(c)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterCat === c
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border hover:bg-muted"
              }`}
            >
              {c.replace("-", " ")} ({count})
            </button>
          );
        })}
      </div>

      {/* Suggestions list */}
      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <p className="text-muted-foreground text-sm">
            No suggestions yet. Be the first to share your feedback!
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((s) => (
            <div
              key={s.id}
              className="bg-card rounded-xl border border-border p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-semibold">{s.author}</span>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    STATUS_COLORS[s.status] || "bg-gray-100 text-gray-500"
                  }`}
                >
                  {s.status}
                </span>
                <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                  {s.category.replace("-", " ")}
                </span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {new Date(s.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <p className="text-sm leading-relaxed mb-3">{s.text}</p>
              <div className="flex gap-2">
                {["new", "reviewing", "accepted", "implemented", "declined"].map(
                  (st) =>
                    st !== s.status && (
                      <button
                        key={st}
                        onClick={() => updateStatus(s.id, st)}
                        className="text-xs text-muted-foreground hover:text-primary hover:underline"
                      >
                        Mark {st}
                      </button>
                    )
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

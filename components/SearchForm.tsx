"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";

export function SearchForm({ query, selectedFilter }: { query: string; selectedFilter: string }) {
  const [placeholder, setPlaceholder] = useState("大会名・大学名・選手名を入力");

  useEffect(() => {
    const queryList = window.matchMedia("(max-width: 640px)");
    const updatePlaceholder = () => {
      setPlaceholder(queryList.matches ? "大会名・大学名・選手名を入力" : "大会名・大学名・選手名を入力");
    };

    updatePlaceholder();
    queryList.addEventListener("change", updatePlaceholder);

    return () => queryList.removeEventListener("change", updatePlaceholder);
  }, []);

  return (
    <form action="/search" className="grid gap-3 sm:grid-cols-[1fr_auto]">
      {selectedFilter !== "all" ? <input type="hidden" name="filter" value={selectedFilter} /> : null}
      <label className="relative block">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sash-red">
          <Search size={20} />
        </span>
        <input
          name="q"
          defaultValue={query}
          placeholder={placeholder}
          className="h-12 w-full rounded-lg border border-line bg-field pl-12 pr-4 text-base font-bold text-ink outline-none transition placeholder:text-slate-500 focus:border-sash-red focus:bg-white sm:h-13"
        />
      </label>
      <button type="submit" className="min-h-12 rounded-lg bg-sash-red px-6 text-sm font-black text-white shadow-sm transition hover:bg-sash-deepRed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sash-red/35 focus-visible:ring-offset-2 sm:h-13">
        検索
      </button>
    </form>
  );
}

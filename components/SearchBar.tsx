import { Search, SlidersHorizontal } from "lucide-react";

export function SearchBar() {
  return (
    <div className="flex flex-col gap-2 rounded-[28px] border border-line bg-white p-2 shadow-soft sm:flex-row">
      <label className="flex min-h-12 flex-1 items-center gap-2 rounded-md bg-field px-3">
        <Search className="text-sash-red" size={20} />
        <input
          className="w-full bg-transparent text-sm font-medium text-ink outline-none placeholder:text-slate-400"
          placeholder="大会名・大学名・選手名で検索"
        />
      </label>
      <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-sash-red px-4 text-sm font-bold text-white shadow-sm">
        <SlidersHorizontal size={18} />
        条件で絞る
      </button>
    </div>
  );
}

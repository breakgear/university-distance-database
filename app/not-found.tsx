import Link from "next/link";
import { CalendarDays, ChevronRight, Search } from "lucide-react";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <section className="rounded-lg border border-line bg-white p-6 text-center shadow-sm sm:p-8">
        <p className="text-sm font-black text-sash-red">404</p>
        <h1 className="mt-2 text-2xl font-black text-ink sm:text-3xl">ページが見つかりません</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm font-bold leading-7 text-slate-600">
          指定されたページは存在しないか、URLが変更された可能性があります。
        </p>
        <div className="mt-6 grid gap-2 sm:grid-cols-3">
          <Link href="/" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-sash-red px-4 text-sm font-black text-white shadow-sm transition hover:bg-sash-deepRed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sash-red/35 focus-visible:ring-offset-2">
            トップページへ戻る
          </Link>
          <Link href="/meets" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-line bg-field px-4 text-sm font-black text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-sash-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sash-red/35 focus-visible:ring-offset-2">
            <CalendarDays size={16} />
            大会一覧を見る
          </Link>
          <Link href="/search" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-line bg-field px-4 text-sm font-black text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-sash-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sash-red/35 focus-visible:ring-offset-2">
            <Search size={16} />
            検索する
            <ChevronRight size={16} />
          </Link>
        </div>
      </section>
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Database, FileSearch, Info, LockKeyhole } from "lucide-react";
import { ResultImportWorkbench } from "@/components/ResultImportWorkbench";
import { AdminScheduleReference } from "@/components/AdminScheduleReference";
import { AdminLogoutButton } from "@/components/AdminLogoutButton";
import { requireAdminPage } from "@/lib/admin-auth";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false
  }
};

export default async function ResultImportPage() {
  await requireAdminPage();

  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 pt-7 sm:px-6 sm:pt-10">
      <nav className="mb-4 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
        <Link href="/" className="hover:text-sash-red">
          ホーム
        </Link>
        <ChevronRight size={14} />
        <span className="text-ink">データ取込</span>
        <span className="ml-auto">
          <AdminLogoutButton />
        </span>
      </nav>

      <section className="relative overflow-hidden rounded-lg border border-line bg-white p-4 shadow-sm sm:p-6">
        <div className="absolute bottom-0 right-8 hidden h-40 gap-2 sm:flex" aria-hidden="true">
          <span className="h-full w-3 -skew-x-[24deg] bg-sash-red/25" />
          <span className="h-full w-2 -skew-x-[24deg] bg-slate-900/10" />
          <span className="h-full w-2 -skew-x-[24deg] bg-sash-blue/20" />
        </div>
        <div className="relative">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-sash-red">管理者専用</span>
            <span className="rounded-full bg-field px-2.5 py-1 text-xs font-bold text-slate-600">Supabase運用</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-field px-2.5 py-1 text-xs font-bold text-slate-600">
              <LockKeyhole size={13} />
              認証済み
            </span>
          </div>
          <h1 className="text-3xl font-black leading-tight text-ink sm:text-4xl">公式データを取り込む</h1>
          <p className="mt-3 max-w-3xl text-sm font-bold leading-7 text-slate-700 sm:text-base">
            URL、コピーした一覧、PDFから結果・エントリー情報を解析し、確認後にSupabaseへ反映します。
          </p>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <InfoCard icon={<FileSearch size={18} />} label="入力" value="URL / テキスト / PDF" />
            <InfoCard icon={<Database size={18} />} label="出力" value="Supabase 7テーブル" />
            <InfoCard icon={<Info size={18} />} label="確認" value="原本と解析結果を比較" />
          </div>
        </div>
      </section>

      <AdminScheduleReference />

      <section className="mt-6">
        <ResultImportWorkbench />
      </section>
    </div>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md bg-field px-3 py-3">
      <div className="flex items-center gap-2 text-sash-red">
        {icon}
        <span className="text-xs font-black text-slate-500">{label}</span>
      </div>
      <p className="mt-1.5 text-sm font-black text-ink">{value}</p>
    </div>
  );
}

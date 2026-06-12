import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/AdminLoginForm";
import { getAdminIdentity } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "管理者ログイン | 大学長距離データベース",
  robots: { index: false, follow: false }
};

export default async function AdminLoginPage() {
  if (await getAdminIdentity()) redirect("/admin/import");

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6 sm:py-20">
      <section className="rounded-lg border border-line bg-white p-5 shadow-sm sm:p-7">
        <p className="text-xs font-black text-sash-red">管理者専用</p>
        <h1 className="mt-2 text-2xl font-black text-ink">データ取込にログイン</h1>
        <p className="mt-3 text-sm font-bold leading-6 text-slate-600">
          Supabase Authに登録した管理者アカウントでログインしてください。
        </p>
        <AdminLoginForm />
      </section>
    </div>
  );
}

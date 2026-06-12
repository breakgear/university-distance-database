"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function AdminLogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await createSupabaseBrowserClient().auth.signOut();
        router.replace("/admin/login");
        router.refresh();
      }}
      className="inline-flex items-center gap-1.5 text-xs font-black text-slate-500 transition hover:text-sash-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sash-red/35"
    >
      <LogOut size={14} />
      ログアウト
    </button>
  );
}

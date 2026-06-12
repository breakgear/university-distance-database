"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, LogIn } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      router.replace("/admin/import");
      router.refresh();
    } catch {
      setError("メールアドレスまたはパスワードを確認してください。");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <label className="block">
        <span className="text-xs font-black text-slate-600">メールアドレス</span>
        <input
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-1.5 h-12 w-full rounded-md border border-line bg-field px-3 text-sm font-bold text-ink outline-none focus:border-sash-red focus:ring-2 focus:ring-sash-red/15"
        />
      </label>
      <label className="block">
        <span className="text-xs font-black text-slate-600">パスワード</span>
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-1.5 h-12 w-full rounded-md border border-line bg-field px-3 text-sm font-bold text-ink outline-none focus:border-sash-red focus:ring-2 focus:ring-sash-red/15"
        />
      </label>
      {error ? <p className="text-sm font-bold text-red-700">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-sash-red px-5 text-sm font-black text-white transition hover:bg-[#962033] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sash-red/35 disabled:opacity-60"
      >
        {loading ? <LoaderCircle size={18} className="animate-spin" /> : <LogIn size={18} />}
        {loading ? "確認中" : "ログイン"}
      </button>
    </form>
  );
}

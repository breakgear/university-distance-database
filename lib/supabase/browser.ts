"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublishableKey, getSupabaseUrl } from "./config";

export function createSupabaseBrowserClient() {
  const url = getSupabaseUrl();
  const key = getSupabasePublishableKey();
  if (!url || !key) throw new Error("Supabaseの公開接続情報が設定されていません。");
  return createBrowserClient(url, key);
}

import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublishableKey, getSupabaseUrl } from "./config";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const url = getSupabaseUrl();
  const key = getSupabasePublishableKey();
  if (!url || !key) throw new Error("Supabaseの公開接続情報が設定されていません。");

  return createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (items) => {
        try {
          items.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot always write cookies; proxy.ts refreshes them.
        }
      }
    }
  });
}

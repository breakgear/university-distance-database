import "server-only";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAdminConfig } from "./config";

export function createSupabaseAdminClient() {
  const { url, secretKey } = requireSupabaseAdminConfig();

  return createClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

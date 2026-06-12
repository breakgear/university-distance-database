export function getSupabaseUrl() {
  return process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
}

export function getSupabasePublishableKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
}

export function getSupabaseSecretKey() {
  return process.env.SUPABASE_SECRET_KEY || "";
}

export function requireSupabaseAdminConfig() {
  const url = getSupabaseUrl();
  const secretKey = getSupabaseSecretKey();

  if (!url || !secretKey) {
    throw new Error(
      "SUPABASE_URL（またはNEXT_PUBLIC_SUPABASE_URL）とSUPABASE_SECRET_KEYを.env.localに設定してください。"
    );
  }

  return { url, secretKey };
}

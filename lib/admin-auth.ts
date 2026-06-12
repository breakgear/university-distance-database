import "server-only";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./supabase/server";

function requiresAdminAuth() {
  return process.env.NODE_ENV === "production" || process.env.ADMIN_AUTH_REQUIRED === "true";
}

function allowedEmails() {
  return new Set(
    (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

export async function getAdminIdentity() {
  if (!requiresAdminAuth()) {
    return { email: "local-admin" };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  const email = data.user?.email?.toLowerCase() || "";
  const allowlist = allowedEmails();
  if (error || !email || allowlist.size === 0 || !allowlist.has(email)) return null;
  return { email };
}

export async function requireAdminPage() {
  const identity = await getAdminIdentity();
  if (!identity) redirect("/admin/login");
  return identity;
}

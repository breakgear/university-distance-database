import { NextResponse } from "next/server";
import { getAdminIdentity } from "@/lib/admin-auth";
import { commitImport } from "@/lib/result-import-commit";
import { parseImportCommitPayload } from "@/lib/result-import-validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!(await getAdminIdentity())) return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });

  try {
    const payload = parseImportCommitPayload(await request.json());
    const result = await commitImport(payload);
    return NextResponse.json({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "データ更新に失敗しました。";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

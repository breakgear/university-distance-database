import { NextResponse } from "next/server";
import { isAdminImportAvailable } from "@/lib/admin-import-access";
import { previewImport } from "@/lib/result-import-commit";
import { parseImportCommitPayload } from "@/lib/result-import-validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isAdminImportAvailable()) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const payload = parseImportCommitPayload(await request.json());
    const preview = previewImport(payload);
    return NextResponse.json({ preview });
  } catch (error) {
    const message = error instanceof Error ? error.message : "CSV更新案の作成に失敗しました。";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

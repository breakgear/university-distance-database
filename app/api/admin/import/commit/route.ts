import { NextResponse } from "next/server";
import { isAdminImportAvailable } from "@/lib/admin-import-access";
import { commitImport } from "@/lib/result-import-commit";
import type { ImportCommitPayload } from "@/lib/result-import-types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isAdminImportAvailable()) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const payload = (await request.json()) as ImportCommitPayload;
    const result = commitImport(payload);
    return NextResponse.json({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "CSV更新に失敗しました。";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

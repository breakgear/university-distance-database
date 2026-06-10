import { NextResponse } from "next/server";
import { commitImport } from "@/lib/result-import-commit";
import type { ImportCommitPayload } from "@/lib/result-import-types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as ImportCommitPayload;
    const result = commitImport(payload);
    return NextResponse.json({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "CSV更新に失敗しました。";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}


import { NextResponse } from "next/server";
import { isAdminImportAvailable } from "@/lib/admin-import-access";
import { analyzeImportSources } from "@/lib/result-import-parser";
import { parseAnalyzeFormData } from "@/lib/result-import-validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isAdminImportAvailable()) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const input = parseAnalyzeFormData(await request.formData());
    const analysis = await analyzeImportSources(input);
    return NextResponse.json({ analysis });
  } catch (error) {
    const message = error instanceof Error ? error.message : "解析に失敗しました。";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

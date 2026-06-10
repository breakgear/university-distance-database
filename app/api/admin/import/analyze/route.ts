import { NextResponse } from "next/server";
import { isAdminImportAvailable } from "@/lib/admin-import-access";
import { analyzeImportSources } from "@/lib/result-import-parser";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isAdminImportAvailable()) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const formData = await request.formData();
    const url = String(formData.get("url") ?? "");
    const text = String(formData.get("text") ?? "");
    const pdfValue = formData.get("pdf");
    const pdf = pdfValue instanceof File && pdfValue.size > 0 ? pdfValue : null;
    const onlyUniversity = String(formData.get("onlyUniversity") ?? "true") === "true";
    const analysis = await analyzeImportSources({ url, text, pdf, onlyUniversity });
    return NextResponse.json({ analysis });
  } catch (error) {
    const message = error instanceof Error ? error.message : "解析に失敗しました。";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

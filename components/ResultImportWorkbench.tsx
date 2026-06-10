"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ClipboardPaste,
  Database,
  ExternalLink,
  Eye,
  FileText,
  FileOutput,
  Link2,
  LoaderCircle,
  Paperclip,
  Search,
  ShieldCheck,
  Sparkles,
  TableProperties,
  Upload,
  UserCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  ImportAnalysis,
  ImportMetadata,
  ImportParsedRow,
  ImportSource
} from "@/lib/result-import-types";

type ImportStatus = "idle" | "analyzing" | "review" | "ready" | "committing" | "done";
type MatchStatus = "matched" | "new" | "warning";
type InputSource = ImportSource;

type ParsedResult = ImportParsedRow;

const sampleUrl = "https://www.kgrr.org/event/event/2026/kan-currywithgyoza/rel029.html";
const sampleText = `男子1部 10000m 決勝
第105回関東学生陸上競技対校選手権大会

順位  ORD.  No.  氏名                         所属       記録       コメント
1     34    109  シャドラック キップケメイ (4)  日大       28:15.16
2     13    160  スティーブン レマイヤン (4)    駿大       28:17.99
3     22    358  中野 純平 (3)                  東海大     28:19.39  PB
4     16    357  南坂 柚汰 (4)                  東海大     28:21.62  PB
5     9     527  三宅 悠斗 (2)                  中大       28:22.27
6     26    414  山口 竣平 (3)                  早大       28:22.79
DNS  14    563  成合 洸琉 (3)                  明大       DNS        DNS`;

export function ResultImportWorkbench() {
  const [selectedSources, setSelectedSources] = useState<Set<InputSource>>(() => new Set<InputSource>(["url", "text"]));
  const [url, setUrl] = useState(sampleUrl);
  const [pastedText, setPastedText] = useState(sampleText);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState("");
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [onlyUniversity, setOnlyUniversity] = useState(true);
  const [analysis, setAnalysis] = useState<ImportAnalysis | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(() => new Set());
  const [error, setError] = useState("");
  const [commitMessage, setCommitMessage] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!pdfFile) {
      setPdfUrl("");
      return;
    }
    const objectUrl = URL.createObjectURL(pdfFile);
    setPdfUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [pdfFile]);

  const selectedCount = selectedRows.size;
  const issueCount = useMemo(
    () => (analysis?.rows ?? []).filter((row, index) => selectedRows.has(index) && row.matchStatus !== "matched").length,
    [analysis, selectedRows]
  );

  const completedSources = [
    selectedSources.has("url") && Boolean(url.trim()),
    selectedSources.has("text") && Boolean(pastedText.trim()),
    selectedSources.has("pdf") && Boolean(pdfFile)
  ].filter(Boolean).length;
  const canAnalyze = selectedSources.size >= 2 && completedSources >= 2;

  async function analyze() {
    if (!canAnalyze) return;
    setStatus("analyzing");
    setError("");
    setCommitMessage("");
    setConfirmed(false);
    const formData = new FormData();
    if (selectedSources.has("url")) formData.set("url", url);
    if (selectedSources.has("text")) formData.set("text", pastedText);
    if (selectedSources.has("pdf") && pdfFile) formData.set("pdf", pdfFile);
    formData.set("onlyUniversity", String(onlyUniversity));

    try {
      const response = await fetch("/api/admin/import/analyze", { method: "POST", body: formData });
      const body = (await response.json()) as { analysis?: ImportAnalysis; error?: string };
      if (!response.ok || !body.analysis) throw new Error(body.error || "解析に失敗しました。");
      setAnalysis(body.analysis);
      setSelectedRows(new Set(body.analysis.rows.map((_, index) => index)));
      setStatus("review");
    } catch (caught) {
      setAnalysis(null);
      setSelectedRows(new Set());
      setStatus("idle");
      setError(caught instanceof Error ? caught.message : "解析に失敗しました。");
    }
  }

  async function commit() {
    if (!analysis || !confirmed || selectedRows.size === 0) return;
    setStatus("committing");
    setError("");
    setCommitMessage("");
    try {
      const response = await fetch("/api/admin/import/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metadata: analysis.metadata,
          rows: analysis.rows.filter((_, index) => selectedRows.has(index))
        })
      });
      const body = (await response.json()) as {
        result?: { counts: Record<string, number>; backupDir: string };
        error?: string;
      };
      if (!response.ok || !body.result) throw new Error(body.error || "CSV更新に失敗しました。");
      setCommitMessage(`CSVとdata/*.tsを更新しました。バックアップ: ${body.result.backupDir}`);
      setStatus("done");
    } catch (caught) {
      setStatus("ready");
      setError(caught instanceof Error ? caught.message : "CSV更新に失敗しました。");
    }
  }

  function updateMetadata(key: keyof ImportMetadata, value: string) {
    setAnalysis((current) =>
      current ? { ...current, metadata: { ...current.metadata, [key]: value } } : current
    );
    setStatus("review");
    setConfirmed(false);
  }

  function toggleSource(source: InputSource) {
    setSelectedSources((current) => {
      const next = new Set(current);
      if (next.has(source)) {
        if (next.size <= 2) return current;
        next.delete(source);
      } else {
        next.add(source);
      }
      return next;
    });
    setStatus("idle");
    setAnalysis(null);
    setError("");
    setCommitMessage("");
    setConfirmed(false);
  }

  function toggleRow(index: number) {
    setSelectedRows((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0 space-y-5">
        <section className="rounded-lg border border-line bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-red-50 text-sash-red">
              <ShieldCheck size={21} />
            </span>
            <div>
              <h2 className="text-lg font-black text-ink">読み込み方法</h2>
              <p className="mt-1 text-sm font-bold leading-6 text-slate-600">
                URL・コピペ・PDFから2つ以上を使い、同じ結果を照合して登録候補を作成します。
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-1 rounded-md bg-field p-1">
            <InputModeButton active={selectedSources.has("url")} icon={<Link2 size={16} />} label="URL" onClick={() => toggleSource("url")} />
            <InputModeButton active={selectedSources.has("text")} icon={<ClipboardPaste size={16} />} label="コピペ" onClick={() => toggleSource("text")} />
            <InputModeButton active={selectedSources.has("pdf")} icon={<FileText size={16} />} label="PDF" onClick={() => toggleSource("pdf")} />
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 rounded-md border border-red-100 bg-red-50/60 px-3 py-2.5">
            <p className="text-xs font-black text-slate-700">最低2つの入力が必須です</p>
            <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs font-black", completedSources >= 2 ? "bg-emerald-50 text-emerald-700" : "bg-white text-sash-red")}>
              入力済み {completedSources}/2
            </span>
          </div>

          <div className="mt-4 grid gap-4">
            {selectedSources.has("url") ? (
              <div>
                <InputPanelHeading icon={<Link2 size={17} />} title="公式結果URL" required />
                <label className="relative block min-w-0">
                  <span className="sr-only">公式結果URL</span>
                  <ExternalLink size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-sash-red" />
                  <input
                    value={url}
                    onChange={(event) => setUrl(event.target.value)}
                    className="h-12 w-full rounded-md border border-line bg-field pl-10 pr-3 text-sm font-bold text-ink outline-none transition placeholder:text-slate-500 focus:border-sash-red focus:ring-2 focus:ring-sash-red/15"
                    placeholder="公式結果ページのURLを入力"
                  />
                </label>
              </div>
            ) : null}

            {selectedSources.has("text") ? (
              <label className="block">
                <InputPanelHeading icon={<ClipboardPaste size={17} />} title="照合用コピペ" required />
                <span className="sr-only">結果表を貼り付け</span>
                <textarea
                  value={pastedText}
                  onChange={(event) => setPastedText(event.target.value)}
                  className="min-h-48 w-full resize-y rounded-md border border-line bg-field px-3 py-3 font-mono text-sm font-bold leading-6 text-ink outline-none transition placeholder:text-slate-500 focus:border-sash-red focus:ring-2 focus:ring-sash-red/15"
                  placeholder="公式ページやPDFからコピーした結果表を貼り付け"
                />
              </label>
            ) : null}

            {selectedSources.has("pdf") ? (
              <div className="rounded-md border border-dashed border-red-200 bg-red-50/25 p-4">
                <InputPanelHeading icon={<FileText size={17} />} title="照合用PDF" required />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  className="sr-only"
                  onChange={(event) => setPdfFile(event.target.files?.[0] ?? null)}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full flex-col items-center justify-center rounded-md px-3 py-7 text-center transition hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sash-red/35"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-white text-sash-red shadow-sm">
                    <Upload size={21} />
                  </span>
                  <span className="mt-3 text-sm font-black text-ink">{pdfFile ? "別のPDFを選択" : "PDFを選択"}</span>
                  <span className="mt-1 text-xs font-bold text-slate-500">公式結果PDFをアップロードします</span>
                </button>
                {pdfFile ? (
                  <div className="mt-2 flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2.5">
                    <Paperclip size={17} className="shrink-0 text-sash-red" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-ink">{pdfFile.name}</p>
                      <p className="text-xs font-bold text-slate-500">{formatFileSize(pdfFile.size)}</p>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-bold text-slate-600">
              <label className="inline-flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={onlyUniversity}
                  onChange={(event) => setOnlyUniversity(event.target.checked)}
                  className="h-4 w-4 accent-[#b3263a]"
                />
                大学所属選手だけを抽出
              </label>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck size={15} className="text-emerald-600" />
                登録前に必ず確認
              </span>
            </div>
            <button
              type="button"
              onClick={analyze}
              disabled={!canAnalyze || status === "analyzing"}
              className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-md bg-sash-red px-5 text-sm font-black text-white transition hover:bg-[#962033] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sash-red/35 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === "analyzing" ? <LoaderCircle size={18} className="animate-spin" /> : <Search size={18} />}
              {status === "analyzing" ? "解析中" : "読み込んで解析"}
            </button>
          </div>

          <div className="mt-4 rounded-md border border-sky-100 bg-sky-50/70 px-3 py-2.5 text-xs font-bold leading-5 text-slate-700">
            <span className="text-sky-700">対応形式：</span>
            HTML結果ページ、コピーしたテキスト、テキストを含むPDF。画像PDFはOCR確認対象として扱います。
          </div>
          {error ? (
            <div role="alert" className="mt-3 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-bold leading-6 text-red-800">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              {error}
            </div>
          ) : null}
        </section>

        <SourcePreview
          selectedSources={selectedSources}
          url={url}
          pastedText={pastedText}
          pdfFile={pdfFile}
          pdfUrl={pdfUrl}
          analyzed={status !== "idle" && status !== "analyzing"}
          sources={analysis?.sources ?? []}
        />

        {status === "idle" || status === "analyzing" ? (
          <InitialState analyzing={status === "analyzing"} completedSources={completedSources} />
        ) : analysis ? (
          <>
            <CrossCheckSummary selectedSources={selectedSources} analysis={analysis} />
            <MeetReview metadata={analysis.metadata} onChange={updateMetadata} />
            <ResultReview
              rows={analysis.rows}
              selectedRows={selectedRows}
              onToggleRow={toggleRow}
              onlyUniversity={onlyUniversity}
            />
            <section className="rounded-lg border border-line bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-black text-ink">CSV更新候補</h2>
                  <p className="mt-1 text-sm font-bold leading-6 text-slate-600">
                    選択した{selectedCount}件から、既存CSVへ追加する行を生成します。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStatus("ready")}
                  disabled={status === "committing" || status === "done"}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-sash-red px-4 text-sm font-black text-white transition hover:bg-[#962033] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sash-red/35"
                >
                  <FileOutput size={18} />
                  CSV更新案を作成
                </button>
              </div>

              {status === "ready" || status === "committing" || status === "done" ? (
                <>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {analysis.files.map((file) => (
                      <div key={file.name} className="flex items-center justify-between gap-3 rounded-md border border-line bg-field px-3 py-2.5">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-ink">{file.name}</p>
                          <p className="mt-0.5 text-xs font-bold text-slate-500">{file.text}</p>
                        </div>
                        <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs font-black", file.count > 0 ? "bg-red-50 text-sash-red" : "bg-white text-slate-500")}>
                          {file.count}件
                        </span>
                      </div>
                    ))}
                  </div>

                  {status !== "done" ? (
                    <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3">
                      <label className="flex cursor-pointer items-start gap-2 text-sm font-bold leading-6 text-amber-950">
                        <input
                          type="checkbox"
                          checked={confirmed}
                          onChange={(event) => setConfirmed(event.target.checked)}
                          className="mt-1 h-4 w-4 accent-[#b3263a]"
                        />
                        原本・大会情報・選択した結果を確認しました。CSV更新とdata/*.ts再生成を実行します。
                      </label>
                      <button
                        type="button"
                        onClick={commit}
                        disabled={!confirmed || status === "committing" || selectedCount === 0}
                        className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-sash-red px-4 text-sm font-black text-white transition hover:bg-[#962033] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sash-red/35 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                      >
                        {status === "committing" ? <LoaderCircle size={18} className="animate-spin" /> : <Database size={18} />}
                        {status === "committing" ? "検証・更新中" : "CSVへ反映する"}
                      </button>
                    </div>
                  ) : null}
                  {commitMessage ? (
                    <div className="mt-4 flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm font-bold leading-6 text-emerald-800">
                      <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                      {commitMessage}
                    </div>
                  ) : null}
                </>
              ) : null}
            </section>
          </>
        ) : null}
      </div>

      <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
        <ImportProgress status={status} />
        {status === "review" || status === "ready" || status === "committing" || status === "done" ? (
          <ReviewSummary selectedCount={selectedCount} issueCount={issueCount} status={status} />
        ) : (
          <SafetyCard />
        )}
      </aside>
    </div>
  );
}

function InitialState({ analyzing, completedSources }: { analyzing: boolean; completedSources: number }) {
  return (
    <section className="rounded-lg border border-dashed border-red-200 bg-red-50/25 px-5 py-12 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-white text-sash-red shadow-sm">
        {analyzing ? <LoaderCircle size={24} className="animate-spin" /> : <Sparkles size={24} />}
      </span>
      <h2 className="mt-4 text-lg font-black text-ink">
        {analyzing ? "複数の入力内容を解析・照合しています" : completedSources < 2 ? "2つ以上の入力を準備してください" : "入力内容を解析できます"}
      </h2>
      <p className="mx-auto mt-2 max-w-lg text-sm font-bold leading-6 text-slate-600">
        {analyzing
          ? "それぞれを独立して解析し、順位・選手・大学・記録・備考を突き合わせています。"
          : "URL・コピペ・PDFのうち2つ以上を使い、同じ内容であることを確認してから登録候補を作成します。"}
      </p>
    </section>
  );
}

function SourcePreview({
  selectedSources,
  url,
  pastedText,
  pdfFile,
  pdfUrl,
  analyzed,
  sources
}: {
  selectedSources: Set<InputSource>;
  url: string;
  pastedText: string;
  pdfFile: File | null;
  pdfUrl: string;
  analyzed: boolean;
  sources: ImportAnalysis["sources"];
}) {
  if (selectedSources.size === 0) return null;

  return (
    <section className="rounded-lg border border-line bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <SectionHeading icon={<Eye size={20} />} title="読み込み内容" description="選択した原本を並べて確認できます。解析後も内容は残ります。" />
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-field px-2.5 py-1 text-xs font-black text-slate-600">
          <ShieldCheck size={13} />
          {selectedSources.size}方式で確認
        </span>
      </div>

      <div className={cn("mt-4 grid gap-3", selectedSources.size >= 2 && "lg:grid-cols-2")}>
        {selectedSources.has("url") ? (
          <SourceTextPanel
            label="URLから取得"
            source={url || "未入力"}
            text={analyzed ? sources.find((source) => source.source === "url")?.preview ?? "取得内容がありません。" : "URL解析後に、取得したページ本文をここで確認できます。"}
            status={analyzed ? "取得済み" : url.trim() ? "解析前" : "未入力"}
            pending={!analyzed}
          />
        ) : null}
        {selectedSources.has("text") ? (
          <SourceTextPanel
            label="コピペから取得"
            source="貼り付けた結果表"
            text={pastedText || "未入力"}
            status={pastedText.trim() ? "入力済み" : "未入力"}
            pending={!pastedText.trim()}
          />
        ) : null}
        {selectedSources.has("pdf") ? (
          <div className="min-w-0 overflow-hidden rounded-md border border-line bg-[#fbfaf9]">
            <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2">
              <div className="min-w-0">
                <p className="text-xs font-black text-slate-600">PDFから取得</p>
                <p className="mt-0.5 truncate text-[11px] font-bold text-slate-500">{pdfFile?.name ?? "未選択"}</p>
              </div>
              <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-black", pdfFile ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500")}>
                {pdfFile ? "選択済み" : "未選択"}
              </span>
            </div>
            {pdfUrl ? (
              <iframe title="読み込んだPDF" src={pdfUrl} className="h-[420px] w-full sm:h-[560px]" />
            ) : (
              <p className="p-4 text-xs font-bold text-slate-500">PDFを選択すると原本を表示します。</p>
            )}
          </div>
        ) : null}
      </div>

      <p className="mt-3 text-xs font-bold leading-5 text-slate-500">
        各原本を独立して保持し、順位・No.・選手・大学・記録・備考が一致するか照合します。
      </p>
    </section>
  );
}

function SourceTextPanel({
  label,
  source,
  text,
  status,
  pending = false
}: {
  label: string;
  source: string;
  text: string;
  status: string;
  pending?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-md border border-line bg-[#fbfaf9]">
      <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2">
        <div className="min-w-0">
          <p className="text-xs font-black text-slate-600">{label}</p>
          <p className="mt-0.5 truncate text-[11px] font-bold text-slate-500">{source}</p>
        </div>
        <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-black", pending ? "bg-slate-100 text-slate-500" : "bg-emerald-50 text-emerald-700")}>
          {status}
        </span>
      </div>
      <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words p-3 font-mono text-xs font-bold leading-6 text-slate-700">
        {text}
      </pre>
    </div>
  );
}

function CrossCheckSummary({
  selectedSources,
  analysis
}: {
  selectedSources: Set<InputSource>;
  analysis: ImportAnalysis;
}) {
  const sourceLabels = [
    selectedSources.has("url") ? "URL" : null,
    selectedSources.has("text") ? "コピペ" : null,
    selectedSources.has("pdf") ? "PDF" : null
  ].filter(Boolean) as string[];

  return (
    <section className="rounded-lg border border-line bg-white p-4 shadow-sm sm:p-5">
      <SectionHeading
        icon={<CheckCircle2 size={20} />}
        title="ダブルチェック結果"
        description={`${sourceLabels.join("・")}の解析結果を項目ごとに照合しました。`}
      />

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <ReviewField label="照合元" value={`${sourceLabels.length}方式`} />
        <ReviewField label="登録候補" value={`${analysis.rows.length}件`} />
        <ReviewField label="完全一致" value={`${analysis.crossCheck.completeMatches}件`} emphasized />
        <ReviewField label="要確認" value={`${analysis.crossCheck.warnings}件`} />
      </div>

      <div className="mt-3 overflow-hidden rounded-md border border-line">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 bg-field px-3 py-2 text-xs font-black text-slate-600 sm:grid-cols-[160px_minmax(0,1fr)_auto]">
          <span>確認項目</span>
          <span className="hidden sm:block">判定内容</span>
          <span>判定</span>
        </div>
        <CheckLine label="結果件数" detail={analysis.crossCheck.details.join(" / ")} status={analysis.crossCheck.warnings ? "要確認" : "一致"} warning={analysis.crossCheck.warnings > 0} />
        <CheckLine label="順位・No." detail={`${analysis.rows.length}件を登録候補として整形`} status="解析済み" />
        <CheckLine label="選手・所属" detail="既存ID、大学略称、未登録候補を照合" status="正規化" warning={analysis.rows.some((row) => row.matchStatus !== "matched")} />
        <CheckLine
          label="記録・備考"
          detail={`PB ${analysis.rows.filter((row) => row.note === "PB").length}件 / DNS ${analysis.rows.filter((row) => row.resultStatus === "dns").length}件 / DNF ${analysis.rows.filter((row) => row.resultStatus === "dnf").length}件`}
          status="確認済み"
        />
      </div>

      {analysis.warnings.length ? (
        <div className="mt-3 rounded-md bg-amber-50 px-3 py-2.5 text-xs font-bold leading-5 text-amber-900">
          {analysis.warnings.join(" ")}
        </div>
      ) : null}
    </section>
  );
}

function CheckLine({
  label,
  detail,
  status,
  warning = false
}: {
  label: string;
  detail: string;
  status: string;
  warning?: boolean;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-t border-line px-3 py-2.5 text-sm font-bold sm:grid-cols-[160px_minmax(0,1fr)_auto]">
      <span className="font-black text-ink">{label}</span>
      <span className="col-span-2 text-xs leading-5 text-slate-600 sm:col-span-1 sm:text-sm">{detail}</span>
      <span className={cn("row-start-1 rounded-full px-2.5 py-1 text-xs font-black sm:col-start-3", warning ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700")}>
        {status}
      </span>
    </div>
  );
}

function InputPanelHeading({
  icon,
  title,
  required = false
}: {
  icon: React.ReactNode;
  title: string;
  required?: boolean;
}) {
  return (
    <div className="mb-2 flex items-center gap-2 text-sash-red">
      {icon}
      <span className="text-sm font-black text-ink">{title}</span>
      {required ? <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-black text-sash-red">照合対象</span> : null}
    </div>
  );
}

function InputModeButton({
  active,
  icon,
  label,
  onClick
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-10 min-w-0 items-center justify-center gap-1.5 rounded px-2 text-xs font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sash-red/35 sm:gap-2 sm:px-3 sm:text-sm",
        active ? "bg-white text-sash-red shadow-sm" : "text-slate-600 hover:bg-white/60 hover:text-ink"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function MeetReview({
  metadata,
  onChange
}: {
  metadata: ImportMetadata;
  onChange: (key: keyof ImportMetadata, value: string) => void;
}) {
  return (
    <section className="rounded-lg border border-line bg-white p-4 shadow-sm sm:p-5">
      <SectionHeading icon={<TableProperties size={20} />} title="大会・レース情報" description="解析結果を確認し、空欄やIDを必要に応じて修正してください。" />
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <MetadataInput label="大会ID" value={metadata.meetId} onChange={(value) => onChange("meetId", value)} />
        <MetadataInput label="大会名" value={metadata.meetName} onChange={(value) => onChange("meetName", value)} />
        <MetadataInput label="レースID" value={metadata.raceId} onChange={(value) => onChange("raceId", value)} />
        <MetadataInput label="レース名" value={metadata.raceName} onChange={(value) => onChange("raceName", value)} />
        <MetadataInput label="開催日" value={metadata.date} onChange={(value) => onChange("date", value)} placeholder="YYYY-MM-DD" />
        <MetadataInput label="開始時刻" value={metadata.startTime} onChange={(value) => onChange("startTime", value)} placeholder="HH:MM（任意）" />
        <MetadataInput label="会場" value={metadata.venue} onChange={(value) => onChange("venue", value)} placeholder="会場未入力でも登録可" />
        <label className="rounded-md bg-field px-3 py-2.5">
          <span className="text-xs font-black text-slate-500">種目</span>
          <select
            value={metadata.distance}
            onChange={(event) => onChange("distance", event.target.value)}
            className="mt-1 h-8 w-full bg-transparent text-sm font-black text-ink outline-none"
          >
            <option value="1500m">1500m</option>
            <option value="5000m">5000m</option>
            <option value="10000m">10000m</option>
            <option value="ハーフ">ハーフ</option>
          </select>
        </label>
      </div>
      <div className="mt-2 rounded-md bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">取込ステータス：結果公開</div>
    </section>
  );
}

function MetadataInput({
  label,
  value,
  onChange,
  placeholder
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="rounded-md bg-field px-3 py-2.5">
      <span className="text-xs font-black text-slate-500">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-1 h-8 w-full bg-transparent text-sm font-black text-ink outline-none placeholder:text-slate-400"
      />
    </label>
  );
}

function ResultReview({
  rows,
  selectedRows,
  onToggleRow,
  onlyUniversity
}: {
  rows: ParsedResult[];
  selectedRows: Set<number>;
  onToggleRow: (index: number) => void;
  onlyUniversity: boolean;
}) {
  return (
    <section className="rounded-lg border border-line bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeading icon={<UserCheck size={20} />} title="解析結果" description="登録対象とID照合結果を確認してください。" />
        <div className="flex flex-wrap gap-2 text-xs font-black">
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
            登録済み {rows.filter((row) => row.matchStatus === "matched").length}件
          </span>
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">
            要確認 {rows.filter((row) => row.matchStatus !== "matched").length}件
          </span>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-md border border-line">
        <table className="min-w-[820px] w-full border-collapse text-left text-sm">
          <thead className="bg-field text-xs font-black text-slate-600">
            <tr>
              <th className="w-12 px-3 py-3">登録</th>
              <th className="px-3 py-3">順位</th>
              <th className="px-3 py-3">選手</th>
              <th className="px-3 py-3">大学</th>
              <th className="px-3 py-3">記録</th>
              <th className="px-3 py-3">備考</th>
              <th className="px-3 py-3">ID照合</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row.athlete}-${row.rank}`} className="border-t border-line font-bold text-slate-700">
                <td className="px-3 py-3">
                  <input
                    type="checkbox"
                    checked={selectedRows.has(index)}
                    onChange={() => onToggleRow(index)}
                    className="h-4 w-4 accent-[#b3263a]"
                    aria-label={`${row.athlete}を登録対象にする`}
                  />
                </td>
                <td className="px-3 py-3 font-black text-ink">{row.rank}</td>
                <td className="px-3 py-3">
                  <p className="font-black text-ink">{row.athlete}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{row.year}・Bib {row.bib}</p>
                </td>
                <td className="px-3 py-3">{row.university}</td>
                <td className="px-3 py-3 font-black text-sash-red">{row.time}</td>
                <td className="px-3 py-3">{row.note ? <ResultNote note={row.note} /> : <span className="text-slate-300">—</span>}</td>
                <td className="px-3 py-3">
                  <MatchBadge status={row.matchStatus} athleteId={row.athleteId} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs font-bold leading-5 text-slate-500">
        {onlyUniversity ? "大学所属選手のみを表示しています。" : "公式結果に含まれるすべての選手を表示しています。"}
        未登録候補はCSV生成前に確認します。
      </p>
    </section>
  );
}

function ImportProgress({ status }: { status: ImportStatus }) {
  const step =
    status === "idle" ? 1 :
    status === "analyzing" ? 2 :
    status === "review" ? 3 :
    status === "ready" ? 4 : 5;
  const items = ["入力を準備", "内容を解析", "内容を確認", "CSV更新案", "CSVへ反映"];

  return (
    <section className="rounded-lg border border-line bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase text-slate-500">Import flow</p>
      <h2 className="mt-1 text-lg font-black text-ink">取込の進行状況</h2>
      <ol className="mt-4 space-y-1">
        {items.map((item, index) => {
          const number = index + 1;
          const completed = number < step || status === "done";
          const active = number === step && status !== "done";
          return (
            <li key={item} className={cn("flex items-center gap-3 rounded-md px-2 py-2.5 text-sm font-black", active ? "bg-red-50 text-sash-red" : "text-slate-600")}>
              <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-full border text-xs", completed ? "border-emerald-200 bg-emerald-50 text-emerald-700" : active ? "border-red-200 bg-white text-sash-red" : "border-line bg-field text-slate-500")}>
                {completed ? <Check size={15} /> : number}
              </span>
              {item}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function ReviewSummary({ selectedCount, issueCount, status }: { selectedCount: number; issueCount: number; status: ImportStatus }) {
  return (
    <section className="rounded-lg border border-line bg-white p-4 shadow-sm">
      <h2 className="text-base font-black text-ink">今回の取込</h2>
      <div className="mt-3 grid gap-2">
        <SummaryLine label="登録対象" value={`${selectedCount}件`} />
        <SummaryLine label="要確認" value={`${issueCount}件`} warning={issueCount > 0} />
        <SummaryLine label="PB候補" value="1件" />
        <SummaryLine label="更新CSV" value="6ファイル" />
      </div>
      <div className={cn("mt-4 rounded-md px-3 py-3 text-xs font-bold leading-5", status === "done" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800")}>
        {status === "done"
          ? "CSVとdata/*.tsの更新が完了しました。画面表示を確認してください。"
          : status === "committing"
            ? "一時ディレクトリで整合性を検証してからCSVへ反映しています。"
            : status === "ready"
              ? "差分を確認し、確認チェックを入れるまでCSVは変更されません。"
              : "要確認項目を確認してからCSV更新案を作成してください。"}
      </div>
    </section>
  );
}

function SafetyCard() {
  return (
    <section className="rounded-lg border border-line bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-sash-red">
        <ShieldCheck size={19} />
        <h2 className="text-base font-black text-ink">安全な取込</h2>
      </div>
      <ul className="mt-3 space-y-2 text-xs font-bold leading-5 text-slate-600">
        <li>・解析だけではCSVを変更しません</li>
        <li>・既存IDとの重複を確認します</li>
        <li>・未登録選手は確認対象にします</li>
        <li>・PBは既存記録と比較します</li>
      </ul>
    </section>
  );
}

function SectionHeading({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 text-sash-red">{icon}</span>
      <div>
        <h2 className="text-lg font-black text-ink">{title}</h2>
        <p className="mt-1 text-sm font-bold leading-6 text-slate-600">{description}</p>
      </div>
    </div>
  );
}

function ReviewField({ label, value, emphasized = false }: { label: string; value: string; emphasized?: boolean }) {
  return (
    <div className="rounded-md bg-field px-3 py-2.5">
      <p className="text-xs font-black text-slate-500">{label}</p>
      <p className={cn("mt-1 text-sm font-black", emphasized ? "text-sash-red" : "text-ink")}>{value}</p>
    </div>
  );
}

function MatchBadge({ status, athleteId }: { status: MatchStatus; athleteId: string }) {
  if (status === "matched") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700">
        <CheckCircle2 size={13} />
        {athleteId}
      </span>
    );
  }
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black", status === "new" ? "bg-sky-50 text-sky-700" : "bg-amber-50 text-amber-700")}>
      <AlertCircle size={13} />
      {status === "new" ? "新規選手" : "要確認"}
    </span>
  );
}

function ResultNote({ note }: { note: string }) {
  const isDns = note === "DNS";
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-black", isDns ? "bg-slate-100 text-slate-600" : "bg-red-50 text-sash-red")}>
      {note}
    </span>
  );
}

function SummaryLine({ label, value, warning = false }: { label: string; value: string; warning?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md bg-field px-3 py-2 text-sm font-black">
      <span className="text-slate-600">{label}</span>
      <span className={warning ? "text-amber-700" : "text-ink"}>{value}</span>
    </div>
  );
}

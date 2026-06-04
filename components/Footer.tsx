export function Footer() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto max-w-6xl px-4 py-7 text-center text-sm text-slate-500 sm:px-6 sm:py-8 sm:text-left">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <p className="font-bold text-ink">大学長距離データベース</p>
          <div className="grid gap-1 leading-6 sm:text-right">
            <p>男子大学長距離・男子大学駅伝を追うための非公式UIプロトタイプです。</p>
            <p>正式な大会情報・記録は各大会公式サイトをご確認ください。</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

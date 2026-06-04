export function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-line bg-white p-4">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-ink">{value}</p>
      {sub ? <p className="mt-1 text-xs font-bold text-slate-500">{sub}</p> : null}
    </div>
  );
}

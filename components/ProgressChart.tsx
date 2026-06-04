import { Athlete } from "@/data/athletes";

export function ProgressChart({ progress }: { progress: Athlete["progress"] }) {
  const max = Math.max(...progress.map((item) => item.value));
  const min = Math.min(...progress.map((item) => item.value));

  return (
    <div className="rounded-lg border border-line bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-black text-ink">成長推移</h3>
        <span className="text-xs font-bold text-slate-500">短いほど好記録</span>
      </div>
      <div className="flex h-48 items-end gap-3">
        {progress.map((item) => {
          const height = 36 + ((max - item.value) / Math.max(max - min, 1)) * 112;
          return (
            <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
              <span className="text-xs font-black text-ink">{item.time}</span>
              <div className="flex h-36 w-full items-end rounded-md bg-field p-1">
                <div className="w-full rounded-sm bg-sash-red" style={{ height }} />
              </div>
              <span className="text-[11px] font-bold text-slate-500">{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

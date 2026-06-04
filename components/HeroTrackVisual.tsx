export function HeroTrackVisual() {
  const runners = [
    { x: "20%", y: "46%", color: "#d99a22", size: "h-24 w-10" },
    { x: "38%", y: "38%", color: "#b3263a", size: "h-32 w-12" },
    { x: "56%", y: "43%", color: "#1c9b63", size: "h-28 w-11" },
    { x: "73%", y: "34%", color: "#164a9f", size: "h-36 w-12" }
  ];

  return (
    <div className="relative min-h-[260px] overflow-hidden bg-gradient-to-br from-sky-100 via-white to-blue-100 md:min-h-[360px]">
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.92)_0%,rgba(255,255,255,0.55)_38%,rgba(255,255,255,0)_39%)]" />
      <div className="absolute bottom-0 left-0 right-0 h-28 bg-[#75aee6]" />
      <div className="absolute bottom-0 left-0 right-0 h-28 opacity-80">
        <span className="absolute bottom-5 left-0 h-px w-full bg-white" />
        <span className="absolute bottom-12 left-0 h-px w-full bg-white" />
        <span className="absolute bottom-20 left-0 h-px w-full bg-white" />
      </div>
      <div className="absolute right-0 top-16 h-28 w-48 border-y border-slate-300 bg-white/45 md:w-72" />
      <div className="absolute right-0 top-24 h-16 w-56 border-y border-slate-300 bg-white/35 md:w-80" />
      <div className="absolute bottom-20 right-8 h-24 w-36 rounded-t-full bg-emerald-200/45 blur-sm" />
      {runners.map((runner, index) => (
        <div key={runner.color} className={`absolute ${runner.size}`} style={{ left: runner.x, bottom: runner.y }}>
          <span className="absolute left-1/2 top-0 h-5 w-5 -translate-x-1/2 rounded-full bg-[#1e2028]" />
          <span className="absolute left-1/2 top-6 h-12 w-7 -translate-x-1/2 rounded-t-full" style={{ backgroundColor: runner.color }} />
          <span className="absolute left-1 top-14 h-16 w-2 origin-top rotate-12 rounded-full bg-[#1e2028]" />
          <span className="absolute right-1 top-14 h-16 w-2 origin-top -rotate-12 rounded-full bg-[#1e2028]" />
          <span className="absolute left-0 top-8 h-2 w-8 origin-right -rotate-12 rounded-full bg-[#1e2028]" />
          <span className="absolute right-0 top-9 h-2 w-8 origin-left rotate-12 rounded-full bg-[#1e2028]" />
          <span className="absolute -bottom-1 left-0 h-1.5 w-8 rounded-full bg-white shadow-sm" />
          <span className="absolute -bottom-1 right-0 h-1.5 w-8 rounded-full bg-white shadow-sm" />
          <span className="absolute -left-1 top-4 text-[10px] font-black text-white/80">{index + 1}</span>
        </div>
      ))}
      <div className="absolute bottom-0 right-6 flex h-28 gap-2">
        <span className="h-full w-2 -skew-x-[22deg] bg-sash-red" />
        <span className="h-full w-2 -skew-x-[22deg] bg-sash-deepRed" />
      </div>
    </div>
  );
}

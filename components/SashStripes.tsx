export function SashStripes({ compact = false }: { compact?: boolean }) {
  const colors = ["#12345c", "#d99a22", "#6750a4", "#23a6d5"];

  return (
    <div className="flex items-center gap-1.5" aria-hidden="true">
      {colors.map((color) => (
        <span
          key={color}
          className={compact ? "h-2.5 w-4 -skew-x-[28deg] rounded-[1px]" : "h-3 w-6 -skew-x-[28deg] rounded-[1px]"}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}

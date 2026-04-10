export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
};

export function Segmented<T extends string>(props: {
  value: T;
  onChange: (v: T) => void;
  options: SegmentedOption<T>[];
}) {
  const idx = Math.max(
    0,
    props.options.findIndex((o) => o.value === props.value),
  );
  const widthPct = 100 / Math.max(1, props.options.length);
  const leftPct = idx * widthPct;

  return (
    <div className="relative inline-flex rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-1">
      <div
        className="absolute inset-y-1 rounded-xl bg-[var(--app-accent-soft)] ring-1 ring-[rgba(95,208,176,0.28)] transition-all"
        style={{ width: `${widthPct}%`, left: `${leftPct}%` }}
        aria-hidden="true"
      />
      {props.options.map((o) => {
        const active = o.value === props.value;
        return (
          <button
            key={o.value}
            onClick={() => props.onChange(o.value)}
            className={[
              "relative z-10 min-w-24 rounded-lg px-3 py-2 text-sm font-medium transition",
              active ? "text-[var(--app-text)]" : "text-[var(--app-text-muted)] hover:text-[var(--app-text)]",
            ].join(" ")}
            type="button"
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}


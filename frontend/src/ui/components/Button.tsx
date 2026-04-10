import type { ButtonHTMLAttributes } from "react";

export function Button(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className, ...rest } = props;
  return (
    <button
      className={[
        "rounded-xl border border-[var(--app-border-strong)] bg-[var(--app-accent-strong)] px-4 py-2 font-semibold text-slate-950 shadow-[0_12px_30px_rgba(64,187,152,0.18)] transition hover:bg-[var(--app-accent)] disabled:opacity-50 disabled:shadow-none",
        className ?? "",
      ].join(" ")}
      {...rest}
    />
  );
}


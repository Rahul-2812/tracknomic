import type { InputHTMLAttributes } from "react";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return (
    <input
      className={[
        "w-full rounded-xl border border-[var(--app-border)] bg-[rgba(17,31,50,0.72)] px-3 py-2.5 text-[var(--app-text)] placeholder:text-[var(--app-text-soft)] focus:border-[var(--app-accent)] focus:outline-none focus:ring-2 focus:ring-[rgba(95,208,176,0.15)]",
        className ?? "",
      ].join(" ")}
      {...rest}
    />
  );
}


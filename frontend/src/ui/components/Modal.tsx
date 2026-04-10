import { useEffect } from "react";

export function Modal(props: {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    if (!props.open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") props.onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [props.open, props.onClose]);

  if (!props.open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        className="absolute inset-0 bg-[rgba(2,8,16,0.72)]"
        aria-label="Close modal"
        onClick={props.onClose}
      />
      <div className="relative mx-auto mt-20 w-full max-w-2xl px-4">
        <div className="rounded-[28px] border border-[var(--app-border)] bg-[var(--app-surface-strong)] shadow-[var(--app-shadow)] backdrop-blur">
          {(props.title || props.footer) && (
            <div className="flex items-center justify-between gap-3 border-b border-[var(--app-border)] px-5 py-4">
              <div className="text-base font-semibold">{props.title ?? ""}</div>
              <button className="text-sm text-[var(--app-text-muted)] hover:text-[var(--app-text)]" onClick={props.onClose}>
                Close
              </button>
            </div>
          )}
          <div className="px-5 py-5">{props.children}</div>
          {props.footer && (
            <div className="border-t border-[var(--app-border)] px-5 py-4">
              <div className="flex items-center justify-end gap-2">{props.footer}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


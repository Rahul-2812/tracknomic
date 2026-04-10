import { NavLink, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { clearToken, getAmountsVisible, getToken, setAmountsVisible, setToken } from "../lib/storage";
import {
  api,
  type Category,
  type Contact,
  type Dashboard,
  type Holding,
  type Payable,
  type PaymentMode,
  type Platform,
  type Receivable,
  type SettlementEntry,
} from "../lib/api";
import { Button } from "./components/Button";
import { Input } from "./components/Input";
import { Card } from "./components/Card";
import { Modal } from "./components/Modal";
import { Segmented } from "./components/Segmented";
import { formatINRFromCents, parseRupeesToCents } from "../lib/money";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard" },
  { to: "/wealth", label: "My Wealth" },
  { to: "/payables", label: "Payables" },
  { to: "/receivables", label: "Receivables" },
  { to: "/settings", label: "Settings" },
] as const;

const HIDDEN_AMOUNT_MASK = "••••••";

const AmountVisibilityContext = createContext<{
  amountsVisible: boolean;
  toggleAmountsVisible: () => void;
} | null>(null);

function useAmountVisibility() {
  const value = useContext(AmountVisibilityContext);
  if (!value) throw new Error("AmountVisibilityContext is not available");
  return value;
}

function formatMoneyDisplay(cents: number, amountsVisible: boolean, options?: { signed?: boolean }) {
  if (amountsVisible) {
    const sign = options?.signed && cents > 0 ? "+" : "";
    return `${sign}${formatINRFromCents(cents)}`;
  }

  if (!options?.signed) return HIDDEN_AMOUNT_MASK;
  if (cents < 0) return `-${HIDDEN_AMOUNT_MASK}`;
  if (cents > 0) return `+${HIDDEN_AMOUNT_MASK}`;
  return HIDDEN_AMOUNT_MASK;
}

function Shell(props: { title: string; subtitle?: string; actions?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="min-h-screen pb-24 lg:pb-0">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:gap-6 lg:px-6 lg:py-6">
        <div className="rounded-[28px] border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-4 py-4 shadow-[var(--app-shadow)] backdrop-blur lg:hidden">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-lg font-semibold tracking-tight text-[var(--app-text)]">Finance Tracker</div>
              <div className="text-sm text-[var(--app-text-muted)]">Assets, liabilities, and cash flow in one place</div>
            </div>
            <AuthStatus compact />
          </div>
        </div>

        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-6 space-y-4">
            <div className="px-2">
              <div className="text-xl font-semibold tracking-tight text-[var(--app-text)]">Finance Tracker</div>
              <div className="text-sm text-[var(--app-text-muted)]">Assets & liabilities manager</div>
            </div>

            <nav className="space-y-1">
              {NAV_ITEMS.map((item) => (
                <SideLink key={item.to} to={item.to} label={item.label} />
              ))}
            </nav>

            <div className="px-2">
              <AuthStatus />
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="mb-6 rounded-[28px] border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-4 shadow-[var(--app-shadow)] backdrop-blur sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-2xl font-semibold tracking-tight">{props.title}</div>
              {props.subtitle && <div className="text-sm text-[var(--app-text-muted)]">{props.subtitle}</div>}
            </div>
            <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:justify-end">
              {props.actions}
            </div>
            </div>
          </header>
          <main>{props.children}</main>
        </div>
      </div>

      <MobileNav />
    </div>
  );
}

function SideLink(props: { to: string; label: string }) {
  return (
    <NavLink
      to={props.to}
      end={props.to === "/"}
      className={({ isActive }) =>
        [
          "mx-2 flex items-center gap-2 rounded-2xl px-3 py-2 text-sm transition",
          isActive
            ? "bg-[var(--app-accent-soft)] text-[var(--app-accent)] ring-1 ring-[rgba(95,208,176,0.28)]"
            : "text-[var(--app-text-muted)] hover:bg-[rgba(12,24,39,0.82)] hover:text-[var(--app-text)]",
        ].join(" ")
      }
    >
      <span className="h-2 w-2 rounded-full bg-[rgba(95,208,176,0.55)]" />
      <span>{props.label}</span>
    </NavLink>
  );
}

function AuthStatus(props: { compact?: boolean }) {
  const nav = useNavigate();
  const token = getToken();
  if (!token) return null;
  return (
    <div
      className={[
        "flex items-center justify-between rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-3 py-2",
        props.compact ? "min-w-[124px] gap-3" : "",
      ].join(" ")}
    >
      <div className="text-xs text-[var(--app-text-muted)]">Signed in</div>
      <button
        className="text-xs text-[var(--app-text-muted)] hover:text-[var(--app-text)]"
        onClick={() => {
          clearToken();
          nav("/login");
        }}
      >
        Logout
      </button>
    </div>
  );
}

function MobileNav() {
  if (!getToken()) return null;

  return (
    <nav className="fixed inset-x-3 bottom-3 z-20 rounded-[28px] border border-[var(--app-border)] bg-[rgba(6,15,26,0.92)] p-2 shadow-[var(--app-shadow)] backdrop-blur lg:hidden">
      <div className="grid grid-cols-5 gap-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              [
                "rounded-2xl px-2 py-2 text-center text-[11px] font-medium leading-tight transition",
                isActive
                  ? "bg-[var(--app-accent-soft)] text-[var(--app-accent)] ring-1 ring-[rgba(95,208,176,0.28)]"
                  : "text-[var(--app-text-muted)] hover:bg-[rgba(12,24,39,0.82)] hover:text-[var(--app-text)]",
              ].join(" ")
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

function LoginPage() {
  const nav = useNavigate();
  const [username, setUsername] = useState("rahul");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl items-center">
        <Card className="relative w-full overflow-hidden p-6 sm:p-8 lg:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.14),transparent_30%)]" />
          <div className="relative flex min-h-[78vh] flex-col justify-between gap-10">
            <div className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
              <div className="space-y-4">
                <div className="inline-flex rounded-full border border-[rgba(95,208,176,0.28)] bg-[var(--app-accent-soft)] px-3 py-1 text-xs font-medium uppercase tracking-[0.28em] text-[var(--app-accent)]">
                  Finance Tracker
                </div>
                <div className="space-y-3">
                  <h1 className="max-w-xl text-3xl font-semibold tracking-tight text-[var(--app-text)] sm:text-4xl lg:text-5xl">
                    Login
                  </h1>
                  <p className="max-w-md text-sm leading-6 text-[var(--app-text-muted)] sm:text-base">
                    A personal Finance workspace.
                  </p>
                </div>
              </div>

              <div className="mx-auto w-full max-w-lg rounded-[28px] border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-6 shadow-[var(--app-shadow)] backdrop-blur sm:p-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-[var(--app-accent)]">Hey Rahul!!</div>
                    <div className="text-2xl font-semibold tracking-tight text-[var(--app-text)]">Welcome back</div>
                    <div className="text-sm text-[var(--app-text-muted)]">Enter your username and password to continue.</div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="mb-1 text-sm text-[var(--app-text-muted)]">Username</div>
                      <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="rahul" />
                    </div>
                    <div>
                      <div className="mb-1 text-sm text-[var(--app-text-muted)]">Password</div>
                      <Input
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        type="password"
                        placeholder="Enter your password"
                      />
                    </div>
                    {error && <div className="text-sm text-rose-400">{error}</div>}
                    <Button
                      disabled={busy}
                      className="w-full"
                      onClick={async () => {
                        setBusy(true);
                        setError(null);
                        try {
                          const res = await api.login(username, password);
                          setToken(res.accessToken);
                          nav("/");
                        } catch (e: any) {
                          setError(e?.message ?? "Request failed");
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      {busy ? "Please wait..." : "Login"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <div className="pt-2 text-center text-sm text-[var(--app-text-muted)]">Made with love ♥</div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function defaultFromDate() {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - 30);
  return from.toISOString().slice(0, 10);
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function downloadCsvFile(filename: string, rows: Array<Array<string | number | null | undefined>>) {
  const escape = (value: string) => `"${value.replaceAll('"', '""')}"`;
  const csv = rows
    .map((row) => row.map((cell) => escape(String(cell ?? ""))).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function settlementStatusClass(status: "PENDING" | "PARTIAL" | "PAID") {
  if (status === "PAID") return "text-[var(--app-accent)]";
  if (status === "PARTIAL") return "text-amber-300";
  return "text-[var(--app-danger)]";
}

function resolveContactGroupName(contactName?: string | null) {
  return contactName?.trim() || "Unassigned contact";
}

function resolveContactGroupKey(contactId?: string | null, contactName?: string | null) {
  return contactId || `unassigned:${resolveContactGroupName(contactName).toLowerCase()}`;
}

function aggregateSettlementStatus(totalCents: number, settledCents: number, outstandingCents: number): "PENDING" | "PARTIAL" | "PAID" {
  if (totalCents > 0 && outstandingCents === 0) return "PAID";
  if (settledCents === 0) return "PENDING";
  return "PARTIAL";
}

function joinCategoryNames(items: Array<{ categoryName: string }>) {
  return Array.from(new Set(items.map((item) => item.categoryName))).join(", ");
}

function SettlementHistory(props: {
  itemNote?: string | null;
  payments: SettlementEntry[];
  amountsVisible: boolean;
  emptyLabel: string;
}) {
  return (
    <div className="space-y-1 text-xs leading-5 text-[var(--app-text-muted)]">
      {props.itemNote && <div>Entry note: {props.itemNote}</div>}
      {props.payments.length ? (
        props.payments.map((payment) => (
          <div key={payment.id}>
            {payment.paymentDate} • {payment.paymentModeName} • {formatMoneyDisplay(payment.amountCents, props.amountsVisible)}
            {payment.note ? ` • ${payment.note}` : ""}
          </div>
        ))
      ) : (
        <div>{props.emptyLabel}</div>
      )}
    </div>
  );
}

function DashboardPage() {
  const { amountsVisible, toggleAmountsVisible } = useAmountVisibility();
  const [email, setEmail] = useState("");
  const [dash, setDash] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [fromDate, setFromDate] = useState(defaultFromDate);
  const [toDate, setToDate] = useState(todayDate);

  useEffect(() => {
    (async () => {
      try {
        setError(null);
        const me = await api.me();
        setEmail(me.email);

        const d = await api.dashboard(fromDate, toDate);
        setDash(d);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load");
      }
    })();
  }, [fromDate, toDate]);

  const assetsCents = dash ? dash.assetsCents : 0;
  const pendingPayablesCents = dash ? dash.pendingPayablesCents : 0;
  const pendingReceivablesCents = dash ? dash.pendingReceivablesCents : 0;
  const netWorthCents = assetsCents - pendingPayablesCents + pendingReceivablesCents;

  return (
    <Shell
      title="Dashboard"
      subtitle="Your financial overview"
      actions={
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap">
          <div className="hidden text-xs text-[var(--app-text-muted)] sm:block">Range</div>
          <Input
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            type="date"
            className="min-w-[148px] flex-1 sm:w-auto sm:flex-none"
          />
          <Input
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            type="date"
            className="min-w-[148px] flex-1 sm:w-auto sm:flex-none"
          />
          <button
            type="button"
            className="inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl border border-[var(--app-border)] bg-[rgba(17,31,50,0.72)] text-[var(--app-text)] transition hover:bg-[rgba(22,38,58,0.9)]"
            onClick={toggleAmountsVisible}
            title={amountsVisible ? "Hide amounts" : "Show amounts"}
            aria-label={amountsVisible ? "Hide amounts" : "Show amounts"}
          >
            {amountsVisible ? (
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                <path d="M3 3 21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M10.6 5.2A10.7 10.7 0 0 1 12 5c6 0 9.5 7 9.5 7a15.6 15.6 0 0 1-3 3.7" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="M6.5 6.7C4 8.5 2.5 12 2.5 12s3.5 7 9.5 7c1.4 0 2.7-.3 3.9-.8" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="M9.9 9.9A3 3 0 0 0 14.1 14.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            )}
          </button>
          <Button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await api.sendDashboardEmail({ from: fromDate, to: toDate });
              } finally {
                setBusy(false);
              }
            }}
            className="flex shrink-0 items-center gap-2 px-2.5 py-2 text-sm"
            title="Send email summary"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
              <path
                d="M4 6.75h16v10.5H4V6.75Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <path
                d="M4.8 7.5 12 13l7.2-5.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
            <span className="hidden sm:inline">{busy ? "Sending..." : "Email summary"}</span>
            <span className="sm:hidden">{busy ? "Sending..." : "Email"}</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {error && <div className="text-sm text-rose-400">{error}</div>}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="app-metric-card">
            <div className="app-metric-label">Total Assets</div>
            <div className="mt-2 text-2xl font-semibold text-[var(--app-accent)]">
              {dash ? formatMoneyDisplay(assetsCents, amountsVisible) : "..."}
            </div>
          </Card>
          <Card className="app-metric-card">
            <div className="app-metric-label">Pending Payables</div>
            <div className="mt-2 text-2xl font-semibold text-[var(--app-danger)]">
              {dash ? formatMoneyDisplay(pendingPayablesCents, amountsVisible) : "..."}
            </div>
          </Card>
          <Card className="app-metric-card">
            <div className="app-metric-label">Pending Receivables</div>
            <div className="mt-2 text-2xl font-semibold text-[var(--app-accent)]">
              {dash ? formatMoneyDisplay(pendingReceivablesCents, amountsVisible) : "..."}
            </div>
          </Card>
          <Card className="app-metric-card">
            <div className="app-metric-label">Net Worth</div>
            <div
              className={[
                "mt-2 text-2xl font-semibold",
                netWorthCents < 0 ? "text-[var(--app-danger)]" : "text-[var(--app-text)]",
              ].join(" ")}
            >
              {dash ? formatMoneyDisplay(netWorthCents, amountsVisible) : "..."}
            </div>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <CategoryTotalsCard
            title="Assets by category"
            items={dash?.assetsByCategory ?? []}
            showPercentBar
          />
          <CategoryTotalsCard
            title="Payables by category"
            items={dash?.payablesByCategory ?? []}
          />
          <CategoryTotalsCard
            title="Receivables by category"
            items={dash?.receivablesByCategory ?? []}
          />
        </div>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Portfolio performance</h2>
            <div className="text-xs text-[var(--app-text-muted)]">Total portfolio value points</div>
          </div>

          <div className="mt-4">
            {dash?.performance?.length ? (
              <div className="space-y-4">
                <PerformanceLineChart points={dash.performance} />
                <div className="app-table-shell">
                  <table className="app-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dash.performance.map((p) => (
                        <tr key={p.date}>
                          <td>{p.date}</td>
                          <td className="font-semibold">{formatMoneyDisplay(p.totalPortfolioValueCents, amountsVisible)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-sm text-[var(--app-text-muted)]">
                No performance snapshots in this range. Record a snapshot from <NavLink to="/wealth" className="text-[var(--app-accent)] hover:underline">My Wealth</NavLink>.
              </div>
            )}
          </div>
        </Card>
      </div>
    </Shell>
  );
}

function CategoryTotalsCard(props: {
  title: string;
  items: { categoryId: string; categoryName: string; totalCents: number }[];
  showPercentBar?: boolean;
}) {
  const { amountsVisible } = useAmountVisibility();
  const sum = props.items.reduce((acc, i) => acc + i.totalCents, 0);
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">{props.title}</h3>
        <div className="text-xs text-[var(--app-text-muted)]">{props.items.length} total</div>
      </div>
      <div className="mt-4 space-y-2">
        {props.items.length ? (
          props.items.map((i) => (
            <div
              key={i.categoryId}
              className={[
                "app-inline-surface px-3 py-3",
                props.showPercentBar ? "space-y-1" : "flex items-center justify-between",
              ].join(" ")}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-[var(--app-text)]">{i.categoryName}</span>
                <div className="flex items-center gap-2">
                  {props.showPercentBar && (
                    <span className="text-xs text-[var(--app-text-muted)]">{sum > 0 ? `${Math.round(i.totalCents / sum * 100)}%` : "—"}</span>
                  )}
                  <span className="text-xs font-semibold sm:text-sm">{formatMoneyDisplay(i.totalCents, amountsVisible)}</span>
                </div>
              </div>
              {props.showPercentBar && (
                <div className="h-2 w-full overflow-hidden rounded-full bg-[rgba(18,34,53,0.88)] ring-1 ring-[var(--app-border)]">
                  <div
                    className="h-full rounded-full bg-[var(--app-accent)]"
                    style={{ width: `${sum > 0 ? Math.max(2, Math.min(100, (i.totalCents / sum) * 100)) : 0}%` }}
                  />
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-sm text-[var(--app-text-muted)]">No data yet. Add items in the corresponding page.</div>
        )}
      </div>
    </Card>
  );
}

function PerformanceLineChart(props: { points: { date: string; totalPortfolioValueCents: number }[] }) {
  const { amountsVisible } = useAmountVisibility();
  const points = props.points;
  const width = 740;
  const height = 260;
  const pad = 30;

  const values = points.map((p) => p.totalPortfolioValueCents);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const plotWidth = width - pad * 2;
  const plotHeight = height - pad * 2;
  const xStep = points.length <= 1 ? 0 : plotWidth / (points.length - 1);

  const yFor = (v: number) => pad + (plotHeight - (v - min) / range * plotHeight);

  const path = points
    .map((p, i) => {
      const x = pad + i * xStep;
      const y = yFor(p.totalPortfolioValueCents);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  const first = points[0]?.date;
  const last = points[points.length - 1]?.date;

  return (
    <div className="app-soft-panel rounded-[24px] p-4">
      <div className="flex items-end justify-between gap-4">
        <div className="text-sm text-[var(--app-text-muted)]">
          <div>Min: {formatMoneyDisplay(min, amountsVisible)}</div>
          <div>Max: {formatMoneyDisplay(max, amountsVisible)}</div>
        </div>
        <div className="text-xs text-[var(--app-text-soft)]">{first} → {last}</div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="mt-3 h-60 w-full">
        <line x1={pad} y1={pad} x2={pad} y2={pad + plotHeight} stroke="rgba(147,166,187,0.6)" strokeWidth="1" />
        <line x1={pad} y1={pad + plotHeight} x2={pad + plotWidth} y2={pad + plotHeight} stroke="rgba(147,166,187,0.6)" strokeWidth="1" />

        <path d={path} fill="none" stroke="rgb(95 208 176)" strokeWidth="2.2" />

        {points.map((p, i) => {
          const x = pad + i * xStep;
          const y = yFor(p.totalPortfolioValueCents);
          return <circle key={p.date} cx={x} cy={y} r="3.5" fill="rgb(95 208 176)" />;
        })}
      </svg>
    </div>
  );
}

function WealthPage() {
  const { amountsVisible } = useAmountVisibility();
  const [categories, setCategories] = useState<Category[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const assetCategories = useMemo(() => categories.filter((c) => c.type === "ASSET"), [categories]);

  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [view, setView] = useState<"grouped" | "table">("grouped");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const [catId, setCatId] = useState<string>("");
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState("");
  const [amount, setAmount] = useState("");
  const [marketValue, setMarketValue] = useState("");
  const [note, setNote] = useState("");

  const [snapshotDate, setSnapshotDate] = useState(todayDate());
  const [snapshotMessage, setSnapshotMessage] = useState<string | null>(null);
  const [collapsedPlatforms, setCollapsedPlatforms] = useState<string[]>([]);

  const [editId, setEditId] = useState<string | null>(null);
  const [editCatId, setEditCatId] = useState<string>("");
  const [editName, setEditName] = useState("");
  const [editPlatform, setEditPlatform] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editMarketValue, setEditMarketValue] = useState("");
  const [editNote, setEditNote] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setError(null);
        const [cats, platformList, holdingList] = await Promise.all([
          api.listCategories(),
          api.listPlatforms(),
          api.listHoldings(),
        ]);
        setCategories(cats);
        setPlatforms(platformList);
        setHoldings(holdingList);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const downloadCsv = () => {
    downloadCsvFile(`my-wealth-${todayDate()}.csv`, [
      ["Name", "Category", "Platform", "Amount", "MarketValue", "GainLoss"],
      ...holdings.map((h) => {
        const mv = h.marketValueCents ?? h.amountCents;
        const gl = mv - h.amountCents;
        return [
          h.name,
          h.categoryName,
          h.platform ?? "",
          (h.amountCents / 100).toFixed(2),
          (mv / 100).toFixed(2),
          (gl / 100).toFixed(2),
        ];
      }),
    ]);
  };

  const platformOptions = useMemo(() => {
    const names = new Set<string>();
    for (const platformEntry of platforms) {
      const trimmed = platformEntry.name.trim();
      if (trimmed) names.add(trimmed);
    }
    for (const holding of holdings) {
      const trimmed = holding.platform?.trim();
      if (trimmed) names.add(trimmed);
    }
    return Array.from(names).sort((left, right) => left.localeCompare(right));
  }, [holdings, platforms]);

  const startEdit = (h: Holding) => {
    setEditId(h.id);
    setEditCatId(h.categoryId);
    setEditName(h.name);
    setEditPlatform(h.platform ?? "");
    setEditAmount((h.amountCents / 100).toFixed(2));
    setEditMarketValue(h.marketValueCents == null ? "" : (h.marketValueCents / 100).toFixed(2));
    setEditNote(h.note ?? "");
    setError(null);
    setEditOpen(true);
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditCatId("");
    setEditName("");
    setEditPlatform("");
    setEditAmount("");
    setEditMarketValue("");
    setEditNote("");
    setEditOpen(false);
  };

  const platformGroups = useMemo(() => {
    const map = new Map<string, Holding[]>();
    for (const h of holdings) {
      const key = (h.platform ?? "").trim() || "Unknown";
      const list = map.get(key);
      if (list) list.push(h);
      else map.set(key, [h]);
    }

    const groups = Array.from(map.entries()).map(([platformName, items]) => {
      const totalMarketValueCents = items.reduce((acc, it) => acc + (it.marketValueCents ?? it.amountCents), 0);
      const gainLossCents = items.reduce((acc, it) => acc + (it.marketValueCents ?? it.amountCents) - it.amountCents, 0);
      return { platformName, items, totalMarketValueCents, gainLossCents };
    });

    groups.sort((a, b) => b.totalMarketValueCents - a.totalMarketValueCents);
    return groups;
  }, [holdings]);

  useEffect(() => {
    setCollapsedPlatforms((current) => current.filter((platformName) => platformGroups.some((group) => group.platformName === platformName)));
  }, [platformGroups]);

  const togglePlatformCollapsed = (platformName: string) => {
    setCollapsedPlatforms((current) =>
      current.includes(platformName)
        ? current.filter((name) => name !== platformName)
        : [...current, platformName],
    );
  };

  return (
    <Shell
      title="My Wealth"
      subtitle="Add holdings and record valuation snapshots"
      actions={
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <div className="min-w-[210px] flex-1 sm:min-w-0 sm:flex-none">
            <Segmented
              value={view}
              onChange={setView}
              options={[
                { value: "grouped", label: "Grouped" },
                { value: "table", label: "Table" },
              ]}
            />
          </div>
          <Button onClick={downloadCsv} className="flex items-center gap-2 px-3 py-2 text-sm sm:px-4">
            <span>CSV</span>
          </Button>
          <Button
            onClick={() => setAddOpen(true)}
            className="flex shrink-0 items-center gap-2"
          >
            <span className="text-lg leading-none">+</span>
            <span>Add Holding</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {error && <div className="text-sm text-rose-400">{error}</div>}

        <Modal
          open={addOpen}
          title="Add holding"
          onClose={() => {
            if (busy) return;
            setAddOpen(false);
          }}
          footer={
            <>
              <Button disabled={busy} className="!border-[var(--app-border)] !bg-[rgba(17,31,50,0.72)] !text-[var(--app-text)] hover:!bg-[rgba(22,38,58,0.9)]" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    const cents = parseRupeesToCents(amount);
                    if (!Number.isFinite(cents) || cents <= 0) {
                      setError("Enter a valid amount (₹), e.g. 250.75");
                      return;
                    }
                    if (!catId) {
                      setError("Select an asset category in Settings.");
                      return;
                    }
                    const mvTrimmed = marketValue.trim();
                    const mvCents = mvTrimmed ? parseRupeesToCents(mvTrimmed) : null;
                    if (mvCents !== null && (!Number.isFinite(mvCents) || mvCents <= 0)) {
                      setError("Enter a valid market value (₹), e.g. 250.75 (or leave blank)");
                      return;
                    }

                    await api.createHolding({
                      categoryId: catId,
                      name,
                      platform: platform || undefined,
                      amountCents: cents,
                      marketValueCents: mvCents,
                      note: note || undefined,
                    });
                    setHoldings(await api.listHoldings());
                    setCatId("");
                    setName("");
                    setPlatform("");
                    setAmount("");
                    setMarketValue("");
                    setNote("");
                    setError(null);
                    setAddOpen(false);
                  } catch (e: any) {
                    setError(e?.message ?? "Failed to save holding");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {busy ? "Saving..." : "Add holding"}
              </Button>
            </>
          }
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <div className="mb-1 text-sm text-[var(--app-text-muted)]">Category</div>
              <select
                className="app-select"
                value={catId}
                onChange={(e) => setCatId(e.target.value)}
              >
                <option value="">Select Category</option>
                {assetCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="mb-1 text-sm text-[var(--app-text-muted)]">Holding name</div>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Index Fund" />
            </div>
            <div>
              <div className="mb-1 text-sm text-[var(--app-text-muted)]">Platform</div>
              <select
                className="app-select"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                disabled={!platformOptions.length}
              >
                <option value="">Select Platform</option>
                {platformOptions.map((platformName) => (
                  <option key={platformName} value={platformName}>
                    {platformName}
                  </option>
                ))}
              </select>
              {!platformOptions.length && (
                <div className="mt-1 text-xs text-[var(--app-text-muted)]">Add a platform in Settings to use it here.</div>
              )}
            </div>
            <div>
              <div className="mb-1 text-sm text-[var(--app-text-muted)]">Amount (₹)</div>
              <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 10000.00" />
            </div>
            <div>
              <div className="mb-1 text-sm text-[var(--app-text-muted)]">Market value (₹)</div>
              <Input value={marketValue} onChange={(e) => setMarketValue(e.target.value)} placeholder="optional" />
            </div>
            <div className="sm:col-span-2">
              <div className="mb-1 text-sm text-[var(--app-text-muted)]">Note (optional)</div>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="optional" />
            </div>
          </div>
        </Modal>

        <Card className="p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Holdings</h2>
              <div className="text-xs text-[var(--app-text-muted)]">{holdings.length} holdings</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xs text-[var(--app-text-muted)]">Record snapshot</div>
              <Input
                value={snapshotDate}
                onChange={(e) => setSnapshotDate(e.target.value)}
                type="date"
                className="w-auto"
              />
              <Button
                onClick={async () => {
                  setSnapshotMessage(null);
                  try {
                    await api.createValuationSnapshot({ snapshotDate });
                    setSnapshotMessage("Snapshot recorded.");
                  } catch (e: any) {
                    setSnapshotMessage(e?.message ?? "Failed to record snapshot.");
                  }
                }}
              >
                Record
              </Button>
            </div>
          </div>

          {snapshotMessage && <div className="mt-3 text-sm text-[var(--app-accent)]">{snapshotMessage}</div>}

          <div className="mt-6">
            <Modal
              open={editOpen && !!editId}
              title="Edit holding"
              onClose={() => {
                if (busy) return;
                cancelEdit();
              }}
              footer={
                <>
                  <Button disabled={busy} className="!border-[var(--app-border)] !bg-[rgba(17,31,50,0.72)] !text-[var(--app-text)] hover:!bg-[rgba(22,38,58,0.9)]" onClick={() => cancelEdit()}>
                    Cancel
                  </Button>
                  <Button
                    disabled={busy}
                    onClick={async () => {
                      if (!editId) return;
                      setBusy(true);
                      try {
                        const cents = parseRupeesToCents(editAmount);
                        if (!Number.isFinite(cents) || cents <= 0) {
                          setError("Enter a valid amount (₹), e.g. 250.75");
                          return;
                        }
                        if (!editCatId) {
                          setError("Select an asset category in Settings.");
                          return;
                        }

                        const mvTrimmed = editMarketValue.trim();
                        const mvCents = mvTrimmed ? parseRupeesToCents(mvTrimmed) : null;
                        if (mvCents !== null && (!Number.isFinite(mvCents) || mvCents <= 0)) {
                          setError("Enter a valid market value (₹), e.g. 250.75 (or leave blank)");
                          return;
                        }

                        await api.updateHolding(editId, {
                          categoryId: editCatId,
                          name: editName,
                          platform: editPlatform.trim() ? editPlatform.trim() : null,
                          amountCents: cents,
                          marketValueCents: mvCents,
                          note: editNote.trim() ? editNote.trim() : null,
                        });

                        setHoldings(await api.listHoldings());
                        cancelEdit();
                        setError(null);
                      } catch (e: any) {
                        setError(e?.message ?? "Failed to update holding");
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    {busy ? "Saving..." : "Save changes"}
                  </Button>
                </>
              }
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="mb-1 text-sm text-[var(--app-text-muted)]">Category</div>
                  <select
                    className="app-select"
                    value={editCatId}
                    onChange={(e) => setEditCatId(e.target.value)}
                  >
                    <option value="">Select Category</option>
                    {assetCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="mb-1 text-sm text-[var(--app-text-muted)]">Holding name</div>
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="e.g. Index Fund" />
                </div>
                <div>
                  <div className="mb-1 text-sm text-[var(--app-text-muted)]">Platform</div>
                  <select
                    className="app-select"
                    value={editPlatform}
                    onChange={(e) => setEditPlatform(e.target.value)}
                    disabled={!platformOptions.length}
                  >
                    <option value="">Select Platform</option>
                    {platformOptions.map((platformName) => (
                      <option key={platformName} value={platformName}>
                        {platformName}
                      </option>
                    ))}
                  </select>
                  {!platformOptions.length && (
                    <div className="mt-1 text-xs text-[var(--app-text-muted)]">Add a platform in Settings to use it here.</div>
                  )}
                </div>
                <div>
                  <div className="mb-1 text-sm text-[var(--app-text-muted)]">Amount (₹)</div>
                  <Input value={editAmount} onChange={(e) => setEditAmount(e.target.value)} placeholder="10000.00" />
                </div>
                <div>
                  <div className="mb-1 text-sm text-[var(--app-text-muted)]">Market value (₹)</div>
                  <Input value={editMarketValue} onChange={(e) => setEditMarketValue(e.target.value)} placeholder="optional" />
                </div>
                <div className="sm:col-span-2">
                  <div className="mb-1 text-sm text-[var(--app-text-muted)]">Note (optional)</div>
                  <Input value={editNote} onChange={(e) => setEditNote(e.target.value)} placeholder="optional" />
                </div>
              </div>
            </Modal>

            {view === "grouped" ? (
              <div className="space-y-4">
                {platformGroups.length ? (
                  platformGroups.map((g) => {
                    const glClass = g.gainLossCents < 0 ? "text-[var(--app-danger)]" : "text-[var(--app-accent)]";
                    const isCollapsed = collapsedPlatforms.includes(g.platformName);
                    return (
                      <div key={g.platformName} className="app-inline-surface">
                        <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-start gap-3">
                            <button
                              type="button"
                              className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[var(--app-border)] bg-[rgba(17,31,50,0.72)] text-[var(--app-text)] transition hover:bg-[rgba(22,38,58,0.9)]"
                              onClick={() => togglePlatformCollapsed(g.platformName)}
                              title={isCollapsed ? `Expand ${g.platformName}` : `Collapse ${g.platformName}`}
                              aria-label={isCollapsed ? `Expand ${g.platformName}` : `Collapse ${g.platformName}`}
                            >
                              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                                <path
                                  d={isCollapsed ? "M8 10l4 4 4-4" : "M8 14l4-4 4 4"}
                                  stroke="currentColor"
                                  strokeWidth="1.8"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>
                            <div>
                              <div className="text-base font-semibold text-[var(--app-text)]">{g.platformName}</div>
                              <div className="text-sm text-[var(--app-text-muted)]">{g.items.length} holdings</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-8">
                            <div className="text-right">
                              <div className={`font-black text-lg ${glClass}`}>
                                {formatMoneyDisplay(g.gainLossCents, amountsVisible, { signed: true })}
                              </div>
                              <div className="text-xs text-[var(--app-text-muted)] uppercase tracking-wide">Gain/Loss</div>
                            </div>
                            <div className="text-right">
                              <div className="font-black text-lg text-[var(--app-accent)]">
                                {formatMoneyDisplay(g.totalMarketValueCents, amountsVisible)}
                              </div>
                              <div className="text-xs text-[var(--app-text-muted)] uppercase tracking-wide">Total</div>
                            </div>
                          </div>
                        </div>

                        {!isCollapsed && (
                          <div className="app-table-shell rounded-none border-x-0 border-b-0 border-t-[1px] border-[var(--app-border)] bg-transparent">
                            <table className="app-table">
                              <thead>
                                <tr>
                                  <th>Name</th>
                                  <th>Category</th>
                                  <th>Amount</th>
                                  <th>Market value</th>
                                  <th>Gain/Loss</th>
                                  <th>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {g.items.map((h) => {
                                  const mv = h.marketValueCents ?? h.amountCents;
                                  const gl = mv - h.amountCents;
                                  const rowGlClass = gl < 0 ? "text-[var(--app-danger)]" : "text-[var(--app-accent)]";
                                  return (
                                    <tr key={h.id}>
                                      <td className="font-semibold text-[var(--app-text)]">{h.name}</td>
                                      <td className="text-[var(--app-text-muted)]">{h.categoryName}</td>
                                      <td className="font-semibold">{formatMoneyDisplay(h.amountCents, amountsVisible)}</td>
                                      <td className="font-semibold">{formatMoneyDisplay(mv, amountsVisible)}</td>
                                      <td className={`font-semibold ${rowGlClass}`}>
                                        {formatMoneyDisplay(gl, amountsVisible, { signed: true })}
                                      </td>
                                      <td>
                                        <div className="flex items-center gap-2">
                                          <button
                                            className="app-icon-button"
                                            onClick={() => startEdit(h)}
                                            title="Edit"
                                          >
                                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                                              <path
                                                d="M4 20h4l10.5-10.5a2 2 0 0 0 0-2.8l-1.2-1.2a2 2 0 0 0-2.8 0L4 16v4Z"
                                                stroke="currentColor"
                                                strokeWidth="1.8"
                                                strokeLinejoin="round"
                                              />
                                              <path
                                                d="M13.5 6.5 17.5 10.5"
                                                stroke="currentColor"
                                                strokeWidth="1.8"
                                                strokeLinejoin="round"
                                              />
                                            </svg>
                                          </button>
                                          <button
                                            className="app-danger-button"
                                            onClick={async () => {
                                              if (!confirm(`Delete holding \"${h.name}\"?`)) return;
                                              try {
                                                await api.deleteHolding(h.id);
                                                setHoldings(await api.listHoldings());
                                              } catch (e: any) {
                                                setError(e?.message ?? "Failed to delete holding");
                                              }
                                            }}
                                            title="Delete"
                                          >
                                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                                              <path
                                                d="M6 7h12"
                                                stroke="currentColor"
                                                strokeWidth="1.8"
                                                strokeLinecap="round"
                                              />
                                              <path
                                                d="M10 7V5h4v2"
                                                stroke="currentColor"
                                                strokeWidth="1.8"
                                                strokeLinejoin="round"
                                              />
                                              <path
                                                d="M8 7l1 14h6l1-14"
                                                stroke="currentColor"
                                                strokeWidth="1.8"
                                                strokeLinejoin="round"
                                              />
                                            </svg>
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                                {!g.items.length && (
                                  <tr>
                                    <td colSpan={6} className="app-table-empty">
                                      No holdings in this platform.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-sm text-[var(--app-text-muted)]">No holdings yet. Click + Add Holding.</div>
                )}
              </div>
            ) : (
              <div className="app-table-shell">
                <table className="app-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Amount</th>
                      <th>Market value</th>
                      <th>Gain/Loss</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holdings.map((h) => {
                      const mv = h.marketValueCents ?? h.amountCents;
                      const gl = mv - h.amountCents;
                      const rowGlClass = gl < 0 ? "text-[var(--app-danger)]" : "text-[var(--app-accent)]";
                      return (
                        <tr key={h.id}>
                          <td className="font-semibold text-[var(--app-text)]">{h.name}</td>
                          <td className="text-[var(--app-text-muted)]">{h.categoryName}</td>
                          <td className="font-semibold">{formatMoneyDisplay(h.amountCents, amountsVisible)}</td>
                          <td className="font-semibold">{formatMoneyDisplay(mv, amountsVisible)}</td>
                          <td className={`font-semibold ${rowGlClass}`}>
                            {formatMoneyDisplay(gl, amountsVisible, { signed: true })}
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              <button
                                className="app-icon-button"
                                onClick={() => startEdit(h)}
                                title="Edit"
                              >
                                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                                  <path
                                    d="M4 20h4l10.5-10.5a2 2 0 0 0 0-2.8l-1.2-1.2a2 2 0 0 0-2.8 0L4 16v4Z"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinejoin="round"
                                  />
                                  <path
                                    d="M13.5 6.5 17.5 10.5"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </button>
                              <button
                                className="app-danger-button"
                                onClick={async () => {
                                  if (!confirm(`Delete holding \"${h.name}\"?`)) return;
                                  try {
                                    await api.deleteHolding(h.id);
                                    setHoldings(await api.listHoldings());
                                  } catch (e: any) {
                                    setError(e?.message ?? "Failed to delete holding");
                                  }
                                }}
                                title="Delete"
                              >
                                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                                  <path d="M6 7h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                  <path d="M10 7V5h4v2" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                                  <path d="M8 7l1 14h6l1-14" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {!holdings.length && (
                      <tr>
                        <td colSpan={6} className="app-table-empty">
                          No holdings yet. Click + Add Holding.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      </div>
    </Shell>
  );
}

function PayablesPage() {
  const { amountsVisible } = useAmountVisibility();
  const [categories, setCategories] = useState<Category[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const payableCategories = useMemo(() => categories.filter((c) => c.type === "PAYABLE"), [categories]);
  const [payables, setPayables] = useState<Payable[]>([]);
  const [paymentModes, setPaymentModes] = useState<PaymentMode[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [recordOpen, setRecordOpen] = useState(false);
  const [activePayable, setActivePayable] = useState<Payable | null>(null);
  const [collapsedContacts, setCollapsedContacts] = useState<string[]>([]);

  const [catId, setCatId] = useState("");
  const [contactId, setContactId] = useState("");
  const [dueDate, setDueDate] = useState(todayDate());
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(todayDate());
  const [paymentModeId, setPaymentModeId] = useState("");
  const [paymentNote, setPaymentNote] = useState("");

  // edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editCatId, setEditCatId] = useState("");
  const [editContactId, setEditContactId] = useState("");
  const [editDueDate, setEditDueDate] = useState(todayDate());
  const [editAmount, setEditAmount] = useState("");
  const [editNote, setEditNote] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const startEditPayable = (p: Payable) => {
    setEditId(p.id);
    setEditCatId(p.categoryId);
    setEditContactId(p.contactId ?? "");
    setEditDueDate(p.dueDate);
    setEditAmount((p.amountCents / 100).toFixed(2));
    setEditNote(p.note ?? "");
    setError(null);
    setEditOpen(true);
  };

  const cancelEditPayable = () => {
    setEditId(null);
    setEditOpen(false);
  };

  const loadPayablesPage = async () => {
    const [cats, loadedContacts, payableItems, modes] = await Promise.all([
      api.listCategories(),
      api.listContacts(),
      api.listPayables(),
      api.listPaymentModes(),
    ]);
    setCategories(cats);
    setContacts(loadedContacts);
    setPayables(payableItems);
    setPaymentModes(modes);
  };

  useEffect(() => {
    (async () => {
      try {
        setError(null);
        await loadPayablesPage();
      } catch (e: any) {
        setError(e?.message ?? "Failed to load");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const downloadCsv = () => {
    downloadCsvFile(`payables-${todayDate()}.csv`, [
      ["Due", "Category", "Contact", "Total", "Paid", "Outstanding", "Status", "Note"],
      ...payables.map((payable) => [
        payable.dueDate,
        payable.categoryName,
        payable.contactName ?? "",
        (payable.amountCents / 100).toFixed(2),
        (payable.paidCents / 100).toFixed(2),
        (payable.outstandingCents / 100).toFixed(2),
        payable.status,
        payable.note ?? "",
      ]),
    ]);
  };

  const openRecordModal = (payable: Payable) => {
    if (!paymentModes.length) {
      setError("Add at least one payment mode in Settings before recording a payment.");
      return;
    }
    setActivePayable(payable);
    setPaymentAmount((payable.outstandingCents / 100).toFixed(2));
    setPaymentDate(todayDate());
    setPaymentModeId("");
    setPaymentNote("");
    setRecordOpen(true);
  };

  const groupedPayables = useMemo(() => {
    const groups = new Map<string, {
      key: string;
      contactName: string;
      items: Payable[];
      amountCents: number;
      paidCents: number;
      outstandingCents: number;
      status: "PENDING" | "PARTIAL" | "PAID";
      dueDate: string;
      categoryNames: string;
    }>();

    payables.forEach((payable) => {
      const key = resolveContactGroupKey(payable.contactId, payable.contactName);
      const current = groups.get(key);
      if (current) {
        current.items.push(payable);
        current.amountCents += payable.amountCents;
        current.paidCents += payable.paidCents;
        current.outstandingCents += payable.outstandingCents;
        current.dueDate = payable.dueDate < current.dueDate ? payable.dueDate : current.dueDate;
        current.categoryNames = joinCategoryNames(current.items);
        current.status = aggregateSettlementStatus(current.amountCents, current.paidCents, current.outstandingCents);
        return;
      }

      groups.set(key, {
        key,
        contactName: resolveContactGroupName(payable.contactName),
        items: [payable],
        amountCents: payable.amountCents,
        paidCents: payable.paidCents,
        outstandingCents: payable.outstandingCents,
        status: aggregateSettlementStatus(payable.amountCents, payable.paidCents, payable.outstandingCents),
        dueDate: payable.dueDate,
        categoryNames: payable.categoryName,
      });
    });

    return Array.from(groups.values())
      .map((group) => ({
        ...group,
        items: [...group.items].sort((left, right) => left.dueDate.localeCompare(right.dueDate)),
        categoryNames: joinCategoryNames(group.items),
      }))
      .sort((left, right) => left.dueDate.localeCompare(right.dueDate) || left.contactName.localeCompare(right.contactName));
  }, [payables]);

  return (
    <Shell
      title="Payables"
      subtitle="Liabilities you need to pay"
      actions={
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <Button onClick={downloadCsv} className="flex shrink-0 items-center gap-2">
            <span>CSV</span>
          </Button>
          <Button onClick={() => setAddOpen(true)} className="flex shrink-0 items-center gap-2">
            <span className="text-lg leading-none">+</span>
            <span>Add Payable</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {error && <div className="text-sm text-rose-400">{error}</div>}

        <Modal
          open={addOpen}
          title="Add payable"
          onClose={() => {
            if (busy) return;
            setAddOpen(false);
          }}
          footer={
            <>
              <Button disabled={busy} className="!border-[var(--app-border)] !bg-[rgba(17,31,50,0.72)] !text-[var(--app-text)] hover:!bg-[rgba(22,38,58,0.9)]" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    const cents = parseRupeesToCents(amount);
                    if (!Number.isFinite(cents) || cents <= 0) {
                      setError("Enter a valid amount (₹), e.g. 250.75");
                      return;
                    }
                    if (!catId) {
                      setError("Select a payable category in Settings.");
                      return;
                    }
                    if (!contactId) {
                      setError("Add and select a contact in Settings before creating a payable.");
                      return;
                    }
                    await api.createPayable({
                      categoryId: catId,
                      contactId,
                      amountCents: cents,
                      dueDate,
                      note: note || undefined,
                    });
                    setPayables(await api.listPayables());
                    setAmount("");
                    setNote("");
                    setError(null);
                    setAddOpen(false);
                  } catch (e: any) {
                    setError(e?.message ?? "Failed to add payable");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {busy ? "Saving..." : "Add payable"}
              </Button>
            </>
          }
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <div className="mb-1 text-sm text-[var(--app-text-muted)]">Contact <span className="text-xs opacity-60">(who you owe money to)</span></div>
              <select className="app-select" value={contactId} onChange={(e) => setContactId(e.target.value)}>
                <option value="">— Select contact —</option>
                {!contacts.length && <option value="" disabled>No contacts yet. Add one in Settings.</option>}
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="mb-1 text-sm text-[var(--app-text-muted)]">Category <span className="text-xs opacity-60">(e.g. Rent, Loan, Medical)</span></div>
              <select
                className="app-select"
                value={catId}
                onChange={(e) => setCatId(e.target.value)}
              >
                <option value="">— Select category —</option>
                {payableCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="mb-1 text-sm text-[var(--app-text-muted)]">Amount (₹)</div>
              <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 5000.00" />
            </div>
            <div>
              <div className="mb-1 text-sm text-[var(--app-text-muted)]">Due date</div>
              <Input value={dueDate} onChange={(e) => setDueDate(e.target.value)} type="date" className="w-full" />
            </div>
            <div className="sm:col-span-2">
              <div className="mb-1 text-sm text-[var(--app-text-muted)]">Note (optional)</div>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="optional" />
            </div>
          </div>
        </Modal>

        <Modal
          open={recordOpen}
          title={activePayable ? `Record payment for ${activePayable.contactName || activePayable.categoryName}` : "Record payment"}
          onClose={() => {
            if (busy) return;
            setRecordOpen(false);
            setActivePayable(null);
          }}
          footer={
            <>
              <Button
                disabled={busy}
                className="!border-[var(--app-border)] !bg-[rgba(17,31,50,0.72)] !text-[var(--app-text)] hover:!bg-[rgba(22,38,58,0.9)]"
                onClick={() => {
                  setRecordOpen(false);
                  setActivePayable(null);
                }}
              >
                Cancel
              </Button>
              <Button
                disabled={busy || !activePayable}
                onClick={async () => {
                  if (!activePayable) return;
                  setBusy(true);
                  try {
                    const cents = parseRupeesToCents(paymentAmount);
                    if (!Number.isFinite(cents) || cents <= 0) {
                      setError("Enter a valid payment amount.");
                      return;
                    }
                    if (cents > activePayable.outstandingCents) {
                      setError("Payment exceeds outstanding balance.");
                      return;
                    }
                    if (!paymentModeId) {
                      setError("Select a payment mode.");
                      return;
                    }
                    await api.createPayablePayment(activePayable.id, {
                      amountCents: cents,
                      paymentDate,
                      paymentModeId,
                      note: paymentNote || undefined,
                    });
                    setPayables(await api.listPayables());
                    setError(null);
                    setRecordOpen(false);
                    setActivePayable(null);
                  } catch (e: any) {
                    setError(e?.message ?? "Failed to record payment");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {busy ? "Saving..." : "Record payment"}
              </Button>
            </>
          }
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <div className="mb-1 text-sm text-[var(--app-text-muted)]">Amount (₹)</div>
              <Input value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="1000.00" />
            </div>
            <div>
              <div className="mb-1 text-sm text-[var(--app-text-muted)]">Payment date</div>
              <Input value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} type="date" className="w-full" />
            </div>
            <div>
              <div className="mb-1 text-sm text-[var(--app-text-muted)]">Payment mode</div>
              <select className="app-select" value={paymentModeId} onChange={(e) => setPaymentModeId(e.target.value)}>
                <option value="">— Select mode —</option>
                {paymentModes.map((mode) => (
                  <option key={mode.id} value={mode.id}>
                    {mode.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="mb-1 text-sm text-[var(--app-text-muted)]">Outstanding</div>
              <Input value={activePayable ? formatINRFromCents(activePayable.outstandingCents) : "-"} readOnly />
            </div>
            <div className="sm:col-span-2">
              <div className="mb-1 text-sm text-[var(--app-text-muted)]">Notes</div>
              <Input value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)} placeholder="optional" />
            </div>
          </div>
        </Modal>

        <Modal
          open={editOpen}
          title="Edit payable"
          onClose={() => { if (busy) return; cancelEditPayable(); }}
          footer={
            <>
              <Button disabled={busy} className="!border-[var(--app-border)] !bg-[rgba(17,31,50,0.72)] !text-[var(--app-text)] hover:!bg-[rgba(22,38,58,0.9)]" onClick={cancelEditPayable}>
                Cancel
              </Button>
              <Button
                disabled={busy}
                onClick={async () => {
                  if (!editId) return;
                  setBusy(true);
                  try {
                    const cents = parseRupeesToCents(editAmount);
                    if (!Number.isFinite(cents) || cents <= 0) { setError("Enter a valid amount."); return; }
                    if (!editCatId) { setError("Select a category."); return; }
                    if (!editContactId) { setError("Select a contact."); return; }
                    await api.updatePayable(editId, {
                      categoryId: editCatId,
                      contactId: editContactId,
                      amountCents: cents,
                      dueDate: editDueDate,
                      note: editNote || null,
                    });
                    setPayables(await api.listPayables());
                    setError(null);
                    cancelEditPayable();
                  } catch (e: any) {
                    setError(e?.message ?? "Failed to update payable");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {busy ? "Saving..." : "Save changes"}
              </Button>
            </>
          }
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <div className="mb-1 text-sm text-[var(--app-text-muted)]">Category</div>
              <select className="app-select" value={editCatId} onChange={(e) => setEditCatId(e.target.value)}>
                {payableCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <div className="mb-1 text-sm text-[var(--app-text-muted)]">Due date</div>
              <Input value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} type="date" className="w-full" />
            </div>
            <div>
              <div className="mb-1 text-sm text-[var(--app-text-muted)]">Contact</div>
              <select className="app-select" value={editContactId} onChange={(e) => setEditContactId(e.target.value)}>
                {contacts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <div className="mb-1 text-sm text-[var(--app-text-muted)]">Amount (₹)</div>
              <Input value={editAmount} onChange={(e) => setEditAmount(e.target.value)} placeholder="5000.00" />
            </div>
            <div className="sm:col-span-2">
              <div className="mb-1 text-sm text-[var(--app-text-muted)]">Note (optional)</div>
              <Input value={editNote} onChange={(e) => setEditNote(e.target.value)} placeholder="optional" />
            </div>
          </div>
        </Modal>

        <div className="space-y-4">
          {groupedPayables.length ? (
            groupedPayables.map((group) => {
              const isCollapsed = collapsedContacts.includes(group.key);
              return (
                <div key={group.key} className="app-inline-surface">
                  <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[var(--app-border)] bg-[rgba(17,31,50,0.72)] text-[var(--app-text)] transition hover:bg-[rgba(22,38,58,0.9)]"
                        onClick={() => setCollapsedContacts((c) => c.includes(group.key) ? c.filter((k) => k !== group.key) : [...c, group.key])}
                        title={isCollapsed ? `Expand ${group.contactName}` : `Collapse ${group.contactName}`}
                        aria-label={isCollapsed ? `Expand ${group.contactName}` : `Collapse ${group.contactName}`}
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                          <path d={isCollapsed ? "M8 10l4 4 4-4" : "M8 14l4-4 4 4"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      <div>
                        <div className="text-base font-semibold text-[var(--app-text)]">{group.contactName}</div>
                        <div className="text-sm text-[var(--app-text-muted)]">{group.items.length} {group.items.length === 1 ? "entry" : "entries"}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 pl-11 sm:pl-0">
                      <div className="text-right">
                        <div className="font-bold text-base text-[var(--app-text)]">{formatMoneyDisplay(group.amountCents, amountsVisible)}</div>
                        <div className="text-xs text-[var(--app-text-muted)] uppercase tracking-wide">Total</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-base text-[var(--app-accent)]">{formatMoneyDisplay(group.paidCents, amountsVisible)}</div>
                        <div className="text-xs text-[var(--app-text-muted)] uppercase tracking-wide">Paid</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-base text-[var(--app-danger)]">{formatMoneyDisplay(group.outstandingCents, amountsVisible)}</div>
                        <div className="text-xs text-[var(--app-text-muted)] uppercase tracking-wide">Outstanding</div>
                      </div>
                      <span className={["text-sm font-semibold", settlementStatusClass(group.status)].join(" ")}>{group.status}</span>
                    </div>
                  </div>
                  {!isCollapsed && (
                    <div className="app-table-shell rounded-none border-x-0 border-b-0 border-t-[1px] border-[var(--app-border)] bg-transparent">
                      <table className="app-table">
                        <thead>
                          <tr>
                            <th>Category</th>
                            <th>Due</th>
                            <th>Total</th>
                            <th>Paid</th>
                            <th>Outstanding</th>
                            <th>History</th>
                            <th>Action</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.items.map((payable) => (
                            <tr key={payable.id} className="align-top">
                              <td className="font-semibold text-[var(--app-text)]">{payable.categoryName}</td>
                              <td>{payable.dueDate}</td>
                              <td>{formatMoneyDisplay(payable.amountCents, amountsVisible)}</td>
                              <td className="text-[var(--app-accent)]">{formatMoneyDisplay(payable.paidCents, amountsVisible)}</td>
                              <td className="text-[var(--app-danger)]">{formatMoneyDisplay(payable.outstandingCents, amountsVisible)}</td>
                              <td>
                                <SettlementHistory
                                  itemNote={payable.note}
                                  payments={payable.payments}
                                  amountsVisible={amountsVisible}
                                  emptyLabel="No payments yet."
                                />
                              </td>
                              <td>
                                <div className="flex items-center gap-2">
                                  {payable.outstandingCents > 0 ? (
                                    <Button onClick={() => openRecordModal(payable)} className="whitespace-nowrap">
                                      Record payment
                                    </Button>
                                  ) : (
                                    <span className="text-sm text-[var(--app-text-muted)]">Fully paid</span>
                                  )}
                                  <button className="app-icon-button" onClick={() => startEditPayable(payable)} title="Edit">
                                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true"><path d="M4 20h4l10.5-10.5a2 2 0 0 0 0-2.8l-1.2-1.2a2 2 0 0 0-2.8 0L4 16v4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="M13.5 6.5 17.5 10.5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
                                  </button>
                                  <button className="app-danger-button" title="Delete" onClick={async () => {
                                    if (!confirm(`Delete this payable (${payable.categoryName}, ${formatINRFromCents(payable.amountCents)})?`)) return;
                                    try {
                                      await api.deletePayable(payable.id);
                                      setPayables(await api.listPayables());
                                    } catch (e: any) {
                                      setError(e?.message ?? "Failed to delete payable");
                                    }
                                  }}>
                                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true"><path d="M6 7h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><path d="M10 7V5h4v2" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="M8 7l1 14h6l1-14" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
                                  </button>
                                </div>
                              </td>
                              <td>
                                <span className={["text-sm font-semibold", settlementStatusClass(payable.status)].join(" ")}>{payable.status}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-sm text-[var(--app-text-muted)]">No payables yet. Click + Add Payable.</div>
          )}
        </div>
      </div>
    </Shell>
  );
}

function ReceivablesPage() {
  const { amountsVisible } = useAmountVisibility();
  const [categories, setCategories] = useState<Category[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const receivableCategories = useMemo(() => categories.filter((c) => c.type === "RECEIVABLE"), [categories]);
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [paymentModes, setPaymentModes] = useState<PaymentMode[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [recordOpen, setRecordOpen] = useState(false);
  const [activeReceivable, setActiveReceivable] = useState<Receivable | null>(null);
  const [historyReceivable, setHistoryReceivable] = useState<Receivable | null>(null);
  const [noteReceivable, setNoteReceivable] = useState<Receivable | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<string[]>([]);
  const [collapsedPersons, setCollapsedPersons] = useState<string[]>([]);

  const [catId, setCatId] = useState("");
  const [contactId, setContactId] = useState("");
  const [lentModeId, setLentModeId] = useState("");
  const [expectedOn, setExpectedOn] = useState(todayDate());
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(todayDate());
  const [paymentModeId, setPaymentModeId] = useState("");
  const [paymentNote, setPaymentNote] = useState("");

  // edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editCatId, setEditCatId] = useState("");
  const [editContactId, setEditContactId] = useState("");
  const [editExpectedOn, setEditExpectedOn] = useState(todayDate());
  const [editLentModeId, setEditLentModeId] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editNote, setEditNote] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const startEditReceivable = (r: Receivable) => {
    setEditId(r.id);
    setEditCatId(r.categoryId);
    setEditContactId(r.contactId ?? "");
    setEditExpectedOn(r.expectedOn);
    setEditLentModeId(r.lentModeId ?? "");
    setEditAmount((r.amountCents / 100).toFixed(2));
    setEditNote(r.note ?? "");
    setError(null);
    setEditOpen(true);
  };

  const cancelEditReceivable = () => {
    setEditId(null);
    setEditOpen(false);
  };

  const loadReceivablesPage = async () => {
    const [cats, loadedContacts, receivableItems, modes] = await Promise.all([
      api.listCategories(),
      api.listContacts(),
      api.listReceivables(),
      api.listPaymentModes(),
    ]);
    setCategories(cats);
    setContacts(loadedContacts);
    setReceivables(receivableItems);
    setPaymentModes(modes);
  };

  useEffect(() => {
    (async () => {
      try {
        setError(null);
        await loadReceivablesPage();
      } catch (e: any) {
        setError(e?.message ?? "Failed to load");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const downloadCsv = () => {
    downloadCsvFile(`receivables-${todayDate()}.csv`, [
      ["Expected", "Category", "Contact", "Total", "Received", "Outstanding", "Status", "Note"],
      ...receivables.map((receivable) => [
        receivable.expectedOn,
        receivable.categoryName,
        receivable.contactName ?? "",
        (receivable.amountCents / 100).toFixed(2),
        (receivable.receivedCents / 100).toFixed(2),
        (receivable.outstandingCents / 100).toFixed(2),
        receivable.status,
        receivable.note ?? "",
      ]),
    ]);
  };

  const openRecordModal = (receivable: Receivable) => {
    if (!paymentModes.length) {
      setError("Add at least one payment mode in Settings before recording a collection.");
      return;
    }
    setActiveReceivable(receivable);
    setPaymentAmount((receivable.outstandingCents / 100).toFixed(2));
    setPaymentDate(todayDate());
    setPaymentModeId("");
    setPaymentNote("");
    setRecordOpen(true);
  };

  type PersonSubGroup = {
    contactId: string;
    contactName: string;
    items: Receivable[];
    amountCents: number;
    receivedCents: number;
    outstandingCents: number;
    status: "PENDING" | "PARTIAL" | "PAID";
  };
  type CategoryGroup = {
    categoryId: string;
    categoryName: string;
    isPersonCat: boolean;
    items: Receivable[]; // non-person rows directly
    subGroups: PersonSubGroup[]; // person contact sub-groups
    amountCents: number;
    receivedCents: number;
    outstandingCents: number;
    status: "PENDING" | "PARTIAL" | "PAID";
  };

  const groupedReceivables = useMemo((): CategoryGroup[] => {
    const catMap = new Map<string, CategoryGroup>();

    receivables.forEach((r) => {
      let catGroup = catMap.get(r.categoryId);
      if (!catGroup) {
        const isPersonCat = r.categoryName.trim().toLowerCase() === "person";
        catGroup = {
          categoryId: r.categoryId,
          categoryName: r.categoryName,
          isPersonCat,
          items: [],
          subGroups: [],
          amountCents: 0,
          receivedCents: 0,
          outstandingCents: 0,
          status: "PENDING",
        };
        catMap.set(r.categoryId, catGroup);
      }
      catGroup.amountCents += r.amountCents;
      catGroup.receivedCents += r.receivedCents;
      catGroup.outstandingCents += r.outstandingCents;

      if (catGroup.isPersonCat && r.contactId) {
        let sub = catGroup.subGroups.find((s) => s.contactId === r.contactId);
        if (!sub) {
          sub = {
            contactId: r.contactId,
            contactName: r.contactName ?? r.contactId,
            items: [],
            amountCents: 0,
            receivedCents: 0,
            outstandingCents: 0,
            status: "PENDING",
          };
          catGroup.subGroups.push(sub);
        }
        sub.items.push(r);
        sub.amountCents += r.amountCents;
        sub.receivedCents += r.receivedCents;
        sub.outstandingCents += r.outstandingCents;
      } else {
        catGroup.items.push(r);
      }
    });

    return Array.from(catMap.values())
      .map((cg) => ({
        ...cg,
        status: aggregateSettlementStatus(cg.amountCents, cg.receivedCents, cg.outstandingCents),
        items: [...cg.items].sort((a, b) => a.expectedOn.localeCompare(b.expectedOn)),
        subGroups: cg.subGroups
          .map((sg) => ({
            ...sg,
            status: aggregateSettlementStatus(sg.amountCents, sg.receivedCents, sg.outstandingCents),
            items: [...sg.items].sort((a, b) => a.expectedOn.localeCompare(b.expectedOn)),
          }))
          .sort((a, b) => a.contactName.localeCompare(b.contactName)),
      }))
      .sort((a, b) => a.categoryName.localeCompare(b.categoryName));
  }, [receivables]);

  return (
    <Shell
      title="Receivables"
      subtitle="Assets you expect to receive"
      actions={
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <Button onClick={downloadCsv} className="flex shrink-0 items-center gap-2">
            <span>CSV</span>
          </Button>
          <Button onClick={() => setAddOpen(true)} className="flex shrink-0 items-center gap-2">
            <span className="text-lg leading-none">+</span>
            <span>Add Receivable</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {error && <div className="text-sm text-rose-400">{error}</div>}

        <Modal
          open={addOpen}
          title="Add receivable"
          onClose={() => {
            if (busy) return;
            setAddOpen(false);
          }}
          footer={
            <>
              <Button disabled={busy} className="!border-[var(--app-border)] !bg-[rgba(17,31,50,0.72)] !text-[var(--app-text)] hover:!bg-[rgba(22,38,58,0.9)]" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    const cents = parseRupeesToCents(amount);
                    if (!Number.isFinite(cents) || cents <= 0) {
                      setError("Enter a valid amount (₹), e.g. 250.75");
                      return;
                    }
                    if (!catId) {
                      setError("Select a receivable category.");
                      return;
                    }
                    const isPersonCatAdd = receivableCategories.find(c => c.id === catId)?.name.trim().toLowerCase() === "person";
                    if (isPersonCatAdd && !contactId) {
                      setError("Select a person from the contact list.");
                      return;
                    }
                    await api.createReceivable({
                      categoryId: catId,
                      contactId: isPersonCatAdd ? contactId : null,
                      amountCents: cents,
                      expectedOn,
                      lentModeId: lentModeId || null,
                      note: note || undefined,
                    });
                    setReceivables(await api.listReceivables());
                    setAmount("");
                    setNote("");
                    setLentModeId("");
                    setError(null);
                    setAddOpen(false);
                  } catch (e: any) {
                    setError(e?.message ?? "Failed to add receivable");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {busy ? "Saving..." : "Add receivable"}
              </Button>
            </>
          }
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <div className="mb-1 text-sm text-[var(--app-text-muted)]">Category</div>
              <select
                className="app-select"
                value={catId}
                onChange={(e) => {
                  const newCatId = e.target.value;
                  setCatId(newCatId);
                  const newCat = receivableCategories.find(c => c.id === newCatId);
                  if (newCat?.name.trim().toLowerCase() !== "person") setContactId("");
                }}
              >
                <option value="">— Select category —</option>
                {receivableCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            {receivableCategories.find(c => c.id === catId)?.name.trim().toLowerCase() === "person" && (
              <div className="sm:col-span-2">
                <div className="mb-1 text-sm text-[var(--app-text-muted)]">From <span className="text-xs opacity-60">(select person)</span></div>
                <select className="app-select" value={contactId} onChange={(e) => setContactId(e.target.value)}>
                  <option value="">— Select person —</option>
                  {!contacts.length && <option value="" disabled>No contacts yet. Add one in Settings.</option>}
                  {contacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <div className="mb-1 text-sm text-[var(--app-text-muted)]">Amount (₹)</div>
              <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 5000.00" />
            </div>
            <div>
              <div className="mb-1 text-sm text-[var(--app-text-muted)]">Date</div>
              <Input value={expectedOn} onChange={(e) => setExpectedOn(e.target.value)} type="date" className="w-full" />
            </div>
            <div className="sm:col-span-2">
              <div className="mb-1 text-sm text-[var(--app-text-muted)]">Lent via (optional)</div>
              <select className="app-select" value={lentModeId} onChange={(e) => setLentModeId(e.target.value)}>
                <option value="">— Select mode —</option>
                {paymentModes.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <div className="mb-1 text-sm text-[var(--app-text-muted)]">Note (optional)</div>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="optional" />
            </div>
          </div>
        </Modal>

        <Modal
          open={recordOpen}
          title={activeReceivable ? `Record collection from ${activeReceivable.contactName || activeReceivable.categoryName}` : "Record collection"}
          onClose={() => {
            if (busy) return;
            setRecordOpen(false);
            setActiveReceivable(null);
          }}
          footer={
            <>
              <Button
                disabled={busy}
                className="!border-[var(--app-border)] !bg-[rgba(17,31,50,0.72)] !text-[var(--app-text)] hover:!bg-[rgba(22,38,58,0.9)]"
                onClick={() => {
                  setRecordOpen(false);
                  setActiveReceivable(null);
                }}
              >
                Cancel
              </Button>
              <Button
                disabled={busy || !activeReceivable}
                onClick={async () => {
                  if (!activeReceivable) return;
                  setBusy(true);
                  try {
                    const cents = parseRupeesToCents(paymentAmount);
                    if (!Number.isFinite(cents) || cents <= 0) {
                      setError("Enter a valid collection amount.");
                      return;
                    }
                    if (cents > activeReceivable.outstandingCents) {
                      setError("Collection exceeds outstanding balance.");
                      return;
                    }
                    if (!paymentModeId) {
                      setError("Select a payment mode.");
                      return;
                    }
                    await api.createReceivablePayment(activeReceivable.id, {
                      amountCents: cents,
                      paymentDate,
                      paymentModeId,
                      note: paymentNote || undefined,
                    });
                    setReceivables(await api.listReceivables());
                    setError(null);
                    setRecordOpen(false);
                    setActiveReceivable(null);
                  } catch (e: any) {
                    setError(e?.message ?? "Failed to record collection");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {busy ? "Saving..." : "Record collection"}
              </Button>
            </>
          }
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <div className="mb-1 text-sm text-[var(--app-text-muted)]">Amount (₹)</div>
              <Input value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="1000.00" />
            </div>
            <div>
              <div className="mb-1 text-sm text-[var(--app-text-muted)]">Payment date</div>
              <Input value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} type="date" className="w-full" />
            </div>
            <div>
              <div className="mb-1 text-sm text-[var(--app-text-muted)]">Payment mode</div>
              <select className="app-select" value={paymentModeId} onChange={(e) => setPaymentModeId(e.target.value)}>
                <option value="">— Select mode —</option>
                {paymentModes.map((mode) => (
                  <option key={mode.id} value={mode.id}>
                    {mode.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="mb-1 text-sm text-[var(--app-text-muted)]">Outstanding</div>
              <Input value={activeReceivable ? formatINRFromCents(activeReceivable.outstandingCents) : "-"} readOnly />
            </div>
            <div className="sm:col-span-2">
              <div className="mb-1 text-sm text-[var(--app-text-muted)]">Notes</div>
              <Input value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)} placeholder="optional" />
            </div>
          </div>
        </Modal>

        <Modal
          open={editOpen}
          title="Edit receivable"
          onClose={() => { if (busy) return; cancelEditReceivable(); }}
          footer={
            <>
              <Button disabled={busy} className="!border-[var(--app-border)] !bg-[rgba(17,31,50,0.72)] !text-[var(--app-text)] hover:!bg-[rgba(22,38,58,0.9)]" onClick={cancelEditReceivable}>
                Cancel
              </Button>
              <Button
                disabled={busy}
                onClick={async () => {
                  if (!editId) return;
                  setBusy(true);
                  try {
                    const cents = parseRupeesToCents(editAmount);
                    if (!Number.isFinite(cents) || cents <= 0) { setError("Enter a valid amount."); return; }
                    if (!editCatId) { setError("Select a category."); return; }
                    const isPersonCatEdit = receivableCategories.find(c => c.id === editCatId)?.name.trim().toLowerCase() === "person";
                    if (isPersonCatEdit && !editContactId) { setError("Select a person from the contact list."); return; }
                    await api.updateReceivable(editId, {
                      categoryId: editCatId,
                      contactId: isPersonCatEdit ? editContactId : null,
                      amountCents: cents,
                      expectedOn: editExpectedOn,
                      lentModeId: editLentModeId || null,
                      note: editNote || null,
                    });
                    setReceivables(await api.listReceivables());
                    setError(null);
                    cancelEditReceivable();
                  } catch (e: any) {
                    setError(e?.message ?? "Failed to update receivable");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {busy ? "Saving..." : "Save changes"}
              </Button>
            </>
          }
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <div className="mb-1 text-sm text-[var(--app-text-muted)]">Category</div>
              <select className="app-select" value={editCatId} onChange={(e) => {
                const newCatId = e.target.value;
                setEditCatId(newCatId);
                const newCat = receivableCategories.find(c => c.id === newCatId);
                if (newCat?.name.trim().toLowerCase() !== "person") setEditContactId("");
              }}>
                <option value="">— Select category —</option>
                {receivableCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            {receivableCategories.find(c => c.id === editCatId)?.name.trim().toLowerCase() === "person" && (
              <div className="sm:col-span-2">
                <div className="mb-1 text-sm text-[var(--app-text-muted)]">From <span className="text-xs opacity-60">(select person)</span></div>
                <select className="app-select" value={editContactId} onChange={(e) => setEditContactId(e.target.value)}>
                  <option value="">— Select person —</option>
                  {contacts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
            <div>
              <div className="mb-1 text-sm text-[var(--app-text-muted)]">Amount (₹)</div>
              <Input value={editAmount} onChange={(e) => setEditAmount(e.target.value)} placeholder="e.g. 5000.00" />
            </div>
            <div>
              <div className="mb-1 text-sm text-[var(--app-text-muted)]">Date</div>
              <Input value={editExpectedOn} onChange={(e) => setEditExpectedOn(e.target.value)} type="date" className="w-full" />
            </div>
            <div className="sm:col-span-2">
              <div className="mb-1 text-sm text-[var(--app-text-muted)]">Lent via (optional)</div>
              <select className="app-select" value={editLentModeId} onChange={(e) => setEditLentModeId(e.target.value)}>
                <option value="">— Select mode —</option>
                {paymentModes.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <div className="mb-1 text-sm text-[var(--app-text-muted)]">Note (optional)</div>
              <Input value={editNote} onChange={(e) => setEditNote(e.target.value)} placeholder="optional" />
            </div>
          </div>
        </Modal>

        <Modal
          open={!!historyReceivable}
          title={`Payment History — ${historyReceivable?.contactName || historyReceivable?.categoryName || ""}`}
          onClose={() => setHistoryReceivable(null)}
          footer={
            <Button onClick={() => setHistoryReceivable(null)}>Close</Button>
          }
        >
          {historyReceivable && (
            <div className="space-y-2">
              {historyReceivable.note && (
                <div className="mb-3 text-sm text-[var(--app-text-muted)]">Note: {historyReceivable.note}</div>
              )}
              {historyReceivable.payments.length ? (
                historyReceivable.payments.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 rounded-lg border border-[var(--app-border)] bg-[rgba(17,31,50,0.5)] px-3 py-2 text-sm text-[var(--app-text)]">
                    <span className="text-[var(--app-text-muted)]">{p.paymentDate}</span>
                    <span className="text-[var(--app-text-muted)]">•</span>
                    <span>{p.paymentModeName}</span>
                    <span className="text-[var(--app-text-muted)]">•</span>
                    <span className="font-semibold text-[var(--app-accent)]">{formatMoneyDisplay(p.amountCents, amountsVisible)}</span>
                    {p.note && <><span className="text-[var(--app-text-muted)]">•</span><span className="text-[var(--app-text-muted)]">{p.note}</span></>}
                  </div>
                ))
              ) : (
                <div className="text-sm text-[var(--app-text-muted)]">No collections recorded yet.</div>
              )}
            </div>
          )}
        </Modal>

        <Modal
          open={!!noteReceivable}
          title="Note"
          onClose={() => setNoteReceivable(null)}
          footer={<Button onClick={() => setNoteReceivable(null)}>Close</Button>}
        >
          <p className="text-sm text-[var(--app-text)]">{noteReceivable?.note}</p>
        </Modal>

        <div className="space-y-4">
          {groupedReceivables.length ? (
            groupedReceivables.map((catGroup) => {
              const catCollapsed = collapsedCategories.includes(catGroup.categoryId);
              return (
                <div key={catGroup.categoryId} className="app-inline-surface">
                  {/* Category header */}
                  <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[var(--app-border)] bg-[rgba(17,31,50,0.72)] text-[var(--app-text)] transition hover:bg-[rgba(22,38,58,0.9)]"
                        onClick={() => setCollapsedCategories((s) => s.includes(catGroup.categoryId) ? s.filter((k) => k !== catGroup.categoryId) : [...s, catGroup.categoryId])}
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                          <path d={catCollapsed ? "M8 10l4 4 4-4" : "M8 14l4-4 4 4"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      <div>
                        <div className="text-base font-semibold text-[var(--app-text)]">{catGroup.categoryName}</div>
                        <div className="text-sm text-[var(--app-text-muted)]">
                          {catGroup.isPersonCat
                            ? `${catGroup.subGroups.length} ${catGroup.subGroups.length === 1 ? "person" : "people"}`
                            : `${catGroup.items.length} ${catGroup.items.length === 1 ? "entry" : "entries"}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 pl-11 sm:pl-0">
                      <div className="text-right">
                        <div className="font-bold text-base text-[var(--app-text)]">{formatMoneyDisplay(catGroup.amountCents, amountsVisible)}</div>
                        <div className="text-xs text-[var(--app-text-muted)] uppercase tracking-wide">Total</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-base text-[var(--app-accent)]">{formatMoneyDisplay(catGroup.receivedCents, amountsVisible)}</div>
                        <div className="text-xs text-[var(--app-text-muted)] uppercase tracking-wide">Received</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-base text-[var(--app-danger)]">{formatMoneyDisplay(catGroup.outstandingCents, amountsVisible)}</div>
                        <div className="text-xs text-[var(--app-text-muted)] uppercase tracking-wide">Outstanding</div>
                      </div>
                      <span className={["text-sm font-semibold", settlementStatusClass(catGroup.status)].join(" ")}>{catGroup.status}</span>
                    </div>
                  </div>

                  {!catCollapsed && (
                    <div className="border-t border-[var(--app-border)]">
                      {catGroup.isPersonCat ? (
                        /* Person category: inner contact sub-groups */
                        <div className="space-y-0 divide-y divide-[var(--app-border)]">
                          {catGroup.subGroups.map((sg) => {
                            const personCollapsed = collapsedPersons.includes(sg.contactId);
                            return (
                              <div key={sg.contactId}>
                                {/* Contact sub-header */}
                                <div className="flex flex-col gap-3 px-6 py-3 sm:flex-row sm:items-center sm:justify-between bg-[rgba(17,31,50,0.3)]">
                                  <div className="flex items-center gap-3">
                                    <button
                                      type="button"
                                      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-[var(--app-border)] bg-[rgba(17,31,50,0.72)] text-[var(--app-text)] transition hover:bg-[rgba(22,38,58,0.9)]"
                                      onClick={() => setCollapsedPersons((s) => s.includes(sg.contactId) ? s.filter((k) => k !== sg.contactId) : [...s, sg.contactId])}
                                    >
                                      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" aria-hidden="true">
                                        <path d={personCollapsed ? "M8 10l4 4 4-4" : "M8 14l4-4 4 4"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                      </svg>
                                    </button>
                                    <span className="text-sm font-semibold text-[var(--app-text)]">{sg.contactName}</span>
                                    <span className="text-xs text-[var(--app-text-muted)]">{sg.items.length} {sg.items.length === 1 ? "entry" : "entries"}</span>
                                  </div>
                                  <div className="flex items-center gap-4 pl-9 sm:pl-0">
                                    <span className="text-sm font-semibold text-[var(--app-text)]">{formatMoneyDisplay(sg.amountCents, amountsVisible)}</span>
                                    <span className="text-sm text-[var(--app-accent)]">{formatMoneyDisplay(sg.receivedCents, amountsVisible)} received</span>
                                    <span className="text-sm text-[var(--app-danger)]">{formatMoneyDisplay(sg.outstandingCents, amountsVisible)} due</span>
                                    <span className={["text-xs font-semibold", settlementStatusClass(sg.status)].join(" ")}>{sg.status}</span>
                                  </div>
                                </div>
                                {!personCollapsed && (
                                  <div className="app-table-shell rounded-none border-x-0 border-b-0 border-t border-[var(--app-border)] bg-transparent">
                                    <table className="app-table">
                                      <thead>
                                        <tr>
                                          <th>Date</th>
                                          <th>Via</th>
                                          <th>Total</th>
                                          <th>Received</th>
                                          <th>Outstanding</th>
                                          <th>Status</th>
                                          <th>Action</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {sg.items.map((r) => (
                                          <tr key={r.id}>
                                            <td>{r.expectedOn}</td>
                                            <td>{r.lentModeName ?? "—"}</td>
                                            <td>{formatMoneyDisplay(r.amountCents, amountsVisible)}</td>
                                            <td className="text-[var(--app-accent)]">{formatMoneyDisplay(r.receivedCents, amountsVisible)}</td>
                                            <td className="text-[var(--app-danger)]">{formatMoneyDisplay(r.outstandingCents, amountsVisible)}</td>
                                            <td><span className={["text-sm font-semibold", settlementStatusClass(r.status)].join(" ")}>{r.status}</span></td>
                                            <td>
                                              <div className="flex items-center gap-2">
                                                {r.outstandingCents > 0 ? (
                                                  <Button onClick={() => openRecordModal(r)} className="whitespace-nowrap !py-1 !text-xs">Collect</Button>
                                                ) : (
                                                  <span className="text-xs text-[var(--app-text-muted)]">Done</span>
                                                )}
                                                {r.payments.length > 0 && (
                                                  <button
                                                    className="inline-flex items-center gap-1 rounded border border-[var(--app-border)] bg-[rgba(17,31,50,0.5)] px-2 py-1 text-xs text-[var(--app-text-muted)] hover:text-[var(--app-text)] transition"
                                                    onClick={() => setHistoryReceivable(r)}
                                                    title="View payment history"
                                                  >
                                                    🕐 {r.payments.length}
                                                  </button>
                                                )}
                                                {r.note && (
                                                  <button
                                                    className="inline-flex items-center gap-1 rounded border border-[var(--app-border)] bg-[rgba(17,31,50,0.5)] px-2 py-1 text-xs text-[var(--app-text-muted)] hover:text-[var(--app-text)] transition"
                                                    onClick={() => setNoteReceivable(r)}
                                                    title="View note"
                                                  >
                                                    📝
                                                  </button>
                                                )}
                                                <button className="app-icon-button" onClick={() => startEditReceivable(r)} title="Edit">
                                                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true"><path d="M4 20h4l10.5-10.5a2 2 0 0 0 0-2.8l-1.2-1.2a2 2 0 0 0-2.8 0L4 16v4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="M13.5 6.5 17.5 10.5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
                                                </button>
                                                <button className="app-danger-button" title="Delete" onClick={async () => {
                                                  if (!confirm(`Delete receivable (${r.categoryName}, ${formatINRFromCents(r.amountCents)})?`)) return;
                                                  try { await api.deleteReceivable(r.id); setReceivables(await api.listReceivables()); }
                                                  catch (e: any) { setError(e?.message ?? "Failed to delete"); }
                                                }}>
                                                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true"><path d="M6 7h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><path d="M10 7V5h4v2" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="M8 7l1 14h6l1-14" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
                                                </button>
                                              </div>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          {catGroup.subGroups.length === 0 && (
                            <div className="px-6 py-3 text-sm text-[var(--app-text-muted)]">No entries yet.</div>
                          )}
                        </div>
                      ) : (
                        /* Non-person category: rows directly */
                        <div className="app-table-shell rounded-none border-x-0 border-b-0 border-t-0 bg-transparent">
                          <table className="app-table">
                            <thead>
                              <tr>
                                <th>Date</th>
                                <th>Via</th>
                                <th>Total</th>
                                <th>Received</th>
                                <th>Outstanding</th>
                                <th>Status</th>
                                <th>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {catGroup.items.map((r) => (
                                <tr key={r.id}>
                                  <td>{r.expectedOn}</td>
                                  <td>{r.lentModeName ?? "—"}</td>
                                  <td>{formatMoneyDisplay(r.amountCents, amountsVisible)}</td>
                                  <td className="text-[var(--app-accent)]">{formatMoneyDisplay(r.receivedCents, amountsVisible)}</td>
                                  <td className="text-[var(--app-danger)]">{formatMoneyDisplay(r.outstandingCents, amountsVisible)}</td>
                                  <td><span className={["text-sm font-semibold", settlementStatusClass(r.status)].join(" ")}>{r.status}</span></td>
                                  <td>
                                    <div className="flex items-center gap-2">
                                      {r.outstandingCents > 0 ? (
                                        <Button onClick={() => openRecordModal(r)} className="whitespace-nowrap !py-1 !text-xs">Collect</Button>
                                      ) : (
                                        <span className="text-xs text-[var(--app-text-muted)]">Done</span>
                                      )}
                                      {r.payments.length > 0 && (
                                        <button
                                          className="inline-flex items-center gap-1 rounded border border-[var(--app-border)] bg-[rgba(17,31,50,0.5)] px-2 py-1 text-xs text-[var(--app-text-muted)] hover:text-[var(--app-text)] transition"
                                          onClick={() => setHistoryReceivable(r)}
                                          title="View payment history"
                                        >
                                          🕐 {r.payments.length}
                                        </button>
                                      )}
                                      {r.note && (
                                        <button
                                          className="inline-flex items-center gap-1 rounded border border-[var(--app-border)] bg-[rgba(17,31,50,0.5)] px-2 py-1 text-xs text-[var(--app-text-muted)] hover:text-[var(--app-text)] transition"
                                          onClick={() => setNoteReceivable(r)}
                                          title="View note"
                                        >
                                          📝
                                        </button>
                                      )}
                                      <button className="app-icon-button" onClick={() => startEditReceivable(r)} title="Edit">
                                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true"><path d="M4 20h4l10.5-10.5a2 2 0 0 0 0-2.8l-1.2-1.2a2 2 0 0 0-2.8 0L4 16v4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="M13.5 6.5 17.5 10.5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
                                      </button>
                                      <button className="app-danger-button" title="Delete" onClick={async () => {
                                        if (!confirm(`Delete receivable (${r.categoryName}, ${formatINRFromCents(r.amountCents)})?`)) return;
                                        try { await api.deleteReceivable(r.id); setReceivables(await api.listReceivables()); }
                                        catch (e: any) { setError(e?.message ?? "Failed to delete"); }
                                      }}>
                                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true"><path d="M6 7h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><path d="M10 7V5h4v2" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="M8 7l1 14h6l1-14" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-sm text-[var(--app-text-muted)]">No receivables yet. Click + Add Receivable.</div>
          )}
        </div>
      </div>
    </Shell>
  );
}

function SettingsPage() {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [paymentModes, setPaymentModes] = useState<PaymentMode[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);

  const assetCats = useMemo(() => categories.filter((c) => c.type === "ASSET"), [categories]);
  const payableCats = useMemo(() => categories.filter((c) => c.type === "PAYABLE"), [categories]);
  const receivableCats = useMemo(() => categories.filter((c) => c.type === "RECEIVABLE"), [categories]);

  const [addItemKind, setAddItemKind] = useState<null | "platform" | "paymentMode" | "contact" | "asset" | "payable" | "receivable" | "category">(null);
  const [addItemValue, setAddItemValue] = useState("");
  const [addCatType, setAddCatType] = useState<"PAYABLE" | "RECEIVABLE">("PAYABLE");

  useEffect(() => {
    (async () => {
      try {
        setError(null);
        const [loadedCategories, loadedPlatforms, loadedPaymentModes, loadedContacts] = await Promise.all([
          api.listCategories(),
          api.listPlatforms(),
          api.listPaymentModes(),
          api.listContacts(),
        ]);
        setCategories(loadedCategories);
        setPlatforms(loadedPlatforms);
        setPaymentModes(loadedPaymentModes);
        setContacts(loadedContacts);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load settings");
      }
    })();
  }, []);

  const addItemMeta = {
    platform: { title: "Add platform", placeholder: "e.g. Zerodha", button: "+ Add Platform" },
    paymentMode: { title: "Add payment mode", placeholder: "e.g. UPI", button: "+ Add Payment Mode" },
    contact: { title: "Add contact", placeholder: "e.g. Ram", button: "+ Add Contact" },
    asset: { title: "Add asset category", placeholder: "e.g. Stocks", button: "+ Add Asset" },
    payable: { title: "Add payable category", placeholder: "e.g. Rent", button: "+ Add Payable" },
    receivable: { title: "Add receivable category", placeholder: "e.g. Client Payment", button: "+ Add Receivable" },
    category: { title: "Add category", placeholder: "e.g. Person, Rent, Refund, Salary", button: "+ Add Category" },
  } as const;

  const activeAddItem = addItemKind ? addItemMeta[addItemKind] : null;
  const settingsChipClass = "inline-flex items-center gap-2 rounded-full border border-[var(--app-border)] bg-[rgba(17,31,50,0.5)] px-3 py-1.5 text-sm font-medium";
  const settingsAddButtonClass = "!border-[var(--app-border)] !bg-[rgba(17,31,50,0.72)] !px-3 !py-1.5 !text-sm !font-semibold !text-[var(--app-text)] !shadow-none hover:!bg-[rgba(22,38,58,0.9)] hover:!shadow-none";

  const openAddItem = (kind: keyof typeof addItemMeta) => {
    setAddItemKind(kind);
    setAddItemValue("");
    setAddCatType("PAYABLE");
    setError(null);
  };

  const closeAddItem = () => {
    if (busy) return;
    setAddItemKind(null);
    setAddItemValue("");
  };

  const submitAddItem = async () => {
    if (!addItemKind) return;
    const trimmed = addItemValue.trim();
    if (!trimmed) return;

    setBusy(true);
    setError(null);
    try {
      if (addItemKind === "platform") {
        const created = await api.createPlatform(trimmed);
        setPlatforms((s) => [...s, created]);
      } else if (addItemKind === "paymentMode") {
        const created = await api.createPaymentMode(trimmed);
        setPaymentModes((s) => [...s, created]);
      } else if (addItemKind === "contact") {
        const created = await api.createContact(trimmed);
        setContacts((s) => [...s, created]);
      } else if (addItemKind === "category") {
        const created = await api.createCategory(trimmed, addCatType);
        setCategories((s) => [...s, created]);
      } else {
        const created = await api.createCategory(
          trimmed,
          addItemKind === "asset" ? "ASSET" : addItemKind === "payable" ? "PAYABLE" : "RECEIVABLE",
        );
        setCategories((s) => [...s, created]);
      }
      setAddItemKind(null);
      setAddItemValue("");
    } catch (e: any) {
      setError(e?.message ?? "Failed to add item");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell title="Settings" subtitle="Manage platforms, payment modes, contacts, and categories">
      <div className="space-y-6">
        {error && <div className="text-sm text-rose-400">{error}</div>}

        <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Lookups</h2>
            <div className="text-xs text-[var(--app-text-muted)]">Platforms, payment modes, contacts, assets, payables, and receivables</div>
          </div>

          <div className="space-y-6">
            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="text-sm text-[var(--app-text-muted)]">Platforms</div>
              <Button
                className={settingsAddButtonClass}
                onClick={() => openAddItem("platform")}
              >
                + Add Platform
              </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {platforms.map((platform) => (
                  <div
                    key={platform.id}
                    className={settingsChipClass}
                  >
                    <span>{platform.name}</span>
                    <button
                      className="text-[var(--app-text-muted)] transition hover:text-[var(--app-danger)]"
                      title="Delete"
                      onClick={async () => {
                        if (!confirm(`Delete platform \"${platform.name}\"?`)) return;
                        await api.deletePlatform(platform.id);
                        setPlatforms((s) => s.filter((x) => x.id !== platform.id));
                      }}
                    >
                      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" aria-hidden="true">
                        <path d="M6 7h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        <path d="M10 7V5h4v2" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                        <path d="M8 7l1 14h6l1-14" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                ))}
                {!platforms.length && <div className="text-sm text-[var(--app-text-muted)]">No platforms yet.</div>}
              </div>
            </div>

            <div className="border-t border-[var(--app-border)]" />

            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="text-sm text-[var(--app-text-muted)]">Contacts</div>
                <Button className={settingsAddButtonClass} onClick={() => openAddItem("contact")}>
                  + Add Contact
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {contacts.map((contact) => (
                  <div key={contact.id} className={settingsChipClass}>
                    <span>{contact.name}</span>
                    <button
                      className="text-[var(--app-text-muted)] transition hover:text-[var(--app-danger)]"
                      title="Delete"
                      onClick={async () => {
                        if (!confirm(`Delete contact \"${contact.name}\"?`)) return;
                        await api.deleteContact(contact.id);
                        setContacts((s) => s.filter((x) => x.id !== contact.id));
                      }}
                    >
                      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" aria-hidden="true">
                        <path d="M6 7h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        <path d="M10 7V5h4v2" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                        <path d="M8 7l1 14h6l1-14" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                ))}
                {!contacts.length && <div className="text-sm text-[var(--app-text-muted)]">No contacts yet.</div>}
              </div>
            </div>

            <div className="border-t border-[var(--app-border)]" />

            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="text-sm text-[var(--app-text-muted)]">Payment Modes</div>
                <Button className={settingsAddButtonClass} onClick={() => openAddItem("paymentMode")}>
                  + Add Payment Mode
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {paymentModes.map((mode) => (
                  <div key={mode.id} className={settingsChipClass}>
                    <span>{mode.name}</span>
                    <button
                      className="text-[var(--app-text-muted)] transition hover:text-[var(--app-danger)]"
                      title="Delete"
                      onClick={async () => {
                        if (!confirm(`Delete payment mode \"${mode.name}\"?`)) return;
                        await api.deletePaymentMode(mode.id);
                        setPaymentModes((s) => s.filter((x) => x.id !== mode.id));
                      }}
                    >
                      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" aria-hidden="true">
                        <path d="M6 7h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        <path d="M10 7V5h4v2" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                        <path d="M8 7l1 14h6l1-14" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                ))}
                {!paymentModes.length && <div className="text-sm text-[var(--app-text-muted)]">No payment modes yet.</div>}
              </div>
            </div>

            <div className="border-t border-[var(--app-border)]" />

            <div>
              <div className="space-y-4">
                <div>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="text-sm text-[var(--app-text-muted)]">Assets</div>
                  <Button
                    className={settingsAddButtonClass}
                    onClick={() => openAddItem("asset")}
                  >
                    + Add Asset
                  </Button>
                  </div>
                  <div className="mb-3 flex flex-wrap gap-2">
                    {assetCats.map((c) => (
                      <div
                        key={c.id}
                        className={settingsChipClass}
                      >
                        <span>{c.name}</span>
                        <button
                          className="text-[var(--app-text-muted)] transition hover:text-[var(--app-danger)]"
                          title="Delete"
                          onClick={async () => {
                            if (!confirm(`Delete category \"${c.name}\"?`)) return;
                            await api.deleteCategory(c.id);
                            setCategories((s) => s.filter((x) => x.id !== c.id));
                          }}
                        >
                          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" aria-hidden="true">
                            <path d="M6 7h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                            <path d="M10 7V5h4v2" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                            <path d="M8 7l1 14h6l1-14" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-[var(--app-border)] pt-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="text-sm text-[var(--app-text-muted)]">Payable &amp; Receivable Categories</div>
                    <Button className={settingsAddButtonClass} onClick={() => openAddItem("category")}>
                      + Add Category
                    </Button>
                  </div>
                  <div className="mb-3 flex flex-wrap gap-2">
                    {[...payableCats, ...receivableCats].map((c) => (
                      <div key={c.id} className={settingsChipClass}>
                        <span className={`rounded px-1.5 py-0.5 text-xs font-semibold ${
                          c.type === "PAYABLE"
                            ? "bg-rose-900/40 text-rose-300"
                            : "bg-emerald-900/40 text-emerald-300"
                        }`}>
                          {c.type === "PAYABLE" ? "Payable" : "Receivable"}
                        </span>
                        <span>{c.name}</span>
                        <button
                          className="text-[var(--app-text-muted)] transition hover:text-[var(--app-danger)]"
                          title="Delete"
                          onClick={async () => {
                            if (!confirm(`Delete category "${c.name}"?`)) return;
                            await api.deleteCategory(c.id);
                            setCategories((s) => s.filter((x) => x.id !== c.id));
                          }}
                        >
                          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" aria-hidden="true">
                            <path d="M6 7h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                            <path d="M10 7V5h4v2" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                            <path d="M8 7l1 14h6l1-14" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    {!payableCats.length && !receivableCats.length && (
                      <div className="text-sm text-[var(--app-text-muted)]">No categories yet.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Modal
            open={!!addItemKind}
            title={activeAddItem?.title}
            onClose={closeAddItem}
            footer={
              <>
                <Button
                  disabled={busy}
                  className="!border-[var(--app-border)] !bg-[rgba(17,31,50,0.72)] !text-[var(--app-text)] hover:!bg-[rgba(22,38,58,0.9)]"
                  onClick={closeAddItem}
                >
                  Cancel
                </Button>
                <Button disabled={busy || !addItemValue.trim()} onClick={submitAddItem}>
                  {busy ? "Saving..." : "Add"}
                </Button>
              </>
            }
          >
            <div className="space-y-3">
              <div>
                <div className="mb-1 text-sm text-[var(--app-text-muted)]">Name</div>
                <Input
                  value={addItemValue}
                  onChange={(e) => setAddItemValue(e.target.value)}
                  placeholder={activeAddItem?.placeholder ?? "Enter name"}
                />
              </div>
              {addItemKind === "category" && (
                <div>
                  <div className="mb-2 text-sm text-[var(--app-text-muted)]">Type</div>
                  <div className="flex gap-2">
                    {(["PAYABLE", "RECEIVABLE"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setAddCatType(t)}
                        className={`flex-1 rounded-lg border py-2 text-sm font-medium transition ${
                          addCatType === t
                            ? t === "PAYABLE"
                              ? "border-rose-500 bg-rose-900/30 text-rose-300"
                              : "border-emerald-500 bg-emerald-900/30 text-emerald-300"
                            : "border-[var(--app-border)] bg-[rgba(17,31,50,0.5)] text-[var(--app-text-muted)] hover:bg-[rgba(22,38,58,0.9)]"
                        }`}
                      >
                        {t === "PAYABLE" ? "Payable" : "Receivable"}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Modal>
        </Card>
      </div>
    </Shell>
  );
}

function RequireAuth(props: { children: JSX.Element }) {
  const token = getToken();
  return token ? props.children : <Navigate to="/login" replace />;
}

export function App() {
  const [amountsVisible, setAmountsVisibleState] = useState(getAmountsVisible);

  const toggleAmountsVisible = () => {
    setAmountsVisibleState((current) => {
      const next = !current;
      setAmountsVisible(next);
      return next;
    });
  };

  return (
    <AmountVisibilityContext.Provider value={{ amountsVisible, toggleAmountsVisible }}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <DashboardPage />
            </RequireAuth>
          }
        />
        <Route
          path="/wealth"
          element={
            <RequireAuth>
              <WealthPage />
            </RequireAuth>
          }
        />
        <Route
          path="/payables"
          element={
            <RequireAuth>
              <PayablesPage />
            </RequireAuth>
          }
        />
        <Route
          path="/receivables"
          element={
            <RequireAuth>
              <ReceivablesPage />
            </RequireAuth>
          }
        />
        <Route
          path="/settings"
          element={
            <RequireAuth>
              <SettingsPage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AmountVisibilityContext.Provider>
  );
}


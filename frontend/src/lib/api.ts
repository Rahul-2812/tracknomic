import { clearToken, getToken } from "./storage";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    if (res.status === 401) {
      clearToken();
      if (window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
    }

    let message = `${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      message = body?.message ?? message;
    } catch {}
    throw new Error(message);
  }
  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

export type AuthResponse = { accessToken: string };
export type MeResponse = { userId: string; email: string };
export type Category = {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE" | "ASSET" | "PAYABLE" | "RECEIVABLE";
};

export type Platform = {
  id: string;
  name: string;
  createdAt: string;
};

export type PaymentMode = {
  id: string;
  name: string;
  createdAt: string;
};

export type Contact = {
  id: string;
  name: string;
  createdAt: string;
};

export type SettlementEntry = {
  id: string;
  amountCents: number;
  paymentDate: string;
  paymentModeId: string;
  paymentModeName: string;
  note: string | null;
  createdAt: string;
};

export type Transaction = {
  id: string;
  type: "INCOME" | "EXPENSE";
  amountCents: number;
  occurredOn: string;
  note: string | null;
  categoryId: string | null;
  categoryName: string | null;
};
export type Summary = { incomeCents: number; expenseCents: number; netCents: number };

export type CategoryTotal = { categoryId: string; categoryName: string; totalCents: number };
export type PerformancePoint = { date: string; totalPortfolioValueCents: number };
export type Dashboard = {
  assetsCents: number;
  pendingPayablesCents: number;
  pendingReceivablesCents: number;
  netWorthCents: number;
  assetsByCategory: CategoryTotal[];
  payablesByCategory: CategoryTotal[];
  receivablesByCategory: CategoryTotal[];
  performance: PerformancePoint[];
};

export type Holding = {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  platform: string | null;
  amountCents: number;
  marketValueCents: number | null;
  note: string | null;
  createdAt: string;
};

export type Payable = {
  id: string;
  categoryId: string;
  categoryName: string;
  contactId: string | null;
  contactName: string | null;
  amountCents: number;
  paidCents: number;
  outstandingCents: number;
  dueDate: string;
  status: "PENDING" | "PARTIAL" | "PAID";
  note: string | null;
  createdAt: string;
  payments: SettlementEntry[];
};

export type Receivable = {
  id: string;
  categoryId: string;
  categoryName: string;
  contactId: string | null;
  contactName: string | null;
  amountCents: number;
  receivedCents: number;
  outstandingCents: number;
  lentModeId: string | null;
  lentModeName: string | null;
  expectedOn: string;
  status: "PENDING" | "PARTIAL" | "PAID";
  note: string | null;
  createdAt: string;
  payments: SettlementEntry[];
};

export const api = {
  login: (username: string, password: string) =>
    request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  me: () => request<MeResponse>("/api/me"),
  listCategories: () => request<Category[]>("/api/categories"),
  createCategory: (name: string, type: Category["type"]) =>
    request<Category>("/api/categories", {
      method: "POST",
      body: JSON.stringify({ name, type }),
    }),
  deleteCategory: (id: string) =>
    request<void>(`/api/categories/${id}`, {
      method: "DELETE",
    }),
  listTransactions: (from: string, to: string) =>
    request<Transaction[]>(`/api/transactions?from=${from}&to=${to}`),
  summary: (from: string, to: string) => request<Summary>(`/api/summary?from=${from}&to=${to}`),
  createTransaction: (payload: {
    type: Transaction["type"];
    amountCents: number;
    occurredOn: string;
    note?: string;
    categoryId?: string | null;
  }) =>
    request<Transaction>("/api/transactions", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // Wealth tracker
  dashboard: (from: string, to: string) =>
    request<Dashboard>(`/api/dashboard?from=${from}&to=${to}`),

  sendDashboardEmail: (payload: { from: string; to: string; emailTo?: string }) =>
    request<{ message: string }>("/api/dashboard/email-summary", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  listHoldings: () => request<Holding[]>("/api/holdings"),
  createHolding: (payload: {
    categoryId: string;
    name: string;
    platform?: string;
    amountCents: number;
    marketValueCents?: number | null;
    note?: string;
  }) =>
    request<Holding>("/api/holdings", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateHolding: (
    id: string,
    payload: {
      categoryId: string;
      name: string;
      platform?: string | null;
      amountCents: number;
      marketValueCents?: number | null;
      note?: string | null;
    },
  ) =>
    request<Holding>(`/api/holdings/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  deleteHolding: (id: string) =>
    request<void>(`/api/holdings/${id}`, {
      method: "DELETE",
    }),

  listPayables: () => request<Payable[]>("/api/payables"),
  createPayable: (payload: {
    categoryId: string;
    contactId: string;
    amountCents: number;
    dueDate: string;
    note?: string;
  }) =>
    request<Payable>("/api/payables", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updatePayableStatus: (id: string, payload: { status: "PENDING" | "PAID" }) =>
    request<Payable>(`/api/payables/${id}/status`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updatePayable: (
    id: string,
    payload: { categoryId: string; contactId: string; amountCents: number; dueDate: string; note?: string | null },
  ) =>
    request<Payable>(`/api/payables/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deletePayable: (id: string) =>
    request<void>(`/api/payables/${id}`, { method: "DELETE" }),

  listReceivables: () => request<Receivable[]>("/api/receivables"),
  createReceivable: (payload: {
    categoryId: string;
    contactId?: string | null;
    amountCents: number;
    expectedOn: string;
    lentModeId?: string | null;
    note?: string;
  }) =>
    request<Receivable>("/api/receivables", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateReceivableStatus: (id: string, payload: { status: "PENDING" | "RECEIVED" }) =>
    request<Receivable>(`/api/receivables/${id}/status`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateReceivable: (
    id: string,
    payload: { categoryId: string; contactId?: string | null; amountCents: number; expectedOn: string; lentModeId?: string | null; note?: string | null },
  ) =>
    request<Receivable>(`/api/receivables/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteReceivable: (id: string) =>
    request<void>(`/api/receivables/${id}`, { method: "DELETE" }),

  createValuationSnapshot: (payload: { snapshotDate: string }) =>
    request<any>("/api/valuation-snapshots", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  listPlatforms: () => request<Platform[]>("/api/platforms"),
  createPlatform: (name: string) =>
    request<Platform>("/api/platforms", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
  deletePlatform: (id: string) =>
    request<void>(`/api/platforms/${id}`, {
      method: "DELETE",
    }),

  listPaymentModes: () => request<PaymentMode[]>("/api/payment-modes"),
  createPaymentMode: (name: string) =>
    request<PaymentMode>("/api/payment-modes", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
  deletePaymentMode: (id: string) =>
    request<void>(`/api/payment-modes/${id}`, {
      method: "DELETE",
    }),

  listContacts: () => request<Contact[]>("/api/contacts"),
  createContact: (name: string) =>
    request<Contact>("/api/contacts", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
  deleteContact: (id: string) =>
    request<void>(`/api/contacts/${id}`, {
      method: "DELETE",
    }),

  createPayablePayment: (
    id: string,
    payload: { amountCents: number; paymentDate: string; paymentModeId: string; note?: string },
  ) =>
    request<Payable>(`/api/payables/${id}/payments`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  createReceivablePayment: (
    id: string,
    payload: { amountCents: number; paymentDate: string; paymentModeId: string; note?: string },
  ) =>
    request<Receivable>(`/api/receivables/${id}/payments`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};


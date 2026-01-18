import { useEffect, useState } from "react";
import type { AccountInfo } from "@azure/msal-browser";

import { msalInstance, loginRequest } from "./authConfig";

import type {
  Customer,
  Item,
  StockLine,
  CustomLine,
  AdHocLine,
  QuoteLineInput,
  QuoteResponse,
  QuoteSummary,
  QuoteRecord,
  QuoteRequest,
  BackendLineItemRequest,
} from "./types";

import { DEFAULT_CUSTOM_VALUES } from "./types";

import {
  fetchCustomers,
  fetchItems,
  createQuote,
  fetchQuotesHistory,
  fetchQuoteDetail,
  updateCustomer,
  updateItem,
  deleteCustomer,
  deleteItem,
} from "./api";

import {
  Header,
  QuoteResult,
  QuoteHistory,
  Settings,
  StockLineEditor,
  CustomLineEditor,
  AdHocLineEditor,
} from "./components";

import { cn } from "./lib/utils";

function App() {
  // ---------- Auth state ----------
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // ---------- App state ----------
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [includeFreight, setIncludeFreight] = useState(true);

  const [lines, setLines] = useState<QuoteLineInput[]>([]);

  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [quotesHistory, setQuotesHistory] = useState<QuoteSummary[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<QuoteRecord | null>(null);

  const [loadingInit, setLoadingInit] = useState(false);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // ---------------- Get access token ----------------
  const getAccessToken = async (): Promise<string | undefined> => {
    if (!account) return undefined;

    try {
      const response = await msalInstance.acquireTokenSilent({
        scopes: ["User.Read"],
        account: account,
      });
      return response.accessToken;
    } catch (error) {
      console.warn("Silent token acquisition failed, trying popup:", error);
      try {
        const response = await msalInstance.acquireTokenPopup({
          scopes: ["User.Read"],
        });
        return response.accessToken;
      } catch (popupError) {
        console.error("Token acquisition failed:", popupError);
        return undefined;
      }
    }
  };

  // ---------------- Auth: init existing account ----------------
  useEffect(() => {
    const active = msalInstance.getActiveAccount();
    if (active) {
      setAccount(active);
      return;
    }
    const all = msalInstance.getAllAccounts();
    if (all.length > 0) {
      msalInstance.setActiveAccount(all[0]);
      setAccount(all[0]);
    }
  }, []);

  const handleLogin = async () => {
    setAuthError(null);
    try {
      const resp = await msalInstance.loginPopup(loginRequest);
      if (resp.account) {
        msalInstance.setActiveAccount(resp.account);
        setAccount(resp.account);
        setError(null);
      }
    } catch (e: unknown) {
      const err = e as Error;
      console.error("Login error:", e);
      setAuthError(err?.message || "Failed to sign in with Microsoft.");
    }
  };

  const handleLogout = async () => {
    setAuthError(null);
    setAccount(null);
    setCustomers([]);
    setItems([]);
    setLines([]);
    setQuote(null);
    setQuotesHistory([]);
    setSelectedQuote(null);
    setError(null);

    try {
      await msalInstance.logoutPopup();
    } catch (e: unknown) {
      const err = e as Error;
      console.error("Logout error:", e);
      setAuthError(err?.message || "Failed to sign out.");
    }
  };

  // ---------------- Initial load: customers + items (after login) ----------------
  useEffect(() => {
    if (!account) return;

    async function loadInitial() {
      setLoadingInit(true);
      setError(null);
      try {
        const token = await getAccessToken();
        const [customerData, itemData] = await Promise.all([
          fetchCustomers(token),
          fetchItems(token),
        ]);
        setCustomers(customerData ?? []);
        setItems(itemData ?? []);
      } catch (err: unknown) {
        const error = err as Error;
        console.error("Initial load error:", err);
        setError("Failed to load customers/items: " + (error?.message || String(err)));
      } finally {
        setLoadingInit(false);
      }
    }

    loadInitial();
  }, [account]);

  // ---------------- Load quote history ----------------
  async function loadQuotesHistoryHandler() {
    if (!account) {
      setError("Please sign in to view quote history.");
      return;
    }
    setLoadingHistory(true);
    setError(null);
    try {
      const token = await getAccessToken();
      const data = await fetchQuotesHistory(token);
      setQuotesHistory(data ?? []);
    } catch (err: unknown) {
      const error = err as Error;
      console.error("History load error:", err);
      setError("Failed to load quote history: " + (error?.message || String(err)));
    } finally {
      setLoadingHistory(false);
    }
  }

  async function loadQuoteById(id: number) {
    if (!account) {
      setError("Please sign in to view quote details.");
      return;
    }
    setSelectedQuote(null);
    setError(null);
    try {
      const token = await getAccessToken();
      const data = await fetchQuoteDetail(id, token);
      setSelectedQuote(data);
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Quote detail error:", err);
      setError("Failed to load quote detail: " + (error?.message || String(err)));
    }
  }

  // ---------------- Line management ----------------
  function clearQuote() {
    setLines([]);
    setQuote(null);
    setSelectedQuote(null);
    setCustomerId("");
    setIncludeFreight(true);
    setError(null);
  }

  function addStockLine() {
    if (items.length === 0) {
      setError("No items loaded yet.");
      return;
    }
    const line: StockLine = {
      kind: "stock",
      itemSku: items[0].sku,
      quantity: 1,
    };
    setLines((prev) => [...prev, line]);
  }

  function addCustomLine() {
    const line: CustomLine = {
      kind: "custom",
      material: DEFAULT_CUSTOM_VALUES.material,
      color: DEFAULT_CUSTOM_VALUES.color,
      surface: DEFAULT_CUSTOM_VALUES.surface,
      gauge: DEFAULT_CUSTOM_VALUES.gauge,
      width: DEFAULT_CUSTOM_VALUES.width,
      length: DEFAULT_CUSTOM_VALUES.length,
      sheets: DEFAULT_CUSTOM_VALUES.sheets,
      description: "",
    };
    setLines((prev) => [...prev, line]);
  }

  function addAdHocLine() {
    const line: AdHocLine = {
      kind: "ad_hoc",
      description: "",
      weightPerUnit: 1,
      landedCostPerUnit: 0,
      quantity: 1,
    };
    setLines((prev) => [...prev, line]);
  }

  function updateLine(index: number, patch: Partial<QuoteLineInput>) {
    setLines((prev) =>
      prev.map((line, i) =>
        i === index ? ({ ...line, ...patch } as QuoteLineInput) : line
      )
    );
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  function duplicateLine(index: number) {
    setLines((prev) => {
      const lineToDuplicate = prev[index];
      const newLines = [...prev];
      newLines.splice(index + 1, 0, { ...lineToDuplicate });
      return newLines;
    });
  }

  // ---------------- Settings handlers ----------------
  async function handleUpdateCustomer(id: string, updates: Partial<Customer>) {
    // Update local state immediately for responsiveness
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );

    // Persist to backend
    try {
      const token = await getAccessToken();
      await updateCustomer(id, {
        column_break: updates.column_break,
        freight_column_offset: updates.freight_column_offset,
      }, token);
    } catch (err) {
      console.error("Failed to save customer update:", err);
      setError("Failed to save customer changes. Please try again.");
    }
  }

  async function handleUpdateItem(sku: string, updates: Partial<Item>) {
    // Update local state immediately for responsiveness
    setItems((prev) =>
      prev.map((i) => (i.sku === sku ? { ...i, ...updates } : i))
    );

    // Persist to backend
    try {
      const token = await getAccessToken();
      await updateItem(sku, {
        description: updates.description,
        avg_cost: updates.avg_cost,
      }, token);
    } catch (err) {
      console.error("Failed to save item update:", err);
      setError("Failed to save item changes. Please try again.");
    }
  }

  async function handleDeleteCustomer(id: string) {
    try {
      const token = await getAccessToken();
      await deleteCustomer(id, token);
      // Remove from local state
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      // Clear selection if the deleted customer was selected
      if (customerId === id) {
        setCustomerId("");
      }
    } catch (err) {
      console.error("Failed to delete customer:", err);
      setError("Failed to delete customer. Please try again.");
    }
  }

  async function handleDeleteItem(sku: string) {
    try {
      const token = await getAccessToken();
      await deleteItem(sku, token);
      // Remove from local state
      setItems((prev) => prev.filter((i) => i.sku !== sku));
      // Remove any stock lines referencing this item
      setLines((prev) =>
        prev.filter((line) => line.kind !== "stock" || line.itemSku !== sku)
      );
    } catch (err) {
      console.error("Failed to delete item:", err);
      setError("Failed to delete item. Please try again.");
    }
  }

  // ---------------- Submit quote ----------------
  async function submitQuote() {
    if (!account) {
      setError("Please sign in with Microsoft first.");
      return;
    }
    if (!customerId) {
      setError("Please select a customer first.");
      return;
    }
    if (lines.length === 0) {
      setError("Please add at least one line.");
      return;
    }

    setLoadingQuote(true);
    setError(null);
    setQuote(null);
    setSelectedQuote(null);

    try {
      const token = await getAccessToken();

      const backendLines: BackendLineItemRequest[] = lines.map((line) => {
        if (line.kind === "stock") {
          return {
            type: "stock",
            quantity: Number(line.quantity) || 0,
            sku: line.itemSku,
          };
        } else if (line.kind === "custom") {
          return {
            type: "custom",
            quantity: Number(line.sheets) || 0,
            material: line.material,
            color: line.color,
            surface: line.surface,
            gauge: Number(line.gauge) || 0,
            width: Number(line.width) || 0,
            length: Number(line.length) || 0,
            sheets: Number(line.sheets) || 0,
            description: line.description,
          };
        } else {
          return {
            type: "ad_hoc",
            quantity: Number(line.quantity) || 0,
            description: line.description,
            weight_per_unit: Number(line.weightPerUnit) || 0,
            landed_cost_per_unit: Number(line.landedCostPerUnit) || 0,
          };
        }
      });

      const payload: QuoteRequest = {
        customer_id: customerId,
        include_freight: includeFreight,
        lines: backendLines,
      };

      const data = await createQuote(payload, token);
      setQuote(data);

      loadQuotesHistoryHandler().catch((err) =>
        console.warn("History refresh failed:", err)
      );
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Quote error:", err);
      setError("Failed to calculate quote: " + (error?.message || JSON.stringify(err)));
    } finally {
      setLoadingQuote(false);
    }
  }

  // ---------------- Render ----------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100">
      <Header
        account={account}
        onLogin={handleLogin}
        onLogout={handleLogout}
        authError={authError}
        customersCount={customers.length}
        itemsCount={items.length}
        isLoading={loadingInit}
      />

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Error Banner */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <svg
              className="h-5 w-5 flex-shrink-0 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* Left Column - Quote Builder */}
          <div className="space-y-6">
            {/* New Quote Button - Prominent */}
            <button
              onClick={clearQuote}
              disabled={!account}
              tabIndex={1}
              className={cn(
                "w-full rounded-xl py-3 text-base font-semibold transition-all shadow-md mb-4",
                account
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg"
                  : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
              )}
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                New Quote
              </span>
            </button>

            {/* Customer & Settings Card */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-zinc-900">Quote Settings</h2>
                <button
                  onClick={() => setSettingsOpen(true)}
                  disabled={!account}
                  tabIndex={-1}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                    account
                      ? "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300"
                      : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                  )}
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Customer Select */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Customer
                  </label>
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    disabled={!account}
                    tabIndex={2}
                    className={cn(
                      "w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900",
                      "focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20",
                      "transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    <option value="">Select customer...</option>
                    {/* Column customers first (sorted numerically), then real customers alphabetically */}
                    {[...customers]
                      .sort((a, b) => {
                        const aIsColumn = a.name.startsWith("Column ");
                        const bIsColumn = b.name.startsWith("Column ");
                        if (aIsColumn && bIsColumn) {
                          // Sort columns numerically
                          const aNum = parseInt(a.name.replace("Column ", ""), 10);
                          const bNum = parseInt(b.name.replace("Column ", ""), 10);
                          return aNum - bNum;
                        }
                        if (aIsColumn) return -1;
                        if (bIsColumn) return 1;
                        return a.name.localeCompare(b.name);
                      })
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.column_break || c.id})
                        </option>
                      ))}
                  </select>
                </div>

                {/* Freight Toggle */}
                <div className="flex items-end">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={includeFreight}
                        onChange={(e) => setIncludeFreight(e.target.checked)}
                        disabled={!account}
                        className="peer sr-only"
                      />
                      <div className="h-6 w-11 rounded-full bg-zinc-200 transition-colors peer-checked:bg-emerald-500 peer-disabled:opacity-50" />
                      <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
                    </div>
                    <span className="text-sm font-medium text-zinc-700">
                      Include Freight
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Line Items Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-zinc-900">Line Items</h2>
                <div className="flex gap-2">
                  <button
                    onClick={addStockLine}
                    disabled={!account}
                    tabIndex={3}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all",
                      account
                        ? "bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm"
                        : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                    )}
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Stock
                  </button>
                  <button
                    onClick={addCustomLine}
                    disabled={!account}
                    tabIndex={4}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all",
                      account
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 shadow-sm"
                        : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                    )}
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Custom
                  </button>
                  <button
                    onClick={addAdHocLine}
                    disabled={!account}
                    tabIndex={5}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all",
                      account
                        ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-sm"
                        : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                    )}
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Ad-Hoc
                  </button>
                </div>
              </div>

              {/* Empty State */}
              {lines.length === 0 && (
                <div className="rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 py-12 text-center">
                  <svg
                    className="mx-auto h-10 w-10 text-zinc-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                    />
                  </svg>
                  <p className="mt-3 text-sm font-medium text-zinc-600">No line items yet</p>
                  <p className="mt-1 text-xs text-zinc-400">
                    Add stock, custom, or ad-hoc lines to build your quote
                  </p>
                </div>
              )}

              {/* Line Items List */}
              <div className="space-y-4">
                {lines.map((line, idx) => {
                  if (line.kind === "stock") {
                    return (
                      <StockLineEditor
                        key={idx}
                        line={line}
                        index={idx}
                        items={items}
                        onUpdate={updateLine}
                        onRemove={removeLine}
                        onDuplicate={duplicateLine}
                      />
                    );
                  }
                  if (line.kind === "custom") {
                    return (
                      <CustomLineEditor
                        key={idx}
                        line={line}
                        index={idx}
                        onUpdate={updateLine}
                        onRemove={removeLine}
                        onDuplicate={duplicateLine}
                      />
                    );
                  }
                  return (
                    <AdHocLineEditor
                      key={idx}
                      line={line}
                      index={idx}
                      onUpdate={updateLine}
                      onRemove={removeLine}
                      onDuplicate={duplicateLine}
                    />
                  );
                })}
              </div>

              {/* Calculate Quote Button */}
              {lines.length > 0 && (
                <div className="mt-6">
                  <button
                    onClick={submitQuote}
                    disabled={!account || !customerId || loadingQuote}
                    tabIndex={8}
                    className={cn(
                      "w-full rounded-xl py-4 text-base font-semibold transition-all shadow-lg",
                      account && customerId && !loadingQuote
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 hover:shadow-xl"
                        : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
                    )}
                  >
                    {loadingQuote ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Calculating...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V13.5zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V18zm2.498-6.75h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V13.5zm0 2.25h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V18zm2.504-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V18zm2.498-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zM8.25 6h7.5v2.25h-7.5V6zM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.65 4.5 4.757V19.5a2.25 2.25 0 002.25 2.25h10.5a2.25 2.25 0 002.25-2.25V4.757c0-1.108-.806-2.057-1.907-2.185A48.507 48.507 0 0012 2.25z" />
                        </svg>
                        Calculate Quote
                      </span>
                    )}
                  </button>
                  {!customerId && (
                    <p className="mt-2 text-center text-xs text-zinc-500">
                      Select a customer to calculate the quote
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Quote Result */}
            {quote && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold text-zinc-900 mb-4">Quote Result</h2>
                <QuoteResult quote={quote} />
              </div>
            )}
          </div>

          {/* Right Column - History Only */}
          <div className="space-y-6" tabIndex={-1}>
            <QuoteHistory
              quotes={quotesHistory}
              selectedQuote={selectedQuote}
              isLoading={loadingHistory}
              onRefresh={loadQuotesHistoryHandler}
              onSelectQuote={loadQuoteById}
              disabled={!account}
              tabIndex={-1}
            />
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      <Settings
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        customers={customers}
        items={items}
        onUpdateCustomer={handleUpdateCustomer}
        onUpdateItem={handleUpdateItem}
        onDeleteCustomer={handleDeleteCustomer}
        onDeleteItem={handleDeleteItem}
      />
    </div>
  );
}

export default App;

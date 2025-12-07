import { useState } from "react";
import type { Customer, Item } from "../types";
import { cn } from "../lib/utils";

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  items: Item[];
  onUpdateCustomer: (id: string, updates: Partial<Customer>) => void;
  onUpdateItem: (sku: string, updates: Partial<Item>) => void;
  onDeleteCustomer: (id: string) => void;
  onDeleteItem: (sku: string) => void;
}

type Tab = "customers" | "items";

export function Settings({
  isOpen,
  onClose,
  customers,
  items,
  onUpdateCustomer,
  onUpdateItem,
  onDeleteCustomer,
  onDeleteItem,
}: SettingsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("customers");
  const [customerSearch, setCustomerSearch] = useState("");
  const [itemSearch, setItemSearch] = useState("");
  const [editingCustomer, setEditingCustomer] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.id.toLowerCase().includes(customerSearch.toLowerCase()) ||
      (c.column_break || "").toLowerCase().includes(customerSearch.toLowerCase())
  );

  const filteredItems = items.filter(
    (i) =>
      i.sku.toLowerCase().includes(itemSearch.toLowerCase()) ||
      i.description.toLowerCase().includes(itemSearch.toLowerCase())
  );

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer.id);
    setEditValues({
      column_break: customer.column_break || "",
      freight_column_offset: String(customer.freight_column_offset ?? 0),
    });
  };

  const handleSaveCustomer = (id: string) => {
    onUpdateCustomer(id, {
      column_break: editValues.column_break,
      freight_column_offset: parseInt(editValues.freight_column_offset) || 0,
    });
    setEditingCustomer(null);
    setEditValues({});
  };

  const handleEditItem = (item: Item) => {
    setEditingItem(item.sku);
    setEditValues({
      description: item.description || "",
      avg_cost: String(item.avg_cost ?? ""),
    });
  };

  const handleSaveItem = (sku: string) => {
    onUpdateItem(sku, {
      description: editValues.description,
      avg_cost: editValues.avg_cost ? parseFloat(editValues.avg_cost) : undefined,
    });
    setEditingItem(null);
    setEditValues({});
  };

  const handleDeleteCustomer = (id: string) => {
    if (confirmDelete === id) {
      onDeleteCustomer(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
    }
  };

  const handleDeleteItem = (sku: string) => {
    if (confirmDelete === sku) {
      onDeleteItem(sku);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(sku);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-5xl max-h-[85vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-zinc-50">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-zinc-700 to-zinc-900">
              <svg
                className="h-4 w-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">Settings</h2>
              <p className="text-xs text-zinc-500">Manage customers and stock items</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-200">
          <button
            onClick={() => setActiveTab("customers")}
            className={cn(
              "flex-1 px-6 py-3 text-sm font-medium transition-colors",
              activeTab === "customers"
                ? "border-b-2 border-emerald-500 text-emerald-600 bg-emerald-50/50"
                : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50"
            )}
          >
            Customers ({customers.length})
          </button>
          <button
            onClick={() => setActiveTab("items")}
            className={cn(
              "flex-1 px-6 py-3 text-sm font-medium transition-colors",
              activeTab === "items"
                ? "border-b-2 border-emerald-500 text-emerald-600 bg-emerald-50/50"
                : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50"
            )}
          >
            Stock Items ({items.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === "customers" && (
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Search customers..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 pl-10 pr-4 py-2.5 text-sm focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Customer List */}
              <div className="rounded-xl border border-zinc-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 text-left">
                    <tr>
                      <th className="px-4 py-3 font-medium text-zinc-600">Customer</th>
                      <th className="px-4 py-3 font-medium text-zinc-600">Column Break</th>
                      <th className="px-4 py-3 font-medium text-zinc-600 text-center">Freight Offset</th>
                      <th className="px-4 py-3 font-medium text-zinc-600 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filteredCustomers.slice(0, 50).map((customer) => (
                      <tr key={customer.id} className="hover:bg-zinc-50/50">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-zinc-900">{customer.name}</p>
                            <p className="text-xs text-zinc-500">{customer.id}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {editingCustomer === customer.id ? (
                            <input
                              type="text"
                              value={editValues.column_break ?? ""}
                              onChange={(e) =>
                                setEditValues({ ...editValues, column_break: e.target.value })
                              }
                              className="w-full rounded border border-zinc-300 px-2 py-1 text-sm font-mono focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          ) : (
                            <code className="text-xs font-mono bg-zinc-100 px-2 py-0.5 rounded">
                              {customer.column_break || "-"}
                            </code>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {editingCustomer === customer.id ? (
                            <input
                              type="number"
                              value={editValues.freight_column_offset ?? ""}
                              onChange={(e) =>
                                setEditValues({ ...editValues, freight_column_offset: e.target.value })
                              }
                              className="w-20 rounded border border-zinc-300 px-2 py-1 text-sm text-center focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          ) : (
                            <span className="text-zinc-600">{customer.freight_column_offset ?? 0}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {editingCustomer === customer.id ? (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleSaveCustomer(customer.id)}
                                className="rounded-lg bg-emerald-500 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-600"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingCustomer(null)}
                                className="rounded-lg border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleEditCustomer(customer)}
                                className="rounded-lg border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteCustomer(customer.id)}
                                className={cn(
                                  "rounded-lg px-3 py-1 text-xs font-medium",
                                  confirmDelete === customer.id
                                    ? "bg-red-500 text-white hover:bg-red-600"
                                    : "border border-red-200 text-red-600 hover:bg-red-50"
                                )}
                              >
                                {confirmDelete === customer.id ? "Confirm?" : "Delete"}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredCustomers.length > 50 && (
                  <div className="bg-zinc-50 px-4 py-2 text-center text-xs text-zinc-500">
                    Showing 50 of {filteredCustomers.length} customers. Use search to find more.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "items" && (
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Search items by SKU or description..."
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 pl-10 pr-4 py-2.5 text-sm focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Item List */}
              <div className="rounded-xl border border-zinc-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 text-left">
                    <tr>
                      <th className="px-4 py-3 font-medium text-zinc-600">SKU</th>
                      <th className="px-4 py-3 font-medium text-zinc-600">Description</th>
                      <th className="px-4 py-3 font-medium text-zinc-600 text-right">Avg Cost</th>
                      <th className="px-4 py-3 font-medium text-zinc-600 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filteredItems.slice(0, 50).map((item) => (
                      <tr key={item.sku} className="hover:bg-zinc-50/50">
                        <td className="px-4 py-3">
                          <code className="text-xs font-mono bg-zinc-100 px-2 py-0.5 rounded">
                            {item.sku}
                          </code>
                        </td>
                        <td className="px-4 py-3">
                          {editingItem === item.sku ? (
                            <input
                              type="text"
                              value={editValues.description ?? ""}
                              onChange={(e) =>
                                setEditValues({ ...editValues, description: e.target.value })
                              }
                              className="w-full rounded border border-zinc-300 px-2 py-1 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          ) : (
                            <span className="text-zinc-700">{item.description || "-"}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {editingItem === item.sku ? (
                            <input
                              type="number"
                              step="0.01"
                              value={editValues.avg_cost ?? ""}
                              onChange={(e) =>
                                setEditValues({ ...editValues, avg_cost: e.target.value })
                              }
                              className="w-24 rounded border border-zinc-300 px-2 py-1 text-sm text-right focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          ) : (
                            <span className="text-zinc-600">
                              {item.avg_cost != null ? `$${item.avg_cost.toFixed(2)}` : "-"}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {editingItem === item.sku ? (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleSaveItem(item.sku)}
                                className="rounded-lg bg-emerald-500 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-600"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingItem(null)}
                                className="rounded-lg border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleEditItem(item)}
                                className="rounded-lg border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.sku)}
                                className={cn(
                                  "rounded-lg px-3 py-1 text-xs font-medium",
                                  confirmDelete === item.sku
                                    ? "bg-red-500 text-white hover:bg-red-600"
                                    : "border border-red-200 text-red-600 hover:bg-red-50"
                                )}
                              >
                                {confirmDelete === item.sku ? "Confirm?" : "Delete"}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredItems.length > 50 && (
                  <div className="bg-zinc-50 px-4 py-2 text-center text-xs text-zinc-500">
                    Showing 50 of {filteredItems.length} items. Use search to find more.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-200 bg-zinc-50 px-6 py-3 flex justify-between items-center">
          <p className="text-xs text-zinc-500">
            Changes are saved automatically to the server.
          </p>
          <button
            onClick={onClose}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

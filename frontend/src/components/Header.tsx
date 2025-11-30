import type { AccountInfo } from "@azure/msal-browser";

interface HeaderProps {
  account: AccountInfo | null;
  onLogin: () => void;
  onLogout: () => void;
  authError: string | null;
  customersCount: number;
  itemsCount: number;
  isLoading: boolean;
}

export function Header({
  account,
  onLogin,
  onLogout,
  authError,
  customersCount,
  itemsCount,
  isLoading,
}: HeaderProps) {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-200">
              <svg
                className="h-5 w-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
                KR Pricing
              </h1>
              <p className="text-xs text-zinc-500">Quoting System</p>
            </div>
          </div>

          {/* Status Pills */}
          <div className="hidden items-center gap-2 md:flex">
            <StatusPill
              label="Customers"
              count={customersCount}
              loading={isLoading}
            />
            <StatusPill
              label="Items"
              count={itemsCount}
              loading={isLoading}
            />
          </div>

          {/* Auth Controls */}
          <div className="flex items-center gap-3">
            {account ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-zinc-900">
                    {account.name}
                  </p>
                  <p className="text-xs text-zinc-500">{account.username}</p>
                </div>
                <button
                  onClick={onLogout}
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 hover:border-zinc-300"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-zinc-800 hover:shadow-md"
              >
                <svg className="h-4 w-4" viewBox="0 0 21 21" fill="currentColor">
                  <path d="M0 0h10v10H0zM11 0h10v10H11zM0 11h10v10H0zM11 11h10v10H11z" />
                </svg>
                Sign in with Microsoft
              </button>
            )}
          </div>
        </div>

        {/* Auth Error */}
        {authError && (
          <div className="mt-3 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">
            {authError}
          </div>
        )}
      </div>
    </header>
  );
}

function StatusPill({
  label,
  count,
  loading,
}: {
  label: string;
  count: number;
  loading: boolean;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1">
      <span className="text-xs text-zinc-500">{label}</span>
      {loading ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
      ) : (
        <span className="text-xs font-semibold text-zinc-900">{count}</span>
      )}
    </div>
  );
}

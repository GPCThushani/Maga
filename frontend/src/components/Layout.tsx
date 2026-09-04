import type { ReactNode } from 'react';
import { useAuth } from '../services/AuthContext';

export type ScreenId =
  | 'overview'
  | 'applications'
  | 'cv-profile'
  | 'career-analysis'
  | 'analytics'
  | 'settings';

interface LayoutProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  children: ReactNode;
}

const NAV_ITEMS: { id: ScreenId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'applications', label: 'Applications' },
  { id: 'cv-profile', label: 'CV & Profile' },
  { id: 'career-analysis', label: 'Career Analysis' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'settings', label: 'Settings' },
];

export const Layout = ({ currentScreen, onNavigate, children }: LayoutProps) => {
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-textPrimary">
      {/* Sidebar pinned to screen height */}
      <aside className="flex h-full w-64 shrink-0 select-none flex-col justify-between border-r border-border bg-surface">
        <div>
          {/* Top: Logo Placeholder */}
          <div className="flex h-20 items-center border-b border-border px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-dashed border-border bg-background text-sm font-bold text-textPrimary shadow-xs">
                M
              </div>
              <span className="text-xs font-semibold tracking-wider text-textMuted uppercase">
                [ Logo Placeholder ]
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 p-3">
            {NAV_ITEMS.map((item) => {
              const isActive = currentScreen === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  className={`w-full rounded-btn px-3.5 py-2 text-left text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-accent-light font-semibold text-accent'
                      : 'text-textSecondary hover:bg-background hover:text-textPrimary'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Session Footer (Always visible at viewport bottom) */}
        <div className="border-t border-border p-4 bg-surface">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium text-textPrimary">
                {user?.name || 'Logged User'}
              </div>
              <div className="truncate text-[11px] text-textMuted">
                {user?.email || 'user@example.com'}
              </div>
            </div>
            <button
              type="button"
              onClick={logout}
              className="shrink-0 text-[11px] font-medium text-danger hover:underline"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area (Independent scroll) */}
      <main className="flex-1 overflow-y-auto px-10 py-8">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
};
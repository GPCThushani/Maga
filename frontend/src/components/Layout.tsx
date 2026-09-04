import type { ReactNode } from 'react';
import { BrandLogo } from './BrandWordmark';
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
    <div className="flex min-h-screen bg-background text-textPrimary">
      <aside className="flex w-64 select-none flex-col justify-between border-r border-border bg-surface">
        <div>
          <div className="flex items-center justify-between border-b border-border px-6 py-6">
            <BrandLogo />
            <span className="text-xs font-semibold tracking-widest text-textSecondary uppercase">
              Maga
            </span>
          </div>

          <nav className="space-y-1 p-3">
            {NAV_ITEMS.map((item) => {
              const isActive = currentScreen === item.id;
              return (
                <button
                  key={item.id}
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

        {/* User Session Footer */}
        <div className="border-t border-border p-4">
          <div className="flex items-center justify-between">
            <div className="truncate">
              <div className="truncate text-xs font-medium text-textPrimary">
                {user?.name || 'Logged User'}
              </div>
              <div className="truncate text-[11px] text-textMuted">{user?.email}</div>
            </div>
            <button
              onClick={logout}
              className="text-[11px] font-medium text-danger hover:underline"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto px-10 py-8">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
};
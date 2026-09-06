import type { ReactNode } from 'react';
import { useAuth } from '../services/AuthContext';
import logoImg from '../assets/logo.png';

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
  {
    id: 'overview',
    label: 'Overview',
  },
  {
    id: 'applications',
    label: 'Applications',
  },
  {
    id: 'cv-profile',
    label: 'CV & Profile',
  },
  {
    id: 'career-analysis',
    label: 'Career Analysis',
  },
  {
    id: 'analytics',
    label: 'Analytics',
  },
  {
    id: 'settings',
    label: 'Settings',
  },
];

export const Layout = ({
  currentScreen,
  onNavigate,
  children,
}: LayoutProps) => {
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-textPrimary">
      {/* =========================================================
          SIDEBAR
      ========================================================= */}
      <aside className="flex h-full w-64 shrink-0 select-none flex-col justify-between border-r border-border bg-surface">
        {/* =======================================================
            TOP SECTION
        ======================================================= */}
        <div>
          {/* -----------------------------------------------------
              CareerTrack Logo
          ----------------------------------------------------- */}
          <div className="flex h-20 items-center border-b border-border px-6">
            <button
              type="button"
              onClick={() => onNavigate('overview')}
              className="flex items-center rounded-btn focus:outline-none focus:ring-2 focus:ring-accent/20"
              aria-label="Go to CareerTrack overview"
            >
              <img
                src={logoImg}
                alt="CareerTrack"
                className="h-12 w-auto max-w-[170px] object-contain"
              />
            </button>
          </div>

          {/* -----------------------------------------------------
              Navigation
          ----------------------------------------------------- */}
          <nav
            className="space-y-1 p-3"
            aria-label="Main navigation"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = currentScreen === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  aria-current={isActive ? 'page' : undefined}
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

        {/* =======================================================
            USER SESSION FOOTER
        ======================================================= */}
        <div className="border-t border-border bg-surface p-4">
          <div className="flex items-center justify-between gap-3">
            {/* User Information */}
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium text-textPrimary">
                {user?.name || 'Logged User'}
              </div>

              <div className="mt-0.5 truncate text-[11px] text-textMuted">
                {user?.email || 'user@example.com'}
              </div>
            </div>

            {/* Sign Out */}
            <button
              type="button"
              onClick={logout}
              className="shrink-0 text-[11px] font-medium text-danger transition-colors hover:underline focus:outline-none focus:ring-2 focus:ring-danger/20"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* =========================================================
          MAIN CONTENT
      ========================================================= */}
      <main className="min-w-0 flex-1 overflow-y-auto px-10 py-8">
        <div className="mx-auto max-w-5xl">
          {children}
        </div>
      </main>
    </div>
  );
};

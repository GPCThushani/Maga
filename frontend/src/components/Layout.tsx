import { ReactNode } from 'react';
import { BrandLogo } from './BrandWordmark';

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
  return (
    <div className="flex min-h-screen bg-background text-textPrimary">
      {/* Left Sidebar */}
      <aside className="w-64 border-r border-border bg-surface flex flex-col justify-between select-none">
        <div>
          {/* Header area with Image Logo */}
          <div className="px-6 py-6 border-b border-border flex items-center justify-between">
            <BrandLogo />
            <span className="text-xs uppercase tracking-widest text-textSecondary font-semibold">
              Maga
            </span>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = currentScreen === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full text-left px-3.5 py-2 rounded-btn text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-accent-light text-accent font-semibold'
                      : 'text-textSecondary hover:text-textPrimary hover:bg-background'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-border text-xs text-textMuted">
          Maga Workspace v1.0
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main className="flex-1 overflow-y-auto px-10 py-8">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
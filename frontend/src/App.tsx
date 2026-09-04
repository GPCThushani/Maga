import { useState } from 'react';
import { AuthProvider, useAuth } from './services/AuthContext';
import { Layout, type ScreenId } from './components/Layout';
import { Overview } from './pages/Overview';
import { Applications } from './pages/Applications';
import { CareerAnalysis } from './pages/CareerAnalysis';
import { CVProfile } from './pages/CVProfile';
import { Auth } from './pages/Auth';
import { Analytics } from './pages/Analytics';

function MainApp() {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('overview');

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-xs text-textSecondary">
        Loading workspace...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Auth />;
  }

  return (
    <Layout currentScreen={currentScreen} onNavigate={setCurrentScreen}>
      {currentScreen === 'overview' && (
        <Overview onNavigate={(screen) => setCurrentScreen(screen as ScreenId)} />
      )}
      {currentScreen === 'applications' && <Applications />}
      {currentScreen === 'cv-profile' && <CVProfile />}
      {currentScreen === 'career-analysis' && <CareerAnalysis />}
      {currentScreen === 'analytics' && <Analytics />}
      {currentScreen === 'settings' && (
        <div className="space-y-4">
          <h1 className="text-2xl font-semibold text-textPrimary">Settings</h1>
          <p className="text-sm text-textSecondary">
            Account credentials, API integrations, and workspace preferences.
          </p>
        </div>
      )}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
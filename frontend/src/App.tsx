import { useState } from 'react';
import { Layout, type ScreenId } from './components/Layout';
import { Overview } from './pages/Overview';
import { Applications } from './pages/Applications';
import { CareerAnalysis } from './pages/CareerAnalysis';
import { CVProfile } from './pages/CVProfile';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('overview');

  return (
    <Layout currentScreen={currentScreen} onNavigate={setCurrentScreen}>
      {currentScreen === 'overview' && (
        <Overview onNavigate={(screen) => setCurrentScreen(screen as ScreenId)} />
      )}
      {currentScreen === 'applications' && <Applications />}
      {currentScreen === 'cv-profile' && <CVProfile />}
      {currentScreen === 'career-analysis' && <CareerAnalysis />}
      {currentScreen === 'analytics' && (
        <div className="space-y-4">
          <h1 className="text-2xl font-semibold text-textPrimary">Analytics</h1>
          <p className="text-sm text-textSecondary">
            Macro conversion metrics, interview rate trends, and monthly velocity reports.
          </p>
        </div>
      )}
      {currentScreen === 'settings' && (
        <div className="space-y-4">
          <h1 className="text-2xl font-semibold text-textPrimary">Settings</h1>
          <p className="text-sm text-textSecondary">
            Account credentials, API integrations, and notification preferences.
          </p>
        </div>
      )}
    </Layout>
  );
}
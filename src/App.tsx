import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { initializeScenarioData } from '@/utils/initializeScenarioData';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { AdaptiveDrillPage } from '@/pages/AdaptiveDrillPage';
import { ScenarioPreviewPage } from '@/pages/ScenarioPreviewPage';
import { ScenarioSelectPage } from '@/pages/ScenarioSelectPage';
import { ProgressPage } from '@/pages/ProgressPage';
import { LeaderboardPage } from '@/pages/LeaderboardPage';
import { TeamsPage } from '@/pages/TeamsPage';

function App(): JSX.Element {
  useEffect(() => {
    // Set application title
    document.title = 'Diamond IQ';
    // Validate scenario dataset on app load
    initializeScenarioData();
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes - no sidebar */}
          <Route path="/welcome" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/preview" element={<ScenarioPreviewPage />} />

          {/* Protected routes - with sidebar layout */}
          <Route
            path="/drill"
            element={
              <ProtectedRoute>
                <Layout>
                  <AdaptiveDrillPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/progress"
            element={
              <ProtectedRoute>
                <Layout>
                  <ProgressPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout>
                  <ScenarioSelectPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/leaderboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <LeaderboardPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/teams"
            element={
              <ProtectedRoute>
                <Layout>
                  <TeamsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

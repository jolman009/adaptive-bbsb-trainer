import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { initializeScenarioData } from '@/utils/initializeScenarioData';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { LoginPage } from '@/pages/LoginPage';
import { AdaptiveDrillPage } from '@/pages/AdaptiveDrillPage';

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
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AdaptiveDrillPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

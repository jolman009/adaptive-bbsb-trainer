import { useEffect } from 'react';
import { initializeScenarioData } from '@/utils/initializeScenarioData';
import { AdaptiveDrillPage } from '@/pages/AdaptiveDrillPage';

function App(): JSX.Element {
  useEffect(() => {
    // Validate scenario dataset on app load
    initializeScenarioData();
  }, []);

  return <AdaptiveDrillPage />;
}

export default App;

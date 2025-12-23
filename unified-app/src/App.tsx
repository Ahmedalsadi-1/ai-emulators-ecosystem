import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UnifiedLayout } from '@/layouts/UnifiedLayout';
import { Dashboard } from '@/pages/Dashboard';
import { AppViewer } from '@/pages/AppViewer';
import { Settings } from '@/pages/Settings';
import { WorkflowsPage } from '@/pages/Workflows';
import { AutomationPage } from '@/pages/Automation';
import { ContentPage } from '@/pages/Content';
import { InfrastructurePage } from '@/pages/Infrastructure';
import Desktop from '@/pages/Desktop';

function App() {
  return (
    <Router>
      <UnifiedLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/automation" element={<AutomationPage />} />
          <Route path="/app/:appId" element={<AppViewer />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/category/content-creation" element={<ContentPage />} />
          <Route path="/category/infrastructure" element={<InfrastructurePage />} />
          <Route path="/category/:categoryId" element={<Dashboard />} />
          <Route path="/workflows" element={<WorkflowsPage />} />
          <Route path="/desktop" element={<Desktop />} />
        </Routes>
      </UnifiedLayout>
    </Router>
  );
}

export default App;
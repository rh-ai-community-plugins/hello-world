import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import UserProjectsPage from './pages/UserProjectsPage';
import ClusterResourcesPage from './pages/ClusterResourcesPage';

const App: React.FC = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/hello-world/user-projects" replace />} />
    <Route path="/hello-world" element={<Navigate to="/hello-world/user-projects" replace />} />
    <Route path="/hello-world/user-projects" element={<UserProjectsPage />} />
    <Route path="/hello-world/cluster-resources" element={<ClusterResourcesPage />} />
  </Routes>
);

export default App;

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import UserProjectsPage from './pages/UserProjectsPage';
import ClusterResourcesPage from './pages/ClusterResourcesPage';

const App: React.FC = () => (
  <Routes>
    <Route path="/" element={<Navigate to="user-projects" replace />} />
    <Route path="user-projects/*" element={<UserProjectsPage />} />
    <Route path="cluster-resources/*" element={<ClusterResourcesPage />} />
  </Routes>
);

export default App;

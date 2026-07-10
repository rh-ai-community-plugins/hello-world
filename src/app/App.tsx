import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import UserInfoPage from './pages/UserInfoPage';
import ClusterResourcesPage from './pages/ClusterResourcesPage';
import NamespaceSummaryPage from './pages/NamespaceSummaryPage';

const App: React.FC = () => (
  <Routes>
    <Route path="/" element={<Navigate to="user-info" replace />} />
    <Route path="user-info/*" element={<UserInfoPage />} />
    <Route path="cluster-resources/*" element={<ClusterResourcesPage />} />
    <Route path="namespace-summary/*" element={<NamespaceSummaryPage />} />
  </Routes>
);

export default App;

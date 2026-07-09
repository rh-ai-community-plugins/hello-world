import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import UserInfoPage from './pages/UserInfoPage';
import ClusterResourcesPage from './pages/ClusterResourcesPage';

const App: React.FC = () => (
  <Routes>
    <Route path="/" element={<Navigate to="user-info" replace />} />
    <Route path="user-info/*" element={<UserInfoPage />} />
    <Route path="cluster-resources/*" element={<ClusterResourcesPage />} />
  </Routes>
);

export default App;

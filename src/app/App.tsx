import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { userProjectsPath, clusterResourcesPath } from './utilities';
import UserProjectsPage from './pages/UserProjectsPage';
import ClusterResourcesPage from './pages/ClusterResourcesPage';

const App: React.FC = () => (
  <Routes>
    <Route path="/" element={<Navigate to={userProjectsPath} replace />} />
    <Route path="/hello-world" element={<Navigate to={userProjectsPath} replace />} />
    <Route path={`${userProjectsPath}/*`} element={<UserProjectsPage />} />
    <Route path={`${clusterResourcesPath}/*`} element={<ClusterResourcesPage />} />
  </Routes>
);

export default App;

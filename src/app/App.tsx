import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Bullseye, Page, PageSection } from '@patternfly/react-core';
import HelloWorldPage from './components/HelloWorldPage';

const App: React.FC = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Simulate initialization
    setIsReady(true);
  }, []);

  if (!isReady) {
    return (
      <Page>
        <PageSection>
          <Bullseye>Loading...</Bullseye>
        </PageSection>
      </Page>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<HelloWorldPage />} />
      <Route path="/hello-world" element={<HelloWorldPage />} />
    </Routes>
  );
};

export default App;

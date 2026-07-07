import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./pages/UserProjectsPage', () => {
  const MockPage = () => <div data-testid="user-projects-page">User Projects Page</div>;
  MockPage.displayName = 'MockUserProjectsPage';
  return { __esModule: true, default: MockPage };
});

jest.mock('./pages/ClusterResourcesPage', () => {
  const MockPage = () => <div data-testid="cluster-resources-page">Cluster Resources Page</div>;
  MockPage.displayName = 'MockClusterResourcesPage';
  return { __esModule: true, default: MockPage };
});

describe('App Component', () => {
  it('should render the first route element', () => {
    render(<App />);
    expect(screen.getByTestId('routes')).toBeInTheDocument();
  });
});

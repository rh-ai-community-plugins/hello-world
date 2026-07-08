import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useCurrentUser } from '~/app/hooks/useCurrentUser';
import { useProjects } from '~/app/hooks/useProjects';
import { useAccessReview } from '~/app/hooks/useAccessReview';
import UserProjectsPage from './UserProjectsPage';

jest.mock('~/app/hooks/useCurrentUser');
jest.mock('~/app/hooks/useProjects');
jest.mock('~/app/hooks/useAccessReview');

const mockUser = {
  userName: 'test-user',
  userID: 'uid-123',
  isAdmin: false,
  clusterID: 'cluster-abc',
  clusterBranding: 'ocp',
  namespace: 'default',
  currentContext: 'ctx',
  currentUser: 'test-user',
  isAllowed: true,
  serverURL: 'https://api.cluster.example.com:6443',
};

const mockProjects = [
  { metadata: { name: 'project-a', uid: 'uid-a' } },
  { metadata: { name: 'project-b', uid: 'uid-b' } },
];

const mockAccessResults = [
  { verb: 'get', resource: 'deployments', group: 'apps', allowed: true },
  { verb: 'create', resource: 'deployments', group: 'apps', allowed: false },
];

describe('UserProjectsPage', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (useAccessReview as jest.Mock).mockReturnValue({
      results: [],
      loading: false,
      error: null,
    });
  });

  it('shows loading spinner while user data loads', () => {
    (useCurrentUser as jest.Mock).mockReturnValue({
      user: null,
      loading: true,
      error: null,
    });
    (useProjects as jest.Mock).mockReturnValue({
      projects: [],
      loading: false,
      error: null,
    });

    render(<UserProjectsPage />);

    expect(screen.getByLabelText('Loading user information')).toBeInTheDocument();
  });

  it('shows error alert when user fetch fails', () => {
    (useCurrentUser as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
      error: 'Failed to fetch status: 403',
    });
    (useProjects as jest.Mock).mockReturnValue({
      projects: [],
      loading: false,
      error: null,
    });

    render(<UserProjectsPage />);

    expect(screen.getByText('Failed to load user information')).toBeInTheDocument();
    expect(screen.getByText('Failed to fetch status: 403')).toBeInTheDocument();
  });

  it('displays user information when loaded', () => {
    (useCurrentUser as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
      error: null,
    });
    (useProjects as jest.Mock).mockReturnValue({
      projects: [],
      loading: false,
      error: null,
    });

    render(<UserProjectsPage />);

    expect(screen.getByText('test-user')).toBeInTheDocument();
    expect(screen.getByText('uid-123')).toBeInTheDocument();
    expect(screen.getByText('cluster-abc')).toBeInTheDocument();
    expect(screen.getByText('ocp')).toBeInTheDocument();
    expect(screen.getByText('default')).toBeInTheDocument();
    // isAdmin is false so the label should say 'No'
    expect(screen.getByText('No')).toBeInTheDocument();
  });

  it('shows project dropdown with project names', async () => {
    const user = userEvent.setup();

    (useCurrentUser as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
      error: null,
    });
    (useProjects as jest.Mock).mockReturnValue({
      projects: mockProjects,
      loading: false,
      error: null,
    });

    render(<UserProjectsPage />);

    const toggle = screen.getByLabelText('Select a project');
    await user.click(toggle);

    await waitFor(() => {
      expect(screen.getByText('project-a')).toBeInTheDocument();
      expect(screen.getByText('project-b')).toBeInTheDocument();
    });
  });

  it('shows RBAC permissions table after selecting a project', async () => {
    const user = userEvent.setup();

    (useCurrentUser as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
      error: null,
    });
    (useProjects as jest.Mock).mockReturnValue({
      projects: mockProjects,
      loading: false,
      error: null,
    });
    (useAccessReview as jest.Mock).mockReturnValue({
      results: mockAccessResults,
      loading: false,
      error: null,
    });

    render(<UserProjectsPage />);

    // Open the project selector and select a project
    const toggle = screen.getByLabelText('Select a project');
    await user.click(toggle);

    const option = await screen.findByText('project-a');
    await user.click(option);

    // The permissions table should now be visible
    await waitFor(() => {
      expect(screen.getByLabelText('RBAC permissions')).toBeInTheDocument();
      expect(screen.getByText('deployments')).toBeInTheDocument();
      expect(screen.getByText('Yes')).toBeInTheDocument();
    });
  });
});

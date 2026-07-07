import { userProjectsPath, clusterResourcesPath } from '~/app/utilities';

export const helloWorldAreaExtension = {
  type: 'app.area' as const,
  properties: {
    id: 'hello-world',
    featureFlags: [] as string[],
  },
};

export const communityPluginsSectionExtension = {
  type: 'app.navigation/section' as const,
  properties: {
    id: 'community-plugins',
    title: 'Community plugins',
    group: '9_plugins',
    iconRef: () => import('./HelloWorldNavIcon'),
  },
};

export const userProjectsNavExtension = {
  type: 'app.navigation/href' as const,
  properties: {
    id: 'hello-world-user-projects',
    title: 'User & Projects',
    href: userProjectsPath,
    section: 'community-plugins',
    label: 'Community',
  },
};

export const clusterResourcesNavExtension = {
  type: 'app.navigation/href' as const,
  properties: {
    id: 'hello-world-cluster-resources',
    title: 'Cluster Resources',
    href: clusterResourcesPath,
    section: 'community-plugins',
    label: 'Community',
  },
};

export const helloWorldRouteExtension = {
  type: 'app.route' as const,
  properties: {
    path: '/hello-world/*',
    component: () => import('~/app/App'),
  },
};

export const extensions = [
  helloWorldAreaExtension,
  communityPluginsSectionExtension,
  userProjectsNavExtension,
  clusterResourcesNavExtension,
  helloWorldRouteExtension,
];

export default extensions;

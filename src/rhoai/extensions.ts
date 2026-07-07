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
    href: '/hello-world/user-projects',
    section: 'community-plugins',
    label: 'Community',
  },
};

export const clusterResourcesNavExtension = {
  type: 'app.navigation/href' as const,
  properties: {
    id: 'hello-world-cluster-resources',
    title: 'Cluster Resources',
    href: '/hello-world/cluster-resources',
    section: 'community-plugins',
    label: 'Community',
  },
};

export const userProjectsRouteExtension = {
  type: 'app.route' as const,
  properties: {
    path: '/hello-world/user-projects/*',
    component: () => import('../app/pages/UserProjectsPage'),
  },
};

export const clusterResourcesRouteExtension = {
  type: 'app.route' as const,
  properties: {
    path: '/hello-world/cluster-resources/*',
    component: () => import('../app/pages/ClusterResourcesPage'),
  },
};

export const extensions = [
  helloWorldAreaExtension,
  communityPluginsSectionExtension,
  userProjectsNavExtension,
  clusterResourcesNavExtension,
  userProjectsRouteExtension,
  clusterResourcesRouteExtension,
];

export default extensions;

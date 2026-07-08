export const helloWorldAreaExtension = {
  type: 'app.area' as const,
  properties: {
    id: 'hello-world', // [PLUGIN-SPECIFIC] unique area ID
    featureFlags: [] as string[],
  },
};

export const communityPluginsSectionExtension = {
  type: 'app.navigation/section' as const,
  properties: {
    id: 'community-plugins', // [SHARED] common section for all community plugins
    title: 'Community plugins', // [SHARED]
    group: '9_plugins', // [SHARED]
    iconRef: () => import('./CommunityNavIcon'),
  },
};

export const helloWorldSectionExtension = {
  type: 'app.navigation/section' as const,
  properties: {
    id: 'hello-world', // [PLUGIN-SPECIFIC] unique nav section ID
    title: 'Hello World', // [PLUGIN-SPECIFIC] display name in sidebar
    group: '1_hello_world', // [PLUGIN-SPECIFIC] sort key within community-plugins
    section: 'community-plugins', // [SHARED] parent section reference
    iconRef: () => import('./HelloWorldNavIcon'),
  },
};

export const userProjectsNavExtension = {
  type: 'app.navigation/href' as const,
  properties: {
    id: 'hello-world-user-projects', // [PLUGIN-SPECIFIC] unique nav item ID
    title: 'User & Projects',
    href: '/hello-world/user-projects', // [PLUGIN-SPECIFIC] must match route prefix
    section: 'hello-world', // [PLUGIN-SPECIFIC] references this plugin's section ID
    path: '/hello-world/user-projects/*', // [PLUGIN-SPECIFIC] route-matching pattern
  },
};

export const clusterResourcesNavExtension = {
  type: 'app.navigation/href' as const,
  properties: {
    id: 'hello-world-cluster-resources', // [PLUGIN-SPECIFIC] unique nav item ID
    title: 'Cluster Resources',
    href: '/hello-world/cluster-resources', // [PLUGIN-SPECIFIC] must match route prefix
    section: 'hello-world', // [PLUGIN-SPECIFIC] references this plugin's section ID
    path: '/hello-world/cluster-resources/*', // [PLUGIN-SPECIFIC] route-matching pattern
  },
};

export const helloWorldRouteExtension = {
  type: 'app.route' as const,
  properties: {
    path: '/hello-world/*', // [PLUGIN-SPECIFIC] top-level route prefix
    component: () => import('~/app/App'),
  },
};

export const extensions = [
  helloWorldAreaExtension,
  communityPluginsSectionExtension,
  helloWorldSectionExtension,
  userProjectsNavExtension,
  clusterResourcesNavExtension,
  helloWorldRouteExtension,
];

export default extensions;

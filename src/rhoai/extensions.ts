/**
 * RHOAI Hello World Plugin Extensions
 *
 * This file defines the extension points that register this plugin
 * with the RHOAI Dashboard. It follows the Module Federation pattern
 * used by other RHOAI plugins.
 */

// Extension point types from @openshift/dynamic-plugin-sdk
// These are the standard extension types that the RHOAI dashboard recognizes

/**
 * Area Extension - Creates a top-level area/section in the dashboard
 */
export const helloWorldAreaExtension = {
  type: 'app.area' as const,
  properties: {
    id: 'hello-world',
    featureFlags: [], // No feature flags required for this simple plugin
  },
};

/**
 * Navigation Item Extension - Adds a link to the sidebar navigation
 */
export const helloWorldNavItemExtension = {
  type: 'app.navigation/href' as const,
  properties: {
    id: 'hello-world-nav',
    title: 'Hello World',
    href: '/hello-world',
    group: '9_plugins',
  },
};

/**
 * Route Extension - Registers the plugin's route
 */
export const helloWorldRouteExtension = {
  type: 'app.route' as const,
  properties: {
    path: '/hello-world/*',
    // The component will be dynamically imported via Module Federation
    component: () => import('../app/components/HelloWorldPage'),
  },
};

/**
 * All extensions exported together
 */
export const extensions = [
  helloWorldAreaExtension,
  helloWorldNavItemExtension,
  helloWorldRouteExtension,
];

export default extensions;

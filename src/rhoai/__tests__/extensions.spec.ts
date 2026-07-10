import {
  helloWorldAreaExtension,
  communityPluginsSectionExtension,
  helloWorldSectionExtension,
  userInfoNavExtension,
  clusterResourcesNavExtension,
  namespaceSummaryNavExtension,
  helloWorldRouteExtension,
  extensions,
} from '../extensions';

describe('RHOAI Plugin Extensions', () => {
  describe('helloWorldAreaExtension', () => {
    it('should have the correct type and id', () => {
      expect(helloWorldAreaExtension.type).toBe('app.area');
      expect(helloWorldAreaExtension.properties.id).toBe('hello-world');
    });

    it('should have an empty featureFlags array', () => {
      expect(helloWorldAreaExtension.properties.featureFlags).toEqual([]);
    });
  });

  describe('communityPluginsSectionExtension', () => {
    it('should define the community-plugins section', () => {
      expect(communityPluginsSectionExtension.type).toBe('app.navigation/section');
      expect(communityPluginsSectionExtension.properties.id).toBe('community-plugins');
      expect(communityPluginsSectionExtension.properties.title).toBe('Community plugins');
      expect(communityPluginsSectionExtension.properties.group).toBe('9_plugins');
    });

    it('should have an iconRef function', () => {
      expect(typeof communityPluginsSectionExtension.properties.iconRef).toBe('function');
    });
  });

  describe('helloWorldSectionExtension', () => {
    it('should define a subsection nested under community-plugins', () => {
      expect(helloWorldSectionExtension.type).toBe('app.navigation/section');
      expect(helloWorldSectionExtension.properties.id).toBe('hello-world');
      expect(helloWorldSectionExtension.properties.title).toBe('Hello World');
      expect(helloWorldSectionExtension.properties.group).toBe('1_hello_world');
      expect(helloWorldSectionExtension.properties.section).toBe('community-plugins');
      expect(typeof helloWorldSectionExtension.properties.iconRef).toBe('function');
    });
  });

  describe('navigation extensions', () => {
    it('should define User Info nav item under hello-world section', () => {
      expect(userInfoNavExtension.type).toBe('app.navigation/href');
      expect(userInfoNavExtension.properties.id).toBe('hello-world-user-info');
      expect(userInfoNavExtension.properties.title).toBe('User Info');
      expect(userInfoNavExtension.properties.href).toBe('/hello-world/user-info');
      expect(userInfoNavExtension.properties.section).toBe('hello-world');
      expect(userInfoNavExtension.properties.path).toBe('/hello-world/user-info/*');
    });

    it('should define Cluster Resources nav item under hello-world section', () => {
      expect(clusterResourcesNavExtension.type).toBe('app.navigation/href');
      expect(clusterResourcesNavExtension.properties.id).toBe('hello-world-cluster-resources');
      expect(clusterResourcesNavExtension.properties.title).toBe('Cluster Resources');
      expect(clusterResourcesNavExtension.properties.href).toBe('/hello-world/cluster-resources');
      expect(clusterResourcesNavExtension.properties.section).toBe('hello-world');
      expect(clusterResourcesNavExtension.properties.path).toBe('/hello-world/cluster-resources/*');
    });

    it('should define Namespace Summary nav item under hello-world section', () => {
      expect(namespaceSummaryNavExtension.type).toBe('app.navigation/href');
      expect(namespaceSummaryNavExtension.properties.id).toBe('hello-world-namespace-summary');
      expect(namespaceSummaryNavExtension.properties.title).toBe('Namespace Summary');
      expect(namespaceSummaryNavExtension.properties.href).toBe('/hello-world/namespace-summary');
      expect(namespaceSummaryNavExtension.properties.section).toBe('hello-world');
      expect(namespaceSummaryNavExtension.properties.path).toBe('/hello-world/namespace-summary/*');
    });
  });

  describe('route extension', () => {
    it('should define a single wildcard route with lazy component', () => {
      expect(helloWorldRouteExtension.type).toBe('app.route');
      expect(helloWorldRouteExtension.properties.path).toBe('/hello-world/*');
      expect(typeof helloWorldRouteExtension.properties.component).toBe('function');
      expect(helloWorldRouteExtension.properties.component()).toBeInstanceOf(Promise);
    });
  });

  describe('extensions array', () => {
    it('should contain all seven extensions', () => {
      expect(extensions).toHaveLength(7);
    });

    it('should include all extensions in the correct order', () => {
      expect(extensions).toEqual([
        helloWorldAreaExtension,
        communityPluginsSectionExtension,
        helloWorldSectionExtension,
        userInfoNavExtension,
        clusterResourcesNavExtension,
        namespaceSummaryNavExtension,
        helloWorldRouteExtension,
      ]);
    });
  });
});

import {
  helloWorldAreaExtension,
  communityPluginsSectionExtension,
  userProjectsNavExtension,
  clusterResourcesNavExtension,
  userProjectsRouteExtension,
  clusterResourcesRouteExtension,
  extensions,
} from './extensions';

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

  describe('navigation extensions', () => {
    it('should define User & Projects nav item', () => {
      expect(userProjectsNavExtension.type).toBe('app.navigation/href');
      expect(userProjectsNavExtension.properties.id).toBe('hello-world-user-projects');
      expect(userProjectsNavExtension.properties.title).toBe('User & Projects');
      expect(userProjectsNavExtension.properties.href).toBe('/hello-world/user-projects');
      expect(userProjectsNavExtension.properties.section).toBe('community-plugins');
      expect(userProjectsNavExtension.properties.label).toBe('Community');
    });

    it('should define Cluster Resources nav item', () => {
      expect(clusterResourcesNavExtension.type).toBe('app.navigation/href');
      expect(clusterResourcesNavExtension.properties.id).toBe('hello-world-cluster-resources');
      expect(clusterResourcesNavExtension.properties.title).toBe('Cluster Resources');
      expect(clusterResourcesNavExtension.properties.href).toBe('/hello-world/cluster-resources');
      expect(clusterResourcesNavExtension.properties.section).toBe('community-plugins');
      expect(clusterResourcesNavExtension.properties.label).toBe('Community');
    });
  });

  describe('route extensions', () => {
    it('should define user-projects route with lazy component', () => {
      expect(userProjectsRouteExtension.type).toBe('app.route');
      expect(userProjectsRouteExtension.properties.path).toBe('/hello-world/user-projects/*');
      expect(typeof userProjectsRouteExtension.properties.component).toBe('function');
      expect(userProjectsRouteExtension.properties.component()).toBeInstanceOf(Promise);
    });

    it('should define cluster-resources route with lazy component', () => {
      expect(clusterResourcesRouteExtension.type).toBe('app.route');
      expect(clusterResourcesRouteExtension.properties.path).toBe('/hello-world/cluster-resources/*');
      expect(typeof clusterResourcesRouteExtension.properties.component).toBe('function');
      expect(clusterResourcesRouteExtension.properties.component()).toBeInstanceOf(Promise);
    });
  });

  describe('extensions array', () => {
    it('should contain all six extensions', () => {
      expect(extensions).toHaveLength(6);
    });

    it('should include all extensions in the correct order', () => {
      expect(extensions).toEqual([
        helloWorldAreaExtension,
        communityPluginsSectionExtension,
        userProjectsNavExtension,
        clusterResourcesNavExtension,
        userProjectsRouteExtension,
        clusterResourcesRouteExtension,
      ]);
    });
  });
});

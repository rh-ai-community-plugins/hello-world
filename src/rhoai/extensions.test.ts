import {
  helloWorldAreaExtension,
  helloWorldNavItemExtension,
  helloWorldRouteExtension,
  extensions,
} from './extensions';

describe('RHOAI Plugin Extensions', () => {
  describe('helloWorldAreaExtension', () => {
    it('should have the correct type', () => {
      expect(helloWorldAreaExtension.type).toBe('app.area');
    });

    it('should have the correct id in properties', () => {
      expect(helloWorldAreaExtension.properties.id).toBe('hello-world');
    });

    it('should have an empty featureFlags array', () => {
      expect(helloWorldAreaExtension.properties.featureFlags).toEqual([]);
    });
  });

  describe('helloWorldNavItemExtension', () => {
    it('should have the correct type', () => {
      expect(helloWorldNavItemExtension.type).toBe('app.navigation/href');
    });

    it('should have the correct id in properties', () => {
      expect(helloWorldNavItemExtension.properties.id).toBe('hello-world-nav');
    });

    it('should have the correct title', () => {
      expect(helloWorldNavItemExtension.properties.title).toBe('Hello World');
    });

    it('should have the correct href', () => {
      expect(helloWorldNavItemExtension.properties.href).toBe('/hello-world');
    });

    it('should be in the plugins group', () => {
      expect(helloWorldNavItemExtension.properties.group).toBe('9_plugins');
    });
  });

  describe('helloWorldRouteExtension', () => {
    it('should have the correct type', () => {
      expect(helloWorldRouteExtension.type).toBe('app.route');
    });

    it('should have the correct path', () => {
      expect(helloWorldRouteExtension.properties.path).toBe('/hello-world/*');
    });

    it('should have a component function', () => {
      expect(typeof helloWorldRouteExtension.properties.component).toBe('function');
    });

    it('should return a module when component is called', () => {
      const result = helloWorldRouteExtension.properties.component();
      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe('extensions array', () => {
    it('should contain all three extensions', () => {
      expect(extensions).toHaveLength(3);
    });

    it('should include helloWorldAreaExtension', () => {
      expect(extensions).toContain(helloWorldAreaExtension);
    });

    it('should include helloWorldNavItemExtension', () => {
      expect(extensions).toContain(helloWorldNavItemExtension);
    });

    it('should include helloWorldRouteExtension', () => {
      expect(extensions).toContain(helloWorldRouteExtension);
    });

    it('should export extensions as default', () => {
      // The default export should be the same array
      expect(extensions).toBeInstanceOf(Array);
    });
  });
});

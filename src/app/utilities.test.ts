import { helloWorldPath } from './utilities';

describe('utilities', () => {
  describe('helloWorldPath', () => {
    it('should export the correct path', () => {
      expect(helloWorldPath).toBe('/hello-world');
    });

    it('should be a string', () => {
      expect(typeof helloWorldPath).toBe('string');
    });

    it('should start with a forward slash', () => {
      expect(helloWorldPath.startsWith('/')).toBe(true);
    });
  });
});

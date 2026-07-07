import { userProjectsPath, clusterResourcesPath } from './utilities';

describe('utilities', () => {
  it('should export the correct user-projects path', () => {
    expect(userProjectsPath).toBe('/hello-world/user-projects');
  });

  it('should export the correct cluster-resources path', () => {
    expect(clusterResourcesPath).toBe('/hello-world/cluster-resources');
  });
});

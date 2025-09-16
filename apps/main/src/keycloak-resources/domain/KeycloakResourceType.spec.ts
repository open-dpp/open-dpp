import { KeycloakResourceType } from './KeycloakResourceType';

describe('KeycloakResourceType', () => {
  it('should define the organization resource type', () => {
    expect(KeycloakResourceType.ORGANIZATION).toEqual('organization');
  });
});

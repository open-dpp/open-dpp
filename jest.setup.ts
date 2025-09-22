import 'reflect-metadata';
import { org1, user2org1 } from '@app/testing/users-and-orgs';

// or
import '@jest/globals';

jest.mock('@keycloak/keycloak-admin-client', () => {
  return {
    __esModule: true, // Ensure Jest understands it's an ES module
    default: jest.fn(() => ({
      auth: jest.fn().mockResolvedValue(undefined),
      users: {
        find: jest.fn().mockResolvedValue([]), // Mock user retrieval returning an empty array
        findOne: jest.fn().mockResolvedValue({ id: user2org1.sub }),
        create: jest.fn().mockResolvedValue({ id: user2org1.sub }),
        update: jest.fn().mockResolvedValue(undefined),
        del: jest.fn().mockResolvedValue(undefined),
        addToGroup: jest.fn().mockResolvedValue(undefined),
        listGroups: jest
          .fn()
          .mockResolvedValue([
            { id: org1.id, name: `organization-${org1.id}` },
          ]),
      },
      realms: {
        find: jest
          .fn()
          .mockResolvedValue([{ id: 'mock-realm-id', realm: 'test-realm' }]),
      },
      groups: {
        find: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({ id: org1.id }),
        update: jest.fn().mockResolvedValue(undefined),
        del: jest.fn().mockResolvedValue(undefined),
      },
    })),
  };
});

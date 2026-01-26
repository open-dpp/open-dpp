import { describe, it, expect, jest, afterEach } from '@jest/globals';
import { generateMongoConfig } from './config';
import { EnvService } from '@open-dpp/env';

// Mock EnvService
const mockConfigService = {
    get: jest.fn(),
} as unknown as EnvService;

describe('generateMongoConfig', () => {
    const originalNodeEnv = process.env.NODE_ENV;

    afterEach(() => {
        process.env.NODE_ENV = originalNodeEnv;
        jest.clearAllMocks();
    });

    it('should replace existing database name in test environment', () => {
        process.env.NODE_ENV = 'test';
        (mockConfigService.get as jest.Mock).mockReturnValue('mongodb://localhost:27017/existing-db');

        const config = generateMongoConfig(mockConfigService);

        // Expect format: mongodb://localhost:27017/test-<uuid>
        // NOT: mongodb://localhost:27017/existing-db/test-<uuid>
        expect(config.uri).toMatch(/^mongodb:\/\/localhost:27017\/test-[a-f0-9-]+$/);
        expect(config.uri).not.toContain('existing-db');
    });

    it('should handle URI with query params in test environment', () => {
        process.env.NODE_ENV = 'test';
        (mockConfigService.get as jest.Mock).mockReturnValue('mongodb://localhost:27017/existing-db?replicaSet=rs0');

        const config = generateMongoConfig(mockConfigService);

        expect(config.uri).toMatch(/^mongodb:\/\/localhost:27017\/test-[a-f0-9-]+\?replicaSet=rs0$/);
        expect(config.uri).not.toContain('existing-db');
    });

    it('should handle URI without path in test environment', () => {
        process.env.NODE_ENV = 'test';
        (mockConfigService.get as jest.Mock).mockReturnValue('mongodb://localhost:27017');

        const config = generateMongoConfig(mockConfigService);

        expect(config.uri).toMatch(/^mongodb:\/\/localhost:27017\/test-[a-f0-9-]+$/);
    });

    it('should handle URI with trailing slash in test environment', () => {
        process.env.NODE_ENV = 'test';
        (mockConfigService.get as jest.Mock).mockReturnValue('mongodb://localhost:27017/');

        const config = generateMongoConfig(mockConfigService);

        expect(config.uri).toMatch(/^mongodb:\/\/localhost:27017\/test-[a-f0-9-]+$/);
    });
});

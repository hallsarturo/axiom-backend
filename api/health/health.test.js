import request from 'supertest';
import { app } from '../../index.js';

describe('Health API', () => {
    test('should return ok status', async () => {
        const response = await request(app).get('/api/health');

        expect(response.status).toBe(200);
        expect(response.body.status).toBe('ok');
    });

    test('should get the total up time', async () => {
        const response = await request(app).get('/api/health');

        expect(response.body.uptime)
            .toBeDefined()
            .toBeGreaterThan(0)
            .toBeTypeOf('number');
    });
});

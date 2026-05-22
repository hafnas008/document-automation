import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { buildApp } from './server';

const SECRET = 'test-secret';
const app = buildApp({ secret: SECRET, libreOfficeBin: '/usr/bin/false' });

describe('GET /health', () => {
  it('returns ok', async () => {
    const r = await request(app).get('/health');
    expect(r.status).toBe(200);
    expect(r.body.ok).toBe(true);
  });
});

describe('POST /xlsx-to-pdf auth', () => {
  it('401 without secret', async () => {
    const r = await request(app).post('/xlsx-to-pdf').send(Buffer.from('x'));
    expect(r.status).toBe(401);
  });
  it('401 with wrong secret', async () => {
    const r = await request(app)
      .post('/xlsx-to-pdf')
      .set('x-render-secret', 'wrong')
      .send(Buffer.from('x'));
    expect(r.status).toBe(401);
  });
});

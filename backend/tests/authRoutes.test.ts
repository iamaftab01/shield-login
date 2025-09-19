import request from 'supertest';
import express from 'express';
import authRoutes from '../src/routes/auth';

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

describe('Auth Routes', () => {
  it('POST /auth/register should return success', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'test@example.com', password: 'pass123' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');
  });

  it('POST /auth/login with wrong password should return error', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'wrong@example.com', password: 'badpass' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
  });
});

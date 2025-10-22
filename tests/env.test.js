// tests/env.test.js
import dotenv from 'dotenv';
dotenv.config();

test('MS_ACCESS_WEBAPP_DATABASE_NAME está definida y es correcta', () => {
  expect(process.env.MS_ACCESS_WEBAPP_DATABASE_NAME).toBeDefined();
  expect(process.env.MS_ACCESS_WEBAPP_DATABASE_NAME).toBe('mswebapp');
});
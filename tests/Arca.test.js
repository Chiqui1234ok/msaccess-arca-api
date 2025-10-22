/**
 * Testing para todas las funciones de la clase ARCA
 */
import db from './src/config/mongoose.js';
import { Types } from 'mongoose';
import Arca from '../src/classes/Arca.js'

test('Encontrar un voucher desde BD', async () => {
  db.connect();
  const data = { PtoVta: 1, VoucherNumber: 19 };
  const arca = new Arca();
  const result = await arca.getVoucherFromDb(data);
  const resultIsValid = Types.ObjectId.isValid(result._id);
  expect(resultIsValid).toBe(true);
});

afterAll(async () => {
  await db.disconnect(); // 👈 esto cierra la conexión
});
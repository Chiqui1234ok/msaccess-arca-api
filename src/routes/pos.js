import express from 'express';
import Arca from '../classes/Arca.js';

const router = express.Router();

router.get('/', async (req, res) => {
    const arca = new Arca();
    const result = await arca.ElectronicBilling.getSalesPoints();
    res.send(result);
});

export default router;
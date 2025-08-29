import express from 'express';
import Arca from '../classes/Arca.js';

const router = express.Router();

/**
 * Retrieves human IDs for documents
 * Example: CUIT, CUIL, CDI, LE, LC, etc.
 */
router.get('/', async (req, res) => {
    const arca = new Arca();
    const result = await arca.ElectronicBilling.getDocumentTypes();
    res.send(result);
});

export default router;
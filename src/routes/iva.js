import express from "express";
import Arca from "../classes/Arca.js";

const router = express.Router();

router.get('/', async (req, res) => {
    const arca = new Arca();
    const result = await arca.ElectronicBilling.getAliquotTypes();
    res.send(result);
});

/**
 * Retrieves condition types for the voucher receiver
 * Example: IVA Responsable Inscripto, Responsable Monotributo, etc.
 */
router.get('/conditionTypes', async (req, res) => {
    const arca = new Arca();
    const result =  await arca.ElectronicBilling.executeRequest('FEParamGetCondicionIvaReceptor')
    res.send(result);
});

export default router;
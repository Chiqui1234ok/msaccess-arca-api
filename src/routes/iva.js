import express from "express";
import Arca from "../classes/Arca.js";
import Aliquots from "../classes/Aliquots.js";

const router = express.Router();

/**
 * Retrieve tax aliquot types
 * Example: 21%, 10.5%, Exento, etc. (Without '%')
 * If no aliquots are found in the database, it fetches them from ARCA and stores them.
 */
router.get('/', async (req, res) => {
    try {
        const result = await Aliquots.get();
        res.send(result);
    } catch (error) {
        console.error(error);
        return res.status(500).send({ msg: 'No se pudieron devolver los tipos de alicuotas' });
    }
});

/**
 * Retrieves condition types for the voucher receiver
 * Example: IVA Responsable Inscripto, Responsable Monotributo, etc.
 */
router.get('/conditionTypes', async (req, res) => {
    const arca = new Arca();
    let result =  await arca.ElectronicBilling.executeRequest('FEParamGetCondicionIvaReceptor');
    result = result.ResultGet.CondicionIvaReceptor ? result.ResultGet.CondicionIvaReceptor : {};
    res.send(result);
});

export default router;
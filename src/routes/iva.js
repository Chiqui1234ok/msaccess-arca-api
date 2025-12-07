import express from "express";
import IvaAliquots from "../classes/IvaAliquots.js";
import IvaConditionTypes from "../classes/IvaConditionTypes.js";

const router = express.Router();

/**
 * Retrieve tax aliquot types
 * Example: 21%, 10.5%, Exento, etc. (Without '%')
 * If no aliquots are found in the database, it fetches them from ARCA and stores them.
 */
router.get('/iva', async (req, res) => {
    try {
        const result = await IvaAliquots.get();
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
router.get('/iva/conditionTypes', async (req, res) => {
    let result = await IvaConditionTypes.get();
    res.send(result);
});

export default router;
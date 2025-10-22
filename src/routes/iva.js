import express from "express";
import Arca from "../classes/Arca.js";
import Aliquot from "../models/Aliquots.js";

const router = express.Router();

/**
 * Retrieve tax aliquot types
 * Example: 21%, 10.5%, Exento, etc.
 * If no aliquots are found in the database, it fetches them from ARCA and stores them.
 */
router.get('/', async (req, res) => {
    try {
        const arca = new Arca();
        let result = await Aliquot.find();
        // Fetch from ARCA if not found in DB, then, save it in the DB
        if(result.length === 0) {
            result = await arca.ElectronicBilling.getAliquotTypes();
            result = result.map(i => {
                const parsedDesc = String(i.Desc).replace('%', '').trim();
                return {
                    ...i,
                    Id: parseInt(i.Id),
                    Desc: parseFloat(parsedDesc)
                };
            });
            await Aliquot.deleteMany({}); // Clear previous entries (could be garbage data)
            result = await Aliquot.insertMany(result);
        }
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
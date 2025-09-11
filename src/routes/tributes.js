import express from "express";
import Arca from "../classes/Arca.js";

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const arca = new Arca();
        const result = await arca.ElectronicBilling.getTaxTypes();
        res.send(result);
    } catch (error) {
        console.error(error);
        res.status(500).send({ msg: 'No se pudieron devolver los tipos de tributos' });
    }
});

export default router;
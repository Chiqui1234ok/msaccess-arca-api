import express from "express";
import Arca from "../classes/Arca.js";
import Tributes from "../models/Tributes.js";

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const arca = new Arca();
        let result = await Tributes.find();
        if(result.length === 0) {
            result = await arca.ElectronicBilling.getTaxTypes();
            await Tributes.deleteMany({}); // Clear previous entries (could be garbage data)
            result = await Tributes.insertMany(result);
        }
        res.send(result);
    } catch (error) {
        console.error(error);
        return res.status(500).send({ msg: 'No se pudieron devolver los tipos de tributos' });
    }
});

export default router;
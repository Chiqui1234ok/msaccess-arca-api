import AliquotsSchema from "../models/Aliquots.js";
import Arca from "./Arca.js";

class Aliquots {
    constructor() {

    }

    /**
     * @returns Aliquots from database or ARCA
     */
    static async get() {
        let result = await AliquotsSchema.find();

        // Returns DB if we have anything
        if(result.length > 0) return result;

        // Otherwise, we need to fetch this data from ARCA        
        return await Aliquots.getFromArca();
    }

    /**
     * Fetch ARCA's aliquots and saves it in database
     *
     * @returns {Promise<Array>} ARCA's aliquots
     */
    static async getFromArca() {
        const arca = new Arca();
        result = await arca.ElectronicBilling.getAliquotTypes();
        result = result.map(i => {
            const parsedDesc = String(i.Desc).replace('%', '').trim();
            return {
                ...i,
                Id: parseInt(i.Id),
                Desc: parseFloat(parsedDesc)
            };
        });
        await AliquotsSchema.deleteMany({}); // Clear previous entries (could be garbage data)
        result = await AliquotsSchema.insertMany(result);

        return result;
    }
}

export default Aliquots;